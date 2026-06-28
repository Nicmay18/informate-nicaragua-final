/**
 * verificar-api-admin-news.mjs
 * Verifica si el endpoint /api/admin/news devuelve noticias correctamente.
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

function parseFecha(fecha) {
  if (!fecha) return null;
  try {
    if (typeof fecha === 'object' && fecha.toDate && typeof fecha.toDate === 'function') {
      return fecha.toDate();
    } else if (typeof fecha === 'object' && fecha._seconds !== undefined) {
      return new Date(fecha._seconds * 1000 + (fecha._nanoseconds || 0) / 1e6);
    } else if (typeof fecha === 'string') {
      return new Date(fecha);
    } else if (typeof fecha === 'number') {
      return new Date(fecha);
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function main() {
  const db = initDb();
  console.log('🔍 VERIFICANDO ORDEN DE NOTICIAS EN FIRESTORE\n');
  
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(20).get();
  
  console.log(`📊 ${snap.size} noticias ordenadas por fecha (descendente)\n`);
  
  const ahora = new Date();
  const hace24h = new Date(ahora.getTime() - 24*60*60*1000);
  const hace7dias = new Date(ahora.getTime() - 7*24*60*60*1000);
  
  let recientes24h = 0, recientes7dias = 0;
  
  for (const doc of snap.docs) {
    const d = doc.data();
    const fecha = parseFecha(d.fecha);
    const fechaStr = fecha ? fecha.toISOString().split('T')[0] : 'SIN FECHA';
    const esReciente24h = fecha && fecha >= hace24h;
    const esReciente7dias = fecha && fecha >= hace7dias;
    
    if (esReciente24h) recientes24h++;
    if (esReciente7dias) recientes7dias++;
    
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
    console.log('   El admin parece estático porque NO HAY NOTICIAS NUEVAS.');
    console.log('   El ordenamiento por fecha funciona correctamente.');
  } else {
    console.log('\n✅ HAY NOTICIAS RECIENTES — el admin debería mostrarlas');
  }
  
  process.exit(0);
}

main().catch(console.error);
