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
    
    const { records, reviews } = parseAdmissionDataBySection(data.text);
    
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

function parseAdmissionDataBySection(text) {
  const allLines = text.split('\n').map(l => l.trim()).filter(l => l);
  const records = [];
  const reviews = [];
  
  let currentInstitution = '';
  
  let i = 0;
  while (i < allLines.length) {
    const line = allLines[i];
    
    // Skip page numbers and empty markers
    if (/^\d+$/.test(line) || line === '' || line === 'FG+AR') {
      i++;
      continue;
    }
    
    // Skip year marker
    if (line === '2023') {
      i++;
      continue;
    }
    
    // Skip numeric only lines (likely capacity or index numbers)
    if (/^\d+$/.test(line)) {
      i++;
      continue;
    }
    
    // Code block - collect entire code section
    if (/^\d{5}$/.test(line)) {
      const code = line;
      const specialties = [];
      let currentSections = [];
      let currentScores = [];
      
      i++;
      
      // Collect all specialties for this code until we hit next code or institution marker
      while (i < allLines.length) {
        const nextLine = allLines[i];
        
        // Stop conditions - next code
        if (/^\d{5}$/.test(nextLine)) {
          break;
        }
        
        // Specialty name pattern - some special institutional text
        if (isSpecialtyName(nextLine)) {
          specialties.push(nextLine);
          i++;
        } else if (isValidScore(nextLine) || isValidSection(nextLine) || nextLine === '-' || 
                   nextLine === 'FG+AR' || /^\d+$/.test(nextLine)) {
          // Skip scores, sections, dash, FG+AR, and numeric lines for now
          i++;
        } else {
          // Might be an institution or other structure
          if (nextLine.includes('كلية') || nextLine.includes('معهد') || nextLine.includes('جامعة')) {
            currentInstitution = nextLine;
          }
          i++;
        }
      }
      
      // Now collect sections and scores that follow this code block
      let blockSections = [];
      let blockScores = [];
      
      while (i < allLines.length) {
        const nextLine = allLines[i];
        
        // Stop at next code
        if (/^\d{5}$/.test(nextLine)) {
          break;
        }
        
        if (isValidSection(nextLine)) {
          blockSections.push(nextLine);
          i++;
        } else if (isValidScore(nextLine)) {
          blockScores.push(parseFloat(nextLine.replace(',', '.')));
          i++;
        } else if (nextLine === '-' || nextLine === 'FG+AR') {
          // Skip dash and FG+AR
          i++;
        } else if (/^\d+$/.test(nextLine)) {
          // Skip numeric-only lines
          i++;
        } else {
          i++;
        }
      }
      
      // Distribute sections and scores across specialties
      if (specialties.length > 0 && blockSections.length > 0 && blockScores.length > 0) {
        distributeAcrossSpecialties(code, specialties, currentInstitution,
          blockSections, blockScores, records, reviews);
      } else if (specialties.length > 0) {
        // No sections or scores found - flag for review
        reviews.push({
          codeOrientation: code,
          specialty_names: specialties,
          issue: 'no_sections_or_scores',
          sectionCount: blockSections.length,
          scoreCount: blockScores.length
        });
      }
      
      continue;
    }
    
    // Track institutions for context
    if (line.includes('كلية') || line.includes('معهد') || line.includes('جامعة')) {
      currentInstitution = line;
    }
    
    i++;
  }
  
  return { records, reviews };
}

function isSpecialtyName(text) {
  return text.includes('الإجازة') || text.includes('اجازة') || text.includes('دبلوم') || 
         text.includes('ماستر') || text.includes('شهادة') || text.includes('درجة');
}

function distributeAcrossSpecialties(code, specialties, institution, sections, scores, records, reviews) {
  const numSpecialties = specialties.length;
  const numSections = sections.length;
  const numScores = scores.length;
  
  // Calculate how many sections/scores per specialty
  const sectionsPerSpec = Math.floor(numSections / numSpecialties);
  const scoresPerSpec = Math.floor(numScores / numSpecialties);
  
  // Check alignment
  if (sectionsPerSpec !== scoresPerSpec) {
    // Misalignment - send to review
    reviews.push({
      codeOrientation: code,
      establishment_name: institution,
      specialties: specialties,
      issue: 'sections_scores_per_specialty_mismatch',
      sectionsPerSpecialty: sectionsPerSpec,
      scoresPerSpecialty: scoresPerSpec,
      totalSections: numSections,
      totalScores: numScores,
      totalSpecialties: numSpecialties
    });
  }
  
  // Distribute records
  for (let specIdx = 0; specIdx < numSpecialties; specIdx++) {
    const specialty = specialties[specIdx];
    
    const secStart = specIdx * sectionsPerSpec;
    const secEnd = secStart + sectionsPerSpec;
    const specSections = sections.slice(secStart, secEnd);
    
    const scoreStart = specIdx * scoresPerSpec;
    const scoreEnd = scoreStart + scoresPerSpec;
    const specScores = scores.slice(scoreStart, scoreEnd);
    
    // Create records for matched pairs
    const pairCount = Math.min(specSections.length, specScores.length);
    for (let i = 0; i < pairCount; i++) {
      records.push({
        annee: 2023,
        codeOrientation: code,
        establishment_name: institution,
        specialty_name: specialty,
        sectionBac: specSections[i],
        scoreDernierAdmis: specScores[i]
      });
    }
    
    // Flag if unmatched
    if (specSections.length !== specScores.length) {
      reviews.push({
        codeOrientation: code,
        establishment_name: institution,
        specialty_name: specialty,
        issue: 'specialty_section_score_mismatch',
        sectionsCount: specSections.length,
        scoresCount: specScores.length
      });
    }
  }
}

function isValidSection(text) {
  const validSections = [
    'آداب', 'رياضيات', 'علوم تجريبية', 'إقتصاد وتصرف',
    'علوم الإعلامية', 'العلوم التقنية', 'رياضة', 'تقنيات',
    'إقتصاد وإدارة', 'علوم الاقتصاد', 'ع. الحاسوب', 'علوم',
    'ع. الحاسوب', 'هندسة', 'رياضيات', 'علوم حاسوب'
  ];
  
  return validSections.some(s => text === s || text.includes(s));
}

function isValidScore(text) {
  if (!/^\d+([.,]\d+)?$/.test(text)) {
    return false;
  }
  const num = parseFloat(text.replace(',', '.'));
  return !isNaN(num) && num > 0 && num < 1000;
}

extractScores().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
