import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, '..', '..', 'informate-instant-nicaragua-c7bc9eb4f553.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const snap = await db.collection('noticias').get();
const malos = [];
snap.docs.forEach(d => {
  const t = (d.data().titulo || '').trim();
  if (t.length < 30 || t.length > 65) malos.push({ slug: d.data().slug || d.id, len: t.length, t: t.slice(0, 55) });
});
console.log('Títulos fuera de 30-65: ' + malos.length);
malos.forEach(x => console.log('  ' + x.len + 'c | ' + x.t));
