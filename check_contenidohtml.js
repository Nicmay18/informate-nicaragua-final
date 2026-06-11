const fs = require('fs');
const path = require('path');

const backup = JSON.parse(fs.readFileSync(path.join(__dirname, 'firestore-current-backup-1781106719360.json'), 'utf-8'));

let conHtmlReal = 0;
let conContenidoReal = 0;
let placeholderHtml = 0;
let soloPlaceholder = 0;
const recuperables = [];
const perdidos = [];

for (const [id, f] of Object.entries(backup)) {
  const html = f.contenidoHtml || '';
  const cont = f.contenido || '';
  const htmlEsPlaceholder = html.includes('Lead de 40 palabras') || html.includes('Contenido ORO genérico');
  const contEsPlaceholder = cont.includes('Lead de 40 palabras') || cont.includes('Contenido ORO genérico');
  
  const htmlReal = html.length > 300 && !htmlEsPlaceholder;
  const contReal = cont.length > 300 && !contEsPlaceholder;
  
  if (htmlReal) conHtmlReal++;
  if (contReal) conContenidoReal++;
  
  if (htmlReal || contReal) {
    recuperables.push(id);
  } else {
    perdidos.push({ id, titulo: (f.titulo||'').split('\\n')[0].substring(0,60), htmlLen: html.length, contLen: cont.length });
  }
}

console.log(`Total documentos: ${Object.keys(backup).length}`);
console.log(`Con contenidoHtml REAL (>300 chars, no placeholder): ${conHtmlReal}`);
console.log(`Con contenido REAL (>300 chars, no placeholder): ${conContenidoReal}`);
console.log(`\nRECUPERABLES (tienen contenido real en algún campo): ${recuperables.length}`);
console.log(`PERDIDOS (solo placeholder): ${perdidos.length}`);
console.log('\n=== PERDIDOS ===');
perdidos.forEach(p => console.log(`- ${p.id} | html:${p.htmlLen} cont:${p.contLen} | ${p.titulo}`));

fs.writeFileSync(path.join(__dirname, 'recuperables.json'), JSON.stringify(recuperables, null, 2));
fs.writeFileSync(path.join(__dirname, 'perdidos.json'), JSON.stringify(perdidos, null, 2));
