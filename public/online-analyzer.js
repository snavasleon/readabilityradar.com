// Browser-side runner for one public web page or an uploaded HTML file.
// Calculation itself lives in readability-core.mjs, shared with the local app.
import { createReadabilityCore, MAX_HTML_CHARS } from './core/readability-core.mjs';

const MAX_PAGES = 1;
const MAX_CANDIDATES = 1;
const cores = new Map();

export async function analyzeOnline(input, progress = () => {}) {
  const language = input.language === 'en' ? 'en' : 'es';
  const scope = input.scope === 'page' ? 'page' : 'domain';
  const minWords = bounded(input.minWords, 80, 20, 2000);
  const minFragmentWords = bounded(input.minFragmentWords, 30, 10, 250);
  const core = await loadCore(language);
  const inputUrls = parseUrlList(input.input, core);
  if (!inputUrls.length && !input.htmlInput) {
    throw new Error(language === 'es' ? 'Introduce al menos una URL.' : 'Enter at least one URL.');
  }

  let candidates;
  const domains = [];
  if (input.htmlInput) {
    core.assertSupportedHtmlSize(input.htmlInput);
    candidates = [{
      url: 'local-html://uploaded-file',
      source: sourceLabel('local', language),
      discoverySources: [sourceLabel('local', language)],
      mandatory: true,
      depth: 0,
      section: '/',
      domainKey: 'local-html://',
    }];
  } else if (scope === 'page') {
    if (inputUrls.length !== 1) {
      throw new Error(language === 'es'
        ? 'La edición web analiza una sola URL cada vez. Para varias URLs o un dominio completo, abre la aplicación local.'
        : 'The web edition analyzes one URL at a time. For several URLs or a complete domain, open the local application.');
    }
    candidates = inputUrls.map(url => candidate(url, 'selected', language, 0, true, core));
  } else {
    throw new Error(language === 'es'
      ? 'El análisis de dominio completo requiere la aplicación local.'
      : 'Full-domain analysis requires the local application.');
  }

  const requested = input.maxPages === 'all' ? MAX_PAGES : bounded(input.maxPages, 12, 1, MAX_PAGES);
  const selected = candidates.slice(0, requested).map(item => ({ ...item, selectionMethod: 'selected' }));
  if (input.estimateOnly) {
    return makeResult({ language, scope, candidates, selected, pages: [], domains, input, core, minWords, minFragmentWords });
  }

  const pages = [];
  const seen = new Map();
  for (let index = 0; index < selected.length; index += 1) {
    progress('analysis', index, selected.length);
    const page = await analyzePage(selected[index], language, minWords, minFragmentWords, core, input.htmlInput, input.turnstileToken);
    if (page.status === 'analyzed') {
      const duplicate = seen.get(page.contentFingerprint);
      if (duplicate) {
        page.status = 'duplicate';
        page.statusLabel = language === 'es' ? 'contenido duplicado' : 'duplicate content';
        page.reason = language === 'es'
          ? `Excluida de las métricas porque su texto extraído es idéntico al de ${duplicate.pageId}.`
          : `Excluded from metrics because its extracted text is identical to ${duplicate.pageId}.`;
        page.duplicateOf = duplicate.pageId;
        page.fragments = [];
        page.score = null;
        page.rawScore = null;
        page.fullTextScore = null;
        page.level = '-';
        page.scoreBasis = 'duplicate_content_excluded';
      } else {
        seen.set(page.contentFingerprint, page);
      }
    }
    delete page.contentFingerprint;
    pages.push(page);
  }

  const successfulPages = pages.filter(page => page.status === 'analyzed');
  if (!successfulPages.length && pages.length) {
    const detail = pages.map(page => page.reason).filter(Boolean)[0];
    throw new Error(language === 'es'
      ? `No se pudo descargar y analizar la página.${detail ? ` ${detail}` : ''}`
      : `The page could not be retrieved and analysed.${detail ? ` ${detail}` : ''}`);
  }
  return makeResult({ language, scope, candidates, selected, pages, domains, input, core, minWords, minFragmentWords });
}

async function loadCore(language) {
  if (!cores.has(language)) {
    const response = await fetch(`/api/dictionary?language=${language}`, { cache: 'force-cache' });
    if (!response.ok) {
      throw new Error(language === 'es'
        ? 'No se pudo cargar el diccionario de sílabas.'
        : 'The syllable dictionary could not be loaded.');
    }
    const dictionary = await response.json();
    cores.set(language, createReadabilityCore(language === 'en'
      ? { englishSyllableDictionary: dictionary }
      : { spanishSyllableDictionary: dictionary }));
  }
  return cores.get(language);
}

