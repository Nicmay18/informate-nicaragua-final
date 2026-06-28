const fs = require('fs');
const lines = fs.readFileSync('titulos_ajustados_70.txt', 'utf8').split('\n').filter(l => l.trim());
let bad = [];
lines.forEach((l, i) => {
  const m = l.match(/^\d+\.\s*(.*?)\s*\(\d+\)\s*$/);
  if (!m) return;
  const t = m[1];
  if (t.length > 70) bad.push(`${i + 1}: ${t.length} chars - ${t}`);
});
console.log('Total:', lines.length, '| Over 70:', bad.length);
if (bad.length) bad.forEach(b => console.log(b));
