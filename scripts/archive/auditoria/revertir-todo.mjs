import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config({ path: 'e:/PROYECTO/informate-nicaragua-final/.env.local' });

function initDb() {
  if (getApps().length > 0) return getFirestore(getApp());
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (b64 && b64.trim().length > 10) {
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
  // raw es un objeto { docId: { titulo, contenido, ... } }
  
  const snap = await db.collection('noticias').get();
  let total = 0;
  let restauradas = 0;
  let noEncontradas = 0;
  let sinCambios = 0;

  for (const doc of snap.docs) {
    total++;
    const data = doc.data();
    const docId = doc.id;
    
    // Buscar en backup por ID exacto
    const original = raw[docId];
    
    if (!original) {
      console.log(`⚠️  [${docId}] No encontrado en backup por ID`);
      noEncontradas++;
      continue;
    }
    
    // Si el contenido ya es igual al original, saltar
    if (data.contenido === original.contenido && data.titulo === original.titulo) {
      sinCambios++;
      continue;
    }
    
    await db.collection('noticias').doc(docId).update({
      titulo: original.titulo,
      contenido: original.contenido,
      resumen: original.resumen || '',
      reescritaPorDeepSeek: false
    });
    
    console.log(`✅ [${docId}] Restaurado: ${original.titulo.substring(0, 60)}...`);
    restauradas++;
  }
  
  console.log('\n=== RESUMEN ===');
  console.log(`Total noticias en Firestore: ${total}`);
  console.log(`Restauradas: ${restauradas}`);
  console.log(`Sin cambios (ya originales): ${sinCambios}`);
  console.log(`No encontradas en backup: ${noEncontradas}`);
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
