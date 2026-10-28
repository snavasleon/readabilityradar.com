import { analyzeOnline } from './online-analyzer.js';

const STRINGS = {
  es: {
    brandSubtitle: 'Lecturabilidad y accesibilidad cognitiva',
    title: 'Web Readability Radar',
    lede: 'Explora dominios o páginas concretas en español, explica qué URLs entran en la muestra y localiza fragmentos que necesitan atención.',
    whatAnalyze: 'Qué quieres analizar',
    whatAnalyzeHelp: 'Elige un dominio, una página web concreta o un archivo HTML guardado en tu equipo.',
    domainMode: 'Dominio',
    pageMode: 'Una página',
    domainInitial: 'Dominio inicial',
    exactPage: 'URL exacta',
    mainInputHelp: 'Escribe una dirección web. Dominio busca páginas mediante el mapa del sitio y enlaces internos; Una página revisa solo la URL indicada.',
    domainHint: 'Puedes escribir hasta tres dominios, uno por línea.',
    pageHint: 'Solo se analizarán las páginas escritas aquí; no se rastrea el dominio.',
    mandatoryPages: 'Páginas obligatorias',
    mandatoryHelp: 'Estas URLs se incluyen siempre dentro de la muestra si pertenecen al dominio analizado.',
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
    intensity: 'Intensidad del análisis',
    intensityHelp: 'Rápido explora una muestra aleatoria y representativa de páginas por sección y muestra, dentro de esa muestra, hasta 10 párrafos con mayor dificultad. Completo analiza todas las URLs elegibles detectables mediante enlaces internos y sitemaps, hasta el máximo técnico publicado.',
    fast: 'Rápido',
    complete: 'Completo',
    portableLimit: 'Rápido: muestra estratificada de páginas y hasta 10 fragmentos más difíciles de esa muestra. Completo: todas las URLs elegibles detectables, hasta el máximo técnico de 10.000 candidatas.',
    samplingSettings: 'Ajustes del análisis',
    settingsHelp: 'Rápido selecciona una muestra representativa de páginas elegibles y explora enlaces internos hasta tres niveles o 120 páginas por dominio. Completo analiza todas las URLs elegibles detectables mediante enlaces internos y sitemaps, sin límite interno de profundidad, hasta el máximo técnico de 10.000 candidatas. Las restricciones de robots.txt, los errores de acceso y cualquier cobertura parcial aparecen en el resultado.',
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
    legalHelp: 'Resume el marco de accesibilidad, lectura clara y evaluación reproducible. No equivale a una certificación legal.',
    legalText: 'Se apoya en criterios de accesibilidad digital, lectura clara y evaluación reproducible de contenido textual.',
    legalRefs: 'Referencias orientativas: WCAG, EN 301 549, Real Decreto 1112/2018 y normas UNE vinculadas a lectura fácil.',
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
    fragmentsSubtitle: 'Cada fragmento conserva un párrafo completo. Rápido muestra los más difíciles de la muestra de páginas; Completo muestra todos. Ordenados por dificultad.',
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
    loadingNoteComplete: 'El modo completo procesa todas las URLs seleccionadas. Puede tardar varios minutos en dominios grandes; cada página inaccesible tiene un límite propio para que el proceso continúe.',
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
    lede: 'Analyze domains or specific pages in English, explain which URLs enter the sample, and locate fragments that need attention.',
    whatAnalyze: 'What do you want to analyze',
    whatAnalyzeHelp: 'Choose a domain, one web page, or an HTML file saved on your computer.',
    domainMode: 'Domain',
    pageMode: 'One page',
    domainInitial: 'Initial domain',
    exactPage: 'Exact URL',
    mainInputHelp: 'Enter a web address. Domain finds pages through the sitemap and internal links; One page reviews only the entered URL.',
    domainHint: 'You can enter up to three domains, one per line.',
    pageHint: 'Only the URLs entered here will be analyzed; the domain will not be crawled.',
    mandatoryPages: 'Required pages',
    mandatoryHelp: 'These URLs are always included in the sample if they belong to the analyzed domain.',
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
    intensity: 'Analysis intensity',
    intensityHelp: 'Fast explores a random, representative page sample by section and shows up to 10 hardest paragraphs within that sample. Complete analyzes all eligible URLs detectable through internal links and sitemaps, up to the published technical maximum.',
    fast: 'Fast',
    complete: 'Complete',
    portableLimit: 'Fast: stratified page sample and up to 10 hardest fragments from that sample. Complete: all eligible detectable URLs, up to the technical maximum of 10,000 candidates.',
    samplingSettings: 'Analysis settings',
    settingsHelp: 'Fast selects a representative sample of eligible pages and follows internal links for up to three levels or 120 pages per domain. Complete analyzes all eligible URLs detectable through internal links and sitemaps, with no internal depth limit, up to the technical maximum of 10,000 candidates. robots.txt restrictions, access errors, and any partial coverage are shown in the result.',
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
    legalHelp: 'Summarizes accessibility, plain language, and reproducible evaluation. It is not a legal certification.',
    legalText: 'Based on digital accessibility, plain language, and reproducible textual evaluation criteria.',
    legalRefs: 'Indicative references: WCAG, EN 301 549, W3C Cognitive Accessibility guidance, and plain-language guidelines.',
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
    fragmentsSubtitle: 'Each fragment preserves one complete paragraph. Fast shows the hardest fragments from the sampled pages; Complete shows all. Sorted by difficulty.',
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
    loadingNoteComplete: 'Complete mode processes every selected URL. Large domains can take several minutes; each inaccessible page has its own limit so processing can continue.',
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
const LOCAL_ENGINE_CANDIDATES = ['http://127.0.0.1:8787', 'http://127.0.0.1:55481'];
const WINDOWS_APP_DOWNLOAD = 'https://github.com/MagicoutFIT/lecturabilidadradar.com/releases/latest/download/Web-Readability-Radar.exe';
let privacyAccepted = false;
let analysisLanguageConfirmed = false;
let executionMode = cloudflareFreeEdition ? 'online' : 'local';
let localEngineBase = null;
let localEngineWatcher = null;
let localEngineChecking = false;
let scope = 'domain';
let inputSource = 'url';
let analysisRunning = false;
let intensity = 'fast';
let activeTab = 'panel';
let lastResult = null;
let localSourceText = '';
let fragmentSort = 'hardest';
let pageSort = 'hardest';
let fragmentFilter = 'all';

const form = document.querySelector('#analyzerForm');
const results = document.querySelector('#results');
const tabs = document.querySelector('#tabs');
const inputUrls = document.querySelector('#inputUrls');
const exactUrls = document.querySelector('#exactUrls');
const includeSubdomains = document.querySelector('#includeSubdomains');
const htmlFile = document.querySelector('#htmlFile');
const clearHtmlButton = document.querySelector('#clearHtmlButton');
const scopeButtons = [...document.querySelectorAll('[data-scope]')];
const intensityButtons = [...document.querySelectorAll('[data-intensity]')];
const maxPagesInput = document.querySelector('#maxPages');
const estimateButton = document.querySelector('#estimateButton');
const privacyDialog = document.querySelector('#privacyDialog');
const analysisLanguageDialog = document.querySelector('#analysisLanguageDialog');
const executionModeDialog = document.querySelector('#executionModeDialog');
const privacyAccept = document.querySelector('#privacyAccept');
const analysisLanguageAccept = document.querySelector('#analysisLanguageAccept');
const onlineModeButton = document.querySelector('#onlineModeButton');
const localModeButton = document.querySelector('#localModeButton');
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
  if (cloudflareFreeEdition) await chooseAvailableEngine();
  else finishIntroduction();
});

onlineModeButton.addEventListener('click', () => {
  stopWatchingForLocalEngine();
  executionMode = 'online';
  localEngineBase = null;
  finishIntroduction();
});

localModeButton.addEventListener('click', async () => {
  // Keep this explicit click independent from the background watcher. Chrome
  // may require this user gesture before it shows the Local Network permission.
  // If a watcher request is in flight, ignoring the click would lose that gesture.
  executionModeStatus.textContent = language === 'es' ? 'Buscando el motor local en este ordenador…' : 'Looking for the local engine on this computer…';
  const base = await findLocalEngine();
  if (!base) {
    executionModeStatus.innerHTML = language === 'es'
      ? `Aún no se ha podido conectar con la aplicación local. Déjala abierta: la web seguirá detectándola automáticamente. Si Chrome muestra una petición de acceso a la red local, selecciónala como permitida. <a href="${WINDOWS_APP_DOWNLOAD}">Descargar Web Readability Radar para Windows (.exe)</a>`
      : `The local application could not be reached yet. Leave it open: the page will keep detecting it automatically. If Chrome asks for Local Network access, allow it. <a href="${WINDOWS_APP_DOWNLOAD}">Download Web Readability Radar for Windows (.exe)</a>`;
    return;
  }
  localEngineBase = base;
  executionMode = 'local';
  finishIntroduction();
});

scopeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    inputSource = button.dataset.scope === 'html' ? 'html' : 'url';
    scope = button.dataset.scope === 'domain' ? 'domain' : 'page';
    if (inputSource !== 'html') htmlFile.value = '';
    syncScope();
    resetResults();
  });
});

