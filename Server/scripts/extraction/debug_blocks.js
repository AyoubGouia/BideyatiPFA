const fs = require('fs');
const pdfParse = require('pdf-parse');

async function debug() {
  const buf = fs.readFileSync('./data/raw/score2023.pdf');
  const data = await pdfParse(buf);
  const allLines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  function isCode(text) {
    if (text.length !== 5) return false;
    for (let j = 0; j < 5; j++) {
      const c = text.charCodeAt(j);
      if (c < 48 || c > 57) return false;
    }
    return true;
  }
  
  function isValidScore2023(text) {
    const pattern = /^\d{2,3}\.\d{2,4}$/;
    if (!pattern.test(text)) return false;
    const num = parseFloat(text.replace(',', '.'));
    return !isNaN(num) && num > 40 && num < 250;
  }
  
  let i = 0;
  let blockNum = 0;
  
  // Skip to first code
  while (i < allLines.length && !isCode(allLines[i])) {
    i++;
  }
  
  while (i < allLines.length && blockNum < 10) {
    console.log(`\n=== Block ${blockNum + 1} ===`);
    console.log(`Starting at line ${i}: ${allLines[i]}`);
    
    // Skip formulas
    let skipCount = 0;
    while (i < allLines.length && (allLines[i].startsWith('صيغة') || 
            allLines[i] === 'FG+AR' || allLines[i].startsWith('FG+') ||
            allLines[i] === 'طاقة' || allLines[i] === '')) {
      skipCount++;
      i++;
    }
    if (skipCount > 0) console.log(`Skipped ${skipCount} formula/marker lines`);
    
    // Collect codes
    const codes = [];
    const codeStartIdx = i;
    while (i < allLines.length && isCode(allLines[i])) {
      codes.push(allLines[i]);
      i++;
    }
    
    if (codes.length === 0) {
      console.log('No codes found - stopping');
      break;
    }
    console.log(`Found ${codes.length} codes (${codes[0]} - ${codes[codes.length-1]}), now at line ${i}: ${allLines[i]?.substring(0,40)}`);
    
    // Collect institutions
    const institutions = [];
    const instStartIdx = i;
    while (i < allLines.length && institutions.length < codes.length * 2.5) {
      const line = allLines[i];
      
      if (isValidScore2023(line)) {
        console.log(`Hit score at line ${i}: ${line}`);
        break;
      }
      if ((line.includes('الإجازة') || line.includes('ماستر') || line.includes('دبلوم')) &&
          !line.includes('الشعبة') && line.length < 100) {
        console.log(`Hit specialty at line ${i}: ${line.substring(0,40)}`);
        break;
      }
      if (line.startsWith('صيغة')) {
        console.log(`Hit formula at line ${i}`);
        break;
      }
      
      if (line.includes('كلية') || line.includes('معهد') || 
          line.includes('جامعة') || line.includes('بتونس') ||
          line.includes('بصفاقس')) {
        institutions.push(line);
      }
      
      i++;
    }
    console.log(`Found ${institutions.length} institution lines, now at line ${i}`);
    
    // Collect specialties
    const specialties = [];
    while (i < allLines.length) {
      const line = allLines[i];
      
      if (isValidScore2023(line)) break;
      
      if ((line.includes('الإجازة') || line.includes('ماستر') || line.includes('دبلوم')) &&
          !line.includes('الشعبة') && !line.includes('نوع') && line.length < 100) {
        specialties.push(line);
      }
      
      if (line.startsWith('صيغة')) break;
      
      i++;
    }
    console.log(`Found ${specialties.length} specialties, now at line ${i}`);
    
    // Collect scores
    const scores = [];
    const scoreStartIdx = i;
    while (i < allLines.length) {
      const line = allLines[i];
      
      if (isCode(line)) {
        console.log(`Next code block starts at line ${i}: ${line}`);
        break;
      }
      if (line.startsWith('صيغة')) {
        console.log(`Formula at line ${i}`);
        break;
      }
      if (line === 'طاقة' || line === 'الاستيعاب') {
        console.log(`Stopping marker at line ${i}: ${line}`);
        break;
      }
      
      if (isValidScore2023(line)) {
        scores.push(parseFloat(line));
      }
      
      i++;
    }
    console.log(`Collected ${scores.length} scores (${scoreStartIdx}-${i}), total would be ${codes.length} codes × ${specialties.length} specialties × 7 sections = ${codes.length * specialties.length * 7}`);
    
    blockNum++;
  }
  
  console.log(`\n\nProcessed ${blockNum} blocks`);
}

debug().catch(err => console.error(err));
