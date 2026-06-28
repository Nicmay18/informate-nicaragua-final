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
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  const porEstado = {};
  const porCategoria = {};
  let conContenidoCorto = 0;
  let sinImagen = 0;
  let sinAutor = 0;

  for (const n of docs) {
    const est = n.estado || 'sin_estado';
    const cat = n.categoria || 'sin_categoria';
    porEstado[est] = (porEstado[est] || 0) + 1;
    porCategoria[cat] = (porCategoria[cat] || 0) + 1;
    if ((n.contenido || '').length < 300) conContenidoCorto++;
    if (!n.imagenDestacada && !n.imagenUrl) sinImagen++;
    if (!n.autor) sinAutor++;
  }

  console.log(`\n══════════════════════════════════════════`);
  console.log(`TOTAL NOTICIAS EN FIREBASE: ${docs.length}`);
  console.log(`══════════════════════════════════════════`);

  console.log(`\n--- POR ESTADO ---`);
  for (const [k, v] of Object.entries(porEstado).sort((a,b) => b[1]-a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  console.log(`\n--- POR CATEGORÍA ---`);
  for (const [k, v] of Object.entries(porCategoria).sort((a,b) => b[1]-a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  console.log(`\n--- PROBLEMAS ---`);
  console.log(`  Contenido corto (<300 chars): ${conContenidoCorto}`);
  console.log(`  Sin imagen destacada: ${sinImagen}`);
  console.log(`  Sin autor: ${sinAutor}`);

  // Mostrar noticias con contenido muy corto
  if (conContenidoCorto > 0) {
    console.log(`\n--- NOTICIAS CON CONTENIDO CORTO (primeras 20) ---`);
    docs.filter(n => (n.contenido || '').length < 300).slice(0, 20).forEach((n, i) => {
      const len = (n.contenido || '').length;
      console.log(`  ${i+1}. ${n.titulo?.slice(0, 50) || '(sin título)'} — ${len} chars [${n.estado}]`);
    });
  }

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
