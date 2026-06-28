#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  try {
    const sa = JSON.parse(readFileSync('./scripts/firebase-admin-key.json', 'utf8'));
    return getFirestore(initializeApp({ credential: cert(sa) }));
  } catch {}
  const { FIREBASE_PROJECT_ID: projectId, FIREBASE_CLIENT_EMAIL: clientEmail, FIREBASE_PRIVATE_KEY: raw } = process.env;
  if (projectId && clientEmail && raw) {
    const privateKey = raw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    return getFirestore(initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }));
  }
  throw new Error('Sin credenciales Firebase');
}

const db = initFirebase();
// Obtener TODAS y filtrar las que no son 'publicado'
const snap = await db.collection('noticias').get();
const sinPublicar = [];
snap.forEach(d => {
  const est = d.data().estado;
  if (est !== 'publicado') sinPublicar.push(d.ref);
});

console.log(`  📰 Encontradas ${sinPublicar.length} noticias sin estado 'publicado'\n`);

const BATCH_SIZE = 400;
let actualizadas = 0;

for (let i = 0; i < sinPublicar.length; i += BATCH_SIZE) {
  const lote = sinPublicar.slice(i, i + BATCH_SIZE);
  const batch = db.batch();
  for (const ref of lote) batch.update(ref, { estado: 'publicado' });
  await batch.commit();
  actualizadas += lote.length;
  console.log(`  ✅ Lote ${Math.ceil((i + 1) / BATCH_SIZE)}: ${actualizadas}/${sinPublicar.length} actualizadas`);
}

console.log(`\n══════════════════════════════════════════`);
console.log(`  ✅ TOTAL PUBLICADAS: ${actualizadas}`);
console.log(`══════════════════════════════════════════\n`);
process.exit(0);
