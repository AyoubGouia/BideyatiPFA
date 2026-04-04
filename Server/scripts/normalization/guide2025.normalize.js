/**
 * guide2025.normalize.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads: data/extracted/2025/guide2025.sample.rows.json
 * Writes:
 *   data/normalized/2025/specialties_base.sample.json
 *   data/normalized/2025/capacities_2025.sample.json
 *   data/normalized/2024/scores_2024_reference.sample.json
 *   data/review/guide2025.sample.review.json
 *
 * Run: node scripts/normalization/guide2025.normalize.js
 *
 * Rules:
 *   - codeOrientation = primary join key (mandatory for confirmed rows)
 *   - formuleBrute = raw string, never parsed here
 *   - sectionBac NOT added to Specialite stable model
 *   - ambiguous rows → review file only
 *   - _rawText preserved in all outputs
 */

"use strict";
const fs   = require("fs");
const path = require("path");

// ─── Paths ────────────────────────────────────────────────────────────────────
const ROWS_FILE   = path.resolve(__dirname, "../../data/extracted/2025/guide2025.sample.rows.json");
const OUT_2025    = path.resolve(__dirname, "../../data/normalized/2025");
const OUT_2024    = path.resolve(__dirname, "../../data/normalized/2024");
const REVIEW_DIR  = path.resolve(__dirname, "../../data/review");

// ─── BAC section canonical set ────────────────────────────────────────────────
const VALID_BAC_SECTIONS = new Set([
  "Math", "Sciences Exp", "Sciences Info", "Technique", "Lettres", "Économie", "Sport",
]);

// ─── Score parsing ────────────────────────────────────────────────────────────
function parseScore(raw) {
  if (!raw) return null;
  const n = parseFloat(raw.replace(",", "."));
  if (isNaN(n) || n < 5 || n > 20) return null; // bac scores are 5-20
  return n;
}

function parseCapacity(raw) {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (isNaN(n) || n < 1 || n > 9999) return null;
  return n;
}

// ─── Ambiguity checks ─────────────────────────────────────────────────────────
function getReviewFlag(row) {
  const flags = [];

  // No code orientation AND no score signal → lean row, not enough to join
  if (!row.codeOrientationRaw) {
    flags.push("NO_CODE_ORIENTATION");
  }

  // Code orientation is suspicious (year-like, too short, etc.)
  if (row.codeOrientationRaw) {
    const c = parseInt(row.codeOrientationRaw, 10);
    if (c >= 2015 && c <= 2030) flags.push("CODE_LOOKS_LIKE_YEAR");
    if (row.codeOrientationRaw.length < 3) flags.push("CODE_TOO_SHORT");
  }

  // No bac section context
  if (!row.bacSectionDetected || !VALID_BAC_SECTIONS.has(row.bacSectionDetected)) {
    flags.push("NO_BAC_SECTION");
  }

  // Score out of range
  if (row.scoreRefRaw && parseScore(row.scoreRefRaw) === null) {
    flags.push("SCORE_PARSE_ERROR");
  }

  // Capacity out of range
  if (row.capaciteRaw && parseCapacity(row.capaciteRaw) === null) {
    flags.push("CAPACITY_PARSE_ERROR");
  }

  return flags.length > 0 ? flags.join("|") : null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(ROWS_FILE)) {
    console.error(`❌ Rows file not found: ${ROWS_FILE}`);
    console.error("   Run scripts/extraction/guide2025.extract.js first.");
    process.exit(1);
  }

  const rows = JSON.parse(fs.readFileSync(ROWS_FILE, "utf-8"));
  console.log(`📥 Loaded ${rows.length} extracted rows`);

  const specialtiesBase = [];
  const capacities2025  = [];
  const scores2024Ref   = [];
  const reviewRows      = [];

  for (const row of rows) {
    const flag = getReviewFlag(row);

    if (flag) {
      reviewRows.push({
        _reviewFlag:  flag,
        _rawText:     row._rawText,
        _sourceFile:  row._sourceFile,
        _pageNum:     row._pageNum,
        extracted:    row,
      });
      continue;
    }

    // ── Confirmed row (has codeOrientation + bacSection + parseable values) ───

    const codeOrientation = row.codeOrientationRaw;
    const bacSection      = row.bacSectionDetected;
    const scoreRef        = parseScore(row.scoreRefRaw);
    const capacite        = parseCapacity(row.capaciteRaw);

    // specialties_base: stable program metadata (no sectionBac here)
    // We deduplicate by codeOrientation — only one entry per code
    const existingSp = specialtiesBase.find(s => s.codeOrientation === codeOrientation);
    if (!existingSp) {
      specialtiesBase.push({
        codeOrientation,
        // nom, etablissementNom, formuleBrute not parseable from raw text yet
        // — will be populated after diagnostic shows real column layout
        nom:              null,
        etablissementNom: null,
        formuleBrute:     null,   // raw string, never parsed
        domaine:          null,   // inferred later
        _rawText:         row._rawText,
        _sourceFile:      row._sourceFile,
        _pageNum:         row._pageNum,
        _needsNameExtraction: true,  // flag for next pass after diagnostic review
      });
    }

    // capacities_2025
    if (capacite !== null) {
      capacities2025.push({
        codeOrientation,
        annee:       2025,
        capacite,
        bacSection,
        _rawText:    row._rawText,
        _sourceFile: row._sourceFile,
        _pageNum:    row._pageNum,
      });
    }

    // scores_2024_reference (scores in 2025 guide = last year's admitted score)
    if (scoreRef !== null) {
      scores2024Ref.push({
        codeOrientation,
        annee:       2024,
        scoreMinimum: scoreRef,
        bacSection,
        _rawText:    row._rawText,
        _sourceFile: row._sourceFile,
        _pageNum:    row._pageNum,
      });
    }
  }

  // ── Write outputs ─────────────────────────────────────────────────────────
  [OUT_2025, OUT_2024, REVIEW_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

  write(path.join(OUT_2025, "specialties_base.sample.json"),       specialtiesBase);
  write(path.join(OUT_2025, "capacities_2025.sample.json"),        capacities2025);
  write(path.join(OUT_2024, "scores_2024_reference.sample.json"),  scores2024Ref);
  write(path.join(REVIEW_DIR, "guide2025.sample.review.json"),     reviewRows);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n📊 Normalization summary (sample pages 1–30):`);
  console.log(`   Confirmed rows:         ${rows.length - reviewRows.length}`);
  console.log(`   Review rows:            ${reviewRows.length} (${pct(reviewRows.length, rows.length)}%)`);
  console.log(`   specialties_base:       ${specialtiesBase.length} unique orientations`);
  console.log(`   capacities_2025:        ${capacities2025.length}`);
  console.log(`   scores_2024_reference:  ${scores2024Ref.length}`);

  const flagBreakdown = {};
  for (const r of reviewRows) {
    r._reviewFlag.split("|").forEach(f => { flagBreakdown[f] = (flagBreakdown[f] || 0) + 1; });
  }
  console.log(`\n⚑  Review flag breakdown:`);
  Object.entries(flagBreakdown).forEach(([f, c]) => console.log(`   ${String(c).padStart(4)}  ${f}`));

  console.log(`\n✅ Done. Check data/extracted/2025/guide2025.sample.pages.txt`);
  console.log(`   to validate column layout and refine name extraction next.`);
}

function write(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`   → ${path.relative(process.cwd(), filePath)}  (${data.length} rows)`);
}

function pct(n, total) {
  return total ? Math.round((n / total) * 100) : 0;
}

main();
