import { analyzeOnline } from './online-analyzer.js';
import { processingFingerprintMaterial } from './core/readability-core.mjs';

const STRINGS = {
  es: {
    brandSubtitle: 'Lecturabilidad y accesibilidad cognitiva',
    title: 'Web Readability Radar',
    lede: 'Explora dominios o páginas concretas en español, explica qué URLs se analizan y localiza fragmentos que necesitan atención.',
    whatAnalyze: 'Qué quieres analizar',
    whatAnalyzeHelp: 'Elige un dominio, una página web concreta o un archivo HTML guardado en tu equipo.',
    domainMode: 'Dominio',
    pageMode: 'Una página',
    domainInitial: 'Dominio inicial',
    exactPage: 'URL exacta',
    mainInputHelp: 'Escribe una dirección web. Dominio busca páginas mediante el mapa del sitio y enlaces internos; Una página revisa solo la URL indicada.',
    domainHint: 'Puedes escribir uno o varios dominios, uno por línea.',
    pageHint: 'Se analizará la única URL escrita aquí; no se rastrea el resto del dominio.',
    pageHintLocal: 'Se analizarán las URL escritas aquí; no se rastrea el resto de sus dominios.',
    onlineSinglePageOnly: 'La edición web analiza una sola URL cada vez. Para varias URLs o un dominio completo, abre la aplicación local.',
    mandatoryPages: 'Páginas obligatorias',
    mandatoryHelp: 'Estas URLs se incluyen siempre en el análisis si pertenecen al dominio analizado.',
    mandatoryHint: 'Opcional: se incluirán siempre dentro del análisis del dominio.',
    includeSubdomains: 'Incluir subdominios relacionados',
    includeSubdomainsHelp: 'Está desactivado por defecto. Solo incorpora hosts HTTPS o HTTP cuyo nombre termina en el mismo dominio registrable, por ejemplo investigacion.ejemplo.es desde ejemplo.es. No incorpora dominios externos ni demuestra que los subdominios compartan una misma función institucional.',
    includeSubdomainsHint: 'Opcional. Solo añade subdominios bajo el mismo dominio registrable; no incluye dominios externos.',
    localHtml: 'HTML local',
    localHtmlHelp: 'Permite analizar una versión HTML guardada en este equipo. Máximo: 6.000.000 de caracteres; no ejecuta sus scripts.',
    localHtmlHint: 'Selecciona el archivo HTML guardado en tu equipo que quieres analizar.',
    clearHtml: 'Quitar archivo',
    prepareHtml: 'Preparar archivo',
    missingHtml: 'Selecciona un archivo HTML antes de analizar.',
    invalidHtml: 'Elige un archivo con extensión .html o .htm.',
    unreadableHtml: 'No se puede abrir el archivo seleccionado. Puede haberse movido o eliminado. Selecciónalo de nuevo, o elige Una página para analizar una URL.',
    emptyHtml: 'El archivo está vacío. Selecciona un HTML con contenido.',
    invalidUrl: 'Introduce una dirección web válida, por ejemplo https://www.example.com. Para un archivo guardado en tu equipo, elige HTML local.',
    connectionError: 'No se pudo conectar con la aplicación local. Comprueba que su ventana de arranque siga abierta y vuelve a intentarlo.',
    samplingSettings: 'Ajustes de extracción',
    settingsHelp: 'Estos dos ajustes opcionales determinan qué textos entran en el análisis. Puedes dejarlos como están.',
    sampleSize: 'Alcance',
    minWords: 'Palabras pág.',
    minFragmentWords: 'Palabras frag.',
    actions: 'Acciones',
    actionsHelp: 'Puedes estimar primero o ejecutar el análisis completo.',
    estimate: 'Estimar candidatas',
    preparePage: 'Preparar página',
    analyze: 'Analizar ahora',
    example: 'Cargar ejemplo',
    legalTitle: 'Base legal y técnica',
    legalHelp: 'Explica el alcance de la evaluación. No equivale a una certificación de accesibilidad ni legal.',
    legalText: 'Evalúa la legibilidad lingüística de contenido textual mediante fórmulas reproducibles.',
    legalRefs: 'Marco contextual: WCAG, EN 301 549, Real Decreto 1112/2018 y normas UNE vinculadas a lectura fácil. El resultado no verifica por sí solo el cumplimiento de estos requisitos.',
    tabPanel: 'Resumen',
    tabExplore: 'Explorar',
    tabFragments: 'Fragmentos',
    tabPages: 'Páginas',
    tabSampling: 'Muestreo',
    tabCriteria: 'Metodología',
    readyBadge: 'Lista para usar',
    emptyTitle: 'Una nueva revisión',
    emptyText: 'Puedes revisar un dominio, una página web concreta o un archivo HTML guardado en tu equipo.',
    reportView: 'Vista de informe',
    candidates: 'Candidatas',
    selected: 'Seleccionadas',
    analyzed: 'Analizadas',
    fragments: 'Fragmentos',
    totalFragments: 'Total fragmentos',
    selectedFragments: 'Fragmentos seleccionados',
    selectedForReview: 'Muestra para revisar',
    featureLevels: 'Tres fuentes',
    featureLevelsText: 'Dominio, página o HTML local.',
    featureTrace: 'Trazabilidad',
    featureTraceText: 'Origen y motivo de selección por URL.',
    featureExport: 'Exportación',
    featureExportText: 'CSV de páginas, muestreo y fragmentos.',
    avgReadability: 'Puntuación promedio',
    detected: 'Detectadas',
    inSample: 'Seleccionadas',
    withMetrics: 'Con métricas',
    lowThreshold: 'Bajo umbral',
    domains: 'Dominios',
    trafficLight: 'Semáforo',
    trafficSummary: 'Semáforo de fragmentos',
    trafficSummaryText: 'Distribución de fragmentos por categoría de dificultad',
    action: 'Acción',
    redStatus: 'Rojo',
    amberStatus: 'Amarillo',
    greenStatus: 'Verde',
    redAction: 'Muy difícil',
    amberAction: 'Normal',
    greenAction: 'Muy fácil',
    redMeaning: 'Puede presentar barreras de comprensión.',
    amberMeaning: 'Puede requerir simplificación puntual.',
    greenMeaning: 'Lectura dentro del umbral previsto.',
    pages: 'Páginas',
    pagesSubtitle: 'Puntuación calculada con los recuentos totales del texto de cada URL',
    downloadPages: 'Descargar páginas',
    downloadFragments: 'Descargar fragmentos',
    downloadSampling: 'Descargar muestreo',
    downloadWorkbook: 'Excel completo',
    downloadBriefReport: 'Informe breve',
    downloadFullReport: 'Informe extenso',
    reportsTitle: 'Informes',
    briefReportSummary: 'Resumen de resultados y criterios aplicados.',
    fullReportSummary: 'Resultados completos, páginas, fragmentos y referencias.',
    fragmentsTitle: 'Fragmentos detectados',
    fragmentsSubtitle: 'Cada fragmento conserva un párrafo completo. Se muestran todos los fragmentos elegibles, ordenados por dificultad.',
    sortFragments: 'Ordenar',
    sortPages: 'Ordenar',
    sortHardest: 'Más difíciles primero',
    sortEasiest: 'Más fáciles primero',
    sortLongest: 'Más largos primero',
    sortShortest: 'Más cortos primero',
    openFragment: 'Abrir origen',
    samplingTitle: 'Marco muestral',
    criteriaTitle: 'Criterios aplicados',
    source: 'Origen',
    status: 'Estado',
    words: 'Palabras',
    score: 'Szigriszt',
    level: 'INFLESZ',
    decision: 'Decisión',
    selectedDecision: 'Seleccionada',
    notSelectedDecision: 'No seleccionada',
    reason: 'Motivo',
    metric: 'Métrica',
    scope: 'Nivel de análisis',
    generated: 'Generado',
    noFragments: 'No hay fragmentos suficientes.',
    estimatePending: 'Ejecuta “Analizar ahora” para calcular métricas y fragmentos.',
    analyzing: 'Analizando páginas',
    estimating: 'Estimando candidatas',
    loadingDetailEstimate: 'Leyendo robots.txt, sitemaps y enlaces internos por secciones.',
    loadingDetailAnalyze: 'Leyendo páginas, filtrando idioma y calculando lecturabilidad.',
    loadingStepSitemap: 'Sitemap',
    loadingStepPages: 'Páginas',
    loadingStepMetrics: 'Métricas',
    loadingStepFile: 'Leer archivo',
    loadingStepPage: 'Abrir página',
    loadingStepText: 'Extraer texto',
    loadingDetailSourceEstimate: 'Comprobando la fuente elegida antes de analizarla.',
    loadingNoteComplete: 'El análisis de dominio procesa todas las URLs seleccionadas. Puede tardar varios minutos en dominios grandes; cada página inaccesible tiene un límite propio para que el proceso continúe.',
    error: 'No se pudo completar el análisis.',
    pageFilename: 'paginas_lecturabilidad.csv',
    fragmentFilename: 'fragmentos_lecturabilidad.csv',
    samplingFilename: 'muestreo_lecturabilidad.csv',
    sample: 'https://www.example.com',
    samplePage: 'https://www.example.com/page',
  },
  en: {
    brandSubtitle: 'Readability and cognitive accessibility',
    title: 'Web Readability Radar',
    lede: 'Analyze domains or specific pages in English, explain which URLs are analyzed, and locate fragments that need attention.',
    whatAnalyze: 'What do you want to analyze',
    whatAnalyzeHelp: 'Choose a domain, one web page, or an HTML file saved on your computer.',
    domainMode: 'Domain',
    pageMode: 'One page',
    domainInitial: 'Initial domain',
    exactPage: 'Exact URL',
    mainInputHelp: 'Enter a web address. Domain finds pages through the sitemap and internal links; One page reviews only the entered URL.',
    domainHint: 'You can enter one or more domains, one per line.',
    pageHint: 'The single URL entered here will be analyzed; the rest of the domain will not be crawled.',
    pageHintLocal: 'The URLs entered here will be analyzed; their domains will not be crawled.',
    onlineSinglePageOnly: 'The web edition analyzes one URL at a time. For several URLs or a complete domain, open the local application.',
    mandatoryPages: 'Required pages',
    mandatoryHelp: 'These URLs are always included in the analysis if they belong to the analyzed domain.',
    mandatoryHint: 'Optional: these pages will always be included in the domain analysis.',
    includeSubdomains: 'Include related subdomains',
    includeSubdomainsHelp: 'Off by default. It only includes HTTP or HTTPS hosts ending in the same registrable domain, for example research.example.org from example.org. It never includes external domains and does not prove that subdomains serve the same institutional function.',
    includeSubdomainsHint: 'Optional. Adds only subdomains under the same registrable domain; external domains stay out.',
    localHtml: 'Local HTML',
    localHtmlHelp: 'Analyze an HTML version saved on this computer. Maximum: 6,000,000 characters; its scripts are not run.',
    localHtmlHint: 'Select the saved HTML file you want to analyze.',
    clearHtml: 'Remove file',
    prepareHtml: 'Prepare file',
    missingHtml: 'Select an HTML file before starting the analysis.',
    invalidHtml: 'Choose a file with the .html or .htm extension.',
    unreadableHtml: 'The selected file cannot be opened. It may have been moved or deleted. Select it again, or choose One page to analyze a URL.',
    emptyHtml: 'The file is empty. Select an HTML file with content.',
    invalidUrl: 'Enter a valid web address, for example https://www.example.com. To analyze a saved file, choose Local HTML.',
    connectionError: 'The local application could not be reached. Check that its launcher window is still open, then try again.',
    samplingSettings: 'Extraction settings',
    settingsHelp: 'These optional settings determine which texts enter the analysis. You can leave them unchanged.',
    sampleSize: 'Scope',
    minWords: 'Page words',
    minFragmentWords: 'Fragment words',
    actions: 'Actions',
    actionsHelp: 'You can estimate first or run the full analysis.',
    estimate: 'Estimate candidates',
    preparePage: 'Prepare page',
    analyze: 'Analyze now',
    example: 'Load example',
    legalTitle: 'Legal and technical basis',
    legalHelp: 'Explains the scope of the evaluation. It is not an accessibility or legal certification.',
    legalText: 'Evaluates the linguistic readability of textual content using reproducible formulas.',
    legalRefs: 'Contextual references: WCAG, EN 301 549, public-sector accessibility rules and plain-language guidance. The result does not by itself verify compliance with these requirements.',
    tabPanel: 'Summary',
    tabExplore: 'Explore',
    tabFragments: 'Fragments',
    tabPages: 'Pages',
    tabSampling: 'Sampling',
    tabCriteria: 'Methodology',
    readyBadge: 'Ready to use',
    emptyTitle: 'A new review',
    emptyText: 'Review a domain, one web page, or an HTML file saved on your computer.',
    reportView: 'Report view',
    candidates: 'Candidates',
    selected: 'Selected',
    analyzed: 'Analyzed',
    fragments: 'Fragments',
    totalFragments: 'Total fragments',
    selectedFragments: 'Selected fragments',
    selectedForReview: 'Sample for review',
    featureLevels: 'Three sources',
    featureLevelsText: 'Domain, web page, or local HTML.',
    featureTrace: 'Traceability',
    featureTraceText: 'Source and selection reason by URL.',
    featureExport: 'Export',
    featureExportText: 'CSV for pages, sampling, and fragments.',
    avgReadability: 'Mean page score',
    detected: 'Detected',
    inSample: 'Selected',
    withMetrics: 'With metrics',
    lowThreshold: 'Low threshold',
    domains: 'Domains',
    trafficLight: 'Traffic light',
    trafficSummary: 'Fragment traffic light',
    trafficSummaryText: 'Fragment distribution by difficulty category',
    action: 'Action',
    redStatus: 'Red',
    amberStatus: 'Yellow',
    greenStatus: 'Green',
    redAction: 'Difficult or very difficult',
    amberAction: 'Plain English',
    greenAction: 'Easy or very easy',
    redMeaning: 'May create comprehension barriers.',
    amberMeaning: 'May need targeted simplification.',
    greenMeaning: 'Reading level is within the expected threshold.',
    pages: 'Pages',
    pagesSubtitle: 'Score calculated from the total text counts for each URL',
    downloadPages: 'Download pages',
    downloadFragments: 'Download fragments',
    downloadSampling: 'Download sampling',
    downloadWorkbook: 'Excel workbook',
    downloadBriefReport: 'Brief report',
    downloadFullReport: 'Full report',
    reportsTitle: 'Reports',
    briefReportSummary: 'Results summary and applied criteria.',
    fullReportSummary: 'Complete results, pages, fragments and references.',
    fragmentsTitle: 'Detected fragments',
    fragmentsSubtitle: 'Each fragment preserves one complete paragraph. All eligible fragments are shown, sorted by difficulty.',
    sortFragments: 'Sort',
    sortPages: 'Sort',
    sortHardest: 'Hardest first',
    sortEasiest: 'Easiest first',
    sortLongest: 'Longest first',
    sortShortest: 'Shortest first',
    openFragment: 'Open source',
    samplingTitle: 'Sampling frame',
    criteriaTitle: 'Applied criteria',
    source: 'Source',
    status: 'Status',
    words: 'Words',
    score: 'Flesch',
    level: 'Level',
    decision: 'Decision',
    selectedDecision: 'Selected',
    notSelectedDecision: 'Not selected',
    reason: 'Reason',
    metric: 'Metric',
    scope: 'Analysis level',
    generated: 'Generated',
    noFragments: 'No fragments with enough text.',
    estimatePending: 'Run “Analyze now” to calculate metrics and fragments.',
    analyzing: 'Analyzing pages',
    estimating: 'Estimating candidates',
    loadingDetailEstimate: 'Reading robots.txt, sitemaps, and internal links across sections.',
    loadingDetailAnalyze: 'Reading pages, filtering language, and calculating readability.',
    loadingStepSitemap: 'Sitemap',
    loadingStepPages: 'Pages',
    loadingStepMetrics: 'Metrics',
    loadingStepFile: 'Read file',
    loadingStepPage: 'Open page',
    loadingStepText: 'Extract text',
    loadingDetailSourceEstimate: 'Checking the selected source before analysis.',
    loadingNoteComplete: 'Complete-domain analysis processes every selected URL. Large domains can take several minutes; each inaccessible page has its own limit so processing can continue.',
    error: 'The analysis could not be completed.',
    pageFilename: 'readability_pages.csv',
    fragmentFilename: 'readability_fragments.csv',
    samplingFilename: 'readability_sampling.csv',
    sample: 'https://www.example.com',
    samplePage: 'https://www.example.com/page',
  },
};

let language = detectBrowserLanguage();
let analysisLanguage = language;
// The Cloudflare edition has no durable job store. It returns one bounded
// analysis response directly; the local server retains its progress polling.
// The local server retains its complete Node/browser workflow. Any deployed
// version calculates in the visitor's browser and uses the Worker only as a
// guarded HTML proxy.
const cloudflareFreeEdition = !/^(?:localhost|127\.0\.0\.1|\[::1\])$/i.test(window.location.hostname);
const TURNSTILE_SITE_KEY = '0x4AAAAAAGFHr7he3XXoXQGL';
let turnstileWidgetId = null;
let turnstileLoader = null;
const processingFingerprintLoaders = new Map();

async function getTurnstileToken() {
  if (!cloudflareFreeEdition || executionMode === 'local') return '';
  const target = document.querySelector('#turnstileWidget');
  if (!target) throw new Error(language === 'es' ? 'No se pudo preparar la comprobación de seguridad.' : 'Security verification could not be prepared.');
  const turnstile = await waitForTurnstile();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(language === 'es' ? 'La comprobación de seguridad ha tardado demasiado. Vuelve a intentarlo.' : 'Security verification took too long. Please try again.')), 20_000);
    const finish = (callback) => (value) => {
      window.clearTimeout(timeout);
      if (turnstileWidgetId !== null) {
        turnstile.remove(turnstileWidgetId);
        turnstileWidgetId = null;
      }
      callback(value);
    };
    turnstileWidgetId = turnstile.render(target, {
      sitekey: TURNSTILE_SITE_KEY,
      // "invisible" is not a valid size in the current Turnstile API. Keep the
      // challenge out of the way for legitimate visitors, showing it only if
      // Cloudflare needs interaction.
      size: 'flexible',
      appearance: 'interaction-only',
      execution: 'execute',
      action: 'readability-fetch',
      'response-field': false,
      callback: finish(resolve),
      'error-callback': finish(() => reject(new Error(language === 'es' ? 'No se pudo completar la comprobación de seguridad. Vuelve a intentarlo.' : 'Security verification could not be completed. Please try again.'))),
      'timeout-callback': finish(() => reject(new Error(language === 'es' ? 'La comprobación de seguridad ha caducado. Vuelve a intentarlo.' : 'Security verification expired. Please try again.'))),
    });
    turnstile.execute(turnstileWidgetId);
  });
}

function waitForTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!cloudflareFreeEdition) {
    return Promise.reject(new Error(language === 'es'
      ? 'La comprobación de seguridad solo se carga para la edición en línea.'
      : 'Security verification is only loaded for the online edition.'));
  }
  if (!turnstileLoader) {
    turnstileLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.turnstile) resolve(window.turnstile);
        else reject(new Error(language === 'es'
          ? 'No se pudo cargar la comprobación de seguridad. Comprueba tu conexión e inténtalo de nuevo.'
          : 'Security verification could not load. Check your connection and try again.'));
      };
      script.onerror = () => reject(new Error(language === 'es'
        ? 'No se pudo cargar la comprobación de seguridad. Comprueba tu conexión e inténtalo de nuevo.'
        : 'Security verification could not load. Check your connection and try again.'));
      document.head.append(script);
    }).catch((error) => {
      // A temporary network failure should not poison the next user attempt.
      turnstileLoader = null;
      throw error;
    });
  }
  return turnstileLoader;
}

