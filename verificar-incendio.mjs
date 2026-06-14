#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(rootDir, 'scripts', 'firebase-admin-key.json');
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
  // Buscar noticias con "incendio" y "oriental" o "emanuel"
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  const incendios = docs.filter(d => {
    const t = (d.titulo || '').toLowerCase();
    const c = (d.contenido || '').toLowerCase();
    return t.includes('incendio') && (t.includes('oriental') || t.includes('emanuel') || c.includes('emanuel'));
  });

  console.log(`\n🔥 NOTICIAS DE INCENDIO ENCONTRADAS: ${incendios.length}\n`);

  for (const doc of incendios) {
    const contenidoPreview = (doc.contenido || '').substring(0, 200).replace(/<[^>]*>/g, '');
    console.log(`ID: ${doc.id}`);
    console.log(`Slug: ${doc.slug || '(sin slug)'}`);
    console.log(`Titulo: ${doc.titulo}`);
    console.log(`Contenido (inicio): ${contenidoPreview}...`);
    console.log(`Palabras: ${doc.contenido ? doc.contenido.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length : 0}`);
    console.log(`Fecha actualizacion Firestore: ${doc.fechaActualizacion || '(no tiene)'}`);
    console.log(`Ultima actualizacion en DB: ${doc.updatedAt || doc.fecha || '(no tiene)'}`);
    console.log(`---`);
  }

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
