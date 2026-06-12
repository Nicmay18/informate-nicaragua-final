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
  const snap = await db.collection('noticias').limit(200).get();
  
  let bajas = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    const score = d.scoreCalidad || 0;
    if (score <= 55) {
      bajas++;
      console.log(`${score} | T:${d.titulo?.length} R:${d.resumen?.length} | ${d.titulo?.substring(0,60)}`);
    }
  }
  console.log(`\nTotal con score <= 55: ${bajas}`);
}

main().catch(err => { console.error(err); process.exit(1); });
