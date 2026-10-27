// Browser-side engine for the no-cost public edition. It intentionally keeps
// text, scores, charts and report generation on the visitor's device.
const MAX_PAGES = 30;
const MAX_CANDIDATES = 30;
const dictionaries = new Map();

export async function analyzeOnline(input, progress = () => {}) {
  const language = input.language === 'en' ? 'en' : 'es';
  const scope = input.scope === 'page' ? 'page' : 'domain';
  const minWords = bounded(input.minWords, 80, 20, 2000);
  const minFragmentWords = bounded(input.minFragmentWords, 30, 10, 250);
  const dictionary = await loadDictionary(language);
  const inputUrls = parseUrlList(input.input);
  const exactUrls = parseUrlList(input.exactUrls);
  if (!inputUrls.length && !input.htmlInput) throw new Error(language === 'es' ? 'Introduce al menos una URL.' : 'Enter at least one URL.');

  let candidates;
  let domains = [];
  if (input.htmlInput) {
    candidates = [{ url: 'local-html://uploaded-file', source: sourceLabel('local', language), discoverySources: [sourceLabel('local', language)], mandatory: true, depth: 0, section: '/', domainKey: 'local-html://' }];
  } else if (scope === 'page') {
    candidates = inputUrls.map(url => candidate(url, 'selected', language, 0, true));
  } else {
    progress('discovery');
    const discovery = await discover(inputUrls, exactUrls, language, Boolean(input.includeRelatedSubdomains), progress);
    candidates = discovery.candidates;
    domains = discovery.domains;
  }
  const requested = input.maxPages === 'all' ? MAX_PAGES : bounded(input.maxPages, 12, 1, MAX_PAGES);
  const selected = selectCandidates(candidates, requested, input.samplingMode === 'random');
  if (input.estimateOnly) return makeResult({ language, scope, candidates, selected, pages: [], domains, input, dictionary, minWords, minFragmentWords });

  const pages = [];
  const seen = new Map();
  for (let index = 0; index < selected.length; index += 1) {
    progress('analysis', index, selected.length);
    const item = selected[index];
    const page = await analyzePage(item, language, minWords, minFragmentWords, dictionary, input.htmlInput);
    if (page.status === 'analyzed') {
      const duplicate = seen.get(page.contentFingerprint);
      if (duplicate) {
        page.status = 'duplicate';
        page.statusLabel = language === 'es' ? 'contenido duplicado' : 'duplicate content';
        page.reason = language === 'es' ? `Excluida de las métricas porque su texto extraído es idéntico al de ${duplicate.pageId}.` : `Excluded from metrics because its extracted text is identical to ${duplicate.pageId}.`;
        page.duplicateOf = duplicate.pageId; page.fragments = []; page.score = null; page.rawScore = null; page.level = '-';
      } else seen.set(page.contentFingerprint, page);
    }
    delete page.contentFingerprint;
    pages.push(page);
  }
  return makeResult({ language, scope, candidates, selected, pages, domains, input, dictionary, minWords, minFragmentWords });
}

async function loadDictionary(language) {
  if (!dictionaries.has(language)) {
    const response = await fetch(`/api/dictionary?language=${language}`, { cache: 'force-cache' });
    if (!response.ok) throw new Error(language === 'es' ? 'No se pudo cargar el diccionario de sílabas.' : 'The syllable dictionary could not be loaded.');
    dictionaries.set(language, await response.json());
  }
  return dictionaries.get(language);
}

