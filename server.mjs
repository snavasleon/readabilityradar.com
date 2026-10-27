import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec, execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir, homedir } from 'node:os';
import { createHash, randomBytes } from 'node:crypto';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(rootDir, 'public');
const englishSyllableDictionaryPath = join(rootDir, 'resources', 'cmudict-syllables.json');
const englishSyllableData = JSON.parse(readFileSync(englishSyllableDictionaryPath, 'utf8'));
globalThis.ENGLISH_SYLLABLE_DICTIONARY = englishSyllableData.entries;
globalThis.ENGLISH_SYLLABLE_CACHE = new Map();
const spanishSyllableDictionaryPath = join(rootDir, 'resources', 'pylabeador-syllables.json');
const spanishSyllableData = JSON.parse(readFileSync(spanishSyllableDictionaryPath, 'utf8'));
globalThis.SPANISH_SYLLABLE_DICTIONARY = spanishSyllableData.entries;
globalThis.SPANISH_SYLLABLE_CACHE = new Map();
const execFileAsync = promisify(execFile);
const analysisJobs = new Map();
const REMOTE_BRIDGE_ORIGINS = new Set([
  'https://readabilityradar.com',
  'https://www.readabilityradar.com',
]);

const LIMITS = {
  maxPages: 10000,
  maxCandidates: 10000,
  maxCrawlPagesPerDomain: 120,
  maxCrawlDepth: 3,
  maxSitemapsPerDomain: 50,
  fetchTimeoutMs: 12000,
  // Discovery must always complete predictably. Complete mode can use more time,
  // but reports partial coverage rather than leaving the interface waiting forever.
  estimateDiscoveryBudgetMs: 20000,
  completeDiscoveryBudgetMs: 120000,
  // Analysis is separately bounded from discovery. A large sitemap must never
  // turn into an unbounded page-by-page request after candidates are found.
  fastAnalysisBudgetMs: 30000,
  maxAnalysisConcurrency: 8,
  // Modern home pages can legitimately grow after client-side rendering. The complete document is accepted or rejected; it is never truncated.
  maxHtmlChars: 6000000,
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    applyBridgeCors(request, response);
    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      response.writeHead(204);
      response.end();
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/bridge-status') {
      sendJson(response, 200, {
        bridge: 'web-readability-radar-local',
        version: 1,
        capabilities: ['full-domain', 'sitemaps', 'local-rendering', 'reports'],
        maxCandidates: LIMITS.maxCandidates,
      });
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/analyze') {
      const body = await readJson(request);
      if (body.background === true) {
        const job = startAnalysisJob(body);
        sendJson(response, 202, { jobId: job.id });
        return;
      }
      const result = await analyze(body);
      result.syllableValidation = await loadSyllableValidation(result.language);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/analyze-status') {
      const job = analysisJobs.get(url.searchParams.get('jobId'));
      if (!job) throw Object.assign(new Error('Analysis job not found.'), { statusCode: 404 });
      const terminal = job.state === 'complete' || job.state === 'error';
      sendJson(response, 200, {
        state: job.state,
        progress: job.progress,
        result: job.state === 'complete' ? job.result : undefined,
        error: job.state === 'error' ? job.error : undefined,
      });
      if (terminal) analysisJobs.delete(job.id);
      return;
    }

    if (request.method === 'GET' && url.pathname.startsWith('/demo/')) {
      sendDemo(response, url.pathname.includes('/en') ? 'en' : 'es');
      return;
    }

    await serveStatic(url.pathname, response);
  } catch (error) {
    sendJson(response, error?.statusCode ?? 500, {
      error:
        error instanceof Error
          ? readableError(error.message)
        : 'Unexpected error.',
    });
  }
});

const requestedPort = Number(readArg('--port') ?? process.env.PORT ?? 8787);
const portableWindowsApp = Boolean(process.pkg);
listen(requestedPort, requestedPort === 8787 ? [55481] : []);

async function loadSyllableValidation(language) {
  try {
    const snapshots = JSON.parse(await readFile(join(publicDir, 'syllable-validation.json'), 'utf8'));
    const data = snapshots[language];
    if (!data || data.version !== 'current_radar') return null;
    const source = await readFile(fileURLToPath(import.meta.url));
    return { data, matchesCurrentServer: data.current_server_sha256 === createHash('sha256').update(source).digest('hex') };
  } catch {
    return null;
  }
}

function listen(port, fallbackPorts = []) {
  server.once('error', (error) => {
    if (error && error.code === 'EADDRINUSE' && fallbackPorts.length) {
      const [nextPort, ...remainingPorts] = fallbackPorts;
      console.log(`Port ${port} is in use; trying ${nextPort}.`);
      listen(nextPort, remainingPorts);
      return;
    }
    if (error && error.code === 'EADDRINUSE') {
      console.error(`The local engine cannot start because port ${port} is already in use. Close the other Web Readability Radar window and try again.`);
      process.exit(1);
      return;
    }
    console.error(error);
    process.exit(1);
  });

  server.listen(port, '127.0.0.1', () => {
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : port;
    const localUrl = `http://127.0.0.1:${actualPort}/`;
    console.log('');
    console.log('Web Readability Radar');
    console.log(`Opened at: ${localUrl}`);
    console.log('Press Ctrl+C to close the server.');
    console.log('');
    if (portableWindowsApp) {
      openBrowser('https://readabilityradar.com');
    } else if (process.argv.includes('--open')) {
      openBrowser(localUrl);
    }
  });
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function openBrowser(url) {
  const command =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(command);
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 8 * 1024 * 1024) throw Object.assign(new Error('Request exceeds 8 MiB / La solicitud supera 8 MiB.'), {statusCode: 413});
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(data));
}

function applyBridgeCors(request, response) {
  const origin = request.headers.origin;
  if (!REMOTE_BRIDGE_ORIGINS.has(origin)) return;
  response.setHeader('access-control-allow-origin', origin);
  response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
  response.setHeader('access-control-allow-headers', 'content-type');
  response.setHeader('access-control-allow-private-network', 'true');
  response.setHeader('access-control-max-age', '600');
  response.setHeader('vary', 'Origin');
}

async function serveStatic(pathname, response) {
  const cleanPath = pathname === '/' ? '/index.html' : pathname;
  const normalized = normalize(decodeURIComponent(cleanPath)).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(publicDir, normalized);

  if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('No encontrado');
    return;
  }

  const content = await readFile(filePath);
  response.writeHead(200, {
    'content-type': MIME[extname(filePath)] ?? 'application/octet-stream',
  });
  response.end(content);
}

function startAnalysisJob(body) {
  const id = randomBytes(16).toString('hex');
  const job = {
    id,
    state: 'running',
    progress: { phase: 'discovery', completed: 0, total: null },
    createdAt: Date.now(),
    result: null,
    error: null,
  };
  analysisJobs.set(id, job);
  for (const [jobId, entry] of analysisJobs) {
    if (entry.createdAt < Date.now() - 15 * 60 * 1000) analysisJobs.delete(jobId);
  }
  void (async () => {
    try {
      const result = await analyze(body, (progress) => { job.progress = progress; });
      result.syllableValidation = await loadSyllableValidation(result.language);
      job.result = result;
      job.progress = { ...job.progress, phase: 'complete' };
      job.state = 'complete';
      expireAnalysisJob(job.id);
    } catch (error) {
      job.error = readableError(error instanceof Error ? error.message : String(error));
      job.state = 'error';
      expireAnalysisJob(job.id);
    }
  })();
  return job;
}

function expireAnalysisJob(id) {
  const timer = setTimeout(() => analysisJobs.delete(id), 60_000);
  timer.unref?.();
}

