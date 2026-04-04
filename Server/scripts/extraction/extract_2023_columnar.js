const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function extractScores() {
  const pdfPath = path.join(__dirname, '../../data/raw/score2023.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF not found: ${pdfPath}`);
    process.exit(1);
  }
  
  try {
    console.log(`Reading PDF: ${pdfPath}\n`);
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(pdfBuffer);
    
    console.log(`PDF Pages: ${data.numpages}`);
    console.log(`Text length: ${data.text.length}\n`);
    
    const { records, reviews } = parseGuideFormat2023(data.text);
    
    console.log(`\n✓ Extracted ${records.length} records with section alignment`);
    console.log(`✓ Flagged ${reviews.length} records for review\n`);
    
    if (records.length > 0) {
      console.log('Sample records (first 10):');
      records.slice(0, 10).forEach((r, i) => {
        console.log(`${i+1}. [${r.codeOrientation}] ${r.specialty_name.substring(0, 30).padEnd(30)} | ${r.sectionBac.padEnd(15)} | ${r.scoreDernierAdmis}`);
      });
    }
    
    // Write normalized output
    const normDir = path.join(__dirname, '../../data/normalized/2023');
    fs.mkdirSync(normDir, { recursive: true });
    
    const normPath = path.join(normDir, 'scores_2023_reference.by_section.json');
    fs.writeFileSync(normPath, JSON.stringify(records, null, 2), 'utf8');
    console.log(`\n✓ Output written to: ${normPath}`);
    
    // Write review output if any
    if (reviews.length > 0) {
      const reviewDir = path.join(__dirname, '../../data/review');
      fs.mkdirSync(reviewDir, { recursive: true });
      
      const reviewPath = path.join(reviewDir, 'scores_2023_reference.by_section.review.json');
      fs.writeFileSync(reviewPath, JSON.stringify(reviews, null, 2), 'utf8');
      console.log(`✓ Review written to: ${reviewPath}`);
    }
    
    console.log(`\nStatistics:`);
    console.log(`  Extracted rows: ${records.length}`);
    console.log(`  Review rows: ${reviews.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function parseGuideFormat2023(text) {
  const records = [];
  const reviews = [];
  
  const allLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const referenceSections = [
    'آداب', 'رياضيات', 'علوم تجريبية', 'إقتصاد وتصرف',
    'علوم الإعلامية', 'العلوم التقنية', 'رياضة'
  ];
  
  let blockCount = 0;
  
  // Parse by finding code blocks, their institutions, their specialties, and scores
  let i = 0;
  
  // Skip to first code
  while (i < allLines.length && !isCode(allLines[i])) {
    i++;
  }
  
  while (i < allLines.length) {
    // Skip formulas and other markers
    while (i < allLines.length && (allLines[i].startsWith('صيغة') || 
            allLines[i] === 'FG+AR' || allLines[i].startsWith('FG+') ||
            allLines[i] === 'طاقة' || allLines[i] === '')) {
      i++;
    }
    
    if (i >= allLines.length) break;
    
    // Collect code block (sequence of 5-digit codes)
    const codes = [];
    while (i < allLines.length && isCode(allLines[i])) {
      codes.push(allLines[i]);
      i++;
    }
    
    if (codes.length === 0) break;
    
    blockCount++;
    
    // Collect institutions (next lines until we see a real specialty or score)
    const institutions = [];
    let instStartIdx = i;
    while (i < allLines.length && institutions.length < codes.length * 2.5) {
      const line = allLines[i];
      
      // Stop at specialties or scores
      if (isValidScore2023(line)) break;
      if ((line.includes('الإجازة') || line.includes('ماستر') || line.includes('دبلوم')) &&
          !line.includes('الشعبة') && line.length < 100) break;
      if (line.startsWith('صيغة')) break;
      
      // Collect institutions and city lines
      if (line.includes('كلية') || line.includes('معهد') || 
          line.includes('جامعة') || line.includes('بتونس') ||
          line.includes('بصفاقس') || line.includes('بسوسة') ||
          line.includes('بقفصة') || line.includes('بقابس') ||
          line.includes('بالقيروان') || line.includes('بمنوبة') ||
          line.includes('بالمنستير') || line.includes('بسليانة') ||
          line.includes('بنابل') || line.includes('بالمهدية') ||
          line.includes('بالمهدية') || line.includes('جامعة')) {
        institutions.push(line);
      }
      
      i++;
    }
    
    // Collect specialties for this code block
    const specialties = [];
    while (i < allLines.length) {
      const line = allLines[i];
      
      // Stop at scores
      if (isValidScore2023(line)) break;
      
      if ((line.includes('الإجازة') || line.includes('ماستر') || line.includes('دبلوم')) &&
          !line.includes('الشعبة') && !line.includes('نوع') && line.length < 100) {
        specialties.push(line);
      }
      
      if (line.startsWith('صيغة') || line === 'طاقة' || line === 'الاستيعاب') {
        break;
      }
      
      i++;
    }
    
    // Collect scores for this block
    const scores = [];
    while (i < allLines.length) {
      const line = allLines[i];
      
      // Stop at next code block or formula
      if (isCode(line)) break;
      if (line.startsWith('صيغة') || line === 'FG+AR' || line === 'FG+ANG' || line === 'طاقة') break;
      if (line === 'الاستيعاب' || line === 'مجموع') break;
      
      if (isValidScore2023(line)) {
        scores.push(parseFloat(line.replace(',', '.')));
      }
      
      i++;
    }
    
    // Now zip codes, institutions, specialties with scores
    // Pair institutions with codes (assuming up to 2-3 lines per institution)
    const codeInstPairs = [];
    let instIdx = 0;
    for (let cIdx = 0; cIdx < codes.length && instIdx < institutions.length; cIdx++) {
      const instLines = [];
      // Take 1-2 institution lines per code
      if (instIdx < institutions.length) {
        instLines.push(institutions[instIdx]);
        instIdx++;
        if (instIdx < institutions.length && !institutions[instIdx].includes('كلية') && 
            !institutions[instIdx].includes('معهد')) {
          instLines.push(institutions[instIdx]);
          instIdx++;
        }
      }
      const combinedInst = instLines.join(' ').substring(0, 150);
      codeInstPairs.push({
        code: codes[cIdx],
        institution: combinedInst
      });
    }
    
    // For each specialty, distribute scores to code-institution pairs
    if (codeInstPairs.length > 0 && specialties.length > 0 && scores.length > 0) {
      let scoreIdx = 0;
      
      for (let specIdx = 0; specIdx < specialties.length; specIdx++) {
        for (let comboIdx = 0; comboIdx < codeInstPairs.length; comboIdx++) {
          const combo = codeInstPairs[comboIdx];
          const specialty = specialties[specIdx];
          
          // Get score slice for this combo-specialty
          const comboScores = [];
          for (let s = 0; s < referenceSections.length && scoreIdx < scores.length; s++) {
            comboScores.push(scores[scoreIdx]);
            scoreIdx++;
          }
          
          // Create records for each section
          for (let secIdx = 0; secIdx < comboScores.length; secIdx++) {
            records.push({
              annee: 2023,
              codeOrientation: combo.code,
              establishment_name: combo.institution.trim(),
              specialty_name: specialty,
              sectionBac: referenceSections[secIdx],
              scoreDernierAdmis: comboScores[secIdx]
            });
          }
          
          if (comboScores.length !== referenceSections.length && comboScores.length > 0) {
            reviews.push({
              codeOrientation: combo.code,
              establishment_name: combo.institution,
              specialty_name: specialty,
              issue: 'score_section_count_mismatch',
              sectionsExpected: referenceSections.length,
              scoresFound: comboScores.length
            });
          }
        }
      }
    }
  }
  
  return { records, reviews };
}

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

extractScores().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
