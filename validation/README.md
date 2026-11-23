# Validation

`validation-results.xlsx` is the combined historical workbook snapshot: green
tabs are Spanish and blue tabs are English. It is useful for inspection, but
the current reproducible evidence is in the language-specific `technical`
folders and their CSV/JSON outputs.

For the scientific overview, open `validation-report.es.pdf` (Spanish) or `validation-report.en.pdf` (English). They describe the same measured evidence and limitations.

Both workbooks use the same layout:

- `README` (first worksheet): column definitions, methods, references and reproduction instructions.
- `Summary`: syllable agreement and external index comparison results.
- `Syllable Words`: 5,000 tested words with application and reference counts.
- `Index Texts`: 100 original texts and their recorded results.

Each language folder also contains `easy.html` and `difficult.html` generated
from its validation corpus. CSV exports and reproduction files are grouped in
`technical` for specialist use.

The workbooks are saved snapshots. Technical scripts refresh CSV files and the
web-report evidence, but do not automatically rebuild the workbooks. The
current Spanish comparison contains 100 paired INFLESZ values; the English
comparison contains measured Microsoft Word values. Both comparisons are
reported with their reference software and calculation fingerprints.

See `technical/README.md` for the reproduction order, the scope of each check,
and its limits. The supplied reference syllable tables are numerical
references, not expert-annotated syllable boundaries.