async function analyze(body, onProgress = () => {}) {
  const language = body.language === 'en' ? 'en' : 'es';
  const scope = body.scope === 'page' ? 'page' : 'domain';
  const estimateOnly = Boolean(body.estimateOnly);
  const completeMode = body.maxPages === 'all';
  const includeRelatedSubdomains = scope === 'domain' && Boolean(body.includeRelatedSubdomains);
  const fragmentLimit = body.fragmentLimit === 'top10' ? 10 : null;
  const randomSample = body.samplingMode === 'random' && scope === 'domain';
  const samplingSeed = randomSample
    ? (typeof body.samplingSeed === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(body.samplingSeed) ? body.samplingSeed : randomBytes(16).toString('hex')) : null;
  const maxPages = completeMode ? LIMITS.maxPages : boundedInteger(body.maxPages, 12, 1, LIMITS.maxPages, language === 'es' ? 'Alcance' : 'Scope');
  const minWords = boundedInteger(body.minWords, 80, 20, 2000, language === 'es' ? 'Palabras por página' : 'Page words');
  const minFragmentWords = boundedInteger(body.minFragmentWords, 30, 10, 250, language === 'es' ? 'Palabras por fragmento' : 'Fragment words');
  const localHtml = typeof body.htmlInput === 'string' && body.htmlInput.trim().length ? body.htmlInput : '';
  if (localHtml.length > LIMITS.maxHtmlChars) throw Object.assign(new Error(language === 'es' ? 'El HTML supera el límite de 6.000.000 de caracteres y no se analiza parcialmente.' : 'HTML exceeds the 6,000,000-character limit and is not partially analyzed.'), {statusCode: 413});
  const inputs = parseUrlList(body.input);
  const exactUrls = parseUrlList(body.exactUrls);

  if (!inputs.length && !localHtml) {
    throw new Error(language === 'en' ? 'Enter at least one URL.' : 'Introduce al menos una URL.');
  }

  const crawlPolicy = completeMode
    ? { maxPages: LIMITS.maxCandidates, maxDepth: null, mode: 'complete', timeBudgetMs: estimateOnly ? LIMITS.estimateDiscoveryBudgetMs : LIMITS.completeDiscoveryBudgetMs }
    : { maxPages: LIMITS.maxCrawlPagesPerDomain, maxDepth: LIMITS.maxCrawlDepth, mode: 'fast', timeBudgetMs: LIMITS.estimateDiscoveryBudgetMs };
  onProgress({ phase: 'discovery', completed: 0, total: null });
  const domainDiscovery = !localHtml && scope === 'domain'
    ? await buildDomainCandidates(inputs, exactUrls, language, includeRelatedSubdomains, crawlPolicy)
    : null;
  const candidates = localHtml
    ? [{
        url: `local-html://${safeLocalHtmlName(body.htmlName)}`,
        source: language === 'en' ? 'local HTML' : 'HTML local',
        selectionReason: language === 'en' ? 'Included from an uploaded local HTML file.' : 'Incluida desde un archivo HTML local.',
        mandatory: true,
        html: localHtml,
      }]
    : scope === 'page'
    ? inputs.map((url) => ({
        url,
        source: language === 'en' ? 'selected page' : 'página indicada',
        selectionReason: language === 'en' ? 'Included because it was entered by the user.' : 'Incluida porque la indicó el usuario.',
        mandatory: true,
      }))
    : domainDiscovery.candidates;

  const selected = selectCandidates(uniqueByUrl(candidates), maxPages, samplingSeed);
  const pages = [];
  const retainedContent = new Map();
  let analysisTimeLimitReached = false;
  let processedPages = 0;

  onProgress({ phase: estimateOnly ? 'complete' : 'analysis', completed: 0, total: selected.length });

  if (!estimateOnly) {
    // Complete mode finishes every selected URL. Each request still has its own
    // timeout, so an inaccessible page cannot stop the complete analysis.
    const analysisDeadline = completeMode ? null : Date.now() + LIMITS.fastAnalysisBudgetMs;
    const pageSlots = new Array(selected.length);
    let nextIndex = 0;
    async function worker() {
      while (analysisDeadline === null || Date.now() < analysisDeadline) {
        const index = nextIndex++;
        if (index >= selected.length) return;
        pageSlots[index] = await analyzePage(
          selected[index], language, minWords, minFragmentWords, scope === 'page',
          analysisDeadline === null ? LIMITS.fetchTimeoutMs + 8000 : Math.max(1, analysisDeadline - Date.now()),
        );
        processedPages += 1;
        onProgress({ phase: 'analysis', completed: processedPages, total: selected.length });
      }
    }
    await Promise.all(Array.from({ length: Math.min(LIMITS.maxAnalysisConcurrency, selected.length) }, worker));
    for (let index = 0; index < selected.length; index += 1) {
      if (!pageSlots[index]) {
        pageSlots[index] = pendingPage(selected[index], language);
        analysisTimeLimitReached = true;
      }
    }
    for (const page of pageSlots) {
      if (page.status === 'analyzed' && page.contentFingerprint) {
        const original = retainedContent.get(page.contentFingerprint);
        if (original) {
          page.status = 'duplicate';
          page.statusLabel = language === 'en' ? 'duplicate content' : 'contenido duplicado';
          page.reason = language === 'en'
            ? `Excluded from metrics because its extracted text is identical to ${original.pageId}.`
            : `Excluida de las métricas porque su texto extraído es idéntico al de ${original.pageId}.`;
          page.duplicateOf = original.pageId;
          page.fragments = [];
          page.score = null;
          page.rawScore = null;
          page.fullTextScore = null;
          page.level = '-';
          page.scoreBasis = 'duplicate_content_excluded';
        } else {
          retainedContent.set(page.contentFingerprint, page);
        }
      }
      pages.push(page);
    }
    if (analysisTimeLimitReached && domainDiscovery) {
      for (const domain of domainDiscovery.domains) {
        if (!domain.partialReasons.includes('analysis_time_limit')) domain.partialReasons.push('analysis_time_limit');
      }
    }
  }
  pages.forEach((page) => { delete page.contentFingerprint; });

  const analyzed = pages.filter((page) => page.status === 'analyzed');
  const allFragments = pages.flatMap((page) =>
    page.fragments.map((fragment, index) => ({
      ...fragment,
      fragmentId: buildFragmentId(page.url, index, fragment.text),
      index: fragment.sourceIndex ?? index + 1,
      pageTitle: page.title,
      pageUrl: page.url,
      link: page.url,
    })),
  );
  const fragments = fragmentLimit ? selectHardestFragments(allFragments, fragmentLimit) : allFragments.sort(compareFragmentDifficulty);
  const averageScore = analyzed.length
    ? round1(analyzed.reduce((sum, page) => sum + page.rawScore, 0) / analyzed.length)
    : null;

  return {
    generatedAt: new Date().toISOString(),
    language,
    scope,
    estimateOnly,
    localSourceText: localHtml ? extractVisibleText(localHtml) : null,
    metric: language === 'en' ? 'Flesch Reading Ease' : 'Szigriszt-Pazos / INFLESZ',
    summary: {
      candidates: candidates.length,
      eligibleCandidates: candidates.filter((candidate) => candidate.eligible !== false).length,
      excludedCandidates: candidates.filter((candidate) => candidate.eligible === false).length,
      languageExcludedPages: pages.filter((page) => page.exclusionCategory === 'language').length,
      duplicateContentPages: pages.filter((page) => page.status === 'duplicate').length,
      selected: selected.length,
      analyzed: analyzed.length,
      fragments: fragments.length,
      totalFragmentsDetected: allFragments.length,
      averageScore,
      averageLevel: averageScore === null ? '-' : levelForScore(analyzed.reduce((sum, page) => sum + page.rawScore, 0) / analyzed.length, language),
    },
    domains: localHtml
      ? [{
          domain: safeLocalHtmlName(body.htmlName),
          startUrl: `local-html://${safeLocalHtmlName(body.htmlName)}`,
          candidatesDetected: 1,
          homepageLinks: 0,
          sitemapLinks: 0,
          selectedPages: selected.length,
          selectionMode: language === 'en' ? 'Local HTML file selected by the user' : 'Archivo HTML local indicado por el usuario',
        }]
      : scope === 'domain'
        ? summarizeDiscoveredDomains(domainDiscovery.domains, candidates, selected, pages, language, randomSample)
        : summarizeDomains(inputs, candidates, selected, pages, language, scope, randomSample),
    samplingFrame: candidates.map((candidate) => {
      const selectedCandidate = selected.find((item) => normalizeUrlKey(item.url) === normalizeUrlKey(candidate.url));
      const page = pages.find((item) => normalizeUrlKey(item.url) === normalizeUrlKey(candidate.url));
      return {
        url: candidate.url,
        pageId: buildPageId(candidate.url),
        source: candidate.source,
        selectionReason: candidate.selectionReason,
        selectionMethod: selectedCandidate?.selectionMethod ?? '',
        discoverySources: candidate.discoverySources ?? [candidate.source],
        section: candidate.section ?? '/',
        depth: candidate.depth ?? 0,
        eligible: candidate.eligible !== false,
        exclusionReason: candidate.exclusionReason ?? '',
        selected: Boolean(selectedCandidate),
        status: page?.status ?? '',
        statusLabel: page?.statusLabel ?? '-',
        words: page?.words ?? null,
        score: page?.status === 'analyzed' ? page.score : null,
        level: page?.status === 'analyzed' ? page.level : null,
      };
    }),
    criteria: {
      maxPages,
      analysisTimeLimitReached,
      analysisTimeBudgetMs: completeMode ? null : LIMITS.fastAnalysisBudgetMs,
      samplingMode: randomSample ? 'random_pages' : 'all_selected_pages',
      samplingSeed,
      fragmentSelection: fragmentLimit ? 'hardest_from_selected_pages' : 'all_eligible',
      eligibleFragmentCount: allFragments.length,
      selectedFragmentIds: fragments.map(fragment => fragment.fragmentId),
      categories: classificationRules(language),
      processingRules: language === 'es' ? 'inflesz-documented-v1' : 'english-v1',
      selectedPageCount: selected.length,
      maxPagesLabel: completeMode
        ? (fragmentLimit
            ? (language === 'en' ? 'Detected sitemap, up to 10 hardest fragments from selected pages' : 'Sitemap detectado, hasta 10 fragmentos más difíciles de las páginas seleccionadas')
            : (language === 'en' ? 'All discovered eligible pages' : 'Todas las páginas elegibles detectadas'))
        : randomSample ? (language === 'en' ? `Random page sample: ${selected.length} pages; up to 10 hardest fragments` : `Muestra aleatoria de páginas: ${selected.length}; hasta 10 fragmentos más difíciles`) : String(maxPages),
      minWords,
      minFragmentWords,
      metric: language === 'en' ? 'Flesch Reading Ease' : 'Szigriszt-Pazos / INFLESZ',
      scope,
      includeRelatedSubdomains,
      coverage: domainDiscovery?.coverage ?? null,
    },
    pages,
    fragments,
  };
}