async function discover(inputs, exactUrls, language, includeSubdomains, progress) {
  const all = new Map();
  const domains = [];
  for (const initial of inputs) {
    const start = new URL(initial);
    const includes = inScope(start, includeSubdomains);
    const add = (url, source, depth = 0, mandatory = false) => {
      try {
        const canonical = canonicalUrl(url);
        if (!includes(canonical) || all.has(canonical.href) || all.size >= MAX_CANDIDATES) return;
        all.set(canonical.href, candidate(canonical.href, source, language, depth, mandatory));
      } catch { /* Ignore malformed links. */ }
    };
    add(start.href, 'initial', 0, true);
    exactUrls.forEach(url => add(url, 'required', 0, true));
    try {
      const first = await getHtml(start.href);
      const document = new DOMParser().parseFromString(first.html, 'text/html');
      for (const link of document.links) add(link.href, 'crawl', 1, false);
    } catch { /* The mandatory URL is retained and will show an error later. */ }
    domains.push({ key: start.href, domain: start.host, startUrl: start.href, includeRelatedSubdomains: includeSubdomains,
      robotsAvailable: false, robotsBlocked: 0, sitemapUrlsChecked: 0, sitemapLinks: 0, crawledPages: 1,
      crawlErrors: 0, depthReached: 1, partialReasons: ['browser_client_page_limit'], sections: [] });
    progress('discovery');
  }
  return { candidates: [...all.values()], domains };
}

async function analyzePage(item, language, minWords, minFragmentWords, dictionary, localHtml) {
  try {
    const fetched = item.url.startsWith('local-html://') ? { url: item.url, html: localHtml, rendering: 'local' } : await getHtml(item.url);
    const document = new DOMParser().parseFromString(fetched.html, 'text/html');
    const title = clean(document.title || item.url).slice(0, 160) || item.url;
    const declared = document.documentElement.lang?.slice(0, 2).toLowerCase() || null;
    const text = extractVisibleText(document);
    const stats = textStats(text, language, dictionary);
    const detectedPageLanguage = detectLanguage(text, declared);
    const blocks = extractTextBlocks(document).map((block, index) => ({ text: block, sourceIndex: index + 1, language: detectLanguage(block, declared), stats: textStats(block, language, dictionary) }));
    const fragments = deduplicate(blocks.filter(block => block.language === language && block.stats.words >= minFragmentWords).map(block => ({
      text: block.text, sourceIndex: block.sourceIndex, language, ...block.stats,
      rawScore: readabilityScore(block.stats, language), score: round1(readabilityScore(block.stats, language)),
      level: levelForScore(readabilityScore(block.stats, language), language),
    })));
    const extraction = { blocksDetected: blocks.length, languageExcluded: blocks.filter(block => block.language !== language).length,
      lengthExcluded: blocks.filter(block => block.language === language && block.stats.words < minFragmentWords).length,
      eligible: fragments.length, duplicateParagraphsExcluded: 0, declaredLanguage: declared, detectedPageLanguage, rendering: fetched.rendering };
    if (!fragments.length && detectedPageLanguage !== language) return { ...pageBase(item, title), status: 'discarded', statusLabel: language === 'es' ? 'descartada' : 'discarded', exclusionCategory: 'language', reason: language === 'es' ? `El idioma del texto (${detectedPageLanguage}) no coincide con el idioma seleccionado.` : `Text language (${detectedPageLanguage}) does not match the selected language.`, ...stats, score: null, level: '-', fragments, extraction };
    const rawScore = readabilityScore(stats, language);
    return { ...pageBase(item, title), url: fetched.url, status: 'analyzed', statusLabel: language === 'es' ? 'analizada' : 'analyzed', reason: stats.words < minWords ? shortReason(language, stats.words) : '', ...stats, score: round1(rawScore), rawScore, fullTextScore: round1(rawScore), level: levelForScore(rawScore, language), scoreBasis: 'full_page_text', contentFingerprint: hashId(normalizeText(text)), extraction, fragments };
  } catch (error) {
    return { ...pageBase(item, item.url), status: 'error', statusLabel: 'error', reason: error?.message || String(error), words: 0, sentences: 0, syllables: 0, score: null, level: '-', fragments: [] };
  }
}

async function getHtml(url) {
  const response = await fetch('/api/fetch', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) });
  const result = await response.json();
  if (!response.ok || result.error) throw new Error(result.error || 'The page could not be retrieved.');
  return result;
}

