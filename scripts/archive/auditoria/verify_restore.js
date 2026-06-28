const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const credPath = path.join(__dirname, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function wc(html) {
  const t = (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return t ? t.split(' ').length : 0;
}
function isPlaceholder(s) {
  return (s || '').includes('Lead de 40 palabras') || (s || '').includes('Contenido ORO genérico');
}
function tituloCorrupto(t) {
  return (t || '').includes('## Resumen') || (t || '').includes('\\n\\n');
}

async function main() {
  const snap = await db.collection('noticias').get();
  let total = 0, vacios = 0, placeholders = 0, corruptos = 0, bajo500 = 0, ok500 = 0;
  const problemas = [];
  snap.forEach(doc => {
    total++;
    const f = doc.data();
    const c = f.contenido || '';
    const w = wc(c);
    if (!c || c.length < 50) { vacios++; problemas.push(`VACIO ${doc.id}`); }
    else if (isPlaceholder(c)) { placeholders++; problemas.push(`PLACEHOLDER ${doc.id}`); }
    else if (w < 500) bajo500++;
    else ok500++;
    if (tituloCorrupto(f.titulo)) { corruptos++; problemas.push(`TITULO ${doc.id}`); }
  });
  console.log(`Total: ${total}`);
  console.log(`Con 500+ palabras: ${ok500}`);
  console.log(`Con contenido real <500w: ${bajo500}`);
  console.log(`Placeholders restantes: ${placeholders}`);
  console.log(`Vacios: ${vacios}`);
  console.log(`Titulos corruptos: ${corruptos}`);
  if (problemas.length) { console.log('\nPROBLEMAS:'); problemas.forEach(p => console.log('  ' + p)); }
  else console.log('\nSin problemas: ningun placeholder, vacio ni titulo corrupto.');
}
main().catch(e => console.error('Fatal', e));
