import englishSyllables from '../../resources/cmudict-syllables.json';
import spanishSyllables from '../../resources/pylabeador-syllables.json';

// Workers Free allows at most 50 external subrequests. Leave a margin so that
// redirects and platform behaviour cannot turn an ordinary scan into a quota error.
const LIMITS = Object.freeze({
  externalRequests: 3,
  sitemapRequests: 0,
  maxCandidates: 1,
  maxPages: 1,
  // Workers Free only has 10 ms of CPU per request. A partial first document
  // slice keeps a live analysis useful without allowing one page to abort it.
  maxHtmlChars: 200_000,
  fetchTimeoutMs: 9_000,
});

const englishDictionary = englishSyllables.entries;
const spanishDictionary = spanishSyllables.entries;
const englishCache = new Map();
const spanishCache = new Map();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/analyze' && request.method === 'POST') {
      try {
        const body = await request.json();
        const result = await analyze(body);
        return json(result);
      } catch (error) {
        return json({ error: readableError(error) }, error?.statusCode || 500);
      }
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'Not found.' }, 404);
    return env.ASSETS.fetch(request);
  },
};

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

class RequestBudget {
  constructor() { this.used = 0; }
  async text(url, accept = 'text/html,application/xhtml+xml', offset = 0) {
    if (this.used >= LIMITS.externalRequests) throw limitError();
    this.used += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LIMITS.fetchTimeoutMs);
    try {
      const response = await fetch(url, {
        redirect: 'follow', signal: controller.signal,
        headers: { accept, range: `bytes=${offset}-${offset + LIMITS.maxHtmlChars - 1}`, 'user-agent': 'WebReadabilityRadar/1.0 (+privacy-preserving analysis)' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const length = Number(response.headers.get('content-length'));
      if (Number.isFinite(length) && length > LIMITS.maxHtmlChars) throw new Error('PAGE_HTML_TOO_LARGE');
      const text = await response.text();
      if (text.length > LIMITS.maxHtmlChars) throw new Error('PAGE_HTML_TOO_LARGE');
      return text;
    } finally { clearTimeout(timer); controller.abort(); }
  }
}

async function analyze(body) {
  const language = body.language === 'en' ? 'en' : 'es';
  const scope = body.scope === 'page' ? 'page' : 'domain';
  const estimateOnly = Boolean(body.estimateOnly);
  if (body.htmlInput) throw inputError(language === 'en'
    ? 'Local HTML is available only in the local edition.'
    : 'El HTML local solo está disponible en la edición local.');

  const inputs = parseUrlList(body.input);
  const exactUrls = parseUrlList(body.exactUrls);
  if (!inputs.length) throw inputError(language === 'en' ? 'Enter at least one URL.' : 'Introduce al menos una URL.');
  inputs.forEach(assertPublicHttpUrl);
  exactUrls.forEach(assertPublicHttpUrl);

  const requestedPages = body.maxPages === 'all' ? LIMITS.maxPages : boundedInteger(body.maxPages, 12, 1, LIMITS.maxPages);
  const minWords = boundedInteger(body.minWords, 80, 20, 2000);
  const minFragmentWords = boundedInteger(body.minFragmentWords, 30, 10, 250);
  const budget = new RequestBudget();
  const discovery = scope === 'domain'
    ? await discoverDomains(inputs, exactUrls, language, Boolean(body.includeRelatedSubdomains), budget)
    : { candidates: inputs.map(url => candidate(url, language, 'selected', 0, true)), domains: [] };
  const candidates = uniqueByUrl(discovery.candidates).slice(0, LIMITS.maxCandidates);
  const selected = selectCandidates(candidates, requestedPages, body.samplingMode === 'random');
  const pages = estimateOnly ? [] : await analyzeSelected(selected, language, minWords, minFragmentWords, budget);
  const allFragments = pages.flatMap(page => page.fragments.map((fragment, index) => ({
    ...fragment, fragmentId: hashId(`${page.url}:${index}:${fragment.text}`), index: fragment.sourceIndex,
    pageTitle: page.title, pageUrl: page.url, link: page.url,
  })));
  const fragments = body.fragmentLimit === 'top10'
    ? allFragments.sort(compareDifficulty).slice(0, 10)
    : allFragments.sort(compareDifficulty);
  const analyzed = pages.filter(page => page.status === 'analyzed');
  const averageScore = analyzed.length ? round1(analyzed.reduce((sum, page) => sum + page.rawScore, 0) / analyzed.length) : null;
  const coverage = {
    platform: 'cloudflare_workers_free',
    externalRequestsUsed: budget.used,
    externalRequestLimit: LIMITS.externalRequests,
    maxCandidates: LIMITS.maxCandidates,
    maxPages: LIMITS.maxPages,
    partial: budget.used >= LIMITS.externalRequests || candidates.length >= LIMITS.maxCandidates,
  };

  return {
    generatedAt: new Date().toISOString(), language, scope, estimateOnly,
    localSourceText: null,
    metric: language === 'en' ? 'Flesch Reading Ease' : 'Szigriszt-Pazos / INFLESZ',
    summary: {
      candidates: candidates.length,
      eligibleCandidates: candidates.filter(item => item.eligible !== false).length,
      excludedCandidates: candidates.filter(item => item.eligible === false).length,
      languageExcludedPages: pages.filter(page => page.exclusionCategory === 'language').length,
      duplicateContentPages: pages.filter(page => page.status === 'duplicate').length,
      selected: selected.length, analyzed: analyzed.length, fragments: fragments.length,
      totalFragmentsDetected: allFragments.length, averageScore,
      averageLevel: averageScore === null ? '-' : levelForScore(averageScore, language),
    },
    domains: scope === 'domain'
      ? summarizeDomains(discovery.domains, candidates, selected, pages, language)
      : summarizeExactDomains(inputs, candidates, selected, pages),
    samplingFrame: candidates.map(item => {
      const selectedItem = selected.find(value => value.url === item.url);
      const page = pages.find(value => value.url === item.url);
      return { ...item, pageId: hashId(item.url), selected: Boolean(selectedItem), status: page?.status || '',
        statusLabel: page?.statusLabel || '-', words: page?.words ?? null,
        score: page?.status === 'analyzed' ? page.score : null, level: page?.level ?? null };
    }),
    criteria: {
      maxPages: requestedPages, analysisTimeLimitReached: false, analysisTimeBudgetMs: null,
      samplingMode: body.samplingMode === 'random' ? 'random_pages' : 'all_selected_pages',
      samplingSeed: null, fragmentSelection: body.fragmentLimit === 'top10' ? 'hardest_from_selected_pages' : 'all_eligible',
      eligibleFragmentCount: allFragments.length, selectedFragmentIds: fragments.map(item => item.fragmentId),
      categories: classificationRules(language), processingRules: language === 'es' ? 'inflesz-documented-v1' : 'english-v1',
      selectedPageCount: selected.length, minWords, minFragmentWords,
      metric: language === 'en' ? 'Flesch Reading Ease' : 'Szigriszt-Pazos / INFLESZ',
      scope, includeRelatedSubdomains: Boolean(body.includeRelatedSubdomains), coverage,
    }, pages, fragments,
  };
}

async function discoverDomains(inputs, exactUrls, language, includeSubdomains, budget) {
  const allCandidates = [], domains = [];
  for (const input of inputs) {
    const start = new URL(input);
    const scope = domainScope(start, includeSubdomains);
    const items = new Map();
    const add = (url, source, depth = 0, mandatory = false) => {
      try {
        const normalized = canonicalUrl(url);
        if (!scope.includes(normalized)) return;
        const existing = items.get(normalized.href);
        if (existing) { existing.mandatory ||= mandatory; return; }
        items.set(normalized.href, candidate(normalized.href, language, source, depth, mandatory));
      } catch { /* invalid discovered URL */ }
    };
    add(start.href, 'initial', 0, true);
    exactUrls.forEach(url => add(url, 'required', 0, true));
    const candidates = [...items.values()].slice(0, LIMITS.maxCandidates);
    allCandidates.push(...candidates);
    domains.push({ key: start.href, domain: start.host, startUrl: start.href, includeRelatedSubdomains: includeSubdomains,
      robotsAvailable: false, robotsBlocked: 0, sitemapUrlsChecked: 0,
      sitemapLinks: candidates.filter(item => item.source === label(language, 'sitemap')).length, crawledPages: 1,
      crawlErrors: 0, depthReached: candidates.some(item => item.depth) ? 1 : 0,
      partialReasons: candidates.length >= LIMITS.maxCandidates ? ['free_request_limit'] : [], sections: [] });
  }
  return { candidates: allCandidates, domains };
}

async function analyzeSelected(selected, language, minWords, minFragmentWords, budget) {
  const pages = [], seenContent = new Map();
  for (const item of selected) {
    if (budget.used >= LIMITS.externalRequests) { pages.push(pendingPage(item, language)); continue; }
    const page = await analyzePage(item, language, minWords, minFragmentWords, budget);
    if (page.status === 'analyzed' && page.contentFingerprint) {
      const original = seenContent.get(page.contentFingerprint);
      if (original) {
        page.status = 'duplicate'; page.statusLabel = language === 'en' ? 'duplicate content' : 'contenido duplicado';
        page.reason = language === 'en' ? `Excluded from metrics because its extracted text is identical to ${original.pageId}.` : `Excluida de las métricas porque su texto extraído es idéntico al de ${original.pageId}.`;
        page.duplicateOf = original.pageId; page.fragments = []; page.score = null; page.rawScore = null; page.level = '-';
      } else seenContent.set(page.contentFingerprint, page);
    }
    delete page.contentFingerprint;
    pages.push(page);
  }
  return pages;
}

async function analyzePage(item, language, minWords, minFragmentWords, budget) {
  try {
    let html = await budget.text(item.url);
    let document = parseHtmlDocument(html);
    let pageText = extractVisibleText(document);
    // Certain sites put several hundred KB of styles and scripts before body.
    // A second bounded slice recovers their visible content without full download.
    if (textStats(pageText, language).words < minWords && budget.used < LIMITS.externalRequests) {
      const bodySlice = await budget.text(item.url, 'text/html,application/xhtml+xml', 700_000);
      const bodyDocument = parseHtmlDocument(bodySlice);
      const bodyText = extractVisibleText(bodyDocument);
      if (textStats(bodyText, language).words > textStats(pageText, language).words) {
        html = bodySlice;
        document = bodyDocument;
        pageText = bodyText;
      }
    }
    const title = extractTitle(document) || item.url;
    const stats = textStats(pageText, language);
    const declared = html.match(/<html\b[^>]*\blang\s*=\s*["']([a-z]{2})/i)?.[1]?.toLowerCase();
    const pageLanguage = detectLanguage(pageText, declared);
    const blocks = extractTextBlocks(document).map((text, index) => ({ text, sourceIndex: index + 1, language: detectLanguage(text, declared), stats: textStats(text, language) }));
    const fragments = deduplicate(blocks.filter(block => block.language === language && block.stats.words >= minFragmentWords).map(block => ({
      text: block.text, sourceIndex: block.sourceIndex, language, ...block.stats,
      rawScore: readabilityScore(block.stats, language), score: round1(readabilityScore(block.stats, language)),
      level: levelForScore(readabilityScore(block.stats, language), language),
    })));
    const extraction = { blocksDetected: blocks.length, languageExcluded: blocks.filter(block => block.language !== language).length,
      lengthExcluded: blocks.filter(block => block.language === language && block.stats.words < minFragmentWords).length,
      eligible: fragments.length, duplicateParagraphsExcluded: 0, declaredLanguage: declared || null, detectedPageLanguage: pageLanguage };
    if (!fragments.length && pageLanguage !== language) return { ...pageBase(item, title), status: 'discarded', statusLabel: language === 'en' ? 'discarded' : 'descartada', exclusionCategory: 'language',
      reason: language === 'en' ? `Text language (${pageLanguage}) does not match the selected language.` : `El idioma del texto (${pageLanguage}) no coincide con el idioma seleccionado.`, ...stats, score: null, level: '-', fragments, extraction };
    const rawScore = readabilityScore(stats, language);
    return { ...pageBase(item, title), status: 'analyzed', statusLabel: language === 'en' ? 'analyzed' : 'analizada', reason: stats.words < minWords ? shortReason(language, stats.words) : '',
      ...stats, score: round1(rawScore), rawScore, fullTextScore: round1(rawScore), level: levelForScore(rawScore, language), scoreBasis: 'full_page_text', contentFingerprint: hashId(normalizeText(pageText)), extraction, fragments };
  } catch (error) {
    return { ...pageBase(item, item.url), status: 'error', statusLabel: 'error', reason: readableError(error, language), words: 0, sentences: 0, syllables: 0, score: 0, level: '-', fragments: [] };
  }
}

function pageBase(item, title) { return { ...item, pageId: hashId(item.url), title }; }
function pendingPage(item, language) { return { ...pageBase(item, item.url), status: 'pending', statusLabel: language === 'en' ? 'pending free limit' : 'pendiente por límite gratuito', reason: language === 'en' ? 'Not analyzed before the free request limit was reached.' : 'No se analizó antes de alcanzar el límite gratuito de solicitudes.', words: 0, sentences: 0, syllables: 0, score: null, level: '-', fragments: [] }; }

function candidate(url, language, source, depth, mandatory) { return { url, source: label(language, source), discoverySources: [label(language, source)], selectionReason: reason(language, source), mandatory, eligible: true, exclusionReason: '', section: sectionForUrl(new URL(url)), depth, domainKey: new URL(url).origin }; }
function label(language, key) { return ({ es: { initial: 'dominio inicial', required: 'página obligatoria', sitemap: 'mapa del sitio', crawl: 'enlace interno', selected: 'página indicada' }, en: { initial: 'initial domain', required: 'required page', sitemap: 'sitemap', crawl: 'internal link', selected: 'selected page' } })[language][key]; }
function reason(language, key) { const values = language === 'en' ? { initial: 'Included as the starting page.', required: 'Included because the user marked it as required.', sitemap: 'Included because it appears in a detected sitemap.', crawl: 'Discovered by following an internal link.', selected: 'Included because it was entered by the user.' } : { initial: 'Incluida como página inicial.', required: 'Incluida porque la indicó el usuario.', sitemap: 'Incluida porque aparece en un sitemap detectado.', crawl: 'Detectada al seguir un enlace interno.', selected: 'Incluida porque la indicó el usuario.' }; return values[key]; }

function selectCandidates(candidates, maxPages, random) {
  const mandatory = candidates.filter(item => item.eligible && item.mandatory);
  const rest = candidates.filter(item => item.eligible && !item.mandatory);
  const pool = random ? shuffle(rest) : rest;
  return mandatory.concat(pool).slice(0, maxPages).map(item => ({ ...item, selectionMethod: item.mandatory ? 'mandatory' : random ? 'random' : 'all_eligible' }));
}
function summarizeDomains(domains, candidates, selected, pages, language) { return domains.map(domain => {
  const listed = candidates.filter(item => item.domainKey === new URL(domain.startUrl).origin);
  const chosen = selected.filter(item => item.domainKey === new URL(domain.startUrl).origin);
  const ids = new Set(chosen.map(item => item.url)); const domainPages = pages.filter(page => ids.has(page.url));
  return { ...domain, candidatesDetected: listed.length, eligibleCandidates: listed.length, excludedCandidates: 0, selectedPages: chosen.length,
    analyzedPages: domainPages.filter(page => page.status === 'analyzed').length, languageExcludedPages: domainPages.filter(page => page.exclusionCategory === 'language').length,
    duplicateContentPages: domainPages.filter(page => page.status === 'duplicate').length, selectionMode: language === 'en' ? 'All eligible discovered pages within the free request budget' : 'Todas las páginas elegibles detectadas dentro del presupuesto gratuito de solicitudes' };
}); }
function summarizeExactDomains(inputs, candidates, selected, pages) { return inputs.map(input => ({ domain: new URL(input).host, startUrl: input, candidatesDetected: candidates.length, selectedPages: selected.length, analyzedPages: pages.filter(page => page.status === 'analyzed').length, languageExcludedPages: pages.filter(page => page.exclusionCategory === 'language').length, selectionMode: 'Exact URL selected by the user' })); }

function parseUrlList(value) { return String(value || '').split(/[\r\n,]+/).map(item => item.trim()).filter(Boolean).map(item => /^https?:\/\//i.test(item) ? item : `https://${item}`).map(item => canonicalUrl(item).href); }
function assertPublicHttpUrl(value) { const url = new URL(value); if (!['http:', 'https:'].includes(url.protocol) || isPrivateHost(url.hostname)) throw inputError('The address is not allowed for online analysis.'); }
function isPrivateHost(host) { const lower = host.toLowerCase(); return lower === 'localhost' || lower.endsWith('.local') || lower === '::1' || /^127\./.test(lower) || /^10\./.test(lower) || /^192\.168\./.test(lower) || /^169\.254\./.test(lower) || /^172\.(1[6-9]|2\d|3[01])\./.test(lower); }
function inputError(message) { const error = new Error(message); error.statusCode = 400; return error; }
function limitError() { const error = new Error('FREE_REQUEST_LIMIT'); error.statusCode = 429; return error; }
function canonicalUrl(value) { const url = new URL(value); url.hash = ''; for (const key of [...url.searchParams.keys()]) if (/^(utm_[a-z]+|fbclid|gclid|mc_[a-z]+)$/i.test(key)) url.searchParams.delete(key); url.searchParams.sort(); return url; }
function domainScope(start, includeSubdomains) { const base = registrableDomain(start.hostname); return { includes(url) { return url.hostname === start.hostname || (includeSubdomains && (url.hostname === base || url.hostname.endsWith(`.${base}`))); } }; }
function registrableDomain(host) { const parts = host.split('.'); const suffix = parts.slice(-2).join('.'); return ['co.uk', 'ac.uk', 'com.au', 'com.br', 'co.nz'].includes(suffix) && parts.length > 2 ? parts.slice(-3).join('.') : suffix; }
function sectionForUrl(url) { return url.pathname.split('/').filter(Boolean)[0] ? `/${url.pathname.split('/').filter(Boolean)[0]}/` : '/'; }
function sitemapLocations(value) { return [...String(value).matchAll(/<(?:loc|sitemap)>?\s*([^<]+?)\s*<\/loc>/gi)].map(match => decodeEntities(match[1]).trim()).filter(item => /^https?:\/\//i.test(item)); }
function extractLinks(html, base) { return [...String(html).matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map(match => { try { return new URL(decodeEntities(match[1]), base).href; } catch { return ''; } }).filter(Boolean); }

function parseHtmlDocument(html) { const root = { tag: '#document', children: [] }, stack = [root], voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr']), rawTags = new Set(['script','style','noscript','svg','template']); let index = 0; const append = text => { if (text) stack.at(-1).children.push({ text }); }; while (index < html.length) { if (html.startsWith('<!--', index)) { const end = html.indexOf('-->', index + 4); index = end < 0 ? html.length : end + 3; continue; } if (html[index] !== '<') { const end = html.indexOf('<', index); append(html.slice(index, end < 0 ? html.length : end)); index = end < 0 ? html.length : end; continue; } let end = index + 1, quote = ''; while (end < html.length) { const char = html[end]; if (quote) { if (char === quote) quote = ''; } else if (char === '"' || char === "'") quote = char; else if (char === '>') break; end++; } if (end >= html.length) break; const token = html.slice(index + 1, end).trim(); index = end + 1; if (!token || token.startsWith('!') || token.startsWith('?')) continue; if (token.startsWith('/')) { const tag = token.slice(1).trim().toLowerCase(); for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === tag) { stack.length = i; break; } continue; } const tag = token.split(/[\s/>]/, 1)[0].toLowerCase(); if (!tag) continue; const node = { tag, children: [] }; stack.at(-1).children.push(node); if (rawTags.has(tag)) { const close = html.toLowerCase().indexOf(`</${tag}`, index); index = close < 0 ? html.length : html.indexOf('>', close) + 1; continue; } if (!voidTags.has(tag) && !token.endsWith('/')) stack.push(node); } return root; }
function nodeText(node, excluded = false) { if (node.text !== undefined) return excluded ? '' : decodeEntities(node.text); const blocked = excluded || new Set(['script','style','noscript','svg','template','nav','footer','aside','form','dialog']).has(node.tag); return (node.children || []).map(child => nodeText(child, blocked)).join(' '); }
function nodes(root, tag) { const found = []; const visit = (node, hidden = false) => { if (!node.tag) return; const blocked = hidden || new Set(['script','style','noscript','svg','template','nav','footer','aside','form','dialog']).has(node.tag); if (node.tag === tag && !blocked) found.push(node); (node.children || []).forEach(child => visit(child, blocked)); }; visit(root); return found; }
function cleanText(text) { return decodeEntities(text).replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim(); }
function extractTitle(document) { const node = nodes(document, 'title')[0]; return node ? cleanText(nodeText(node)).slice(0, 160) : ''; }
function extractVisibleText(document) { return cleanText(nodeText(document)); }
function extractTextBlocks(document) { return nodes(document, 'p').map(node => cleanText(nodeText(node))).filter(Boolean); }
function decodeEntities(text) { const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ' }; return String(text).replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value))).replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(parseInt(value, 16))).replace(/&([a-z]+);/gi, (full, name) => named[name.toLowerCase()] || full); }

function textStats(text, language) { if (language === 'en') { const words = String(text).match(/(?:[A-Za-z](?:\.[A-Za-z])+(?:\.)?|[A-Za-z]+(?:['’\-][A-Za-z]+)*|\d+(?:[.,]\d+)*)/g) || []; return { words: words.length, sentences: Math.max(1, (String(text).match(/[.!?]+(\s|$)/g) || []).length), syllables: words.reduce((sum, word) => sum + englishSyllableCount(word), 0) }; } const words = String(text).normalize('NFC').match(/\p{L}+(?:[-']\p{L}+)*|\p{N}+(?:[.,]\p{N}+)*|[\p{Sc}\p{Sm}%@#&]/gu) || []; return { words: words.length, sentences: Math.max(1, String(text).split(/[.;:¿?¡!—]+/u).filter(item => /\p{L}|\p{N}/u.test(item)).length), syllables: words.reduce((sum, word) => sum + spanishSyllableCount(word), 0) }; }
function englishSyllableCount(word) { const normalized = String(word).toLowerCase().replace(/[’]/g, "'").replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, ''); if (!normalized) return 0; if (englishCache.has(normalized)) return englishCache.get(normalized); let count = englishDictionary[normalized]?.[0] ?? englishDictionary[normalized.replace(/'s$/, '')]?.[0]; if (!count) { if (/^\d+(?:[.,]\d+)*$/.test(normalized)) count = 1; else if (normalized.includes('-')) count = normalized.split('-').reduce((sum, part) => sum + englishSyllableCount(part), 0); else { let token = normalized.replace(/'s$|s'$/g, ''); count = (token.match(/[aeiouy]+/g) || []).length; if (/e$/.test(token) && !/[^aeiou]le$/.test(token)) count--; count = Math.max(1, count); } } englishCache.set(normalized, count); return count; }
function spanishSyllableCount(word) { const normalized = String(word).toLowerCase().replace(/[^a-záéíóúüñ'-]/g, ''); if (!normalized) return 0; if (spanishCache.has(normalized)) return spanishCache.get(normalized); let count = spanishDictionary[normalized]; if (!count) { const parts = normalized.split(/[-']/); count = parts.reduce((total, part) => total + Math.max(1, (part.replace(/([qg])u(?=[eéií])/g, '$1').match(/[aeiouáéíóúü](?:h?[aeiouáéíóúü])*/g) || []).length), 0); } spanishCache.set(normalized, count); return count; }
function readabilityScore(stats, language) { if (!stats.words || !stats.sentences) return 0; return Math.min(100, language === 'en' ? 206.835 - 1.015 * (stats.words / stats.sentences) - 84.6 * (stats.syllables / stats.words) : 206.835 - 62.3 * (stats.syllables / stats.words) - (stats.words / stats.sentences)); }
function classificationRules(language) { return language === 'en' ? [[90,'Very easy','green'],[80,'Easy','green'],[70,'Fairly easy','lime'],[60,'Plain English','amber'],[50,'Fairly difficult','orange'],[30,'Difficult','red'],[null,'Very difficult','red']].map(([minimum,label,color]) => ({ minimum, label, color })) : [[80,'Muy fácil','green'],[65,'Bastante fácil','lime'],[55,'Normal','amber'],[40,'Algo difícil','orange'],[null,'Muy difícil','red']].map(([minimum,label,color]) => ({ minimum, label, color })); }
function levelForScore(score, language) { return classificationRules(language).find(rule => rule.minimum === null || score >= rule.minimum).label; }
function detectLanguage(text, declared) { const words = String(text).toLowerCase(); const english = (words.match(/\b(the|and|of|to|with|this|that|research|university|students)\b/g) || []).length; const spanish = (words.match(/\b(el|la|los|las|que|para|con|una|universidad|estudiantes)\b/g) || []).length + (/[áéíóúñ¿¡]/i.test(text) ? 2 : 0); if (english === spanish) return declared || 'unknown'; return english > spanish ? 'en' : 'es'; }
function deduplicate(items) { const seen = new Set(); return items.filter(item => { const key = normalizeText(item.text); if (seen.has(key)) return false; seen.add(key); return true; }); }
function normalizeText(value) { return String(value).normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase(); }
function compareDifficulty(a, b) { return (a.rawScore ?? a.score) - (b.rawScore ?? b.score) || b.words - a.words; }
function hashId(value) { let hash = 2166136261; for (const char of String(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619); return `C-${(hash >>> 0).toString(36).toUpperCase()}`; }
function round1(value) { return Math.round(value * 10) / 10; }
function boundedInteger(value, fallback, min, max) { const number = value === undefined || value === '' ? fallback : Number(value); if (!Number.isInteger(number) || number < min || number > max) throw inputError(`${min}-${max}`); return number; }
function unique(items) { return [...new Set(items)]; }
function uniqueByUrl(items) { return [...new Map(items.map(item => [item.url, item])).values()]; }
function shuffle(items) { const copy = [...items]; for (let index = copy.length - 1; index > 0; index--) { const target = Math.floor(Math.random() * (index + 1)); [copy[index], copy[target]] = [copy[target], copy[index]]; } return copy; }
function shortReason(language, words) { return language === 'en' ? `Short page: ${words} words. Metrics are shown, but interpret them with caution.` : `Página breve: ${words} palabras. Se muestran métricas, pero conviene interpretarlas con cautela.`; }
function readableError(error, language = 'en') { const message = error instanceof Error ? error.message : String(error); if (message === 'FREE_REQUEST_LIMIT') return language === 'es' ? 'Se alcanzó el límite gratuito de solicitudes. Se muestran los resultados obtenidos hasta ese punto.' : 'The free request limit was reached. Results obtained up to that point are shown.'; if (message === 'PAGE_HTML_TOO_LARGE') return language === 'es' ? 'La página supera el tamaño admitido por la edición online.' : 'The page exceeds the online edition size limit.'; if (message === 'This operation was aborted') return language === 'es' ? 'La página tardó demasiado en responder.' : 'The page took too long to respond.'; return message || 'Unexpected error.'; }
