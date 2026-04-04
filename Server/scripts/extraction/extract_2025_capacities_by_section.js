const fs = require('fs');
const path = require('path');

async function extractCapacitiesBySection() {
  const htmlFiles = [
    { file: 'eco2025.html', section: 'إقتصاد وتصرف' },
    { file: 'let2025.html', section: 'آداب' },
    { file: 'math2025.html', section: 'رياضيات' },
    { file: 'scexp2025.html', section: 'علوم تجريبية' },
    { file: 'scinfo2025.html', section: 'علوم الإعلامية' },
    { file: 'sport2025.html', section: 'رياضة' },
    { file: 'tech2025.html', section: 'العلوم التقنية' }
  ];
  
  const records = [];
  const reviews = [];
  const stats = {
    filesProcessed: 0,
    recordsPerFile: {},
    totalCodes: 0,
    uniqueEstablishments: new Set(),
    uniqueSpecialties: new Set()
  };
  
  console.log(`Processing ${htmlFiles.length} section files...\n`);
  
  for (const htmlInfo of htmlFiles) {
    const filePath = path.join(__dirname, '../../data/raw', htmlInfo.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠ File not found: ${htmlInfo.file}`);
      continue;
    }
    
    console.log(`Processing: ${htmlInfo.file} (${htmlInfo.section})`);
    
    const htmlContent = fs.readFileSync(filePath, 'utf8');
    const { fileRecords, fileReviews } = parseHtmlSection(htmlContent, htmlInfo.section);
    
    records.push(...fileRecords);
    reviews.push(...fileReviews);
    
    stats.filesProcessed++;
    stats.recordsPerFile[htmlInfo.file] = fileRecords.length;
    stats.totalCodes += fileRecords.length;
    
    fileRecords.forEach(r => {
      stats.uniqueEstablishments.add(r.establishment_name);
      stats.uniqueSpecialties.add(r.specialty_name);
    });
    
    console.log(`  ✓ ${fileRecords.length} records extracted, ${fileReviews.length} flagged for review`);
  }
  
  // Write output files
  const normDir = path.join(__dirname, '../../data/normalized/2025');
  fs.mkdirSync(normDir, { recursive: true });
  
  const normPath = path.join(normDir, 'capacities_2025.by_section.json');
  fs.writeFileSync(normPath, JSON.stringify(records, null, 2), 'utf8');
  console.log(`\n✓ Output written to: ${normPath}`);
  
  if (reviews.length > 0) {
    const reviewDir = path.join(__dirname, '../../data/review');
    fs.mkdirSync(reviewDir, { recursive: true });
    
    const reviewPath = path.join(reviewDir, 'capacities_2025.by_section.review.json');
    fs.writeFileSync(reviewPath, JSON.stringify(reviews, null, 2), 'utf8');
    console.log(`✓ Review written to: ${reviewPath}`);
  }
  
  console.log(`\n=== STATISTICS ===`);
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Total records: ${records.length}`);
  console.log(`Total review items: ${reviews.length}`);
  console.log(`Unique establishments: ${stats.uniqueEstablishments.size}`);
  console.log(`Unique specialties: ${stats.uniqueSpecialties.size}`);
  console.log(`\nRecords per file:`);
  Object.entries(stats.recordsPerFile).forEach(([file, count]) => {
    console.log(`  ${file.padEnd(20)}: ${count}`);
  });
  
  return { records, reviews };
}

function parseHtmlSection(htmlContent, sectionBac) {
  const records = [];
  const reviews = [];
  
  // Extract table rows using regex
  const tablePattern = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;
  let tableCount = 0;
  let mainRoundFound = false;
  
  while ((tableMatch = tablePattern.exec(htmlContent)) !== null) {
    const tableContent = tableMatch[1];
    tableCount++;
    
    // Check if this table is for main round (الدورة الرئيسية)
    if (!tableContent.includes('الدورة الرئيسية')) {
      continue;
    }
    
    mainRoundFound = true;
    
    // Extract rows
    const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    let rowCount = 0;
    
    while ((rowMatch = rowPattern.exec(tableContent)) !== null) {
      rowCount++;
      const rowContent = rowMatch[1];
      
      // Extract cells (td or th)
      const cellPattern = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      const cells = [];
      let cellMatch;
      
      while ((cellMatch = cellPattern.exec(rowContent)) !== null) {
        let cellText = cellMatch[1];
        // Remove HTML tags and entities
        cellText = cellText.replace(/<[^>]*>/g, '');
        cellText = cellText.replace(/&nbsp;/g, ' ');
        cellText = cellText.replace(/&[^;]+;/g, '');
        cellText = cellText.trim();
        
        if (cellText.length > 0) {
          cells.push(cellText);
        }
      }
      
      if (cells.length < 3) continue; // Skip rows with too few cells
      
      const parsed = parseRowCells(cells, sectionBac);
      
      if (parsed.isValid) {
        records.push(parsed.record);
      } else if (parsed.attemptedRecord) {
        reviews.push({
          section_file: sectionBac,
          issue: 'ambiguous_row_format',
          cells: cells,
          attempted_extraction: parsed.attemptedRecord
        });
      }
    }
  }
  
  if (!mainRoundFound) {
    reviews.push({
      section_file: sectionBac,
      issue: 'no_main_round_table_found',
      tables_found: tableCount
    });
  }
  
  return { fileRecords: records, fileReviews: reviews };
}

function parseRowCells(cells, sectionBac) {
  // Try to extract: code, establishment, specialty, capacity
  
  // Find code (5-digit number)
  let codeIdx = -1;
  let code = null;
  
  for (let i = 0; i < cells.length; i++) {
    if (/^\d{5}$/.test(cells[i])) {
      codeIdx = i;
      code = cells[i];
      break;
    }
  }
  
  if (!code) {
    // No code found - cannot process
    return { isValid: false, attemptedRecord: null };
  }
  
  // Typical HTML table structure:
  // [Code] [Specialty+Establishment] [Capacity1] [Score] [0]
  // OR
  // [Code] [Capacity] [Specialty+Establishment] [Score] 
  
  let capacity = null;
  let capacityIdx = -1;
  
  // Search for valid capacity value (1-500, integer, no decimals)
  for (let i = 0; i < cells.length; i++) {
    if (i === codeIdx) continue;
    
    const trimmed = cells[i].replace(/[^0-9.-]/g, '');
    const num = parseInt(trimmed, 10);
    
    // Capacity: 1-500, no decimals, not too close to code position
    if (!isNaN(num) && num > 0 && num < 501 && 
        !cells[i].includes(',') && !cells[i].includes('.') &&
        Math.abs(i - codeIdx) <= 3) {
      
      // Prefer values that are closer or in different positions than scores
      const isLikelyCapacity = cells[i].match(/^\d{1,3}$/);
      
      if (isLikelyCapacity) {
        capacity = num;
        capacityIdx = i;
        break;
      }
    }
  }
  
  if (!capacity) {
    // Try second approach: look for numbers 1-500 anywhere
    for (let i = 0; i < cells.length; i++) {
      if (i === codeIdx) continue;
      const num = parseInt(cells[i], 10);
      if (!isNaN(num) && num > 0 && num < 501 && !cells[i].includes(',') && !cells[i].includes('.')) {
        capacity = num;
        capacityIdx = i;
        break;
      }
    }
  }
  
  if (!capacity) {
    return { 
      isValid: false, 
      attemptedRecord: { 
        code, 
        issue: 'no_capacity_found',
        cells 
      } 
    };
  }
  
  // Extract establishment and specialty from remaining cells
  let establishment = '';
  let specialty = '';
  
  // Usually concatenated in the cell after code or at the beginning
  let contextText = '';
  
  if (codeIdx > 0) {
    // Cell before code might have info
    contextText = cells[0];
  } else if (codeIdx + 1 < cells.length) {
    // Cell after code
    contextText = cells[codeIdx + 1];
  }
  
  // If contextText is too short or is numeric, find the longest text cell
  if (contextText.length < 5 || /^\d+[\.,]?\d*$/.test(contextText)) {
    for (let i = 0; i < cells.length; i++) {
      if (i !== codeIdx && i !== capacityIdx && cells[i].length > contextText.length) {
        contextText = cells[i];
      }
    }
  }
  
  // Try to split contextText into specialty and establishment
  // Common format: "specialty_name institution_name university_name"
  if (contextText.length > 20) {
    const parts = contextText.split('كلية').map(p => p.trim());
    if (parts.length > 1) {
      specialty = parts[0];
      establishment = 'كلية' + parts[1];
    } else {
      specialty = contextText;
      establishment = contextText;
    }
  } else {
    specialty = contextText;
    establishment = contextText;
  }
  
  // Validate we have essential info
  if (!specialty || specialty.length < 3) {
    return { 
      isValid: false, 
      attemptedRecord: { 
        code, 
        capacity,
        establishment: establishment || 'Not extracted',
        specialty: specialty || 'Not extracted',
        cells 
      } 
    };
  }
  
  const record = {
    annee: 2025,
    tour: 'principale',
    codeOrientation: code,
    establishment_name: establishment.substring(0, 150).replace(/\s+/g, ' '),
    specialty_name: specialty.substring(0, 150).replace(/\s+/g, ' '),
    sectionBac: sectionBac,
    capacite: capacity
  };
  
  return { isValid: true, record };
}

extractCapacitiesBySection().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
