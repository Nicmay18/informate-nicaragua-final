/**
 * Script de migración: Rellena fechaActualizacion faltante copiando fecha.
 * Esto elimina el contador "Sin Fecha Act." de la Auditoría Maestra.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'firebase-admin-key.json'), 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  console.log('\n=== MIGRACIÓN: fechaActualizacion faltante ===\n');

  const snap = await db.collection('noticias').limit(500).get();
  const sinFechaAct = [];

  snap.docs.forEach(d => {
    const data = d.data();
    if (!data.fechaActualizacion && data.fecha) {
      sinFechaAct.push({ id: d.id, titulo: (data.titulo || '').slice(0, 50) });
    }
  });

  console.log(`Noticias sin fechaActualizacion: ${sinFechaAct.length}`);

  if (sinFechaAct.length === 0) {
    console.log('Nada que migrar. ✅');
    process.exit(0);
  }

  // Batch de 500 max
  const batch = db.batch();
  let count = 0;

  for (const item of sinFechaAct) {
    const docRef = db.collection('noticias').doc(item.id);
    const docSnap = await docRef.get();
    const data = docSnap.data();

    let fechaAct;
    if (data.fecha instanceof Timestamp) {
      fechaAct = data.fecha;
    } else if (data.fecha && typeof data.fecha === 'object' && data.fecha._seconds !== undefined) {
      fechaAct = new Timestamp(data.fecha._seconds, data.fecha._nanoseconds || 0);
    } else if (data.fecha && typeof data.fecha === 'object' && data.fecha.seconds !== undefined) {
      fechaAct = new Timestamp(data.fecha.seconds, data.fecha.nanoseconds || 0);
    } else if (typeof data.fecha === 'string') {
      const d = new Date(data.fecha);
      fechaAct = Timestamp.fromDate(d);
    } else {
      fechaAct = Timestamp.now();
    }

    batch.update(docRef, { fechaActualizacion: fechaAct });
    count++;
    console.log(`  → ${item.titulo}...`);
  }

  await batch.commit();
  console.log(`\n✅ ${count} noticias actualizadas con fechaActualizacion`);
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
