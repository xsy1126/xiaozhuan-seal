// Run with: node combine.js
const fs = require('fs');
const batches = ['batch1.js','batch2.js','batch3.js','batch4.js','batch5.js','batch6.js','batch7.js','batch8.js','batch9.js'];
let all = [];
for (const b of batches) {
  const raw = fs.readFileSync(b, 'utf8');
  // extract lines that look like {c:"..."}
  const lines = raw.split('\n').filter(l => l.trim().startsWith('{c:'));
  all = all.concat(lines);
}
// deduplicate by character
const seen = new Set();
const deduped = [];
for (const line of all) {
  const m = line.match(/\{c:"(.)"/);
  if (m) {
    const ch = m[1];
    if (!seen.has(ch)) { seen.add(ch); deduped.push(line); }
  }
}
const out = 'const chars = [\n' + deduped.join('\n') + '\n];\n';
fs.writeFileSync('chars.js', out);
console.log('Total unique chars:', deduped.length);
