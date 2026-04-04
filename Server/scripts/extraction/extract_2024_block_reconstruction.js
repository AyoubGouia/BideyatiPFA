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
    
    const { records, reviews, stats } = parseBlockReconstruction2024(data.text);
    
    console.log(`\n✓ Extracted ${records.length} records`);
    console.log(`✓ Flagged ${reviews.length} records for review\n`);
    
    if (records.length > 0) {
      console.log('Sample records (first 10):');
      records.slice(0, 10).forEach((r, i) => {
        console.log(`${i+1}. [${r.codeOrientation}] ${r.establishment_name.substring(0, 20).padEnd(20)} | ${r.specialty_name.substring(0, 20).padEnd(20)} | ${r.sectionBac.padEnd(15)} | ${r.scoreDernierAdmis}`);
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
    console.log(`  Blocks processed: ${stats.blocksProcessed}`);
    console.log(`  Sections extracted per block: ${stats.avgSectionsPerBlock.toFixed(2)}`);
    console.log(`  Extracted rows: ${records.length}`);
    console.log(`  Review rows: ${reviews.length}`);
    console.log(`  Total codes found: ${stats.codesFound}`);
    console.log(`  Unique specialties: ${stats.uniqueSpecialties}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function parseBlockReconstruction2024(text) {
  const records = [];
  const reviews = [];
  
  const allLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const referenceSections = [
    'آداب', 'رياضيات', 'علوم تجريبية', 'إقتصاد وتصرف',
    'علوم الإعلامية', 'العلوم التقنية', 'رياضة'
  ];
  
  const stats = {
    blocksProcessed: 0,
    totalSectionsExtracted: 0,
    codesFound: 0,
    uniqueSpecialties: new Set()
  };
  
  // STEP 1: Find all code positions (same as 2023 approach)
  const codePositions = [];
  for (let i = 0; i < allLines.length; i++) {
    if (isCode(allLines[i])) {
      codePositions.push({ idx: i, code: allLines[i] });
    }
  }
  
  console.log(`Found ${codePositions.length} code occurrences\n`);
  stats.codesFound = codePositions.length;
  
  // STEP 2: Group codes into blocks (by proximity - if codes are <30 lines apart, same block)
  const blocks = groupCodesIntoBlocks(codePositions, allLines, 30);
  console.log(`Grouped into ${blocks.length} logical blocks\n`);
  
  // STEP 3: Process each block
  blocks.forEach(block => {
    const blockRecords = processBlock(block, allLines, referenceSections, stats);
    records.push(...blockRecords.records);
    reviews.push(...blockRecords.reviews);
    stats.blocksProcessed++;
    stats.totalSectionsExtracted += blockRecords.sectionCount;
  });
  
  stats.avgSectionsPerBlock = stats.blocksProcessed > 0 
    ? stats.totalSectionsExtracted / stats.blocksProcessed 
    : 0;
  stats.uniqueSpecialties = stats.uniqueSpecialties.size;
  
  return { records, reviews, stats };
}

function groupCodesIntoBlocks(codePositions, allLines, proximityThreshold) {
  if (codePositions.length === 0) return [];
  
  const blocks = [];
  let currentBlock = [codePositions[0]];
  
  for (let i = 1; i < codePositions.length; i++) {
    const prev = codePositions[i - 1];
    const curr = codePositions[i];
    
    // If codes are close together, same block; otherwise new block
    if (curr.idx - prev.idx <= proximityThreshold) {
      currentBlock.push(curr);
    } else {
      blocks.push(currentBlock);
      currentBlock = [curr];
    }
  }
  blocks.push(currentBlock);
  
  return blocks;
}

function processBlock(block, allLines, referenceSections, stats) {
  const records = [];
  const reviews = [];
  let sectionCount = 0;
  
  // For each code in this block, extract surrounding context
  block.forEach(codeItem => {
    const codeIdx = codeItem.idx;
    const code = codeItem.code;
    
    // Search backward for establishment (معهد/كلية)
    let establishment = '';
    for (let j = codeIdx - 1; j >= Math.max(0, codeIdx - 15); j--) {
      if ((allLines[j].includes('معهد') || allLines[j].includes('كلية')) &&
          !allLines[j].includes('الشعبة')) {
        establishment = allLines[j];
        
        // Check if next line continues institution (جامعة)
        if (j + 1 < codeIdx && allLines[j + 1].includes('جامعة')) {
          establishment += ' ' + allLines[j + 1];
        }
        break;
      }
    }
    
    // Search forward for specialty (next non-code, non-section line)
    let specialty = '';
    for (let j = codeIdx - 5; j < codeIdx; j++) {
      if (j >= 0 && !isCode(allLines[j]) && !referenceSections.includes(allLines[j])) {
        const candidate = allLines[j];
        // Skip if it's a formula line or number-like
        if (!candidate.startsWith('FG+') && !/^Max\(/.test(candidate) && 
            !/^\d+$/.test(candidate) && candidate.length > 3) {
          specialty = candidate;
          break;
        }
      }
    }
    
    if (!specialty) {
      // Try searching forward instead
      for (let j = codeIdx + 1; j < Math.min(allLines.length, codeIdx + 10); j++) {
        if (!isCode(allLines[j]) && !referenceSections.includes(allLines[j])) {
          const candidate = allLines[j];
          if (!candidate.startsWith('FG+') && !/^Max\(/.test(candidate) && 
              !/^\d+$/.test(candidate) && candidate.length > 3) {
            specialty = candidate;
            break;
          }
        }
      }
    }
    
    if (!establishment || !specialty) {
      return; // Skip incomplete entries
    }
    
    // STEP 4: Extract all sections and scores from after the code
    const sections = [];
    const scores = [];
    
    // Search forward from code for sections and scores
    let searchEnd = Math.min(allLines.length, codeIdx + 50);
    for (let j = codeIdx + 1; j < searchEnd; j++) {
      const line = allLines[j];
      
      // Stop if we hit next code or institution header
      if (isCode(line) || line.includes('الآداب واللغات')) {
        break;
      }
      
      // Check if this is a section
      if (referenceSections.includes(line)) {
        sections.push(line);
        
        // Look for associated score in next 3 lines
        let foundScore = false;
        for (let k = j + 1; k < Math.min(searchEnd, j + 4); k++) {
          if (isValidScore2024(allLines[k])) {
            scores.push(parseFloat(allLines[k].replace(',', '.')));
            foundScore = true;
            break;
          } else if (allLines[k] === '-') {
            scores.push(null);
            foundScore = true;
            break;
          }
        }
        
        if (!foundScore && !isCode(allLines[j + 1]) && !allLines[j + 1].startsWith('FG+')) {
          // No score found - might be missing
          scores.push(null);
        }
      }
    }
    
    // STEP 5: Create records for aligned section-score pairs
    if (sections.length > 0) {
      // Zip sections with scores (only confident pairs)
      const minLen = Math.min(sections.length, scores.length);
      
      for (let s = 0; s < minLen; s++) {
        if (scores[s] !== null) {
          records.push({
            annee: 2024,
            codeOrientation: code,
            establishment_name: establishment.trim(),
            specialty_name: specialty.trim(),
            sectionBac: sections[s],
            scoreDernierAdmis: scores[s]
          });
          stats.uniqueSpecialties.add(specialty.trim());
          sectionCount++;
        }
      }
      
      // Flag mismatches to review
      if (sections.length !== scores.length) {
        reviews.push({
          codeOrientation: code,
          establishment_name: establishment.trim(),
          specialty_name: specialty.trim(),
          issue: 'section_score_count_mismatch',
          sections_found: sections.length,
          scores_found: scores.filter(s => s !== null).length,
          sections: sections
        });
      }
    }
  });
  
  return { records, reviews, sectionCount };
}

function isCode(text) {
  if (text.length !== 5) return false;
  for (let j = 0; j < 5; j++) {
    const c = text.charCodeAt(j);
    if (c < 48 || c > 57) return false;
  }
  return true;
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
