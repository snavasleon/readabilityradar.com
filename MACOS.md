# Running on macOS

## Simplest option: packaged macOS app

Download the macOS edition from the project's
[latest release](https://github.com/snavasleon/readabilityradar.com/releases/latest).
Choose **Apple Silicon** for M-series Macs (M1, M2, M3, M4 and later).
For an earlier Intel Mac, use the source-code option below while the packaged
Intel edition is not published.

Extract the downloaded ZIP and open **Web Readability Radar.app**. Keep it
open while using **Full analysis on this computer** at
[readabilityradar.com](https://readabilityradar.com). The app processes the
analysis on your Mac; the public website receives neither the pages nor the
result.

The app is distributed without a paid Apple developer signature. If macOS
blocks the first launch, Control-click the app, choose **Open**, then confirm
**Open** once. Do this only after downloading the file from the official
release page and checking its published SHA-256 checksum.

## Source-code option

- Keep the entire application folder together, including `public` and `server.mjs`.
- Install a supported Node.js LTS release from https://nodejs.org/ for your Mac's architecture (Apple Silicon or Intel). The server requires Node.js 18 or newer.
- The bundled `runtime/node.exe` is Windows-only. It is not used on macOS.
- No npm packages need to be installed.

## Start

1. Open Terminal.
2. Type `cd `, drag the application folder into Terminal, and press Return.
3. Run `sh launch-mac-linux.sh`.
4. Keep Terminal open while using the app. The browser opens automatically; otherwise use the local URL printed in Terminal.
5. Press Control+C in Terminal to stop the app.

Using `sh` does not require an executable permission on the launcher. Do not double-click the Windows launcher. The app binds only to `127.0.0.1`; if the default port is occupied, it chooses an available port.

## Dynamic pages

Install Google Chrome, Microsoft Edge, or Chromium to analyze JavaScript-rendered content. Both `/Applications` and your personal `~/Applications` folder are checked. Safari can display the application, but it is not supported as its headless rendering engine.

For a browser installed elsewhere, run:

```sh
CHROME_PATH="/custom/path/Google Chrome.app/Contents/MacOS/Google Chrome" sh launch-mac-linux.sh
```

Without a compatible rendering browser, analysis can only use the initial HTML and may miss dynamically loaded text. Website access restrictions can still prevent extraction.

## Validation scripts

From the application folder, run:

```sh
node validation/spanish/technical/syllables/rerun-syllables.mjs
node validation/english/technical/syllables/rerun-syllables.mjs
```

These commands update the syllable-comparison CSV files. Close the CSV files in spreadsheet software before regenerating them.

Open `validation/validation-results.xlsx` for the formatted bilingual results and its embedded README. Green tabs are Spanish and blue tabs are English. The workbook is a saved snapshot; rerunning the technical scripts updates CSV/report data, not the saved workbook.

## Verification status

The launcher's paths, shell syntax, and platform-dependent server code have been reviewed from Windows. Native execution on Apple Silicon and Intel Macs has not been tested. On a Mac, verify startup, a local HTML upload, a dynamic website, CSV downloads, and PDF export before using it for production work.
