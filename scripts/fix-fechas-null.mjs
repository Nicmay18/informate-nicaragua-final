/**
 * FIX FECHAS: Convierte _seconds/_nanoseconds a Timestamp proper
 * 
 * 197 documentos tienen fecha como { _seconds, _nanoseconds }
 * en vez de un Firestore Timestamp real { seconds, nanoseconds }.
 * 
 * Esto causa que mapNoticia() y getFechaMs() no puedan leer la fecha,
 * mostrando "Invalid Date" en el panel y fechas incorrectas en el sitio.
 * 
 * Uso: node scripts/fix-fechas-null.mjs
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = join(__dirname, 'firebase-admin-key.json');
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function fixFechas() {
  console.log('🔍 Escaneando todas las noticias...\n');
  
  const snap = await db.collection('noticias').get();
  
  const toFix = [];
  const alreadyOk = [];
  const nullFechas = [];
  
  snap.forEach(doc => {
    const data = doc.data();
    const fecha = data.fecha;
    
    if (fecha === null || fecha === undefined) {
      nullFechas.push({ id: doc.id, titulo: data.titulo || '' });
    } else if (typeof fecha?.toMillis === 'function') {
      alreadyOk.push(doc.id);
    } else if (fecha?.seconds !== undefined) {
      alreadyOk.push(doc.id);
    } else if (fecha?._seconds !== undefined) {
      toFix.push({
        id: doc.id,
        titulo: data.titulo || '',
        _seconds: fecha._seconds,
        _nanoseconds: fecha._nanoseconds || 0
      });
    } else if (typeof fecha === 'string') {
      const parsed = new Date(fecha);
      if (!isNaN(parsed.getTime())) {
        toFix.push({
          id: doc.id,
          titulo: data.titulo || '',
          _seconds: Math.floor(parsed.getTime() / 1000),
          _nanoseconds: 0
        });
      } else {
        nullFechas.push({ id: doc.id, titulo: data.titulo || '' });
      }
    } else {
      nullFechas.push({ id: doc.id, titulo: data.titulo || '' });
    }
  });

  console.log(`📊 Total documentos: ${snap.size}`);
  console.log(`✅ Ya OK (Timestamp): ${alreadyOk.length}`);
  console.log(`🔴 fecha null/missing: ${nullFechas.length}`);
  console.log(`🟡 fecha con _seconds (BUG): ${toFix.length}\n`);

  if (toFix.length === 0 && nullFechas.length === 0) {
    console.log('✅ Todas las fechas están OK. Nada que arreglar.');
    process.exit(0);
  }

  console.log('━━━━━ DOCUMENTOS A ARREGLAR (primeros 10) ━━━━━');
  toFix.slice(0, 10).forEach((n, i) => {
    const date = new Date(n._seconds * 1000);
    console.log(`${String(i+1).padStart(3)}. ${n.titulo.substring(0, 60)}`);
    console.log(`     _seconds: ${n._seconds} → ${date.toISOString()}`);
  });
  if (toFix.length > 10) console.log(`     ... y ${toFix.length - 10} más`);

  if (nullFechas.length > 0) {
    console.log(`\n━━━━━ DOCUMENTOS CON fecha NULL (${nullFechas.length}) ━━━━━`);
    nullFechas.forEach((n, i) => {
      console.log(`${String(i+1).padStart(3)}. ${n.titulo.substring(0, 60)} | ID: ${n.id}`);
    });
  }

  console.log('\n🔧 Arreglando...\n');

  let fixed = 0;
  let errors = 0;

  for (const n of toFix) {
    try {
      const ts = new Timestamp(n._seconds, n._nanoseconds);
      await db.collection('noticias').doc(n.id).update({ fecha: ts });
      fixed++;
    } catch (err) {
      console.error(`  ❌ ${n.id}: ${err.message}`);
      errors++;
    }
  }

  for (const n of nullFechas) {
    try {
      const docSnap = await db.collection('noticias').doc(n.id).get();
      const data = docSnap.data();
      let ts;
      
      if (data?.fechaActualizacion?.seconds !== undefined) {
        ts = data.fechaActualizacion;
      } else if (data?.fechaActualizacion?._seconds !== undefined) {
        ts = new Timestamp(data.fechaActualizacion._seconds, data.fechaActualizacion._nanoseconds || 0);
      } else if (data?.nivelFecha) {
        const parsed = new Date(data.nivelFecha);
        if (!isNaN(parsed.getTime())) ts = Timestamp.fromDate(parsed);
      }
      
      if (!ts) ts = Timestamp.now();
      await db.collection('noticias').doc(n.id).update({ fecha: ts });
      fixed++;
    } catch (err) {
      console.error(`  ❌ ${n.id}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n📋 RESUMEN:`);
  console.log(`  ✅ Arreglados: ${fixed}`);
  console.log(`  ❌ Errores: ${errors}`);
  console.log(`  📊 Total procesados: ${toFix.length + nullFechas.length}`);
  
  console.log('\n🔍 Verificando...');
  const verifySnap = await db.collection('noticias').orderBy('fecha', 'desc').limit(5).get();
  console.log('Últimas 5 noticias después del fix:');
  verifySnap.docs.forEach((doc, i) => {
    const data = doc.data();
    const fecha = data.fecha;
    const isTimestamp = typeof fecha?.toMillis === 'function' || fecha?.seconds !== undefined;
    const dateStr = isTimestamp 
      ? (fecha.toDate?.() || new Date(fecha.seconds * 1000)).toISOString()
      : 'INVALID';
    console.log(`  ${i+1}. [${isTimestamp ? '✅ Timestamp' : '❌ '+typeof fecha}] ${dateStr} | ${data.titulo?.substring(0, 50)}`);
  });

  process.exit(0);
}

fixFechas().catch(err => { console.error('❌', err); process.exit(1); });
