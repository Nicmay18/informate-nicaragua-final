/**
 * Inspeccionar el contenido real de fechas tipo 'object' desconocido
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

async function inspect() {
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(5).get();
  
  snap.docs.forEach((doc, i) => {
    const data = doc.data();
    const fecha = data.fecha;
    console.log(`\n--- Doc ${i+1}: ${data.titulo?.substring(0, 50)} ---`);
    console.log('Tipo:', typeof fecha);
    console.log('Es Timestamp?', typeof fecha?.toMillis === 'function');
    console.log('Keys:', Object.keys(fecha || {}));
    console.log('Valor completo:', JSON.stringify(fecha, null, 2));
    console.log('_seconds:', fecha?._seconds);
    console.log('_nanoseconds:', fecha?._nanoseconds);
    console.log('seconds:', fecha?.seconds);
    console.log('nanoseconds:', fecha?.nanoseconds);
  });

  // También ver uno sin orderBy
  console.log('\n=== Sin orderBy ===');
  const snap2 = await db.collection('noticias').get();
  let count = 0;
  snap2.docs.forEach(doc => {
    const fecha = doc.data().fecha;
    if (typeof fecha === 'object' && fecha !== null && typeof fecha.toMillis !== 'function' && fecha.seconds === undefined) {
      if (count < 3) {
        console.log(`\nDoc: ${doc.id}`);
        console.log('Keys:', Object.keys(fecha));
        console.log('JSON:', JSON.stringify(fecha));
        count++;
      }
    }
  });

  process.exit(0);
}

inspect().catch(err => { console.error('❌', err); process.exit(1); });
