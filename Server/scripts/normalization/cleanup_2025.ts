import * as fs from 'fs';
import * as path from 'path';

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

interface ReviewItem {
  type: 'specialty' | 'score' | 'duplicate';
  codeOrientation: string;
  issue: string;
  data: any;
}

// Valid Tunisian bac sections (primary subjects)
const VALID_BAC_SECTIONS = [
  'رياضيات',
  'علوم تجريبية',
  'إقتصاد وتصرف',
  'علوم الإعلامية',
  'العلوم التقنية',
  'رياضة',
  'تقنيات مختلطة',
  'الشعب الأخرى'
];

function cleanSpecialtyName(nomRaw: string): string {
  let nom = nomRaw.trim();
  
  // Pattern 1: "الإجازة في X" - extract just this
  if (nom.startsWith('الإجازة')) {
    const match = nom.match(/^الإجازة\s+في\s+(\S+)/);
    if (match) {
      return match[0];
    }
  }
  
  // Pattern 2: "دبلوم في X"
  if (nom.startsWith('دبلوم')) {
    const match = nom.match(/^دبلوم\s+في\s+(\S+)/);
    if (match) {
      return match[0];
    }
  }
  
  // Pattern 3: Find category marker and take everything before it
  const categoryMarkerIdx = nom.indexOf('اللغة والآداب');
  if (categoryMarkerIdx > 5) {
    return nom.substring(0, categoryMarkerIdx).trim();
  }
  
  // Pattern 4: Stop at opening parenthesis
  const parenIdx = nom.indexOf('(');
  if (parenIdx > 5) {
    return nom.substring(0, parenIdx).trim();
  }
  
  // Default: normalize spacing
  return nom.replace(/\s+/g, ' ').trim();
}

function cleanSectionName(sectionRaw: string): { clean: string | null; isPolluted: boolean } {
  let section = sectionRaw.trim();
  
  // Check if it's a valid section
  if (VALID_BAC_SECTIONS.includes(section)) {
    return { clean: section, isPolluted: false };
  }
  
  // Check for pollution: specialty text mixed with section
  if (section.includes('-')) {
    // Extract substring after dash
    const parts = section.split('-');
    let lastPart = parts[parts.length - 1].trim();
    
    // Check if the last part is a valid section
    for (const valid of VALID_BAC_SECTIONS) {
      if (lastPart.endsWith(valid)) {
        // Extract just the section
        lastPart = lastPart.substring(lastPart.lastIndexOf(valid));
        return { clean: lastPart.trim(), isPolluted: true };
      }
    }
    
    // If we can't extract valid section, it's polluted and we can't clean
    return { clean: null, isPolluted: true };
  }
  
  // Check if it contains multiple words and one is a valid section
  const words = section.split(/\s+/);
  for (const word of words) {
    if (VALID_BAC_SECTIONS.includes(word)) {
      return { clean: word, isPolluted: true };
    }
  }
  
  // Not recognized
  return { clean: null, isPolluted: false };
}