function makeResult({ language, scope, candidates, selected, pages, domains, input, minWords, minFragmentWords }) {
  const allFragments = pages.flatMap(page => page.fragments.map((fragment, index) => ({ ...fragment, fragmentId: hashId(`${page.url}:${index}:${fragment.text}`), index: fragment.sourceIndex, pageTitle: page.title, pageUrl: page.url, link: page.url })));
  const fragments = input.fragmentLimit === 'top10' ? [...allFragments].sort(compareDifficulty).slice(0, 10) : [...allFragments].sort(compareDifficulty);
  const analyzed = pages.filter(page => page.status === 'analyzed');
  const averageScore = analyzed.length ? round1(analyzed.reduce((sum, page) => sum + page.rawScore, 0) / analyzed.length) : null;
  const coverage = { platform: 'browser_client_free', maxCandidates: MAX_CANDIDATES, maxPages: MAX_PAGES, partial: candidates.length >= MAX_CANDIDATES, rendering: 'static_html' };
  const renderedDomains = scope === 'domain' ? domains.map(domain => {
    const ids = new Set(selected.filter(item => item.domainKey === new URL(domain.startUrl).origin).map(item => item.url));
    const listed = candidates.filter(item => item.domainKey === new URL(domain.startUrl).origin);
    const rows = pages.filter(page => ids.has(page.url));
    return { ...domain, candidatesDetected: listed.length, eligibleCandidates: listed.length, excludedCandidates: 0, selectedPages: ids.size, analyzedPages: rows.filter(page => page.status === 'analyzed').length, languageExcludedPages: rows.filter(page => page.exclusionCategory === 'language').length, duplicateContentPages: rows.filter(page => page.status === 'duplicate').length, selectionMode: language === 'es' ? 'Páginas detectadas y procesadas en el navegador' : 'Pages detected and processed in the browser' };
  }) : candidates.map(item => ({ domain: new URL(item.url).host, startUrl: item.url, candidatesDetected: 1, selectedPages: 1, analyzedPages: pages.filter(page => page.status === 'analyzed').length, languageExcludedPages: pages.filter(page => page.exclusionCategory === 'language').length, selectionMode: 'Exact URL selected by the user' }));
  return { generatedAt: new Date().toISOString(), language, scope, estimateOnly: Boolean(input.estimateOnly), localSourceText: input.htmlInput || null, metric: language === 'en' ? 'Flesch Reading Ease' : 'Szigriszt-Pazos / INFLESZ', summary: { candidates: candidates.length, eligibleCandidates: candidates.length, excludedCandidates: 0, languageExcludedPages: pages.filter(page => page.exclusionCategory === 'language').length, duplicateContentPages: pages.filter(page => page.status === 'duplicate').length, selected: selected.length, analyzed: analyzed.length, fragments: fragments.length, totalFragmentsDetected: allFragments.length, averageScore, averageLevel: averageScore === null ? '-' : levelForScore(averageScore, language) }, domains: renderedDomains, samplingFrame: candidates.map(item => { const page = pages.find(value => value.pageId === hashId(item.url)); return { ...item, pageId: hashId(item.url), selected: selected.some(value => value.url === item.url), status: page?.status || '', statusLabel: page?.statusLabel || '-', words: page?.words ?? null, score: page?.status === 'analyzed' ? page.score : null, level: page?.level ?? null }; }), criteria: { maxPages: input.maxPages === 'all' ? MAX_PAGES : bounded(input.maxPages, 12, 1, MAX_PAGES), samplingMode: input.samplingMode === 'random' ? 'random_pages' : 'all_selected_pages', fragmentSelection: input.fragmentLimit === 'top10' ? 'hardest_from_selected_pages' : 'all_eligible', eligibleFragmentCount: allFragments.length, selectedFragmentIds: fragments.map(item => item.fragmentId), categories: classificationRules(language), processingRules: language === 'es' ? 'inflesz-documented-v1' : 'english-v1', selectedPageCount: selected.length, minWords, minFragmentWords, metric: language === 'en' ? 'Flesch Reading Ease' : 'Szigriszt-Pazos / INFLESZ', scope, includeRelatedSubdomains: Boolean(input.includeRelatedSubdomains), coverage }, pages, fragments };
}

