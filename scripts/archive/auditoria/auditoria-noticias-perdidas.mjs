/**
 * auditoria-noticias-perdidas.mjs
 * Busca noticias que podrian no tener el campo 'fecha' pero que fueron creadas recientemente.
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
  console.log('🔬 AUDITORÍA FORENSE: BUSCANDO NOTICIAS "PERDIDAS" (SIN FECHA O CON FECHA MAL)\n');
  
  // Obtenemos las últimas 50 noticias por orden de Firestore (sin sort por fecha)
  // O mejor, intentamos ordenar por fechaActualizacion si existe
  const snap = await db.collection('noticias').limit(100).get();
  
  console.log(`Analizando ${snap.size} documentos...\n`);
  
  const hallazgos = [];
  
  for (const doc of snap.docs) {
    const d = doc.data();
    const fecha = d.fecha;
    const fechaAct = d.fechaActualizacion;
    
    // Verificamos si es reciente por algun campo
    let fechaReal = null;
    if (fechaAct) {
      fechaReal = fechaAct.toDate ? fechaAct.toDate() : new Date(fechaAct);
    } else if (fecha) {
      fechaReal = fecha.toDate ? fecha.toDate() : new Date(fecha);
    }
    
    // Si la fecha es de junio 2026 (mes actual en el sistema del usuario segun el prompt)
    const esJunio2026 = fechaReal && fechaReal.getFullYear() === 2026 && fechaReal.getMonth() === 5; // 5 es Junio (0-indexed)
    
    if (esJunio2026 || !fecha) {
      hallazgos.push({
        id: doc.id,
        titulo: d.titulo || 'SIN TITULO',
        fecha: d.fecha ? 'TIENE' : 'FALTA',
        fechaActualizacion: d.fechaActualizacion ? 'TIENE' : 'FALTA',
        fechaValor: fechaReal ? fechaReal.toISOString() : 'N/A'
      });
    }
  }
  
  // Ordenar hallazgos por fechaValor desc
  hallazgos.sort((a,b) => {
    if (a.fechaValor === 'N/A') return 1;
    if (b.fechaValor === 'N/A') return -1;
    return b.fechaValor.localeCompare(a.fechaValor);
  });
  
  console.log('📋 NOTICIAS RECIENTES (JUNIO 2026) O SIN FECHA:');
  hallazgos.slice(0, 20).forEach(h => {
    console.log(`${h.fechaValor} | ${h.titulo.substring(0,60)}`);
    console.log(`   ID: ${h.id} | fecha: ${h.fecha} | fechaActualizacion: ${h.fechaActualizacion}\n`);
  });
  
  process.exit(0);
}

main().catch(console.error);