async function buildDomainCandidates(inputs, exactUrls, language, includeRelatedSubdomains, crawlPolicy) {
  const candidates = [];
  const domains = [];
  for (const startUrl of inputs) {
    const discovered = await discoverDomain(startUrl, exactUrls, language, includeRelatedSubdomains, crawlPolicy);
    candidates.push(...discovered.candidates);
    domains.push(discovered.domain);
  }
  return {
    candidates: uniqueByUrl(candidates).slice(0, LIMITS.maxCandidates),
    domains,
    coverage: { maxCrawlPagesPerDomain: crawlPolicy.maxPages, maxCrawlDepth: crawlPolicy.maxDepth, maxCandidates: LIMITS.maxCandidates, timeBudgetMs: crawlPolicy.timeBudgetMs, mode: crawlPolicy.mode, includeRelatedSubdomains },
  };
}

async function discoverDomain(startUrl, exactUrls, language, includeRelatedSubdomains, crawlPolicy) {
  const start = new URL(startUrl);
  const scope = createDomainScope(start, includeRelatedSubdomains);
  const discoveryDeadline = Date.now() + crawlPolicy.timeBudgetMs;
  const remainingDiscoveryMs = () => Math.max(0, discoveryDeadline - Date.now());
  const robots = await fetchRobotsPolicy(start.origin, remainingDiscoveryMs());
  const robotsPolicies = new Map([[start.origin, robots]]);
  const candidateMap = new Map();
  const visited = new Set();
  const queue = [];
  const partialReasons = new Set();
  const domainKey = normalizeUrlKey(start.href);
  let crawledPages = 0;
  let depthReached = 0;
  let crawlErrors = 0;
  const labels = {
    initial: language === 'en' ? 'initial domain' : 'dominio inicial',
    required: language === 'en' ? 'required page' : 'página obligatoria',
    sitemap: language === 'en' ? 'sitemap' : 'mapa del sitio',
    crawl: language === 'en' ? 'internal crawl' : 'enlace interno',
  };
  const reasons = {
    initial: language === 'en' ? 'Included as the starting page.' : 'Incluida como página inicial.',
    required: language === 'en' ? 'Included because the user marked it as required.' : 'Incluida porque la indicó el usuario.',
    sitemap: language === 'en' ? 'Included because it appears in a discovered sitemap.' : 'Incluida porque aparece en un sitemap detectado.',
    crawl: language === 'en' ? 'Discovered by following an internal link.' : 'Detectada al seguir un enlace interno.',
  };

  async function policyFor(url) {
    const origin = new URL(url).origin;
    if (!robotsPolicies.has(origin)) {
      const remaining = remainingDiscoveryMs();
      if (remaining <= 0) return { available: false, sitemapUrls: [], isAllowed: () => false };
      robotsPolicies.set(origin, await fetchRobotsPolicy(origin, remaining));
    }
    return robotsPolicies.get(origin);
  }

  function register(rawUrl, sourceKey, depth, mandatory = false) {
    let url;
    try { url = canonicalUrl(rawUrl); } catch { return null; }
    if (!scope.includes(url)) return null;
    const key = normalizeUrlKey(url.href);
    const knownPolicy = robotsPolicies.get(url.origin);
    const allowed = knownPolicy ? knownPolicy.isAllowed(url) : true;
    const source = labels[sourceKey];
    const existing = candidateMap.get(key);
    if (existing) {
      if (!existing.discoverySources.includes(source)) existing.discoverySources.push(source);
      existing.mandatory ||= mandatory;
      existing.depth = Math.min(existing.depth, depth);
      return existing;
    }
    const candidate = {
      url: url.href,
      source,
      discoverySources: [source],
      selectionReason: reasons[sourceKey],
      mandatory,
      eligible: allowed,
      exclusionReason: allowed ? '' : (language === 'en' ? 'Excluded by robots.txt for this crawler.' : 'Excluida por robots.txt para este rastreador.'),
      section: sectionForUrl(url, start.hostname),
      depth,
      domainKey,
    };
    candidateMap.set(key, candidate);
    return candidate;
  }

  function enqueue(rawUrl, depth) {
    const candidate = register(rawUrl, 'crawl', depth);
    if (!candidate || candidate.eligible === false || (crawlPolicy.maxDepth !== null && depth > crawlPolicy.maxDepth)) return;
    const key = normalizeUrlKey(candidate.url);
    if (!visited.has(key) && !queue.some((item) => item.key === key)) queue.push({ url: candidate.url, depth, key });
  }

  register(start.href, 'initial', 0, true);
  for (const exactUrl of exactUrls) {
    try { if (scope.includes(new URL(exactUrl))) register(exactUrl, 'required', 0, true); } catch { /* Input validation already ran. */ }
  }
  const sitemapResult = await discoverSitemapLinks(start.origin, robots.sitemapUrls, scope, robots, discoveryDeadline);
  if (sitemapResult.limitReached) partialReasons.add('sitemap_candidate_limit');
  if (sitemapResult.timeLimitReached) partialReasons.add('crawl_time_limit');
  for (const href of sitemapResult.links) register(href, 'sitemap', 0);

  enqueue(start.href, 0);
  while (queue.length && crawledPages < crawlPolicy.maxPages && Date.now() < discoveryDeadline) {
    const current = queue.shift();
    if (visited.has(current.key)) continue;
    visited.add(current.key);
    crawledPages++;
    depthReached = Math.max(depthReached, current.depth);
    try {
      const policy = await policyFor(current.url);
      if (!policy.isAllowed(new URL(current.url))) {
        const candidate = candidateMap.get(current.key);
        candidate.eligible = false;
        candidate.exclusionReason = language === 'en' ? 'Excluded by this host’s robots.txt for this crawler.' : 'Excluida por el robots.txt de este host para este rastreador.';
        continue;
      }
      const html = await fetchHtml(current.url, remainingDiscoveryMs());
      const links = extractLinks(html, current.url);
      if (crawlPolicy.maxDepth !== null && current.depth >= crawlPolicy.maxDepth) {
        if (links.length) partialReasons.add('depth_limit');
        continue;
      }
      for (const href of links) {
        let linked;
        try { linked = canonicalUrl(href); } catch { continue; }
        if (!scope.includes(linked)) continue;
        const child = register(linked.href, 'crawl', current.depth + 1);
        if (child?.eligible) enqueue(linked.href, current.depth + 1);
      }
    } catch {
      crawlErrors++;
    }
  }
  if (queue.length) partialReasons.add(Date.now() >= discoveryDeadline ? 'crawl_time_limit' : 'crawl_page_limit');
  const discovered = [...candidateMap.values()].slice(0, LIMITS.maxCandidates);
  // Sitemap-only subdomains are checked against their own policy before they can enter a sample.
  for (const candidate of discovered) {
    if (Date.now() >= discoveryDeadline && !robotsPolicies.has(new URL(candidate.url).origin)) {
      candidate.eligible = false;
      candidate.exclusionReason = language === 'en'
        ? 'Excluded because robots.txt could not be checked within the discovery time limit.'
        : 'Excluida porque no se pudo comprobar robots.txt dentro del límite de tiempo de exploración.';
      partialReasons.add('crawl_time_limit');
      continue;
    }
    const policy = await policyFor(candidate.url);
    if (!policy.isAllowed(new URL(candidate.url))) {
      candidate.eligible = false;
      candidate.exclusionReason = language === 'en' ? 'Excluded by this host’s robots.txt for this crawler.' : 'Excluida por el robots.txt de este host para este rastreador.';
    }
  }
  const sections = new Map();
  for (const candidate of discovered) {
    const section = sections.get(candidate.section) ?? { section: candidate.section, discovered: 0, eligible: 0 };
    section.discovered++;
    if (candidate.eligible) section.eligible++;
    sections.set(candidate.section, section);
  }
  return {
    candidates: discovered,
    domain: {
      key: domainKey,
      domain: start.host,
      startUrl: start.href,
      includeRelatedSubdomains,
      robotsAvailable: robots.available,
      robotsBlocked: discovered.filter((candidate) => !candidate.eligible).length,
      sitemapUrlsChecked: sitemapResult.visited,
      sitemapLinks: sitemapResult.links.length,
      crawledPages,
      crawlErrors,
      depthReached,
      partialReasons: [...partialReasons],
      sections: [...sections.values()].sort((a, b) => b.discovered - a.discovered || a.section.localeCompare(b.section)),
    },
  };
}

async function legacyHomeCandidates(inputs, exactUrls, maxPages, language) {
  const candidates = [];

  for (const startUrl of inputs) {
    const origin = new URL(startUrl).origin;
    candidates.push({
      url: startUrl,
      source: language === 'en' ? 'initial domain' : 'dominio inicial',
      selectionReason: language === 'en' ? 'Included as the starting page.' : 'Incluida como página inicial.',
      mandatory: true,
    });

    for (const exactUrl of exactUrls) {
      try {
        if (new URL(exactUrl).origin === origin) {
          candidates.push({
            url: exactUrl,
            source: language === 'en' ? 'required page' : 'página obligatoria',
            selectionReason: language === 'en' ? 'Included because the user marked it as required.' : 'Incluida porque el usuario la marcó como obligatoria.',
            mandatory: true,
          });
        }
      } catch {
        // ignore invalid exact URLs
      }
    }

    try {
      const html = await fetchHtml(startUrl);
      const links = extractLinks(html, startUrl)
        .filter((href) => {
          try {
            const url = new URL(href);
            return url.origin === origin;
          } catch {
            return false;
          }
        })
        .slice(0, Math.max(Math.min(maxPages * 3, LIMITS.maxCandidates), 20));

      for (const link of links) {
        candidates.push({
          url: link,
          source: language === 'en' ? 'homepage link' : 'página inicial',
          selectionReason: language === 'en' ? 'Included because it is linked from the initial page.' : 'Incluida por estar enlazada desde la página inicial.',
          mandatory: false,
        });
      }

      const sitemapLinks = await discoverSitemapLinks(startUrl, origin);
      for (const link of sitemapLinks) {
        candidates.push({
          url: link,
          source: language === 'en' ? 'sitemap' : 'mapa del sitio',
          selectionReason: language === 'en' ? 'Included because it appears in the site sitemap.' : 'Incluida porque aparece en el mapa del sitio.',
          mandatory: false,
        });
      }
    } catch (error) {
      candidates.push({
        url: startUrl,
        source: language === 'en' ? 'crawl warning' : 'aviso de rastreo',
        selectionReason: readableError(error instanceof Error ? error.message : String(error), language),
        mandatory: true,
      });
    }
  }

  return uniqueByUrl(candidates).slice(0, LIMITS.maxCandidates);
}

