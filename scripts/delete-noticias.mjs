import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ids = [
  '7XhLLKm4xgL5vtfLLCU3',
  'sbg2Bm2F9YeslOZe4UXJ',
  'u8TvXrAQfYYIU8A6jnwM',
  'Nl4bnTyEQONPW10OTmtc'
];

if (getApps().length === 0) {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    initializeApp({ credential: cert(sa) });
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
  } else {
    console.error('❌ No se encontraron credenciales de Firebase Admin. Asegurate de tener FIREBASE_SERVICE_ACCOUNT_BASE64 o las variables FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY en tu entorno.');
    process.exit(1);
  }
}

const db = getFirestore();

for (const id of ids) {
  try {
    await db.collection('noticias').doc(id).delete();
    console.log(`✅ Eliminada: ${id}`);
  } catch (err) {
    console.error(`❌ Error eliminando ${id}:`, err.message);
  }
}

console.log('Listo.');
