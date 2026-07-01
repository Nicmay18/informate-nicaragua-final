import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, '..', '..', 'informate-instant-nicaragua-c7bc9eb4f553.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function truncate(text, max = 65) {
  if (text.length <= max) return text;
  let cut = text.lastIndexOf(' ', max - 2);
  if (cut < max - 20) cut = max - 2;
  return text.slice(0, cut).trim() + '…';
}

const snap = await db.collection('noticias').get();
let ok = 0, skip = 0;
for (const doc of snap.docs) {
  const t = (doc.data().titulo || '').trim();
  if (t.length > 65) {
    const nuevo = truncate(t, 65);
    await db.collection('noticias').doc(doc.id).update({ titulo: nuevo });
    console.log(`OK ${nuevo.length}c | ${nuevo}`);
    ok++;
  } else skip++;
}
console.log(`\nTruncados: ${ok} | Sin cambios: ${skip}`);
