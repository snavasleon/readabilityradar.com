# Web Readability Radar

Open-source web readability analysis for Spanish and English.

## Choose an edition

This repository contains **two different editions**. They share the same
readability formulas and interface, but they are intended for different uses.

| Edition | Where it runs | Coverage | Best for |
| --- | --- | --- | --- |
| **Public web edition** | [readabilityradar.com](https://readabilityradar.com) | Up to 30 static-HTML pages per domain; JavaScript-rendered text may be incomplete | Free, quick public analyses without installation |
| **Local full edition** | Your own Windows, macOS or Linux computer | Up to 10,000 candidate pages; sitemaps, internal links, robots.txt and optional local browser rendering | Large, reproducible audits and JavaScript-heavy websites |

The public web edition is deliberately limited so it can run without a paid
server. It calculates results in each visitor's browser and does not store
submitted URLs, page text, reports or results. It is not a replacement for the
local full edition when a study needs broad domain coverage.

## Use full local capacity from the website

The public website can also act as the interface for the local full engine.
This keeps the website workflow while the visitor's own computer performs the
heavy work:

1. On Windows, download and open
   [Web Readability Radar for Windows](https://github.com/MagicoutFIT/lecturabilidadradar.com/releases/latest/download/Web-Readability-Radar.exe).
   It is a single portable application: Node.js does not need to be installed.
   It starts silently and leaves the existing browser tab unchanged; keep the
   application open while using the full mode.
2. Visit [readabilityradar.com](https://readabilityradar.com), accept the
   privacy notice and choose the analysis language.
3. Choose **Full analysis on this computer** instead of quick online analysis.
4. Chrome asks for permission to connect **only to the local application on
   this computer**. Grant that permission; the website then detects the local
   engine at `127.0.0.1` and sends the analysis request to it.

The local engine accepts browser requests only from `readabilityradar.com` and
`www.readabilityradar.com`. Full-mode crawling, JavaScript rendering, reports
and results remain on the visitor's computer; the public website does not
receive or store the resulting text or report.

The ZIP/source-code route below remains available for macOS, Linux and advanced
users who want to inspect, reproduce or modify the application.

## Download and run the local full edition

1. On this repository page, select **Code → Download ZIP**, then extract it.
2. Install [Node.js 18 or newer](https://nodejs.org/) if it is not already
   available.
3. On Windows, double-click `launch-windows.bat`.
4. On macOS/Linux, run `sh launch-mac-linux.sh`.

The local edition is free and runs on the user's computer. A local Chrome,
Chromium or Edge installation is optional but enables rendering for pages whose
useful content is produced with JavaScript.

## Windows application release

The Windows `.exe` is the recommended path for participants. It is built from
the same open source with:

```text
npm install
npm run build:windows
```

The resulting file is `dist/Web-Readability-Radar.exe`. It includes the Node.js
runtime but is not code-signed, so Windows may show a SmartScreen warning on a
first download. Releases publish a SHA-256 checksum so recipients can verify
the file they downloaded.

## Local quick start

On Windows:

1. Open this folder.
2. Double-click `launch-windows.bat`.
3. The browser opens the local app automatically.

On macOS or Linux:

1. Install Node.js 18 or newer if it is not already installed.
2. Run `sh launch-mac-linux.sh` from this folder.

## Included

- English default interface, with an ES/EN language selector.
- Full-domain analysis or exact-page analysis.
- Fast mode explores a random page sample (12 by default, configurable from 1 to 10,000), then selects up to 10 random eligible fragments without replacement or repeated text. Starting and required pages are always included and may expand the page sample. For a single page or local HTML, fragments are sampled from that source. Selection does not depend on difficulty; selected fragments are subsequently sorted from hardest to easiest. Complete returns all eligible fragments from detected pages, up to the 10,000-page limit. The summary and full PDF cover all eligible content on explored pages, not only the 10 displayed fragments. Sampling seeds and chosen fragment IDs are recorded in the analysis criteria.
- Spanish readability: Szigriszt-Pazos and INFLESZ.
- English readability: Flesch Reading Ease.
- CSV export for pages, sampling, and fragments.
- Source links for every detected fragment.
- Analysis can render JavaScript-heavy pages with the local browser when the initial HTML exposes little text.

## Requirement

The Windows portable package can include its own runtime in `runtime/node.exe`. If this folder is distributed without that runtime, install Node.js 18 or newer. No `npm install` step is required.

On macOS and Linux, the launcher uses the system `node` command. Dynamic-page rendering uses an installed Chrome, Chromium, or Microsoft Edge when available. If no compatible browser is installed, the app still works with the initial HTML returned by each page.

## Folder Guide

- `launch-windows.bat`: start on Windows.
- `launch-mac-linux.sh`: start on macOS or Linux; see `MACOS.md`.
- `validation/README.md`: open the single `validation-results.xlsx` workbook. Green tabs contain Spanish validation and blue tabs contain English validation; yellow INFLESZ entry cells are in `Spanish Summary`. HTML tests and technical CSV files remain in their language folders.
- `public`, `runtime`, `server.mjs`, `package.json`: application files.

## Reports and Exports

After analysis, use Download report for brief/full PDF or Excel results. The browser print dialog saves the report as PDF. Summary, Explore and Methodology are the three main areas; Explore reuses the Fragments, Pages and Sampling views. CSV downloads remain available there. README documentation is the first Excel worksheet, not a separate web button.

Spanish processing follows the supplied INFLESZ operational documentation for sentence delimiters, numeric/symbol words, recognized abbreviations and hyphenated compounds. This does not establish exact agreement with the external INFLESZ program: that comparison remains pending. English processing is separate. See `validation/technical/README.md` for conventions, ambiguous cases and reproduction commands.

## Privacy

Analysis runs on your computer. Entered URLs are requested from your computer. Dynamic pages may open a local headless browser. Results are not automatically stored on an external server. Stop the local server with Control+C.

## Public Cloudflare edition

The `cloudflare/` folder provides a no-cost public edition. Cloudflare serves
the interface and safely retrieves public HTML, while the visitor's browser
performs the readability calculation, visualisation and PDF generation. It does
not store URLs, page text or reports. The public edition explores up to 30
static-HTML pages per domain; the local edition remains the full-capacity option
for large crawls and JavaScript-rendered pages.

The current public deployment and remaining hardening tasks are recorded in
[DEPLOYMENT.md](DEPLOYMENT.md).