function selectCandidates(candidates, maxPages, seed = null) {
  const eligible = candidates.filter((candidate) => candidate.eligible !== false);
  const mandatory = eligible.filter((candidate) => candidate.mandatory);
  const rest = eligible.filter((candidate) => !candidate.mandatory);
  mandatory.forEach((candidate) => { candidate.selectionMethod = 'mandatory'; });
  const selected = [...mandatory];
  if (selected.length >= maxPages) return selected;
  if (!seed) {
    const all = rest.slice(0, maxPages - selected.length);
    all.forEach((candidate) => { candidate.selectionMethod = 'all_eligible'; });
    return [...selected, ...all];
  }
  // Round-robin across sections so a large archive cannot take every page in a limited sample.
  const groups = new Map();
  for (const candidate of rest) {
    const key = candidate.section ?? '/';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(candidate);
  }
  const queues = [...groups.entries()].map(([section, members]) => ({
    members: members.map((candidate) => ({ candidate, priority: createHash('sha256').update(`${seed}:url:${candidate.url}`).digest('hex') })).sort((a, b) => a.priority.localeCompare(b.priority)),
    priority: createHash('sha256').update(`${seed}:section:${section}`).digest('hex'),
    index: 0,
  })).sort((a, b) => a.priority.localeCompare(b.priority));
  while (selected.length < maxPages && queues.some((group) => group.index < group.members.length)) {
    for (const group of queues) {
      if (selected.length >= maxPages) break;
      const item = group.members[group.index++];
      if (item) { item.candidate.selectionMethod = 'stratified_random'; selected.push(item.candidate); }
    }
  }
  return selected;
}

function compareFragmentDifficulty(a,b) {
  return (a.rawScore ?? a.score)-(b.rawScore ?? b.score) || b.words-a.words
    || String(a.pageUrl ?? '').localeCompare(String(b.pageUrl ?? '')) || String(a.text).localeCompare(String(b.text));
}

function createDomainScope(start, includeRelatedSubdomains) {
  const base = registrableDomain(start.hostname);
  return {
    includes(url) {
      if (!['http:', 'https:'].includes(url.protocol)) return false;
      if (url.hostname === start.hostname) return true;
      return includeRelatedSubdomains && (url.hostname === base || url.hostname.endsWith(`.${base}`));
    },
  };
}

