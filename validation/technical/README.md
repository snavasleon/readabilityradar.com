# Technical validation materials

This folder contains reproducible checks for the shared processing core used by
the web edition and the local Windows edition. It does not replace independent
validation of the underlying readability formula.

## What each check establishes

- `test-processing.mjs` checks documented Spanish tokenisation, sentence and
  syllable conventions, category boundaries, paragraph integrity, the HTML size
  boundary, and score-independent fragment sampling.
- `test-edition-parity.mjs` compares the local and browser-safe core on Spanish
  and English easy/difficult corpora, the public demo pages, and synthetic
  decimal, URL, navigation/footer and hiatus cases. It also checks that the
  web edition rejects a hidden multi-URL request instead of silently truncating
  it.
- `test-local-bridge-security.mjs` starts the local engine and checks the
  loopback bridge, static demo routes, public-web restrictions, current
  processing fingerprints and the absence of the old 30-second multi-page
  deadline for one exact page or local HTML file.
- `load-core.mjs` loads the same browser-safe core and exact syllable
  dictionaries used by both editions. Its fingerprints identify the server
  source, core source and language-specific calculation material.

## Validation evidence

- `../spanish/technical/index-comparison/` contains 100 paired Spanish Radar
  and INFLESZ values.
- `../english/technical/index-comparison/` contains 100 paired English Radar
  and Microsoft Word Flesch Reading Ease values. User-facing agreement values
  use the common bounded 0-100 scale; raw diagnostic values remain in the
  technical files.
- `../spanish/technical/syllables/` and
  `../english/technical/syllables/` contain word-level syllable comparisons.
- `../../public/index-validation.json` and
  `../../public/syllable-validation.json` are the versioned report snapshots.
  They are valid only when their `processing_sha256` matches the shared core
  and language dictionary in the edition that produced the report.

## Reproduction order

Run these commands from the repository root after a change to processing code,
a syllable dictionary, or `server.mjs`:

```text
node validation/technical/test-processing.mjs
node validation/spanish/technical/index-comparison/calculate-radar.mjs
node validation/spanish/technical/syllables/rerun-syllables.mjs
node validation/english/technical/index-comparison/calculate-radar.mjs
python validation/english/technical/index-comparison/summarize.py
node validation/english/technical/syllables/rerun-syllables.mjs
node validation/technical/test-edition-parity.mjs
node validation/technical/test-local-bridge-security.mjs
```

The English summary script relies on the checked-in Microsoft Word comparison
data; it does not automate Microsoft Word. Regenerate the Word measurements in
Word before rerunning it if the English corpus changes.

## Limits

The tokenisation conventions for opening punctuation, time expressions with a
colon, and abbreviations or ordinals are explicit implementation decisions.
Changing them requires an author decision and a fresh validation run before
new evidence can be attributed to the project.
