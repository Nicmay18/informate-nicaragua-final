import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function initDb() {
  if (getApps().length > 0) return getFirestore();
  const credPath = 'G:\\RESPALDO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json';
  try {
    const sa = JSON.parse(readFileSync(credPath, 'utf8'));
    initializeApp({ credential: cert(sa) });
    return getFirestore();
  } catch (e) {
    throw new Error(`No se pudo cargar credenciales desde ${credPath}: ${e.message}`);
  }
}

const db = initDb();

const titulos = [
  'Más allá del cráter: los senderos del Volcán Masaya',
  'NASA cuestiona límite de tormentas solares con estudio en Nature',
];

async function main() {
  for (const titulo of titulos) {
    const snap = await db.collection('noticias').where('titulo', '==', titulo).limit(1).get();
    if (snap.empty) {
      console.log('No encontrada:', titulo);
      continue;
    }
    const doc = snap.docs[0];
    const d = doc.data();
    console.log('\n===', titulo, '===');
    console.log('ID:', doc.id);
    console.log('Slug:', d.slug);
    console.log('Categoría:', d.categoria);
    console.log('Autor:', d.autor);
    console.log('Palabras:', d.palabras);
    console.log('Resumen:', d.resumen);
    console.log('Contenido:\n', d.contenido);
    console.log('\n--- FIN ---\n');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
