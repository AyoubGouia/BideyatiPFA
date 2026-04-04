/**
 * diagnostic_dump.js
 * Dumps raw text from guide2025.pdf pages 1-15 so we can see actual layout.
 * Run: node scripts/extraction/diagnostic_dump.js
 */
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

const PDF_PATH = path.resolve(__dirname, "../../data/raw/guide2025.pdf");
const OUT_PATH = path.resolve(__dirname, "../../data/extracted/2025/guide2025.diagnostic.txt");

async function main() {
  const buffer = fs.readFileSync(PDF_PATH);

  let pageCount = 0;
  const MAX_PAGES = 15;
  const pages = [];

  await pdfParse(buffer, {
    pagerender: function (pageData) {
      pageCount++;
      if (pageCount > MAX_PAGES) return Promise.resolve("");
      return pageData.getTextContent().then((tc) => {
        const strings = tc.items.map((item) => item.str);
        const text = strings.join(" ");
        pages.push({ page: pageCount, text });
        return text;
      });
    },
    max: MAX_PAGES,
  });

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });

  let out = "";
  for (const p of pages) {
    out += `\n${"=".repeat(80)}\nPAGE ${p.page}\n${"=".repeat(80)}\n${p.text}\n`;
  }

  fs.writeFileSync(OUT_PATH, out, "utf-8");
  console.log(`✅ Dumped ${pages.length} pages → ${OUT_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
