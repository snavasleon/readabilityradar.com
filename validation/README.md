# Validation

Open `validation-results.xlsx` in this folder. It contains Spanish and English validation in one workbook: green tabs are Spanish and blue tabs are English. Enter INFLESZ scores only in the yellow cells of `Spanish Summary`.

For the scientific overview, open `validation-report.es.pdf` (Spanish) or `validation-report.en.pdf` (English). They describe the same measured evidence and limitations.

Both workbooks use the same layout:

- `README` (first worksheet): column definitions, methods, references and reproduction instructions.
- `Summary`: syllable agreement and external index comparison results.
- `Syllable Words`: 5,000 tested words with application and reference counts.
- `Index Texts`: 100 original texts and their recorded results.

Each language folder also contains `easy.html` and `difficult.html` for local analysis. CSV exports and reproduction files are grouped in `technical` for specialist use.

The workbooks are saved results snapshots. Technical scripts refresh CSV files and report data, but do not automatically rebuild the workbooks. Spanish external INFLESZ results remain blank; the English comparison contains measured Microsoft Word results.

Shared processing tests, the audit record and sensitivity analyses are documented in `technical/README.md`. Their results are not substitutes for an external INFLESZ comparison. The supplied reference syllable tables are numerical references, not expert-annotated syllable boundaries.
