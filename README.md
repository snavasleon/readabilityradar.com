# Web Readability Radar

**Open-source web readability analysis for Spanish and English.**

[Open the web tool](https://readabilityradar.com) · [Download the Windows application](https://github.com/snavasleon/readabilityradar.com/releases/latest/download/Web-Readability-Radar.exe) · [Technical documentation](Web_Readability_Radar_technical_documentation.pdf) · [Cite this software](CITATION.cff) · [MIT License](LICENSE)

Web Readability Radar identifies complete text blocks on webpages and assesses their readability. Spanish analysis follows **Szigriszt-Pazos / INFLESZ**; English analysis uses **Flesch Reading Ease**. It is designed for transparent, reproducible accessibility and readability audits.

## Choose an edition

### Web edition

Use [readabilityradar.com](https://readabilityradar.com) to review **one web
page** or **one local HTML file** immediately, without installing anything.

Each completed analysis offers two printable reports:

- **Brief report:** the reviewed scope, key result, up to five priorities, and
  the limits of the result in plain language.
- **Full report:** the calculation method, validation checks, page-level
  results, all analysed fragments, traceability, and references.

Readability scores guide text review. They are not a percentage of reader
comprehension and do not certify accessibility or legal compliance.

### Full-domain analysis

Use the [Windows application](https://github.com/snavasleon/readabilityradar.com/releases/latest/download/Web-Readability-Radar.exe) for complete-domain audits: up to **10,000 candidate pages**, sitemaps, internal links, `robots.txt`, and optional local browser rendering.

The web edition calculates results in the visitor's browser. It does not store submitted URLs, page text, reports, or results. Complete-domain analysis uses the Windows application and keeps the intensive work on the visitor's computer.

## Calculation consistency and evidence

Both editions use the same browser-safe calculation core for HTML extraction,
language detection, tokenisation, syllable counts, readability scores, and
stable report identifiers. The validation evidence records a SHA-256
fingerprint of that core **and** of the exact language-specific syllable
dictionary used in each calculation. The interface marks a validation result
as out of date if that fingerprint does not match the installed edition.

The English Microsoft Word comparison is reported on the common 0–100 Flesch
Reading Ease scale. Raw, unbounded diagnostic values remain in the technical
validation files only; they are not presented as the user-facing agreement
measure.

## Use the Windows application

1. [Download Web Readability Radar for Windows](https://github.com/snavasleon/readabilityradar.com/releases/latest/download/Web-Readability-Radar.exe).
2. Open `Web-Readability-Radar.exe` and leave its small launcher window open.
3. Open [readabilityradar.com](https://readabilityradar.com) and choose **Complete domain**.
4. The browser asks once for permission to connect only to the local application on the same computer. Allow it to start the full analysis.

No Node.js installation is required. The application includes the local engine. The browser tab stays open and results appear there; the Windows application does the crawling, optional JavaScript rendering, and report generation.

Windows SmartScreen may request confirmation the first time the unsigned application is opened. Each release includes `SHA256SUMS.txt` so that the download can be verified.

## Public-service protection

The public page-retrieval endpoint is protected by Cloudflare Turnstile. Before retrieving a web page, the browser completes Cloudflare's managed human check and the Worker validates its one-time token. The validation secret is stored only as an encrypted Cloudflare Worker secret and is never committed to this repository. Turnstile reduces automated abuse; it does not create user accounts or store analysis results.

The local Windows bridge accepts requests from the public page only for public
HTTP(S) addresses. It rejects loopback, private, link-local, metadata, and
reserved network targets; checks every redirect; and pins each remote request
to a DNS-resolved public address to prevent DNS rebinding. Requests entering
through that bridge never trigger the local browser renderer. Turnstile is
loaded dynamically by the web edition only, so the local application never
contacts Cloudflare for an analysis.

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

## Verification

Run the local checks after making a processing or bridge change:

```text
npm test
```

They cover documented Spanish processing rules, parity between the web and
local editions (including URLs, decimal values, and hiatuses), and protection
of the public-web-to-local bridge.

## Included

- `public/`: browser interface and client-side analysis.
- `cloudflare/`: Cloudflare Worker and deployment configuration.
- `server.mjs`: local full-domain engine.
- `resources/`: Spanish and English syllable resources.
- `validation/`: reproducibility material and validation outputs.

## License

MIT. See [LICENSE](LICENSE).
