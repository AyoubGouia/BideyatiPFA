const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function preview() {
  const pdfPath = path.join(__dirname, '../../data/raw/score2023.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF not found: ${pdfPath}`);
    process.exit(1);
  }
  
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(pdfBuffer);
    
    console.log('PDF Info:');
    console.log(`  Pages: ${data.numpages}`);
    console.log(`  Characters: ${data.text.length}\n`);
    
    console.log('=== FIRST 2000 CHARACTERS OF EXTRACTED TEXT ===\n');
    console.log(data.text.substring(0, 2000));
    
    const lines = data.text.split('\n').map(l => l.trim()).filter(l => l);
    console.log(`\n\nTotal lines: ${lines.length}`);
    
    console.log('\n=== FIRST 50 LINES ===\n');
    lines.slice(0, 50).forEach((line, idx) => {
      console.log(`${idx+1}: ${line}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

preview().catch(console.error);
