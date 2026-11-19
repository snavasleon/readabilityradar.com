# Web Readability Radar

**Open-source web readability analysis for Spanish and English.**

[Open the web tool](https://readabilityradar.com) · [Download the Windows application](https://github.com/snavasleon/readabilityradar.com/releases/latest/download/Web-Readability-Radar.exe) · [Technical documentation](Web_Readability_Radar_technical_documentation.pdf) · [MIT License](LICENSE)

Web Readability Radar identifies complete text blocks on webpages and assesses their readability. Spanish analysis follows **Szigriszt-Pazos / INFLESZ**; English analysis uses **Flesch Reading Ease**. It is designed for transparent, reproducible accessibility and readability audits.

## Choose an edition

| Edition | Where it runs | Coverage | Best for |
| --- | --- | --- |
| **Web edition** | [readabilityradar.com](https://readabilityradar.com) | One web page or one local HTML file | Immediate checks without installation |
| **Windows full edition** | Your own Windows computer | Up to 10,000 candidate pages; sitemaps, internal links, robots.txt, and optional local browser rendering | Large, reproducible audits and JavaScript-heavy websites |

The web edition calculates results in the visitor's browser. It does not store submitted URLs, page text, reports, or results. Complete-domain analysis uses the Windows application and keeps the intensive work on the visitor's computer.

## Windows full edition

1. [Download Web Readability Radar for Windows](https://github.com/snavasleon/readabilityradar.com/releases/latest/download/Web-Readability-Radar.exe).
2. Open `Web-Readability-Radar.exe` and leave its small launcher window open.
3. Open [readabilityradar.com](https://readabilityradar.com) and choose **Complete domain**.
4. The browser asks once for permission to connect only to the local application on the same computer. Allow it to start the full analysis.

No Node.js installation is required. The application includes the local engine. The browser tab stays open and results appear there; the Windows application does the crawling, optional JavaScript rendering, and report generation.

Windows SmartScreen may request confirmation the first time the unsigned application is opened. Each release includes `SHA256SUMS.txt` so that the download can be verified.

## Public-service protection

The public page-retrieval endpoint is protected by Cloudflare Turnstile. Before retrieving a web page, the browser completes Cloudflare's managed human check and the Worker validates its one-time token. The validation secret is stored only as an encrypted Cloudflare Worker secret and is never committed to this repository. Turnstile reduces automated abuse; it does not create user accounts or store analysis results.

## Run from source

For inspection or development, install Node.js 18 or later, then run:

```text
npm install
npm start
```

For a portable Windows build:

```text
npm run build:windows
```

The resulting file is `dist/Web-Readability-Radar.exe`.

## Included

- `public/`: browser interface and client-side analysis.
- `cloudflare/`: Cloudflare Worker and deployment configuration.
- `server.mjs`: local full-domain engine.
- `resources/`: Spanish and English syllable resources.
- `validation/`: reproducibility material and validation outputs.

## License

MIT. See [LICENSE](LICENSE).
