import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
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

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function contarPalabras(texto) {
  return texto.split(/\s+/).filter(Boolean).length;
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias')
    .where('scoreCalidad', '<', 85)
    .where('scoreCalidad', '>=', 50)
    .limit(10)
    .get();

  const noticias = snap.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      titulo: d.titulo,
      resumen: d.resumen,
      categoria: d.categoria,
      score: d.scoreCalidad,
      palabras: contarPalabras(stripHtml(d.contenido || '')),
      contenido: stripHtml(d.contenido || '').substring(0, 1200)
    };
  });

  // Ordenar por palabras (las más cortas primero)
  noticias.sort((a, b) => a.palabras - b.palabras);

  writeFileSync('./noticias-para-expandir.json', JSON.stringify(noticias, null, 2), 'utf8');
  console.log(`✅ Exportadas ${noticias.length} noticias a noticias-para-expandir.json`);
  noticias.forEach((n, i) => {
    console.log(`${i+1}. ${n.titulo?.substring(0,55)}... (${n.palabras} palabras, score ${n.score})`);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
