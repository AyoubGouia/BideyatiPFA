const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function extractScores() {
  const pdfPath = path.join(__dirname, '../../data/raw/score2025.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF not found: ${pdfPath}`);
    process.exit(1);
  }
  
  try {
    console.log(`Reading PDF: ${pdfPath}\n`);
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(pdfBuffer);
    
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
    const normDir = path.join(__dirname, '../../data/normalized/2025');
    fs.mkdirSync(normDir, { recursive: true });
    
    const normPath = path.join(normDir, 'scores_2025.by_section.json');
    fs.writeFileSync(normPath, JSON.stringify(records, null, 2), 'utf8');
    console.log(`\n✓ Output written to: ${normPath}`);
    
    // Write review output if any
    if (reviews.length > 0) {
      const reviewDir = path.join(__dirname, '../../data/review');
      fs.mkdirSync(reviewDir, { recursive: true });
      
      const reviewPath = path.join(reviewDir, 'scores_2025.by_section.review.json');
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
  let currentCity = '';
  
  let i = 0;
  while (i < allLines.length) {
    const line = allLines[i];
    
    // Skip page headers
    if (line === '2025' || /^\d+\s*-\s*\d+$/.test(line)) {
      i++;
      continue;
    }
    
    // Institution header
    if (line.includes('جامعة') || line.includes('المعهد') || line.includes('كلية')) {
      currentInstitution = line;
      currentCity = extractCity(line);
      i++;
      continue;
    }
    
    // Code block - collect entire code section
    if (/^\d{5}$/.test(line)) {
      const code = line;
      const specialties = [];
      const sectionsByGroup = [];
      const scoresByGroup = [];
      
      i++;
      
      // Collect all specialties for this code
      while (i < allLines.length && 
             (line.includes('الإجازة') || line.includes('اجازة') || line.includes('دبلوم') || 
              line.includes('ماستر') || (i < allLines.length && 
             (allLines[i].includes('الإجازة') || allLines[i].includes('اجازة') || 
              allLines[i].includes('دبلوم') || allLines[i].includes('ماستر'))))) {
        
        const nextLine = allLines[i];
        if (nextLine.includes('الإجازة') || nextLine.includes('اجازة') || nextLine.includes('دبلوم') || nextLine.includes('ماستر')) {
          specialties.push(nextLine);
          i++;
        } else {
          break;
        }
      }
      
      // Collect sections and scores for this entire code block
      let currentSections = [];
      let currentScores = [];
      
      while (i < allLines.length) {
        const nextLine = allLines[i];
        
        // Stop conditions - next code or institution
        if (/^\d{5}$/.test(nextLine) || 
            nextLine.includes('جامعة') || nextLine.includes('المعهد') || nextLine.includes('كلية')) {
          break;
        }
        
        // Section group header
        if (nextLine === 'الشعبة' || nextLine.includes('الشعبة')) {
          i++;
          
          // Collect sections for this group
          while (i < allLines.length) {
            const secLine = allLines[i];
            
            if (secLine === 'المجموع' || secLine.includes('الباكالوريا') ||
                secLine === 'الشعبة' || secLine.includes('الشعبة') ||
                /^\d{5}$/.test(secLine) ||
                secLine.includes('جامعة') || secLine.includes('المعهد') || secLine.includes('كلية')) {
              break;
            }
            
            if (isValidSection(secLine)) {
              currentSections.push(secLine);
            }
            
            i++;
          }
          
          continue;
        }
        
        // Score group header
        if (nextLine === 'المجموع' || nextLine.includes('الباكالوريا')) {
          i++;
          
          // Collect scores for this group
          while (i < allLines.length) {
            const scoreLine = allLines[i];
            
            if (/^\d{5}$/.test(scoreLine) ||
                scoreLine.includes('جامعة') || scoreLine.includes('المعهد') || scoreLine.includes('كلية') ||
                scoreLine.includes('الإجازة') || scoreLine.includes('اجازة') || scoreLine.includes('دبلوم') ||
                scoreLine === 'الشعبة' || scoreLine === 'المجموع') {
              break;
            }
            
            if (isValidScore(scoreLine)) {
              currentScores.push(parseFloat(scoreLine.replace(',', '.')));
            }
            
            i++;
          }
          
          continue;
        }
        
        i++;
      }
      
      // Now distribute collected sections and scores across specialties
      if (specialties.length > 0 && currentSections.length > 0 && currentScores.length > 0) {
        distributeAcrossSpecialties(code, specialties, currentInstitution, currentCity,
          currentSections, currentScores, records, reviews);
      } else if (specialties.length > 0) {
        // No sections or scores found - flag for review
        reviews.push({
          codeOrientation: code,
          establishment_name: currentInstitution,
          city: currentCity,
          specialties: specialties,
          issue: 'no_sections_or_scores',
          sectionCount: currentSections.length,
          scoreCount: currentScores.length
        });
      }
      
      continue;
    }
    
    i++;
  }
  
  return { records, reviews };
}

function distributeAcrossSpecialties(code, specialties, institution, city, sections, scores, records, reviews) {
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
      city: city,
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
        annee: 2025,
        codeOrientation: code,
        establishment_name: institution,
        city: city,
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
        city: city,
        specialty_name: specialty,
        issue: 'specialty_section_score_mismatch',
        sectionsCount: specSections.length,
        scoresCount: specScores.length,
        sections: specSections,
        scores: specScores
      });
    }
  }
}

