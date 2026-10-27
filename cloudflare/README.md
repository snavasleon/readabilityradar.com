# Online free edition

This folder deploys the public interface and its API as one Cloudflare Worker.
It is intentionally separate from the local server:

- no account, URL, page text or report is persisted;
- local HTML files and browser-based JavaScript rendering are only available in
  the local edition;
- a request has a hard budget of 45 external fetches, below Cloudflare Workers
  Free's 50 external-subrequest ceiling;
- domain coverage is reported in each result. The worker stops rather than
  silently exceeding the free tier.

## Deploy

```powershell
npm install
npx wrangler login
npm run deploy
```

The login command opens Cloudflare's authorization page. `npm run deploy`
prints the public `*.workers.dev` address. A custom domain is optional and is
not required for the free edition.
