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

  const busquedas = [
    { keywords: ['cristina', 'oleaje', 'rivas'], tituloOriginal: 'Fuerte oleaje por tormenta Cristina' },
    { keywords: ['three', 'depresion', 'pacifico'], tituloOriginal: 'Depresión tropical Three-E' },
    { keywords: ['accidentes viales', 'ocho', 'fallecen'], tituloOriginal: 'Ocho personas fallecen en accidentes viales' },
    { keywords: ['tres leches', 'reconocimiento'], tituloOriginal: 'El tres leches nicaragüense' },
    { keywords: ['relevos mixtos', 'oro', 'atletismo'], tituloOriginal: 'Nicaragua conquista medalla de oro en relevos' },
    { keywords: ['depositos', 'financiero', 'banco central'], tituloOriginal: 'Depósitos del público en el sistema financiero' }
  ];

  for (const b of busquedas) {
    const docs = snapshot.docs.filter(d => {
      const t = (d.data().titulo || '').toLowerCase();
      return b.keywords.some(k => t.includes(k));
    });

    if (docs.length > 0) {
      const data = docs[0].data();
      console.log(`✅ [${b.tituloOriginal}]`);
      console.log(`   Encontrada como: "${data.titulo}"`);
      const tieneAntecedentes = /antecedentes|contexto/i.test(data.contenido || '');
      console.log(`   Tiene antecedentes: ${tieneAntecedentes ? 'SÍ ❌' : 'NO ✅'}`);
    } else {
      console.log(`❌ [${b.tituloOriginal}] — NO ENCONTRADA`);
    }
  }

  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
