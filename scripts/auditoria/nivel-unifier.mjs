/**
 * nivel-unifier.mjs
 * Unifica los niveles de las noticias (ORO, PLATA, BRONCE) 
 * eliminando emojis y estandarizando a mayúsculas.
 */
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config({ path: './.env.local' });

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
  process.exit(1);
}

const db = initDb();

async function unifyLevels() {
  console.log('🧹 UNIFICANDO NIVELES EN FIRESTORE...\n');
  const snap = await db.collection('noticias').get();
  let count = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    let nivel = data.nivel || '';
    
    // Limpiar nivel (quitar emojis, espacios y pasar a mayúsculas)
    let nuevoNivel = nivel.replace(/[^\w]/g, '').toUpperCase().trim();
    
    // Mapeos comunes
    if (nuevoNivel === 'ORO' || nuevoNivel === 'PLATA' || nuevoNivel === 'BRONCE') {
      if (nuevoNivel !== nivel) {
        await doc.ref.update({ nivel: nuevoNivel });
        count++;
      }
    } else if (nivel !== '') {
        // Si tiene algo que no es ORO/PLATA/BRONCE, lo dejamos como BRONCE o vacío
        console.log(`   ⚠️ Nivel extraño detectado en ${doc.id}: "${nivel}"`);
    }
  }

  console.log(`\n✅ Se actualizaron ${count} documentos con niveles normalizados.`);
}

unifyLevels().catch(console.error);