function extractCity(institutionName) {
  const cityMap = {
    'بتونس': 'Tunis',
    'بمنوبة': 'Manouba',
    'بنابل': 'Nabeul',
    'بسوسة': 'Sousse',
    'بصفاقس': 'Sfax',
    'بقابس': 'Gafsa',
    'بمدنين': 'Medenine',
    'بقفصة': 'Gafsa',
    'بالقيروان': 'Kairouan',
    'ببنزرت': 'Bizerte',
    'ببئر الباي': 'Tunis',
    'بجندوبة': 'Jendouba',
    'بتالة': 'Tala',
    'بقبلي': 'Tataouine',
    'بدقة': 'Djerba',
    'بقرقنة': 'Kerkena',
    'بلمثلى': 'Lemta',
    'رادس': 'Rades',
    'بن عروس': 'Ben Arous',
    'أريانة': 'Ariana',
    'المنستير': 'Monastir',
    'القصرين': 'Kasserine',
    'الكاف': 'Kef',
    'بسليانة': 'Siliana',
    'بالكاف': 'Kef',
    'بالشرقية': 'Sfax',
    'بجربة': 'Djerba',
    'بالمهدية': 'Mahdia',
    'بسبيطلة': 'Sbeitla',
    'بقصر السعيد': 'Qsar alsaid',
    'ببرج السدرية': 'Borj Sedria',
    'بالمكنين': 'Manouba',
    'باجة': 'Beja',
    'بباجة': 'Beja',
    'الاعلامية': 'Tunis',
    'تكنولوجيات البيئة': 'Tunis',
    'التكنولوجيا': 'Tunis'
  };
  
  for (const [arabic, english] of Object.entries(cityMap)) {
    if (institutionName.includes(arabic)) {
      return english;
    }
  }
  
  return 'Unknown';
}

function isValidSection(text) {
  const validSections = [
    'آداب', 'رياضيات', 'علوم تجريبية', 'إقتصاد وتصرف',
    'علوم الإعلامية', 'العلوم التقنية', 'رياضة', 'تقنيات',
    'إقتصاد وإدارة', 'علوم الاقتصاد', 'ع. الحاسوب', 'علوم',
    'ع. الحاسوب', 'هندسة'
  ];
  
  return validSections.some(s => text === s || text.includes(s));
}

function isValidScore(text) {
  if (!/^\d+([.,]\d+)?$/.test(text)) {
    return false;
  }
  const num = parseFloat(text.replace(',', '.'));
  return !isNaN(num) && num > 0;
}

extractScores().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
