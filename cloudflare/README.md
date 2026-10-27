# Online free edition

This folder deploys the public interface and its guarded fetch API as one
Cloudflare Worker. Readability analysis, charts and report generation happen
inside each visitor's browser, rather than in the Worker. This keeps the public
edition on the free plan and avoids storing submitted URLs, page text or reports.

- the Worker serves static assets, a cached syllable dictionary and `/api/fetch`;
- `/api/fetch` accepts only public HTTP(S) URLs, blocks local/private addresses,
  credentials and sensitive ports, follows at most four redirects, and limits
  HTML size and response time;
- the browser can process up to 30 static-HTML pages per domain in one run;
- local HTML uploads are analyzed in the browser and never leave the device;
- dynamic rendering is an optional future enhancement using Cloudflare Browser
  Run; static HTML remains the safe no-cost fallback.

## Deploy

```powershell
npm install
npx wrangler login
npm run deploy
```

The login command opens Cloudflare's authorization page. `npm run deploy`
prints the public `*.workers.dev` address. A custom domain is optional and is
not required for the free edition.
