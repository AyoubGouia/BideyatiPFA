const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data/normalized/2024/scores_2024_reference.by_section.json', 'utf8'));

// Group by code
const groups = {};
data.forEach(r => {
  const key = r.codeOrientation;
  if (!groups[key]) groups[key] = 0;
  groups[key]++;
});

// Find incomplete
const incomplete = Object.entries(groups)
  .filter(([k, v]) => v < 7)
  .sort((a, b) => a[1] - b[1]);

console.log('Distribution of incomplete codes:');
const dist = {};
incomplete.forEach(([code, count]) => {
  if (!dist[count]) dist[count] = 0;
  dist[count]++;
});

Object.keys(dist).sort((a, b) => a - b).forEach(count => {
  console.log(`  ${count} sections: ${dist[count]} codes`);
});

console.log(`\nSample incomplete codes:`);
incomplete.slice(0, 20).forEach(([code, count]) => {
  console.log(`  ${code}: ${count} sections`);
});

console.log(`\nStatistics:`);
console.log(`  Total codes: ${Object.keys(groups).length}`);
console.log(`  Complete codes (7 sections): ${Object.values(groups).filter(v => v === 7).length}`);
console.log(`  Incomplete codes: ${incomplete.length}`);
console.log(`  Total records: ${data.length}`);
console.log(`  Expected if all complete: ${Object.keys(groups).length * 7}`);
console.log(`  Missing records: ${Object.keys(groups).length * 7 - data.length}`);
