import * as fs from 'fs';
import * as path from 'path';

interface GroupedRecord {
  sourcePageRange: string;
  sourceLines: string[];
  codeOrientationCandidate: string;
  formuleBruteCandidate: string;
  sectionBacCandidate: string;
  scoreReferenceCandidate: string;
  institutionTextCandidate: string;
  specialiteTextCandidate: string | null;
  confidence: string;
  reviewReason: string;
}

interface Specialty {
  codeOrientation: string;
  nom: string;
  formuleBrute: string;
}

interface Score {
  annee: number;
  codeOrientation: string;
  sectionBac: string;
  scoreDernierAdmis: number;
}

interface ReviewCase {
  codeOrientation: string;
  issue: string;
  data: Partial<GroupedRecord>;
}

// Arabic section names we expect
const EXPECTED_SECTIONS = [
  'رياضيات',
  'علوم تجريبية',
  'إقتصاد وتصرف',
  'علوم الإعلامية',
  'العلوم التقنية',
  'رياضة',
  'تقنيات مختلطة',
  'الشعب الأخرى'
];

function isNumericScore(str: string): boolean {
  // Check if it matches pattern like "130,941" or "130941"
  return /^\d+,?\d*$/.test(str.trim());
}

function parseScore(scoreStr: string): number | null {
  const cleaned = scoreStr.trim().replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function isFormula(str: string): boolean {
  return /^FG\+\s*\w+$/.test(str.trim());
}

function isSectionName(str: string): boolean {
  const trimmed = str.trim();
  // Check if it looks like an Arabic section name
  return EXPECTED_SECTIONS.some(s => trimmed.includes(s)) || 
         /[ء-ي]/.test(trimmed); // Contains Arabic
}

function extractSpecialtyName(record: GroupedRecord): string {
  // Use the sectionBacCandidate which contains the specialty description
  let name = record.sectionBacCandidate?.trim() || 'Unknown';
  
  // Remove obvious noise patterns
  // Remove trailing section names that appear as part of the extraction noise
  name = name.replace(/\s+(رياضيات|علوم تجريبية|إقتصاد وتصرف|علوم الإعلامية|العلوم التقنية)$/g, '');
  
  // Remove leading/trailing duration or code-like patterns
  name = name.replace(/^\d+\s+سنوات.*?\)\s*/g, '');
  name = name.replace(/\s*\([^)]*امد[^)]*\)\s*/g, ' ');
  
  // Clean up excess spaces
  name = name.replace(/\s+/g, ' ').trim();
  
  // Limit length
  name = name.substring(0, 120);
  
  return name || 'Unknown Specialty';
}

function extractSectionScorePairs(sourceLines: string[]): Array<{section: string; score: number | null; rawScore: string}> {
  const pairs: Array<{section: string; score: number | null; rawScore: string}> = [];
  
  // Skip first line (code) and text lines at the beginning
  let i = 1;
  while (i < sourceLines.length && !isFormula(sourceLines[i])) {
    i++;
  }
  
  // Now we should be at formulas
  while (i < sourceLines.length) {
    const current = sourceLines[i];
    
    // Skip noise lines (headers, table info, etc)
    if (current.includes('مجموع') || 
        current.includes('صيغة احتساب') ||
        current.includes('الإجازة') ||
        current.includes('نوع البكالوريا') ||
        current === '2024' ||
        /^[ن0-9]{1,5}$/.test(current)) {
      i++;
      continue;
    }
    
    if (isFormula(current)) {
      // Next should be section name or score
      if (i + 1 < sourceLines.length) {
        const next = sourceLines[i + 1];
        
        if (isSectionName(next)) {
          let section = next.trim();
          
          // Clean up section name: remove duration/duration info and extra spaces
          // Pattern: "3   سنوات    (امد)       رياضيات" -> "رياضيات"
          section = section.replace(/^\d+\s+سنوات\s+\([^)]*\)\s+/g, '').trim();
          
          // Next should be score
          if (i + 2 < sourceLines.length) {
            const scoreStr = sourceLines[i + 2].trim();
            
            if (isNumericScore(scoreStr)) {
              const scoreNum = parseScore(scoreStr);
              pairs.push({
                section,
                score: scoreNum,
                rawScore: scoreStr
              });
              i += 3; // Skip formula, section, score
              continue;
            }
          }
        } else if (isNumericScore(next)) {
          // Sometimes score comes right after formula
          const scoreNum = parseScore(next);
          // The section should be the next line
          if (i + 2 < sourceLines.length) {
            let possibleSection = sourceLines[i + 2].trim();
            if (isSectionName(possibleSection)) {
              // Clean up section name
              possibleSection = possibleSection.replace(/^\d+\s+سنوات\s+\([^)]*\)\s+/g, '').trim();
              pairs.push({
                section: possibleSection,
                score: scoreNum,
                rawScore: next.trim()
              });
              i += 3;
              continue;
            }
          }
        }
      }
    }
    
    i++;
  }
  
  return pairs;
}