async function currentProcessingFingerprint(requestedLanguage) {
  if (!window.crypto?.subtle) return null;
  const languageKey = requestedLanguage === 'en' ? 'en' : 'es';
  if (!processingFingerprintLoaders.has(languageKey)) {
    processingFingerprintLoaders.set(languageKey, (async () => {
      const [coreResponse, dictionaryResponse] = await Promise.all([
        fetch(new URL('./core/readability-core.mjs', import.meta.url), { cache: 'no-store' }),
        fetch(`/api/dictionary?language=${languageKey}`, { cache: 'no-store' }),
      ]);
      if (!coreResponse.ok || !dictionaryResponse.ok) return null;
      const [coreSource, dictionarySource] = await Promise.all([coreResponse.text(), dictionaryResponse.text()]);
      const dictionary = JSON.parse(dictionarySource);
      const material = new TextEncoder().encode(processingFingerprintMaterial(coreSource, dictionary));
      const digest = await window.crypto.subtle.digest('SHA-256', material);
      return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    })().catch(() => null));
  }
  return processingFingerprintLoaders.get(languageKey);
}
const LOCAL_ENGINE_CANDIDATES = ['http://127.0.0.1:8787', 'http://127.0.0.1:55481'];
const RELEASES_PAGE = 'https://github.com/snavasleon/readabilityradar.com/releases/latest';
const LOCAL_ENGINE_FILES = {
  windows: 'https://github.com/snavasleon/readabilityradar.com/releases/latest/download/Web-Readability-Radar.exe',
};

function localEngineDownload() {
  const agent = `${navigator.userAgent || ''} ${navigator.platform || ''}`;
  if (/windows/i.test(agent)) {
    return { href: LOCAL_ENGINE_FILES.windows, es: 'Descargar aplicación para Windows', en: 'Download app for Windows' };
  }
  return { href: RELEASES_PAGE, supported: false, es: 'Disponible solo para Windows', en: 'Available for Windows only' };
}

let privacyAccepted = false;
let analysisLanguageConfirmed = false;
let executionMode = cloudflareFreeEdition ? 'online' : 'local';
let searchVisibilityMode = false;
let localEngineBase = null;
let localEngineWatcher = null;
let localEngineChecking = false;
let pendingLocalJob = null;
let scope = 'page';
let inputSource = 'url';
let analysisRunning = false;
let activeTab = 'panel';
let lastResult = null;
let localSourceText = '';
let fragmentSort = 'hardest';
let pageSort = 'hardest';
let fragmentFilter = 'all';
const FRAGMENTS_PER_PAGE = 50;
let visibleFragmentCount = FRAGMENTS_PER_PAGE;

const form = document.querySelector('#analyzerForm');
const results = document.querySelector('#results');
const tabs = document.querySelector('#tabs');
const inputUrls = document.querySelector('#inputUrls');
const exactUrls = document.querySelector('#exactUrls');
const includeSubdomains = document.querySelector('#includeSubdomains');
const htmlFile = document.querySelector('#htmlFile');
const clearHtmlButton = document.querySelector('#clearHtmlButton');
const scopeButtons = [...document.querySelectorAll('[data-scope]')];
const maxPagesInput = document.querySelector('#maxPages');
const estimateButton = document.querySelector('#estimateButton');
const privacyDialog = document.querySelector('#privacyDialog');
const analysisLanguageDialog = document.querySelector('#analysisLanguageDialog');
const executionModeDialog = document.querySelector('#executionModeDialog');
const privacyAccept = document.querySelector('#privacyAccept');
const analysisLanguageAccept = document.querySelector('#analysisLanguageAccept');
const fullDomainDownload = document.querySelector('#fullDomainDownload');
const checkLocalEngine = document.querySelector('#checkLocalEngine');
const executionModeStatus = document.querySelector('#executionModeStatus');
const engineStatus = document.querySelector('#engineStatus');

