"use strict";
/**
 * guide2025.group.js
 * ────────────────────────────────────────────────────────────────
 * Extracts pages 40-45 of guide2025.pdf, groups split lines into
 * logical raw records. No normalization. No DB.
 *
 * Run: node scripts/extraction/guide2025.group.js
 */
const fs       = require("fs");
const path     = require("path");
const pdfParse = require("pdf-parse");

const PDF_PATH    = path.resolve(__dirname, "../../data/raw/guide2025.pdf");
const OUT_DIR     = path.resolve(__dirname, "../../data/extracted/2025");
const REVIEW_DIR  = path.resolve(__dirname, "../../data/review");
const OUT_SAMPLE  = path.join(OUT_DIR,    "guide2025.grouped.sample.json");
const OUT_REVIEW  = path.join(REVIEW_DIR, "guide2025.grouped.review.json");

const START_PAGE = 40;
const END_PAGE   = 45;

// ── Classifiers (no normalization — raw detection only) ──────────────────────
const CODE_RE    = /^\s*([0-9]{5})\s*$/;                          // 5-digit orientation code alone
const SCORE_RE   = /^\s*(\d{1,3}[,\.]\d{3})\s*$/;               // decimal-comma score e.g. 97,875
const FORMULA_RE = /\b(FG\s*\+?\s*[A-Z]?|FG)\b/;                // formula token e.g. "FG+ A"
const BAC_TYPES  = [
  "رياضيات", "علوم تجريبية", "اقتصاد وتصرف", "علوم الإعلامية",
  "آداب", "تقنية", "علوم الرياضة", "علوم الإعلام"
];
const BAC_RE     = new RegExp(BAC_TYPES.join("|"));
const SECTION_RE = /الآداب|العلوم|الاقتصاد|التكنولوجيا|الإعلام|التحضيري/; // BAC section header
const SKIP_RE    = /^(www\.|https?:\/\/|\d{1,3}$|={3,}|-{3,})/;  // page noise

// ── Extract lines from page range ─────────────────────────────────────────────
async function extractLines(buffer, start, end) {
  const lines = [];
  await pdfParse(buffer, {
    max: end,
    pagerender(pageData) {
      return pageData.getTextContent().then(tc => {
        const pageNum = pageData.pageIndex + 1;
        if (pageNum < start) return "";
        const byY = {};
        for (const item of tc.items) {
          const y = Math.round(item.transform[5]);
          if (!byY[y]) byY[y] = [];
          byY[y].push(item.str);
        }
        Object.keys(byY).map(Number).sort((a,b) => b-a).forEach(y => {
          const line = byY[y].join(" ").trim();
          if (line.length > 1) lines.push({ pageNum, text: line });
        });
        return "";
      });
    }
  });
  return lines;
}

// ── Classify a single line ────────────────────────────────────────────────────
function classifyLine(text) {
  if (SKIP_RE.test(text))           return "SKIP";
  if (CODE_RE.test(text))           return "CODE";
  if (SCORE_RE.test(text))          return "SCORE";
  if (FORMULA_RE.test(text))        return "FORMULA";
  if (BAC_RE.test(text))            return "BAC_TYPE";
  if (SECTION_RE.test(text) && text.length < 60) return "SECTION_HEADER";
  return "TEXT";  // institution or specialty text
}

// ── Group lines into logical records ─────────────────────────────────────────
// Strategy:
//   A new record begins on a CODE line.
//   Within a record, accumulate lines until the next CODE.
//   Assign fields by classification order.
function groupLines(lines) {
  const confident = [];
  const review    = [];
  let currentSection = null;
  let pending = [];   // lines belonging to current record-in-progress

  function flush() {
    if (!pending.length) return;
    const record = buildRecord(pending, currentSection);
    if (record.confidence === "HIGH") confident.push(record);
    else                               review.push(record);
    pending = [];
  }

  for (const { pageNum, text } of lines) {
    const cls = classifyLine(text);

    if (cls === "SKIP") continue;

    if (cls === "SECTION_HEADER") {
      flush();
      currentSection = text.trim();
      continue;
    }

    if (cls === "CODE") {
      flush();   // finish previous record
      pending.push({ cls, text, pageNum });
    } else {
      pending.push({ cls, text, pageNum });
    }
  }
  flush();   // final record

  return { confident, review };
}