function registrableDomain(hostname) {
  const labels = hostname.toLowerCase().split('.').filter(Boolean);
  const multiPartPublicSuffixes = new Set(['ac.uk', 'co.uk', 'gov.uk', 'org.uk', 'sch.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'com.br', 'com.mx']);
  const suffix = labels.slice(-2).join('.');
  return multiPartPublicSuffixes.has(suffix) && labels.length >= 3 ? labels.slice(-3).join('.') : labels.slice(-2).join('.');
}

function canonicalUrl(value) {
  const url = new URL(value);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_[a-z]+|fbclid|gclid|mc_[a-z]+)$/i.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  return url;
}

function sectionForUrl(url, startHost) {
  if (url.hostname !== startHost) return `subdomain:${url.hostname}`;
  const first = url.pathname.split('/').filter(Boolean)[0];
  return first ? `/${first}/` : '/';
}

function summarizeDiscoveredDomains(discoveries, candidates, selected, pages, language, randomSample = false) {
  return discoveries.map((domain) => {
    const domainCandidates = candidates.filter((candidate) => candidate.domainKey === domain.key);
    const domainSelected = selected.filter((candidate) => candidate.domainKey === domain.key);
    const selectedKeys = new Set(domainSelected.map((candidate) => normalizeUrlKey(candidate.url)));
    const domainPages = pages.filter((page) => selectedKeys.has(normalizeUrlKey(page.url)));
    const analyzed = domainPages.filter((page) => page.status === 'analyzed').length;
    const sections = domain.sections.map((section) => ({
      ...section,
      selected: domainSelected.filter((candidate) => candidate.section === section.section).length,
    }));
    return {
      ...domain,
      candidatesDetected: domainCandidates.length,
      eligibleCandidates: domainCandidates.filter((candidate) => candidate.eligible !== false).length,
      excludedCandidates: domainCandidates.filter((candidate) => candidate.eligible === false).length,
      selectedPages: domainSelected.length,
      analyzedPages: analyzed,
      languageExcludedPages: domainPages.filter((page) => page.exclusionCategory === 'language').length,
      duplicateContentPages: domainPages.filter((page) => page.status === 'duplicate').length,
      sections,
      selectionMode: randomSample
        ? (language === 'en' ? 'Stratified random sample across discovered sections' : 'Muestra aleatoria estratificada entre las secciones detectadas')
        : (language === 'en' ? 'All eligible discovered pages, within stated limits' : 'Todas las páginas elegibles detectadas, dentro de los límites indicados'),
    };
  });
}

function summarizeDomains(inputs, candidates, selected, pages, language, scope, randomSample = false) {
  return inputs.map((input) => {
    const origin = new URL(input).origin;
    const domainCandidates = candidates.filter((candidate) => new URL(candidate.url).origin === origin);
    const domainSelected = selected.filter((candidate) => new URL(candidate.url).origin === origin);
    const selectedKeys = new Set(domainSelected.map((candidate) => normalizeUrlKey(candidate.url)));
    const domainPages = pages.filter((page) => selectedKeys.has(normalizeUrlKey(page.url)));
    const homepageLinks = domainCandidates.filter((candidate) =>
      ['homepage link', 'página inicial'].includes(candidate.source),
    ).length;
    const sitemapLinks = domainCandidates.filter((candidate) =>
      ['sitemap', 'mapa del sitio'].includes(candidate.source),
    ).length;
    return {
      domain: new URL(input).host,
      startUrl: input,
      candidatesDetected: domainCandidates.length,
      homepageLinks,
      sitemapLinks,
      selectedPages: domainSelected.length,
      analyzedPages: domainPages.filter((page) => page.status === 'analyzed').length,
      languageExcludedPages: domainPages.filter((page) => page.exclusionCategory === 'language').length,
      selectionMode: scope === 'page'
        ? (language === 'en' ? 'Exact URL selected by the user' : 'URL exacta indicada por el usuario')
        : randomSample ? (language === 'en' ? 'Random sample of detected pages, including starting and required pages' : 'Muestra aleatoria de páginas detectadas, con la inicial y las obligatorias') : (language === 'en'
            ? 'Local sampling from the initial page and sitemap'
            : 'Muestreo local desde la página inicial y el mapa del sitio'),
    };
  });
}

function pendingPage(candidate, language) {
  const { html: _candidateHtml, ...publicCandidate } = candidate;
  return {
    ...publicCandidate,
    pageId: buildPageId(candidate.url),
    title: candidate.url,
    status: 'pending',
    statusLabel: language === 'en' ? 'pending time limit' : 'pendiente por límite de tiempo',
    reason: language === 'en'
      ? 'Not analyzed before the analysis time limit was reached.'
      : 'No se analizó antes de alcanzar el límite de tiempo del análisis.',
    words: 0,
    sentences: 0,
    syllables: 0,
    score: null,
    level: '-',
    fragments: [],
  };
}

async function analyzePage(candidate, language, minWords, minFragmentWords, exactPageMode = false, timeBudgetMs = LIMITS.fetchTimeoutMs) {
  const { html: _candidateHtml, ...publicCandidate } = candidate;
  const analysisDeadline = Date.now() + timeBudgetMs;
  try {
    let html = candidate.html ?? await fetchHtml(candidate.url, Math.max(1, analysisDeadline - Date.now()));
    const title = extractTitle(html) || candidate.url;
    let textBlocks = extractTextBlocks(html);
    let pageText = extractVisibleText(html);
    let stats = textStats(pageText, language);
    let renderedFallbackUsed = false;
    let renderReason = '';
    const dynamicSignals = candidate.html
      ? { shouldRender: false, reason: '' }
      : detectDynamicContentSignals(html, stats.words, textBlocks.length);
    // Every page with evidence of client-side content is rendered and compared, even when its initial HTML is long enough.
    const shouldRender = !candidate.html && (exactPageMode || dynamicSignals.shouldRender);

    if (shouldRender) {
      let renderedHtml = '';
      try {
        renderedHtml = await fetchRenderedHtml(candidate.url, Math.max(1, analysisDeadline - Date.now()));
      } catch (error) {
        // A size limit is a data-integrity boundary: never replace a complete page with a truncated DOM.
        if (error instanceof Error && error.message === 'PAGE_HTML_TOO_LARGE') throw error;
      }
      if (renderedHtml) {
        const renderedTextBlocks = extractTextBlocks(renderedHtml);
        const renderedPageText = extractVisibleText(renderedHtml);
        const renderedStats = textStats(renderedPageText, language);
        if (renderedStats.words > stats.words) {
          html = renderedHtml;
          textBlocks = renderedTextBlocks;
          pageText = renderedPageText;
          stats = renderedStats;
          renderedFallbackUsed = true;
          renderReason = dynamicSignals.reason;
        }
      }
    }

    if (stats.words < minWords && !renderedFallbackUsed && !exactPageMode) {
      return {
        ...publicCandidate,
        pageId: buildPageId(candidate.url),
        title,
        status: 'discarded',
        statusLabel: language === 'en' ? 'discarded' : 'descartada',
        reason: language === 'en'
          ? `Not enough text: ${stats.words} words.`
          : `Texto insuficiente: ${stats.words} palabras.`,
        words: stats.words,
        sentences: stats.sentences,
        syllables: stats.syllables,
        score: 0,
        level: '-',
        fragments: [],
      };
    }

    const fullTextScore = readabilityScore(stats, language);
    const declaredLanguage = html.match(/<html\b[^>]*\blang\s*=\s*["']([a-z]{2})(?:-[a-z]+)?["']/i)?.[1]?.toLowerCase();
    const detectedPageLanguage = detectTextLanguage(pageText);
    const pageLanguage = detectedPageLanguage === 'unknown' && ['es', 'en'].includes(declaredLanguage)
      ? declaredLanguage
      : detectedPageLanguage;
    const blocks = textBlocks.map((text, index) => {
      const detected = detectTextLanguage(text);
      return { text: text.trim(), sourceIndex: index + 1,
        detectedLanguage: detected === 'unknown' && ['es','en'].includes(declaredLanguage) ? declaredLanguage : detected,
        stats: textStats(text, language) };
    });
    const fragmentCandidates = blocks
      .filter((block) => block.detectedLanguage === language)
      .filter((block) => block.stats.words >= minFragmentWords)
      .map((block) => ({
        text: block.text,
        sourceIndex: block.sourceIndex,
        language: block.detectedLanguage,
        words: block.stats.words,
        sentences: block.stats.sentences,
        syllables: block.stats.syllables,
        score: readabilityScore(block.stats, language),
      }))
      .map((fragment) => ({
        ...fragment,
        rawScore: fragment.score,
        score: round1(fragment.score),
        level: levelForScore(fragment.score, language),
      }));
    // Responsive templates often repeat the same paragraph for separate visual layouts. Keep its first source position only.
    const fragments = deduplicateFragments(fragmentCandidates);
    const extraction = {
      blocksDetected: blocks.length,
      languageExcluded: blocks.filter(block => block.detectedLanguage !== language).length,
      lengthExcluded: blocks.filter(block => block.detectedLanguage === language && block.stats.words < minFragmentWords).length,
      eligible: fragments.length,
      duplicateParagraphsExcluded: fragmentCandidates.length - fragments.length,
      declaredLanguage: declaredLanguage ?? null,
      detectedPageLanguage: pageLanguage,
    };
    if (!fragments.length && pageLanguage !== language) {
      return {
        ...publicCandidate,
        pageId: buildPageId(candidate.url),
        title,
        status: 'discarded',
        statusLabel: language === 'en' ? 'discarded' : 'descartada',
        exclusionCategory: 'language',
        reason: language === 'en'
          ? `Text language (${pageLanguage === 'unknown' ? 'not identified' : pageLanguage}) does not match the selected language.`
          : `El idioma del texto (${pageLanguage === 'unknown' ? 'no identificado' : pageLanguage}) no coincide con el idioma seleccionado.`,
        words: stats.words,
        sentences: stats.sentences,
        syllables: stats.syllables,
        score: null,
        level: '-',
        fragments: [],
        extraction,
      };
    }
    // A page score must reflect all page-level counts, not an average of paragraph scores.
    const pageScore = fullTextScore;

    return {
      ...publicCandidate,
      pageId: buildPageId(candidate.url),
      title,
      status: 'analyzed',
      statusLabel: language === 'en' ? 'analyzed' : 'analizada',
      reason: stats.words < minWords
        ? shortPageReason(language, stats.words, html.length, renderedFallbackUsed)
        : renderedFallbackUsed
          ? renderedPageReason(language, renderReason)
        : '',
      words: stats.words,
      sentences: stats.sentences,
      syllables: stats.syllables,
      score: round1(pageScore),
      rawScore: pageScore,
      level: levelForScore(pageScore, language),
      scoreBasis: 'full_page_text',
      fullTextScore: round1(fullTextScore),
      contentFingerprint: textFingerprint(pageText),
      extraction,
      fragments,
    };
  } catch (error) {
    return {
      ...publicCandidate,
      pageId: buildPageId(candidate.url),
      title: candidate.url,
      status: 'error',
      statusLabel: 'error',
      reason: readableError(error instanceof Error ? error.message : String(error), language),
      words: 0,
      sentences: 0,
      score: 0,
      level: '-',
      fragments: [],
    };
  }
}

function textFingerprint(text) {
  return createHash('sha256')
    .update(String(text).normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase())
    .digest('hex');
}

function detectDynamicContentSignals(html, words, blockCount) {
  const lowerHtml = html.toLowerCase();
  const scriptCount = (html.match(/<script\b/gi) ?? []).length;
  const linkCount = (html.match(/<a\b/gi) ?? []).length;
  const imageCount = (html.match(/<img\b/gi) ?? []).length;
  const cardLikeCount = (lowerHtml.match(/\b(card|teaser|result|item|listing|grid|tile|swiper|carousel|slick|owl-carousel)\b/g) ?? []).length;
  const appShellSignals = [
    '__next_data__',
    'id="__next"',
    'id="root"',
    'id="app"',
    'data-reactroot',
    'ng-app',
    'v-cloak',
    'data-v-',
    'astro-island',
    'svelte',
  ].filter((signal) => lowerHtml.includes(signal)).length;
  const asyncSignals = [
    'fetch(',
    'xmlhttprequest',
    'axios',
    'jquery.ajax',
    'wp-json',
    'rest_route',
    'api/',
  ].filter((signal) => lowerHtml.includes(signal)).length;
  const noscriptHint = /<noscript[\s\S]*?(javascript|enable|activar|habilit|browser)[\s\S]*?<\/noscript>/i.test(html);
  const textDensity = words / Math.max(html.length / 1000, 1);
  const looksLargeButEmpty = html.length > 90000 && words < 120 && textDensity < 2.2;
  const looksLikeListing = linkCount >= 20 && imageCount >= 6 && words < 160 && blockCount < 12;
  // Generic JSON, cards and scripts are common on ordinary server-rendered
  // pages. Rendering is only useful when those signals accompany content that
  // is actually sparse or structurally incomplete in the initial HTML.
  const hasIncompleteInitialText = words < 300 || blockCount < 4;

  const signals = [];
  if (appShellSignals && hasIncompleteInitialText) signals.push('app-shell');
  if (asyncSignals >= 2 && hasIncompleteInitialText) signals.push('async-data');
  if (noscriptHint && hasIncompleteInitialText) signals.push('noscript');
  if (scriptCount >= 18 && words < 160) signals.push('many-scripts');
  if (looksLargeButEmpty) signals.push('low-text-density');
  if (looksLikeListing || (cardLikeCount >= 12 && hasIncompleteInitialText)) signals.push('listing-cards');

  return {
    shouldRender: signals.length > 0,
    reason: signals.join(', '),
  };
}

function renderedPageReason(language, signalReason) {
  const detail = signalReason
    ? (language === 'en'
        ? ` Dynamic-content signals detected: ${signalReason}.`
        : ` Señales detectadas de contenido dinámico: ${signalReason}.`)
    : '';
  return language === 'en'
    ? `Analyzed after rendering the page with a local browser because the initial HTML looked incomplete.${detail}`
    : `Analizada tras renderizar la página con un navegador local porque el HTML inicial parecía incompleto.${detail}`;
}

function shortPageReason(language, words, htmlChars, renderedFallbackUsed = false) {
  const dynamicHint = htmlChars > 200000 && !renderedFallbackUsed
    ? (language === 'en'
        ? ' The page is large but exposes little text in the initial HTML; some visible content may be loaded later by JavaScript.'
        : ' La página es grande pero expone poco texto en el HTML inicial; parte del contenido visible puede cargarse después con JavaScript.')
    : '';
  const renderedHint = renderedFallbackUsed
    ? (language === 'en'
        ? ' The page was rendered with a local browser before analysis.'
        : ' La página se renderizó con un navegador local antes del análisis.')
    : '';
  return language === 'en'
    ? `Short page: ${words} words. Metrics are shown, but interpret them with caution.${dynamicHint}${renderedHint}`
    : `Página breve: ${words} palabras. Se muestran métricas, pero conviene interpretarlas con cautela.${dynamicHint}${renderedHint}`;
}

async function fetchHtml(url, timeoutMs = LIMITS.fetchTimeoutMs) {
  return fetchText(url, 'text/html,application/xhtml+xml', (contentType) =>
    !contentType || contentType.includes('text/html') || contentType.includes('application/xhtml')
  , timeoutMs);
}

async function fetchText(url, accept, isAllowedContentType = () => true, timeoutMs = LIMITS.fetchTimeoutMs) {
  if (timeoutMs <= 0) throw new Error('DISCOVERY_TIME_LIMIT');
  const controller = new AbortController();
  const budgetMs = Math.min(LIMITS.fetchTimeoutMs, timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await awaitWithTimeout(fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'WebReadabilityRadar/1.0 (+local readability analysis)',
        accept,
      },
      redirect: 'follow',
    }), budgetMs, () => controller.abort());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!isAllowedContentType(contentType)) {
      throw new Error('The response content type is not supported.');
    }
    const remainingMs = Math.max(1, budgetMs - (Date.now() - startedAt));
    const text = await awaitWithTimeout(response.text(), remainingMs, () => controller.abort());
    return assertSupportedHtmlSize(text);
  } finally { controller.abort(); }
}

