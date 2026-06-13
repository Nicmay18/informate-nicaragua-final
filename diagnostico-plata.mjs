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

function validarORO(contenido) {
  const texto = contenido || '';
  const textoSinHtml = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = textoSinHtml.split(/\s+/).filter(w => w.length > 0).length;
  const h2s = (texto.match(/<h2>/gi) || []).length;
  const strongs = (texto.match(/<strong>/gi) || []).length;
  const blockquotes = (texto.match(/<blockquote>/gi) || []).length;
  const parrafos = texto.match(/<p>(.*?)<\/p>/g) || [];
  let lead = 0;
  for (const p of parrafos) {
    const pt = p.replace(/<[^>]*>/g, '').trim();
    const c = pt.split(/\s+/).filter(w => w.length > 0).length;
    if (c > 3) { lead = c; break; }
  }
  return { palabras, h2s, strongs, blockquotes, lead };
}

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();

  // Encontrar las que no son ORO
  const noOro = [];
  snapshot.forEach(d => {
    const v = validarORO(d.data().contenido || '');
    if (v.blockquotes < 1 || v.strongs < 1 || v.h2s < 1 || v.lead < 35) {
      noOro.push({ id: d.id, titulo: d.data().titulo, ...v });
    }
  });

  console.log(`=== ${noOro.length} NOTAS QUE NO SON ORO ===\n`);
  noOro.forEach(n => {
    console.log(`[${n.titulo?.slice(0, 50)}]`);
    console.log(`  palabras: ${n.palabras}, h2: ${n.h2s}, strong: ${n.strongs}, blockquote: ${n.blockquotes}, lead: ${n.lead}`);
    console.log(`  Falta: ${n.blockquotes < 1 ? 'blockquote ' : ''}${n.strongs < 1 ? 'strong ' : ''}${n.h2s < 1 ? 'h2 ' : ''}${n.lead < 35 ? 'lead ' : ''}${n.palabras < 500 ? 'extensión ' : ''}`);
  });

  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