const helpBubble = document.createElement('div');
helpBubble.id = 'contextHelp';
helpBubble.className = 'context-help-bubble';
helpBubble.setAttribute('role', 'tooltip');
helpBubble.hidden = true;
document.body.append(helpBubble);
function showHelp(target) {
  const text = target.dataset.help || target.dataset.title;
  if (!text) return;
  helpBubble.textContent = text;
  helpBubble.hidden = false;
  const rect = target.getBoundingClientRect();
  helpBubble.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - helpBubble.offsetWidth - 12))}px`;
  helpBubble.style.top = `${Math.max(12, Math.min(rect.bottom + 8, innerHeight - helpBubble.offsetHeight - 12))}px`;
  target.setAttribute('aria-describedby', helpBubble.id);
}
document.addEventListener('click', event => {
  const target = event.target.closest('.info-dot');
  if (target) { event.preventDefault(); showHelp(target); }
  else helpBubble.hidden = true;
  const menu = document.querySelector('#reportDownload');
  if (!event.target.closest('#reportDownload')) menu.open = false;
});
document.addEventListener('focusin', event => { if (event.target.matches('.info-dot')) showHelp(event.target); });
document.addEventListener('mouseover', event => { const target=event.target.closest('.info-dot'); if(target) showHelp(target); });
document.addEventListener('mouseout', event => { if(event.target.closest('.info-dot') && !event.relatedTarget?.closest?.('.info-dot')) helpBubble.hidden=true; });
document.addEventListener('focusout', () => { helpBubble.hidden = true; });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { helpBubble.hidden = true; document.querySelector('#reportDownload').open = false; }
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('span.info-dot')) { event.preventDefault(); showHelp(event.target); }
});
window.addEventListener('scroll', () => { helpBubble.hidden = true; }, true);

applyLanguage();
syncScope();
showPrivacyDialog();

privacyAccept.addEventListener('click', () => {
  privacyAccepted = true;
  privacyDialog.hidden = true;
  showAnalysisLanguageDialog();
});

analysisLanguageAccept.addEventListener('click', async () => {
  const selected = document.querySelector('input[name="analysisLanguage"]:checked');
  analysisLanguage = selected?.value === 'en' ? 'en' : 'es';
  analysisLanguageConfirmed = true;
  analysisLanguageDialog.hidden = true;
  executionMode = 'online';
  localEngineBase = null;
  finishIntroduction();
});

fullDomainDownload.addEventListener('click', () => watchForLocalEngine());
checkLocalEngine.addEventListener('click', () => void connectFullDomain());

scopeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    if (mode === 'domain') {
      void connectFullDomain();
      return;
    }
    searchVisibilityMode = false;
    inputSource = mode === 'html' ? 'html' : 'url';
    scope = 'page';
    if (inputSource !== 'html') htmlFile.value = '';
    syncScope();
    resetResults();
  });
});

document.querySelector('#exampleButton').addEventListener('click', () => {
  inputSource = 'url';
  scope = 'page';
  htmlFile.value = '';
  exactUrls.value = '';
  inputUrls.value = `${location.origin}/demo/${analysisLanguage}`;
  syncScope();
  resetResults();
  runAnalysis(false);
});

clearHtmlButton.addEventListener('click', () => {
  htmlFile.value = '';
  syncScope();
  resetResults();
});

form.addEventListener('input', (event) => {
  if (event.target === htmlFile) syncScope();
  if (lastResult || results.querySelector('.error-panel')) resetResults();
});

htmlFile.addEventListener('change', () => {
  syncScope();
  resetResults();
});

estimateButton.addEventListener('click', async () => {
  await runAnalysis(true);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await runAnalysis(false);
});

tabs.addEventListener('click', (event) => {
  const area = event.target.closest('[data-area]');
  if (area) {
    activeTab = area.dataset.area === 'explore' ? 'fragments' : area.dataset.area;
    renderResult();
    return;
  }
  const reportChoice = event.target.closest('[data-report-kind]');
  if (reportChoice && lastResult && !lastResult.estimateOnly) {
    document.querySelector('#reportDownload').open = false;
    if(reportChoice.dataset.reportKind === 'workbook') downloadWorkbook(lastResult);
    else downloadReport(lastResult, reportChoice.dataset.reportKind);
    return;
  }
  const button = event.target.closest('[data-tab]');
  if (!button) return;
  activeTab = button.dataset.tab;
  [...tabs.querySelectorAll('.tab')].forEach((tab) => tab.classList.toggle('active', tab === button));
  renderResult();
});

function syncScope() {
  const dictionary = STRINGS[language];
  const activeSource = inputSource === 'html' ? 'html' : scope;
  scopeButtons.forEach((button) => {
    const active = button.dataset.mode === activeSource;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelector('#urlInputBlock').classList.toggle('hidden', inputSource === 'html');
  document.querySelectorAll('.html-only').forEach((item) => item.classList.toggle('hidden', inputSource !== 'html'));
  clearHtmlButton.classList.toggle('hidden', !htmlFile.files.length);
  htmlFile.title = htmlFile.files[0]?.name ?? dictionary.localHtmlHint;
  htmlFile.disabled = analysisRunning || inputSource !== 'html';
  inputUrls.disabled = analysisRunning || inputSource === 'html';
  exactUrls.disabled = analysisRunning || scope !== 'domain';
  includeSubdomains.disabled = analysisRunning || scope !== 'domain';
  document.querySelectorAll('.domain-only').forEach((item) => item.classList.toggle('hidden', scope === 'page'));
  document.querySelectorAll('.page-only').forEach((item) => item.classList.toggle('hidden', scope !== 'page'));
  document.querySelector('.sample-size-field')?.classList.toggle('hidden', scope === 'page');
  document.querySelector('#mainInputLabel').textContent = scope === 'page' ? dictionary.exactPage : dictionary.domainInitial;
  const localPageEdition = cloudflareFreeEdition && executionMode === 'local';
  document.querySelector('#mainInputHint').textContent = scope === 'page'
    ? (localPageEdition ? dictionary.pageHintLocal : dictionary.pageHint)
    : dictionary.domainHint;
  // Preparing candidates is meaningful only when a local complete-domain run
  // will analyse several URLs afterwards. For one URL or a local HTML file it
  // produced a legitimate but misleading "0 analysed" report.
  estimateButton.classList.toggle('hidden', inputSource === 'html' || scope === 'page');
  estimateButton.querySelector('span:last-child').textContent = inputSource === 'html' ? dictionary.prepareHtml : scope === 'page' ? dictionary.preparePage : dictionary.estimate;
  syncScopeLimitField();
  renderModeChoices();
}

function renderModeChoices() {
  const es = language === 'es';
  const copy = {
    page: es ? ['Una página web', 'Analiza una URL concreta.'] : ['One web page', 'Analyse one exact URL.'],
    html: es ? ['Archivo HTML', 'Analiza un archivo de tu equipo.'] : ['HTML file', 'Analyse a file from your computer.'],
    domain: es ? ['Dominio completo', 'Requiere la aplicación local.'] : ['Complete domain', 'Requires the local application.'],
  };
  scopeButtons.forEach((button) => {
    const [title, description] = copy[button.dataset.mode];
    button.querySelector('strong').textContent = title;
    button.querySelector('small').textContent = description;
  });
}

function resetResults() {
  const dictionary = STRINGS[language];
  lastResult = null;
  activeTab = 'panel';
  tabs.classList.add('hidden');
  results.innerHTML = `
    <div class="empty-layout">
      <section class="intro-card">
        <div>
          <span class="soft-badge">${escapeHtml(dictionary.readyBadge)}</span>
          <h2>${escapeHtml(dictionary.emptyTitle)}</h2>
          <p>${escapeHtml(dictionary.emptyText)}</p>
        </div>
      </section>
    </div>
  `;
}

function applyLanguage() {
  const dictionary = STRINGS[language];
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (dictionary[key]) node.textContent = dictionary[key];
  });
  document.querySelectorAll('[data-i18n-title]').forEach((node) => {
    const key = node.dataset.i18nTitle;
    if (dictionary[key]) { node.dataset.title = dictionary[key]; node.setAttribute('aria-label', dictionary[key]); }
    node.tabIndex = 0;
    node.setAttribute('role', 'button');
  });
  syncScopeLimitField();
  syncScope();
}

function detectBrowserLanguage() {
  const preferred = [...(navigator.languages ?? []), navigator.language].filter(Boolean);
  const recognized = preferred.find((locale) => /^(es|en)(-|$)/i.test(String(locale)));
  return recognized?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

function showPrivacyDialog() {
  const isSpanish = language === 'es';
  document.querySelector('main').inert = true;
  document.querySelector('#privacyEyebrow').textContent = isSpanish ? 'Bienvenida a Web Readability Radar' : 'Welcome to Web Readability Radar';
  document.querySelector('#privacyTitle').textContent = isSpanish ? 'Antes de comenzar' : 'Before you begin';
  document.querySelector('#privacyBody').innerHTML = isSpanish
    ? '<p>Esta herramienta analiza la dificultad lingüística de páginas web y archivos HTML para localizar contenido que conviene revisar. Antes de elegir el idioma del análisis, te informamos de cómo se tratan los datos.</p><h3>Privacidad y protección de datos</h3><p>Web Readability Radar procesa las URLs, el HTML local y los resultados únicamente para realizar el análisis solicitado.</p><ul><li>No crea cuentas ni perfiles, no utiliza publicidad ni cookies de seguimiento y no guarda resultados en una base de datos.</li><li>Los datos se mantienen temporalmente en memoria durante la ejecución y se eliminan al entregar el resultado. Las páginas solicitadas se consultan directamente desde este equipo.</li><li>No introduzcas información personal, confidencial o de terceros sin una base legítima para tratarla.</li></ul><p>Este aviso informa del tratamiento mínimo necesario conforme a los principios de transparencia y minimización. No sustituye la política de privacidad de la organización que use la herramienta.</p>'
    : '<p>This tool analyzes the linguistic difficulty of web pages and HTML files to identify content that may need review. Before you choose the analysis language, it explains how data is handled.</p><h3>Privacy and data protection</h3><p>Web Readability Radar processes URLs, local HTML, and results only to perform the analysis you request.</p><ul><li>It does not create accounts or profiles, use advertising or tracking cookies, or save results in a database.</li><li>Data is held temporarily in memory while the analysis runs and is removed after the result is delivered. Requested pages are fetched directly from this computer.</li><li>Do not submit personal, confidential, or third-party information unless you have a lawful basis to process it.</li></ul><p>This notice describes the minimum processing needed under transparency and data-minimisation principles. It does not replace the privacy policy of the organisation using this tool.</p>';
  if (cloudflareFreeEdition) {
    document.querySelector('#privacyBody').innerHTML = isSpanish
      ? '<p>Esta herramienta analiza la dificultad lingüística de páginas web y archivos HTML para localizar contenido que conviene revisar.</p><h3>Privacidad y protección de datos</h3><p>Los cálculos, gráficos, informes y PDF se realizan en tu navegador. Para obtener una página web, se envía su URL al proxy de Cloudflare, que descarga temporalmente el HTML y lo devuelve a este navegador. No se guarda una base de datos de URLs, textos ni resultados.</p><ul><li>No crea cuentas ni perfiles, ni utiliza publicidad o cookies de seguimiento.</li><li>El archivo HTML que subas se procesa en este navegador y no se envía al servidor.</li><li>No introduzcas información personal, confidencial o de terceros sin una base legítima para tratarla.</li></ul><p>Este aviso informa del tratamiento mínimo necesario conforme a los principios de transparencia y minimización.</p>'
      : '<p>This tool analyzes the linguistic difficulty of web pages and HTML files to identify content that may need review.</p><h3>Privacy and data protection</h3><p>Calculations, charts, reports and PDFs run in your browser. To retrieve a web page, its URL is sent to a Cloudflare proxy, which temporarily downloads the HTML and returns it to this browser. No database of URLs, texts or results is stored.</p><ul><li>It does not create accounts or profiles, or use advertising or tracking cookies.</li><li>An uploaded HTML file is processed in this browser and is not sent to the server.</li><li>Do not submit personal, confidential, or third-party information unless you have a lawful basis to process it.</li></ul><p>This notice describes the minimum processing needed under transparency and data-minimisation principles.</p>';
  }
  privacyAccept.textContent = isSpanish ? 'Entendido, continuar' : 'I understand, continue';
  privacyDialog.hidden = false;
  privacyAccept.focus();
}

function showAnalysisLanguageDialog() {
  const isSpanish = language === 'es';
  document.querySelector('#analysisLanguageEyebrow').textContent = isSpanish ? 'Configuración del análisis' : 'Analysis setup';
  document.querySelector('#analysisLanguageTitle').textContent = isSpanish ? 'Idioma del contenido que vas a analizar' : 'Language of the content to analyze';
  document.querySelector('#analysisLanguageText').textContent = isSpanish
    ? 'Esta elección determina la fórmula y el filtro lingüístico del análisis.'
    : 'This choice determines the analysis formula and language filter.';
  document.querySelector('#analysisLanguageNote').textContent = isSpanish
    ? '* Idioma de la interfaz: se establece por defecto según el navegador.'
    : '* Interface language: set by default from the browser.';
  document.querySelector('#analysisLanguageOptions').innerHTML = `
    <legend>${isSpanish ? 'Selecciona una opción' : 'Select one option'}</legend>
    <label><input type="radio" name="analysisLanguage" value="es" ${analysisLanguage === 'es' ? 'checked' : ''} /> <span><strong>Español</strong><small>${isSpanish ? 'Szigriszt-Pazos / INFLESZ' : 'Szigriszt-Pazos / INFLESZ'}</small></span></label>
    <label><input type="radio" name="analysisLanguage" value="en" ${analysisLanguage === 'en' ? 'checked' : ''} /> <span><strong>English</strong><small>Flesch Reading Ease</small></span></label>`;
  analysisLanguageAccept.textContent = isSpanish ? 'Continuar a la herramienta' : 'Continue to the tool';
  analysisLanguageDialog.hidden = false;
  analysisLanguageDialog.querySelector('input:checked')?.focus();
}

function showExecutionModeDialog() {
  const download = localEngineDownload();
  const isSpanish = language === 'es';
  document.querySelector('#executionModeEyebrow').textContent = isSpanish ? 'ANÁLISIS COMPLETO' : 'COMPLETE ANALYSIS';
  document.querySelector('#executionModeTitle').textContent = isSpanish ? 'Analiza un dominio completo' : 'Analyse a complete domain';
  document.querySelector('#executionModeText').textContent = isSpanish
    ? 'Para recorrer sitemaps, enlaces internos y contenido dinámico, el análisis se ejecuta en tu ordenador. Descarga y abre la aplicación gratuita.'
    : 'To scan sitemaps, internal links and dynamic content, the analysis runs on your computer. Download and open the free application.';
  fullDomainDownload.href = download.href;
  fullDomainDownload.textContent = isSpanish ? download.es : download.en;
  fullDomainDownload.hidden = !download.supported && /windows/i.test(`${navigator.userAgent || ''} ${navigator.platform || ''}`) === false;
  if (download.supported !== false) fullDomainDownload.setAttribute('download', '');
  checkLocalEngine.textContent = isSpanish ? 'Ya he abierto la aplicación' : 'I have opened the application';
  checkLocalEngine.hidden = download.supported === false;
  executionModeStatus.innerHTML = isSpanish
    ? `${download.supported === false ? 'El análisis de dominio completo con aplicación local está disponible actualmente solo para Windows. ' : ''}Al ejecutarla, se abrirá la edición completa en tu navegador. También puedes volver aquí: cuando detectemos la aplicación, esta ventana se cerrará sola.`
    : `${download.supported === false ? 'Complete-domain analysis with the local application is currently available only on Windows. ' : ''}When you run it, the complete edition will open in your browser. You can also return here: this window closes automatically when the application is detected.`;
  document.querySelector('main').inert = true;
  executionModeDialog.hidden = false;
  fullDomainDownload.focus();
}

function activateFullDomain(base) {
  stopWatchingForLocalEngine();
  localEngineBase = base;
  executionMode = 'local';
  searchVisibilityMode = false;
  inputSource = 'url';
  scope = 'domain';
  htmlFile.value = '';
  finishIntroduction();
}

async function connectFullDomain() {
  const base = await findLocalEngine();
  if (base) {
    activateFullDomain(base);
    resetResults();
    return;
  }
  showExecutionModeDialog();
  watchForLocalEngine();
}

async function chooseAvailableEngine() {
  // This follows the participant's simplest path: when the portable application
  // is already open, use it immediately. A choice is needed only when no local
  // engine is available.
  const base = await findLocalEngine();
  if (base) {
    localEngineBase = base;
    executionMode = 'local';
    finishIntroduction();
    return;
  }
  showExecutionModeDialog();
}

function finishIntroduction() {
  stopWatchingForLocalEngine();
  executionModeDialog.hidden = true;
  document.querySelector('main').inert = false;
  updateEngineStatus();
  syncScope();
  inputUrls.focus();
}

function stopWatchingForLocalEngine() {
  if (localEngineWatcher !== null) {
    window.clearInterval(localEngineWatcher);
    localEngineWatcher = null;
  }
}

function watchForLocalEngine() {
  stopWatchingForLocalEngine();
  const connectWhenReady = async () => {
    if (localEngineChecking || executionModeDialog.hidden) return;
    localEngineChecking = true;
    try {
      const base = await findLocalEngine();
      if (!base) return;
      activateFullDomain(base);
    } finally {
      localEngineChecking = false;
    }
  };
  void connectWhenReady();
  localEngineWatcher = window.setInterval(() => void connectWhenReady(), 1200);
}

function updateEngineStatus() {
  if (!cloudflareFreeEdition) { engineStatus.hidden = true; return; }
  engineStatus.hidden = false;
  engineStatus.textContent = executionMode === 'local'
    ? (language === 'es' ? '● Motor completo conectado en este ordenador · capacidad local' : '● Full local engine connected on this computer · local capacity')
    : (language === 'es' ? '● Análisis de una página o archivo HTML en línea' : '● Online analysis of one page or HTML file');
}

async function findLocalEngine() {
  const probes = LOCAL_ENGINE_CANDIDATES.map(async (base) => {
    try {
      const response = await fetchLocalEngine(`${base}/api/bridge-status`, { method: 'GET', cache: 'no-store', mode: 'cors', credentials: 'omit', timeoutMs: 900 });
      const status = await response.json();
      return response.ok && status.bridge === 'web-readability-radar-local' ? base : null;
    } catch {
      return null;
    }
  });
  const results = await Promise.all(probes);
  return results.find(Boolean) ?? null;
}

// Chrome protects connections from a public page to software on the same
// computer. 127.0.0.1 is a *loopback* destination (not a LAN destination), so
// declaring that exact address space is essential: Chrome can then show its
// permission prompt instead of rejecting the connection before the request.
function fetchLocalEngine(url, { timeoutMs, ...options } = {}) {
  // Only the short bridge probe has a timeout. Analysis requests can legitimately
  // run for minutes while the local engine processes a complete domain.
  const signal = options.signal ?? (Number.isFinite(timeoutMs) ? AbortSignal.timeout(timeoutMs) : undefined);
  return fetch(url, { ...options, targetAddressSpace: 'loopback', ...(signal ? { signal } : {}) });
}

function completeDomainLabel() {
  return language === 'es' ? 'Todas las elegibles' : 'All eligible';
}

function syncScopeLimitField() {
  maxPagesInput.type = 'text';
  maxPagesInput.value = scope === 'page' ? 'all' : completeDomainLabel();
  maxPagesInput.disabled = true;
}

async function runAnalysis(estimateOnly) {
  if (analysisRunning || !privacyAccepted || !analysisLanguageConfirmed) return;
  if (!form.reportValidity()) return;
  if (cloudflareFreeEdition && scope === 'domain' && !(executionMode === 'local' && localEngineBase)) {
    await connectFullDomain();
    return;
  }
  const dictionary = STRINGS[language];
  const startedAt = Date.now();
  let elapsedTimer = null;
  setBusy(true);
  tabs.classList.add('hidden');
  results.innerHTML = `
    <section class="intro-card loading-card" aria-busy="true">
      <div>
        <span class="soft-badge">${escapeHtml(estimateOnly ? dictionary.estimate : dictionary.analyze)}</span>
        <h2>${escapeHtml(estimateOnly ? dictionary.estimating : dictionary.analyzing)}</h2>
        <p>${escapeHtml(estimateOnly ? (scope === 'domain' ? dictionary.loadingDetailEstimate : dictionary.loadingDetailSourceEstimate) : dictionary.loadingDetailAnalyze)}</p>
        <div class="progress-track" role="progressbar" aria-label="${escapeHtml(estimateOnly ? dictionary.estimating : dictionary.analyzing)}">
          <span></span>
        </div>
        <div class="loading-steps" aria-hidden="true">
          <span class="active">${escapeHtml(inputSource === 'html' ? dictionary.loadingStepFile : scope === 'page' ? dictionary.loadingStepPage : dictionary.loadingStepSitemap)}</span>
          <span>${escapeHtml(scope === 'domain' ? dictionary.loadingStepPages : dictionary.loadingStepText)}</span>
          <span>${escapeHtml(dictionary.loadingStepMetrics)}</span>
        </div>
        ${scope === 'domain' ? `<p class="loading-note">${escapeHtml(dictionary.loadingNoteComplete)}</p>` : ''}
        <p class="loading-elapsed" aria-live="off">${escapeHtml(language === 'es' ? 'Tiempo transcurrido: 0:00' : 'Elapsed time: 0:00')}</p>
        <p class="loading-progress" aria-live="polite">${escapeHtml(language === 'es' ? 'Preparando análisis…' : 'Preparing analysis…')}</p>
      </div>
    </section>
  `;
  elapsedTimer = window.setInterval(() => {
    const target = results.querySelector('.loading-elapsed');
    if (!target) return;
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    target.textContent = language === 'es' ? `Tiempo transcurrido: ${time}` : `Elapsed time: ${time}`;
  }, 1000);

  try {
    const usingLocalEngine = cloudflareFreeEdition && executionMode === 'local' && Boolean(localEngineBase);
    if (cloudflareFreeEdition && executionMode === 'local' && !usingLocalEngine) {
      throw new Error(language === 'es' ? 'La aplicación local no está conectada. Ábrela y vuelve a intentarlo, o elige Una página web o Archivo HTML.' : 'The local application is not connected. Open it and try again, or choose One web page or HTML file.');
    }
    const localHtml = await readLocalHtml();
    localSourceText = '';
    const enteredInput = inputSource === 'html' ? '' : validateWebInput(inputUrls.value);
    const requestBody = {
      language: analysisLanguage,
      scope,
      input: enteredInput,
      exactUrls: scope === 'domain' ? exactUrls.value : '',
      includeRelatedSubdomains: scope === 'domain' && includeSubdomains.checked,
      estimateOnly,
      // A page, local HTML file, or complete local domain always processes its
      // selected content in full. There is no hidden quick-sample limit.
      maxPages: 'all',
      samplingMode: 'all',
      fragmentLimit: null,
      minWords: document.querySelector('#minWords').value,
      minFragmentWords: document.querySelector('#minFragmentWords').value,
      htmlInput: localHtml?.content ?? '',
      htmlName: localHtml?.name ?? '',
      background: !cloudflareFreeEdition || usingLocalEngine,
    };
    let payload;
    if (cloudflareFreeEdition && !usingLocalEngine) {
      requestBody.turnstileToken = await getTurnstileToken();
      payload = await analyzeOnline(requestBody, (phase, completed, total) => {
        const progressTarget = results.querySelector('.loading-progress');
        if (!progressTarget) return;
        progressTarget.textContent = phase === 'analysis' && Number.isFinite(total)
          ? (language === 'es' ? `Páginas procesadas: ${completed} de ${total}` : `Pages processed: ${completed} of ${total}`)
          : (language === 'es' ? 'Descubriendo páginas y enlaces…' : 'Discovering pages and links…');
      });
    } else {
      const apiBase = usingLocalEngine ? localEngineBase : '';
      const request = `${apiBase}/api/analyze`;
      const response = usingLocalEngine ? await fetchLocalEngine(request, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(requestBody), timeoutMs: 15_000,
      }) : await fetch(request, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(requestBody),
      });
      const started = await response.json();
      if (!response.ok || started.error) throw new Error(started.error || dictionary.error);
      if (!started.jobId) throw new Error(dictionary.error);
      if (usingLocalEngine) pendingLocalJob = { apiBase, jobId: started.jobId };
      payload = await waitForAnalysisJob({ apiBase, jobId: started.jobId, usingLocalEngine, dictionary });
    }
    lastResult = payload;
    pendingLocalJob = null;
    localSourceText = payload.localSourceText ?? '';
    // The reports use two small, versioned validation snapshots.  Loading them
    // after the analysis keeps a missing optional file from blocking a visitor's
    // result, while ensuring that a successful run can explain the checks that
    // support the method.
    const loadValidationJson = async (path) => {
      try {
        const response = await fetch(path, { cache: 'no-store' });
        return response.ok ? await response.json() : null;
      } catch {
        return null;
      }
    };
    const [indexValidation, syllableValidation, processingFingerprint] = await Promise.all([
      loadValidationJson('index-validation.json'),
      loadValidationJson('syllable-validation.json'),
      currentProcessingFingerprint(payload.language),
    ]);
    if (indexValidation) {
      const snapshot = payload.language === 'en' ? indexValidation : indexValidation.spanish;
      lastResult.indexValidation = {
        ...indexValidation,
        matchesCurrentProcessing: Boolean(processingFingerprint && snapshot?.processing_sha256 === processingFingerprint),
      };
    }
    const localSyllableEvidence = lastResult.syllableValidation;
    const syllableSnapshot = syllableValidation?.[payload.language];
    if (syllableSnapshot) {
      lastResult.syllableValidation = {
        data: syllableSnapshot,
        // A result file deployed beside the app is not evidence by itself. It
        // counts only when code and the dictionary used by this language match.
        matchesCurrentProcessing: Boolean(processingFingerprint && syllableSnapshot.processing_sha256 === processingFingerprint),
        // Only the local server can verify the complete server-source hash.
        // Web reports use the shared calculation fingerprint instead.
        matchesCurrentServer: localSyllableEvidence?.matchesCurrentServer ?? null,
      };
    }
    activeTab = 'panel';
    [...tabs.querySelectorAll('.tab')].forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === 'panel'));
    tabs.classList.remove('hidden');
    renderResult();
    const completedStatus = document.querySelector('#appStatus');
    if (completedStatus) {
      completedStatus.textContent = language === 'es'
        ? `Análisis completado: ${payload.summary.analyzed} páginas analizadas y ${payload.summary.totalFragmentsDetected ?? payload.fragments?.length ?? 0} fragmentos elegibles.`
        : `Analysis complete: ${payload.summary.analyzed} pages analyzed and ${payload.summary.totalFragmentsDetected ?? payload.fragments?.length ?? 0} eligible fragments.`;
    }
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const canRecover = Boolean(pendingLocalJob);
    const message = canRecover
      ? (language === 'es'
        ? 'La comunicación con el motor local se interrumpió, pero el análisis puede seguir terminado en este ordenador. Mantén abierta la aplicación y recupera el resultado sin volver a empezar.'
        : 'Communication with the local engine was interrupted, but the analysis may still be finishing on this computer. Keep the application open and recover the result without starting again.')
      : (error instanceof TypeError ? dictionary.connectionError : rawMessage);
    results.innerHTML = `<section class="error-panel"><h2>${escapeHtml(dictionary.error)}</h2><p>${escapeHtml(message)}</p>${canRecover ? `<button type="button" class="primary-button" id="recoverLocalJob">${escapeHtml(language === 'es' ? 'Recuperar análisis local' : 'Recover local analysis')}</button>` : ''}<details class="error-details"><summary>${escapeHtml(language === 'es' ? 'Detalle técnico' : 'Technical detail')}</summary><p>${escapeHtml(rawMessage)}</p></details></section>`;
    if (canRecover) document.querySelector('#recoverLocalJob')?.addEventListener('click', resumePendingLocalJob);
  } finally {
    if (elapsedTimer !== null) window.clearInterval(elapsedTimer);
    setBusy(false);
  }
}

function updateLocalJobProgress(status) {
  const progressTarget = results.querySelector('.loading-progress');
  if (!progressTarget) return;
  progressTarget.textContent = status.progress?.phase === 'analysis' && Number.isFinite(status.progress.total)
    ? (language === 'es' ? `Páginas procesadas: ${status.progress.completed} de ${status.progress.total}` : `Pages processed: ${status.progress.completed} of ${status.progress.total}`)
    : (language === 'es' ? 'Descubriendo páginas y enlaces…' : 'Discovering pages and links…');
}

async function waitForAnalysisJob({ apiBase, jobId, usingLocalEngine, dictionary }) {
  let transientFailures = 0;
  while (true) {
    await new Promise((resolve) => window.setTimeout(resolve, 750));
    const statusUrl = `${apiBase}/api/analyze-status?jobId=${encodeURIComponent(jobId)}`;
    try {
      const statusResponse = usingLocalEngine
        // The local engine may spend a long time in CPU work. A status request
        // gets a generous timeout and is retried before a user sees an error.
        ? await fetchLocalEngine(statusUrl, { cache: 'no-store', timeoutMs: 60_000 })
        : await fetch(statusUrl, { cache: 'no-store' });
      const status = await statusResponse.json();
      if (!statusResponse.ok || status.error) {
        const jobError = new Error(status.error || dictionary.error);
        jobError.jobError = true;
        throw jobError;
      }
      transientFailures = 0;
      updateLocalJobProgress(status);
      if (status.state === 'error') {
        const jobError = new Error(status.error || dictionary.error);
        jobError.jobError = true;
        throw jobError;
      }
      if (status.state === 'complete') return status.result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isTemporary = usingLocalEngine && /signal timed out|timeout|abort|failed to fetch|networkerror/i.test(message);
      if (!isTemporary || error?.jobError || transientFailures >= 4) throw error;
      transientFailures += 1;
      const progressTarget = results.querySelector('.loading-progress');
      if (progressTarget) {
        progressTarget.textContent = language === 'es'
          ? `El motor local sigue calculando. Reconectando (${transientFailures}/5)…`
          : `The local engine is still calculating. Reconnecting (${transientFailures}/5)…`;
      }
      await new Promise((resolve) => window.setTimeout(resolve, transientFailures * 1500));
    }
  }
}

async function resumePendingLocalJob() {
  if (!pendingLocalJob || analysisRunning) return;
  const dictionary = STRINGS[language];
  setBusy(true);
  results.innerHTML = `<section class="intro-card loading-card" aria-busy="true"><div><span class="soft-badge">${escapeHtml(language === 'es' ? 'Recuperando análisis' : 'Recovering analysis')}</span><h2>${escapeHtml(language === 'es' ? 'Conectando con el motor local' : 'Connecting to the local engine')}</h2><p class="loading-progress" aria-live="polite">${escapeHtml(language === 'es' ? 'Consultando el resultado que ya está en proceso…' : 'Checking the result already in progress…')}</p></div></section>`;
  try {
    const payload = await waitForAnalysisJob({ ...pendingLocalJob, usingLocalEngine: true, dictionary });
    lastResult = payload;
    pendingLocalJob = null;
    localSourceText = payload.localSourceText ?? '';
    activeTab = 'panel';
    tabs.classList.remove('hidden');
    renderResult();
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    results.innerHTML = `<section class="error-panel"><h2>${escapeHtml(dictionary.error)}</h2><p>${escapeHtml(language === 'es' ? 'No se pudo recuperar el resultado todavía. La aplicación puede seguir trabajando; inténtalo de nuevo en unos segundos.' : 'The result could not be recovered yet. The application may still be working; try again in a few seconds.')}</p><button type="button" class="primary-button" id="recoverLocalJob">${escapeHtml(language === 'es' ? 'Reintentar recuperación' : 'Retry recovery')}</button><details class="error-details"><summary>${escapeHtml(language === 'es' ? 'Detalle técnico' : 'Technical detail')}</summary><p>${escapeHtml(rawMessage)}</p></details></section>`;
    document.querySelector('#recoverLocalJob')?.addEventListener('click', resumePendingLocalJob);
  } finally {
    setBusy(false);
  }
}

async function readLocalHtml() {
  if (inputSource !== 'html') return null;
  const dictionary = STRINGS[language];
  const file = htmlFile?.files?.[0];
  if (!file) throw new Error(dictionary.missingHtml);
  if (!/\.html?$/i.test(file.name)) throw new Error(dictionary.invalidHtml);
  let content;
  try { content = await file.text(); }
  catch { throw new Error(dictionary.unreadableHtml); }
  if (!content.trim()) throw new Error(dictionary.emptyHtml);
  if (content.length > 6000000) throw new Error(language === 'es' ? 'El HTML supera el límite de 6.000.000 de caracteres.' : 'HTML exceeds the 6,000,000-character limit.');
  return {
    name: file.name,
    content,
  };
}

function validateWebInput(value) {
  const lines = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) throw new Error(STRINGS[language].invalidUrl);
  if (scope === 'page' && cloudflareFreeEdition && executionMode !== 'local' && lines.length !== 1) {
    throw new Error(STRINGS[language].onlineSinglePageOnly);
  }
  for (const line of lines) {
    try {
      const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(line) ? line : `https://${line}`);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) throw new Error();
    } catch { throw new Error(STRINGS[language].invalidUrl); }
  }
  return lines.join('\n');
}

function setBusy(isBusy) {
  analysisRunning = isBusy;
  form.querySelectorAll('button, textarea, input').forEach((node) => {
    if (node === maxPagesInput) {
      node.disabled = true;
      return;
    }
    node.disabled = isBusy;
  });
  document.body.classList.toggle('is-busy', isBusy);
  if (!isBusy) {
    syncScopeLimitField();
    syncScope();
  }
}

function renderResult() {
  if (!lastResult) return;
  const area = ['fragments','pages','sampling'].includes(activeTab) ? 'explore' : activeTab;
  document.querySelector('#exploreViews').hidden = area !== 'explore';
  tabs.querySelectorAll('[data-area]').forEach(button => {
    button.classList.toggle('active', button.dataset.area === area);
    button.setAttribute('aria-pressed', String(button.dataset.area === area));
  });
  tabs.querySelectorAll('[data-tab]').forEach(button => {
    button.classList.toggle('active', button.dataset.tab === activeTab);
    button.setAttribute('aria-pressed', String(button.dataset.tab === activeTab));
  });
  const reportDownload = document.querySelector('#reportDownload');
  reportDownload.hidden = Boolean(lastResult.estimateOnly);
  reportDownload.open = false;
  document.querySelector('#reportDownloadLabel').textContent = language === 'es' ? 'Descargar informe' : 'Download report';
  reportDownload.querySelector('[data-report-kind="full"]').textContent = language === 'es' ? 'Informe completo' : 'Full report';
  reportDownload.querySelector('[data-report-kind="brief"]').textContent = language === 'es' ? 'Informe breve' : 'Brief report';
  reportDownload.querySelector('[data-report-kind="workbook"]').textContent = language === 'es' ? 'Resultados en Excel' : 'Results in Excel';
  const dictionary = STRINGS[language];
  if (activeTab === 'fragments') {
    renderFragments(dictionary);
  } else if (activeTab === 'pages') {
    renderPages(dictionary);
  } else if (activeTab === 'sampling') {
    renderSampling(dictionary);
  } else if (activeTab === 'criteria') {
    renderCriteria(dictionary);
  } else {
    renderPanel(dictionary);
  }
}