function awaitWithTimeout(promise, timeoutMs, onTimeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout();
      reject(new Error('FETCH_TIMEOUT'));
    }, Math.max(1, timeoutMs));
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

async function fetchRenderedHtml(url, timeoutMs = LIMITS.fetchTimeoutMs + 8000) {
  const browserPath = findLocalBrowser();
  if (!browserPath) return '';
  // A private browser profile per render avoids Chromium's profile lock when
  // several pages are rendered at once during a domain analysis.
  const profileDir = await mkdtemp(join(tmpdir(), 'web-readability-radar-'));
  try {
    const { stdout } = await execFileAsync(browserPath, [
      '--headless=new',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-crash-reporter',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${profileDir}`,
      '--virtual-time-budget=6000',
      '--dump-dom',
      url,
    ], {
      maxBuffer: LIMITS.maxHtmlChars * 2,
      windowsHide: true,
      timeout: Math.max(1, Math.min(LIMITS.fetchTimeoutMs + 8000, timeoutMs)),
    });
    return assertSupportedHtmlSize(String(stdout || ''));
  } finally {
    await rm(profileDir, { recursive: true, force: true });
  }
}

function assertSupportedHtmlSize(html) {
  if (String(html).length > LIMITS.maxHtmlChars) {
    throw new Error('PAGE_HTML_TOO_LARGE');
  }
  return html;
}

function findLocalBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    join(homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    join(homedir(), 'Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'),
    join(homedir(), 'Applications/Chromium.app/Contents/MacOS/Chromium'),
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
    '/snap/bin/chromium',
  ].filter(Boolean);
  const directPath = candidates.find((path) => existsSync(path));
  if (directPath) return directPath;
  return findExecutableOnPath([
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
    'microsoft-edge',
    'msedge',
  ]);
}

function findExecutableOnPath(names) {
  const lookup = process.platform === 'win32' ? 'where' : 'which';
  for (const name of names) {
    try {
      const result = execFileSync(lookup, [name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean);
      if (result) return result;
    } catch {
      // Browser is not available under this command name.
    }
  }
  return '';
}

async function fetchRobotsPolicy(origin, timeoutMs = LIMITS.fetchTimeoutMs) {
  try {
    const text = await fetchText(new URL('/robots.txt', origin).href, 'text/plain,*/*', () => true, timeoutMs);
    return parseRobotsTxt(text);
  } catch {
    return { available: false, sitemapUrls: [], isAllowed: () => true };
  }
}

function parseRobotsTxt(text) {
  const groups = [];
  const sitemapUrls = [];
  let current = null;
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim();
    if (!line) continue;
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();
    if (key === 'sitemap' && value) { sitemapUrls.push(value); continue; }
    if (key === 'user-agent') { current = { agents: [value.toLowerCase()], rules: [] }; groups.push(current); continue; }
    if ((key === 'allow' || key === 'disallow') && current) current.rules.push({ allow: key === 'allow', path: value });
  }
  const exact = groups.filter((group) => group.agents.includes('webreadabilityradar'));
  const wildcard = groups.filter((group) => group.agents.includes('*'));
  const active = exact.length ? exact : wildcard;
  const rules = active.flatMap((group) => group.rules).filter((rule) => rule.path);
  return {
    available: true,
    sitemapUrls: uniqueUrlStrings(sitemapUrls),
    isAllowed(url) {
      const path = `${url.pathname}${url.search}`;
      const matching = rules.filter((rule) => path.startsWith(rule.path));
      if (!matching.length) return true;
      matching.sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
      return matching[0].allow;
    },
  };
}

async function discoverSitemapLinks(origin, declaredSitemaps, scope, robots, deadline = Infinity) {
  const queue = uniqueUrlStrings([
    new URL('/sitemap.xml', origin).href,
    new URL('/sitemap_index.xml', origin).href,
    ...declaredSitemaps,
  ]);
  const discovered = [];
  const visitedSitemaps = new Set();
  let limitReached = false;
  while (queue.length && visitedSitemaps.size < LIMITS.maxSitemapsPerDomain && discovered.length < LIMITS.maxCandidates && Date.now() < deadline) {
    const sitemapUrl = queue.shift();
    const sitemapKey = normalizeUrlKey(sitemapUrl);
    if (visitedSitemaps.has(sitemapKey)) continue;
    visitedSitemaps.add(sitemapKey);
    try {
      const xml = await fetchText(sitemapUrl, 'application/xml,text/xml,*/*', () => true, Math.max(1, deadline - Date.now()));
      for (const href of extractSitemapLocs(xml)) {
        let url;
        try { url = canonicalUrl(href); } catch { continue; }
        if (/\.xml(?:\?.*)?$/i.test(url.pathname)) {
          if (url.origin === origin) queue.push(url.href);
        } else if (scope.includes(url)) {
          discovered.push(url.href);
        }
        if (discovered.length >= LIMITS.maxCandidates) { limitReached = true; break; }
      }
    } catch {
      // An unavailable sitemap is recorded by the coverage summary, not treated as a usable source.
    }
  }
  if (queue.length || visitedSitemaps.size >= LIMITS.maxSitemapsPerDomain) limitReached ||= queue.length > 0;
  return { links: uniqueUrlStrings(discovered).slice(0, LIMITS.maxCandidates), visited: visitedSitemaps.size, limitReached, timeLimitReached: Date.now() >= deadline && queue.length > 0 };
}

async function legacyDiscoverSitemapLinks(startUrl, origin) {
  const queue = [
    new URL('/sitemap.xml', origin).href,
    new URL('/sitemap_index.xml', origin).href,
  ];
  const discovered = [];
  const visitedSitemaps = new Set();

  while (queue.length && discovered.length < LIMITS.maxCandidates) {
    const sitemapUrl = queue.shift();
    const sitemapKey = normalizeUrlKey(sitemapUrl);
    if (visitedSitemaps.has(sitemapKey)) continue;
    visitedSitemaps.add(sitemapKey);

    try {
      const xml = await fetchText(sitemapUrl, 'application/xml,text/xml,*/*');
      const locs = extractSitemapLocs(xml).filter((href) => {
        try {
          return new URL(href).origin === origin;
        } catch {
          return false;
        }
      });

      for (const loc of locs) {
        if (/\.xml(\?.*)?$/i.test(new URL(loc).pathname)) {
          queue.push(loc);
        } else {
          discovered.push(loc);
        }
        if (discovered.length >= LIMITS.maxCandidates) break;
      }
    } catch {
      // Some sites do not expose a sitemap at the standard paths.
    }
  }

  return uniqueUrlStrings(discovered.filter((href) => {
    try {
      const url = new URL(href);
      url.hash = '';
      return url.origin === origin && ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  })).slice(0, LIMITS.maxCandidates);
}

function extractSitemapLocs(xml) {
  const locs = [];
  const pattern = /<loc>\s*([\s\S]*?)\s*<\/loc>/gi;
  let match;
  while ((match = pattern.exec(xml))) {
    locs.push(decodeEntities(match[1]).trim());
  }
  return locs;
}

function parseUrlList(input) {
  return String(input ?? '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (/^https?:\/\//i.test(item) ? item : `https://${item}`))
    .map((item) => {
      const url = new URL(item);
      url.hash = '';
      return url.href;
    });
}

function extractLinks(html, baseUrl) {
  const links = [];
  const pattern = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const href = decodeEntities(match[1]);
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      continue;
    }
    try {
      const url = new URL(href, baseUrl);
      url.hash = '';
      links.push(url.href);
    } catch {
      // ignore invalid links
    }
  }
  return links;
}

function extractTitle(html) {
  const title = findHtmlNodes(parseHtmlDocument(html), 'title')[0];
  return title ? cleanText(nodeText(title)).slice(0, 160) : '';
}

function extractVisibleText(html) {
  return cleanText(nodeText(parseHtmlDocument(html)));
}

function extractTextBlocks(html) {
  // A fragment is a complete semantic paragraph, never a sentence-sized slice or a visual card.
  return findHtmlNodes(parseHtmlDocument(html), 'p').map(node => cleanText(nodeText(node))).filter(Boolean);
}

