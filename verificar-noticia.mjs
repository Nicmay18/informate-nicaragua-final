import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
  const app = initializeApp({ credential: cert(sa) });
  return getFirestore(app);
}

async function main() {
  const db = initFirebase();
  // Noticia que deberia tener "trágico" reemplazado por "grave"
  const doc = await db.collection('noticias').doc('OKGf076aUjmSNv1k1ret').get();
  const data = doc.data();
  
  console.log('TITULO:', data.titulo);
  console.log('RESUMEN:', data.resumen?.substring(0, 200));
  console.log('\n--- CONTENIDO (primeros 800 chars) ---');
  console.log(data.contenido?.substring(0, 800));
  console.log('\n--- Busqueda de palabras sensibles ---');
  const texto = `${data.titulo} ${data.resumen} ${data.contenido}`.toLowerCase();
  const palabras = ['trágico', 'tragedia', 'homicidio', 'luto', 'criminal', 'crimen', 'muert', 'muerto', 'muerta', 'muere', 'asesinato', 'violación'];
  palabras.forEach(p => {
    if (texto.includes(p)) console.log(`ENCONTRADO: "${p}"`);
  });
  
  // Buscar palabras que contienen 'muert'
  console.log('\n--- Palabras con muert ---');
  const matches = texto.match(/\w*muert\w*/gi);
  if (matches) {
    [...new Set(matches)].forEach(m => console.log('  ->', m));
  } else {
    console.log('  Ninguna encontrada');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
