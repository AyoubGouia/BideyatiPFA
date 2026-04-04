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
        console.log(`${i+1}. [${r.codeOrientation}] ${r.specialty_name.substring(0, 30)} | ${r.sectionBac} | ${r.scoreDernierAdmis}`);
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
  
  // Reference sections (constant 7)
  const referenceSections = [
    'آداب', 'رياضيات', 'علوم تجريبية', 'إقتصاد وتصرف',
    'علوم الإعلامية', 'العلوم التقنية', 'رياضة'
  ];
  
  // Pass 1: Collect all codes, institutions, and specialties in order
  const entries = [];
  let i = 0;
  let currentCode = null;
  let currentInstitution = null;
  let currentSpecialty = null;
  
  // Skip to first code
  while (i < allLines.length && !isCode(allLines[i])) {
    i++;
  }
  
  // Collect all codes/institutions/specialties (stop at scores)
  while (i < allLines.length) {
    const line = allLines[i];
    
    // Stop when we hit scores
    if (isValidScore2023(line)) {
      break;
    }
    
    // Stop at formula marker
    if (line.startsWith('صيغة') || line === 'FG+AR' || line === 'FG+ANG') {
      break;
    }
    
    if (isCode(line)) {
      currentCode = line;
    } else if ((line.includes('كلية') || line.includes('معهد') || line.includes('جامعة')) &&
               !line.includes('الشعبة') && !line.includes('نوع')) {
      currentInstitution = line;
    } else if ((line.includes('الإجازة') || line.includes('ماستر') || 
                line.includes('دبلوم')) && 
               !line.includes('الشعبة') && !line.includes('نوع') &&
               !line.includes('والمراحل') && line.length < 100) {
      // Real specialty name (not header) - check length to avoid long descriptive lines
      if (currentCode && currentInstitution) {
        entries.push({
          code: currentCode,
          institution: currentInstitution,
          specialty: line
        });
      }
    }
    
    i++;
  }
  
  // Pass 2: Skip markers and collect all scores
  const allScores = [];
  while (i < allLines.length) {
    const line = allLines[i];
    
    // Stop at formula section
    if (line.startsWith('صيغة') || line === 'طاقة' || line === 'الاستيعاب') {
      break;
    }
    
    if (isValidScore2023(line)) {
      allScores.push(parseFloat(line.replace(',', '.')));
    }
    
    i++;
  }
  
  // Pass 3: Distribute scores to entries
  if (entries.length > 0 && allScores.length > 0) {
    const expectedScores = entries.length * 7;
    const diff = Math.abs(expectedScores - allScores.length);
    const tolerance = Math.max(entries.length, 50);  // Allow some tolerance
    
    if (diff <= tolerance) {
      // Reasonably aligned - distribute scores proportionally
      const scoresPerEntry = Math.floor(allScores.length / entries.length);
      
      for (let entryIdx = 0; entryIdx < entries.length; entryIdx++) {
        const entry = entries[entryIdx];
        const startScore = entryIdx * scoresPerEntry;
        const endScore = (entryIdx === entries.length - 1) ? allScores.length : (entryIdx + 1) * scoresPerEntry;
        const entryScores = allScores.slice(startScore, endScore);
        
        // Zip with reference sections
        for (let secIdx = 0; secIdx < Math.min(referenceSections.length, entryScores.length); secIdx++) {
          records.push({
            annee: 2023,
            codeOrientation: entry.code,
            establishment_name: entry.institution,
            specialty_name: entry.specialty,
            sectionBac: referenceSections[secIdx],
            scoreDernierAdmis: entryScores[secIdx]
          });
        }
        
        // Flag if section-score mismatch
        if (entryScores.length !== referenceSections.length) {
          reviews.push({
            codeOrientation: entry.code,
            establishment_name: entry.institution,
            specialty_name: entry.specialty,
            issue: 'score_section_count_mismatch',
            sectionsExpected: referenceSections.length,
            scoresFound: entryScores.length,
            scores: entryScores
          });
        }
      }
    } else {
      // Significant mismatch
      reviews.push({
        issue: 'critical_alignment_mismatch',
        entriesCount: entries.length,
        expectedScores: expectedScores,
        actualScores: allScores.length,
        difference: allScores.length - expectedScores,
        tolerance: tolerance,
        message: 'Score-entry alignment failed; scores and entries do not match'
      });
    }
  }
  
  return { records, reviews };
}

function isCode(text) {
  // Check by length and numeric pattern because regex fails on encoded text
  if (text.length !== 5) return false;
  let allDigits = true;
  for (let j = 0; j < text.length; j++) {
    const c = text.charCodeAt(j);
    // ASCII digits 48-57
    if (c < 48 || c > 57) {
      allDigits = false;
      break;
    }
  }
  return allDigits;
}

function isValidSection(text) {
  const validSections = [
    'آداب', 'رياضيات', 'علوم تجريبية', 'إقتصاد وتصرف',
    'علوم الإعلامية', 'العلوم التقنية', 'رياضة'
  ];
  
  return validSections.includes(text);
}

function isValidScore2023(text) {
  // Check if it looks like a score (2 or 3 digits, dot, 2-4 decimal places)
  // Must be between 50-200ish
  const pattern = /^\d{2,3}\.\d{2,4}$/;
  if (!pattern.test(text)) {
    return false;
  }
  const num = parseFloat(text.replace(',', '.'));
  return !isNaN(num) && num > 40 && num < 250;
}

extractScores().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
