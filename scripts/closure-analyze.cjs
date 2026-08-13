const c = JSON.parse(require('fs').readFileSync('CLOSURE_CLASSIFICATION.json', 'utf8'));
const s = JSON.parse(require('fs').readFileSync('CLOSURE_SNAPSHOT.json', 'utf8'));
const snap = {};
for (const a of s.articles) snap[a.id] = a;

const non = c.classifications.filter(x => x.classification !== 'KEEP');
console.log('=== ALL NON-KEEP ===');
for (const a of non) {
  const full = snap[a.id];
  const f = full && full.fecha;
  const dateStr = f ? (typeof f === 'string' ? f.substring(0, 10) : (f._seconds ? new Date(f._seconds * 1000).toISOString().substring(0, 10) : String(f).substring(0, 10))) : 'no-date';
  console.log(a.classification, a.id, 'score=' + a.scoreMeni, 'pub=' + a.publicado, 'est=' + a.estado, 'date=' + dateStr, '|', a.titulo);
}

console.log('\n=== ARCHIVE candidates ===');
const archive = non.filter(x => x.classification === 'ARCHIVE');
for (const a of archive) {
  const full = snap[a.id];
  console.log(a.id, '|', full.fecha, '|', a.titulo, '|', a.reasons.join('; '));
}

console.log('\n=== REWRITE with score < 90 (already archived) ===');
const rwLow = non.filter(x => x.classification === 'REWRITE' && x.scoreMeni < 90);
for (const a of rwLow) {
  console.log(a.id, '| score=' + a.scoreMeni, '| pub=' + a.publicado, '|', a.titulo);
}

console.log('\n=== REWRITE with score >= 90 (published, MENI approved) ===');
const rwHigh = non.filter(x => x.classification === 'REWRITE' && x.scoreMeni >= 90);
console.log('Count:', rwHigh.length, '(MENI authority: KEEP)');

console.log('\n=== TECHNICAL_FIX details ===');
const tf = non.filter(x => x.classification === 'TECHNICAL_FIX');
for (const a of tf) {
  const full = snap[a.id];
  const hasEmptyP = full && full.contenido ? /<p>\s*<\/p>/i.test(full.contenido) : false;
  const hasNoH2 = full && full.contenido ? !/<h2/i.test(full.contenido) : false;
  console.log(a.id, '| score=' + a.scoreMeni, '| pub=' + a.publicado, '| emptyP=' + hasEmptyP, '| noH2=' + hasNoH2, '|', a.titulo);
}