function renderPanel(dictionary) {
  const result = lastResult;
  const counts = trafficCounts(result);
  const isEstimate = Boolean(result.estimateOnly);
  const coverage = result.criteria?.coverage;
  const languageExclusions = result.summary.languageExcludedPages ?? 0;
  const trafficHelp = result.language === 'es'
    ? (language === 'es' ? 'Cuenta todos los fragmentos detectados. Las cinco categorías conservan las bandas de dificultad de INFLESZ. La categoría se obtiene del índice antes de redondear.' : 'Counts every detected fragment. The five colors retain the INFLESZ difficulty bands. The category is assigned before rounding the score.')
    : (language === 'es' ? 'Cuenta todos los fragmentos detectados. Los colores agrupan las categorías de Flesch calculadas antes de redondear.' : 'Counts every detected fragment. Colors group Flesch categories calculated before rounding.');
  const analyzedDetail = language === 'es'
    ? `${dictionary.withMetrics}; ${languageExclusions} excluidas por idioma`
    : `${dictionary.withMetrics}; ${languageExclusions} excluded by language`;
  const fragmentDetail = isEstimate
    ? dictionary.estimatePending
    : result.criteria?.analysisTimeLimitReached
        ? (language === 'es' ? `En ${result.summary.analyzed} de ${result.summary.selected} páginas` : `From ${result.summary.analyzed} of ${result.summary.selected} pages`)
        : dictionary.totalFragments;
  results.innerHTML = `
    ${isEstimate ? `
    <section class="analysis-overview estimate-overview" aria-labelledby="analysisOverviewTitle">
      <div class="difficulty-rate">
        <span class="eyebrow" id="analysisOverviewTitle">${language === 'es' ? 'Estimación de candidatas' : 'Candidate estimate'}</span>
        <strong>${escapeHtml(result.summary.selected)}</strong>
        <p>${escapeHtml(language === 'es'
          ? 'Páginas preparadas para analizar. Todavía no se han calculado puntuaciones ni fragmentos.'
          : 'Pages prepared for analysis. Scores and fragments have not been calculated yet.')}</p>
      </div>
      <div class="summary-metrics" aria-label="${escapeHtml(language === 'es' ? 'Resultado de la estimación' : 'Estimate results')}">
        ${metricCard(language === 'es' ? 'Descubiertas' : 'Discovered', result.summary.candidates, language === 'es' ? 'Localizadas' : 'Found')}
        ${metricCard(language === 'es' ? 'Elegibles' : 'Eligible', result.summary.eligibleCandidates ?? result.summary.candidates, language === 'es' ? 'Disponibles' : 'Available')}
        ${metricCard(dictionary.selected, result.summary.selected, language === 'es' ? 'Preparadas' : 'Prepared')}
      </div>
    </section>` : `
    <section class="analysis-overview page-overview" aria-labelledby="analysisOverviewTitle">
      <div class="reading-summary">
        <span class="eyebrow" id="analysisOverviewTitle">${language === 'es' ? 'Fragmentos difíciles' : 'Difficult fragments'}</span>
        <strong>${escapeHtml(difficultFragmentRate(counts))}</strong>
        <p>${escapeHtml(language === 'es'
          ? `${difficultFragmentCount(counts)} de ${totalTrafficFragments(counts)} fragmentos se clasifican como muy difíciles o algo difíciles.`
          : `${difficultFragmentCount(counts)} of ${totalTrafficFragments(counts)} fragments are classified as very or somewhat difficult.`)}</p>
      </div>
      <dl class="overview-facts" aria-label="${escapeHtml(language === 'es' ? 'Resumen del análisis' : 'Analysis summary')}">
        ${overviewFact(dictionary.analyzed, result.summary.analyzed, analyzedDetail)}
        ${overviewFact(dictionary.fragments, result.summary.fragments ?? result.fragments.length, fragmentDetail)}
      </dl>
    </section>`}

    ${isEstimate ? `<p class="analysis-pending" role="status"><strong>${escapeHtml(language === 'es' ? 'Lista de candidatas preparada.' : 'Candidate list prepared.')}</strong> ${escapeHtml(language === 'es' ? 'Aún no se ha analizado ninguna página. Pulsa “Analizar ahora” para analizar todas las páginas seleccionadas y calcular los fragmentos.' : 'No page has been analyzed yet. Choose “Analyze now” to analyze every selected page and calculate fragments.')}</p>` : ''}

    ${isEstimate ? '' : `
      <section class="traffic-summary-panel" aria-labelledby="trafficSummaryTitle">
        <div class="panel-head">
          <div>
            <h2 id="trafficSummaryTitle">${escapeHtml(dictionary.trafficSummary)} ${infoHelp(trafficHelp)}</h2>
            <p>${escapeHtml(`${dictionary.trafficSummaryText}. ${language === 'es' ? `${result.summary.totalFragmentsDetected} fragmentos elegibles en las páginas analizadas.` : `${result.summary.totalFragmentsDetected} eligible fragments across the analyzed pages.`}`)}</p>
          </div>
        </div>
        <div class="traffic-visualization">
          <div class="traffic-donut" role="img" aria-label="${escapeHtml(trafficDescription(counts))}">
            <svg viewBox="0 0 100 100" aria-hidden="true">${donutSegments(counts)}</svg>
            <div><span>${escapeHtml(totalTrafficFragments(counts))}</span><small>${language === 'es' ? 'fragmentos' : 'fragments'}</small></div>
          </div>
          <div class="traffic-legend" aria-label="${escapeHtml(language === 'es' ? 'Filtrar fragmentos por categoría' : 'Filter fragments by category')}">
            ${trafficFilterButtons(counts)}
          </div>
        </div>
      </section>
    `}

    <details class="analysis-details">
      <summary>${language === 'es' ? 'Detalles del análisis' : 'Analysis details'}</summary>
      <div class="analysis-details-content">
        <p class="reason">${escapeHtml(result.metric)}</p>
        <div class="list">
          ${result.domains.map((domain) => `
          <article class="domain-card">
            <h3>${escapeHtml(domain.domain)}</h3>
            <p class="reason">${escapeHtml(domain.selectionMode)}</p>
            <div class="meta-grid">
              ${datum(language === 'es' ? 'Descubiertas' : 'Discovered', domain.candidatesDetected)}
              ${datum(language === 'es' ? 'Elegibles' : 'Eligible', domain.eligibleCandidates ?? domain.candidatesDetected)}
              ${datum(dictionary.selected, domain.selectedPages)}
              ${datum(dictionary.analyzed, domain.analyzedPages ?? '-')}
              ${datum(language === 'es' ? 'Excluidas por idioma' : 'Excluded by language', domain.languageExcludedPages ?? 0)}
              ${(domain.excludedCandidates ?? 0) ? datum(language === 'es' ? 'Excluidas por robots' : 'Excluded by robots', domain.excludedCandidates) : ''}
              ${domain.duplicateContentPages ? datum(language === 'es' ? 'Duplicadas' : 'Duplicates', domain.duplicateContentPages) : ''}
              ${datum('Sitemap', domain.sitemapLinks ?? 0)}
              ${datum(language === 'es' ? 'Páginas exploradas' : 'Pages crawled', domain.crawledPages ?? '-')}
              ${datum(language === 'es' ? 'Profundidad' : 'Depth', domain.depthReached ?? '-')}
            </div>
            ${domain.sections?.length ? `<details><summary>${language === 'es' ? 'Representación por sección' : 'Section representation'}</summary><p>${domain.sections.map(section => `${section.section}: ${section.selected ?? 0}/${section.eligible}`).join(' · ')}</p></details>` : ''}
            ${domain.partialReasons?.length ? `<p class="${isEstimate ? 'coverage-note' : 'analysis-pending'}"><strong>${language === 'es' ? (isEstimate ? 'Cobertura de la estimación.' : 'Cobertura parcial.') : (isEstimate ? 'Estimate coverage.' : 'Partial coverage.')}</strong> ${escapeHtml(coverageReasonText(domain.partialReasons))}${isEstimate ? ` ${escapeHtml(language === 'es' ? 'Las candidatas encontradas siguen disponibles para el análisis.' : 'The candidates found remain available for analysis.')}` : ''}</p>` : ''}
            ${domain.includeRelatedSubdomains ? `<p class="reason">${language === 'es' ? 'Se incluyeron subdominios bajo el mismo dominio registrable.' : 'Subdomains under the same registrable domain were included.'}</p>` : ''}
          </article>
          `).join('')}
        </div>
        ${coverage ? `<p class="reason">${coverage.platform === 'browser_client_free' ? (language === 'es' ? 'Análisis ejecutado en este navegador sobre la página web o el archivo HTML indicado. No se guarda el contenido.' : 'Analysis run in this browser for the specified web page or HTML file. Content is not stored.') : coverage.maxCrawlDepth === null ? (language === 'es' ? `Se recorren todos los enlaces internos detectables y las URLs de sitemap, hasta ${coverage.maxCandidates} URLs candidatas.` : `All detectable internal links and sitemap URLs are traversed, up to ${coverage.maxCandidates} candidate URLs.`) : (language === 'es' ? `Cobertura limitada del rastreo: hasta ${coverage.maxCrawlDepth} niveles y ${coverage.maxCrawlPagesPerDomain} páginas exploradas por dominio. Sitemaps y candidatas: hasta ${coverage.maxCandidates}.` : `Limited crawl coverage: up to ${coverage.maxCrawlDepth} link levels and ${coverage.maxCrawlPagesPerDomain} crawled pages per domain. Sitemaps and candidates: up to ${coverage.maxCandidates}.`)}</p>` : ''}
      </div>
    </details>

  `;
  bindTrafficFilters();
  bindDownloads();
}

function coverageReasonText(reasons) {
  const labels = language === 'es'
    ? { depth_limit: 'Se alcanzó la profundidad máxima de enlaces.', crawl_page_limit: 'Se alcanzó el límite de páginas exploradas.', crawl_time_limit: 'Se alcanzó el tiempo máximo de exploración; se muestran las URLs detectadas hasta ese momento.', analysis_time_limit: 'Se alcanzó el tiempo máximo de análisis; las páginas pendientes se identifican en el informe.', sitemap_candidate_limit: 'Se alcanzó un límite de sitemap o de URLs candidatas.' }
    : { depth_limit: 'The maximum link depth was reached.', crawl_page_limit: 'The crawled-page limit was reached.', crawl_time_limit: 'The exploration time limit was reached; URLs detected up to that point are shown.', analysis_time_limit: 'The analysis time limit was reached; pending pages are identified in the report.', sitemap_candidate_limit: 'A sitemap or candidate-URL limit was reached.' };
  return reasons.map((reason) => labels[reason] ?? reason).join(' ');
}

function renderPages(dictionary) {
  const result = lastResult;
  const pages = sortedPages(result.pages ?? []);
  results.innerHTML = `
    <section class="panel-card">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(dictionary.pages)}</h2>
          <p>${escapeHtml(dictionary.pagesSubtitle)}</p>
        </div>
        <div class="panel-actions">
          <label class="sort-control">
            <span>${escapeHtml(dictionary.sortPages)}</span>
            <select id="pageSort">
              <option value="hardest" ${pageSort === 'hardest' ? 'selected' : ''}>${escapeHtml(dictionary.sortHardest)}</option>
              <option value="easiest" ${pageSort === 'easiest' ? 'selected' : ''}>${escapeHtml(dictionary.sortEasiest)}</option>
              <option value="longest" ${pageSort === 'longest' ? 'selected' : ''}>${escapeHtml(dictionary.sortLongest)}</option>
              <option value="shortest" ${pageSort === 'shortest' ? 'selected' : ''}>${escapeHtml(dictionary.sortShortest)}</option>
            </select>
          </label>
          <button class="download-button" type="button" data-download="pages">⇩ ${escapeHtml(dictionary.downloadPages)}</button>
        </div>
      </div>
      <div class="list">
        ${pages.length ? pages.map((page) => pageCard(page, dictionary)).join('') : samplingNotice(dictionary)}
      </div>
    </section>
  `;
  document.querySelector('#pageSort')?.addEventListener('change', (event) => {
    pageSort = event.target.value;
    renderPages(STRINGS[language]);
  });
  bindDownloads();
}

function renderFragments(dictionary) {
  const result = lastResult;
  if (result.estimateOnly) {
    results.innerHTML = `<section class="panel-card"><h2>${escapeHtml(dictionary.fragmentsTitle)}</h2><p>${language === 'es' ? 'Se han localizado páginas candidatas, pero todavía no se han analizado sus textos.' : 'Candidate pages have been located, but their text has not been analyzed yet.'}</p><button type="button" data-analyze-next>${escapeHtml(dictionary.analyze)}</button></section>`;
    return;
  }
  const allFragments = result.fragments ?? [];
  const fragments = sortedFragments(filterFragments(allFragments));
  const visibleFragments = fragments.slice(0, visibleFragmentCount);
  const hasMoreFragments = visibleFragments.length < fragments.length;
  results.innerHTML = `
    <section class="panel-card">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(dictionary.fragmentsTitle)}</h2>
          <p>${escapeHtml(language === 'es' ? `Mostrando ${visibleFragments.length} de ${fragments.length} fragmentos en esta vista (${allFragments.length} en total)${fragmentFilter === 'all' ? '' : ` con filtro ${trafficLabel(fragmentFilter)}`}.` : `Showing ${visibleFragments.length} of ${fragments.length} fragments in this view (${allFragments.length} total)${fragmentFilter === 'all' ? '' : ` with the ${trafficLabel(fragmentFilter)} filter`}.`)}</p>
        </div>
        <div class="panel-actions">
          <label class="sort-control">
            <span>${escapeHtml(dictionary.sortFragments)}</span>
            <select id="fragmentSort">
              <option value="hardest" ${fragmentSort === 'hardest' ? 'selected' : ''}>${escapeHtml(dictionary.sortHardest)}</option>
              <option value="easiest" ${fragmentSort === 'easiest' ? 'selected' : ''}>${escapeHtml(dictionary.sortEasiest)}</option>
              <option value="longest" ${fragmentSort === 'longest' ? 'selected' : ''}>${escapeHtml(dictionary.sortLongest)}</option>
              <option value="shortest" ${fragmentSort === 'shortest' ? 'selected' : ''}>${escapeHtml(dictionary.sortShortest)}</option>
            </select>
          </label>
          <button class="download-button" type="button" data-download="fragments">⇩ ${escapeHtml(dictionary.downloadFragments)}</button>
        </div>
      </div>
      <div class="fragment-filter-bar">
        ${trafficFilterButtons(trafficCounts(result), true)}
      </div>
      <div class="list">
        ${fragments.length ? visibleFragments.map((fragment) => fragmentCard(fragment, dictionary)).join('') : `<p class="reason">${escapeHtml(language === 'es' ? `No se encontraron párrafos independientes elegibles en las ${result.summary.selected} páginas seleccionadas. ${result.pages.filter(p=>p.status==='error').length} errores de lectura. Consulta Páginas para ver los motivos y las exclusiones.` : `No eligible independent paragraphs were found in the ${result.summary.selected} selected pages. ${result.pages.filter(p=>p.status==='error').length} reading errors. See Pages for reasons and exclusions.`)}</p>`}
      </div>
      ${hasMoreFragments ? `<div class="fragment-pagination"><button type="button" class="secondary-button" id="showMoreFragments">${escapeHtml(language === 'es' ? `Mostrar 50 más (${fragments.length - visibleFragments.length} restantes)` : `Show 50 more (${fragments.length - visibleFragments.length} remaining)`)}</button></div>` : ''}
    </section>
  `;
  document.querySelector('#fragmentSort')?.addEventListener('change', (event) => {
    fragmentSort = event.target.value;
    visibleFragmentCount = FRAGMENTS_PER_PAGE;
    renderFragments(STRINGS[language]);
  });
  document.querySelector('#showMoreFragments')?.addEventListener('click', () => {
    visibleFragmentCount += FRAGMENTS_PER_PAGE;
    renderFragments(STRINGS[language]);
  });
  bindTrafficFilters();
  bindDownloads();
}

function renderSampling(dictionary) {
  const result = lastResult;
  results.innerHTML = `
    <section class="panel-card">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(dictionary.samplingTitle)}</h2>
          <p>${escapeHtml(result.summary.candidates)} ${language === 'es' ? 'descubiertas' : 'discovered'}; ${escapeHtml(result.summary.eligibleCandidates ?? result.summary.candidates)} ${language === 'es' ? 'elegibles' : 'eligible'}; ${escapeHtml(result.summary.selected)} ${escapeHtml(dictionary.selected.toLowerCase())}; ${escapeHtml(result.summary.excludedCandidates ?? 0)} ${language === 'es' ? 'excluidas' : 'excluded'}.</p>
        </div>
        <button class="download-button" type="button" data-download="sampling">⇩ ${escapeHtml(dictionary.downloadSampling)}</button>
      </div>
      <div class="list">
        ${result.samplingFrame.map((row) => samplingCard(row, dictionary)).join('')}
      </div>
    </section>
  `;
  bindDownloads();
}

function renderCriteria(dictionary) {
  const result = lastResult;
  results.innerHTML = `
    <section class="panel-card">
      <div class="panel-head">
        <h2>${escapeHtml(dictionary.criteriaTitle)}</h2>
      </div>
      ${processingCriteriaMarkup(lastResult.language, language)}
      <p>${lastResult.language === 'es' ? (language === 'es' ? 'Colores por categoría, calculada antes de redondear. Los colores son una ayuda visual de Radar, no una codificación oficial de INFLESZ.' : 'Colors follow the category calculated before rounding. Radar colors are visual aids, not an official INFLESZ encoding.') : (language === 'es' ? 'Colores por categoría de Flesch, calculada antes de redondear. Los colores son una ayuda visual de Radar.' : 'Colors follow the Flesch category calculated before rounding. Radar colors are visual aids.')}</p>
      <ul>${result.criteria.categories.map(row=>`<li class="score-${row.color}">${escapeHtml(difficultyAction(row.color))}: ${row.minimum === null ? (language === 'es' ? 'por debajo del tramo anterior' : 'below the previous band') : `≥ ${row.minimum}`}</li>`).join('')}</ul>
      <details><summary>${language === 'es' ? 'Configuración y trazabilidad' : 'Configuration and traceability'}</summary><div class="criteria-grid">
        ${criteria(dictionary.scope, result.criteria.scope === 'page' ? dictionary.pageMode : dictionary.domainMode)}
        ${criteria(dictionary.metric, result.criteria.metric)}
        ${criteria(dictionary.sampleSize, result.criteria.maxPagesLabel ?? result.criteria.maxPages)}
        ${criteria(dictionary.minWords, result.criteria.minWords)}
        ${criteria(dictionary.minFragmentWords, result.criteria.minFragmentWords)}
        ${criteria(dictionary.generated, new Date(result.generatedAt).toLocaleString())}
        ${criteria(language === 'es' ? 'Semilla de muestreo' : 'Sampling seed', result.criteria.samplingSeed ?? '-')}
        ${criteria(language === 'es' ? 'Reglas de procesamiento' : 'Processing rules', result.criteria.processingRules)}
      </div></details>
    </section>
  `;
  bindDownloads();
}

