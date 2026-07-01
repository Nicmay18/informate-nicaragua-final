import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'informate-instant-nicaragua-c7bc9eb4f553.json'), 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  console.log('==========================================');
  console.log('SINCRONIZANDO metaDescription → resumen');
  console.log('==========================================\n');

  const snapshot = await db.collection('noticias').get();
  let actualizadas = 0;
  let yaOK = 0;
  let fallidas = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const meta = (data.metaDescription || '').trim();
    const res = (data.resumen || '').trim();

    // Solo actualizar si metaDescription existe, es bueno (120-160), y resumen es diferente o más largo
    if (meta.length >= 120 && meta.length <= 160 && meta !== res) {
      try {
        await db.collection('noticias').doc(doc.id).update({
          resumen: meta,
          fechaActualizacion: new Date().toISOString()
        });
        actualizadas++;
        console.log(`OK ${doc.id.slice(0,40).padEnd(40)} | meta=${meta.length}c → resumen=${res.length}c → ${meta.length}c`);
      } catch (err) {
        fallidas++;
        console.error(`FAIL ${doc.id}:`, err.message);
      }
    } else if (meta === res && meta.length >= 120 && meta.length <= 160) {
      yaOK++;
    }
  }

  console.log(`\n=================================`);
  console.log(`Sincronizadas: ${actualizadas}`);
  console.log(`Ya estaban OK: ${yaOK}`);
  console.log(`Fallidas:      ${fallidas}`);
  console.log(`Total:         ${snapshot.size}`);
  console.log(`=================================`);
}

main().catch(console.error);
