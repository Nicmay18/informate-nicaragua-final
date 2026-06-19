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

  // Buscar noticia de Bonanza
  const bonanza = docs.filter(n => (n.titulo || '').toLowerCase().includes('bonanza'));

  console.log('=== NOTICIAS DE BONANZA ===\n');
  bonanza.forEach((n, i) => {
    console.log(`${i+1}. ${n.titulo}`);
    console.log(`   ID: ${n.id}`);
    console.log(`   Slug: "${n.slug}"`);
    console.log(`   Estado: ${n.estado || 'sin estado'}`);
    console.log(`   Contenido: ${(n.contenido || '').length} chars`);
    console.log('');
  });

  // Buscar noticias sin slug o con slug vacío
  const sinSlug = docs.filter(n => !n.slug || n.slug === '');
  console.log(`=== NOTICIAS SIN SLUG: ${sinSlug.length} ===\n`);
  sinSlug.slice(0, 10).forEach((n, i) => {
    console.log(`${i+1}. ${n.titulo?.slice(0, 50) || '(sin título)'} [${n.estado || '?'}]`);
  });

  // Verificar slugs con caracteres problemáticos
  const slugsRaros = docs.filter(n => n.slug && !/^[a-zA-Z0-9_-]+$/.test(n.slug));
  console.log(`\n=== SLUGS CON CARACTERES RAROS: ${slugsRaros.length} ===\n`);
  slugsRaros.slice(0, 10).forEach((n, i) => {
    console.log(`${i+1}. "${n.slug}" — ${n.titulo?.slice(0, 40) || ''}`);
  });

  // Listar algunos slugs para ver cómo se ven
  console.log(`\n=== PRIMEROS 20 SLUGS ===\n`);
  docs.filter(n => n.slug).slice(0, 20).forEach((n, i) => {
    console.log(`${i+1}. "${n.slug}" — ${n.titulo?.slice(0, 40) || ''}`);
  });

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
