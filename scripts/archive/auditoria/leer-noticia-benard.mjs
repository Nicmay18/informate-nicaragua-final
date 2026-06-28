#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  try { const sa = JSON.parse(readFileSync('./scripts/firebase-admin-key.json', 'utf8')); return getFirestore(initializeApp({ credential: cert(sa) })); } catch {}
  throw new Error('Sin credenciales');
}
const db = initFirebase();
const snap = await db.collection('noticias').get();
let found = null;
snap.forEach(d => {
  const t = d.data().titulo || '';
  if (t.toLowerCase().includes('elisa benard') || t.toLowerCase().includes('benard')) found = { id: d.id, ...d.data() };
});
console.log('SLUG:', found?.slug);
console.log('CONTENIDO COMPLETO:\n');
console.log(found?.contenido);
process.exit(0);
