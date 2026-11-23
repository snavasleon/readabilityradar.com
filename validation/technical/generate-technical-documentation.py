"""Build the current technical documentation PDF from repository metadata."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
VERSION = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
SERVER_SHA = hashlib.sha256((ROOT / "server.mjs").read_bytes()).hexdigest()
INDEX_EVIDENCE = json.loads((ROOT / "public" / "index-validation.json").read_text(encoding="utf-8"))
SPANISH = INDEX_EVIDENCE["spanish"]
ENGLISH = INDEX_EVIDENCE


def paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text, style)


def bullet(text: str, styles) -> ListItem:
    return ListItem(paragraph(text, styles["Body"]), leftIndent=12)


def heading(text: str, styles, level: int = 2):
    return [Spacer(1, 0.28 * cm), paragraph(text, styles[f"H{level}"]), Spacer(1, 0.10 * cm)]


def table(rows, widths, styles, header=True):
    converted = []
    for row_index, row in enumerate(rows):
        converted.append([paragraph(str(cell), styles["TableHeader"] if header and row_index == 0 else styles["TableCell"]) for cell in row])
    result = Table(converted, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    result.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0b4f6c")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#b8c7ce")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f4f8f9")]),
    ]))
    return result


def footer(canvas, document):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#b8c7ce"))
    canvas.line(2 * cm, 1.55 * cm, A4[0] - 2 * cm, 1.55 * cm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#49616c"))
    canvas.drawString(2 * cm, 1.05 * cm, f"Web Readability Radar - Technical documentation - v{VERSION}")
    canvas.drawRightString(A4[0] - 2 * cm, 1.05 * cm, f"Page {document.page}")
    canvas.restoreState()


def build(output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    document = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=1.7 * cm,
        bottomMargin=2.05 * cm,
        title="Web Readability Radar - Technical documentation",
        author="Sergio Navas-León and Jon Andoni Duñabeitia",
        subject="Current architecture, limits, privacy, security and validation evidence",
    )
    base = getSampleStyleSheet()
    styles = {
        "Title": ParagraphStyle("Title", parent=base["Title"], fontName="Helvetica-Bold", fontSize=24, leading=29, textColor=colors.HexColor("#0b3040"), spaceAfter=5),
        "Subtitle": ParagraphStyle("Subtitle", parent=base["Normal"], fontName="Helvetica", fontSize=10.5, leading=15, textColor=colors.HexColor("#49616c"), spaceAfter=14),
        "H1": ParagraphStyle("H1", parent=base["Heading1"], fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=colors.HexColor("#0b4f6c"), spaceBefore=8, spaceAfter=5),
        "H2": ParagraphStyle("H2", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=colors.HexColor("#0b4f6c"), spaceBefore=6, spaceAfter=4),
        "Body": ParagraphStyle("Body", parent=base["BodyText"], fontName="Helvetica", fontSize=9.4, leading=13.2, textColor=colors.HexColor("#172c35"), spaceAfter=6),
        "Small": ParagraphStyle("Small", parent=base["BodyText"], fontName="Helvetica", fontSize=8.3, leading=11, textColor=colors.HexColor("#304952"), spaceAfter=4),
        "TableHeader": ParagraphStyle("TableHeader", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=8.2, leading=10, textColor=colors.white),
        "TableCell": ParagraphStyle("TableCell", parent=base["BodyText"], fontName="Helvetica", fontSize=8.1, leading=10.2, textColor=colors.HexColor("#172c35")),
        "Callout": ParagraphStyle("Callout", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=9.7, leading=13.5, textColor=colors.HexColor("#0b3040"), backColor=colors.HexColor("#e8f4f5"), borderColor=colors.HexColor("#7aafb8"), borderWidth=0.6, borderPadding=9, spaceBefore=4, spaceAfter=11),
        "Code": ParagraphStyle("Code", parent=base["BodyText"], fontName="Courier", fontSize=8.1, leading=11.2, backColor=colors.HexColor("#f1f5f6"), borderColor=colors.HexColor("#d0dce0"), borderWidth=0.4, borderPadding=7, spaceAfter=8),
    }

    story = []
    story.append(paragraph("Web Readability Radar", styles["Title"]))
    story.append(paragraph("Technical documentation for the public web edition and the local Windows edition", styles["Subtitle"]))
    story.append(paragraph(
        f"Version {VERSION} - generated 23 November 2026 - current local server SHA-256: {SERVER_SHA[:16]}...",
        styles["Small"],
    ))
    story.append(Spacer(1, 0.25 * cm))
    story.append(paragraph(
        "<b>Purpose.</b> Web Readability Radar estimates the linguistic readability of Spanish and English web content. It extracts complete text paragraphs, calculates a page-level score and paragraph-level scores, and produces traceable reports. It supports text review; it does not rewrite content, certify legal compliance, or measure an individual reader's comprehension.",
        styles["Callout"],
    ))

    story.extend(heading("1. Editions and scope", styles, 1))
    story.append(table([
        ["Edition", "Where work runs", "What it analyzes", "Main limit"],
        ["Public web edition", "Visitor's browser; Cloudflare retrieves HTML through a guarded proxy", "One exact public web page or one uploaded HTML file", "No domain crawl and no JavaScript rendering"],
        ["Local Windows edition", "Visitor's computer through the packaged local engine", "Exact URLs, uploaded HTML, or a complete domain", "Full-domain work depends on the visitor's computer and network"],
    ], [3.15 * cm, 4.3 * cm, 4.2 * cm, 4.25 * cm], styles))
    story.append(paragraph(
        "The public page has no paid application server. Browser-side calculations and report generation stay on the visitor's device. The public Worker is limited to serving assets, providing syllable dictionaries, and temporarily retrieving one public HTML page after a security check.",
        styles["Body"],
    ))
    story.append(paragraph(
        "The published local application is currently for Windows. The source can be inspected and run with Node.js 18 or later, but no supported macOS or Linux packaged download is distributed in this release.",
        styles["Body"],
    ))

    story.extend(heading("2. Shared calculation", styles, 1))
    story.append(paragraph(
        "Both editions use <font name='Courier'>public/core/readability-core.mjs</font>. This browser-safe module performs HTML extraction, language detection, tokenization, syllable counting, readability scoring, difficulty categories, content fingerprints, and stable SHA-256 page and fragment identifiers. The local server and the online analyzer do not maintain separate implementations of those rules.", styles["Body"]))
    story.append(table([
        ["Language", "Formula", "Categories used in the interface"],
        ["Spanish", "Szigriszt-Pazos / INFLESZ: 206.835 - 62.3 x (syllables / words) - (words / sentences)", "Very difficult, somewhat difficult, normal, fairly easy, very easy"],
        ["English", "Flesch Reading Ease: 206.835 - 1.015 x (words / sentences) - 84.6 x (syllables / words)", "Difficult/very difficult, fairly difficult, plain English, fairly easy, easy/very easy"],
    ], [2.2 * cm, 8.0 * cm, 5.7 * cm], styles))
    story.append(paragraph(
        "A page score uses all eligible visible text from that page. A fragment is one complete eligible HTML paragraph, never a sentence fragment created only to fit a display. Navigation, footers, forms and similar interface regions are excluded. Repeated text within the same URL is not duplicated in the fragment list.",
        styles["Body"],
    ))

    story.extend(heading("3. Current architecture", styles, 1))
    story.append(table([
        ["Component", "Relevant files", "Responsibility"],
        ["Web interface", "public/index.html, public/app.js, public/styles.css", "Input, results, exports, browser-side reports, local-engine detection"],
        ["Shared core", "public/core/readability-core.mjs", "Extraction, tokenization, metrics, identifiers"],
        ["Online analyzer", "public/online-analyzer.js", "One-page or uploaded-HTML browser computation"],
        ["Cloudflare Worker", "cloudflare/src/worker.js", "Static assets, public HTML proxy, Turnstile verification, dictionary endpoint"],
        ["Local engine", "server.mjs", "Domain discovery, retrieval, optional rendering, queue, local API and static assets"],
        ["Language resources", "resources/*.json", "Spanish and English syllable dictionaries"],
    ], [3.1 * cm, 5.2 * cm, 7.6 * cm], styles))
    story.append(KeepTogether([
        paragraph("Local API", styles["H2"]),
        table([
            ["Path", "Method", "Purpose"],
            ["/api/bridge-status", "GET", "Detects a local engine from the public web page"],
            ["/api/dictionary", "GET", "Provides the language-specific syllable dictionary"],
            ["/api/analyze", "POST", "Runs a local analysis or creates a background job"],
            ["/api/analyze-status", "GET", "Returns job progress and the completed result"],
            ["/demo/es and /demo/en", "GET", "Static parity-test pages shared by both editions"],
        ], [4.2 * cm, 2.0 * cm, 9.7 * cm], styles),
    ]))

    story.extend(heading("4. Processing limits", styles, 1))
    story.append(table([
        ["Context", "Limit or behavior"],
        ["Public web page", "One exact URL. The browser analyzes returned static HTML. Multiple entered URLs are rejected explicitly rather than silently ignored."],
        ["Uploaded HTML", "One file, processed in the browser. Scripts are not executed. Maximum size: 6,000,000 characters."],
        ["Local complete domain", "Up to 10,000 candidate pages, up to 50 sitemaps, internal links and optional local browser rendering. All eligible discovered URLs are selected; there is no user-facing quick sample."],
        ["Local exact URL or HTML", "No inherited 30-second multi-page deadline. Each HTTP retrieval has a 12-second limit; an exact local page receives a separate 40-second analysis window that may include rendering."],
        ["Local concurrency", "Up to 8 pages can be processed in parallel. Large complete-domain audits can take minutes or hours."],
    ], [4.4 * cm, 11.5 * cm], styles))
    story.append(paragraph(
        "The public web edition cannot give the same coverage as a local complete-domain audit because it intentionally avoids a paid server and does not crawl a whole site from Cloudflare. The Windows application is the path for sitemaps, internal links, dynamic content and large audits.", styles["Body"]))

    story.append(PageBreak())
    story.extend(heading("5. Privacy and security", styles, 1))
    story.append(paragraph("<b>Data handling.</b> The public web edition calculates scores, charts and reports in the browser. For a web-page request, its URL is sent to the Cloudflare Worker, which retrieves HTML temporarily and returns it to the browser. No database of URLs, text or results is used. Uploaded HTML stays in the browser. The local edition keeps inputs and results in memory on the visitor's computer until the result is delivered or the user closes or replaces the session.", styles["Body"]))
    story.append(table([
        ["Control", "Current implementation"],
        ["Human verification", "Cloudflare Turnstile is loaded dynamically only in the public web edition. The private validation secret is a Cloudflare Worker secret and is not stored in the repository."],
        ["Public proxy", "Accepts public HTTP(S) addresses only; rejects credentials, loopback/private/link-local and reserved destinations, blocked ports, excessive HTML, and excessive redirects."],
        ["Local bridge", "Accepts public-page requests only from the two production origins. It rechecks redirects, resolves targets before use, pins requests to approved public addresses, and disables local-browser rendering for bridge requests."],
        ["Transport", "The Worker redirects HTTP to HTTPS and redirects www.readabilityradar.com permanently to readabilityradar.com."],
        ["No analytics database", "The application does not create accounts, tracking profiles or a results database."],
    ], [4.1 * cm, 11.8 * cm], styles))
    story.append(paragraph("These controls reduce abuse and private-network request risks. They do not turn the tool into a general web-security scanner and they do not replace the data-protection obligations of an organization that deploys it.", styles["Body"]))

    story.extend(heading("6. Validation and reproducibility", styles, 1))
    story.append(paragraph(
        "The validation material is stored in <font name='Courier'>validation/</font>. Every report snapshot includes a SHA-256 fingerprint of the shared calculation source together with the exact language-specific syllable dictionary. The interface treats a validation snapshot as out of date when that processing fingerprint does not match the code used for the result.",
        styles["Body"],
    ))
    english_all = next(row for row in ENGLISH["groups"] if row["group"] == "all")
    story.append(table([
        ["Evidence", "Current recorded result", "Interpretation"],
        ["Spanish paired comparison", f"{SPANISH['texts_compared']} texts; mean absolute difference {SPANISH['mean_absolute_difference']:.2f}; Lin concordance {SPANISH['lins_concordance_correlation']:.3f}", "Radar versus recorded INFLESZ values"],
        ["English bounded comparison", f"{english_all['texts_compared']} texts; bounded mean absolute difference {english_all['bounded_mean_absolute_difference']:.2f}; bounded Lin concordance {english_all['bounded_lins_concordance_correlation']:.3f}", "Radar versus Microsoft Word Flesch values on the common 0-100 scale"],
        ["Edition parity", "Spanish and English corpora, public demo pages, synthetic URL/decimal/hiatus cases", "Local and browser core must return identical processing results"],
        ["Bridge security", "Local server integration check", "Confirms no static Turnstile in the local page and rejects public-web access to private destinations"],
    ], [4.2 * cm, 6.2 * cm, 5.5 * cm], styles))
    story.append(paragraph("Run <font name='Courier'>npm test</font> after a processing or bridge change. The full regeneration order, evidence locations and known methodological decisions are documented in <font name='Courier'>validation/technical/README.md</font>.", styles["Body"]))

    story.extend(heading("7. Known methodological boundaries", styles, 1))
    story.append(ListFlowable([
        bullet("Readability scores are prioritization signals. They are not a percentage of comprehension, an accessibility certificate, or a legal determination.", styles),
        bullet("The web edition uses the HTML returned by the selected page. If meaningful text appears only after JavaScript execution, use the local Windows edition with optional browser rendering.", styles),
        bullet("The exact rules for Spanish opening punctuation, time expressions with a colon, and abbreviations or ordinals are documented implementation conventions. Changes require an author decision and a new validation run.", styles),
        bullet("External pages may fail because of network errors, access restrictions, non-HTML content, robots rules in a full-domain crawl, language mismatch, or the technical size and time limits. The report records these outcomes rather than treating them as analyzed pages.", styles),
    ], bulletType="bullet", leftIndent=14, bulletFontName="Helvetica", bulletFontSize=8))

    story.extend(heading("8. Citation and release practice", styles, 1))
    story.append(paragraph(f"The repository includes <font name='Courier'>CITATION.cff</font>, <font name='Courier'>CITATION.md</font>, and <font name='Courier'>.zenodo.json</font>. The intended cited release is v{VERSION}. A Zenodo DOI can be created by enabling the repository in the project owners' Zenodo account and publishing the v{VERSION} Git tag; it cannot be created from source code alone.", styles["Body"]))
    story.append(paragraph(f"Suggested software citation: Navas-León, S., &amp; Duñabeitia, J. A. (2026). <i>Web Readability Radar</i> (Version {VERSION}) [Computer software]. GitHub. https://github.com/snavasleon/readabilityradar.com", styles["Body"]))

    story.extend(heading("References", styles, 1))
    for reference in [
        "Flesch, R. (1948). A new readability yardstick. <i>Journal of Applied Psychology, 32</i>(3), 221-233.",
        "Szigriszt-Pazos, F. (1993). <i>Sistemas predictivos de legibilidad del mensaje escrito: fórmula de perspicuidad</i> (Doctoral dissertation, Universidad Complutense de Madrid).",
        "Barrio-Cantalejo, I. M., et al. (2008). Validation of the INFLESZ scale to evaluate readability of texts aimed at the patient. <i>Anales del Sistema Sanitario de Navarra, 31</i>(2), 135-152.",
        "W3C. Web Content Accessibility Guidelines (WCAG) 2.2. https://www.w3.org/TR/WCAG22/",
        "European Standard EN 301 549. Accessibility requirements for ICT products and services.",
    ]:
        story.append(paragraph(reference, styles["Small"]))

    document.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "Web_Readability_Radar_technical_documentation.pdf"
    build(target)
    print(target)