intensityButtons.forEach((button) => {
  button.addEventListener('click', () => {
    intensity = button.dataset.intensity;
    intensityButtons.forEach((item) => item.classList.toggle('active', item === button));
    syncIntensityField();
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
    const active = button.dataset.scope === activeSource;
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
  document.querySelector('#mainInputHint').textContent = scope === 'page' ? dictionary.pageHint : dictionary.domainHint;
  estimateButton.querySelector('span:last-child').textContent = inputSource === 'html' ? dictionary.prepareHtml : scope === 'page' ? dictionary.preparePage : dictionary.estimate;
  syncIntensityField();
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
  if (cloudflareFreeEdition) {
    const limit = document.querySelector('[data-i18n="portableLimit"]');
    const help = document.querySelector('[data-i18n-title="settingsHelp"]');
    if (limit) limit.textContent = language === 'es'
      ? 'Online: Rápido muestra una selección de fragmentos; Completo analiza hasta 30 páginas detectadas mediante HTML estático. El cálculo se hace en tu navegador.'
      : 'Online: Fast shows a selection of fragments; Complete analyzes up to 30 pages found through static HTML. Calculation happens in your browser.';
    if (help) {
      const text = language === 'es'
        ? 'La edición online explora hasta 30 páginas enlazadas desde la página inicial. No guarda el texto ni los resultados. Las páginas que cargan contenido solo con JavaScript pueden mostrar una cobertura parcial.'
        : 'The online edition explores up to 30 pages linked from the starting page. It does not store text or results. Pages that load content only with JavaScript may have partial coverage.';
      help.dataset.title = text; help.setAttribute('aria-label', text);
    }
  }
  syncIntensityField();
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
  const isSpanish = language === 'es';
  document.querySelector('#executionModeEyebrow').textContent = isSpanish ? 'Capacidad de análisis' : 'Analysis capacity';
  document.querySelector('#executionModeTitle').textContent = isSpanish ? '¿Cómo quieres realizar el análisis?' : 'How would you like to run the analysis?';
  document.querySelector('#executionModeText').textContent = isSpanish
    ? 'Puedes usar la versión web inmediata o conectar el motor local gratuito para una auditoría completa.'
    : 'You can use the immediate web edition or connect the free local engine for a full audit.';
  onlineModeButton.innerHTML = isSpanish
    ? '<strong>Análisis rápido en línea</strong><span>Hasta 30 páginas con HTML disponible. No requiere instalación.</span>'
    : '<strong>Quick online analysis</strong><span>Up to 30 pages with available HTML. No installation required.</span>';
  localModeButton.innerHTML = isSpanish
    ? '<strong>Análisis completo en este ordenador</strong><span>Usa el motor local: sitemaps, hasta 10.000 candidatas y páginas con JavaScript. Chrome te pedirá permiso para conectar con la aplicación local.</span>'
    : '<strong>Full analysis on this computer</strong><span>Uses the local engine: sitemaps, up to 10,000 candidates and JavaScript-rendered pages. Chrome will ask permission to connect to the local application.</span>';
  executionModeStatus.textContent = isSpanish
    ? 'Abre la aplicación gratuita para Windows y esta ventana se cerrará automáticamente al detectarla. Chrome puede solicitar permiso para conectarla. No se conecta a otros dispositivos de tu red.'
    : 'Open the free Windows application and this window will close automatically when it is detected. Chrome may ask permission to connect to it. It does not connect to other devices on your network.';
  executionModeDialog.hidden = false;
  onlineModeButton.focus();
  watchForLocalEngine();
}

async function chooseAvailableEngine() {
  // This follows the participant's simplest path: when the portable application
  // is already open, use it immediately. The fast/full choice is only needed
  // when no local engine is available.
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
      localEngineBase = base;
      executionMode = 'local';
      finishIntroduction();
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
    : (language === 'es' ? '● Modo rápido en línea · hasta 30 páginas HTML' : '● Quick online mode · up to 30 HTML pages');
}

async function findLocalEngine() {
  const probes = LOCAL_ENGINE_CANDIDATES.map(async (base) => {
    try {
      const response = await fetchLocalEngine(`${base}/api/bridge-status`, { method: 'GET', cache: 'no-store', mode: 'cors', credentials: 'omit' });
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
function fetchLocalEngine(url, options = {}) {
  return fetch(url, { ...options, targetAddressSpace: 'loopback', signal: options.signal ?? AbortSignal.timeout(900) });
}

function completeSampleLabel() {
  return language === 'es' ? 'Todas las elegibles' : 'All eligible';
}

function syncIntensityField() {
  if (cloudflareFreeEdition && executionMode !== 'local') {
    maxPagesInput.type = 'number';
    if (intensity === 'complete') {
      maxPagesInput.value = '30';
      maxPagesInput.disabled = true;
    } else {
      if (!/^\d+$/.test(maxPagesInput.value) || Number(maxPagesInput.value) > 30) maxPagesInput.value = '12';
      maxPagesInput.disabled = analysisRunning || scope === 'page';
    }
    return;
  }
  if (intensity === 'complete') {
    maxPagesInput.type = 'text';
    maxPagesInput.value = completeSampleLabel();
    maxPagesInput.disabled = true;
    return;
  }
  if (intensity === 'fast') {
    maxPagesInput.type = 'number';
    if (!/^\d+$/.test(maxPagesInput.value)) maxPagesInput.value = '12';
    maxPagesInput.disabled = analysisRunning || scope === 'page';
    return;
  }
  maxPagesInput.type = 'number';
  maxPagesInput.disabled = false;
  if (!/^\d+$/.test(maxPagesInput.value)) maxPagesInput.value = '12';
}

async function runAnalysis(estimateOnly) {
  if (analysisRunning || !privacyAccepted || !analysisLanguageConfirmed) return;
  if (!form.reportValidity()) return;
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
        ${intensity === 'complete' && scope === 'domain' ? `<p class="loading-note">${escapeHtml(dictionary.loadingNoteComplete)}</p>` : ''}
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
      throw new Error(language === 'es' ? 'El motor completo local no está conectado. Elige el modo rápido o abre la versión local.' : 'The full local engine is not connected. Choose quick mode or open the local edition.');
    }
    const localHtml = await readLocalHtml();
    localSourceText = '';
    const requestBody = {
      language: analysisLanguage,
      scope,
      input: inputSource === 'html' ? '' : validateWebInput(inputUrls.value),
      exactUrls: scope === 'domain' ? exactUrls.value : '',
      includeRelatedSubdomains: scope === 'domain' && includeSubdomains.checked,
      estimateOnly,
      maxPages: cloudflareFreeEdition && !usingLocalEngine ? 30 : (scope === 'page' ? '1' : (intensity === 'complete' ? 'all' : maxPagesInput.value)),
      samplingMode: cloudflareFreeEdition && !usingLocalEngine ? (intensity === 'fast' ? 'random' : 'all') : (intensity === 'fast' && scope === 'domain' ? 'random' : 'all'),
      fragmentLimit: intensity === 'fast' ? 'top10' : null,
      minWords: document.querySelector('#minWords').value,
      minFragmentWords: document.querySelector('#minFragmentWords').value,
      htmlInput: localHtml?.content ?? '',
      htmlName: localHtml?.name ?? '',
      background: !cloudflareFreeEdition || usingLocalEngine,
    };
    let payload;
    if (cloudflareFreeEdition && !usingLocalEngine) {
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
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(requestBody),
      }) : await fetch(request, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(requestBody),
      });
      const started = await response.json();
      if (!response.ok || started.error) throw new Error(started.error || dictionary.error);
      while (!payload) {
        if (!started.jobId) throw new Error(dictionary.error);
        await new Promise((resolve) => window.setTimeout(resolve, 750));
        const statusUrl = `${apiBase}/api/analyze-status?jobId=${encodeURIComponent(started.jobId)}`;
        const statusResponse = usingLocalEngine
          ? await fetchLocalEngine(statusUrl, { cache: 'no-store' })
          : await fetch(statusUrl, { cache: 'no-store' });
        const status = await statusResponse.json();
        if (!statusResponse.ok || status.error) throw new Error(status.error || dictionary.error);
        const progressTarget = results.querySelector('.loading-progress');
        if (progressTarget) {
          progressTarget.textContent = status.progress?.phase === 'analysis' && Number.isFinite(status.progress.total)
            ? (language === 'es' ? `Páginas procesadas: ${status.progress.completed} de ${status.progress.total}` : `Pages processed: ${status.progress.completed} of ${status.progress.total}`)
            : (language === 'es' ? 'Descubriendo páginas y enlaces…' : 'Discovering pages and links…');
        }
        if (status.state === 'error') throw new Error(status.error || dictionary.error);
        if (status.state === 'complete') payload = status.result;
      }
    }
    lastResult = payload;
    localSourceText = payload.localSourceText ?? '';
    try {
      const validationResponse = await fetch('index-validation.json', { cache: 'no-store' });
      if (validationResponse.ok) lastResult.indexValidation = await validationResponse.json();
    } catch {
      // A missing benchmark must not interrupt page analysis.
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
    const message = error instanceof TypeError ? dictionary.connectionError : error.message;
    results.innerHTML = `<section class="error-panel"><h2>${escapeHtml(dictionary.error)}</h2><p>${escapeHtml(message)}</p></section>`;
  } finally {
    if (elapsedTimer !== null) window.clearInterval(elapsedTimer);
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
  for (const line of lines) {
    try {
      const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(line) ? line : `https://${line}`);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) throw new Error();
    } catch { throw new Error(STRINGS[language].invalidUrl); }
  }
  return value;
}

function setBusy(isBusy) {
  analysisRunning = isBusy;
  form.querySelectorAll('button, textarea, input').forEach((node) => {
    if (node === maxPagesInput && intensity === 'complete') {
      node.disabled = true;
      return;
    }
    node.disabled = isBusy;
  });
  document.body.classList.toggle('is-busy', isBusy);
  if (!isBusy) {
    syncIntensityField();
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
  const isHardestFragmentSelection = result.criteria?.fragmentSelection === 'hardest_from_selected_pages';
  const coverage = result.criteria?.coverage;
  const languageExclusions = result.summary.languageExcludedPages ?? 0;
  const trafficHelp = result.language === 'es'
    ? (language === 'es' ? 'Cuenta todos los fragmentos detectados, también los que no se muestran en el modo rápido. Las cinco categorías conservan las bandas de dificultad de INFLESZ. La categoría se obtiene del índice antes de redondear.' : 'Counts all detected fragments, including those not displayed in Fast mode. The five colors represent INFLESZ difficulty bands calculated from the unrounded score.')
    : (language === 'es' ? 'Cuenta todos los fragmentos detectados, también los que no se muestran en el modo rápido. Los colores agrupan las categorías de Flesch calculadas antes de redondear.' : 'Counts all detected fragments, including those not displayed in Fast mode. Colors group Flesch categories calculated from the unrounded score.');
  const analyzedDetail = language === 'es'
    ? `${dictionary.withMetrics}; ${languageExclusions} excluidas por idioma`
    : `${dictionary.withMetrics}; ${languageExclusions} excluded by language`;
  const fragmentDetail = isEstimate
    ? dictionary.estimatePending
    : isHardestFragmentSelection
      ? dictionary.selectedForReview
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
        ${overviewFact(isHardestFragmentSelection ? dictionary.selectedFragments : dictionary.fragments, result.summary.fragments ?? result.fragments.length, fragmentDetail)}
      </dl>
    </section>`}

    ${isEstimate ? `<p class="analysis-pending" role="status"><strong>${escapeHtml(language === 'es' ? 'Lista de candidatas preparada.' : 'Candidate list prepared.')}</strong> ${escapeHtml(language === 'es' ? 'Aún no se ha analizado ninguna página. Pulsa “Analizar ahora” para aplicar el modo completo a todas las páginas seleccionadas y calcular los fragmentos.' : 'No page has been analyzed yet. Choose “Analyze now” to apply Complete mode to every selected page and calculate fragments.')}</p>` : ''}

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
        ${coverage ? `<p class="reason">${coverage.platform === 'browser_client_free' ? (language === 'es' ? `Edición online gratuita: el texto, las métricas, los gráficos y el informe se procesan en este navegador. Se exploran hasta ${coverage.maxPages} páginas con HTML estático; no se guarda el contenido.` : `Free online edition: text, metrics, charts and the report are processed in this browser. Up to ${coverage.maxPages} static-HTML pages are explored; content is not stored.`) : coverage.maxCrawlDepth === null ? (language === 'es' ? `Modo completo: se recorren todos los enlaces internos detectables y las URLs de sitemap, hasta ${coverage.maxCandidates} URLs candidatas.` : `Complete mode: all detectable internal links and sitemap URLs are traversed, up to ${coverage.maxCandidates} candidate URLs.`) : (language === 'es' ? `Modo rápido: hasta ${coverage.maxCrawlDepth} niveles y ${coverage.maxCrawlPagesPerDomain} páginas exploradas por dominio. Sitemaps y candidatas: hasta ${coverage.maxCandidates}.` : `Fast mode: up to ${coverage.maxCrawlDepth} link levels and ${coverage.maxCrawlPagesPerDomain} crawled pages per domain. Sitemaps and candidates: up to ${coverage.maxCandidates}.`)}</p>` : ''}
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
  results.innerHTML = `
    <section class="panel-card">
      <div class="panel-head">
        <div>
          <h2>${escapeHtml(dictionary.fragmentsTitle)}</h2>
          <p>${escapeHtml(language === 'es' ? `Mostrando ${fragments.length} de ${allFragments.length} fragmentos disponibles en esta vista${fragmentFilter === 'all' ? '' : ` con filtro ${trafficLabel(fragmentFilter)}`}. ${result.criteria.fragmentSelection === 'hardest_from_selected_pages' ? 'Los más difíciles de la muestra aleatoria de páginas.' : 'Análisis completo.'}` : `Showing ${fragments.length} of ${allFragments.length} fragments available in this view${fragmentFilter === 'all' ? '' : ` with the ${trafficLabel(fragmentFilter)} filter`}. ${result.criteria.fragmentSelection === 'hardest_from_selected_pages' ? 'Hardest fragments from the random page sample.' : 'Complete analysis.'}`)}</p>
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
        ${fragments.length ? fragments.map((fragment) => fragmentCard(fragment, dictionary)).join('') : `<p class="reason">${escapeHtml(language === 'es' ? `No se encontraron párrafos independientes elegibles en las ${result.summary.selected} páginas seleccionadas. ${result.pages.filter(p=>p.status==='error').length} errores de lectura. Consulta Páginas para ver los motivos y las exclusiones.` : `No eligible independent paragraphs were found in the ${result.summary.selected} selected pages. ${result.pages.filter(p=>p.status==='error').length} reading errors. See Pages for reasons and exclusions.`)}</p>`}
      </div>
    </section>
  `;
  document.querySelector('#fragmentSort')?.addEventListener('change', (event) => {
    fragmentSort = event.target.value;
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
      <p>${escapeHtml(processingDescription(lastResult.language, language))}</p>
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
    ? { mandatory: 'página obligatoria', stratified_random: 'muestra aleatoria por sección', all_eligible: 'todas las elegibles' }
    : { mandatory: 'required page', stratified_random: 'stratified random sample by section', all_eligible: 'all eligible pages' };
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
  const fragments = result.pages?.flatMap((page) => page.fragments ?? []) ?? result.fragments ?? [];
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

function syllableValidationSection(result) {
  const es = language === 'es';
  const t = (spanish, english) => es ? spanish : english;
  const e = escapeHtml;
  const analysisLanguageName = result.language === 'es' ? t('español', 'Spanish') : t('inglés', 'English');
  const snapshot = result.syllableValidation;
  const heading = `<h3>${t('Recuento de sílabas', 'Syllable counting')}</h3>`;
  if (!snapshot?.data) return heading + `<p>${t('No hay resultados de validación disponibles en esta ejecución.', 'No validation results are available for this run.')}</p>`;
  const v = snapshot.data;
  const locale = es ? 'es-ES' : 'en-GB';
  const number = (value, digits = 0) => Number(value).toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const percent = value => `${number(Number(value) * 100, 3)}%`;
  const signed = value => `${Number(value) >= 0 ? '+' : ''}${number(value, 6)}`;
  const rows = [
    [t('Palabras diferentes seleccionadas', 'Different words selected'), number(v.total_word_types)],
    [t('Palabras que se pudieron comparar', 'Words that could be compared'), number(v.compared_word_types)],
    [t('Palabras sin recuento de referencia, excluidas', 'Words without a reference count, excluded'), number(v.excluded_word_types)],
    [t('Palabras con el mismo número de sílabas en ambos recuentos', 'Words with the same syllable count in both systems'), `${number(Math.round(v.exact_type_agreement * v.compared_word_types))} / ${number(v.compared_word_types)} (${percent(v.exact_type_agreement)})`],
    [t('Coincidencia dando más peso a las palabras frecuentes', 'Agreement giving more weight to common words'), percent(v.frequency_weighted_agreement)],
    [t('Palabras a las que Radar cuenta menos sílabas', 'Words for which Radar counts fewer syllables'), percent(v.undercounted_type_proportion)],
    [t('Palabras a las que Radar cuenta más sílabas', 'Words for which Radar counts more syllables'), percent(v.overcounted_type_proportion)],
    [t('Diferencia media de sílabas por palabra, ponderada por frecuencia', 'Average syllable difference per word, weighted by frequency'), signed(v.mean_signed_error_weighted)],
    [t('Cambio estimado en el índice debido a esa diferencia (puntos)', 'Estimated score change caused by that difference (points)'), signed(v.implied_score_bias)],
  ];
  if (v.dictionary_coverage != null) {
    rows.splice(3, 0,
      [t('Palabras resueltas con la referencia lingüística incluida', 'Words resolved with the included linguistic reference'), `${number(v.dictionary_covered_word_types)} / ${number(v.compared_word_types)} (${percent(v.dictionary_coverage)})`],
      [t('Palabras resueltas por reglas de respaldo', 'Words resolved with fallback rules'), number(v.heuristic_word_types)],
    );
  }
  const spanishAnalysis = result.language === 'es';
  const reference = spanishAnalysis
    ? (es ? 'pylabeador 0.9.0 (de Vera, 2026), un programa que divide las palabras españolas en sílabas' : 'pylabeador 0.9.0 (de Vera, 2026), software that divides Spanish words into syllables')
    : (es ? 'el CMU Pronouncing Dictionary (CMUdict; Carnegie Mellon University, s. f.), un diccionario de pronunciaciones del inglés estadounidense; se empleó la primera pronunciación registrada' : 'the CMU Pronouncing Dictionary (CMUdict; Carnegie Mellon University, n.d.), a dictionary of North American English pronunciations; the first listed pronunciation was used');
  const comparisonDate = new Date(v.generated_at).toLocaleString(locale, { timeZone: 'UTC' });
  return heading + `<p>${t('Para revisar el contador de sílabas se seleccionaron 5.000 palabras diferentes de uso frecuente mediante wordfreq 3.1.1 (Speer, 2023), una base de datos que estima la frecuencia de las palabras en textos. Cada palabra se cuenta una sola vez en la lista, aunque aparezca muchas veces al leer un texto.', 'To review the syllable counter, 5,000 different common words were selected using wordfreq 3.1.1 (Speer, 2023), a database that estimates how frequently words appear in text. Each word appears once in the test list, even if it occurs many times in everyday reading.')}</p><p>${t('La referencia lingüística procede de', 'The linguistic reference comes from')} ${e(reference)}. ${t('La aplicación incorpora localmente una tabla de palabras y sus sílabas: cuando una palabra figura en ella, se usa ese recuento; en las demás, se aplican reglas ortográficas de respaldo.', 'The application bundles a local table of words and syllable counts: when a word is in the table, that count is used; otherwise fallback spelling rules apply.')}${spanishAnalysis ? t(' En español, estas reglas siguen las convenciones de la RAE y ASALE (2010).', ' For Spanish, these rules follow the spelling conventions of RAE and ASALE (2010).') : ''} ${t('La tabla no requiere conexión ni instalaciones externas.', 'The table requires neither a network connection nor external installations.')}</p>
    <table class="validation-table"><thead><tr><th>${t('Medida', 'Measure')}</th><th>${t('Resultado', 'Result')}</th></tr></thead><tbody>${rows.map(row => `<tr><td>${e(row[0])}</td><td>${e(row[1])}</td></tr>`).join('')}</tbody></table>
    <p>${t('La coincidencia por palabra da la misma importancia a cada palabra de la lista. La coincidencia ponderada da más importancia a las palabras de uso frecuente; por ejemplo, «de» pesa más que una palabra poco habitual. Ambos porcentajes excluyen las palabras sin recuento externo disponible. No son porcentajes de personas que comprenden un texto.', 'Word-level agreement gives every word in the list equal importance. Frequency-weighted agreement gives common words more importance; for example, "the" has more weight than an uncommon word. Both percentages exclude words without an external count. They are not percentages of readers who understand a text.')}</p>
    <p>${t('La diferencia de sílabas se calcula como Radar menos referencia: un signo negativo significa que Radar cuenta menos sílabas. El cambio estimado del índice indica cuánto podría subir o bajar la puntuación por esa diferencia, manteniendo igual la longitud de las frases. Se calcula multiplicando la diferencia media ponderada por', 'The syllable difference is Radar minus the reference: a negative sign means Radar counts fewer syllables. The estimated score change shows how much the readability score could rise or fall because of that difference, holding sentence length unchanged. It is calculated by multiplying the weighted mean difference by')} ${es ? '-62.3' : '-84.6'}. ${t('Es una aproximación que no contempla el límite superior de 100 puntos.', 'This approximation does not account for the upper score limit of 100.')}</p>
    <p>${t('Esta comprobación verifica la cobertura y la reproducción de la referencia lingüística integrada; no es una evaluación independiente de todas las pronunciaciones posibles. Tampoco comprueba por sí sola que se haya extraído todo el contenido de una web, que las frases se hayan separado correctamente o que una persona concreta comprenda el texto.', 'This check verifies coverage and reproduction of the integrated linguistic reference; it is not an independent assessment of every possible pronunciation. The test alone does not establish that all website content has been extracted, that sentences have been split correctly, or that an individual reader will understand the text.')}</p>
    <p class="url">${t('Fecha de la comparación', 'Comparison date')}: ${e(comparisonDate)} ${t('(UTC, hora universal)', '(UTC, universal time)')}. ${t('Resultados detallados', 'Detailed results')}: validation/${es ? 'spanish' : 'english'}/validation-results.xlsx. ${t('Identificador de versión (SHA-256, una huella digital del archivo del programa)', 'Version identifier (SHA-256, a digital fingerprint of the program file)')}: ${e(v.current_server_sha256)}.</p>
    ${snapshot.matchesCurrentServer ? '' : `<p>${t('Estos resultados corresponden a otra versión del programa. Es necesario repetir la prueba antes de atribuirlos a la versión actual.', 'These results belong to another program version. Repeat the test before attributing them to the current version.')}</p>`}`;
}

function indexValidationSection(result, table) {
  if (result.language === 'es') {
    const v = result.indexValidation?.spanish;
    if (!v) return `<section class="external-comparison"><h3>Comparación con software de referencia</h3><p>No hay resultados externos disponibles en esta instalación. La comparación de sílabas se muestra por separado.</p></section>`;
    const number = (value, digits = 3) => Number(value).toLocaleString('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    const percent = (value, digits = 1) => `${number(value * 100, digits)} %`;
    const signed = value => `${Number(value) >= 0 ? '+' : ''}${number(value, 3)}`;
    const rows = [
      ['Programa usado para la comparación', v.reference_software],
      ['Textos preparados', String(v.texts_total)],
      ['Textos con resultado en ambos programas', String(v.texts_compared)],
      ['Resultados externos no disponibles', String(v.external_errors)],
      ['Media de Radar', number(v.mean_radar_score)],
      ['Media de INFLESZ', number(v.mean_inflesz_score)],
      ['Diferencia media absoluta', `${number(v.mean_absolute_difference)} puntos`],
      ['Diferencia media, Radar menos INFLESZ', `${signed(v.mean_signed_difference)} puntos`],
      ['Relación entre puntuaciones (correlación de Pearson)', number(v.pearson_correlation, 4)],
      ['Concordancia de nivel y dispersión (coeficiente de Lin)', number(v.lins_concordance_correlation, 4)],
      ['Acuerdo de categoría', `${percent(v.category_agreement)} (${v.same_category_count}/${v.texts_compared})`],
    ];
    const mismatches = Array.isArray(v.category_mismatches) ? v.category_mismatches : [];
    const mismatchDetails = mismatches.length ? `<details><summary>Los ${mismatches.length} textos con categoría distinta</summary>${table(['Texto', 'Radar', 'INFLESZ', 'Umbral cruzado'], mismatches.map(item => [item.text_id, number(item.radar_score), number(item.inflesz_score), number(item.threshold)]))}<p>Las diferencias están junto a los límites de 55 u 80 puntos. La magnitud es compatible con una diferencia de una sílaba si los recuentos de palabras y frases coinciden, pero INFLESZ no expone esos recuentos para confirmarlo texto a texto.</p></details>` : '';
    return `<section class="external-comparison"><h3>Comparación con software de referencia</h3><p>Se analizaron los mismos 100 textos institucionales en Radar e INFLESZ, una escala de legibilidad en español validada para textos dirigidos a pacientes (Barrio-Cantalejo et al., 2008). ${v.texts_compared} pares tenían una puntuación externa utilizable; ${v.external_errors} resultado externo no estuvo disponible y se excluyó de las medidas numéricas. La prueba compara las puntuaciones Szigriszt-Pazos y las categorías que resultan de cada puntuación.</p>${table(['Medida','Resultado'], rows)}${mismatchDetails}<p>La diferencia media absoluta expresa el tamaño medio de la diferencia sin importar cuál programa puntúa más alto. La diferencia media con signo se calcula como Radar menos INFLESZ: un resultado negativo indica una puntuación media ligeramente inferior en Radar. Pearson muestra si las puntuaciones aumentan o disminuyen en el mismo sentido; el coeficiente de Lin además tiene en cuenta el nivel y la dispersión. Un valor de 1 representa concordancia perfecta.</p><p>Esta comparación de índices es distinta de la validación del recuento de sílabas. Una coincidencia alta no implica que ambos programas compartan todas sus reglas internas, ni predice por sí sola la comprensión de cada persona.</p><p class="url">Fecha de la comparación: ${escapeHtml(new Date(v.generated_at).toLocaleString('es-ES', { timeZone: 'UTC' }))} (UTC, hora universal). Resultados detallados: validation/spanish/validation-results.xlsx.</p></section>`;
  }
  const v = result.indexValidation;
  const total = v?.groups?.find(group => group.group === 'all');
  if (!total) return `<section class="external-comparison"><h2>External readability-index comparison</h2>${table(['Field','External result'],[['Software',''],['Version',''],['Number of texts compared',''],['Readability-score agreement',''],['Mean score difference','']])}<p>Blank cells do not mean zero. The syllable-count comparison is separate from the external readability-index comparison.</p></section>`;
  const e = escapeHtml;
  const num = (value, digits = 3) => value == null ? 'Unavailable' : Number(value).toLocaleString('en-GB', {minimumFractionDigits:digits,maximumFractionDigits:digits});
  const percent = value => `${num(value*100,1)}%`;
  const current = result.syllableValidation?.matchesCurrentServer && result.syllableValidation.data.current_server_sha256 === v.radar_server_sha256;
  const rows = [
    ['Software used for comparison', `${v.reference_software}, version ${v.reference_version}, build ${v.reference_build}`],
    ['Language selected in Word', v.proofing_language],
    ['Texts compared in both programs', `${total.texts_compared} (50 intended-easy; 50 intended-difficult)`],
    ['Identical word / sentence counts', `${percent(total.word_count_agreement)} / ${percent(total.sentence_count_agreement)}`],
    ['Comparison scale', '0 to 100 in both programs'],
    ['Mean absolute score difference, common 0 to 100 scale', `${num(total.mean_absolute_difference)} points`],
    ['Mean signed difference, Radar minus Word', `${num(total.mean_signed_difference)} points`],
    ['How closely scores rise and fall together (Pearson correlation)', num(total.pearson_correlation,4)],
    ['Agreement in score level and spread (Lin coefficient)', num(total.lins_concordance_correlation,4)],
  ];
  return `<section class="index-validation"><h3>Comparison with reference software</h3><p>Each of the same 100 English texts was measured by both Radar and the installed desktop version of Microsoft Word, without changing its wording. Word was set to English (United States). The comparison uses Flesch Reading Ease (Flesch, 1948), the reading-ease score calculated by both programs. Word's separate Flesch-Kincaid Grade Level describes a school grade and was not used in place of the reading-ease score. Measurements were read automatically from Word's own readability statistics (Microsoft, n.d.).</p>${table(['Measure','Result'],rows)}
    <h3>Results by intended writing group: common 0 to 100 scale</h3>${table(['Group','Texts','Mean absolute difference (points)','Pearson correlation','Lin concordance'],v.groups.map(group=>[group.group,group.texts_compared,num(group.mean_absolute_difference),num(group.pearson_correlation,4),num(group.lins_concordance_correlation,4)]))}
    <p>The mean absolute difference is the average size of a score difference, regardless of its sign: scores of 50 and 52 differ by 2 points. The signed difference is Radar minus Word, so a negative average means Radar gives lower scores. Pearson correlation describes whether scores rise and fall together; it does not establish that their actual values match. Lin's coefficient also considers differences in score level and spread. A value of 1 means perfect agreement for Lin's coefficient.</p>
    <p>The texts were written as examples of institutional information. Their easy/difficult labels describe the intended writing style, not a reading level established by testing real readers. The results do not mean the two programs give identical scores on all text.</p>
    <p>Both programs are compared on a common 0 to 100 scale. All reported differences, correlations and concordance coefficients use this scale. These results measure agreement between scores on this scale; they do not establish that the underlying calculations are identical. Word does not expose syllable counts here.</p>
    <p class="url">Comparison date: ${e(new Date(v.generated_at).toLocaleString('en-GB',{timeZone:'UTC'}))} (UTC, universal time). Detailed results: validation/english/validation-results.xlsx. The SHA-256 identifiers below are digital fingerprints used to identify the exact test texts and program version. Test texts: ${e(v.corpus_sha256)}. Program: ${e(v.radar_server_sha256)}.</p>${current?'':'<p>These saved results have not been matched to the current program version. Repeat the comparison before applying them to a changed program.</p>'}</section>`;
}

function openScientificReport(result, kind) {
  const full = kind === 'full';
  const es = language === 'es';
  const t = (spanish, english) => es ? spanish : english;
  const e = escapeHtml;
  const analysisLanguageName = result.language === 'es' ? t('español', 'Spanish') : t('inglés', 'English');
  const all = result.pages.flatMap(page => page.fragments.map(fragment => ({...fragment, pageUrl: page.url, pageTitle: page.title}))).sort(compareFragmentDifficulty);
  const sourceLabel = value => String(value ?? '').replace(/^local-html:\/\//, t('Archivo HTML local: ', 'Local HTML file: '));
  const table = (headers, rows) => `<table><thead><tr>${headers.map(h=>`<th>${e(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${e(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const pageData = table(['ID',t('Página o archivo','Page or file'),t('Estado','Status'),t('Fragmentos','Fragments'),t('Media','Mean'),t('Categoría','Category')], result.pages.map(p=>[p.pageId,sourceLabel(p.url),p.status === 'analyzed' ? t('analizada','analyzed') : p.status === 'discarded' ? t('descartada','discarded') : p.status === 'duplicate' ? t('contenido duplicado excluido','duplicate content excluded') : p.status === 'error' ? t('error','error') : p.status,p.fragments.length,p.score,p.status === 'analyzed' ? severityForReading(p.score, p.level).action : '-']));
  const coverage = result.criteria?.coverage;
  const coverageData = coverage ? table([t('Dominio','Domain'),t('Descubiertas','Discovered'),t('Elegibles','Eligible'),t('Analizadas','Analyzed'),t('Excluidas por idioma','Excluded by language'),t('Excluidas por robots','Excluded by robots'),t('Secciones','Sections'),t('Cobertura','Coverage')], result.domains.map(domain => [domain.domain,domain.candidatesDetected,domain.eligibleCandidates,domain.analyzedPages ?? '-',domain.languageExcludedPages ?? 0,domain.excludedCandidates ?? 0,domain.sections?.length ?? '-',domain.partialReasons?.length ? t('Parcial: ','Partial: ')+coverageReasonText(domain.partialReasons) : t('Dentro de los límites','Within stated limits')])) : '';
  const references = result.language === 'es'
    ? `<p>Real Academia Española &amp; Asociación de Academias de la Lengua Española. (2010). <i>Ortografía de la lengua española</i>. Espasa. Las convenciones sobre diptongos, triptongos, hiatos, <i>qu</i>/<i>gu</i> y diéresis orientan las reglas de respaldo.</p><p>Barrio-Cantalejo, I. M., Simón-Lorda, P., Melguizo, M., Escalona, I., Marijuán, M. I., &amp; Hernando, P. (2008). Validación de la Escala INFLESZ para evaluar la legibilidad de los textos dirigidos a pacientes. <i>Anales del Sistema Sanitario de Navarra, 31</i>(2), 135-152. https://recyt.fecyt.es/index.php/ASSN/article/view/1953</p><p>de Vera, J. (2026). <i>Pylabeador</i> (Version 0.9.0) [Computer software]. https://pypi.org/project/pylabeador/</p>`
    : `<p>Flesch, R. (1948). A new readability yardstick. <i>Journal of Applied Psychology, 32</i>(3), 221-233. https://doi.org/10.1037/h0057532</p><p>Carnegie Mellon University. (n.d.). <i>The CMU pronouncing dictionary</i> [Data set]. https://github.com/cmusphinx/cmudict</p><p>Microsoft. (n.d.). <i>Get your document's readability and level statistics in Microsoft Word.</i> https://support.microsoft.com/en-us/word/get-your-document-s-readability-and-level-statistics-in-microsoft-word</p><p>Microsoft. (n.d.). <i>ReadabilityStatistics collection (Word).</i> https://learn.microsoft.com/en-us/office/vba/api/word.readabilitystatistics</p>`;
  const fragmentData = full ? all.map((f,i)=>`<article><h3>${i+1}. ${e(f.pageTitle)}</h3><p class="url">${e(sourceLabel(f.pageUrl))}</p><p><b>${t('Índice','Score')}: <span style="color:${({red:'#b21d27',orange:'#9c4609',amber:'#7b5700',lime:'#46652f',green:'#12624c'})[severityForReading(f.score,f.level).code] || '#173b49'}">${e(f.score)}</span></b> | ${e(severityForReading(f.score, f.level).action)} | ${f.words} ${t('palabras','words')} | ${f.sentences} ${t('frases','sentences')} | ${f.syllables} ${t('sílabas estimadas','estimated syllables')}</p><p>${e(f.text)}</p></article>`).join('') : '';
  const reportMarkup = `<!doctype html><html lang="${es?'es':'en'}"><head><meta charset="utf-8"><title>Web Readability Radar - ${kind} report</title><style>
  @page{size:A4;margin:20mm 17mm}body{font:11pt/1.55 Arial;color:#172b32;max-width:180mm;margin:25px auto}header{border-bottom:3px solid #187568;padding-bottom:18px}h1{font-size:25pt;margin:8px 0}h2{font-size:16pt;margin-top:28px;border-bottom:1px solid #cad6d8;padding-bottom:5px}h3{font-size:12pt}p{overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;font-size:9pt;table-layout:fixed}th,td{border:1px solid #ccd6d8;padding:6px;vertical-align:top;overflow-wrap:anywhere}th{background:#edf4f3;text-align:left}thead{display:table-header-group}tr{break-inside:avoid}.validation-table th:first-child{width:66%}.validation-table td:last-child{font-variant-numeric:tabular-nums}.validation-table{break-inside:avoid}article{margin:18px 0;padding-bottom:14px;border-bottom:1px solid #ccd6d8}.url{font-size:9pt;color:#52666c}.refs p{padding-left:18px;text-indent:-18px}button{padding:12px 20px;margin-bottom:20px}@media print{button{display:none}body{margin:0;max-width:none}h2,h3{break-after:avoid}}
  .validation-block{break-before:page}.external-comparison,.refs{break-inside:avoid}@page{@bottom-right{content:counter(page) " / " counter(pages);font:9pt Arial;color:#52666c}}
  </style></head><body><button onclick="window.print()">${t('Guardar como PDF / Imprimir','Save as PDF / Print')}</button><header><div>Web Readability Radar</div><h1>${t('Informe técnico de lecturabilidad','Technical readability report')}</h1><p>${t(full?'Informe extenso':'Informe breve',full?'Full report':'Brief report')} | ${e(new Date(result.generatedAt).toLocaleString(es?'es-ES':'en-GB'))}</p><p>${t('Se ha analizado contenido textual de','Text content analyzed from')}: ${e(result.domains.map(d=>sourceLabel(d.startUrl)).join(', '))}</p></header>
  <h2>${t('Resumen y alcance','Summary and scope')}</h2><p>${t('Páginas encontradas','Pages found')}: ${result.summary.candidates}; ${t('elegidas para el análisis','selected for analysis')}: ${result.summary.selected}; ${t('con resultados calculados','with calculated results')}: ${result.summary.analyzed}; ${t('excluidas por idioma','excluded by language')}: ${result.summary.languageExcludedPages ?? 0}; ${t('fragmentos de texto detectados','text fragments detected')}: ${all.length}. ${t('Idioma analizado','Language analyzed')}: ${analysisLanguageName}. ${t('Puntuación media de las páginas','Mean page score')}: ${e(result.summary.averageScore)}.</p><p>${t('Cada fragmento es un párrafo HTML completo. No se recorta ni se divide por longitud. Las copias textuales idénticas dentro de una misma URL se excluyen para no duplicar resultados. Las páginas encontradas son las direcciones detectadas; las elegidas son las que entraron en el análisis. Una página con resultados es aquella cuyo texto permitió calcular una puntuación.','Each fragment is one complete HTML paragraph. It is not shortened or divided by length. Identical copies within the same URL are excluded to prevent duplicate results. Pages found are the addresses detected; selected pages are those included in the analysis. A page with results is one whose extracted text allowed a score to be calculated.')}</p>
  ${coverage ? `<h2>${t('Cobertura del dominio','Domain coverage')}</h2><p>${coverage.maxCrawlDepth === null ? t(`El modo completo combinó robots.txt, sitemaps declarados o estándar y enlaces internos sin un límite interno de profundidad. Se recorren todas las URLs detectables hasta el máximo técnico de ${coverage.maxCandidates} candidatas. ${coverage.includeRelatedSubdomains ? 'Se incluyeron subdominios bajo el mismo dominio registrable.' : 'Los subdominios no se incluyeron.'}`, `Complete mode combined robots.txt, declared or standard sitemaps, and internal links without an internal depth limit. All detectable URLs are traversed up to the technical maximum of ${coverage.maxCandidates} candidates. ${coverage.includeRelatedSubdomains ? 'Subdomains under the same registrable domain were included.' : 'Subdomains were not included.'}`) : t(`La detección combinó robots.txt, sitemaps declarados o estándar y enlaces internos. En modo rápido se exploraron hasta ${coverage.maxCrawlPagesPerDomain} páginas por dominio y hasta ${coverage.maxCrawlDepth} niveles de enlace; se pueden registrar hasta ${coverage.maxCandidates} URLs candidatas.`, `Discovery combined robots.txt, declared or standard sitemaps, and internal links. In Fast mode, up to ${coverage.maxCrawlPagesPerDomain} pages per domain and ${coverage.maxCrawlDepth} link levels were explored; up to ${coverage.maxCandidates} candidate URLs can be recorded.`)}</p>${coverageData}` : ''}
  <h2>${t('Cómo interpretar el informe','How to interpret this report')}</h2><p>${t('El índice de lecturabilidad es una puntuación, no un porcentaje de comprensión. Cuanto más bajo es, mayor es la dificultad textual estimada. Sirve para decidir qué revisar; no certifica accesibilidad ni permite saber por sí solo si una persona concreta comprenderá el texto.','The readability index is a score, not a percentage of reader comprehension. Lower scores indicate greater estimated text difficulty. It helps identify content to review; it does not certify accessibility or establish whether an individual reader will understand the text.')}</p>
  <h2>${t('Método reproducible','Reproducible method')}</h2><p>${e(result.metric)}. ${t('Mínimo de palabras por fragmento','Minimum fragment words')}: ${result.criteria.minFragmentWords}. ${t('Mínimo por página','Minimum page words')}: ${result.criteria.minWords}.</p><p>${t('Cada puntuación de página se calcula con el total de palabras, frases y sílabas extraído de su texto completo. Los párrafos se usan para localizar contenido que revisar, pero no se promedian para crear el índice de página. Se conservan valores negativos; actualmente los valores superiores a 100 se limitan a 100. El recuento de sílabas es aproximado.','Each page score is calculated from the total words, sentences, and syllables extracted from its complete text. Paragraphs are used to locate content for review, but they are not averaged to create the page score. Negative values are preserved; values above 100 are currently capped at 100. Syllable counting is approximate.')}</p><p>${result.language === 'es' ? (es ? 'Szigriszt-Pazos: 206.835 - 62.3 × (sílabas / palabras) - (palabras / frases). Las categorías INFLESZ se interpretan conforme a Barrio-Cantalejo et al. (2008).' : 'Szigriszt-Pazos: 206.835 - 62.3 × (syllables / words) - (words / sentences). INFLESZ categories are interpreted in line with Barrio-Cantalejo et al. (2008).') : 'Flesch Reading Ease: 206.835 - 84.6 × (syllables / words) - 1.015 × (words / sentences) (Flesch, 1948).'}</p><p>${e(processingDescription(result.language, language))}</p><p>${result.language === 'es' ? t('Los cinco colores representan las categorías INFLESZ: rojo, naranja, amarillo, verde claro y verde. Son una ayuda visual de Radar, no una segunda prueba.', 'The five colors represent INFLESZ categories: red, orange, yellow, light green and green. They are Radar visual aids, not a second test.') : t('Los cinco colores agrupan las categorías de Flesch Reading Ease. Son una ayuda visual de Radar, no una segunda prueba.', 'The five colors group Flesch Reading Ease categories. They are Radar visual aids, not a second test.')}</p>
  <section class="validation-block"><h2>${t('Validación', 'Validation')}</h2><div class="syllable-validation">${syllableValidationSection(result)}</div>${indexValidationSection(result, table)}</section>
  <h2>${t('Resultados por página','Page results')}</h2>${pageData}
  ${full?`<h2>${t('Todos los fragmentos analizados','All analyzed fragments')}</h2>${fragmentData}<h2>${t('Trazabilidad y notas técnicas','Traceability and technical notes')}</h2>${table(['URL',t('Origen','Source'),t('Sección','Section'),t('Profundidad','Depth'),t('Elegible','Eligible'),t('Seleccionada','Selected'),t('Motivo','Reason')],result.samplingFrame.map(r=>[r.url,r.source,r.section,r.depth,r.eligible ? t('Sí','Yes') : t('No','No'),r.selected ? t('Sí','Yes') : t('No','No'),r.exclusionReason || r.selectionReason]))}${result.pages.filter(p=>p.reason).map(p=>`<p>${e(p.url)}: ${e(p.reason)}</p>`).join('')}`:''}
  <h2>${t('Referencias (APA)','References (APA)')}</h2><div class="refs">${references}<p>Speer, R. (2023). <i>wordfreq</i> (Version 3.1.1) [Computer software]. https://pypi.org/project/wordfreq/3.1.1/</p><p>World Wide Web Consortium. (2023). <i>Web Content Accessibility Guidelines (WCAG) 2.2.</i> https://www.w3.org/TR/2023/REC-WCAG22-20231005/</p><p>World Wide Web Consortium. (2021). <i>Making content usable for people with cognitive and learning disabilities.</i> https://www.w3.org/TR/coga-usable/</p></div></body></html>`;
  showReportPreview(reportMarkup, t('Vista previa del informe', 'Report preview'));
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

function clarifyReport(doc, result, full) {
  const es = language === 'es';
  const t = (a,b) => es ? a : b;
  const add = (tag,text,before) => { const node=doc.createElement(tag); node.textContent=text; before.before(node); return node; };
  const find = text => [...doc.querySelectorAll('h2')].find(node=>node.textContent===text);
  const sectionHeading = find(t('Resumen y alcance','Summary and scope'));
  add('h3',t('Qué se ha revisado','What was reviewed'),sectionHeading.nextElementSibling);
  const interpretation = find(t('Cómo interpretar el informe','How to interpret this report'));
  const sampleNote = doc.createElement('p');
  sampleNote.textContent = result.criteria.samplingMode === 'random_pages'
    ? t(`Se seleccionó una muestra aleatoria estratificada de ${result.summary.selected} páginas entre ${result.summary.eligibleCandidates ?? result.summary.candidates} candidatas elegibles detectadas, incluyendo la página inicial y las obligatorias permitidas. Se rota entre secciones antes de añadir más páginas de una misma sección. Los resultados describen esta muestra, no todo el dominio. La web y el CSV muestran hasta 10 de los fragmentos más difíciles de las páginas seleccionadas; el informe completo incluye todos sus fragmentos, ordenados por dificultad.`, `A stratified random sample of ${result.summary.selected} pages was selected from ${result.summary.eligibleCandidates ?? result.summary.candidates} eligible detected candidates, including the permitted starting and required pages. It rotates across sections before adding more pages from the same section. Results describe this sample, not the entire domain. The web view and CSV show up to 10 hardest fragments from the selected pages; the full report includes all fragments from these pages, ordered by difficulty.`)
    : t('Los resultados se refieren a las páginas seleccionadas o al archivo HTML cargado. Los fragmentos se ordenan del índice más bajo (más difícil) al más alto (más fácil).', 'Results refer to the selected pages or uploaded HTML file. Fragments are ordered from the lowest score (hardest) to the highest score (easiest).');
  interpretation.before(sampleNote);
  if (result.criteria.fragmentSelection === 'hardest_from_selected_pages') {
    sampleNote.textContent += ' ' + t(`Selección de fragmentos: hasta 10 con menor puntuación, entre ${result.criteria.eligibleFragmentCount} elegibles de las páginas seleccionadas. Cada fragmento conserva el párrafo tal como aparece en la página; las copias idénticas de una misma URL se muestran una sola vez.`, `Fragment selection: up to 10 with the lowest score from ${result.criteria.eligibleFragmentCount} eligible fragments on the selected pages. Each fragment retains the paragraph as it appears on the page; identical copies within the same URL are shown once.`);
  }
  add('h3',t('Puntuación y dificultad','Score and difficulty'),interpretation.nextElementSibling);
  const categoryNote=doc.createElement('p');
  categoryNote.textContent=result.language === 'es'
    ? t('En español, Szigriszt-Pazos calcula el índice a partir de la longitud de las palabras y de las frases. INFLESZ convierte ese número en categorías: menos de 40, «Muy difícil»; de 40 a menos de 55, «Algo difícil»; de 55 a menos de 65, «Normal»; de 65 a menos de 80, «Bastante fácil»; 80 o más, «Muy fácil». Por ejemplo, 29,4 significa «Muy difícil», aunque sea el promedio de muchas páginas.', 'For Spanish analysis, Szigriszt-Pazos calculates the score from word and sentence length. INFLESZ turns it into categories: below 40, Very difficult; 40 to below 55, Somewhat difficult; 55 to below 65, Normal; 65 to below 80, Fairly easy; 80 or above, Very easy. For example, 29.4 means Very difficult, even when it is the mean of many pages.')
    : t('En inglés, Flesch Reading Ease usa la longitud de las palabras y de las frases para estimar la dificultad. Las categorías son: menos de 30, Muy difícil; de 30 a menos de 50, Difícil; de 50 a menos de 60, Algo difícil; de 60 a menos de 70, Inglés claro; de 70 a menos de 80, Bastante fácil; de 80 a menos de 90, Fácil; 90 o más, Muy fácil.', 'In English, Flesch Reading Ease uses word and sentence length to estimate difficulty. Categories are: below 30, Very difficult; 30 to below 50, Difficult; 50 to below 60, Fairly difficult; 60 to below 70, Plain English; 70 to below 80, Fairly easy; 80 to below 90, Easy; 90 or above, Very easy. A mean score can therefore indicate high difficulty.');
  interpretation.nextElementSibling.nextElementSibling.after(categoryNote);
  const method = find(t('Método reproducible','Reproducible method'));
  add('h3',t('Configuración del análisis','Analysis settings'),method.nextElementSibling);
  const settings = method.nextElementSibling.nextElementSibling;
  add('h3',t('Cómo se calcula el promedio','How the mean is calculated'),settings.nextElementSibling);
  const mean = settings.nextElementSibling.nextElementSibling;
  const extra=doc.createElement('p');
  extra.textContent=t('El promedio global suma las puntuaciones de las páginas analizadas y divide entre su número. Cada página tiene el mismo peso, aunque unas tengan más texto que otras. Las páginas sin puntuación se excluyen. Por ejemplo, dos páginas con índices 20 y 60 dan un promedio de 40. «Promedio» describe el cálculo; no significa dificultad intermedia.', 'The overall mean adds the analyzed page scores and divides by their number. Every page has equal weight even if their text lengths differ. Pages without a score are excluded. For example, page scores of 20 and 60 give a mean of 40. “Mean” describes the calculation; it does not mean medium difficulty.');
  mean.after(extra);
  const formula = extra.nextElementSibling;
  add('h3',t('Fórmula y recuentos','Formula and counts'),formula);
  const traffic = formula.nextElementSibling.nextElementSibling;
  add('h3',t('Qué significan los colores','What the colors mean'),traffic);
  const thresholds=doc.createElement('p');
  thresholds.textContent=result.language === 'es'
    ? t('Los colores siguen las categorías INFLESZ, no una comparación entre dos índices: rojo (muy difícil), naranja (algo difícil), amarillo (normal), verde claro (bastante fácil), verde (muy fácil). Los límites se aplican antes de redondear. Un verde no garantiza comprensión. Bajo umbral cuenta páginas; la distribución de colores cuenta todos los fragmentos elegibles.', 'Colors follow INFLESZ categories rather than a comparison of two indices. Red: very difficult; orange: somewhat difficult; yellow: normal; light green: fairly easy; green: very easy. Categories use unrounded scores. Green does not guarantee comprehension. Below threshold counts pages; color distribution counts all eligible fragments.')
    : t('Los colores agrupan las categorías de Flesch Reading Ease: rojo (difícil o muy difícil), naranja (algo difícil), amarillo (inglés claro), verde claro (bastante fácil), verde (fácil o muy fácil). Los límites se aplican antes de redondear. Un verde no garantiza comprensión. Bajo umbral cuenta páginas; la distribución de colores cuenta todos los fragmentos elegibles.', 'Colors group Flesch Reading Ease categories: red (difficult or very difficult), orange (fairly difficult), yellow (plain English), light green (fairly easy), green (easy or very easy). Categories use unrounded scores. Green does not guarantee comprehension. Below threshold counts pages; color distribution counts all eligible fragments.');
  traffic.textContent = thresholds.textContent + ' ' + t('La categoría se obtiene del mismo índice y no es una medición independiente.', 'The category comes from the same score and is not an independent measurement.');

  const validation=doc.querySelector('.validation-block');
  const syllableValidation=validation.querySelector('.syllable-validation');
  const v=result.syllableValidation?.data;
  const provenance=result.language === 'es'
    ? t('La aplicación integra una tabla de referencia: cada fila contiene una palabra y el número de sílabas obtenido con pylabeador (de Vera, 2026). Para esas palabras, Radar usa ese recuento; para las no incluidas, aplica reglas ortográficas basadas en las convenciones de la RAE y ASALE (2010). La tabla permite una ejecución reproducible sin conexión y no sustituye una revisión humana de cada palabra.', 'The application bundles a reference table: each row contains a Spanish word and a syllable count obtained with pylabeador (de Vera, 2026). For these words, Radar uses that count; for words not included, it applies spelling rules based on the conventions of RAE and ASALE (2010). The table enables reproducible offline execution and does not replace human review of every word.')
    : t('La aplicación integra una tabla de referencia: cada fila contiene una palabra y el número de sílabas derivado de la primera pronunciación de CMUdict (Carnegie Mellon University, 2024), un diccionario de pronunciaciones del inglés estadounidense. Para esas palabras, Radar usa ese recuento; para las no incluidas, aplica reglas ortográficas. La tabla permite una ejecución reproducible sin conexión y no sustituye una revisión humana de cada palabra.', 'The application bundles a reference table: each row contains a word and a syllable count derived from the first pronunciation in CMUdict (Carnegie Mellon University, 2024), a dictionary of North American English pronunciations. For these words, Radar uses that count; for words not included, it applies spelling rules. The table enables reproducible offline execution and does not replace human review of every word.');
  if(full) {
    const paragraphs=syllableValidation.querySelectorAll(':scope > p');
    if(paragraphs[1]) paragraphs[1].textContent=provenance;
  } else if(v) {
    const format=n=>Number(n).toLocaleString(es?'es-ES':'en-GB',{maximumFractionDigits:3});
    syllableValidation.innerHTML=`<h3>${es?'Recuento de sílabas':'Syllable counting'}</h3><p>${escapeHtml(t(`Se compararon ${v.compared_word_types} palabras con recuento externo, de una lista de ${v.total_word_types} palabras frecuentes procedente de wordfreq (Speer, 2023); se excluyeron ${v.excluded_word_types} sin referencia. Coincidencia exacta por palabra: ${format(v.exact_type_agreement*100)} %. Al dar más peso a las palabras frecuentes: ${format(v.frequency_weighted_agreement*100)} %.`, `${v.compared_word_types} words with external counts were compared from a list of ${v.total_word_types} common words from wordfreq (Speer, 2023); ${v.excluded_word_types} without a reference were excluded. Exact word-level agreement: ${format(v.exact_type_agreement*100)}%. Giving more weight to common words: ${format(v.frequency_weighted_agreement*100)}%.`))}</p><p>${escapeHtml(provenance)}</p>`;
    if(!result.syllableValidation.matchesCurrentServer) syllableValidation.insertAdjacentHTML('beforeend',`<p>${escapeHtml(t('La validación guardada corresponde a otra versión del programa; debe repetirse para esta versión.','The saved validation belongs to another program version and must be repeated for this version.'))}</p>`);
  }
  const pagesHeading=find(t('Resultados por página','Page results'));
  if(!full) { pagesHeading.nextElementSibling.remove(); pagesHeading.remove(); }
  else {
    add('h3',t('Puntuaciones y estado','Scores and status'),pagesHeading.nextElementSibling);
    add('p',t('Cada fila corresponde a una página o archivo. ID es su identificador. «Analizada» significa que se pudo calcular un índice; «descartada» indica que no se obtuvo un resultado válido; «contenido duplicado excluido» indica que otra URL devolvió el mismo texto y solo se conservó la primera para evitar duplicar métricas; «error» indica que falló el acceso o procesamiento. Una celda vacía significa dato no disponible, no cero. La categoría traduce el índice a una descripción de dificultad.', 'Each row represents one page or file. ID is its identifier. “Analyzed” means a score was calculated; “discarded” means no valid result was obtained; “duplicate content excluded” means another URL returned the same text and only the first was retained to avoid duplicating metrics; “error” means access or processing failed. A blank cell means unavailable, not zero. The category translates the score into a difficulty description.'),pagesHeading.nextElementSibling.nextElementSibling);
  }
  // Fragment titles remain simple labels and do not enter the report outline.
  doc.querySelectorAll('article h3').forEach(node=>{const label=doc.createElement('p');label.className='fragment-title';label.textContent=node.textContent.replace(/^\d+\.\s*/,'');node.replaceWith(label);});
  const external=doc.querySelector('.index-validation,.external-comparison');
  if(external) {
    if(!full && !es && result.indexValidation?.groups) {
      const total=result.indexValidation.groups.find(g=>g.group==='all');
      const hard=result.indexValidation.groups.find(g=>g.group==='difficult');
      external.innerHTML=`<h3>Comparison with reference software</h3><p>The same 100 English texts (50 intended-easy and 50 intended-difficult) were assessed with Radar and desktop Microsoft Word, using English (United States). Both calculate Flesch Reading Ease. Both programs are compared on the same 0-100 scale.</p><p>Mean absolute difference: ${Number(total.mean_absolute_difference).toFixed(3)} points overall; ${Number(hard.mean_absolute_difference).toFixed(3)} points for difficult texts. This is the average distance between the two scores: 50 and 52 differ by 2 points. Lin concordance: ${Number(total.lins_concordance_correlation).toFixed(4)}; 1 means perfect agreement in score level and spread.</p><p>The results describe numerical agreement on the 0-100 scale. Intended difficulty labels describe how the texts were written, not results from readers. Agreement with Word is not evidence that users understand the text.</p>`;
    } else {
      const first=external.querySelector('h2');
      if(first?.nextElementSibling) add('h3',t('Estado de la comparación','Comparison method and status'),first.nextElementSibling);
    }
  }
  const refs=find(t('Referencias (APA)','References (APA)'));
  refs.classList.add('references-heading');
  const trace=find(t('Trazabilidad y notas técnicas','Traceability and technical notes'));
  if(trace) add('p',t('Esta tabla permite comprobar cómo entró cada dirección en el análisis. URL es la dirección de la página; origen indica cómo se encontró; seleccionada indica si se incluyó; motivo explica la decisión. Las notas posteriores documentan incidencias de extracción, acceso o longitud del texto.', 'This table shows how each address entered the analysis. URL is the page address; source states how it was found; selected states whether it was included; reason explains the decision. Notes below document extraction, access or text-length issues.'),trace.nextElementSibling);
  const counts=trafficCounts(result);
  const conclusion=doc.createElement('section');
  const score=result.summary.averageScore;
  conclusion.innerHTML=`<h2>${t('Conclusiones y siguientes pasos','Conclusions and next steps')}</h2><h3>${t('Lectura de los resultados','Interpreting the results')}</h3><p>${escapeHtml(t(`El promedio de las ${result.summary.analyzed} páginas con puntuación es ${score ?? 'no disponible'}. Hay ${counts.red} fragmentos rojos, ${counts.orange} naranjas, ${counts.amber} amarillos, ${counts.lime} verde claro y ${counts.green} verdes. Estos recuentos incluyen todos los fragmentos detectados, aunque el modo rápido muestre solo diez.`, `The mean for the ${result.summary.analyzed} pages with scores is ${score ?? 'unavailable'}. There are ${counts.red} red, ${counts.orange} orange, ${counts.amber} yellow, ${counts.lime} light green and ${counts.green} green fragments. These counts cover all detected fragments, even when Fast mode displays only ten.`))}</p><h3>${t('Acciones recomendadas','Recommended actions')}</h3><p>${escapeHtml(t(counts.red?'Revisar primero los fragmentos rojos, especialmente instrucciones, trámites y decisiones importantes. Comprobar frases largas y términos poco familiares, y probar la versión revisada con usuarios.':'No se han detectado fragmentos rojos. Revisar igualmente los contenidos esenciales y comprobar que el texto extraído representa lo que ve el usuario.', counts.red?'Review red fragments first, especially instructions, procedures and important decisions. Check long sentences and unfamiliar terms, and test revised content with users.':'No red fragments were detected. Still review essential content and check that extracted text represents what users see.'))}</p><p>${escapeHtml(t('Los resultados describen el contenido que se pudo extraer en esta ejecución. Pueden quedar fuera textos cargados tras una interacción, imágenes con texto o páginas inaccesibles. El informe orienta la revisión y no certifica accesibilidad ni comprensión individual.', 'Results describe content extracted in this run. Text loaded after interaction, text in images, or inaccessible pages may be missing. This report guides review and does not certify accessibility or individual comprehension.'))}</p>`;
  refs.before(conclusion);
  const referenceGroup=doc.createElement('section');referenceGroup.className='reference-group';refs.before(referenceGroup);
  const referenceContent=refs.nextElementSibling;
  referenceGroup.append(refs);
  if(referenceContent) referenceGroup.append(referenceContent);
  const toc=doc.createElement('nav');toc.className='report-toc';toc.setAttribute('aria-label',t('Índice','Contents'));
  const tocTitle=doc.createElement('p');tocTitle.className='toc-title';tocTitle.textContent=t('Índice','Contents');toc.append(tocTitle);
  const list=doc.createElement('ol');toc.append(list);
  let major=0,minor=0,parentItem;
  doc.querySelectorAll('h2,h3').forEach(node=>{
    const sub=node.tagName==='H3';
    if(!sub){major++;minor=0;}else minor++;
    const number=sub?`${major}.${minor}`:`${major}`;
    node.id=`section-${number.replace('.','-')}`;
    node.textContent=`${number}. ${node.textContent}`;
    const li=doc.createElement('li'),link=doc.createElement('a');link.href=`#${node.id}`;link.textContent=node.textContent;li.append(link);
    if(sub&&parentItem){let nested=parentItem.querySelector('ol');if(!nested){nested=doc.createElement('ol');parentItem.append(nested);}nested.append(li);}else{list.append(li);parentItem=li;}
  });
  doc.querySelector('header').after(toc);
  const style=doc.createElement('style');
  style.textContent='.report-toc{margin:20px 0;padding-bottom:16px;border-bottom:1px solid #cad6d8}.toc-title{font-size:16pt;font-weight:bold}.report-toc ol{list-style:none;padding:0;margin:5px 0}.report-toc ol ol{padding-left:18px;font-size:9pt}.report-toc a{color:#214b60;text-decoration:none}.fragment-title{font-weight:bold;break-after:avoid}h2,h3{break-after:avoid}.validation-block{break-before:auto}.external-comparison,.refs{break-inside:auto}article{break-inside:avoid}@media print{.report-toc,.references-heading{break-before:page}.report-toc{break-before:auto;break-after:page}body{font-size:10pt;line-height:1.45}h2{font-size:15pt}h3{font-size:11pt}}';
  doc.head.append(style);
  const pagination=doc.createElement('style');
  pagination.textContent=`@media print{.references-heading{break-before:auto}.reference-group{${full?'break-before:page':'break-inside:avoid'}}}`;
  doc.head.append(pagination);
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
    pre.textContent = localSourceText || lastResult.pages.flatMap(page=>page.fragments.map(fragment=>fragment.text)).join('\n\n');
    popup.document.body.append(heading, pre);
  }
});
