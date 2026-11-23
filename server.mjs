import { createServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec, execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir, homedir } from 'node:os';
import { createHash, randomBytes, webcrypto } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createReadabilityCore, MAX_HTML_CHARS, processingFingerprintMaterial } from './public/core/readability-core.mjs';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(rootDir, 'public');
const englishSyllableDictionaryPath = join(rootDir, 'resources', 'cmudict-syllables.json');
const englishSyllableData = JSON.parse(readFileSync(englishSyllableDictionaryPath, 'utf8'));
const spanishSyllableDictionaryPath = join(rootDir, 'resources', 'pylabeador-syllables.json');
const spanishSyllableData = JSON.parse(readFileSync(spanishSyllableDictionaryPath, 'utf8'));
const readabilityCore = createReadabilityCore({
  englishSyllableDictionary: englishSyllableData.entries,
  spanishSyllableDictionary: spanishSyllableData.entries,
  crypto: webcrypto,
});
const execFileAsync = promisify(execFile);
const analysisJobs = new Map();
const REMOTE_BRIDGE_ORIGINS = new Set([
  'https://readabilityradar.com',
  'https://www.readabilityradar.com',
]);
const BLOCKED_BRIDGE_PORTS = new Set([22, 25, 53, 110, 143, 2375, 2376, 3306, 3389, 5432, 6379, 8080, 8443]);

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
  // An exact page may need one network retrieval plus a local-browser render.
  // It is deliberately independent from the former multi-page deadline.
  exactPageAnalysisBudgetMs: 40000,
  maxAnalysisConcurrency: 8,
  // Modern home pages can legitimately grow after client-side rendering. The complete document is accepted or rejected; it is never truncated.
  maxHtmlChars: MAX_HTML_CHARS,
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
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
    if (request.method === 'GET' && url.pathname === '/api/dictionary') {
      const language = url.searchParams.get('language') === 'en' ? 'en' : 'es';
      sendJson(response, 200, language === 'en' ? englishSyllableData.entries : spanishSyllableData.entries);
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/analyze') {
      const body = await readJson(request);
      const requestPolicy = { publicBridge: isRemoteBridgeRequest(request) };
      // Reject a private target before accepting a background job. The same
      // check is repeated inside analyze() for defence in depth.
      if (requestPolicy.publicBridge) await assertPublicBridgeInputs(body);
      if (body.background === true) {
        const job = startAnalysisJob(body, requestPolicy);
        sendJson(response, 202, { jobId: job.id });
        return;
      }
      const result = await analyze(body, () => {}, requestPolicy);
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

    if (request.method === 'GET' && (url.pathname === '/demo/es' || url.pathname === '/demo/en')) {
      await serveStatic(`${url.pathname}.html`, response);
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
listen(requestedPort, requestedPort === 8787 ? [55481] : []);

async function loadSyllableValidation(language) {
  try {
    const [snapshotSource, coreSource, serverSource] = await Promise.all([
      readFile(join(publicDir, 'syllable-validation.json'), 'utf8'),
      readFile(join(publicDir, 'core', 'readability-core.mjs'), 'utf8'),
      readFile(join(rootDir, 'server.mjs'), 'utf8'),
    ]);
    const snapshots = JSON.parse(snapshotSource);
    const data = snapshots[language];
    if (!data || data.version !== 'current_radar') return null;
    const dictionary = language === 'en' ? englishSyllableData.entries : spanishSyllableData.entries;
    const processingSha256 = createHash('sha256').update(processingFingerprintMaterial(coreSource, dictionary)).digest('hex');
    const serverSha256 = createHash('sha256').update(serverSource).digest('hex');
    return {
      data,
      matchesCurrentProcessing: data.processing_sha256 === processingSha256,
      matchesCurrentServer: data.server_sha256 === serverSha256,
    };
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
    // Packaged desktop apps should open the local edition automatically. The
    // source launcher retains the explicit --open switch for development.
    if (process.argv.includes('--open') || process.pkg) {
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

function isRemoteBridgeRequest(request) {
  return REMOTE_BRIDGE_ORIGINS.has(request.headers.origin);
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

function startAnalysisJob(body, requestPolicy = {}) {
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
      const result = await analyze(body, (progress) => { job.progress = progress; }, requestPolicy);
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

async function analyze(body, onProgress = () => {}, requestPolicy = {}) {
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

  if (requestPolicy.publicBridge) await assertPublicBridgeInputs(body, inputs, exactUrls);

  if (!inputs.length && !localHtml) {
    throw new Error(language === 'en' ? 'Enter at least one URL.' : 'Introduce al menos una URL.');
  }

  const crawlPolicy = completeMode
    ? { maxPages: LIMITS.maxCandidates, maxDepth: null, mode: 'complete', timeBudgetMs: estimateOnly ? LIMITS.estimateDiscoveryBudgetMs : LIMITS.completeDiscoveryBudgetMs }
    : { maxPages: LIMITS.maxCrawlPagesPerDomain, maxDepth: LIMITS.maxCrawlDepth, mode: 'fast', timeBudgetMs: LIMITS.estimateDiscoveryBudgetMs };
  onProgress({ phase: 'discovery', completed: 0, total: null });
  const domainDiscovery = !localHtml && scope === 'domain'
    ? await buildDomainCandidates(inputs, exactUrls, language, includeRelatedSubdomains, crawlPolicy, requestPolicy)
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
          analysisDeadline === null
            ? (scope === 'page' ? LIMITS.exactPageAnalysisBudgetMs : LIMITS.fetchTimeoutMs + 8000)
            : Math.max(1, analysisDeadline - Date.now()),
          requestPolicy,
        );
        processedPages += 1;
        onProgress({ phase: 'analysis', completed: processedPages, total: selected.length });
      }
    }
    await Promise.all(Array.from({ length: Math.min(LIMITS.maxAnalysisConcurrency, selected.length) }, worker));
    for (let index = 0; index < selected.length; index += 1) {
      if (!pageSlots[index]) {
        pageSlots[index] = await pendingPage(selected[index], language);
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
  const allFragments = await Promise.all(pages.flatMap((page) =>
    page.fragments.map(async (fragment, index) => ({
      ...fragment,
      fragmentId: await buildFragmentId(page.url, index, fragment.text),
      index: fragment.sourceIndex ?? index + 1,
      pageTitle: page.title,
      pageUrl: page.url,
      link: page.url,
    })),
  ));
  const fragments = fragmentLimit ? selectHardestFragments(allFragments, fragmentLimit) : allFragments.sort(compareFragmentDifficulty);
  // Fragments are returned once, in the top-level collection. Keeping their
  // full text again inside every page doubles large JSON responses and can make
  // a browser unresponsive on comprehensive audits.
  const resultPages = pages.map((page) => ({
    ...page,
    fragmentCount: page.fragments.length,
    fragments: [],
  }));
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
    samplingFrame: await Promise.all(candidates.map(async (candidate) => {
      const selectedCandidate = selected.find((item) => normalizeUrlKey(item.url) === normalizeUrlKey(candidate.url));
      const page = pages.find((item) => normalizeUrlKey(item.url) === normalizeUrlKey(candidate.url));
      return {
        url: candidate.url,
        pageId: await buildPageId(candidate.url),
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
    })),
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
      maxPagesLabel: scope === 'page'
        ? (language === 'en' ? 'Exact URL or local HTML' : 'URL exacta o HTML local')
        : completeMode
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
    pages: resultPages,
    fragments,
  };
}

async function assertPublicBridgeInputs(body, inputs = parseUrlList(body.input), exactUrls = parseUrlList(body.exactUrls)) {
  await Promise.all([...inputs, ...exactUrls].map(assertPublicBridgeUrl));
}

async function buildDomainCandidates(inputs, exactUrls, language, includeRelatedSubdomains, crawlPolicy, requestPolicy = {}) {
  const candidates = [];
  const domains = [];
  for (const startUrl of inputs) {
    const discovered = await discoverDomain(startUrl, exactUrls, language, includeRelatedSubdomains, crawlPolicy, requestPolicy);
    candidates.push(...discovered.candidates);
    domains.push(discovered.domain);
  }
  return {
    candidates: uniqueByUrl(candidates).slice(0, LIMITS.maxCandidates),
    domains,
    coverage: { maxCrawlPagesPerDomain: crawlPolicy.maxPages, maxCrawlDepth: crawlPolicy.maxDepth, maxCandidates: LIMITS.maxCandidates, timeBudgetMs: crawlPolicy.timeBudgetMs, mode: crawlPolicy.mode, includeRelatedSubdomains },
  };
}

async function discoverDomain(startUrl, exactUrls, language, includeRelatedSubdomains, crawlPolicy, requestPolicy = {}) {
  const start = new URL(startUrl);
  const scope = createDomainScope(start, includeRelatedSubdomains);
  const discoveryDeadline = Date.now() + crawlPolicy.timeBudgetMs;
  const remainingDiscoveryMs = () => Math.max(0, discoveryDeadline - Date.now());
  const robots = await fetchRobotsPolicy(start.origin, remainingDiscoveryMs(), requestPolicy);
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
      robotsPolicies.set(origin, await fetchRobotsPolicy(origin, remaining, requestPolicy));
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
  const sitemapResult = await discoverSitemapLinks(start.origin, robots.sitemapUrls, scope, robots, discoveryDeadline, requestPolicy);
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
      const html = await fetchHtml(current.url, remainingDiscoveryMs(), requestPolicy);
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
  return readabilityCore.canonicalUrl(value);
}

function sectionForUrl(url, startHost) {
  return readabilityCore.sectionForUrl(url, startHost);
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

async function pendingPage(candidate, language) {
  const { html: _candidateHtml, ...publicCandidate } = candidate;
  return {
    ...publicCandidate,
    pageId: await buildPageId(candidate.url),
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

async function analyzePage(candidate, language, minWords, minFragmentWords, exactPageMode = false, timeBudgetMs = LIMITS.fetchTimeoutMs, requestPolicy = {}) {
  const { html: _candidateHtml, ...publicCandidate } = candidate;
  const analysisDeadline = Date.now() + timeBudgetMs;
  let pageId = '';
  try {
    pageId = await buildPageId(candidate.url);
    let html = candidate.html ?? await fetchHtml(candidate.url, Math.max(1, analysisDeadline - Date.now()), requestPolicy);
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
    // A request coming from the public web page must never make Chromium fetch
    // subresources or redirects on behalf of a remote caller. Native/local use
    // retains the full dynamic-rendering capability.
    const shouldRender = !candidate.html && !requestPolicy.publicBridge && (exactPageMode || dynamicSignals.shouldRender);

    if (shouldRender) {
      let renderedHtml = '';
      try {
        renderedHtml = await fetchRenderedHtml(candidate.url, Math.max(1, analysisDeadline - Date.now()), requestPolicy);
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
        pageId,
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

    const processed = await readabilityCore.analyzeHtmlContent({
      html,
      url: candidate.url,
      language,
      minFragmentWords,
      rendering: renderedFallbackUsed ? 'rendered' : 'static',
    });
    pageId = processed.pageId;
    pageText = processed.pageText;
    stats = processed.stats;
    const fullTextScore = processed.fullTextScore;
    const pageLanguage = processed.detectedPageLanguage;
    const fragments = processed.fragments;
    const extraction = processed.extraction;
    if (!fragments.length && pageLanguage !== language) {
      return {
        ...publicCandidate,
        pageId,
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
      pageId,
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
      contentFingerprint: processed.contentFingerprint,
      extraction,
      fragments,
    };
  } catch (error) {
    return {
      ...publicCandidate,
      pageId: pageId || await buildPageId(candidate.url),
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

async function fetchHtml(url, timeoutMs = LIMITS.fetchTimeoutMs, requestPolicy = {}) {
  return fetchText(url, 'text/html,application/xhtml+xml', (contentType) =>
    !contentType || contentType.includes('text/html') || contentType.includes('application/xhtml')
  , timeoutMs, requestPolicy);
}

async function fetchText(url, accept, isAllowedContentType = () => true, timeoutMs = LIMITS.fetchTimeoutMs, requestPolicy = {}) {
  if (timeoutMs <= 0) throw new Error('DISCOVERY_TIME_LIMIT');
  const budgetMs = Math.min(LIMITS.fetchTimeoutMs, timeoutMs);
  // A browser request from the public edition reaches this local service over
  // Private Network Access. Give it a separate transport: each connection is
  // pinned to an address we have just resolved and checked. This prevents a
  // DNS-rebinding host from resolving to a public IP during validation and a
  // private IP when Node opens the connection.
  if (requestPolicy.publicBridge) {
    return fetchPublicBridgeText(url, accept, isAllowedContentType, budgetMs);
  }
  const startedAt = Date.now();
  const target = new URL(url);
  const maxRedirects = 0;
  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const controller = new AbortController();
    try {
      const remainingMs = Math.max(1, budgetMs - (Date.now() - startedAt));
      const response = await awaitWithTimeout(fetch(target, {
        signal: controller.signal,
        headers: {
          'user-agent': 'WebReadabilityRadar/1.1.0 (+local readability analysis)',
          accept,
        },
        redirect: 'follow',
      }), remainingMs, () => controller.abort());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get('content-type') ?? '';
      if (!isAllowedContentType(contentType)) throw new Error('The response content type is not supported.');
      const text = await awaitWithTimeout(response.text(), Math.max(1, budgetMs - (Date.now() - startedAt)), () => controller.abort());
      return assertSupportedHtmlSize(text);
    } finally {
      controller.abort();
    }
  }
  throw new Error('TOO_MANY_REDIRECTS');
}

async function fetchPublicBridgeText(value, accept, isAllowedContentType, timeoutMs) {
  const startedAt = Date.now();
  let target = await resolvePublicBridgeTarget(value);
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    const remainingMs = Math.max(1, timeoutMs - (Date.now() - startedAt));
    const response = await requestPinnedPublicTarget(target, accept, remainingMs);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.location;
      if (!location) throw new Error('REDIRECT_WITHOUT_DESTINATION');
      target = await resolvePublicBridgeTarget(new URL(Array.isArray(location) ? location[0] : location, target.url).href);
      continue;
    }
    if (response.status < 200 || response.status >= 300) throw new Error(`HTTP ${response.status}`);
    const contentType = String(response.headers['content-type'] ?? '');
    if (!isAllowedContentType(contentType)) throw new Error('The response content type is not supported.');
    return assertSupportedHtmlSize(response.text);
  }
  throw new Error('TOO_MANY_REDIRECTS');
}

function requestPinnedPublicTarget(target, accept, timeoutMs) {
  return new Promise((resolve, reject) => {
    const { url, address, family } = target;
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)({
      protocol: url.protocol,
      hostname,
      port: url.port || undefined,
      path: `${url.pathname}${url.search}`,
      method: 'GET',
      // Never reuse a socket selected for a previous hostname. The custom
      // lookup pins this request to the verified public address above.
      agent: false,
      lookup: (_name, _options, callback) => callback(null, address, family),
      ...(url.protocol === 'https:' ? { servername: hostname } : {}),
      headers: {
        host: url.host,
        'user-agent': 'WebReadabilityRadar/1.1.0 (+local readability analysis)',
        accept,
      },
    });
    let settled = false;
    const finish = (handler, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      handler(value);
    };
    const timer = setTimeout(() => request.destroy(new Error('FETCH_TIMEOUT')), Math.max(1, timeoutMs));
    request.once('error', error => finish(reject, error));
    request.once('response', response => {
      const chunks = [];
      let byteLength = 0;
      response.on('data', chunk => {
        byteLength += chunk.length;
        // UTF-8 can require up to four bytes per JavaScript character. This
        // is a strict pre-decode ceiling equivalent to the shared text limit.
        if (byteLength > MAX_HTML_CHARS * 4) {
          response.destroy(new Error('PAGE_HTML_TOO_LARGE'));
          return;
        }
        chunks.push(chunk);
      });
      response.once('error', error => finish(reject, error));
      response.once('end', () => finish(resolve, {
        status: response.statusCode ?? 0,
        headers: response.headers,
        text: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    request.end();
  });
}

async function assertPublicBridgeUrl(value) {
  return (await resolvePublicBridgeTarget(value)).url;
}

async function resolvePublicBridgeTarget(value) {
  let url;
  try {
    url = new URL(String(value));
  } catch {
    throw bridgeAddressError();
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || isPrivateBridgeHost(url.hostname) || isBlockedBridgePort(url.port)) {
    throw bridgeAddressError();
  }
  url.hash = '';
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  let addresses;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw bridgeAddressError();
  }
  if (!addresses.length || addresses.some(({ address }) => isPrivateBridgeAddress(address))) {
    throw bridgeAddressError();
  }
  // `lookup` reports the address family, which lets requestPinnedPublicTarget
  // bypass a second DNS lookup without weakening TLS hostname validation.
  return { url, address: addresses[0].address, family: addresses[0].family };
}

function bridgeAddressError() {
  return Object.assign(new Error('The public web edition can only retrieve public http(s) addresses.'), { statusCode: 400 });
}

function isPrivateBridgeHost(hostname) {
  const host = String(hostname).toLowerCase().replace(/^\[|\]$/g, '');
  return host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || isPrivateBridgeAddress(host);
}

function isPrivateBridgeAddress(value) {
  const address = String(value).toLowerCase().replace(/^\[|\]$/g, '');
  if (isIP(address) === 4) {
    const [first, second, third] = address.split('.').map(Number);
    return first === 0 || first === 10 || first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 0 && third === 0) ||
      (first === 192 && second === 0 && third === 2) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19)) ||
      (first === 198 && second === 51 && third === 100) ||
      (first === 203 && second === 0 && third === 113) ||
      first >= 224;
  }
  if (isIP(address) !== 6) return false;
  if (address === '::' || address === '::1' || /^f[cd]/i.test(address) || /^fe[89ab]/i.test(address) || /^ff/i.test(address) || /^2001:db8:/i.test(address)) return true;
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  return mapped ? isPrivateBridgeAddress(mapped[1]) : false;
}

function isBlockedBridgePort(port) {
  if (!port) return false;
  const number = Number(port);
  return !Number.isInteger(number) || number < 1 || number > 65535 || BLOCKED_BRIDGE_PORTS.has(number);
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

async function fetchRenderedHtml(url, timeoutMs = LIMITS.fetchTimeoutMs + 8000, requestPolicy = {}) {
  if (requestPolicy.publicBridge) return '';
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
  return readabilityCore.assertSupportedHtmlSize(html);
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

async function fetchRobotsPolicy(origin, timeoutMs = LIMITS.fetchTimeoutMs, requestPolicy = {}) {
  try {
    const text = await fetchText(new URL('/robots.txt', origin).href, 'text/plain,*/*', () => true, timeoutMs, requestPolicy);
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

async function discoverSitemapLinks(origin, declaredSitemaps, scope, robots, deadline = Infinity, requestPolicy = {}) {
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
      const xml = await fetchText(sitemapUrl, 'application/xml,text/xml,*/*', () => true, Math.max(1, deadline - Date.now()), requestPolicy);
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
  return readabilityCore.extractTitle(html);
}

function extractVisibleText(html) {
  return readabilityCore.extractVisibleText(html);
}

function extractTextBlocks(html) {
  return readabilityCore.extractTextBlocks(html);
}

function decodeEntities(text) {
  return readabilityCore.decodeEntities(text);
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

function textStats(text, language) {
  return readabilityCore.textStats(text, language);
}

function detectTextLanguage(text) {
  return readabilityCore.detectTextLanguage(text);
}

function countSyllables(word, language) {
  return readabilityCore.countSyllables(word, language);
}

function englishSyllableSource(word) {
  return readabilityCore.englishSyllableSource(word);
}

function spanishSyllableSource(word) {
  return readabilityCore.spanishSyllableSource(word);
}

function readabilityScore(stats, language) {
  return readabilityCore.readabilityScore(stats, language);
}

function classificationRules(language) {
  return readabilityCore.classificationRules(language);
}

function levelForScore(score, language) {
  return readabilityCore.levelForScore(score, language);
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
  return readabilityCore.normalizeUrlKey(url);
}

function safeLocalHtmlName(name) {
  const clean = String(name || 'uploaded-page.html').replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '');
  return clean || 'uploaded-page.html';
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round1(value) {
  return readabilityCore.round1(value);
}

async function buildPageId(url) {
  return readabilityCore.buildPageId(url);
}

async function buildFragmentId(url, index, text) {
  return readabilityCore.buildFragmentId(url, index, text);
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
