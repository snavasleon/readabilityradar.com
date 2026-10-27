# Public deployment status

**Production URL:** https://readabilityradar.com

## Current architecture

The public edition is designed to run without a paid application server:

1. Cloudflare serves the interface, TLS certificate and guarded HTML proxy.
2. The visitor's browser calculates readability, produces charts and generates
   the report/PDF locally.
3. The Worker retrieves only public HTTP(S) HTML. It blocks local/private
   destinations, credentials and sensitive ports, limits response size and
   follows a bounded number of redirects.
4. The public domain explores up to 30 static-HTML pages per run. The local
   edition remains the full-capacity option for large crawls and local browser
   rendering of JavaScript-heavy pages.

No database stores submitted URLs, fetched text, results or reports. Local HTML
uploads remain in the visitor's browser.

## Deployment state

- `readabilityradar.com` is an active Cloudflare zone on the Free plan.
- The Worker is attached to the root domain and serves the production site.
- `www.readabilityradar.com` also serves the Worker; a canonical redirect to
  the root domain remains a planned configuration improvement.
- Source code and Cloudflare configuration are public in this repository.

## Remaining hardening work

- Add Cloudflare Turnstile before an online analysis starts.
- Add a per-IP rate-limit rule for the proxy endpoint.
- Configure automated deployment from the `main` branch after review.
- Evaluate Browser Run as an optional, quota-limited enhancement for pages
  whose useful text is produced only after JavaScript rendering.

These improvements do not require a paid server. Browser Run must retain a
clear static-HTML fallback on the Free plan.
