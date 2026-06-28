/**
 * reparar-fechas-noticias.mjs
 * Asigna fecha a noticias que no tienen campo 'fecha'.
 * Usa fechaActualizacion si existe, o fecha actual.
 */
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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
  console.log('🔍 BUSCANDO NOTICIAS SIN FECHA...\n');
  
  const snap = await db.collection('noticias').get();
  const sinFecha = [];
  
  for (const doc of snap.docs) {
    const d = doc.data();
    if (!d.fecha) {
      sinFecha.push({ id: doc.id, titulo: d.titulo, fechaActualizacion: d.fechaActualizacion });
    }
  }
  
  console.log(`📊 ${sinFecha.length} noticias sin fecha de ${snap.size} total\n`);
  
  if (sinFecha.length === 0) {
    console.log('✅ Todas las noticias tienen fecha');
    process.exit(0);
  }
  
  let actualizadas = 0;
  const batch = db.batch();
  const BATCH_SIZE = 400;
  
  for (const noticia of sinFecha) {
    const docRef = db.collection('noticias').doc(noticia.id);
    // Usar fechaActualizacion si existe, o fecha actual
    const fechaAsignar = noticia.fechaActualizacion || new Date();
    batch.update(docRef, { fecha: fechaAsignar });
    actualizadas++;
    
    if (actualizadas % BATCH_SIZE === 0) {
      await batch.commit();
      console.log(`✅ Procesadas ${actualizadas}/${sinFecha.length}...`);
    }
  }
  
  if (actualizadas % BATCH_SIZE !== 0) {
    await batch.commit();
  }
  
  console.log(`\n✅ ${actualizadas} noticias actualizadas con fecha`);
  process.exit(0);
}

main().catch(console.error);