function normalize(): void {
  // Read source file
  const inputPath = path.join(__dirname, '../../data/extracted/2025/guide2025.grouped.sample.json');
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  
  const specialties: Map<string, Specialty> = new Map();
  const scores: Score[] = [];
  const reviewCases: ReviewCase[] = [];
  
  for (const record of data) {
    const code = record.codeOrientationCandidate?.toString().trim();
    const formula = record.formuleBruteCandidate?.toString().trim() || 'Unknown';
    
    if (!code || !/^\d{5}$/.test(code)) {
      reviewCases.push({
        codeOrientation: code || 'MISSING',
        issue: 'Invalid or missing codeOrientation',
        data: record
      });
      continue;
    }
    
    // Add to specialties
    if (!specialties.has(code)) {
      const nom = extractSpecialtyName(record);
      specialties.set(code, {
        codeOrientation: code,
        nom,
        formuleBrute: formula
      });
    }
    
    // Extract section-score pairs
    const pairs = extractSectionScorePairs(record.sourceLines);
    
    if (pairs.length === 0) {
      reviewCases.push({
        codeOrientation: code,
        issue: 'No section-score pairs found in sourceLines',
        data: record
      });
    } else {
      for (const pair of pairs) {
        if (pair.score === null) {
          reviewCases.push({
            codeOrientation: code,
            issue: `Invalid score format: "${pair.rawScore}" for section: "${pair.section}"`,
            data: {codeOrientationCandidate: code, sectionBacCandidate: pair.section}
          });
        } else {
          scores.push({
            annee: 2024,
            codeOrientation: code,
            sectionBac: pair.section,
            scoreDernierAdmis: pair.score
          });
        }
      }
    }
  }
  
  // Write outputs
  const baseDir = path.join(__dirname, '../../data/normalized');
  const reviewDir = path.join(__dirname, '../../data/review');
  
  // Create directories if needed
  if (!fs.existsSync(path.join(baseDir, '2025'))) {
    fs.mkdirSync(path.join(baseDir, '2025'), { recursive: true });
  }
  if (!fs.existsSync(path.join(baseDir, '2024'))) {
    fs.mkdirSync(path.join(baseDir, '2024'), { recursive: true });
  }
  if (!fs.existsSync(reviewDir)) {
    fs.mkdirSync(reviewDir, { recursive: true });
  }
  
  // Write specialties
  const specialtiesArray = Array.from(specialties.values());
  fs.writeFileSync(
    path.join(baseDir, '2025/specialties_base.sample.json'),
    JSON.stringify(specialtiesArray, null, 2)
  );
  
  // Write scores
  fs.writeFileSync(
    path.join(baseDir, '2024/scores_2024_reference.sample.json'),
    JSON.stringify(scores, null, 2)
  );
  
  // Write review cases
  fs.writeFileSync(
    path.join(reviewDir, 'guide2025.normalization.review.json'),
    JSON.stringify(reviewCases, null, 2)
  );
  
  // Console output
  console.log('\n✓ Normalization complete');
  console.log(`  Specialties: ${specialtiesArray.length} records`);
  console.log(`  Scores: ${scores.length} records`);
  console.log(`  Review cases: ${reviewCases.length} cases`);
  
  // Sample specialties
  console.log('\n--- Specialty Samples (first 5) ---');
  specialtiesArray.slice(0, 5).forEach((s, i) => {
    console.log(`${i+1}. ${s.codeOrientation}: ${s.nom.substring(0, 60)}...`);
  });
  
  // Sample scores
  console.log('\n--- Score Samples (first 5) ---');
  scores.slice(0, 5).forEach((s, i) => {
    console.log(`${i+1}. [${s.codeOrientation}] ${s.sectionBac}: ${s.scoreDernierAdmis}`);
  });
  
  // Review summary
  console.log('\n--- Review Cases Summary ---');
  const issueTypes = new Map<string, number>();
  for (const rc of reviewCases) {
    const issue = rc.issue.substring(0, 50);
    issueTypes.set(issue, (issueTypes.get(issue) || 0) + 1);
  }
  for (const [issue, count] of issueTypes.entries()) {
    console.log(`  ${count}x: ${issue}...`);
  }
}

normalize();
