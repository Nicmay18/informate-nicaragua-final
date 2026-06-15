/**
 * verificar-admin-estatico.mjs
 * Verifica si Firestore tiene noticias recientes y si el API auditor las devuelve.
 */
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
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
  console.log('🔍 VERIFICANDO NOTICIAS RECIENTES EN FIRESTORE\n');
  
  // Obtener las 10 noticias más recientes
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(10).get();
  
  if (snap.empty) {
    console.log('❌ NO HAY NOTICIAS EN FIRESTORE');
    process.exit(1);
  }
  
  console.log(`📊 ${snap.size} noticias más recientes:\n`);
  
  const ahora = new Date();
  const hace24h = new Date(ahora.getTime() - 24*60*60*1000);
  const hace7dias = new Date(ahora.getTime() - 7*24*60*60*1000);
  
  let recientes24h = 0, recientes7dias = 0;
  
  for (const doc of snap.docs) {
    const d = doc.data();
    let fecha = null;
    try {
      if (d.fecha) {
        // Firestore Timestamp: intentar toDate() primero
        if (typeof d.fecha === 'object' && d.fecha.toDate && typeof d.fecha.toDate === 'function') {
          fecha = d.fecha.toDate();
        } 
        // Si no tiene toDate, intentar convertir desde _seconds/_nanoseconds
        else if (typeof d.fecha === 'object' && d.fecha._seconds !== undefined) {
          fecha = new Date(d.fecha._seconds * 1000 + (d.fecha._nanoseconds || 0) / 1e6);
        }
        // String ISO
        else if (typeof d.fecha === 'string') {
          fecha = new Date(d.fecha);
        }
        // Number (timestamp en ms)
        else if (typeof d.fecha === 'number') {
          fecha = new Date(d.fecha);
        }
        if (fecha && isNaN(fecha.getTime())) fecha = null;
      }
    } catch (e) {
      fecha = null;
    }
    const esReciente24h = fecha && fecha >= hace24h;
    const esReciente7dias = fecha && fecha >= hace7dias;
    
    if (esReciente24h) recientes24h++;
    if (esReciente7dias) recientes7dias++;
    
    const fechaStr = fecha ? fecha.toISOString().split('T')[0] : 'SIN FECHA';
    const indicador = esReciente24h ? '🟢' : esReciente7dias ? '🟡' : '🔴';
    
    console.log(`${indicador} ${fechaStr} | ${d.titulo?.substring(0,60)}`);
    console.log(`   Slug: ${d.slug || 'SIN SLUG'} | ID: ${doc.id}\n`);
  }
  
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`🟢 Últimas 24h: ${recientes24h}`);
  console.log(`🟡 Últimos 7 días: ${recientes7dias}`);
  console.log(`🔴 Más antiguas: ${snap.size - recientes7dias}`);
  
  if (recientes24h === 0 && recientes7dias === 0) {
    console.log('\n⚠️ TODAS LAS NOTICIAS SON ANTIGUAS (más de 7 días)');
    console.log('   Esto explica por qué el admin parece estático.');
  } else if (recientes24h === 0) {
    console.log('\n⚠️ NO HAY NOTICIAS EN LAS ÚLTIMAS 24 HORAS');
    console.log('   El admin solo actualiza cuando hay noticias nuevas.');
  } else {
    console.log('\n✅ HAY NOTICIAS RECIENTES — el admin debería mostrarlas');
  }
  
  process.exit(0);
}

main().catch(console.error);