function parseHtmlDocument(html) {
  const root = { tag: '#document', children: [] };
  const stack = [root];
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
  const rawTags = new Set(['script', 'style', 'noscript', 'svg', 'template']);
  let index = 0;
  const appendText = value => { if (value) stack.at(-1).children.push({ text: value }); };
  while (index < html.length) {
    if (html.startsWith('<!--', index)) { index = html.indexOf('-->', index + 4); index = index < 0 ? html.length : index + 3; continue; }
    if (html[index] !== '<') {
      const end = html.indexOf('<', index);
      appendText(html.slice(index, end < 0 ? html.length : end));
      index = end < 0 ? html.length : end;
      continue;
    }
    let end = index + 1, quote = '';
    while (end < html.length) {
      const character = html[end];
      if (quote) { if (character === quote) quote = ''; }
      else if (character === '"' || character === "'") quote = character;
      else if (character === '>') break;
      end += 1;
    }
    if (end >= html.length) { appendText(html.slice(index)); break; }
    const token = html.slice(index + 1, end).trim();
    index = end + 1;
    if (!token || token.startsWith('!') || token.startsWith('?')) continue;
    if (token.startsWith('/')) {
      const closing = token.slice(1).trim().toLowerCase();
      for (let cursor = stack.length - 1; cursor > 0; cursor -= 1) {
        if (stack[cursor].tag === closing) { stack.length = cursor; break; }
      }
      continue;
    }
    const tag = token.split(/[\s/>]/, 1)[0].toLowerCase();
    if (!tag) continue;
    const node = { tag, children: [] };
    stack.at(-1).children.push(node);
    if (rawTags.has(tag)) {
      const closing = `</${tag}`;
      const lower = html.toLowerCase();
      const closeAt = lower.indexOf(closing, index);
      index = closeAt < 0 ? html.length : (html.indexOf('>', closeAt) + 1 || html.length);
      continue;
    }
    if (!voidTags.has(tag) && !token.endsWith('/')) stack.push(node);
  }
  return root;
}

function findHtmlNodes(root, tag) {
  const nodes = [];
  // A header can be a page hero with real prose. Navigation remains excluded independently.
  const excluded = new Set(['script', 'style', 'noscript', 'svg', 'template', 'nav', 'footer', 'aside', 'form', 'dialog']);
  const visit = (node, excludedAncestor = false) => {
    if (!node.tag) return;
    const hidden = excludedAncestor || excluded.has(node.tag);
    if (node.tag === tag && !hidden) nodes.push(node);
    for (const child of node.children ?? []) visit(child, hidden);
  };
  visit(root);
  return nodes;
}

function nodeText(node, excludedAncestor = false) {
  if (node.text !== undefined) return excludedAncestor ? '' : decodeEntities(node.text);
  const excluded = new Set(['script', 'style', 'noscript', 'svg', 'template', 'nav', 'footer', 'aside', 'form', 'dialog']);
  const hidden = excludedAncestor || excluded.has(node.tag);
  return (node.children ?? []).map(child => nodeText(child, hidden)).join(' ');
}

function cleanText(text) {
  const normalized = decodeEntities(text)
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1');
  // A trailing image credit is page metadata, not prose for a readability score.
  return normalized
    .replace(/\s*[\[(]\s*(?:imagen|foto|fotograf[ií]a|image|photo|cr[eé]dito|fuente)\s*:\s*[^\])]+[\])]\s*$/iu, '')
    .trim();
}

function decodeEntities(text) {
  const entities = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    aacute: 'á',
    eacute: 'é',
    iacute: 'í',
    oacute: 'ó',
    uacute: 'ú',
    ntilde: 'ñ',
    Aacute: 'Á',
    Eacute: 'É',
    Iacute: 'Í',
    Oacute: 'Ó',
    Uacute: 'Ú',
    Ntilde: 'Ñ',
  };
  return String(text)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-zA-Z]+);/g, (full, name) => entities[name] ?? full);
}

function boundedInteger(input, fallback, minimum, maximum, label) {
  const value = input === undefined || input === '' ? fallback : Number(input);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw Object.assign(new Error(`${label}: ${minimum}-${maximum} (integer / entero).`), {statusCode: 400});
  }
  return value;
}

function selectHardestFragments(fragments, limit) {
  // Paragraph identity, not its wording, defines a distinct fragment. Repeated notices remain distinct content.
  const unique = new Map();
  for (const fragment of fragments) {
    const key = fragment.fragmentId ?? `${fragment.pageUrl ?? ''}\n${fragment.sourceIndex ?? ''}`;
    if (!unique.has(key)) unique.set(key, fragment);
  }
  return [...unique.values()].sort(compareFragmentDifficulty).slice(0, limit);
}

