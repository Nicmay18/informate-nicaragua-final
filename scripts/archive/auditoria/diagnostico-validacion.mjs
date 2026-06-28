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
  const snapshot = await db.collection('noticias').limit(5).get();

  snapshot.forEach(doc => {
    const data = doc.data();
    const texto = data.contenido || '';
    const textoLower = texto.toLowerCase();

    console.log(`\n=== ${doc.id} ===`);
    console.log(`Titulo: ${(data.titulo || '').slice(0, 50)}`);

    // Check frases IA
    const frasesIA = ['asimismo', 'por otro lado', 'en ese sentido', 'cabe señalar', 'resulta fundamental', 'se espera que', 'continúan las investigaciones'];
    const foundIA = frasesIA.filter(f => textoLower.includes(f));
    if (foundIA.length) console.log(`Frases IA: ${foundIA.join(', ')}`);

    // Check citas
    if (/según fuentes|informó un portavoz|según datos oficiales/.test(textoLower)) {
      console.log('Citas genéricas detectadas');
    }

    // Check 1234
    if (/\b1234\b/.test(textoLower)) console.log('Número 1234 encontrado');

    // Check placas genéricas
    const placasGen = textoLower.match(/\b[a-z]\s*\d{1,3}\b/g);
    if (placasGen) console.log(`Placas genéricas: ${placasGen.join(', ')}`);

    // Show snippet
    console.log(`Snippet: ${texto.slice(0, 200)}...`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
