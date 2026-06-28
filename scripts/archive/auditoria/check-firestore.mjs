import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

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
  const snap = await db.collection('noticias').get();
  console.log('=== ESTADO ACTUAL DE FIRESTORE ===\n');
  
  let vacias = 0;
  let conPlaceholder = 0;
  let conContenido = 0;
  
  snap.docs.forEach((d, i) => {
    const data = d.data();
    const c = data.contenido || '';
    const titulo = data.titulo || 'SIN TITULO';
    
    let estado = '✅ OK';
    if (!c || c.length < 50) {
      estado = '❌ VACIA';
      vacias++;
    } else if (c.includes('Contenido ORO genérico') || c.includes('Lead de 40 palabras')) {
      estado = '⚠️ PLACEHOLDER';
      conPlaceholder++;
    } else {
      conContenido++;
    }
    
    console.log(`${i+1}. ${estado} | ${titulo.substring(0, 60)}`);
    console.log(`   Contenido: ${c.length} chars | ${c.substring(0, 80).replace(/\n/g, ' ')}...`);
    console.log('');
  });
  
  console.log(`Resumen de las 10 mostradas:`);
  console.log(`- Vacías: ${vacias}`);
  console.log(`- Placeholders: ${conPlaceholder}`);
  console.log(`- Con contenido: ${conContenido}`);
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
