#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  try {
    const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();

  snapshot.forEach(doc => {
    const data = doc.data();
    const contenido = (data.contenido || '').toLowerCase();
    const titulo = (data.titulo || '').toLowerCase();

    if (contenido.includes('bonanza') && contenido.includes('motorizado') ||
        titulo.includes('bonanza') && contenido.includes('polic')) {
      console.log(`\n=== ${doc.id} ===`);
      console.log(`Titulo: ${data.titulo}`);
      console.log(`Fecha Firestore: ${data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha}`);

      // Buscar fecha en contenido
      const matches = data.contenido.match(/\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+202[0-6]/gi);
      if (matches) console.log(`Fechas en contenido: ${matches.join(', ')}`);

      console.log(`Contenido (primeros 500 chars): ${(data.contenido || '').slice(0, 500)}`);
    }
  });

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