async function analyzePage(item, language, minWords, minFragmentWords, core, localHtml, turnstileToken) {
  let pageId = '';
  try {
    const fetched = item.url.startsWith('local-html://')
      ? { url: item.url, html: core.assertSupportedHtmlSize(localHtml), rendering: 'local' }
      : await getHtml(item.url, turnstileToken);
    const processed = await core.analyzeHtmlContent({
      html: fetched.html,
      // Keep the identity associated with the address the user selected, as the
      // local engine does; a redirect does not silently change report IDs.
      url: item.url,
      language,
      minFragmentWords,
      rendering: fetched.rendering,
    });
    pageId = processed.pageId;
    const title = processed.title || item.url;
    const { stats, fragments, extraction, detectedPageLanguage, fullTextScore } = processed;
    if (!fragments.length && detectedPageLanguage !== language) {
      return {
        ...(await pageBase(item, title, core)),
        url: fetched.url,
        status: 'discarded',
        statusLabel: language === 'es' ? 'descartada' : 'discarded',
        exclusionCategory: 'language',
        reason: language === 'es'
          ? `El idioma del texto (${detectedPageLanguage === 'unknown' ? 'no identificado' : detectedPageLanguage}) no coincide con el idioma seleccionado.`
          : `Text language (${detectedPageLanguage === 'unknown' ? 'not identified' : detectedPageLanguage}) does not match the selected language.`,
        ...stats,
        score: null,
        level: '-',
        fragments,
        extraction,
      };
    }
    return {
      ...(await pageBase(item, title, core)),
      url: fetched.url,
      status: 'analyzed',
      statusLabel: language === 'es' ? 'analizada' : 'analyzed',
      reason: stats.words < minWords ? shortReason(language, stats.words) : '',
      ...stats,
      score: core.round1(fullTextScore),
      rawScore: fullTextScore,
      fullTextScore: core.round1(fullTextScore),
      level: core.levelForScore(fullTextScore, language),
      scoreBasis: 'full_page_text',
      contentFingerprint: processed.contentFingerprint,
      extraction,
      fragments,
    };
  } catch (error) {
    return {
      ...(await pageBase(item, item.url, core, pageId)),
      status: 'error',
      statusLabel: 'error',
      reason: error?.message || String(error),
      words: 0,
      sentences: 0,
      syllables: 0,
      score: null,
      level: '-',
      fragments: [],
    };
  }
}

async function getHtml(url, turnstileToken) {
  const response = await fetch('/api/fetch', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url, turnstileToken }),
  });
  const result = await response.json();
  if (!response.ok || result.error) throw new Error(result.error || 'The page could not be retrieved.');
  return result;
}

