/**
 * Backfill: copia tags a palabrasClave y keywords para que panel admin y MENI las vean
 * Uso: node .audit/backfill-palabrasClave.mjs
 */
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envText = await import('fs/promises').then(fs => fs.readFile(path.join(rootDir, '.env.local'), 'utf8'));
const b64 = envText.split('\n').find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_BASE64='))?.split('=')[1];
if (!b64) throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 not found in .env.local');
const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
process.env.FIREBASE_PROJECT_ID = sa.project_id;
process.env.FIREBASE_CLIENT_EMAIL = sa.client_email;
process.env.FIREBASE_PRIVATE_KEY = sa.private_key;

const { initializeApp, cert, getApps } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');

if (getApps().length === 0) initializeApp({ credential: cert(sa) });
const db = getFirestore();

const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(500).get();
const toUpdate = [];

for (const doc of snapshot.docs) {
  const data = doc.data();
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const palabrasClave = Array.isArray(data.palabrasClave) ? data.palabrasClave : [];

  if (tags.length > 0 && palabrasClave.length === 0) {
    toUpdate.push({
      ref: doc.ref,
      id: doc.id,
      titulo: data.titulo,
      palabrasClave: tags,
      keywords: tags.join(', '),
    });
  }
}

if (toUpdate.length === 0) {
  console.log('No hay documentos que necesiten backfill.');
  process.exit(0);
}

console.log(`Backfill para ${toUpdate.length} documentos...`);

const BATCH_SIZE = 450;
let updated = 0;
for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
  const batch = db.batch();
  const chunk = toUpdate.slice(i, i + BATCH_SIZE);
  for (const item of chunk) {
    batch.update(item.ref, {
      palabrasClave: item.palabrasClave,
      keywords: item.keywords,
    });
  }
  await batch.commit();
  updated += chunk.length;
  console.log(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${updated}/${toUpdate.length}`);
}

console.log(`Backfill completo: ${updated} documentos actualizados.`);