function candidate(url, source, language, depth, mandatory) { const normalized = canonicalUrl(url); return { url: normalized.href, source: sourceLabel(source, language), discoverySources: [sourceLabel(source, language)], selectionReason: sourceReason(source, language), mandatory, eligible: true, exclusionReason: '', section: sectionForUrl(normalized), depth, domainKey: normalized.origin }; }
function sourceLabel(key, language) { return ({ es: { initial: 'dominio inicial', required: 'página obligatoria', crawl: 'enlace interno', selected: 'página indicada', local: 'archivo HTML local' }, en: { initial: 'initial domain', required: 'required page', crawl: 'internal link', selected: 'selected page', local: 'local HTML file' } })[language][key]; }
function sourceReason(key, language) { const values = language === 'es' ? { initial: 'Incluida como página inicial.', required: 'Incluida porque la indicó el usuario.', crawl: 'Detectada al seguir un enlace interno.', selected: 'Incluida porque la indicó el usuario.', local: 'Incluida desde el archivo local.' } : { initial: 'Included as the starting page.', required: 'Included because the user marked it as required.', crawl: 'Discovered by following an internal link.', selected: 'Included because it was entered by the user.', local: 'Included from the local file.' }; return values[key]; }
function pageBase(item, title) { return { ...item, pageId: hashId(item.url), title }; }
function parseUrlList(value) { return String(value || '').split(/[\r\n,]+/).map(item => item.trim()).filter(Boolean).map(item => /^https?:\/\//i.test(item) ? item : `https://${item}`).map(item => canonicalUrl(item).href); }
function canonicalUrl(value) { const url = new URL(value); url.hash = ''; for (const key of [...url.searchParams.keys()]) if (/^(utm_[a-z]+|fbclid|gclid|mc_[a-z]+)$/i.test(key)) url.searchParams.delete(key); url.searchParams.sort(); return url; }
function inScope(start, includeSubdomains) { const base = registrableDomain(start.hostname); return url => url.hostname === start.hostname || (includeSubdomains && (url.hostname === base || url.hostname.endsWith(`.${base}`))); }
function registrableDomain(host) { const parts = host.split('.'); const suffix = parts.slice(-2).join('.'); return ['co.uk', 'ac.uk', 'com.au', 'com.br', 'co.nz'].includes(suffix) && parts.length > 2 ? parts.slice(-3).join('.') : suffix; }
function selectCandidates(candidates, maxPages, random) { const mandatory = candidates.filter(item => item.mandatory); const rest = candidates.filter(item => !item.mandatory); const pool = random ? shuffle(rest) : rest; return mandatory.concat(pool).slice(0, maxPages).map(item => ({ ...item, selectionMethod: item.mandatory ? 'mandatory' : random ? 'random' : 'all_eligible' })); }
function extractVisibleText(document) { const copy = document.body?.cloneNode(true) || document.documentElement.cloneNode(true); copy.querySelectorAll('script,style,noscript,svg,template,nav,footer,aside,form,dialog,[hidden],[aria-hidden="true"]').forEach(node => node.remove()); return clean(copy.textContent); }
function extractTextBlocks(document) { return [...document.querySelectorAll('p')].map(node => clean(node.textContent)).filter(Boolean); }
function clean(value) { return String(value || '').replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim(); }
function textStats(text, language, dictionary) { if (language === 'en') { const words = String(text).match(/(?:[A-Za-z](?:\.[A-Za-z])+(?:\.)?|[A-Za-z]+(?:['’\-][A-Za-z]+)*|\d+(?:[.,]\d+)*)/g) || []; return { words: words.length, sentences: Math.max(1, (String(text).match(/[.!?]+(\s|$)/g) || []).length), syllables: words.reduce((sum, word) => sum + englishSyllables(word, dictionary), 0) }; } const words = String(text).normalize('NFC').match(/\p{L}+(?:[-']\p{L}+)*|\p{N}+(?:[.,]\p{N}+)*|[\p{Sc}\p{Sm}%@#&]/gu) || []; return { words: words.length, sentences: Math.max(1, String(text).split(/[.;:¿?¡!—]+/u).filter(item => /\p{L}|\p{N}/u.test(item)).length), syllables: words.reduce((sum, word) => sum + spanishSyllables(word, dictionary), 0) }; }
function englishSyllables(word, dictionary) { const token = String(word).toLowerCase().replace(/[’]/g, "'").replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, ''); if (!token) return 0; let count = dictionary[token]?.[0] ?? dictionary[token.replace(/'s$/, '')]?.[0]; if (!count) { if (/^\d+(?:[.,]\d+)*$/.test(token)) count = 1; else if (token.includes('-')) count = token.split('-').reduce((sum, part) => sum + englishSyllables(part, dictionary), 0); else { const plain = token.replace(/'s$|s'$/g, ''); count = (plain.match(/[aeiouy]+/g) || []).length; if (/e$/.test(plain) && !/[^aeiou]le$/.test(plain)) count -= 1; count = Math.max(1, count); } } return count; }
function spanishSyllables(word, dictionary) { const token = String(word).toLowerCase().replace(/[^a-záéíóúüñ'-]/g, ''); if (!token) return 0; let count = dictionary[token]; if (!count) count = token.split(/[-']/).reduce((sum, part) => sum + Math.max(1, (part.replace(/([qg])u(?=[eéií])/g, '$1').match(/[aeiouáéíóúü](?:h?[aeiouáéíóúü])*/g) || []).length), 0); return count; }
function readabilityScore(stats, language) { if (!stats.words || !stats.sentences) return 0; return Math.min(100, language === 'en' ? 206.835 - 1.015 * (stats.words / stats.sentences) - 84.6 * (stats.syllables / stats.words) : 206.835 - 62.3 * (stats.syllables / stats.words) - (stats.words / stats.sentences)); }
function classificationRules(language) { return language === 'en' ? [[90,'Very easy','green'],[80,'Easy','green'],[70,'Fairly easy','lime'],[60,'Plain English','amber'],[50,'Fairly difficult','orange'],[30,'Difficult','red'],[null,'Very difficult','red']].map(([minimum,label,color]) => ({ minimum, label, color })) : [[80,'Muy fácil','green'],[65,'Bastante fácil','lime'],[55,'Normal','amber'],[40,'Algo difícil','orange'],[null,'Muy difícil','red']].map(([minimum,label,color]) => ({ minimum, label, color })); }
function levelForScore(score, language) { return classificationRules(language).find(rule => rule.minimum === null || score >= rule.minimum).label; }
function detectLanguage(text, declared) { const lower = String(text).toLowerCase(); const english = (lower.match(/\b(the|and|of|to|with|this|that|research|university|students)\b/g) || []).length; const spanish = (lower.match(/\b(el|la|los|las|que|para|con|una|universidad|estudiantes)\b/g) || []).length + (/[áéíóúñ¿¡]/i.test(text) ? 2 : 0); if (english === spanish) return declared || 'unknown'; return english > spanish ? 'en' : 'es'; }
function deduplicate(items) { const seen = new Set(); return items.filter(item => { const key = normalizeText(item.text); if (seen.has(key)) return false; seen.add(key); return true; }); }
function normalizeText(value) { return String(value).normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase(); }
function sectionForUrl(url) { return url.pathname.split('/').filter(Boolean)[0] ? `/${url.pathname.split('/').filter(Boolean)[0]}/` : '/'; }
function compareDifficulty(a, b) { return (a.rawScore ?? a.score) - (b.rawScore ?? b.score) || b.words - a.words; }
function hashId(value) { let hash = 2166136261; for (const char of String(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619); return `C-${(hash >>> 0).toString(36).toUpperCase()}`; }
function round1(value) { return Math.round(value * 10) / 10; }
function bounded(value, fallback, min, max) { const number = value === undefined || value === '' ? fallback : Number(value); if (!Number.isInteger(number) || number < min || number > max) throw new Error(`${min}-${max}`); return number; }
function shuffle(items) { const copy = [...items]; for (let index = copy.length - 1; index > 0; index -= 1) { const target = Math.floor(Math.random() * (index + 1)); [copy[index], copy[target]] = [copy[target], copy[index]]; } return copy; }
function shortReason(language, words) { return language === 'en' ? `Short page: ${words} words. Metrics are shown, but interpret them with caution.` : `Página breve: ${words} palabras. Se muestran métricas, pero conviene interpretarlas con cautela.`; }