async function makeResult({ language, scope, candidates, selected, pages, domains, input, core, minWords, minFragmentWords }) {
  const allFragments = await Promise.all(pages.flatMap(page => page.fragments.map(async (fragment, index) => ({
    ...fragment,
    fragmentId: await core.buildFragmentId(page.url, index, fragment.text),
    index: fragment.sourceIndex,
    pageTitle: page.title,
    pageUrl: page.url,
    link: page.url,
  }))));
  const fragments = input.fragmentLimit === 'top10'
    ? [...allFragments].sort(compareDifficulty).slice(0, 10)
    : [...allFragments].sort(compareDifficulty);
  const analyzed = pages.filter(page => page.status === 'analyzed');
  const averageScore = analyzed.length
    ? core.round1(analyzed.reduce((sum, page) => sum + page.rawScore, 0) / analyzed.length)
    : null;
  const coverage = {
    platform: 'browser_client_free',
    maxCandidates: MAX_CANDIDATES,
    maxPages: MAX_PAGES,
    partial: candidates.length >= MAX_CANDIDATES,
    rendering: 'static_html',
    maxHtmlChars: MAX_HTML_CHARS,
  };
  const renderedDomains = scope === 'domain' ? domains.map(domain => {
    const ids = new Set(selected.filter(item => item.domainKey === new URL(domain.startUrl).origin).map(item => item.url));
    const listed = candidates.filter(item => item.domainKey === new URL(domain.startUrl).origin);
    const rows = pages.filter(page => ids.has(page.url));
    return {
      ...domain,
      candidatesDetected: listed.length,
      eligibleCandidates: listed.length,
      excludedCandidates: 0,
      selectedPages: ids.size,
      analyzedPages: rows.filter(page => page.status === 'analyzed').length,
      languageExcludedPages: rows.filter(page => page.exclusionCategory === 'language').length,
      duplicateContentPages: rows.filter(page => page.status === 'duplicate').length,
      selectionMode: language === 'es' ? 'Páginas detectadas y procesadas en el navegador' : 'Pages detected and processed in the browser',
    };
  }) : candidates.map(item => ({
    domain: new URL(item.url).host,
    startUrl: item.url,
    candidatesDetected: 1,
    selectedPages: 1,
    analyzedPages: pages.filter(page => page.status === 'analyzed').length,
    languageExcludedPages: pages.filter(page => page.exclusionCategory === 'language').length,
    selectionMode: language === 'es' ? 'URL exacta indicada por el usuario' : 'Exact URL selected by the user',
  }));
  const samplingFrame = await Promise.all(candidates.map(async item => {
    const itemPageId = await core.buildPageId(item.url);
    const page = pages.find(value => value.pageId === itemPageId);
    return {
      ...item,
      pageId: itemPageId,
      selected: selected.some(value => value.url === item.url),
      status: page?.status || '',
      statusLabel: page?.statusLabel || '-',
      words: page?.words ?? null,
      score: page?.status === 'analyzed' ? page.score : null,
      level: page?.level ?? null,
    };
  }));
  return {
    generatedAt: new Date().toISOString(),
    language,
    scope,
    estimateOnly: Boolean(input.estimateOnly),
    localSourceText: input.htmlInput || null,
    metric: language === 'en' ? 'Flesch Reading Ease' : 'Szigriszt-Pazos / INFLESZ',
    summary: {
      candidates: candidates.length,
      eligibleCandidates: candidates.length,
      excludedCandidates: 0,
      languageExcludedPages: pages.filter(page => page.exclusionCategory === 'language').length,
      duplicateContentPages: pages.filter(page => page.status === 'duplicate').length,
      selected: selected.length,
      analyzed: analyzed.length,
      fragments: fragments.length,
      totalFragmentsDetected: allFragments.length,
      averageScore,
      averageLevel: averageScore === null ? '-' : core.levelForScore(averageScore, language),
    },
    domains: renderedDomains,
    samplingFrame,
    criteria: {
      maxPages: input.maxPages === 'all' ? MAX_PAGES : bounded(input.maxPages, 12, 1, MAX_PAGES),
      samplingMode: input.samplingMode === 'random' ? 'random_pages' : 'all_selected_pages',
      fragmentSelection: input.fragmentLimit === 'top10' ? 'hardest_from_selected_pages' : 'all_eligible',
      eligibleFragmentCount: allFragments.length,
      selectedFragmentIds: fragments.map(item => item.fragmentId),
      categories: core.classificationRules(language),
      processingRules: language === 'es' ? 'inflesz-documented-v1' : 'english-v1',
      selectedPageCount: selected.length,
      minWords,
      minFragmentWords,
      metric: language === 'en' ? 'Flesch Reading Ease' : 'Szigriszt-Pazos / INFLESZ',
      scope,
      includeRelatedSubdomains: Boolean(input.includeRelatedSubdomains),
      coverage,
    },
    pages,
    fragments,
  };
}

function candidate(url, source, language, depth, mandatory, core) {
  const normalized = core.canonicalUrl(url);
  return {
    url: normalized.href,
    source: sourceLabel(source, language),
    discoverySources: [sourceLabel(source, language)],
    selectionReason: sourceReason(source, language),
    mandatory,
    eligible: true,
    exclusionReason: '',
    section: core.sectionForUrl(normalized),
    depth,
    domainKey: normalized.origin,
  };
}

function sourceLabel(key, language) {
  return ({
    es: { initial: 'dominio inicial', required: 'página obligatoria', crawl: 'enlace interno', selected: 'página indicada', local: 'archivo HTML local' },
    en: { initial: 'initial domain', required: 'required page', crawl: 'internal link', selected: 'selected page', local: 'local HTML file' },
  })[language][key];
}

function sourceReason(key, language) {
  const values = language === 'es'
    ? { initial: 'Incluida como página inicial.', required: 'Incluida porque la indicó el usuario.', crawl: 'Detectada al seguir un enlace interno.', selected: 'Incluida porque la indicó el usuario.', local: 'Incluida desde el archivo local.' }
    : { initial: 'Included as the starting page.', required: 'Included because the user marked it as required.', crawl: 'Discovered by following an internal link.', selected: 'Included because it was entered by the user.', local: 'Included from the local file.' };
  return values[key];
}

async function pageBase(item, title, core, knownPageId = '') {
  return { ...item, pageId: knownPageId || await core.buildPageId(item.url), title };
}

function parseUrlList(value, core) {
  return String(value || '')
    .split(/[\r\n,]+/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => /^https?:\/\//i.test(item) ? item : `https://${item}`)
    .map(item => core.canonicalUrl(item).href);
}

function compareDifficulty(left, right) {
  return (left.rawScore ?? left.score) - (right.rawScore ?? right.score) || left.words - right.words;
}

function bounded(value, fallback, min, max) {
  const number = value === undefined || value === '' ? fallback : Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new Error(`${min}-${max}`);
  return number;
}

function shortReason(language, words) {
  return language === 'en'
    ? `Short page: ${words} words. Metrics are shown, but interpret them with caution.`
    : `Página breve: ${words} palabras. Se muestran métricas, pero conviene interpretarlas con cautela.`;
}
