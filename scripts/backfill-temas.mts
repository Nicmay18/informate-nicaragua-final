// Backfill del campo `temas` en noticias — una sola pasada.
// /tema/[slug] filtra por `temas` (array-contains); los docs existentes no
// tienen el campo hasta que una escritura editorial los toque. Este script
// los puebla una vez. Idempotente: solo escribe cuando difiere.
//
// Uso:
//   npx tsx scripts/backfill-temas.mts          # dry-run (solo reporta)
//   npx tsx scripts/backfill-temas.mts --apply  # escribe en Firestore
import { config } from 'dotenv';
config({ path: '.env.local' });
import type { DocumentReference } from 'firebase-admin/firestore';

const { getAdminDb } = await import('../lib/firebase-admin');
const { computeTemaSlugs } = await import('../lib/temas');

const APPLY = process.argv.includes('--apply');
const db = getAdminDb();

const snap = await db.collection('noticias').get();
console.log(`docs leídos: ${snap.size} | modo: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);

let toUpdate = 0;
let unchanged = 0;
const ops: { ref: DocumentReference; temas: string[] }[] = [];

for (const doc of snap.docs) {
  const d = doc.data();
  const temas = computeTemaSlugs(d);
  const prev = Array.isArray(d.temas) ? [...d.temas].sort() : [];
  const next = [...temas].sort();
  if (prev.length === next.length && prev.every((t, i) => t === next[i])) {
    unchanged++;
    continue;
  }
  toUpdate++;
  ops.push({ ref: doc.ref, temas });
}

console.log(`a actualizar: ${toUpdate} | ya correctos: ${unchanged}`);

if (APPLY) {
  const BATCH = 400;
  for (let i = 0; i < ops.length; i += BATCH) {
    const batch = db.batch();
    for (const op of ops.slice(i, i + BATCH)) batch.update(op.ref, { temas: op.temas });
    await batch.commit();
    console.log(`  batch ${Math.floor(i / BATCH) + 1}: ${Math.min(i + BATCH, ops.length)}/${ops.length}`);
  }
  console.log('Backfill completo.');
} else {
  console.log('Dry-run — nada escrito. Repetir con --apply para persistir.');
}
process.exit(0);
