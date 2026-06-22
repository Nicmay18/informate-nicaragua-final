/**
 * Diagnóstico detallado del tipo de fecha en Firestore
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const keyPath = join(__dirname, 'firebase-admin-key.json');
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function diag() {
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(15).get();
  
  console.log('Últimas 15 noticias (orderBy fecha desc):\n');
  
  snap.docs.forEach((doc, i) => {
    const data = doc.data();
    const fecha = data.fecha;
    const tipo = fecha === null ? 'null' :
                 fecha === undefined ? 'undefined' :
                 typeof fecha === 'string' ? 'string' :
                 typeof fecha.toMillis === 'function' ? 'Timestamp' :
                 fecha.seconds !== undefined ? 'Object{seconds,nanos}' :
                 typeof fecha === 'number' ? 'number' :
                 typeof fecha;
    
    let fechaStr = '—';
    if (tipo === 'Timestamp') {
      fechaStr = fecha.toDate().toISOString();
    } else if (tipo === 'Object{seconds,nanos}') {
      fechaStr = new Date(fecha.seconds * 1000).toISOString();
    } else if (tipo === 'string' || tipo === 'number') {
      fechaStr = String(fecha);
    }
    
    console.log(`${String(i+1).padStart(2)}. [${tipo.padEnd(20)}] ${fechaStr} | ${(data.titulo||'').substring(0,60)}`);
  });

  // También buscar sin orderBy para ver si hay documentos que orderBy excluye
  console.log('\n--- Sin orderBy (primeros 5) ---');
  const snap2 = await db.collection('noticias').limit(5).get();
  snap2.docs.forEach((doc, i) => {
    const data = doc.data();
    const fecha = data.fecha;
    const tipo = fecha === null ? 'null' :
                 fecha === undefined ? 'undefined' :
                 typeof fecha.toMillis === 'function' ? 'Timestamp' :
                 fecha.seconds !== undefined ? 'Object{seconds,nanos}' :
                 typeof fecha;
    console.log(`${String(i+1).padStart(2)}. [${tipo.padEnd(20)}] | ${(data.titulo||'').substring(0,60)}`);
  });

  // Contar tipos de fecha
  console.log('\n--- Distribución de tipos de fecha ---');
  const allSnap = await db.collection('noticias').get();
  const tipos = {};
  allSnap.docs.forEach(doc => {
    const fecha = doc.data().fecha;
    const tipo = fecha === null ? 'null' :
                 fecha === undefined ? 'undefined' :
                 typeof fecha.toMillis === 'function' ? 'Timestamp' :
                 fecha.seconds !== undefined ? 'Object{seconds,nanos}' :
                 typeof fecha === 'string' ? 'string' :
                 typeof fecha === 'number' ? 'number' :
                 'unknown';
    tipos[tipo] = (tipos[tipo] || 0) + 1;
  });
  Object.entries(tipos).forEach(([t, c]) => console.log(`  ${t}: ${c}`));

  process.exit(0);
}

diag().catch(err => { console.error('❌', err); process.exit(1); });
