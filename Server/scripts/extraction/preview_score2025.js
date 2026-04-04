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
    
    console.log(`PDF Info:`);
    console.log(`  Pages: ${data.numpages}`);
    console.log(`  Characters: ${data.text.length}\n`);
    
    // Output first 2000 characters to understand structure
    console.log('=== FIRST 2000 CHARACTERS OF EXTRACTED TEXT ===\n');
    console.log(data.text.substring(0, 2000));
    console.log('\n... (truncated)\n');
    
    // Try to identify tables by looking for patterns
    const lines = data.text.split('\n');
    console.log(`Total lines: ${lines.length}\n`);
    
    // Show first 50 lines to understand structure
    console.log('=== FIRST 50 LINES ===\n');
    lines.slice(0, 50).forEach((line, i) => {
      if (line.trim()) {
        console.log(`${i.toString().padStart(3)}: ${line.substring(0, 100)}`);
      }
    });
    
  } catch (error) {
    console.error('Error reading PDF:', error.message);
    process.exit(1);
  }
}

extractScores().catch(console.error);
