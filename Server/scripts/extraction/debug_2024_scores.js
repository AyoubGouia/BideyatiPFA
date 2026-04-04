const fs = require('fs');
const pdfParse = require('pdf-parse');

async function debug() {
  const buf = fs.readFileSync('./data/raw/score2024.pdf');
  const data = await pdfParse(buf);
  const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  console.log('Total lines:', lines.length);
  
  // Find first score-like value
  for (let i = 0; i < lines.length; i++) {
    const pattern = /^\d{2,3}\.\d{2,4}$/;
    if (pattern.test(lines[i])) {
      console.log('First score-like value at line', i, ':', lines[i]);
      console.log('\nContext (lines', Math.max(0, i-25), 'to', Math.min(lines.length, i+15) + '):');
      for (let j = Math.max(0, i-25); j < Math.min(lines.length, i+15); j++) {
        const mark = j === i ? '[SCORE] ' : '        ';
        console.log(j.toString().padStart(5) + ': ' + mark + lines[j].substring(0, 65));
      }
      break;
    }
  }
}

debug().catch(err => console.error(err));
