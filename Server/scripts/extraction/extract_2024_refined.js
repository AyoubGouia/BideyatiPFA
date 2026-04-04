const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function extractScores() {
  const pdfPath = path.join(__dirname, '../../data/raw/score2024.pdf');
  
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
    
    const { records, reviews } = parseGuideFormat2024(data.text);
    
    console.log(`\n✓ Extracted ${records.length} records with section alignment`);
    console.log(`✓ Flagged ${reviews.length} records for review\n`);
    
    if (records.length > 0) {
      console.log('Sample records (first 10):');
      records.slice(0, 10).forEach((r, i) => {
        console.log(`${i+1}. [${r.codeOrientation}] ${r.specialty_name.substring(0, 25).padEnd(25)} | ${r.sectionBac.padEnd(15)} | ${r.scoreDernierAdmis}`);
      });
    }
    
    // Write normalized output
    const normDir = path.join(__dirname, '../../data/normalized/2024');
    fs.mkdirSync(normDir, { recursive: true });
    
    const normPath = path.join(normDir, 'scores_2024_reference.by_section.json');
    fs.writeFileSync(normPath, JSON.stringify(records, null, 2), 'utf8');
    console.log(`\n✓ Output written to: ${normPath}`);
    
    // Write review output if any
    if (reviews.length > 0) {
      const reviewDir = path.join(__dirname, '../../data/review');
      fs.mkdirSync(reviewDir, { recursive: true });
      
      const reviewPath = path.join(reviewDir, 'scores_2024_reference.by_section.review.json');
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

function parseGuideFormat2024(text) {
  const records = [];
  const reviews = [];
  
  const allLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const referenceSections = [
    'آداب', 'رياضيات', 'علوم تجريبية', 'إقتصاد وتصرف',
    'علوم الإعلامية', 'العلوم التقنية', 'رياضة'
  ];
  
  // 2024 structure:
  // 1. Institution (معهد/كلية line(s))
  // 2. Specialty name (noticeable by being after institution, before code)
  // 3. Code (5 digits)
  // 4. Section/Formula/Score triplets (7 sets, with sections always in standard order)
  
  let i = 0;
  
  while (i < allLines.length) {
    const line = allLines[i];
    
    // Look for institution start
    const isInstitution = (line.includes('معهد') || line.includes('كلية')) &&
                          !line.includes('الشعبة') &&
                          !line.includes('التخصصات');
    
    if (!isInstitution) {
      i++;
      continue;
    }
    
    // Collect institution line(s)
    let institution = line;
    i++;
    
    // If next line is continuation of institution (جامعة marker), include it
    if (i < allLines.length && allLines[i].includes('جامعة')) {
      institution += ' ' + allLines[i];
      i++;
    }
    
    // Next line should be specialty name
    if (i >= allLines.length) break;
    const specialty = allLines[i];
    
    // Check if it looks like a specialty (not a code, not a section)
    if (isCode(specialty) || isValidSection(specialty)) {
      i++;
      continue;
    }
    
    // Skip this line - specialty detected
    i++;
    
    // Next line must be code
    if (i >= allLines.length || !isCode(allLines[i])) {
      continue;
    }
    
    const code = allLines[i];
    i++;
    
    // Now collect 7 section triplets
    const sections = [];
    const scores = [];
    let tripletCount = 0;
    let hitHeader = false;
    
    while (tripletCount < 7 && i < allLines.length) {
      // Line 1: Section name
      if (isValidSection(allLines[i])) {
        sections.push(allLines[i]);
        i++;
        
        // Line 2: Formula (skip, or might be FG+Ang, FG+F, etc.)
        if (i < allLines.length && (allLines[i].startsWith('FG+') || allLines[i] === 'FG+F')) {
          i++;
        } else if (i < allLines.length && allLines[i].startsWith('Max(')) {
          // Alternative formula format
          i++;
        } else {
          // No formula line - this breaks the pattern
          break;
        }
        
        // Line 3: Score
        if (i < allLines.length) {
          const scoreLine = allLines[i];
          if (scoreLine === '-' || scoreLine === '') {
            scores.push(null);
          } else if (isValidScore2024(scoreLine)) {
            scores.push(parseFloat(scoreLine.replace(',', '.')));
          } else if (scoreLine.includes('الآداب')) {
            // Hit next section/category header
            hitHeader = true;
            sections.pop(); // Remove the last section since we didn't complete it
            break;
          } else {
            scores.push(null);
          }
          i++;
        }
        
        tripletCount++;
      } else if (allLines[i].includes('الآداب واللغات')) {
        // Hit category header
        hitHeader = true;
        break;
      } else {
        // Not a section - end of this entry
        break;
      }
    }
    
    // Create records for this code/specialty
    if (sections.length > 0 && scores.length > 0) {
      const validCount = scores.filter(s => s !== null).length;
      
      if (validCount > 0) {
        for (let secIdx = 0; secIdx < sections.length && secIdx < scores.length; secIdx++) {
          if (scores[secIdx] !== null) {
            records.push({
              annee: 2024,
              codeOrientation: code,
              establishment_name: institution.trim(),
              specialty_name: specialty.trim(),
              sectionBac: sections[secIdx],
              scoreDernierAdmis: scores[secIdx]
            });
          }
        }
      }
      
      // Flag issues
      if (sections.length !== scores.length) {
        reviews.push({
          codeOrientation: code,
          establishment_name: institution,
          specialty_name: specialty,
          issue: 'section_score_count_mismatch',
          sections: sections.length,
          scores: scores.length
        });
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

function isValidSection(text) {
  const sections = [
    'آداب', 'رياضيات', 'علوم تجريبية', 'إقتصاد وتصرف',
    'علوم الإعلامية', 'العلوم التقنية', 'رياضة'
  ];
  return sections.includes(text);
}

function isValidScore2024(text) {
  // Allow both dot and comma as decimal separator
  const pattern = /^\d{2,3}[.,]\d{3,4}$/;
  if (!pattern.test(text)) return false;
  const num = parseFloat(text.replace(',', '.'));
  return !isNaN(num) && num > 40 && num < 250;
}

extractScores().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