function deduplicateFragments(fragments) {
  const seen = new Set();
  return fragments.filter((fragment) => {
    const key = String(fragment.text).normalize('NFC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('es');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function spanishTokens(text) {
  // Decimal groups remain one number; punctuation still delimits sentence segments.
  const tokens = String(text).normalize('NFC').toLowerCase().match(/\b(?:v\.g|p\.ej)(?=\.|\s|$)|\p{L}+(?:[-'\u2010\u2011]\p{L}+)*|\p{N}+(?:[.,]\p{N}+)*|[\p{Sc}\p{Sm}%@#&\u2030\u00a7\u00a9\u00ae]/gu) ?? [];
  const abbreviations = new Set(['sr','sra','srta','dr','dra','av','avda','etc','fig','vg','v','g','pta','ptas','p','pag','pág','pags','págs','ud','uds','d','dña','prof','profa','núm','num']);
  return tokens.map(token => ({ text: token,
    syllables: !/\p{L}/u.test(token) || abbreviations.has(token) || ['v.g','p.ej'].includes(token) ? 1 : countSpanishSyllables(token.replace(/[\u2010\u2011]/g, '-')) }));
}

function textStats(text, language) {
  if (language !== 'en') {
    const tokens = spanishTokens(text);
    const sentences = spanishSentenceSegments(text).length;
    return { words: tokens.length, sentences, syllables: tokens.reduce((sum, token) => sum + token.syllables, 0) };
  }
  const words = englishTokens(text);
  const sentenceCount = Math.max(1, (text.match(/[.!?]+(\s|$)/g) ?? []).length);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word, language), 0);
  return {
    words: words.length,
    sentences: sentenceCount,
    syllables: Math.max(syllables, words.length),
  };
}

function spanishSentenceSegments(text) {
  // Domains, URLs and decimal values contain periods or commas that are not sentence boundaries.
  const protectedText = String(text)
    .replace(/\b(?:https?:\/\/|www\.)[^\s<>()]+/giu, ' enlace ')
    .replace(/\b[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)+\b/gu, ' dominio ')
    .replace(/\b\p{N}+(?:[.,]\p{N}+)+\b/gu, ' número ');
  return protectedText
    .split(/[.;:¿?¡!\u2014]+/u)
    .filter(segment => spanishTokens(segment).length > 0);
}

function detectTextLanguage(text) {
  const words = (text.toLowerCase().match(/[a-záéíóúüñàèìòùâêîôûäëïöüç]+(?:['-][a-záéíóúüñàèìòùâêîôûäëïöüç]+)?/gi) ?? [])
    .map((word) => word.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    .filter((word) => word.length > 1);
  if (!words.length) return 'unknown';

  const samples = new Set(words.slice(0, 180));
  const hasSpanishChars = /[áéíóúüñ¿¡]/i.test(text);
  const hasFrenchChars = /[àâæçéèêëîïôœùûüÿ]/i.test(text);
  const dictionaries = {
    es: ['de', 'la', 'el', 'los', 'las', 'que', 'en', 'y', 'del', 'para', 'con', 'una', 'por', 'universidad', 'estudiantes', 'investigacion', 'formacion'],
    en: ['the', 'and', 'of', 'to', 'in', 'for', 'with', 'that', 'this', 'are', 'is', 'students', 'research', 'university', 'education', 'through'],
    fr: ['de', 'la', 'le', 'les', 'des', 'du', 'et', 'en', 'pour', 'avec', 'une', 'dans', 'est', 'universite', 'recherche', 'enseignement', 'etudiants'],
  };
  const scores = Object.fromEntries(
    Object.entries(dictionaries).map(([lang, markers]) => [lang, markers.filter((marker) => samples.has(marker)).length]),
  );

  if (hasSpanishChars) scores.es += 2;
  if (hasFrenchChars) scores.fr += 2;
  if (/\b(the|and|of|to|with|through|research|students|university)\b/i.test(text)) scores.en += 2;
  if (/\b(el|los|las|que|para|universidad|estudiantes|investigacion)\b/i.test(text)) scores.es += 2;
  if (/\b(le|les|des|dans|universite|recherche|enseignement|etudiants)\b/i.test(text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) scores.fr += 2;

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (ranked[0][1] === 0 || ranked[0][1] === ranked[1][1]) return 'unknown';
  return ranked[0][0];
}

function countSyllables(word, language) {
  if (language !== 'en') return countSpanishSyllables(word);
  return countEnglishSyllables(word);
}

function englishTokens(text) {
  return String(text).match(/(?:[A-Za-z](?:\.[A-Za-z])+(?:\.)?|[A-Za-z]+(?:['’\-][A-Za-z]+)*|\d+(?:[.,]\d+)*)/g) ?? [];
}

function countEnglishSyllables(word) {
  const normalized = normalizeEnglishToken(word);
  if (!normalized) return 0;
  const cache = globalThis.ENGLISH_SYLLABLE_CACHE ?? (globalThis.ENGLISH_SYLLABLE_CACHE = new Map());
  if (cache.has(normalized)) return cache.get(normalized);

  const result = resolveEnglishSyllables(normalized, /^[A-Z]{2,8}$/.test(String(word)));
  cache.set(normalized, result);
  return result;
}

function englishSyllableSource(word) {
  const normalized = normalizeEnglishToken(word);
  if (!normalized) return 'none';
  if (/^\d+(?:[.,]\d+)*$/.test(normalized)) return 'numeric';
  if (englishDictionaryCounts(normalized)
    ?? englishDictionaryCounts(normalized.replace(/'s$/, ''))
    ?? englishDictionaryCounts(normalized.replace(/s'$/, 's'))) return 'cmudict';
  if (normalized.includes('-')) {
    const sources = normalized.split('-').filter(Boolean).map(englishSyllableSource);
    return sources.every((source) => source === 'cmudict') ? 'cmudict_compound' : 'heuristic';
  }
  if (/^[a-z](?:\.[a-z])+(?:\.)?$/.test(normalized) || /^[A-Z]{2,8}$/.test(String(word))) return 'acronym';
  return 'heuristic';
}

function normalizeEnglishToken(word) {
  const normalized = String(word)
    .normalize('NFC')
    .replace(/[’]/g, "'")
    .toLowerCase();
  if (/^[a-z](?:\.[a-z])+\.$/.test(normalized)) return normalized;
  return normalized.replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
}

function englishDictionaryCounts(word) {
  const entries = globalThis.ENGLISH_SYLLABLE_DICTIONARY;
  const counts = entries?.[word];
  return Array.isArray(counts) && counts.length ? counts : null;
}

function resolveEnglishSyllables(word, uppercaseAcronym = false) {
  if (/^\d+(?:[.,]\d+)*$/.test(word)) return 1;

  const counts = englishDictionaryCounts(word)
    ?? englishDictionaryCounts(word.replace(/'s$/, ''))
    ?? englishDictionaryCounts(word.replace(/s'$/, 's'));
  // CMUdict order is the documented deterministic pronunciation policy.
  if (counts) return counts[0];

  if (word.includes('-')) {
    return word.split('-').filter(Boolean).reduce((sum, part) => sum + resolveEnglishSyllables(part), 0);
  }

  if (/^[a-z](?:\.[a-z])+(?:\.)?$/.test(word)) {
    return [...word.replace(/\./g, '')].reduce((sum, letter) => sum + acronymLetterSyllables(letter), 0);
  }

  if (uppercaseAcronym && /^[a-z]{2,8}$/.test(word)) {
    return [...word].reduce((sum, letter) => sum + acronymLetterSyllables(letter), 0);
  }

  return heuristicEnglishSyllables(word);
}

function acronymLetterSyllables(letter) {
  return {a:1,b:1,c:1,d:1,e:1,f:1,g:1,h:1,i:1,j:1,k:1,l:1,m:1,n:1,o:1,p:1,q:1,r:1,s:1,t:1,u:1,v:1,w:3,x:1,y:1,z:1}[letter] ?? 1;
}

function heuristicEnglishSyllables(word) {
  let token = word.replace(/'s$|s'$/g, '').replace(/[^a-z]/g, '');
  if (!token) return 1;
  if (token.length <= 3) return 1;

  let count = (token.match(/[aeiouy]+/g) ?? []).length;
  if (/e$/.test(token) && !/(?:[^aeiou]le|[^aeiou]ye)$/.test(token)) count--;
  if (/(?:[^aeiou]ed)$/.test(token) && !/(?:ted|ded)$/.test(token)) count--;
  if (/(?:[^sxz]|ch|sh)es$/.test(token) && !/(?:ches|shes|ses|xes|zes|ges|ces)$/.test(token)) count--;
  if (/(?:ia|io|eo|ua|ui|iu)/.test(token)) count++;
  if (/^mc/.test(token)) count++;
  return Math.max(1, count);
}

function normalizeSpanishSyllableToken(word) {
  return String(word).normalize('NFC').toLowerCase().replace(/[^a-záéíóúüñ'-]/g, '');
}

function spanishDictionarySyllables(word) {
  const count = globalThis.SPANISH_SYLLABLE_DICTIONARY?.[word];
  return Number.isInteger(count) && count > 0 ? count : null;
}

function spanishSyllableSource(word) {
  const normalized = normalizeSpanishSyllableToken(word);
  if (!normalized) return 'none';
  return spanishDictionarySyllables(normalized) === null ? 'heuristic' : 'pylabeador';
}

function countSpanishSyllables(word) {
  const normalized = normalizeSpanishSyllableToken(word);
  if (!normalized) return 0;
  const cache = globalThis.SPANISH_SYLLABLE_CACHE ?? (globalThis.SPANISH_SYLLABLE_CACHE = new Map());
  if (cache.has(normalized)) return cache.get(normalized);
  const result = spanishDictionarySyllables(normalized) ?? heuristicSpanishSyllables(normalized);
  cache.set(normalized, result);
  return result;
}

function heuristicSpanishSyllables(word) {
  // Preserve stress marks: stripping them merges hiatuses such as pa-is and di-a.
  const parts = String(word).normalize('NFC').toLowerCase().split(/[-']/);
  return parts.reduce((total, part) => {
    const normalized = part.replace(/[^a-záéíóúüñ]/g, '')
      .replace(/([qg])u(?=[eéií])/g, '$1')
      .replace(/y$/g, 'i');
    if (!normalized) return total;
    const runs = normalized.match(/[aeiouáéíóúü](?:h?[aeiouáéíóúü])*/g) ?? [];
    const base = vowel => vowel.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const open = vowel => /[aeoáéó]/.test(vowel);
    const weak = vowel => /[iuü]/.test(vowel);
    const diphthong = (a, b) => base(a) !== base(b)
      && !(open(a) && open(b))
      && !((open(a) && /[íú]/.test(b)) || (/[íú]/.test(a) && open(b)));
    let count = 0;
    for (const run of runs) {
      const vowels = run.replace(/h/g, '');
      for (let i = 0; i < vowels.length;) {
        if (i + 2 < vowels.length && weak(vowels[i]) && open(vowels[i + 1]) && weak(vowels[i + 2])) i += 3;
        else if (i + 1 < vowels.length && diphthong(vowels[i], vowels[i + 1])) i += 2;
        else i += 1;
        count += 1;
      }
    }
    return total + Math.max(1, count);
  }, 0);
}

function readabilityScore(stats, language) {
  if (!stats.words || !stats.sentences) return 0;
  const wordsPerSentence = stats.words / stats.sentences;
  const syllablesPerWord = stats.syllables / stats.words;

  if (language === 'en') {
    return Math.min(100, 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord);
  }

  return Math.min(100, 206.835 - 62.3 * syllablesPerWord - wordsPerSentence);
}

function classificationRules(language) {
  const rows = language === 'en'
    ? [[90,'Very easy','green'],[80,'Easy','green'],[70,'Fairly easy','lime'],[60,'Plain English','amber'],[50,'Fairly difficult','orange'],[30,'Difficult','red'],[null,'Very difficult','red']]
    : [[80,'Muy fácil','green'],[65,'Bastante fácil','lime'],[55,'Normal','amber'],[40,'Algo difícil','orange'],[null,'Muy difícil','red']];
  return rows.map(([minimum,label,color]) => ({minimum,label,color}));
}

function levelForScore(score, language) {
  return classificationRules(language).find(row => row.minimum === null || score >= row.minimum).label;
}

function uniqueByUrl(items) {
  const unique = new Map();
  for (const item of items) {
    const key = normalizeUrlKey(item.url);
    const existing = unique.get(key);
    if (!existing) { unique.set(key, item); continue; }
    existing.mandatory ||= item.mandatory;
    existing.eligible = existing.eligible !== false && item.eligible !== false;
    existing.depth = Math.min(existing.depth ?? Infinity, item.depth ?? Infinity);
    existing.discoverySources = [...new Set([...(existing.discoverySources ?? [existing.source]), ...(item.discoverySources ?? [item.source])])];
  }
  return [...unique.values()];
}

function uniqueUrlStrings(urls) {
  const seen = new Set();
  const unique = [];
  for (const href of urls) {
    const url = new URL(href);
    url.hash = '';
    const key = normalizeUrlKey(url.href);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(url.href);
  }
  return unique;
}

function normalizeUrlKey(url) {
  try {
    const normalized = canonicalUrl(url);
    normalized.pathname = normalized.pathname.replace(/\/+$/, '') || '/';
    return normalized.href;
  } catch {
    return String(url).replace(/\/$/, '');
  }
}

function safeLocalHtmlName(name) {
  const clean = String(name || 'uploaded-page.html').replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '');
  return clean || 'uploaded-page.html';
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function buildPageId(url) {
  return `P-${shortHash(normalizeUrlKey(url))}`;
}

function buildFragmentId(url, index, text) {
  return `${buildPageId(url)}-F${String(index + 1).padStart(4, '0')}-${shortHash(text)}`;
}

function shortHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
}

function readableError(message, language = 'en') {
  if (message === 'PAGE_HTML_TOO_LARGE') {
    return language === 'es'
      ? 'La página supera el límite de 6.000.000 de caracteres y no se ha analizado parcialmente.'
      : 'The page exceeds the 6,000,000-character limit and was not partially analyzed.';
  }
  if (/abort/i.test(message)) return 'Request timed out.';
  if (/fetch failed/i.test(message)) return 'Could not connect to the website.';
  return message;
}

function sendDemo(response, language) {
  const isEnglish = language === 'en';
  const title = isEnglish ? 'Plain language demo page' : 'Página de ejemplo de lectura clara';
  const body = isEnglish
    ? 'This page contains a short paragraph written in plain English. It is intended to test the local readability analyzer. Short sentences usually improve the Flesch Reading Ease score. Longer sentences with technical terms can make a text harder to read and understand.'
    : 'Esta página contiene un párrafo breve escrito en lenguaje claro. Sirve para probar el analizador local de lecturabilidad. Las frases cortas suelen facilitar la lectura. Los textos largos y técnicos pueden resultar más difíciles de comprender.';
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html><html lang="${language}"><head><title>${title}</title></head><body><main><h1>${title}</h1><p>${body}</p><p>${body}</p></main></body></html>`);
}