// ── Build one record from accumulated lines ───────────────────────────────────
function buildRecord(lines, section) {
  const sourceLines = lines.map(l => l.text);
  const pages       = [...new Set(lines.map(l => l.pageNum))];
  const sourcePageRange = pages.length === 1
    ? String(pages[0])
    : pages[0] + "-" + pages[pages.length - 1];

  let codeOrientationCandidate  = null;
  let formuleBruteCandidate     = null;
  let sectionBacCandidate       = section;
  let scoreReferenceCandidate   = null;
  let institutionTextCandidate  = null;
  let specialiteTextCandidate   = null;
  const reasons = [];

  for (const { cls, text } of lines) {
    switch (cls) {
      case "CODE":
        if (!codeOrientationCandidate) codeOrientationCandidate = text.trim();
        else reasons.push("extra CODE line: " + text.trim());
        break;
      case "SCORE":
        if (!scoreReferenceCandidate) scoreReferenceCandidate = text.trim();
        else reasons.push("multiple SCORE lines");
        break;
      case "FORMULA":
        if (!formuleBruteCandidate) formuleBruteCandidate = text.trim();
        else reasons.push("multiple FORMULA lines");
        break;
      case "BAC_TYPE":
        if (!sectionBacCandidate || sectionBacCandidate === section) sectionBacCandidate = text.trim();
        break;
      case "TEXT":
        // First TEXT = institution, second = specialty (heuristic)
        if (!institutionTextCandidate)      institutionTextCandidate  = text.trim();
        else if (!specialiteTextCandidate)  specialiteTextCandidate   = text.trim();
        else reasons.push("extra TEXT line (possible multi-line): " + text.trim().slice(0, 40));
        break;
    }
  }

  // Confidence rules
  const hasCode  = !!codeOrientationCandidate;
  const hasScore = !!scoreReferenceCandidate;
  const hasInst  = !!institutionTextCandidate;
  let confidence, reviewReason;

  if (hasCode && hasScore && hasInst) {
    confidence = "HIGH";
  } else if (hasCode || hasScore) {
    confidence = "MEDIUM";
    reviewReason = "missing: " + [
      !hasCode  ? "code"        : null,
      !hasScore ? "score"       : null,
      !hasInst  ? "institution" : null,
    ].filter(Boolean).join(", ");
  } else {
    confidence = "LOW";
    reviewReason = "no code and no score — possible stray lines";
  }

  if (reasons.length) reviewReason = (reviewReason ? reviewReason + "; " : "") + reasons.join("; ");

  const rec = {
    sourcePageRange,
    sourceLines,
    codeOrientationCandidate:  codeOrientationCandidate  ?? null,
    formuleBruteCandidate:     formuleBruteCandidate      ?? null,
    sectionBacCandidate:       sectionBacCandidate        ?? null,
    scoreReferenceCandidate:   scoreReferenceCandidate    ?? null,
    institutionTextCandidate:  institutionTextCandidate   ?? null,
    specialiteTextCandidate:   specialiteTextCandidate    ?? null,
    confidence,
  };
  if (reviewReason) rec.reviewReason = reviewReason;
  return rec;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(OUT_DIR,    { recursive: true });
  fs.mkdirSync(REVIEW_DIR, { recursive: true });

  const buffer = fs.readFileSync(PDF_PATH);
  const lines  = await extractLines(buffer, START_PAGE, END_PAGE);

  console.log(`Extracted ${lines.length} lines from pages ${START_PAGE}-${END_PAGE}`);

  const { confident, review } = groupLines(lines);

  fs.writeFileSync(OUT_SAMPLE, JSON.stringify(confident, null, 2), "utf-8");
  fs.writeFileSync(OUT_REVIEW, JSON.stringify(review,    null, 2), "utf-8");

  console.log(`✅ Confident records : ${confident.length}  →  ${OUT_SAMPLE}`);
  console.log(`⚠️  Review records   : ${review.length}    →  ${OUT_REVIEW}`);

  // Print first 10 confident records to stdout
  console.log("\n=== SAMPLE (first 10 confident records) ===\n");
  confident.slice(0, 10).forEach((r, i) => {
    console.log(`[${i+1}] code=${r.codeOrientationCandidate} | score=${r.scoreReferenceCandidate} | formula=${r.formuleBruteCandidate} | bac=${r.sectionBacCandidate}`);
    console.log(`     inst="${r.institutionTextCandidate?.slice(0,50)}"`);
    console.log(`     spec="${r.specialiteTextCandidate?.slice(0,50)}"`);
    console.log(`     src=[${r.sourceLines.length} lines, p.${r.sourcePageRange}]`);
    console.log();
  });
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
