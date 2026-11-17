# Public deployment status

**Production URL:** https://readabilityradar.com

## Current architecture

The public edition is designed to run without a paid application server:

1. Cloudflare serves the interface, TLS certificate and guarded HTML proxy.
2. The visitor's browser calculates readability, produces charts and generates
   the report/PDF locally.
3. The Worker retrieves only public HTTP(S) HTML. It blocks local/private
   destinations, credentials and sensitive ports, limits response size and
   follows a bounded number of redirects. Turnstile validates a one-time
   human-verification token before this endpoint retrieves a page.
4. The public site analyzes one specified web page or a local HTML file. The
   local edition provides the full-domain workflow and optional local browser
   rendering of JavaScript-heavy pages.

No database stores submitted URLs, fetched text, results or reports. Local HTML
uploads remain in the visitor's browser.

This is the public single-page/HTML edition, not the local full edition. The
repository root contains the local application (`server.mjs` and launchers),
which supports the broader 10,000-candidate workflow and optional local browser
rendering. The README explains how to download and run it. When that local
engine is open, the website offers a **Full analysis on this computer** mode and
uses it as a loopback-only companion. Chrome requests an explicit Local Network
Access permission before this connection; it is limited to the application on
the same computer. This provides the full local workflow without a paid remote
server.

## Deployment state

- `readabilityradar.com` is an active Cloudflare zone on the Free plan.
- The Worker is attached to the root domain and serves the production site.
- `www.readabilityradar.com` also serves the Worker; a canonical redirect to
  the root domain remains a planned configuration improvement.
- Source code and Cloudflare configuration are public in this repository.
- The Worker secret `TURNSTILE_SECRET_KEY` is configured in Cloudflare only;
  it is never placed in source code or GitHub.

## Remaining hardening work

- Evaluate a per-IP rate-limit rule for the proxy endpoint only if the
  Cloudflare dashboard confirms it has no charge for this zone.
- Evaluate Bot Fight Mode with real analyses before enabling it, because it may
  interfere with legitimate browser requests.
- Configure automated deployment from the `main` branch after review.
- Evaluate Browser Run as an optional, quota-limited enhancement for pages
  whose useful text is produced only after JavaScript rendering.

These improvements do not require a paid server. Browser Run must retain a
clear static-HTML fallback on the Free plan.
