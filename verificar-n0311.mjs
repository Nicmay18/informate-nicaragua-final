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

  console.log('\n🔍 VERIFICANDO BASE DE DATOS n0311\n');

  // 1. Verificar coleccion 'noticias'
  try {
    const snap = await db.collection('noticias').limit(5).get();
    console.log(`✅ Coleccion 'noticias': ${snap.size} documentos encontrados`);
    if (!snap.empty) {
      snap.forEach(d => {
        const data = d.data();
        console.log(`   - ID: ${d.id} | Titulo: ${data.titulo?.substring(0, 50)}... | Slug: ${data.slug || 'sin slug'}`);
      });
    }
  } catch (err) {
    console.log(`❌ Error leyendo 'noticias': ${err.message}`);
  }

  // 2. Contar total
  try {
    const total = await db.collection('noticias').count().get();
    console.log(`\n📊 Total documentos en 'noticias': ${total.data().count}`);
  } catch (err) {
    console.log(`\n❌ Error contando: ${err.message}`);
  }

  // 3. Verificar si hay otras colecciones
  try {
    const cols = await db.listCollections();
    console.log(`\n📁 Colecciones en n0311: ${cols.map(c => c.id).join(', ')}`);
  } catch (err) {
    console.log(`\n❌ Error listando colecciones: ${err.message}`);
  }

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
