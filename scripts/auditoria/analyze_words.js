const fs = require('fs');
const path = require('path');

const backup = JSON.parse(fs.readFileSync(path.join(__dirname, 'firestore-current-backup-1781106719360.json'), 'utf-8'));
const recuperables = JSON.parse(fs.readFileSync(path.join(__dirname, 'recuperables.json'), 'utf-8'));

function wordCount(html) {
  const text = (html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

function cleanTitle(t) {
  return (t || '').split('\\n\\n##')[0].split('\n\n##')[0].split('\\n')[0].replace(/\\n/g, ' ').trim();
}

const bajo500 = [];
const ok = [];

for (const id of recuperables) {
  const f = backup[id];
  const html = (f.contenidoHtml && f.contenidoHtml.length > 300 && !f.contenidoHtml.includes('Lead de 40 palabras')) ? f.contenidoHtml : f.contenido;
  const wc = wordCount(html);
  const tituloCorrupto = (f.titulo || '').includes('\\n\\n##') || (f.titulo || '').includes('## Resumen');
  const entry = { id, titulo: cleanTitle(f.titulo), palabras: wc, tituloCorrupto };
  if (wc < 500) bajo500.push(entry);
  else ok.push(entry);
}

console.log(`Recuperables: ${recuperables.length}`);
console.log(`Con 500+ palabras: ${ok.length}`);
console.log(`Bajo 500 palabras (necesitan expansion): ${bajo500.length}`);
const corruptos = [...bajo500, ...ok].filter(e => e.tituloCorrupto);
console.log(`Titulos corruptos: ${corruptos.length}`);
corruptos.forEach(c => console.log(`  - ${c.id}: ${c.titulo}`));
console.log('\n=== BAJO 500 PALABRAS ===');
bajo500.sort((a,b)=>a.palabras-b.palabras).forEach(e => console.log(`- ${e.palabras}w | ${e.id} | ${e.titulo}`));

fs.writeFileSync(path.join(__dirname, 'bajo500.json'), JSON.stringify(bajo500, null, 2));
