const fs = require('fs');
const pdfParse = require('pdf-parse');

async function analyze() {
  const buf = fs.readFileSync('./data/raw/score2023.pdf');
  const data = await pdfParse(buf);
  const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Find all codes
  let codes = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length === 5) {
      let allDig = true;
      for (let j = 0; j < 5; j++) {
        if (lines[i].charCodeAt(j) < 48 || lines[i].charCodeAt(j) > 57) {
          allDig = false;
          break;
        }
      }
      if (allDig) codes.push({code: lines[i], idx: i});
    }
  }
  
  console.log('Found', codes.length, 'codes\n');
  console.log('First 10 codes and their positions:');
  codes.slice(0, 10).forEach(c => console.log(`  ${c.code} at line ${c.idx}`));
  
  // Find where codes end
  let codesEndIdx = 0;
  for (let i = 0; i < codes.length - 1; i++) {
    if (codes[i+1].idx - codes[i].idx > 5) {  // If gap > 5, codes ended
      codesEndIdx = codes[i].idx;
      break;
    }
  }
  
  console.log(`\nCodes occupy lines ${codes[0].idx} to ${codes[Math.min(codes.length-1, 50)].idx}`);
  console.log('Note: All 772 codes seem listed together at document start!\n');
  
  console.log('\n\nAnalyzing document-wide structure:\n');
  const blockStart = 0;
  const blockEnd = lines.length;
  
  // Count specialties and scores in first block
  let specialtiesInBlock = [];
  let scoresInBlock = [];
  let sectionsInBlock = [];
  
  for (let i = blockStart; i < blockEnd; i++) {
    const line = lines[i];
    
    // Count specialties (الإجازة)
    if (line.includes('الإجازة') && !line.includes('الشعبة')) {
      specialtiesInBlock.push(line);
    }
    
    // Count sections
    if (line === 'آداب' || line === 'رياضيات' || line === 'علوم تجريبية' || 
        line === 'إقتصاد وتصرف' || line === 'العلوم التقنية' || 
        line === 'علوم الإعلامية' || line === 'رياضة') {
      if (!sectionsInBlock.includes(line)) {
        sectionsInBlock.push(line);
      }
    }
    
    // Count scores
    const pattern = /^\d{2,3}\.\d{2,4}$/;
    if (pattern.test(line)) {
      const num = parseFloat(line.replace(',', '.'));
      if (num > 40 && num < 250) {
        scoresInBlock.push(num);
      }
    }
  }
  
  console.log(`Unique sections found: ${sectionsInBlock.length}`);
  console.log(`Specialties found: ${specialtiesInBlock.length}`);
  console.log(`Scores found: ${scoresInBlock.length}`);
  console.log(`Records if each specialty gets all sections: ${specialtiesInBlock.length * sectionsInBlock.length}`);
  console.log(`Scores per specialty needed: ${scoresInBlock.length / specialtiesInBlock.length}`);
  
  console.log('\nSpecialties:');
  specialtiesInBlock.forEach((s, i) => console.log(`  ${i+1}. ${s}`));
  
  console.log('\nSections:');
  sectionsInBlock.forEach((s, i) => console.log(`  ${i+1}. ${s}`));
  
  console.log('\nFirst 10 scores:');
  scoresInBlock.slice(0, 10).forEach((s, i) => console.log(`  ${i+1}. ${s}`));
  
  console.log('\nRaw lines in first block (sampling key areas):');
  console.log(`\nLines ${blockStart} to ${blockStart + 15}:`);
  for (let i = blockStart; i < blockStart + 15; i++) {
    console.log(`${i}: ${lines[i]}`);
  }
  
  console.log(`\nLines just before first score (~340-350):`);
  for (let i = 340; i < 355 && i < blockEnd; i++) {
    console.log(`${i}: ${lines[i]}`);
  }
}

analyze().catch(err => console.error(err));