function cleanup(): void {
  // Read input files
  const specPath = path.join(__dirname, '../../data/normalized/2025/specialties_base.sample.json');
  const scorePath = path.join(__dirname, '../../data/normalized/2024/scores_2024_reference.sample.json');
  
  const specialties: Specialty[] = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  const scores: Score[] = JSON.parse(fs.readFileSync(scorePath, 'utf-8'));
  
  const cleanedSpecialties: Map<string, Specialty> = new Map();
  const cleanedScores: Score[] = [];
  const review: ReviewItem[] = [];
  
  // CLEAN SPECIALTIES ===
  for (const spec of specialties) {
    const code = spec.codeOrientation;
    const clean = cleanSpecialtyName(spec.nom);
    
    // Flag if contains university/institution indicators
    const hasMarkers = clean.includes('(جامعة') || clean.includes('جامعة') || 
                       (clean.includes('اللغة والآداب') && !clean.startsWith('الإجازة')) || 
                       (clean.includes('آداب') && clean.length > 30);
    
    if (hasMarkers) {
      review.push({
        type: 'specialty',
        codeOrientation: code,
        issue: 'Contains university/category markers after cleaning',
        data: { original: spec.nom, cleaned: clean }
      });
    }
    
    cleanedSpecialties.set(code, {
      codeOrientation: code,
      nom: clean,
      formuleBrute: spec.formuleBrute
    });
  }
  
  // === CLEAN SCORES ===
  const scoresByKey: Map<string, Score[]> = new Map();
  
  for (const score of scores) {
    const { clean, isPolluted } = cleanSectionName(score.sectionBac);
    
    if (clean === null) {
      review.push({
        type: 'score',
        codeOrientation: score.codeOrientation,
        issue: 'Could not extract valid bac section: ' + score.sectionBac,
        data: score
      });
      continue;
    }
    
    if (isPolluted) {
      review.push({
        type: 'score',
        codeOrientation: score.codeOrientation,
        issue: 'Polluted section name cleaned from: ' + score.sectionBac + ' to: ' + clean,
        data: score
      });
    }
    
    // Track by (code, section, annee) for duplicate detection
    const key = `${score.codeOrientation}|${clean}|${score.annee}`;
    if (!scoresByKey.has(key)) {
      scoresByKey.set(key, []);
    }
    scoresByKey.get(key)!.push({
      ...score,
      sectionBac: clean
    });
  }
  
  // Handle duplicates
  for (const [key, records] of scoresByKey.entries()) {
    if (records.length === 1) {
      cleanedScores.push(records[0]);
    } else {
      // Duplicate found
      const [code, section] = key.split('|');
      
      // Check if all scores are identical
      const scores_set = new Set(records.map(r => r.scoreDernierAdmis));
      if (scores_set.size === 1) {
        // Same score, keep one
        cleanedScores.push(records[0]);
      } else {
        // Different scores - flag all as review
        for (const rec of records) {
          review.push({
            type: 'duplicate',
            codeOrientation: code,
            issue: `Duplicate (${code}, ${section}, 2024) with conflicting scores: ${records.map(r => r.scoreDernierAdmis).join(', ')}`,
            data: rec
          });
        }
      }
    }
  }
  
  // Write outputs
  const baseDir = path.join(__dirname, '../../data/normalized');
  const reviewDir = path.join(__dirname, '../../data/review');
  
  const specOutputPath = path.join(baseDir, '2025/specialties_base.cleaned.sample.json');
  const scoreOutputPath = path.join(baseDir, '2024/scores_2024_reference.cleaned.sample.json');
  const reviewOutputPath = path.join(reviewDir, 'guide2025.cleanup.review.json');
  
  fs.writeFileSync(specOutputPath, JSON.stringify(Array.from(cleanedSpecialties.values()), null, 2));
  fs.writeFileSync(scoreOutputPath, JSON.stringify(cleanedScores, null, 2));
  fs.writeFileSync(reviewOutputPath, JSON.stringify(review, null, 2));
  
  console.log('\n✓ Cleanup complete');
  console.log(`  Input specialties: ${specialties.length} → Output: ${cleanedSpecialties.size}`);
  console.log(`  Input scores: ${scores.length} → Output: ${cleanedScores.length}`);
  console.log(`  Items flagged for review: ${review.length}`);
  
  console.log('\n--- Cleaned Specialties (first 5) ---');
  Array.from(cleanedSpecialties.values()).slice(0, 5).forEach((s, i) => {
    console.log(`${i+1}. [${s.codeOrientation}] ${s.nom}`);
  });
  
  console.log('\n--- Cleaned Scores (first 5, no duplicates) ---');
  cleanedScores.slice(0, 5).forEach((s, i) => {
    console.log(`${i+1}. [${s.codeOrientation}] ${s.sectionBac}: ${s.scoreDernierAdmis}`);
  });
  
  console.log('\n--- Review Cases ---');
  const byType = new Map<string, ReviewItem[]>();
  for (const item of review) {
    if (!byType.has(item.type)) byType.set(item.type, []);
    byType.get(item.type)!.push(item);
  }
  for (const [type, items] of byType.entries()) {
    console.log(`  ${type}: ${items.length}`);
    items.slice(0, 2).forEach(item => {
      console.log(`    - [${item.codeOrientation}] ${item.issue}`);
    });
  }
  
  console.log('\n--- Output Files ---');
  console.log(`  ${specOutputPath}`);
  console.log(`  ${scoreOutputPath}`);
  console.log(`  ${reviewOutputPath}`);
}

cleanup();
