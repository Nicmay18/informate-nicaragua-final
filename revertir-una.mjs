import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

config({ path: 'e:/PROYECTO/informate-nicaragua-final/.env.local' });

function initDb() {
  if (getApps().length > 0) return getFirestore(getApp());
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (b64 && b64 && b64.trim().length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    initializeApp({ credential: cert(sa) });
    return getFirestore();
  }
  if (privateKeyRaw && projectId && clientEmail) {
    const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    return getFirestore();
  }
  console.error('❌ No hay credenciales Firebase');
  process.exit(1);
}

const db = initDb();

async function main() {
  const raw = JSON.parse(readFileSync('e:/PROYECTO/informate-nicaragua-final/firestore-current-backup-1781106719360.json', 'utf8'));
  const backup = Object.values(raw);
  
  const original = backup.find(n => n.titulo && n.titulo.includes('Xiloá'));
  if (!original) {
    console.log('No encontrado en backup');
    process.exit(1);
  }
  
  const snap = await db.collection('noticias').get();
  const doc = snap.docs.find(d => {
    const t = d.data().titulo || '';
    return t.includes('Xilo') && t.includes('nadaba');
  });
  
  if (!doc) {
    console.log('No encontrado en Firestore');
    process.exit(1);
  }
  
  await db.collection('noticias').doc(doc.id).update({
    titulo: original.titulo,
    contenido: original.contenido,
    resumen: original.resumen || '',
    reescritaPorDeepSeek: false
  });
  
  console.log('✅ Restaurado:', original.titulo);
  console.log('ID:', doc.id);
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
