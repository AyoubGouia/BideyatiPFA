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
        console.log(`${i+1}. [${r.codeOrientation}] ${r.specialty_name.substring(0, 25).padEnd(25)} | ${r.sectionBac.padEnd(15)} | ${r.scoreDernierAdmis}`);
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
  
  // Find ALL code locations first
  const codeLocations = [];
  for (let i = 0; i < allLines.length; i++) {
    if (isCode(allLines[i])) {
      codeLocations.push(i);
    }
  }
  
  console.log(`Found ${codeLocations.length} code occurrences`);
  
  // Group codes into blocks based on proximity
  const codeBlocks = [];
  if (codeLocations.length > 0) {
    let blockStart = codeLocations[0];
    let blockCodes = [allLines[blockStart]];
    
    for (let i = 1; i < codeLocations.length; i++) {
      const gap = codeLocations[i] - codeLocations[i - 1];
      
      if (gap === 1) {
        // Consecutive line - same block
        blockCodes.push(allLines[codeLocations[i]]);
      } else {
        // Gap - new block
        if (blockCodes.length > 0) {
          codeBlocks.push({
            startIdx: blockStart,
            codes: blockCodes,
            endCodeIdx: codeLocations[i - 1]
          });
        }
        blockStart = codeLocations[i];
        blockCodes = [allLines[blockStart]];
      }
    }
    
    // Add final block
    if (blockCodes.length > 0) {
      codeBlocks.push({
        startIdx: blockStart,
        codes: blockCodes,
        endCodeIdx: codeLocations[codeLocations.length - 1]
      });
    }
  }
  
  console.log(`Grouped into ${codeBlocks.length} code blocks`);
  
  // Process each code block
  for (let blockIdx = 0; blockIdx < codeBlocks.length; blockIdx++) {
    const block = codeBlocks[blockIdx];
    const searchStart = block.endCodeIdx + 1;
    const searchEnd = blockIdx < codeBlocks.length - 1 ? codeBlocks[blockIdx + 1].startIdx : allLines.length;
    
    // Search for institutions in lines after this code block
    const institutions = [];
    for (let i = searchStart; i < searchEnd && institutions.length < block.codes.length * 2.5; i++) {
      const line = allLines[i];
      
      // Stop if we hit specialties or scores
      if ((line.includes('الإجازة') || line.includes('ماستر') || line.includes('دبلوم')) &&
          !line.includes('الشعبة') && line.length < 100) break;
      if (isValidScore2023(line)) break;
      
      if (line.includes('كلية') || line.includes('معهد') || 
          line.includes('جامعة') || line.includes('بتونس') ||
          line.includes('بصفاقس') || line.includes('بسوسة') ||
          line.includes('بقفصة') || line.includes('بقابس') ||
          line.includes('بالقيروان') || line.includes('بمنوبة') ||
          line.includes('بالمنستير') || line.includes('بسليانة') ||
          line.includes('بنابل') || line.includes('بالمهدية')) {
        institutions.push(line);
      }
    }
    
    // Search for specialties
    const specialties = [];
    let specSearchStart = searchStart;
    for (let i = searchStart; i < searchEnd; i++) {
      const line = allLines[i];
      
      if (isValidScore2023(line)) break;
      if (line.startsWith('صيغة')) break;
      
      if ((line.includes('الإجازة') || line.includes('ماستر') || line.includes('دبلوم')) &&
          !line.includes('الشعبة') && !line.includes('نوع') && line.length < 100) {
        specialties.push(line);
      }
    }
    
    // Search for scores
    const scores = [];
    let scoreSearchStart = -1;
    for (let i = searchStart; i < searchEnd; i++) {
      if (isValidScore2023(allLines[i])) {
        if (scoreSearchStart === -1) scoreSearchStart = i;
        scores.push(parseFloat(allLines[i].replace(',', '.')));
      }
    }
    
    // Create records
    if (block.codes.length > 0 && institutions.length > 0 && specialties.length > 0 && scores.length > 0) {
      // Pair institutions with codes
      const codeInstPairs = [];
      let instIdx = 0;
      
      for (let cIdx = 0; cIdx < block.codes.length && instIdx < institutions.length; cIdx++) {
        const instLines = [institutions[instIdx]];
        instIdx++;
        // Check if next line is a city/address line (doesn't start with key institution word)
        if (instIdx < institutions.length && 
            !institutions[instIdx].includes('كلية') && 
            !institutions[instIdx].includes('معهد') &&
            institutions[instIdx].length < 50) {
          instLines.push(institutions[instIdx]);
          instIdx++;
        }
        
        codeInstPairs.push({
          code: block.codes[cIdx],
          institution: instLines.join(' ')
        });
      }
      
      // Distribute scores
      let scoreIdx = 0;
      for (let specIdx = 0; specIdx < specialties.length; specIdx++) {
        for (let comboIdx = 0; comboIdx < codeInstPairs.length; comboIdx++) {
          const combo = codeInstPairs[comboIdx];
          const specialty = specialties[specIdx];
          
          const comboScores = [];
          for (let s = 0; s < referenceSections.length && scoreIdx < scores.length; s++) {
            comboScores.push(scores[scoreIdx]);
            scoreIdx++;
          }
          
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
              issue: 'score_section_mismatch',
              expected: referenceSections.length,
              found: comboScores.length
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
