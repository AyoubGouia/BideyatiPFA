const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function extractCapacities() {
  const pdfPath = path.join(__dirname, '../../data/raw/guide2025.pdf');
  
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
    
    const { records, reviews, stats } = parseCapacities2025(data.text);
    
    console.log(`\n✓ Extracted ${records.length} capacity records`);
    console.log(`✓ Flagged ${reviews.length} records for review\n`);
    
    if (records.length > 0) {
      console.log('Sample records (first 10):');
      records.slice(0, 10).forEach((r, i) => {
        console.log(`${i+1}. [${r.codeOrientation}] ${r.establishment_name.substring(0, 20).padEnd(20)} | ${r.specialty_name.substring(0, 20).padEnd(20)} | Capacity: ${r.capacite}`);
      });
    }
    
    // Write normalized output
    const normDir = path.join(__dirname, '../../data/normalized/2025');
    fs.mkdirSync(normDir, { recursive: true });
    
    const normPath = path.join(normDir, 'capacities_2025.json');
    fs.writeFileSync(normPath, JSON.stringify(records, null, 2), 'utf8');
    console.log(`\n✓ Output written to: ${normPath}`);
    
    // Write review output if any
    if (reviews.length > 0) {
      const reviewDir = path.join(__dirname, '../../data/review');
      fs.mkdirSync(reviewDir, { recursive: true });
      
      const reviewPath = path.join(reviewDir, 'capacities_2025.review.json');
      fs.writeFileSync(reviewPath, JSON.stringify(reviews, null, 2), 'utf8');
      console.log(`✓ Review written to: ${reviewPath}`);
    }
    
    console.log(`\nStatistics:`);
    console.log(`  Records extracted: ${records.length}`);
    console.log(`  Review items: ${reviews.length}`);
    console.log(`  Codes with valid capacity: ${stats.codesWithCapacity}`);
    console.log(`  Unique specialties: ${stats.uniqueSpecialties}`);
    if (stats.capacities.length > 0) {
      console.log(`  Capacity range: ${stats.minCapacity} - ${stats.maxCapacity}`);
      const avg = stats.capacities.reduce((a,b) => a+b) / stats.capacities.length;
      console.log(`  Average capacity: ${avg.toFixed(1)}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function parseCapacities2025(text) {
  const records = [];
  const reviews = [];
  
  const allLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const stats = {
    codesWithCapacity: 0,
    uniqueSpecialties: new Set(),
    capacities: [],
    minCapacity: Infinity,
    maxCapacity: 0
  };
  
  // Process line by line looking for code + capacity pairs
  let lastCode = null;
  let lastCapacity = null;
  let establishmentWindow = [];
  let inCodeBlock = false;
  
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    
    // Detect code
    if (isCode(line)) {
      // If we had a previous code with capacity, try to create record
      if (lastCode && lastCapacity !== null && establishmentWindow.length > 0) {
        const { establishment, specialty } = extractEstablishmentSpecialty(establishmentWindow, lastCapacity);
        
        if (establishment && specialty) {
          records.push({
            annee: 2025,
            codeOrientation: lastCode,
            establishment_name: establishment,
            specialty_name: specialty,
            capacite: lastCapacity
          });
          stats.codesWithCapacity++;
          stats.uniqueSpecialties.add(specialty);
          stats.capacities.push(lastCapacity);
        } else if (lastCode) {
          reviews.push({
            codeOrientation: lastCode,
            issue: 'incomplete_extraction',
            capacity: lastCapacity,
            establishment: establishment || 'Not found',
            specialty: specialty || 'Not found'
          });
        }
      }
      
      lastCode = line;
      lastCapacity = null;
      establishmentWindow = [];
      inCodeBlock = true;
      continue;
    }
    
    // After code, look for capacity (1-500, no decimals)
    if (inCodeBlock && lastCapacity === null) {
      const num = parseInt(line, 10);
      if (!isNaN(num) && num > 0 && num < 501 && 
          !line.includes(',') && !line.includes('.') &&
          !line.startsWith('FG+') && !line.startsWith('Max(')) {
        lastCapacity = num;
        if (num < stats.minCapacity) stats.minCapacity = num;
        if (num > stats.maxCapacity) stats.maxCapacity = num;
        continue;
      }
    }
    
    // Collect establishment/specialty context
    if (inCodeBlock && lastCapacity !== null) {
      // Stop collecting if we hit next code or formula
      if (isCode(line) || line.startsWith('FG+') || line.startsWith('Max(')) {
        inCodeBlock = false;
        i--; // Reprocess this line
        continue;
      }
      
      // Collect lines that might be establishment/specialty
      if (line.length > 3 && !line.startsWith('www')) {
        establishmentWindow.push(line);
      }
      
      // Stop after collecting enough context
      if (establishmentWindow.length > 5) {
        inCodeBlock = false;
      }
    }
  }
  
  // Process last code if exists
  if (lastCode && lastCapacity !== null && establishmentWindow.length > 0) {
    const { establishment, specialty } = extractEstablishmentSpecialty(establishmentWindow, lastCapacity);
    
    if (establishment && specialty) {
      records.push({
        annee: 2025,
        codeOrientation: lastCode,
        establishment_name: establishment,
        specialty_name: specialty,
        capacite: lastCapacity
      });
      stats.codesWithCapacity++;
      stats.uniqueSpecialties.add(specialty);
      stats.capacities.push(lastCapacity);
    }
  }
  
  stats.minCapacity = stats.minCapacity === Infinity ? 0 : stats.minCapacity;
  stats.uniqueSpecialties = stats.uniqueSpecialties.size;
  
  return { records, reviews, stats };
}

function extractEstablishmentSpecialty(lines, capacity) {
  let establishment = '';
  let specialty = '';
  
  if (lines.length === 0) return { establishment, specialty };
  
  // First substantial line is likely establishment or specialty
  // Look for institution markers
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const candidate = lines[i];
    if (candidate.includes('معهد') || candidate.includes('كلية') || 
        candidate.includes('جامعة') || candidate.includes('الجامعة')) {
      establishment = candidate;
      break;
    }
  }
  
  // If no establishment found in first 3, first line is establishment
  if (!establishment && lines.length > 0) {
    establishment = lines[0];
  }
  
  // Specialty is next non-establishment, non-formula line
  for (let i = 0; i < lines.length; i++) {
    const candidate = lines[i];
    
    // Skip if it's establishment or formula
    if (candidate === establishment || 
        candidate.startsWith('FG+') || 
        candidate.startsWith('Max(') ||
        /^\d+$/.test(candidate)) {
      continue;
    }
    
    // Use this as specialty
    if (candidate.length > 3) {
      specialty = candidate;
      break;
    }
  }
  
  return { 
    establishment: establishment.substring(0, 100), 
    specialty: specialty.substring(0, 100) 
  };
}

function isCode(text) {
  if (text.length !== 5) return false;
  for (let j = 0; j < 5; j++) {
    const c = text.charCodeAt(j);
    if (c < 48 || c > 57) return false;
  }
  return true;
}

extractCapacities().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
