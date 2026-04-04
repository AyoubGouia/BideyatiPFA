const fs = require('fs');
const pdfParse = require('pdf-parse');

async function debug2024Pattern() {
  const buf = fs.readFileSync('./data/raw/score2024.pdf');
  const data = await pdfParse(buf);
  const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const sects = ['آداب', 'رياضيات', 'علوم تجريبية', 'إقتصاد وتصرف', 'علوم الإعلامية', 'العلوم التقنية', 'رياضة'];
  const codes = [];
  
  // Find all codes and mark first occurrence
  for (let i = 0; i < lines.length; i++) {
    if (/^\d{5}$/.test(lines[i])) {
      codes.push({idx: i, code: lines[i]});
    }
  }
  
  console.log('Sample code positions:');
  console.log(`First 5 codes: ${codes.slice(0, 5).map(c => `${c.code}@${c.idx}`).join(', ')}`);
  
  // Check around first code - what's the pattern?
  let firstCodeIdx = codes[0].idx;
  console.log(`\n\nContext around first code (line ${firstCodeIdx}, code ${lines[firstCodeIdx]}):`);
  for (let j = firstCodeIdx - 3; j < firstCodeIdx + 15; j++) {
    let marker = '';
    if (j === firstCodeIdx) marker = ' <-- CODE';
    if (sects.includes(lines[j])) marker = ' <-- SECTION';
    if (lines[j].startsWith('FG+')) marker = ' <-- FORMULA';
    console.log(`${j.toString().padStart(5)}: ${lines[j].substring(0, 60)}${marker}`);
  }
  
  // Look for 4-5 consecutive entries to see the common breaking point
  console.log('\n\nAnalyzing 5 consecutive code entries:');
  for (let entryNum = 0; entryNum < 5; entryNum++) {
    if (entryNum >= codes.length) break;
    let codeIdx = codes[entryNum].idx;
    let sectionCount = 0;
    console.log(`\n--- Entry ${entryNum + 1}: Code ${lines[codeIdx]} at line ${codeIdx} ---`);
    for (let j = codeIdx; j < Math.min(codeIdx + 25, lines.length); j++) {
      let marker = '';
      if (sects.includes(lines[j])) {
        marker = ` <-- SECTION #${++sectionCount}`;
        if (sectionCount > 7) {
          console.log(`${j.toString().padStart(5)}: ${lines[j].substring(0, 60)}${marker} [STOP - BEYOND 7]`);
          break;
        }
      }
      if (lines[j].startsWith('FG+')) marker = ' <-- FORMULA';
      if (/^\d{5}$/.test(lines[j])) marker = ' <-- NEXT CODE (unexpected)';
      console.log(`${j.toString().padStart(5)}: ${lines[j].substring(0, 60)}${marker}`);
    }
  }
}

debug2024Pattern().catch(console.error);
