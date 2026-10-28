import englishSyllables from '../../resources/cmudict-syllables.json';
import spanishSyllables from '../../resources/pylabeador-syllables.json';

// The public edition deliberately keeps computation in the visitor's browser.
// This Worker only serves assets and fetches public HTML through a guarded proxy.
const MAX_HTML_CHARS = 2_000_000;
const FETCH_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 4;
const COMMON_CRAWL_INDEXES = 'https://index.commoncrawl.org/collinfo.json';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.readabilityradar.com') {
      return Response.redirect(`https://readabilityradar.com${url.pathname}${url.search}`, 301);
    }
    if (url.pathname === '/api/dictionary' && request.method === 'GET') {
      const language = url.searchParams.get('language') === 'en' ? 'en' : 'es';
      return json(language === 'en' ? englishSyllables.entries : spanishSyllables.entries, 200, {
        'cache-control': 'public, max-age=31536000, immutable',
      });
    }
    if (url.pathname === '/api/fetch' && request.method === 'POST') {
      try {
        const body = await request.json();
        return json(await fetchPublicHtml(body?.url), 200, { 'cache-control': 'no-store' });
      } catch (error) {
        return json({ error: readableError(error) }, error?.statusCode || 502, { 'cache-control': 'no-store' });
      }
    }
    if (url.pathname === '/api/indexed-pages' && request.method === 'POST') {
      try {
        const body = await request.json();
        return json(await findIndexedPages(body?.domain), 200, { 'cache-control': 'no-store' });
      } catch (error) {
        return json({ error: readableError(error) }, error?.statusCode || 502, { 'cache-control': 'no-store' });
      }
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'Not found.' }, 404);
    return env.ASSETS.fetch(request);
  },
};

async function findIndexedPages(value) {
  const domain = assertPublicHttpUrl(/^https?:\/\//i.test(String(value || '')) ? value : `https://${value}`).hostname;
  const cacheKey = new Request(`https://readabilityradar.com/internal/common-crawl/${encodeURIComponent(domain)}`);
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached.json();
  const indexesResponse = await fetch(COMMON_CRAWL_INDEXES, {
    headers: { accept: 'application/json', 'user-agent': 'WebReadabilityRadar/1.0 (+https://readabilityradar.com)' },
  });
  if (!indexesResponse.ok) throw httpError('The public web index is temporarily unavailable.', 502);
  const indexes = await indexesResponse.json();
  const latestIndex = indexes.find((item) => typeof item?.id === 'string')?.id;
  if (!latestIndex) throw httpError('The public web index did not provide a current collection.', 502);
  const query = new URLSearchParams({ url: `${domain}/*`, matchType: 'domain', output: 'json', filter: ['status:200', 'mime:text/html'], collapse: 'urlkey', limit: '20' });
  const response = await fetch(`https://index.commoncrawl.org/${latestIndex}-index?${query}`, {
    headers: { accept: 'application/json', 'user-agent': 'WebReadabilityRadar/1.0 (+https://readabilityradar.com)' },
  });
  if (response.status === 404) return { urls: [`https://${domain}/`], source: 'home-page' };
  if (response.status === 429 || response.status === 503) throw httpError('The public web index is busy. Try again later or use the quick domain analysis.', 503);
  if (!response.ok) throw httpError('The public web index is temporarily unavailable.', 502);
  const suffix = registrableDomain(domain);
  const urls = [...new Set((await response.text()).trim().split('\n').filter(Boolean).map((line) => {
    try { return JSON.parse(line).url; } catch { return null; }
  }).filter((item) => {
    try { const host = new URL(item).hostname; return host === suffix || host.endsWith(`.${suffix}`); } catch { return false; }
  }))].slice(0, 20);
  const result = urls.length ? { urls, source: 'common-crawl' } : { urls: [`https://${domain}/`], source: 'home-page' };
  await caches.default.put(cacheKey, json(result, 200, { 'cache-control': 'public, max-age=86400' }));
  return result;
}

function registrableDomain(host) {
  const parts = host.toLowerCase().split('.').filter(Boolean);
  const shortSuffix = parts.slice(-2).join('.');
  const threePartSuffixes = new Set(['co.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'com.br']);
  return threePartSuffixes.has(shortSuffix) && parts.length > 2 ? parts.slice(-3).join('.') : shortSuffix;
}

async function fetchPublicHtml(value) {
  let target = assertPublicHttpUrl(value);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(target.href, {
        method: 'GET', redirect: 'manual', signal: controller.signal,
        headers: {
          accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
          'user-agent': 'WebReadabilityRadar/1.0 (+privacy-preserving client analysis)',
        },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) throw httpError('Redirect without a destination.', 502);
        target = assertPublicHttpUrl(new URL(location, target).href);
        continue;
      }
      if (!response.ok) throw httpError(`The website returned HTTP ${response.status}.`, 502);
      const contentType = response.headers.get('content-type') || '';
      if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) throw httpError('The address did not return an HTML page.', 415);
      const length = Number(response.headers.get('content-length'));
      if (Number.isFinite(length) && length > MAX_HTML_CHARS) throw httpError('The page is too large for the online edition.', 413);
      const html = await response.text();
      if (html.length > MAX_HTML_CHARS) throw httpError('The page is too large for the online edition.', 413);
      return { url: target.href, html, rendering: 'static' };
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  }
  throw httpError('Too many redirects.', 508);
}

function assertPublicHttpUrl(value) {
  let url;
  try { url = new URL(String(value)); } catch { throw httpError('Enter a valid public http(s) address.', 400); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || isPrivateHost(url.hostname) || isBlockedPort(url.port)) {
    throw httpError('This address is not allowed for online analysis.', 400);
  }
  url.hash = '';
  return url;
}

function isPrivateHost(host) {
  const value = host.toLowerCase().replace(/^\[|\]$/g, '');
  return value === 'localhost' || value.endsWith('.localhost') || value.endsWith('.local') || value === '::1' ||
    /^127\./.test(value) || /^10\./.test(value) || /^192\.168\./.test(value) || /^169\.254\./.test(value) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(value) || /^0\./.test(value) || /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(value) ||
    /^fc|^fd|^fe80:/i.test(value);
}

function isBlockedPort(port) {
  if (!port) return false;
  const number = Number(port);
  return !Number.isInteger(number) || number < 1 || number > 65535 || [22, 25, 53, 110, 143, 2375, 2376, 3306, 3389, 5432, 6379, 8080, 8443].includes(number);
}

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function readableError(error) {
  if (error?.name === 'AbortError') return 'The website took too long to respond.';
  return error?.message || 'The website could not be retrieved.';
}

function json(value, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}
