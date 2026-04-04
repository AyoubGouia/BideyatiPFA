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
  
  // Collect entries
  const entries = [];
  let i = 0;
  let currentCode = null;
  let currentInstitution = null;
  
  // Skip to first code
  while (i < allLines.length && !isCode(allLines[i])) {
    i++;
  }
  
  console.log(`First code at line ${i}: ${allLines[i]}\n`);
  
  // Collect
  let specCount = 0;
  while (i < allLines.length) {
    const line = allLines[i];
    
    if (isValidScore2023(line)) {
      console.log(`\nScores start at line ${i}: ${line}`);
      console.log(`Collected ${specCount} specialties before scores\n`);
      break;
    }
    
    if (line.startsWith('صيغة')) {
      console.log('\nHit formula marker at line ' + i);
      break;
    }
    
    if (isCode(line)) {
      currentCode = line;
      console.log(`[@${i}] Code: ${line}`);
    } else if ((line.includes('كلية') || line.includes('معهد') || line.includes('جامعة')) &&
               !line.includes('الشعبة') && !line.includes('نوع')) {
      currentInstitution = line;
      console.log(`[@${i}] Institution: ${line.substring(0, 50)}`);
    } else if ((line.includes('الإجازة') || line.includes('ماستر') || 
                line.includes('دبلوم')) && 
               !line.includes('الشعبة') && !line.includes('نوع') &&
               !line.includes('والمراحل') && line.length < 100) {
      if (currentCode && currentInstitution) {
        specCount++;
        entries.push({
          code: currentCode,
          institution: currentInstitution,
          specialty: line
        });
        if (specCount % 10 === 0 || specCount < 5) {
          console.log(`   [@${i}] Specialty #${specCount}: ${line.substring(0, 50)}`);
        }
      }
    }
    
    i++;
  }
  
  console.log(`\n\nSummary:`);
  console.log(`Total entries collected: ${entries.length}`);
  console.log(`First 5 entries:`);
  entries.slice(0, 5).forEach((e, idx) => {
    console.log(`  ${idx+1}. [${e.code}] ${e.institution.substring(0,40)} | ${e.specialty.substring(0,40)}`);
  });
}

debug().catch(err => console.error(err));