function metricCard(label, value, detail) {
  const dictionary = STRINGS[language];
  const analysisIsEnglish = (lastResult?.language ?? analysisLanguage) === 'en';
  const help = label === dictionary.lowThreshold ? (language === 'es' ? `Porcentaje de páginas analizadas con ${analysisIsEnglish ? 'Flesch inferior a 50' : 'Szigriszt inferior a 55'}. No es el porcentaje de fragmentos ni de personas con dificultades.` : `Percentage of analyzed pages with ${analysisIsEnglish ? 'Flesch below 50' : 'Szigriszt below 55'}. This is not a percentage of fragments or readers.`) : '';
  return `<article class="metric-card"><span>${escapeHtml(label)} ${help ? infoHelp(help) : ''}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></article>`;
}

function analysisLabels(result = lastResult) {
  const englishAnalysis = (result?.language ?? analysisLanguage) === 'en';
  if (englishAnalysis) {
    return language === 'es'
      ? { score: 'Flesch', level: 'Nivel Flesch', metric: 'Flesch Reading Ease' }
      : { score: 'Flesch', level: 'Flesch level', metric: 'Flesch Reading Ease' };
  }
  return language === 'es'
    ? { score: 'Szigriszt', level: 'INFLESZ', metric: 'Szigriszt-Pazos / INFLESZ' }
    : { score: 'Szigriszt', level: 'INFLESZ category', metric: 'Szigriszt-Pazos / INFLESZ' };
}

function processingDescription(analysisLocale, interfaceLocale = language) {
  const spanishAnalysis = analysisLocale === 'es';
  if (interfaceLocale === 'es') {
    return spanishAnalysis
      ? 'Fragmentos: cada resultado procede de un párrafo HTML completo y nunca se corta por longitud. Las copias textuales idénticas dentro de una misma URL se excluyen para no duplicar resultados. Frases: segmentos no vacíos separados por punto, punto y coma, dos puntos, interrogación, admiración o raya. Los signos consecutivos y los espacios finales no añaden frases. Los puntos y comas dentro de números, URLs o dominios no separan frases. El punto de una abreviatura también separa. Números y símbolos cuentan como una palabra de una sílaba. Las abreviaturas reconocidas cuentan una sílaba; los compuestos con guion son una palabra. Las vocales, hiatos y diptongos siguen las convenciones ortográficas de la RAE y ASALE (2010); las palabras frecuentes usan la referencia de pylabeador (de Vera, 2026).'
      : 'Fragmentos: cada resultado procede de un párrafo HTML completo y nunca se acorta para mostrarlo. Las copias textuales idénticas dentro de una misma URL se excluyen para no duplicar resultados. Las frases inglesas se identifican mediante grupos de punto, interrogación o admiración seguidos de espacio o final de texto, con un mínimo de una frase. Se emplean el algoritmo inglés de palabras y sílabas y la fórmula Flesch Reading Ease.';
  }
  return spanishAnalysis
    ? 'Fragments: each result comes from one complete HTML paragraph and is never shortened for display. Identical copies within the same URL are excluded to prevent duplicate results. Spanish sentences are non-empty segments separated by a period, semicolon, colon, question mark, exclamation mark or dash. Consecutive punctuation and trailing spaces do not add sentences. Periods and commas within numbers, URLs or domains do not split sentences. Numbers and symbols count as one one-syllable word. Recognized abbreviations count as one syllable, and hyphenated compounds count as one word. Vowels, hiatuses and diphthongs follow RAE and ASALE spelling conventions (2010); frequent words use the pylabeador reference (de Vera, 2026).'
    : 'Fragments: each result comes from one complete HTML paragraph and is never shortened for display. Identical copies within the same URL are excluded to prevent duplicate results. Sentences use groups of periods, question marks or exclamation marks followed by whitespace or the end of text, with a minimum of one. The English word and syllable algorithms are unchanged.';
}

function processingCriteriaSections(analysisLocale, interfaceLocale = language) {
  const spanishAnalysis = analysisLocale === 'es';
  const spanishInterface = interfaceLocale === 'es';
  if (!spanishAnalysis) {
    return spanishInterface
      ? [
        { title: 'Fragmentos', items: ['Cada resultado procede de un párrafo HTML completo; no se recorta.', 'Las copias textuales idénticas de una misma URL se excluyen para evitar duplicados.'] },
        { title: 'Cálculo', items: ['Las frases se identifican por grupos de punto, interrogación o admiración.', 'Se aplican el algoritmo inglés de palabras y sílabas y la fórmula Flesch Reading Ease.'] },
      ]
      : [
        { title: 'Fragments', items: ['Each result comes from one complete HTML paragraph and is never shortened.', 'Identical text within the same URL is excluded to avoid duplicates.'] },
        { title: 'Calculation', items: ['Sentences use groups of periods, question marks or exclamation marks.', 'The English word and syllable algorithms and Flesch Reading Ease are applied.'] },
      ];
  }
  return spanishInterface
    ? [
      { title: 'Fragmentos', items: ['Cada resultado procede de un párrafo HTML completo y nunca se corta por longitud.', 'Las copias textuales idénticas dentro de una misma URL se excluyen para no duplicar resultados.'] },
      { title: 'Frases y palabras', items: ['Las frases son segmentos separados por punto, punto y coma, dos puntos, interrogación, admiración o raya.', 'Los signos consecutivos y los espacios finales no añaden frases. Los puntos y comas dentro de números, URL o dominios no separan frases.', 'Números y símbolos cuentan como una palabra de una sílaba. Las abreviaturas reconocidas cuentan una sílaba y los compuestos con guion son una palabra.'] },
      { title: 'Sílabas', items: ['Las vocales, hiatos y diptongos siguen las convenciones ortográficas de la RAE y ASALE (2010).', 'Las palabras frecuentes usan la referencia de pylabeador (de Vera, 2026).'] },
    ]
    : [
      { title: 'Fragments', items: ['Each result comes from one complete HTML paragraph and is never shortened.', 'Identical text within the same URL is excluded to avoid duplicates.'] },
      { title: 'Sentences and words', items: ['Sentences are non-empty segments separated by a period, semicolon, colon, question mark, exclamation mark or dash.', 'Consecutive punctuation and trailing spaces do not add sentences. Periods and commas within numbers, URLs or domains do not split sentences.', 'Numbers and symbols count as one one-syllable word. Recognized abbreviations count as one syllable, and hyphenated compounds count as one word.'] },
      { title: 'Syllables', items: ['Vowels, hiatuses and diphthongs follow RAE and ASALE spelling conventions (2010).', 'Frequent words use the pylabeador reference (de Vera, 2026).'] },
    ];
}

function processingCriteriaMarkup(analysisLocale, interfaceLocale = language) {
  return `<div class="criteria-summary">${processingCriteriaSections(analysisLocale, interfaceLocale).map(section => `<section><h3>${escapeHtml(section.title)}</h3><ul>${section.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`).join('')}</div>`;
}

function processingCriteriaReportMarkup(analysisLocale, interfaceLocale = language) {
  return processingCriteriaSections(analysisLocale, interfaceLocale).map(section => `<h3>${escapeHtml(section.title)}</h3><ul>${section.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`).join('');
}

function infoHelp(text) {
  return `<button type="button" class="info-dot contextual-help" aria-label="${escapeHtml(text)}" data-help="${escapeHtml(text)}">i</button>`;
}

function sortedFragments(fragments) {
  const sorted = [...fragments];
  if (fragmentSort === 'easiest') {
    return sorted.sort((a, b) => b.score - a.score || b.words - a.words);
  }
  if (fragmentSort === 'longest') {
    return sorted.sort((a, b) => b.words - a.words || a.score - b.score);
  }
  if (fragmentSort === 'shortest') {
    return sorted.sort((a, b) => a.words - b.words || a.score - b.score);
  }
  return sorted.sort(compareFragmentDifficulty);
}

function compareFragmentDifficulty(a,b) {
  return (a.rawScore ?? a.score)-(b.rawScore ?? b.score) || b.words-a.words
    || String(a.pageUrl ?? '').localeCompare(String(b.pageUrl ?? '')) || String(a.text).localeCompare(String(b.text));
}

function sortedPages(pages) {
  const analyzedFirst = [...pages].sort((a, b) => (a.status === 'analyzed' ? 0 : 1) - (b.status === 'analyzed' ? 0 : 1));
  if (pageSort === 'easiest') {
    return analyzedFirst.sort((a, b) => comparableScore(b, -Infinity) - comparableScore(a, -Infinity) || (b.words ?? 0) - (a.words ?? 0));
  }
  if (pageSort === 'longest') {
    return analyzedFirst.sort((a, b) => (b.words ?? 0) - (a.words ?? 0) || comparableScore(a, Infinity) - comparableScore(b, Infinity));
  }
  if (pageSort === 'shortest') {
    return analyzedFirst.sort((a, b) => (a.words ?? 0) - (b.words ?? 0) || comparableScore(a, Infinity) - comparableScore(b, Infinity));
  }
  return analyzedFirst.sort((a, b) => comparableScore(a, Infinity) - comparableScore(b, Infinity) || (b.words ?? 0) - (a.words ?? 0));
}

function comparableScore(item, fallback) {
  if (item?.status && item.status !== 'analyzed') return fallback;
  if (item?.score === null || item?.score === undefined) return fallback;
  const value = Number(item?.score);
  return Number.isFinite(value) ? value : fallback;
}

function trafficFilterButton(code, label, action, count, total) {
  const selected = fragmentFilter === code;
  return `<button type="button" class="traffic-filter traffic-${code}" data-fragment-filter="${code}" aria-pressed="${selected}">
    <span>${escapeHtml(label)}</span><strong>${escapeHtml(count)} <em>${escapeHtml(trafficPercentage(count, total))}</em></strong><small>${escapeHtml(action)}</small>
  </button>`;
}

function trafficFilterButtons(counts, compact = false) {
  const dictionary = STRINGS[language];
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const buttons = [
    trafficFilterButton('red', dictionary.redStatus, dictionary.redAction, counts.red, total),
    trafficFilterButton('orange', language === 'es' ? 'Naranja' : 'Orange', language === 'es' ? 'Algo difícil' : 'Fairly difficult', counts.orange, total),
    trafficFilterButton('amber', dictionary.amberStatus, dictionary.amberAction, counts.amber, total),
    trafficFilterButton('lime', language === 'es' ? 'Verde claro' : 'Light green', language === 'es' ? 'Bastante fácil' : 'Fairly easy', counts.lime, total),
    trafficFilterButton('green', dictionary.greenStatus, dictionary.greenAction, counts.green, total),
  ];
  return `${compact ? '<span class="filter-label">' + (language === 'es' ? 'Filtrar por categoría:' : 'Filter by category:') + '</span>' : ''}${buttons.join('')}<button type="button" class="traffic-filter-reset" data-fragment-filter="all" ${fragmentFilter === 'all' ? 'disabled' : ''}>${language === 'es' ? 'Restablecer filtro' : 'Reset filter'}</button>`;
}

function bindTrafficFilters() {
  document.querySelectorAll('[data-fragment-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextFilter = button.dataset.fragmentFilter;
      fragmentFilter = nextFilter;
      visibleFragmentCount = FRAGMENTS_PER_PAGE;
      const status = document.querySelector('#appStatus');
      const label = nextFilter === 'all'
        ? (language === 'es' ? 'Filtro de fragmentos restablecido.' : 'Fragment filter reset.')
        : (language === 'es' ? `Filtrando fragmentos: ${trafficLabel(nextFilter)}.` : `Filtering fragments: ${trafficLabel(nextFilter)}.`);
      if (status) status.textContent = label;
      activeTab = 'fragments';
      renderResult();
    });
  });
}

function filterFragments(fragments) {
  if (fragmentFilter === 'all') return fragments;
  return fragments.filter((fragment) => severityForReading(fragment.score, fragment.level).code === fragmentFilter);
}

function trafficLabel(code) {
  const labels = language === 'es'
    ? { red: 'rojo', orange: 'naranja', amber: 'amarillo', lime: 'verde claro', green: 'verde' }
    : { red: 'red', orange: 'orange', amber: 'yellow', lime: 'light green', green: 'green' };
  return labels[code] ?? '-';
}

function overviewFact(label, value, detail) {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(value ?? '-'))}</dd><small>${escapeHtml(detail)}</small></div>`;
}

function trafficPercentage(count, total) {
  return total ? `${Math.round((count / total) * 100)}%` : '0%';
}

function totalTrafficFragments(counts) {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

function difficultFragmentCount(counts) {
  return (counts.red ?? 0) + (counts.orange ?? 0);
}

function difficultFragmentRate(counts) {
  return trafficPercentage(difficultFragmentCount(counts), totalTrafficFragments(counts));
}

function trafficDescription(counts) {
  const entries = ['red', 'orange', 'amber', 'lime', 'green']
    .map((code) => `${trafficLabel(code)}: ${counts[code]}`)
    .join(', ');
  return language === 'es' ? `Distribución de fragmentos: ${entries}.` : `Fragment distribution: ${entries}.`;
}

function donutSegments(counts) {
  const total = totalTrafficFragments(counts);
  if (!total) return '<circle class="donut-empty" cx="50" cy="50" r="42"></circle>';
  let offset = 0;
  return Object.entries(counts).map(([code, count]) => {
    if (!count) return '';
    const percentage = (count / total) * 100;
    const title = language === 'es'
      ? `${trafficLabel(code)}: ${count} fragmentos (${trafficPercentage(count, total)} del total)`
      : `${trafficLabel(code)}: ${count} fragments (${trafficPercentage(count, total)} of total)`;
    const segment = `<circle class="donut-segment donut-${code}" cx="50" cy="50" r="42" pathLength="100" stroke-dasharray="${percentage.toFixed(4)} ${(100 - percentage).toFixed(4)}" stroke-dashoffset="${(-offset).toFixed(4)}" transform="rotate(-90 50 50)"><title>${escapeHtml(title)}</title></circle>`;
    offset += percentage;
    return segment;
  }).join('');
}

function pageCard(page, dictionary) {
  const labels = analysisLabels();
  return `
    <article class="page-card">
      <h3>${externalLink(page.url, page.title || page.url)}</h3>
      <div class="url">${externalLink(page.url, page.url)}</div>
      <p class="reason">${escapeHtml(page.selectionReason || '')}</p>
      ${page.status === 'analyzed' ? trafficBadge(page.score, page.level, dictionary) : ''}
      <div class="meta-grid">
        ${datum('ID', page.pageId || '-')}
        ${datum(dictionary.source, page.source)}
        ${datum(language === 'es' ? 'Sección' : 'Section', page.section ?? '/')}
        ${datum(language === 'es' ? 'Profundidad' : 'Depth', page.depth ?? 0)}
        ${datum(dictionary.status, page.statusLabel)}
        ${datum(language === 'es' ? 'Frases' : 'Sentences', page.sentences ?? '-')}
        ${datum(dictionary.words, page.words ?? '-')}
        ${datum(language === 'es' ? 'Sílabas' : 'Syllables', page.syllables ?? '-')}
        ${scoreDatum(labels.score, page.status === 'analyzed' ? page.score : '-', page.level)}
        ${datum(labels.level, page.status === 'analyzed' ? severityForReading(page.score, page.level).action : '-')}
      </div>
      ${page.extraction ? `<details><summary>${language === 'es' ? 'Extracción y exclusiones' : 'Extraction and exclusions'}</summary><p>${language === 'es' ? `Bloques: ${page.extraction.blocksDetected}. Elegibles: ${page.extraction.eligible}. Excluidos por idioma: ${page.extraction.languageExcluded}; por longitud: ${page.extraction.lengthExcluded}; duplicados: ${page.extraction.duplicateParagraphsExcluded ?? 0}.` : `Blocks: ${page.extraction.blocksDetected}. Eligible: ${page.extraction.eligible}. Excluded by language: ${page.extraction.languageExcluded}; by length: ${page.extraction.lengthExcluded}; duplicates: ${page.extraction.duplicateParagraphsExcluded ?? 0}.`}</p></details>` : ''}
      ${page.reason ? `<details><summary>${language === 'es' ? 'Nota técnica' : 'Technical note'}</summary><p>${escapeHtml(page.reason)}</p></details>` : ''}
    </article>
  `;
}

function fragmentCard(fragment, dictionary) {
  const labels = analysisLabels();
  return `
    <article class="fragment-card">
      <h3>${externalLink(fragment.link || fragment.pageUrl, fragment.pageTitle || fragment.pageUrl)}</h3>
      <div class="url">${externalLink(fragment.link || fragment.pageUrl, fragment.pageUrl)}</div>
      ${trafficBadge(fragment.score, fragment.level, dictionary)}
      <dl class="fragment-facts">
        ${fragmentFact('ID', fragment.fragmentId || '-')}
        ${fragmentFact(language === 'es' ? 'Frases' : 'Sentences', fragment.sentences)}
        ${fragmentFact(dictionary.words, fragment.words)}
        ${fragmentFact(language === 'es' ? 'Sílabas' : 'Syllables', fragment.syllables)}
        ${fragmentFact(labels.score, fragment.score, `score-${severityForReading(fragment.score, fragment.level).code || 'unknown'}`)}
        ${fragmentFact(labels.level, severityForReading(fragment.score, fragment.level).action)}
      </dl>
      <p class="fragment-text">${escapeHtml(fragment.text)}</p>
    </article>
  `;
}

function samplingCard(row, dictionary) {
  const labels = analysisLabels();
  return `
    <article class="page-card">
      <h3>${externalLink(row.url, row.url)}</h3>
      <p class="reason">${escapeHtml(row.selectionReason)}</p>
      <div class="meta-grid">
        ${datum(dictionary.source, row.source)}
        ${datum(language === 'es' ? 'Sección' : 'Section', row.section ?? '/')}
        ${datum(language === 'es' ? 'Profundidad' : 'Depth', row.depth ?? 0)}
        ${datum(dictionary.decision, row.selected ? dictionary.selectedDecision : dictionary.notSelectedDecision)}
        ${datum(dictionary.status, row.statusLabel)}
        ${datum(dictionary.words, row.words ?? '-')}
        ${datum(labels.score, row.score ?? '-')}
      </div>
      ${row.selectionMethod ? `<p class="reason">${escapeHtml(language === 'es' ? `Método de selección: ${selectionMethodLabel(row.selectionMethod, 'es')}` : `Selection method: ${selectionMethodLabel(row.selectionMethod, 'en')}`)}</p>` : ''}
      ${row.eligible === false ? `<p class="reason">${escapeHtml(row.exclusionReason)}</p>` : ''}
    </article>
  `;
}

function selectionMethodLabel(method, lang) {
  const labels = lang === 'es'
    ? { mandatory: 'página obligatoria', stratified_random: 'selección documentada por sección', all_eligible: 'todas las elegibles' }
    : { mandatory: 'required page', stratified_random: 'documented selection by section', all_eligible: 'all eligible pages' };
  return labels[method] ?? method;
}

function samplingNotice(dictionary) {
  return `<article class="page-card"><p class="reason">${escapeHtml(dictionary.samplingTitle)}: ${escapeHtml(lastResult.summary.selected)} ${escapeHtml(dictionary.selected.toLowerCase())}.</p></article>`;
}

function datum(label, value) {
  return `<div class="datum"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function datumHtml(label, valueHtml) {
  return `<div class="datum"><span>${escapeHtml(label)}</span><strong>${valueHtml}</strong></div>`;
}

