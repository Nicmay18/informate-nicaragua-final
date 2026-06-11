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
  const doc = await db.collection('noticias').doc('eLJeY8NEp62lCIx7Tf5n').get();
  const data = doc.data();
  
  console.log('TITULO:', data.titulo);
  console.log('RESUMEN:', data.resumen?.substring(0, 200));
  
  const contenido = data.contenido || '';
  
  // Buscar cualquier palabra con 'muert'
  const regex = /\b\w*muert\w*\b/gi;
  const matches = [...contenido.matchAll(regex)];
  
  if (matches.length > 0) {
    console.log('\n⚠️ Palabras con "muert" en contenido:');
    matches.forEach(m => console.log('  ->', m[0]));
    
    // Mostrar contexto
    console.log('\n--- Contexto ---');
    matches.slice(0, 3).forEach(m => {
      const start = Math.max(0, m.index - 50);
      const end = Math.min(contenido.length, m.index + m[0].length + 50);
      console.log('...' + contenido.substring(start, end) + '...');
    });
  } else {
    console.log('\n✅ No hay "muert" en contenido');
  }
  
  // También verificar titulo y resumen
  const tituloMatches = [...(data.titulo || '').matchAll(regex)];
  const resumenMatches = [...(data.resumen || '').matchAll(regex)];
  
  if (tituloMatches.length) console.log('Titulo matches:', tituloMatches.map(m => m[0]));
  if (resumenMatches.length) console.log('Resumen matches:', resumenMatches.map(m => m[0]));
}

main().catch(err => { console.error(err); process.exit(1); });
