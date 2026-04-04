"use strict";
const fs       = require("fs");
const path     = require("path");
const pdfParse = require("pdf-parse");

const PDF_PATH = path.resolve(__dirname, "../../data/raw/guide2025.pdf");
const OUT      = path.resolve(__dirname, "../../data/raw/tmp/scan_results.txt");

// Ranges to test: [start, end]
const RANGES = [
  [20, 25],
  [40, 45],
  [60, 65],
  [80, 85],
  [100, 105],
];

const CANDIDATE_RE = /\b\d{1,2}[.,]\d{2,3}\b|\b\d{4,5}\b/;

async function probeRange(buffer, start, end) {
  const collectedLines = [];

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
        const sorted = Object.keys(byY).map(Number).sort((a, b) => b - a);
        for (const y of sorted) {
          const line = byY[y].join(" ").trim();
          if (line.length > 1) collectedLines.push(line);
        }
        return "";
      });
    }
  });

  return collectedLines;
}

// Heuristic: does this set of lines look like real data table?
function classify(lines) {
  const joined = lines.join(" ");
  const hasScore   = /\b\d{1,2}[.,]\d{3}\b/.test(joined);
  const hasCapacity= /\b[1-9]\d{1,3}\b/.test(joined);
  const hasFormula = /\b(M\s|Ph\s|Fr\s|SVT|Ang|Inf|Sc\.?\s)/i.test(joined);
  const hasArabicInstitution = /كلية|معهد|مدرسة|جامعة/.test(joined);
  if (hasScore && hasCapacity) return "REAL TABLE (score + capacity detected)";
  if (hasFormula) return "LIKELY TABLE (formula signals present)";
  if (hasArabicInstitution) return "INSTITUTION BLOCK (no table yet)";
  return "INTRO/INDEX";
}

async function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const buffer = fs.readFileSync(PDF_PATH);

  let output = "";
  let foundRange = null;

  for (const [start, end] of RANGES) {
    output += `\n${"=".repeat(60)}\nRANGE: pages ${start}-${end}\n${"=".repeat(60)}\n`;

    const lines = await probeRange(buffer, start, end);
    const label = classify(lines);
    output += `Classification: ${label}\n`;
    output += `Total lines: ${lines.length}\n\n`;

    // First 30 lines
    output += "--- FIRST 30 LINES ---\n";
    lines.slice(0, 30).forEach((l, i) => {
      output += `[${String(i+1).padStart(3)}] ${l}\n`;
    });

    // Top 5 candidates
    const candidates = lines.filter(l => CANDIDATE_RE.test(l));
    output += `\n--- CANDIDATES (${candidates.length} total, showing 5) ---\n`;
    candidates.slice(0, 5).forEach((l, i) => {
      output += `[C${i+1}] ${l}\n`;
    });

    if (!foundRange && label.startsWith("REAL TABLE")) {
      foundRange = start + "-" + end;
      output += "\n*** FIRST USEFUL RANGE FOUND — stopping scan ***\n";
      break;
    }
  }

  output += `\n\nFIRST USEFUL RANGE: ${foundRange || "none found in scanned ranges"}\n`;
  fs.writeFileSync(OUT, output, "utf-8");
  console.log("Done. Results written to:", OUT);
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
