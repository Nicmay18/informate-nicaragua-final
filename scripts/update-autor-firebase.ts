#!/usr/bin/env tsx
/**
 * Script para actualizar masivamente el campo 'autor' en Firebase Firestore.
 * Cambia 'Keyling Rivera M.' → 'Keyling Elieth Rivera Muñoz' en TODA la colección 'noticias'.
 *
 * USO:
 *   npx tsx scripts/update-autor-firebase.ts
 *
 * Requiere variables de entorno de Firebase configuradas (mismas que usa la app).
 */

import { getAdminDb } from '../lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  const collection = db.collection('noticias');

  // Buscar todos los documentos con el nombre antiguo
  const snapshot = await collection
    .where('autor', '==', 'Keyling Rivera M.')
    .get();

  if (snapshot.empty) {
    console.log('✅ No se encontraron documentos con autor "Keyling Rivera M.". Todo está actualizado.');
    return;
  }

  console.log(`📝 Se encontraron ${snapshot.size} documentos para actualizar...\n`);

  const batch = db.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    batch.update(doc.ref, { autor: 'Keyling Elieth Rivera Muñoz' });
    count++;
    console.log(`  → ${doc.id}: ${doc.data().titulo?.substring(0, 60) || '(sin título)'}...`);

    // Firestore limita batches a 500 operaciones
    if (count % 450 === 0) {
      await batch.commit();
      console.log(`\n💾 Batch de ${count} documentos guardado.\n`);
    }
  }

  // Commit final
  if (count % 450 !== 0) {
    await batch.commit();
  }

  console.log(`\n✅ Listo. ${count} documento(s) actualizado(s) a "Keyling Elieth Rivera Muñoz".`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
