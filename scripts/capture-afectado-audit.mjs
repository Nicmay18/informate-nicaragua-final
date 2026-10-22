// Read-only Firestore snapshot, restricted to the articles in the REVIEW list.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from 'dotenv';
import { initializeApp, cert, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (process.argv.includes('--apply')) throw new Error('SOLO LECTURA');
const target = process.argv[2] || '.audit/afectado-p2-snapshot.json';
const pendientes = JSON.parse(readFileSync('.audit/repair-afectado-pendientes.json', 'utf8'));
const corpus = JSON.parse(readFileSync('.audit/corpus.json', 'utf8'));
const env = parse(readFileSync('.env.local'));
const credentials = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || env.FIREBASE_SERVICE_ACCOUNT_BASE64;
const app = initializeApp({ credential: cert(JSON.parse(Buffer.from(credentials, 'base64').toString('utf8'))) });
const db = getFirestore(app);
const documents = [];
try {
  for (const group of pendientes) {
    const matches = corpus.filter(d => d.slug === group.slug);
    if (matches.length !== 1) throw new Error(`ID no inequívoco: ${group.slug}`);
    const snap = await db.collection('noticias').doc(matches[0].id).get();
    if (!snap.exists || snap.data().slug !== group.slug) throw new Error(`Documento distinto: ${group.slug}`);
    // Full data remain local for comparison; never printed or committed.
    documents.push({
      id: snap.id, slug: group.slug,
      updateTime: { seconds: snap.updateTime.seconds, nanoseconds: snap.updateTime.nanoseconds },
      data: snap.data(),
    });
  }
  const result = { capturedAt: new Date().toISOString(), mode: 'READ_ONLY', documents };
  writeFileSync(target, JSON.stringify(result, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ target, documents: documents.length, sha256: createHash('sha256').update(JSON.stringify(result)).digest('hex') }));
} finally {
  await deleteApp(app);
}
