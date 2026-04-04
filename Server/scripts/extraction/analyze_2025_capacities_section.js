const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./data/normalized/2025/capacities_2025.by_section.json'));
const review = JSON.parse(fs.readFileSync('./data/review/capacities_2025.by_section.review.json'));

console.log('=== 10 SAMPLE ROWS ===\n');
data.slice(0, 10).forEach((r, i) => {
  const estStr = r.establishment_name.substring(0, 25).padEnd(25);
  const specStr = r.specialty_name.substring(0, 25).padEnd(25);
  const secStr = r.sectionBac.padEnd(15);
  console.log(`${(i+1).toString().padStart(2)}. [${r.codeOrientation}] ${estStr} | ${specStr} | ${secStr} | ${r.capacite}`);
});

console.log('\n=== STATISTICS ===');
console.log(`Total records: ${data.length}`);
console.log(`Total review items: ${review.length}`);

// By section
const bySec = {};
data.forEach(r => {
  if (!bySec[r.sectionBac]) bySec[r.sectionBac] = [];
  bySec[r.sectionBac].push(r);
});

console.log('\nRecords by section:');
Object.entries(bySec).forEach(([sec, recs]) => {
  console.log(`  ${sec.padEnd(20)}: ${recs.length}`);
});

// Sample of each section
console.log('\n=== SAMPLE FROM EACH SECTION ===');
Object.entries(bySec).forEach(([sec, recs]) => {
  const sample = recs[0];
  console.log(`\n${sec}:`);
  console.log(`  Code: ${sample.codeOrientation}`);
  console.log(`  Establishment: ${sample.establishment_name}`);
  console.log(`  Specialty: ${sample.specialty_name}`);
  console.log(`  Capacity: ${sample.capacite}`);
});

// Review items
if (review.length > 0) {
  console.log(`\n=== REVIEW ITEMS (${review.length}) ===`);
  review.forEach(r => {
    console.log(JSON.stringify(r, null, 2));
  });
}
