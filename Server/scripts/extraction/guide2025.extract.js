/**
 * guide2025.extract.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Extracts raw rows from guide2025.pdf (sample: first 30 pages).
 * Uses pdf-parse for text extraction only. No universal parser.
 * Each row preserves _rawText for traceability.
 *
 * Run: node scripts/extraction/guide2025.extract.js
 *
 * Output: data/extracted/2025/guide2025.sample.rows.json
 */

"use strict";
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

// ─── Config ───────────────────────────────────────────────────────────────────
const PDF_PATH  = path.resolve(__dirname, "../../data/raw/guide2025.pdf");
const OUT_DIR   = path.resolve(__dirname, "../../data/extracted/2025");
const OUT_FILE  = path.join(OUT_DIR, "guide2025.sample.rows.json");
const DIAG_FILE = path.join(OUT_DIR, "guide2025.sample.pages.txt");
const MAX_PAGES = 30;   // sample only — increase after validation
const SOURCE    = "guide2025.pdf";

// ─── BAC section header patterns ─────────────────────────────────────────────
// The guide groups rows by bac section with a distinct header line
const BAC_SECTION_HEADERS = [
  { pattern: /math[ée]matiques?/i,           label: "Math" },
  { pattern: /sciences\s+exp[ée]rimentales?/i, label: "Sciences Exp" },
  { pattern: /sciences\s+de\s+l.informatique/i, label: "Sciences Info" },
  { pattern: /sciences\s+techniques?/i,       label: "Technique" },
  { pattern: /lettres?/i,                     label: "Lettres" },
  { pattern: /[ée]conomie|gestion/i,           label: "Économie" },
  { pattern: /sport|[ée]ducation\s+physique/i, label: "Sport" },
];

// ─── Row detection ────────────────────────────────────────────────────────────
// A data row in the guide typically starts with:
//   - a 4-digit code orientation, OR
//   - directly a numeric "capacité" after institution + program fields
//
// Pattern: (optional code) | institution | program | formula | capacity | score2024
//
// We detect potential data lines by these signals:
//   1. Line contains a 4-5 digit number that could be codeOrientation
//   2. Line contains a score-like float (e.g. 12.34)
//   3. Line is NOT a section header or page header

