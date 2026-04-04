const fs = require('fs');
const pdfParse = require('pdf-parse');

async function analyzeGuide2025() {
  const buf = fs.readFileSync('./data/raw/guide2025.pdf');
  const data = await pdfParse(buf);
  
  console.log(`PDF Pages: ${data.numpages}`);
  console.log(`Text length: ${data.text.length}`);
  console.log(`\nSearching for capacity indicators...\n`);
  
  const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Look for patterns that might indicate capacity
  // Common patterns: "place", "capacite", "nombre", numbers with units, etc.
  
  let sampleIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    // Look for code followed by context
    if (/^\d{5}$/.test(lines[i])) {
      sampleIdx = i;
      console.log(`\n=== Found code ${lines[i]} at line ${i} ===`);
      for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 20); j++) {
        console.log(`${j.toString().padStart(5)}: ${lines[j].substring(0, 80)}`);
      }
      if (sampleIdx === (Math.floor(Math.random() * 100) * 100)) {
        break; // Just show one example
      }
      if (sampleIdx > 2000) break; // Stop after first appearance
    }
  }
  
  // Search for capacity-related keywords
  console.log(`\n\n=== SEARCHING FOR CAPACITY KEYWORDS ===`);
  const keywords = ['place', 'capacité', 'capacite', 'nombre', 'max', 'effectif', 'quota', 'plac'];
  keywords.forEach(kw => {
    let count = 0;
    const matches = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(kw)) {
        count++;
        if (matches.length < 3) {
          matches.push(`Line ${i}: ${lines[i].substring(0, 60)}`);
        }
      }
    }
    if (count > 0) {
      console.log(`\n"${kw}": ${count} occurrences`);
      matches.forEach(m => console.log(`  ${m}`));
    }
  });
}

analyzeGuide2025().catch(console.error);
