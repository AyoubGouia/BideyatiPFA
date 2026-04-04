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
  
  // 2024 structure: Institution + Specialty, then Code, then Section/Formula/Score triplets
  let i = 0;
  
  // Skip to first occurrence of score-like data (after initial guide content)
  while (i < allLines.length) {
    const pattern = /^\d{2,3}\.\d{2,4}$/;
    if (pattern.test(allLines[i])) {
      // Found first score - back up to find the start of this block
      break;
    }
    i++;
  }
  
  // Now scan forward looking for institution + specialty + code + sections pattern
  i = 0; // Reset to scan from beginning for institutions
  
  while (i < allLines.length) {
    const line = allLines[i];
    
    // Look for institution line (contains معهد, كلية, جامعة)
    const isInstitution = line.includes('معهد') || line.includes('كلية') || 
                          (line.includes('جامعة') && !line.includes('التخصصات'));
    
    if (!isInstitution) {
      i++;
      continue;
    }
    
    // Extract institution and specialty from this line or next lines
    let institution = '';
    let specialty = '';
    
    // Check if specialty is on same line as institution
    if ((line.includes('الإجازة') || line.includes('ماستر') || line.includes('دبلوم')) &&
        line.includes('الآداب')) {
      // Combined line like "المعهد العالي للغات بقابس (جامعة قابس) اللغة والآداب والحضارة"
      const parts = line.split('(');
      institution = parts[0].trim();
      specialty = line.substring(line.lastIndexOf(')')+1).trim();
      if (!specialty) specialty = line.substring(line.indexOf('جامعة')).trim();
    } else {
      institution = line;
      // Look for specialty next
      if (i + 1 < allLines.length) {
        const nextLine = allLines[i + 1];
        if (nextLine.includes('الآداب') || nextLine.includes('اللغة')) {
          specialty = nextLine;
          i++;
        }
      }
    }
    
    i++;
    
    // Look for code (5-digit number follow)
    if (i >= allLines.length || !isCode(allLines[i])) {
      continue;
    }
    
    const code = allLines[i];
    i++;
    
    // Now collect sections and their scores (7 triplets: section, formula, score)
    const sections = [];
    const scores = [];
    
    for (let secIdx = 0; secIdx < 7 && i < allLines.length; secIdx++) {
      // Line 1: Section name
      const sectionLine = allLines[i];
      if (!isValidSection(sectionLine)) {
        break; // Not a section - end of this block
      }
      sections.push(sectionLine);
      i++;
      
      // Line 2: Formula (skip)
      if (i < allLines.length && (allLines[i].startsWith('FG') || allLines[i] === 'FG+F')) {
        i++;
      }
      
      // Line 3: Score or "-"
      if (i < allLines.length) {
        const scoreLine = allLines[i];
        if (scoreLine === '-') {
          scores.push(null);  // Missing score
        } else if (isValidScore2024(scoreLine)) {
          scores.push(parseFloat(scoreLine.replace(',', '.')));
        } else {
          scores.push(null);
        }
        i++;
      }
    }
    
    // Create records for this code/specialty combination
    if (sections.length > 0 && scores.length > 0) {
      const validCount = scores.filter(s => s !== null).length;
      
      if (validCount > 0) {
        for (let secIdx = 0; secIdx < sections.length; secIdx++) {
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
      } else if (sections.length > 0) {
        // No scores - send to review
        reviews.push({
          codeOrientation: code,
          establishment_name: institution,
          specialty_name: specialty,
          issue: 'no_scores_found',
          sections: sections
        });
      }
      
      // Flag if mismatch
      if (sections.length !== 7) {
        reviews.push({
          codeOrientation: code,
          establishment_name: institution,
          specialty_name: specialty,
          issue: 'incomplete_section_count',
          found: sections.length,
          expected: 7
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