const CODE_ORIENTATION_RE = /\b(\d{4,5})\b/;
const SCORE_FLOAT_RE       = /\b(\d{1,2}[.,]\d{2,3})\b/;
const CAPACITY_RE          = /\b([1-9]\d{1,3})\b/;  // 10-9999, avoids matching years/codes
const FORMULA_SIGNALS      = ["M ", "Ph ", "Fr ", "SVT", "ST ", "Ang", "Inf", "Hi"];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const buffer = fs.readFileSync(PDF_PATH);

  const allPageTexts = [];
  let pageIndex = 0;

  // pdf-parse with per-page callback
  await pdfParse(buffer, {
    max: MAX_PAGES,
    pagerender(pageData) {
      pageIndex++;
      return pageData.getTextContent({ normalizeWhitespace: true }).then((tc) => {
        // Collect items in reading order
        const items = tc.items;
        // Group items by approximate Y position (same line = within 2px)
        const lines = [];
        let currentY = null;
        let currentLine = [];
        for (const item of items) {
          const y = Math.round(item.transform[5]);
          if (currentY === null) currentY = y;
          if (Math.abs(y - currentY) > 2) {
            if (currentLine.length) lines.push(currentLine.map(i => i.str).join(" ").trim());
            currentLine = [item];
            currentY = y;
          } else {
            currentLine.push(item);
          }
        }
        if (currentLine.length) lines.push(currentLine.map(i => i.str).join(" ").trim());

        allPageTexts.push({ pageNum: pageIndex, lines: lines.filter(l => l.length > 1) });
        return "";
      });
    },
  });

  // ── Write diagnostic page dump ──────────────────────────────────────────────
  let diagOut = "";
  for (const p of allPageTexts) {
    diagOut += `\n${"=".repeat(70)}\nPAGE ${p.pageNum}\n${"=".repeat(70)}\n`;
    p.lines.forEach((l, i) => { diagOut += `  [${String(i).padStart(3)}] ${l}\n`; });
  }
  fs.writeFileSync(DIAG_FILE, diagOut, "utf-8");
  console.log(`📄 Diagnostic dump → ${DIAG_FILE}`);

  // ── Extract rows ────────────────────────────────────────────────────────────
  const rows = [];
  let currentBacSection = null;
  let pendingLines = [];  // buffer for multi-line row assembly

  function flushPending(pageNum) {
    if (!pendingLines.length) return;
    const combinedRaw = pendingLines.join(" | ");
    const row = buildRow(combinedRaw, pageNum, currentBacSection);
    if (row) rows.push(row);
    pendingLines = [];
  }

  for (const { pageNum, lines } of allPageTexts) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect bac section header
      const sectionMatch = BAC_SECTION_HEADERS.find(s => s.pattern.test(trimmed));
      if (sectionMatch && trimmed.length < 80) {
        flushPending(pageNum);
        currentBacSection = sectionMatch.label;
        continue;
      }

      // Skip obvious non-data lines
      if (isSkippableLine(trimmed)) {
        flushPending(pageNum);
        continue;
      }

      // Check if this line starts a new data row (has code orientation or score)
      const startsNewRow = CODE_ORIENTATION_RE.test(trimmed) || SCORE_FLOAT_RE.test(trimmed);
      if (startsNewRow && pendingLines.length > 0) {
        flushPending(pageNum);
      }

      pendingLines.push(trimmed);
    }
    flushPending(pageNum); // flush at page boundary
  }

  // ── Write extracted rows ────────────────────────────────────────────────────
  fs.writeFileSync(OUT_FILE, JSON.stringify(rows, null, 2), "utf-8");
  console.log(`✅ Extracted ${rows.length} raw rows → ${OUT_FILE}`);
  console.log(`   Sample pages: 1–${MAX_PAGES}`);
  console.log(`   Bac sections detected: ${[...new Set(rows.map(r => r.bacSectionDetected).filter(Boolean))].join(", ") || "none yet — check diagnostic"}`);
}

// ─── Row builder ──────────────────────────────────────────────────────────────
function buildRow(rawText, pageNum, bacSection) {
  // Must contain at least some signal to be a data row
  const hasCode  = CODE_ORIENTATION_RE.exec(rawText);
  const hasScore = SCORE_FLOAT_RE.exec(rawText);
  const hasCap   = CAPACITY_RE.exec(rawText);
  const hasFormula = FORMULA_SIGNALS.some(s => rawText.includes(s));

  // Skip lines with none of these signals
  if (!hasCode && !hasScore && !hasCap && !hasFormula) return null;
  if (rawText.length < 10) return null;

  return {
    // Raw preservation (source of truth)
    _rawText:           rawText,
    _sourceFile:        SOURCE,
    _pageNum:           pageNum,

    // Extracted signals (not yet normalized)
    bacSectionDetected: bacSection,
    codeOrientationRaw: hasCode ? hasCode[1] : null,
    scoreRefRaw:        hasScore ? hasScore[1] : null,
    capaciteRaw:        hasCap && !isYear(hasCap[1]) ? hasCap[1] : null,
    hasFormula:         hasFormula,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isYear(s) {
  const n = parseInt(s, 10);
  return n >= 2015 && n <= 2030;
}

function isSkippableLine(line) {
  // Page numbers, headers, purely numeric short lines, Arabic-only, etc.
  if (/^\d{1,3}$/.test(line)) return true;                    // bare page number
  if (/^[\u0600-\u06FF\s]+$/.test(line)) return true;         // Arabic only
  if (/^[=\-_*]{3,}$/.test(line)) return true;                // separators
  if (/minist[eè]re|r[eé]publique|tunisie|guide|orientation/i.test(line) && line.length < 80) return true;
  if (/page\s*\d/i.test(line)) return true;
  if (/^[A-Z\s]{3,50}$/.test(line) && line.split(" ").length <= 4) return true; // ALL CAPS short header
  return false;
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
