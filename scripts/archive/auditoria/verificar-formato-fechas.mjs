/**
 * verificar-formato-fechas.mjs
 * Verifica el formato del campo 'fecha' en las noticias.
 */
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
config({ path: './.env.local' });

function initDb() {
  if (getApps().length > 0) return getFirestore(getApp());
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const pk = process.env.FIREBASE_PRIVATE_KEY;
  if (b64?.trim().length > 10) {
    initializeApp({ credential: cert(JSON.parse(Buffer.from(b64,'base64').toString())) });
    return getFirestore();
  }
  const pKey = pk.trim().replace(/^["']|["']$/g,'').replace(/\\n/g,'\n');
  initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: pKey }) });
  return getFirestore();
}

async function main() {
  const db = initDb();
  console.log('🔍 VERIFICANDO FORMATO DE FECHAS\n');
  
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(10).get();
  
  for (const doc of snap.docs) {
    const d = doc.data();
    const fecha = d.fecha;
    console.log(`ID: ${doc.id}`);
    console.log(`Tipo de fecha: ${typeof fecha}`);
    console.log(`Valor raw: ${JSON.stringify(fecha)}`);
    
    let fechaDate = null;
    try {
      if (fecha && fecha.toDate) {
        fechaDate = fecha.toDate();
      } else if (fecha) {
        fechaDate = new Date(fecha);
      }
      if (fechaDate && !isNaN(fechaDate.getTime())) {
        console.log(`Fecha válida: ${fechaDate.toISOString()}`);
      } else {
        console.log(`❌ FECHA INVÁLIDA`);
      }
    } catch (e) {
      console.log(`❌ ERROR AL PARSEAR: ${e.message}`);
    }
    console.log(`Título: ${d.titulo?.substring(0,50)}\n`);
  }
  
  process.exit(0);
}

main().catch(console.error);
