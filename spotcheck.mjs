import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
const sa = JSON.parse(fs.readFileSync('scripts/firebase-admin-key.json'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

(async () => {
  const snap = await db.collection('noticias').where('titulo', '>=', 'KFC abre').where('titulo', '<=', 'KFC abre\uf8ff').get();
  for (const d of snap.docs) {
    const txt = (d.data().contenido || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log('TÍTULO:', d.data().titulo);
    console.log(txt.substring(0, 700));
    console.log('\n──────────────────────────────\n');
  }
  process.exit(0);
})();