function fragmentFact(label, value, className = '') {
  return `<div${className ? ` class="${className}"` : ''}><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(value ?? '-'))}</dd></div>`;
}

function scoreDatum(label, value, level) {
  const severity = severityForReading(value, level);
  return `<div class="datum score-datum score-${severity.code || 'unknown'}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function criteria(label, value) {
  return `<article class="criteria-card">${datum(label, value)}</article>`;
}

function trafficBadge(score, level, dictionary) {
  const severity = severityForReading(score, level, dictionary);
  return `
    <div class="traffic-badge ${severity.className}">
      <span>${escapeHtml(severity.label)}</span>
      <strong>${escapeHtml(severity.action)}</strong>
      <small>${escapeHtml(severity.meaning)}</small>
    </div>
  `;
}

function severityForReading(score, level = '', dictionary = STRINGS[language], locale = language) {
  const value = Number(score);
  if (score === null || score === '' || !Number.isFinite(value)) {
    return {
      code: '',
      label: '-',
      action: '-',
      meaning: '-',
      className: 'traffic-unknown',
    };
  }
  const rules = lastResult?.criteria.categories ?? [];
  const category = rules.find(row => row.label === level) ?? rules.find(row => row.minimum === null || value >= row.minimum);
  const code = category?.color ?? 'unknown';
  const labels = locale === 'es' ? {red:'ROJO',orange:'NARANJA',amber:'AMARILLO',lime:'VERDE CLARO',green:'VERDE'} : {red:'RED',orange:'ORANGE',amber:'YELLOW',lime:'LIGHT GREEN',green:'GREEN'};
  return {code, label: labels[code] ?? '-', action: difficultyAction(code, locale) ?? level,
    meaning: code === 'red' || code === 'orange' ? dictionary.redMeaning : code === 'amber' ? dictionary.amberMeaning : dictionary.greenMeaning,
    className: `traffic-${code}`};
}

function difficultyAction(code, locale = language) {
  const actions = locale === 'es'
    ? {red: 'Muy difícil', orange: 'Algo difícil', amber: 'Normal', lime: 'Bastante fácil', green: 'Muy fácil'}
    : {red: 'Very difficult', orange: 'Somewhat difficult', amber: 'Normal', lime: 'Fairly easy', green: 'Very easy'};
  return actions[code] ?? '-';
}

function severityForScore(score, dictionary = STRINGS[language]) {
  return severityForReading(score, '', dictionary);
}

function csvTrafficForReading(score, level = '') {
  const severity = severityForReading(score, level, STRINGS.en, 'en');
  const messages = {
    red: ['Review first', 'May present comprehension barriers.'],
    orange: ['Review', 'May be difficult to understand.'],
    amber: ['Review if key content', 'May need targeted simplification.'],
    lime: ['No immediate priority', 'Generally easy to read.'],
    green: ['No immediate priority', 'Generally easy to read.'],
  };
  const [action, meaning] = messages[severity.code] ?? ['-', '-'];
  return {...severity, action, meaning};
}

function englishCsvValue(value, field = '') {
  const text = String(value ?? '');
  const fixed = {
    'HTML local': 'local HTML',
    'página indicada': 'selected page',
    'dominio inicial': 'initial domain',
    'página obligatoria': 'required page',
    'página inicial': 'homepage link',
    'mapa del sitio': 'sitemap',
    'enlace interno': 'internal crawl',
    'aviso de rastreo': 'crawl warning',
    'Incluida desde un archivo HTML local.': 'Included from an uploaded local HTML file.',
    'Incluida porque la indicó el usuario.': 'Included because it was entered by the user.',
    'Incluida como página inicial.': 'Included as the starting page.',
    'Incluida porque el usuario la marcó como obligatoria.': 'Included because the user marked it as required.',
    'Incluida por estar enlazada desde la página inicial.': 'Included because it is linked from the initial page.',
    'Incluida porque aparece en el mapa del sitio.': 'Included because it appears in the site sitemap.',
    'Incluida porque aparece en un sitemap detectado.': 'Included because it appears in a discovered sitemap.',
    'Detectada al seguir un enlace interno.': 'Discovered by following an internal link.',
    'Excluida por robots.txt para este rastreador.': 'Excluded by robots.txt for this crawler.',
    'Excluida por el robots.txt de este host para este rastreador.': 'Excluded by this host’s robots.txt for this crawler.',
    'analizada': 'analyzed',
    'descartada': 'discarded',
    'Muy difícil': 'Very difficult',
    'Algo difícil': 'Somewhat difficult',
    'Normal': 'Normal',
    'Bastante fácil': 'Fairly easy',
    'Muy fácil': 'Very easy',
  };
  if (fixed[text]) return fixed[text];
  if (field === 'reason') {
    const shortPage = text.match(/^Página breve:\s*(\d+)\s*palabras\./i);
    if (shortPage) return `Short page: ${shortPage[1]} words. Metrics are shown, but interpret them with caution.`;
    if (text.startsWith('Analizada tras renderizar')) return 'Analyzed after rendering the page with a local browser because the initial HTML looked incomplete.';
  }
  return text;
}

function difficultLevel(level) {
  const text = String(level ?? '').toLowerCase();
  return text.includes('difficult') || text.includes('difícil') || text.includes('dificil');
}

function trafficCounts(result) {
  const fragments = result.fragments ?? result.pages?.flatMap((page) => page.fragments ?? []) ?? [];
  return fragments.reduce((counts, fragment) => {
    const severity = severityForReading(fragment.score, fragment.level);
    if (severity.code in counts) counts[severity.code] += 1;
    return counts;
  }, { red: 0, orange: 0, amber: 0, lime: 0, green: 0 });
}

function lowThreshold(result) {
  const pages = result.pages.filter((page) => page.status === 'analyzed');
  if (!pages.length) return '-';
  const threshold = result.language === 'en' ? 50 : 55;
  return `${Math.round((pages.filter((page) => page.score < threshold).length / pages.length) * 100)}%`;
}

function thresholdLabel() {
  return (lastResult?.language ?? analysisLanguage) === 'en' ? 'Flesch < 50' : 'Szigriszt < 55';
}

function shortThresholdLabel() {
  return (lastResult?.language ?? analysisLanguage) === 'en' ? 'Flesch<50' : 'Szigriszt<55';
}

function bindDownloads() {
  document.querySelectorAll('[data-download]').forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.dataset.download;
      if (type === 'fragments') downloadFragments(lastResult);
      else if (type === 'sampling') downloadSampling(lastResult);
      else if (type === 'workbook') downloadWorkbook(lastResult);
      else if (type === 'brief-report') downloadReport(lastResult, 'brief');
      else if (type === 'full-report') downloadReport(lastResult, 'full');
      else downloadPages(lastResult);
    });
  });
}

function downloadReport(result, kind) {
  openScientificReport(result, kind);
}

function reportNumber(value, locale, digits = 1, unavailable) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return unavailable;
  return numeric.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function reportCount(value, singular, plural, locale) {
  const numeric = Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return `${safeValue.toLocaleString(locale)} ${safeValue === 1 ? singular : plural}`;
}

function reportSyllableValidationSection(result, table, { full, es }) {
  const t = (spanish, english) => es ? spanish : english;
  const unavailable = t('No disponible', 'Unavailable');
  const locale = es ? 'es-ES' : 'en-GB';
  const v = result.syllableValidation?.data;
  const title = t('Comprobación del recuento de sílabas', 'Syllable-count check');
  if (!v) {
    return `<section class="method-check"><h3>${title}</h3><p>${t('No se pudo cargar la comprobación guardada del contador de sílabas. Este informe no usa esa comprobación como prueba de calidad; el análisis de la página sí se ha completado.', 'The stored syllable-count check could not be loaded. This report does not treat that check as evidence of quality; the page analysis itself still completed.')}</p></section>`;
  }
  const wordsInTest = Number(v.total_word_types) || 0;
  const compared = Number(v.compared_word_types) || 0;
  const excluded = Number(v.excluded_word_types) || 0;
  const exact = Number(v.exact_type_agreement);
  const weighted = Number(v.frequency_weighted_agreement);
  const exactCount = Math.round(exact * compared);
  const exactText = Number.isFinite(exact) ? `${exactCount.toLocaleString(locale)} de ${compared.toLocaleString(locale)} (${reportNumber(exact * 100, locale, 1, unavailable)} %)` : unavailable;
  const weightedText = Number.isFinite(weighted) ? `${reportNumber(weighted * 100, locale, 1, unavailable)} %` : unavailable;
  const reference = result.language === 'es'
    ? (es ? 'pylabeador 0.9.0, un programa que divide palabras españolas en sílabas' : 'pylabeador 0.9.0, software that divides Spanish words into syllables')
    : (es ? 'CMU Pronouncing Dictionary, un diccionario de pronunciaciones del inglés estadounidense' : 'the CMU Pronouncing Dictionary, a North American English pronunciation dictionary');
  const summary = `<p><strong>${t('Qué se comprobó.', 'What was checked.')}</strong> ${t(`Se comparó el número de sílabas de ${wordsInTest.toLocaleString(locale)} palabras frecuentes con una referencia externa: ${reference}.`, `The syllable count for ${wordsInTest.toLocaleString(locale)} common words was compared with an external reference: ${reference}.`)}</p>
    <p><strong>${t('Resultado.', 'Result.')}</strong> ${t(`${compared.toLocaleString(locale)} palabras tenían un recuento de referencia y ${excluded.toLocaleString(locale)} no pudieron contrastarse porque la referencia no ofrecía uno. Radar coincidió exactamente en ${exactText}.`, `${compared.toLocaleString(locale)} words had a reference count and ${excluded.toLocaleString(locale)} could not be compared because the reference did not provide one. Radar matched exactly for ${exactText}.`)}</p>
    <p><strong>${t('Qué significa.', 'What this means.')}</strong> ${t('Esta comprobación indica si el programa cuenta sílabas de forma consistente con la referencia usada. No mide si una persona comprenderá el texto ni garantiza que todo el contenido de una web se haya podido extraer.', 'This check indicates whether the program counts syllables consistently with the reference used. It does not measure whether a person will understand the text or guarantee that all web content was extracted.')}</p>`;
  if (!full) return `<section class="method-check"><h3>${title}</h3>${summary}</section>`;
  const rows = [
    [t('Palabras incluidas en la comprobación', 'Words in the check'), wordsInTest.toLocaleString(locale)],
    [t('Palabras comparadas con una referencia', 'Words compared with a reference'), compared.toLocaleString(locale)],
    [t('Palabras sin referencia disponible', 'Words without an available reference'), excluded.toLocaleString(locale)],
    [t('Coincidencia exacta por palabra', 'Exact agreement per word'), exactText],
    [t('Coincidencia dando más peso a palabras frecuentes', 'Agreement giving more weight to frequent words'), weightedText],
    [t('Diferencia media de sílabas por palabra (Radar menos referencia)', 'Mean syllable difference per word (Radar minus reference)'), reportNumber(v.mean_signed_error_weighted, locale, 4, unavailable)],
    [t('Cambio estimado en el índice por esa diferencia', 'Estimated score change caused by that difference'), reportNumber(v.implied_score_bias, locale, 4, unavailable)],
  ];
  const generatedAt = v.generated_at ? new Date(v.generated_at).toLocaleString(locale, { timeZone: 'UTC' }) : unavailable;
  return `<section class="method-check"><h3>${title}</h3>${summary}<h4>${t('Datos técnicos de la comprobación', 'Technical check data')}</h4>${table([t('Medida', 'Measure'), t('Resultado', 'Result')], rows)}<p>${t(`La coincidencia ponderada da más peso a las palabras frecuentes. Las ${excluded.toLocaleString(locale)} palabras sin referencia no se tratan como errores: simplemente quedan fuera de esta comparación. La diferencia con signo es Radar menos la referencia.`, `The weighted agreement gives more weight to frequent words. The ${excluded.toLocaleString(locale)} words without a reference are not treated as errors: they are simply left out of this comparison. The signed difference is Radar minus the reference.`)}</p><p class="url">${t('Fecha de la comprobación', 'Check date')}: ${escapeHtml(generatedAt)} (UTC). ${t('Huella del cálculo comprobado', 'Fingerprint of the checked calculation')}: ${escapeHtml(v.processing_sha256 || unavailable)}.</p>${result.syllableValidation?.matchesCurrentProcessing ? '' : `<p>${t('Atención: esta comprobación pertenece a otra versión del cálculo o de su diccionario silábico y debe repetirse antes de atribuirla a la versión actual.', 'Note: this check belongs to another calculation or syllable-dictionary version and must be repeated before it is attributed to the current version.')}</p>`}</section>`;
}

function reportIndexValidationSection(result, table, { full, es }) {
  const t = (spanish, english) => es ? spanish : english;
  const unavailable = t('No disponible', 'Unavailable');
  const locale = es ? 'es-ES' : 'en-GB';
  if (result.language !== 'es') {
    const v = result.indexValidation;
    const total = v?.groups?.find(group => group.group === 'all');
    if (!total) return `<section class="method-check"><h3>${t('Comprobación con software de referencia', 'Reference-software check')}</h3><p>${t('No se pudieron cargar datos de comparación con el software de referencia. Este informe no presenta una conclusión de equivalencia entre programas.', 'Comparison data with the reference software could not be loaded. This report does not present a conclusion of equivalence between programs.')}</p></section>`;
    // Microsoft Word reports Flesch Reading Ease on 0–100. The report must
    // therefore use the explicitly bounded comparison, not the diagnostic
    // unbounded calculation retained in the raw validation file.
    const difference = reportNumber(total.bounded_mean_absolute_difference, locale, 3, unavailable);
    const lin = reportNumber(total.bounded_lins_concordance_correlation, locale, 4, unavailable);
    const summary = `<p><strong>${t('Qué se comparó.', 'What was compared.')}</strong> ${t('Radar y Microsoft Word analizaron los mismos 100 textos en inglés mediante Flesch Reading Ease, en una escala común de 0 a 100.', 'Radar and Microsoft Word analyzed the same 100 English texts using Flesch Reading Ease, on a shared 0 to 100 scale.')}</p><p><strong>${t('Resultado.', 'Result.')}</strong> ${t(`La diferencia media entre puntuaciones fue de ${difference} puntos. El coeficiente de concordancia de Lin fue ${lin}; un valor de 1 indica coincidencia perfecta.`, `The mean difference between scores was ${difference} points. Lin's concordance coefficient was ${lin}; a value of 1 indicates perfect agreement.`)}</p><p><strong>${t('Qué significa.', 'What this means.')}</strong> ${t('La comparación mide el parecido numérico entre ambos resultados. No prueba que las personas comprendan el texto ni que ambos programas tengan reglas internas idénticas.', 'The comparison measures numerical similarity between both results. It does not prove that people understand the text or that both programs use identical internal rules.')}</p>`;
    const currentProcessingNote = v.matchesCurrentProcessing
      ? ''
      : `<p>${t('Atención: esta comparación pertenece a otra versión del cálculo o de su diccionario silábico y debe repetirse antes de atribuirla a la versión actual.', 'Note: this comparison belongs to another calculation or syllable-dictionary version and must be repeated before it is attributed to the current version.')}</p>`;
    if (!full) return `<section class="method-check"><h3>${t('Comprobación con software de referencia', 'Reference-software check')}</h3>${summary}${currentProcessingNote}</section>`;
    return `<section class="method-check"><h3>${t('Comprobación con software de referencia', 'Reference-software check')}</h3>${summary}${table([t('Medida', 'Measure'), t('Resultado', 'Result')], [[t('Textos comparados', 'Texts compared'), String(total.texts_compared)], [t('Diferencia media absoluta (escala 0–100)', 'Mean absolute difference (0–100 scale)'), `${difference} ${t('puntos', 'points')}`], [t('Diferencia media con signo (Radar menos Word; escala 0–100)', 'Mean signed difference (Radar minus Word; 0–100 scale)'), `${reportNumber(total.bounded_mean_signed_difference, locale, 3, unavailable)} ${t('puntos', 'points')}`], [t('Relación entre las puntuaciones (Pearson; escala 0–100)', 'Relationship between scores (Pearson; 0–100 scale)'), reportNumber(total.bounded_pearson_correlation, locale, 4, unavailable)], [t('Concordancia de nivel y dispersión (Lin; escala 0–100)', 'Agreement in score level and spread (Lin; 0–100 scale)'), lin]])}${currentProcessingNote}</section>`;
  }
  const v = result.indexValidation?.spanish;
  if (!v) return `<section class="method-check"><h3>${t('Comprobación con INFLESZ', 'INFLESZ check')}</h3><p>${t('No se pudieron cargar los datos de comparación con INFLESZ. Este informe no presenta una conclusión de equivalencia entre ambos programas.', 'The comparison data with INFLESZ could not be loaded. This report does not present a conclusion of equivalence between both programs.')}</p></section>`;
  const textsPrepared = Number(v.texts_total) || 0;
  const textsCompared = Number(v.texts_compared) || 0;
  const externalMissing = Number(v.external_errors) || 0;
  const difference = reportNumber(v.mean_absolute_difference, locale, 3, unavailable);
  const categoryAgreement = Number(v.category_agreement);
  const categoryText = Number.isFinite(categoryAgreement) ? `${reportNumber(categoryAgreement * 100, locale, 1, unavailable)} % (${Number(v.same_category_count || 0).toLocaleString(locale)} de ${textsCompared.toLocaleString(locale)})` : unavailable;
  const availability = externalMissing === 0
    ? t(`Los ${textsCompared.toLocaleString(locale)} textos obtuvieron una puntuación en ambos programas. No faltó ningún resultado externo y no se excluyó ningún texto de los cálculos.`, `All ${textsCompared.toLocaleString(locale)} texts received a score in both programs. No external result was missing and no text was excluded from the calculations.`)
    : t(`${textsCompared.toLocaleString(locale)} textos obtuvieron una puntuación en ambos programas. ${externalMissing.toLocaleString(locale)} resultado${externalMissing === 1 ? '' : 's'} externo${externalMissing === 1 ? '' : 's'} no estuvo disponible${externalMissing === 1 ? '' : 's'} y se excluyó${externalMissing === 1 ? '' : 'eron'} de los cálculos.`, `${textsCompared.toLocaleString(locale)} texts received a score in both programs. ${externalMissing.toLocaleString(locale)} external result${externalMissing === 1 ? ' was' : 's were'} unavailable and excluded from the calculations.`);
  const summary = `<p><strong>${t('Qué se comparó.', 'What was compared.')}</strong> ${t(`Radar e INFLESZ analizaron los mismos ${textsPrepared.toLocaleString(locale)} textos de prueba con la escala Szigriszt-Pazos.`, `Radar and INFLESZ analyzed the same ${textsPrepared.toLocaleString(locale)} test texts with the Szigriszt-Pazos scale.`)}</p><p><strong>${t('Resultado.', 'Result.')}</strong> ${availability} ${t(`La diferencia media entre puntuaciones fue de ${difference} puntos y la categoría coincidió en ${categoryText}.`, `The mean difference between scores was ${difference} points and the category matched in ${categoryText}.`)}</p><p><strong>${t('Qué significa.', 'What this means.')}</strong> ${t('Esta comprobación mide el acuerdo con INFLESZ en estos textos de prueba. No demuestra que una persona concreta comprenda un texto ni sustituye pruebas con usuarios.', 'This check measures agreement with INFLESZ on these test texts. It does not show that a particular person will understand a text or replace user testing.')}</p>`;
  const currentProcessingNote = result.indexValidation?.matchesCurrentProcessing
    ? ''
    : `<p>${t('Atención: esta comparación pertenece a otra versión del cálculo o de su diccionario silábico y debe repetirse antes de atribuirla a la versión actual.', 'Note: this comparison belongs to another calculation or syllable-dictionary version and must be repeated before it is attributed to the current version.')}</p>`;
  if (!full) return `<section class="method-check"><h3>${t('Comprobación con INFLESZ', 'INFLESZ check')}</h3>${summary}${currentProcessingNote}</section>`;
  const rows = [
    [t('Programa de referencia', 'Reference program'), v.reference_software || 'INFLESZ'],
    [t('Textos preparados', 'Prepared texts'), textsPrepared.toLocaleString(locale)],
    [t('Textos con resultado en ambos programas', 'Texts with a result in both programs'), textsCompared.toLocaleString(locale)],
    [t('Resultados externos no disponibles', 'Unavailable external results'), externalMissing.toLocaleString(locale)],
    [t('Media de Radar', 'Radar mean'), reportNumber(v.mean_radar_score, locale, 3, unavailable)],
    [t('Media de INFLESZ', 'INFLESZ mean'), reportNumber(v.mean_inflesz_score, locale, 3, unavailable)],
    [t('Diferencia media absoluta', 'Mean absolute difference'), `${difference} ${t('puntos', 'points')}`],
    [t('Diferencia media con signo (Radar menos INFLESZ)', 'Mean signed difference (Radar minus INFLESZ)'), `${reportNumber(v.mean_signed_difference, locale, 3, unavailable)} ${t('puntos', 'points')}`],
    [t('Acuerdo de categoría', 'Category agreement'), categoryText],
    [t('Relación entre las puntuaciones (Pearson)', 'Relationship between scores (Pearson)'), reportNumber(v.pearson_correlation, locale, 4, unavailable)],
    [t('Concordancia de nivel y dispersión (Lin)', 'Agreement in score level and spread (Lin)'), reportNumber(v.lins_concordance_correlation, locale, 4, unavailable)],
  ];
  const mismatchDetails = Array.isArray(v.category_mismatches) && v.category_mismatches.length
    ? `<details><summary>${t(`Ver los ${v.category_mismatches.length} textos con una categoría distinta`, `View the ${v.category_mismatches.length} texts with a different category`)}</summary>${table([t('Texto', 'Text'), 'Radar', 'INFLESZ', t('Límite cercano', 'Nearby threshold')], v.category_mismatches.map(item => [item.text_id, reportNumber(item.radar_score, locale, 3, unavailable), reportNumber(item.inflesz_score, locale, 3, unavailable), reportNumber(item.threshold, locale, 0, unavailable)]))}<p>${t('Estas diferencias aparecen cerca de un límite de categoría. Son útiles para revisar cómo se interpreta una puntuación próxima al corte.', 'These differences occur close to a category threshold. They are useful when interpreting a score near a cutoff.')}</p></details>`
    : '';
  const generatedAt = v.generated_at ? new Date(v.generated_at).toLocaleString(locale, { timeZone: 'UTC' }) : unavailable;
  return `<section class="method-check"><h3>${t('Comprobación con INFLESZ', 'INFLESZ check')}</h3>${summary}<h4>${t('Datos técnicos de la comparación', 'Technical comparison data')}</h4>${table([t('Medida', 'Measure'), t('Resultado', 'Result')], rows)}${mismatchDetails}<p>${t('La diferencia media absoluta expresa la distancia media entre dos puntuaciones, sin importar cuál es mayor. Pearson indica si las puntuaciones aumentan y disminuyen juntas; Lin también tiene en cuenta si están en el mismo nivel. Un valor de 1 representa concordancia perfecta.', 'The mean absolute difference is the average distance between two scores, regardless of which is higher. Pearson indicates whether scores rise and fall together; Lin also considers whether they are at the same level. A value of 1 represents perfect agreement.')}</p><p class="url">${t('Fecha de la comparación', 'Comparison date')}: ${escapeHtml(generatedAt)} (UTC). ${t('Huella del cálculo comprobado', 'Fingerprint of the checked calculation')}: ${escapeHtml(v.processing_sha256 || unavailable)}.</p>${currentProcessingNote}</section>`;
}

function openScientificReport(result, kind) {
  const full = kind === 'full';
  const es = language === 'es';
  const t = (spanish, english) => es ? spanish : english;
  const e = escapeHtml;
  const analysisLanguageName = result.language === 'es' ? t('español', 'Spanish') : t('inglés', 'English');
  const all = [...(result.fragments ?? [])].sort(compareFragmentDifficulty);
  const sourceLabel = value => String(value ?? '').replace(/^local-html:\/\//, t('Archivo HTML local: ', 'Local HTML file: '));
  const table = (headers, rows) => `<table><thead><tr>${headers.map(h=>`<th>${e(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${e(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const locale = es ? 'es-ES' : 'en-GB';
  const unavailable = t('No disponible', 'Unavailable');
  const pages = result.pages ?? [];
  const domains = result.domains ?? [];
  const summary = result.summary ?? {};
  const criteria = result.criteria ?? {};
  const number = (value, digits = 1) => reportNumber(value, locale, digits, unavailable);
  const valueOrDash = value => value === null || value === undefined || value === '' ? '—' : typeof value === 'number' ? value.toLocaleString(locale) : String(value);
  const pageStatus = status => status === 'analyzed' ? t('analizada', 'analyzed') : status === 'discarded' ? t('descartada', 'discarded') : status === 'duplicate' ? t('contenido duplicado excluido', 'duplicate content excluded') : status === 'error' ? t('error', 'error') : valueOrDash(status);
  const pageData = table(['ID',t('Página o archivo','Page or file'),t('Estado','Status'),t('Fragmentos','Fragments'),t('Puntuación','Score'),t('Categoría','Category')], pages.map(page => [page.pageId, sourceLabel(page.url), pageStatus(page.status), valueOrDash(page.fragmentCount ?? page.fragments?.length), page.status === 'analyzed' ? number(page.score) : '—', page.status === 'analyzed' ? severityForReading(page.score, page.level).action : '—']));
  // Coverage is meaningful only when the visitor asked for a domain crawl. A
  // one-page or local-file review must never imply that the rest of a domain was
  // examined, or expose empty crawl settings such as "undefined pages".
  const coverage = criteria.scope === 'domain' ? criteria.coverage : null;
  const coverageData = coverage ? table([t('Dominio','Domain'),t('Descubiertas','Discovered'),t('Elegibles','Eligible'),t('Analizadas','Analyzed'),t('Excluidas por idioma','Excluded by language'),t('Secciones','Sections'),t('Cobertura','Coverage')], domains.map(domain => [valueOrDash(domain.domain), valueOrDash(domain.candidatesDetected), valueOrDash(domain.eligibleCandidates), valueOrDash(domain.analyzedPages), valueOrDash(domain.languageExcludedPages ?? 0), valueOrDash(domain.sections?.length), domain.partialReasons?.length ? t('Parcial: ', 'Partial: ') + coverageReasonText(domain.partialReasons) : t('Dentro de los límites', 'Within the stated limits')])) : '';
  const coverageLimits = [];
  if (coverage && Number.isFinite(Number(coverage.maxCandidates))) coverageLimits.push(t(`máximo técnico de ${Number(coverage.maxCandidates).toLocaleString(locale)} direcciones candidatas`, `technical maximum of ${Number(coverage.maxCandidates).toLocaleString(locale)} candidate addresses`));
  if (coverage && Number.isFinite(Number(coverage.maxCrawlPagesPerDomain))) coverageLimits.push(t(`hasta ${Number(coverage.maxCrawlPagesPerDomain).toLocaleString(locale)} páginas exploradas por dominio`, `up to ${Number(coverage.maxCrawlPagesPerDomain).toLocaleString(locale)} pages explored per domain`));
  if (coverage?.maxCrawlDepth === null) coverageLimits.push(t('sin límite interno de profundidad de enlaces', 'no internal link-depth limit'));
  else if (coverage && Number.isFinite(Number(coverage.maxCrawlDepth))) coverageLimits.push(t(`hasta ${Number(coverage.maxCrawlDepth).toLocaleString(locale)} niveles de enlace`, `up to ${Number(coverage.maxCrawlDepth).toLocaleString(locale)} link levels`));
  const coverageIntro = coverage ? `<p>${t('La exploración del dominio combinó robots.txt, sitemaps y enlaces internos cuando estaban disponibles.', 'The domain crawl combined robots.txt, sitemaps, and internal links when available.')} ${coverageLimits.length ? t('Límites registrados para esta ejecución: ', 'Recorded limits for this run: ') + coverageLimits.join('; ') + '.' : t('No se registraron límites de exploración en el resultado.', 'No crawl limits were recorded in the result.')} ${coverage.includeRelatedSubdomains ? t('Se incluyeron subdominios del mismo dominio registrable.', 'Subdomains under the same registrable domain were included.') : t('No se incluyeron subdominios.', 'Subdomains were not included.')}</p>` : '';
  const hasAverage = Number.isFinite(Number(summary.averageScore));
  const averageLevel = hasAverage ? severityForReading(Number(summary.averageScore), summary.averageLevel).action : unavailable;
  const isLocalFile = pages.some(page => String(page.url || '').startsWith('local-html://'));
  const scopeText = criteria.scope === 'domain'
    ? t('Se revisó un dominio mediante las direcciones que el análisis pudo descubrir y seleccionar. El resultado describe esas páginas, no garantiza que se haya revisado todo el dominio.', 'A domain was reviewed through the addresses that the analysis could discover and select. The result describes those pages and does not guarantee that the entire domain was reviewed.')
    : isLocalFile
      ? t('Se revisó solamente el archivo HTML cargado en este navegador. No se consultó ninguna otra página del dominio.', 'Only the HTML file loaded in this browser was reviewed. No other page from the domain was requested.')
      : t('Se revisó solamente la URL indicada. No se exploró ni se valoró el resto de ese dominio.', 'Only the stated URL was reviewed. The rest of that domain was not crawled or assessed.');
  const sourceList = domains.map(domain => sourceLabel(domain.startUrl || domain.domain)).filter(Boolean).join(', ') || unavailable;
  const summaryList = `<ul class="report-list summary-list"><li><strong>${t('Contenido revisado', 'Content reviewed')}:</strong> ${e(sourceList)}</li><li><strong>${t('Páginas con puntuación', 'Pages with a score')}:</strong> ${reportCount(summary.analyzed ?? 0, t('página', 'page'), t('páginas', 'pages'), locale)} ${t('de', 'of')} ${valueOrDash(summary.selected)} ${t('seleccionadas', 'selected')}.</li><li><strong>${t('Fragmentos de texto evaluables', 'Eligible text fragments')}:</strong> ${reportCount(all.length, t('fragmento', 'fragment'), t('fragmentos', 'fragments'), locale)}.</li><li><strong>${t('Puntuación media de página', 'Mean page score')}:</strong> ${hasAverage ? `${number(summary.averageScore)} · ${e(averageLevel)}` : unavailable}.</li><li><strong>${t('Idioma analizado', 'Language analyzed')}:</strong> ${e(analysisLanguageName)}.</li></ul>`;
  const scopeList = `<ul class="report-list"><li>${e(scopeText)}</li><li>${t('Cada fragmento corresponde a un párrafo HTML completo; no se recorta para calcularlo ni para mostrarlo. Las copias idénticas dentro de una misma URL se excluyen para evitar duplicados.', 'Each fragment is one complete HTML paragraph; it is not shortened for calculation or display. Identical copies within one URL are excluded to avoid duplicates.')}</li><li>${t('Una puntuación de legibilidad no es un porcentaje de comprensión. Sirve para priorizar revisiones de texto, no para certificar accesibilidad ni comprensión individual.', 'A readability score is not a percentage of comprehension. It helps prioritise text review; it does not certify accessibility or individual understanding.')}</li></ul>`;
  const fragmentLine = fragment => `${number(fragment.score)} · ${e(severityForReading(fragment.score, fragment.level).action)} · ${reportCount(fragment.words, t('palabra', 'word'), t('palabras', 'words'), locale)} · ${reportCount(fragment.sentences, t('frase', 'sentence'), t('frases', 'sentences'), locale)}`;
  const excerpt = value => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > 360 ? `${text.slice(0, 357).trimEnd()}…` : text;
  };
  const briefFindings = all.length
    ? all.slice(0, 5).map((fragment, index) => `<article class="finding"><h3>${t('Prioridad', 'Priority')} ${index + 1}</h3><p><strong>${fragmentLine(fragment)}</strong></p><p class="url">${e(sourceLabel(fragment.pageUrl))}</p><p>${e(excerpt(fragment.text))}</p></article>`).join('')
    : `<p>${t('No se encontraron párrafos que alcanzaran el mínimo de palabras configurado. Comprueba la URL, el contenido visible y los ajustes de extracción antes de interpretar un resultado sin fragmentos.', 'No paragraph reached the configured minimum word count. Check the URL, visible content, and extraction settings before interpreting a result with no fragments.')}</p>`;
  const references = result.language === 'es'
    ? `<p>Real Academia Española &amp; Asociación de Academias de la Lengua Española. (2010). <i>Ortografía de la lengua española</i>. Espasa. Las convenciones sobre diptongos, triptongos, hiatos, <i>qu</i>/<i>gu</i> y diéresis orientan las reglas de respaldo.</p><p>Barrio-Cantalejo, I. M., Simón-Lorda, P., Melguizo, M., Escalona, I., Marijuán, M. I., &amp; Hernando, P. (2008). Validación de la Escala INFLESZ para evaluar la legibilidad de los textos dirigidos a pacientes. <i>Anales del Sistema Sanitario de Navarra, 31</i>(2), 135-152. https://recyt.fecyt.es/index.php/ASSN/article/view/1953</p><p>de Vera, J. (2026). <i>Pylabeador</i> (Version 0.9.0) [Computer software]. https://pypi.org/project/pylabeador/</p>`
    : `<p>Flesch, R. (1948). A new readability yardstick. <i>Journal of Applied Psychology, 32</i>(3), 221-233. https://doi.org/10.1037/h0057532</p><p>Carnegie Mellon University. (n.d.). <i>The CMU pronouncing dictionary</i> [Data set]. https://github.com/cmusphinx/cmudict</p><p>Microsoft. (n.d.). <i>Get your document's readability and level statistics in Microsoft Word.</i> https://support.microsoft.com/en-us/word/get-your-document-s-readability-and-level-statistics-in-microsoft-word</p><p>Microsoft. (n.d.). <i>ReadabilityStatistics collection (Word).</i> https://learn.microsoft.com/en-us/office/vba/api/word.readabilitystatistics</p>`;
  const fragmentData = all.map((fragment, index) => {
    const severity = severityForReading(fragment.score, fragment.level);
    const color = ({ red: '#b21d27', orange: '#9c4609', amber: '#7b5700', lime: '#46652f', green: '#12624c' })[severity.code] || '#173b49';
    return `<article><h3>${index + 1}. ${e(fragment.pageTitle || t('Sin título', 'Untitled'))}</h3><p class="url">${e(sourceLabel(fragment.pageUrl))}</p><p><b>${t('Índice', 'Score')}: <span style="color:${color}">${number(fragment.score)}</span></b> · ${e(severity.action)} · ${reportCount(fragment.words, t('palabra', 'word'), t('palabras', 'words'), locale)} · ${reportCount(fragment.sentences, t('frase', 'sentence'), t('frases', 'sentences'), locale)} · ${reportCount(fragment.syllables, t('sílaba estimada', 'estimated syllable'), t('sílabas estimadas', 'estimated syllables'), locale)}</p><p>${e(fragment.text)}</p></article>`;
  }).join('');
  const briefMethod = `<p>${e(result.metric || unavailable)}. ${t(`Se calculó a partir de las palabras, frases y sílabas del texto extraído. Se incluyeron párrafos de al menos ${valueOrDash(criteria.minFragmentWords)} palabras y páginas de al menos ${valueOrDash(criteria.minWords)} palabras.`, `It was calculated from the words, sentences, and syllables in the extracted text. Paragraphs of at least ${valueOrDash(criteria.minFragmentWords)} words and pages of at least ${valueOrDash(criteria.minWords)} words were included.`)}</p>`;
  const fullMethod = `<h2>${t('Método reproducible', 'Reproducible method')}</h2><p><strong>${e(result.metric || unavailable)}.</strong> ${t(`Mínimo de palabras por fragmento: ${valueOrDash(criteria.minFragmentWords)}. Mínimo por página: ${valueOrDash(criteria.minWords)}.`, `Minimum words per fragment: ${valueOrDash(criteria.minFragmentWords)}. Minimum words per page: ${valueOrDash(criteria.minWords)}.`)}</p><p>${t('Cada puntuación de página se calcula con el total de palabras, frases y sílabas de su texto extraído. Los párrafos ayudan a localizar el contenido que conviene revisar, pero no se promedian para crear la puntuación de página. El recuento de sílabas es una estimación reproducible; no equivale a una prueba con lectores.', 'Each page score is calculated from the total words, sentences, and syllables in its extracted text. Paragraphs help locate content to review, but they are not averaged to create the page score. The syllable count is a reproducible estimate; it is not a test with readers.')}</p><h3>${t('Fórmula y categorías', 'Formula and categories')}</h3><p>${result.language === 'es' ? (es ? 'Szigriszt-Pazos: 206,835 − 62,3 × (sílabas / palabras) − (palabras / frases). Las categorías INFLESZ se interpretan conforme a Barrio-Cantalejo et al. (2008).' : 'Szigriszt-Pazos: 206.835 − 62.3 × (syllables / words) − (words / sentences). INFLESZ categories are interpreted in line with Barrio-Cantalejo et al. (2008).') : 'Flesch Reading Ease: 206.835 − 84.6 × (syllables / words) − 1.015 × (words / sentences) (Flesch, 1948).'}</p>${processingCriteriaReportMarkup(result.language, language)}<p>${result.language === 'es' ? t('Los colores representan categorías de dificultad y facilitan localizar qué fragmentos revisar primero. No son una segunda prueba ni un porcentaje de comprensión.', 'The colours represent difficulty categories and make it easier to locate fragments to review first. They are not a second test or a percentage of comprehension.') : t('The colours group Flesch Reading Ease categories and make it easier to locate fragments to review first. They are not a second test or a percentage of comprehension.', 'The colours group Flesch Reading Ease categories and make it easier to locate fragments to review first. They are not a second test or a percentage of comprehension.')}</p>`;
  const briefReportSections = `<h2>${t('Resultados principales', 'Main results')}</h2>${summaryList}<h2>${t('Qué revisar primero', 'What to review first')}</h2><p>${t('Se muestran hasta cinco fragmentos con puntuación más baja. La lista sirve para orientar la revisión; el informe completo incluye todos los fragmentos analizados.', 'Up to five lowest-scoring fragments are shown. This list guides the review; the full report includes every analyzed fragment.')}</p>${briefFindings}<h2>${t('Alcance y límites', 'Scope and limits')}</h2>${scopeList}<h2>${t('Cómo se calculó', 'How it was calculated')}</h2>${briefMethod}<h2>${t('Comprobaciones del método', 'Method checks')}</h2>${reportSyllableValidationSection(result, table, { full: false, es })}${reportIndexValidationSection(result, table, { full: false, es })}<p class="report-note">${t('El informe completo añade las tablas técnicas, los resultados por página, todos los fragmentos y las referencias.', 'The full report adds the technical tables, page results, all fragments, and references.')}</p>`;
  const fullReportSections = `<h2>${t('Resumen y alcance', 'Summary and scope')}</h2>${summaryList}${scopeList}${coverage ? `<h2>${t('Cobertura del dominio', 'Domain coverage')}</h2>${coverageIntro}${coverageData}<p>${t('La tabla describe lo que se detectó y procesó en esta ejecución. No demuestra que se haya revisado cada contenido posible del dominio.', 'The table describes what was detected and processed in this run. It does not demonstrate that every possible item of domain content was reviewed.')}</p>` : ''}<h2>${t('Cómo interpretar el informe', 'How to interpret this report')}</h2><p>${t('La puntuación de legibilidad estima la dificultad lingüística del texto: una cifra más baja indica mayor dificultad estimada. No es un porcentaje de comprensión. Úsala para ordenar las revisiones y complétala con pruebas de usuarios, contexto y requisitos de accesibilidad.', 'The readability score estimates the linguistic difficulty of text: a lower figure indicates greater estimated difficulty. It is not a percentage of comprehension. Use it to order reviews and complement it with user testing, context, and accessibility requirements.')}</p>${fullMethod}<section class="validation-block"><h2>${t('Comprobaciones del método', 'Method checks')}</h2>${reportSyllableValidationSection(result, table, { full: true, es })}${reportIndexValidationSection(result, table, { full: true, es })}</section><h2>${t('Resultados por página', 'Page results')}</h2><p>${t('Cada fila corresponde a una página o archivo. “Analizada” indica que se pudo calcular una puntuación; “contenido duplicado excluido” indica que otra dirección devolvió el mismo texto y no se contó dos veces; una raya significa que ese dato no estaba disponible, no que fuera cero.', 'Each row represents a page or file. “Analyzed” means a score could be calculated; “duplicate content excluded” means another address returned the same text and was not counted twice; a dash means the datum was unavailable, not zero.')}</p>${pageData}<h2>${t('Todos los fragmentos analizados', 'All analyzed fragments')}</h2><p>${t('Los fragmentos se ordenan desde la puntuación más baja, que señala mayor dificultad textual estimada, hasta la más alta.', 'Fragments are ordered from the lowest score, which signals greater estimated text difficulty, to the highest.')}</p>${fragmentData}<h2>${t('Trazabilidad y notas técnicas', 'Traceability and technical notes')}</h2><p>${t('Esta tabla permite comprobar cómo entró cada dirección en el análisis. “Origen” indica cómo se encontró; “elegible” indica si cumplió los criterios; “seleccionada” indica si se incluyó. Una celda vacía no significa cero.', 'This table shows how each address entered the analysis. “Source” states how it was found; “eligible” states whether it met the criteria; “selected” states whether it was included. A blank cell does not mean zero.')}</p>${table(['URL',t('Origen','Source'),t('Sección','Section'),t('Profundidad','Depth'),t('Elegible','Eligible'),t('Seleccionada','Selected'),t('Motivo','Reason')],(result.samplingFrame ?? []).map(row=>[row.url,row.source,row.section,row.depth,row.eligible ? t('Sí','Yes') : t('No','No'),row.selected ? t('Sí','Yes') : t('No','No'),row.exclusionReason || row.selectionReason || '—']))}${pages.filter(page=>page.reason).map(page=>`<p class="url">${e(page.url)}: ${e(page.reason)}</p>`).join('')}<h2>${t('Referencias', 'References')}</h2><div class="refs">${references}<p>Speer, R. (2023). <i>wordfreq</i> (Version 3.1.1) [Computer software]. https://pypi.org/project/wordfreq/3.1.1/</p><p>World Wide Web Consortium. (2023). <i>Web Content Accessibility Guidelines (WCAG) 2.2.</i> https://www.w3.org/TR/2023/REC-WCAG22-20231005/</p><p>World Wide Web Consortium. (2021). <i>Making content usable for people with cognitive and learning disabilities.</i> https://www.w3.org/TR/coga-usable/</p></div>`;
  const reportSections = full ? fullReportSections : briefReportSections;
  const readableReportMarkup = `<!doctype html><html lang="${es ? 'es' : 'en'}"><head><meta charset="utf-8"><title>Web Readability Radar - ${kind} report</title><style>
  @page{size:A4;margin:20mm 17mm}body{font:11pt/1.55 Arial;color:#172b32;max-width:180mm;margin:25px auto}header{border-bottom:3px solid #187568;padding-bottom:18px}h1{font-size:25pt;margin:8px 0}h2{font-size:16pt;margin-top:28px;border-bottom:1px solid #cad6d8;padding-bottom:5px}h3{font-size:12pt;margin-top:20px}h4{font-size:10.5pt;margin:18px 0 6px}p{overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;font-size:9pt;table-layout:fixed}th,td{border:1px solid #ccd6d8;padding:6px;vertical-align:top;overflow-wrap:anywhere}th{background:#edf4f3;text-align:left}thead{display:table-header-group}tr{break-inside:avoid}article{margin:18px 0;padding-bottom:14px;border-bottom:1px solid #ccd6d8}.finding{break-inside:avoid}.url{font-size:9pt;color:#52666c}.refs p{padding-left:18px;text-indent:-18px}.report-list{margin:10px 0 18px;padding-left:22px}.report-list li{margin:7px 0}.summary-list{background:#f2f8f7;border-left:4px solid #187568;padding:12px 14px 12px 32px}.method-check{margin:18px 0;padding:0 0 14px;border-bottom:1px solid #ccd6d8}.report-note{color:#52666c;font-size:9pt}.validation-block{break-inside:avoid}.refs{break-inside:avoid}details{margin:12px 0;padding:8px;border:1px solid #ccd6d8}summary{font-weight:bold;cursor:pointer}button{padding:12px 20px;margin-bottom:20px}@media print{button{display:none}body{margin:0;max-width:none}h2,h3,h4{break-after:avoid}.validation-block{break-inside:auto}}
  @page{@bottom-right{content:counter(page) " / " counter(pages);font:9pt Arial;color:#52666c}}
  </style></head><body><button onclick="window.print()">${t('Guardar como PDF / Imprimir', 'Save as PDF / Print')}</button><header><div>Web Readability Radar</div><h1>${t('Informe de lecturabilidad', 'Readability report')}</h1><p>${t(full ? 'Informe completo' : 'Informe breve', full ? 'Full report' : 'Brief report')} | ${e(new Date(result.generatedAt).toLocaleString(locale))}</p></header>${reportSections}</body></html>`;
  showReportPreview(readableReportMarkup, t('Vista previa del informe', 'Report preview'));
}

function showReportPreview(markup, title) {
  const dialog = document.createElement('dialog');
  dialog.className = 'report-preview';
  dialog.innerHTML = `<header><strong>${escapeHtml(title)}</strong><div><button type="button" data-print-report>${escapeHtml(language === 'es' ? 'Guardar como PDF / Imprimir' : 'Save as PDF / Print')}</button><button type="button" data-close-report>${escapeHtml(language === 'es' ? 'Cerrar' : 'Close')}</button></div></header><iframe title="${escapeHtml(title)}"></iframe>`;
  const frame = dialog.querySelector('iframe');
  frame.srcdoc = markup;
  dialog.querySelector('[data-close-report]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-print-report]').addEventListener('click', () => frame.contentWindow?.print());
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  document.body.append(dialog);
  dialog.showModal();
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function downloadPages(result) {
  downloadCsv(STRINGS.en.pageFilename, pageRows(result));
}

function downloadFragments(result) {
  downloadCsv(STRINGS.en.fragmentFilename, fragmentRows(result));
}

function downloadSampling(result) {
  downloadCsv(STRINGS.en.samplingFilename, samplingRows(result));
}

function pageRows(result) {
  const dictionary = STRINGS.en;
  const threshold = result.language === 'en' ? 50 : 55;
  return [
    ['page_id', 'traffic_light', 'recommended_action', 'plain_explanation', 'url', 'title', 'status', 'source', 'discovery_sources', 'section', 'depth', 'selection_method', 'selection_reason', 'reason', 'words', 'sentences', 'syllables', 'metric', 'score', 'level', 'score_basis', 'full_text_score', 'below_threshold', 'threshold'],
    ...result.pages.map((page) => {
      const severity = page.status === 'analyzed' ? csvTrafficForReading(page.score, page.level) : null;
      return [page.pageId, severity?.label ?? '', severity?.action ?? '', severity?.meaning ?? '', page.url, page.title, englishCsvValue(page.status), englishCsvValue(page.source), (page.discoverySources ?? [page.source]).map((value) => englishCsvValue(value)).join('; '), page.section ?? '/', page.depth ?? 0, page.selectionMethod ?? '', englishCsvValue(page.selectionReason), englishCsvValue(page.reason, 'reason'), page.words, page.sentences, page.syllables, result.metric, page.score, englishCsvValue(page.level), page.scoreBasis ?? '', page.fullTextScore ?? '', page.status === 'analyzed' ? page.score < threshold : '', threshold];
    }),
  ];
}

function fragmentRows(result) {
  const dictionary = STRINGS.en;
  const threshold = result.language === 'en' ? 50 : 55;
  return [
    ['fragment_id', 'page_id', 'traffic_light', 'recommended_action', 'plain_explanation', 'page_url', 'page_title', 'fragment_rank_in_page', 'words', 'sentences', 'syllables', 'metric', 'score', 'level', 'below_threshold', 'threshold', 'source_link', 'fragment_text'],
    ...[...result.fragments].sort(compareFragmentDifficulty).map((fragment) => {
      const severity = csvTrafficForReading(fragment.score, fragment.level);
      return [fragment.fragmentId, pageIdFromFragment(fragment), severity.label, severity.action, severity.meaning, fragment.pageUrl, fragment.pageTitle, fragment.index, fragment.words, fragment.sentences, fragment.syllables, result.metric, fragment.score, englishCsvValue(fragment.level), fragment.score < threshold, threshold, fragment.link || fragment.pageUrl, fragment.text];
    }),
  ];
}

function samplingRows(result) {
  const dictionary = STRINGS.en;
  return [
    ['page_id', 'traffic_light', 'recommended_action', 'plain_explanation', 'url', 'source', 'discovery_sources', 'section', 'depth', 'eligible', 'exclusion_reason', 'selected', 'selection_method', 'selection_reason', 'status', 'words', 'score', 'level'],
    ...result.samplingFrame.map((row) => {
      const severity = row.score === null || row.score === undefined ? null : csvTrafficForReading(row.score, row.level);
      return [row.pageId, severity?.label ?? '', severity?.action ?? '', severity?.meaning ?? '', row.url, englishCsvValue(row.source), (row.discoverySources ?? [row.source]).map((value) => englishCsvValue(value)).join('; '), row.section ?? '/', row.depth ?? 0, row.eligible, englishCsvValue(row.exclusionReason ?? '', 'reason'), row.selected, row.selectionMethod ?? '', englishCsvValue(row.selectionReason), englishCsvValue(row.status ?? ''), row.words, row.score, englishCsvValue(row.level ?? '')];
    }),
  ];
}

function readmeRows(result) {
  return [
    ['sheet', 'column', 'meaning'],
    ['README', 'sheet', 'Name of the worksheet where the column appears.'],
    ['README', 'column', 'Column name.'],
    ['README', 'meaning', 'Plain English explanation of the column.'],
    ['Pages', 'page_id', 'Stable identifier for the analyzed page. Use it to connect pages with fragments and sampling rows.'],
    ['Pages', 'traffic_light', 'Combined red/yellow/green review signal. Red means both index and level indicate difficulty; yellow means they disagree; green means both are favorable.'],
    ['Pages', 'recommended_action', 'Suggested action for the page based on the traffic light.'],
    ['Pages', 'plain_explanation', 'Short explanation of the traffic-light result.'],
    ['Pages', 'url', 'Analyzed page URL or local-html identifier.'],
    ['Pages', 'title', 'Page title extracted from the HTML.'],
    ['Pages', 'status', 'Technical processing status: analyzed, discarded, duplicate, or error. Duplicate means identical extracted content was excluded from metrics after the first occurrence.'],
    ['Pages', 'source', 'Where the page came from: initial domain, sitemap, homepage link, selected page, required page, or local HTML.'],
    ['Pages', 'discovery_sources', 'All discovery routes recorded for this URL, separated by semicolons.'],
    ['Pages', 'section', 'Website section used for representative sampling: first path segment, or the included subdomain.'],
    ['Pages', 'depth', 'Internal-link depth at which the URL was first discovered. The starting page is 0.'],
    ['Pages', 'selection_method', 'mandatory, stratified_random, or all_eligible. A stratified sample rotates across sections before selecting additional pages.'],
    ['Pages', 'selection_reason', 'Human-readable reason why the page entered the sample.'],
    ['Pages', 'reason', 'Technical note when the page was short, rendered dynamically, discarded, or failed.'],
    ['Pages', 'words', 'Total words extracted from the page text used for analysis.'],
    ['Pages', 'sentences', 'Total sentences extracted from the page text used for analysis.'],
    ['Pages', 'syllables', 'Estimated syllable count used by the readability formula.'],
    ['Pages', 'metric', 'Readability metric used: Szigriszt-Pazos / INFLESZ for Spanish or Flesch Reading Ease for English.'],
    ['Pages', 'score', 'Page readability score calculated from the total words, sentences, and syllables extracted from the complete page text. Negative values are allowed.'],
    ['Pages', 'level', 'Readability category associated with the page score.'],
    ['Pages', 'score_basis', 'How the page score was calculated. Current value: full_page_text.'],
    ['Pages', 'full_text_score', 'Readability score calculated from the full extracted page text; it is the page score.'],
    ['Pages', 'below_threshold', 'TRUE when the page score is below the configured difficulty threshold.'],
    ['Pages', 'threshold', 'Numeric threshold used for the below_threshold flag.'],
    ['Fragments', 'fragment_id', 'Stable identifier for a fragment. It includes the page_id and a fragment number/hash.'],
    ['Fragments', 'page_id', 'Identifier of the page where the fragment was found.'],
    ['Fragments', 'traffic_light', 'Combined red/yellow/green review signal for this fragment.'],
    ['Fragments', 'recommended_action', 'Suggested action for the fragment based on the traffic light.'],
    ['Fragments', 'plain_explanation', 'Short explanation of the fragment traffic-light result.'],
    ['Fragments', 'page_url', 'URL of the page containing the fragment.'],
    ['Fragments', 'page_title', 'Title of the page containing the fragment.'],
    ['Fragments', 'fragment_rank_in_page', 'Position of the fragment among the page fragments after sorting by difficulty.'],
    ['Fragments', 'words', 'Words in the fragment.'],
    ['Fragments', 'sentences', 'Sentences in the fragment.'],
    ['Fragments', 'syllables', 'Estimated syllables in the fragment.'],
    ['Fragments', 'metric', 'Readability metric used for the fragment.'],
    ['Fragments', 'score', 'Fragment readability score. Lower scores indicate harder text; negative values are possible.'],
    ['Fragments', 'level', 'Readability category associated with the fragment score.'],
    ['Fragments', 'below_threshold', 'TRUE when the fragment score is below the configured difficulty threshold.'],
    ['Fragments', 'threshold', 'Numeric threshold used for the below_threshold flag.'],
    ['Fragments', 'source_link', 'Link to open the page where the fragment was detected.'],
    ['Fragments', 'fragment_text', 'Exact text fragment analyzed.'],
    ['Sampling', 'page_id', 'Stable identifier for the sampled page.'],
    ['Sampling', 'traffic_light', 'Combined red/yellow/green signal when the page was analyzed.'],
    ['Sampling', 'recommended_action', 'Suggested action when the page was analyzed.'],
    ['Sampling', 'plain_explanation', 'Short explanation of the traffic-light result when available.'],
    ['Sampling', 'url', 'Candidate URL considered for analysis.'],
    ['Sampling', 'source', 'Where the candidate URL came from.'],
    ['Sampling', 'discovery_sources', 'All discovery routes recorded for this candidate, separated by semicolons.'],
    ['Sampling', 'section', 'Website section used for representative sampling: first path segment, or the included subdomain.'],
    ['Sampling', 'depth', 'Internal-link depth at which the candidate was first discovered. The starting page is 0.'],
    ['Sampling', 'eligible', 'TRUE when the candidate may be selected. FALSE normally means robots.txt excluded it for this crawler.'],
    ['Sampling', 'exclusion_reason', 'Reason a discovered candidate was not eligible for selection.'],
    ['Sampling', 'selected', 'TRUE when the candidate entered the analysis sample.'],
    ['Sampling', 'selection_method', 'mandatory, stratified_random, or all_eligible.'],
    ['Sampling', 'selection_reason', 'Reason why the URL was discovered or selected.'],
    ['Sampling', 'status', 'Processing status if the URL was selected and analyzed.'],
    ['Sampling', 'words', 'Words extracted if the URL was analyzed.'],
    ['Sampling', 'score', 'Page score if the URL was analyzed.'],
    ['Sampling', 'level', 'Readability category if the URL was analyzed.'],
  ];
}

function downloadWorkbook(result) {
  const sheets = [
    ['README', readmeRows(result)],
    ['Pages', pageRows(result)],
    ['Fragments', fragmentRows(result)],
    ['Sampling', samplingRows(result)],
  ];
  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="11"/></Style>
<Style ss:ID="Header"><Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#24566A" ss:Pattern="Solid"/><Alignment ss:Vertical="Center" ss:WrapText="1"/></Style>
</Styles>
${sheets.map(([name, rows]) => worksheetXml(name, rows)).join('\n')}
</Workbook>`;
  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'web-readability-radar-workbook.xls';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function worksheetXml(name, rows) {
  return `<Worksheet ss:Name="${xmlAttribute(name).slice(0, 31)}"><Table>
${rows[0].map(header => `<Column ss:Width="${/meaning|text|explanation|reason|url|link/i.test(header) ? 320 : 140}"/>`).join('')}
${rows.map((row, index) => `<Row${index === 0 ? ' ss:Height="42"' : ''}>${row.map((value) => `<Cell${index === 0 ? ' ss:StyleID="Header"' : ''}><Data ss:Type="${typeof value === 'number' ? 'Number' : 'String'}">${xmlCell(value)}</Data></Cell>`).join('')}</Row>`).join('\n')}
</Table></Worksheet>`;
}

function xmlCell(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function xmlAttribute(value) {
  return xmlCell(value).replaceAll('[', '').replaceAll(']', '').replaceAll(':', '').replaceAll('*', '').replaceAll('?', '').replaceAll('/', '').replaceAll('\\', '');
}


function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function pageIdFromFragment(fragment) {
  return fragment.fragmentId ? fragment.fragmentId.split('-F')[0] : '';
}

function csvCell(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function externalLink(url, label) {
  if (String(url).startsWith('local-html://')) return `<button class="source-link" type="button" data-local-source>${escapeHtml(label)}</button>`;
  if (!/^https?:\/\//i.test(String(url))) return escapeHtml(label);
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
}

document.addEventListener('click', event => {
  if (event.target.closest('[data-analyze-next]')) runAnalysis(false);
  if (event.target.closest('[data-local-source]')) {
    const popup = window.open('', '_blank');
    if (!popup) return;
    popup.opener = null;
    popup.document.title = language === 'es' ? 'Texto del HTML local' : 'Local HTML text';
    const heading = popup.document.createElement('h1');
    heading.textContent = popup.document.title;
    const pre = popup.document.createElement('pre');
    pre.style.cssText = 'white-space:pre-wrap;font:16px/1.6 Arial;max-width:900px;margin:24px';
    pre.textContent = localSourceText || (lastResult.fragments ?? []).map(fragment => fragment.text).join('\n\n');
    popup.document.body.append(heading, pre);
  }
});
