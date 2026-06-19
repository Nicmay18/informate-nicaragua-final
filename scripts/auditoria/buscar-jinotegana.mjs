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
  try { const sa = JSON.parse(readFileSync(keyPath, 'utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) { const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); }
  const projectId = process.env.FIREBASE_PROJECT_ID, clientEmail = process.env.FIREBASE_CLIENT_EMAIL, privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();

  // Buscar todas las que contengan "jinotegana" o "wisconsin" o "accidente laboral"
  const resultados = [];
  snapshot.forEach(d => {
    const t = (d.data().titulo || '').toLowerCase();
    if (t.includes('jinotegana') || t.includes('wisconsin') || t.includes('accidente laboral') || t.includes('rancho')) {
      resultados.push({ id: d.id, titulo: d.data().titulo });
    }
  });

  console.log(`=== ${resultados.length} NOTICIAS ENCONTRADAS ===\n`);
  resultados.forEach(r => {
    console.log(`ID: ${r.id}`);
    console.log(`Título: ${r.titulo}`);
    console.log();
  });

  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
