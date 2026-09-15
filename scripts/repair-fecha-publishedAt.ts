// scripts/repair-fecha-publishedAt.ts
// Reparación ONE-TIME de fechas corruptas en `noticias`.
//
// Contexto: guardar-directo pisaba `fecha` con Timestamp.now() al re-guardar
// sin body.fecha, y dejaba docs publicados sin `publishedAt`. Resultado:
// notas de hace semanas mostradas como "hace X horas".
//
// Reglas de reparación (conservadoras):
//  1. fecha string -> Timestamp (mismo valor, solo normaliza tipo).
//  2. publishedAt ausente + doc publicado -> backfill desde fecha o createTime.
//  3. fecha Timestamp pero publishedAt existe y fecha > publishedAt + 24h
//     -> fecha fue pisada -> fecha = publishedAt.
//  4. publishedAt ausente + fecha > createTime + 24h -> fecha pisada ->
//     fecha = createTime y publishedAt = createTime.
//
// Uso:
//   npx tsx scripts/repair-fecha-publishedAt.ts          # dry-run (solo reporta)
//   npx tsx scripts/repair-fecha-publishedAt.ts --apply  # escribe en Firestore

import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });

import { Timestamp } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');
const DAY_MS = 24 * 60 * 60 * 1000;

function toMillis(v: unknown): number | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toMillis();
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'object' && v !== null && '_seconds' in (v as object)) {
    const s = (v as { _seconds: number; _nanoseconds?: number })._seconds;
    return s * 1000;
  }
  if (typeof v === 'string') {
    const t = new Date(v).getTime();
    return isNaN(t) ? null : t;
  }
  return null;
}

async function main() {
  const { adminDb } = await import('@/lib/firebase-admin');
  const snap = await adminDb.collection('noticias').get();

  const fixes: Array<{ id: string; slug: string; changes: Record<string, unknown>; reason: string }> = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const slug = data.slug || doc.id;
    const isPublished = data.publicado === true || data.estado === 'publicado';
    const fechaMs = toMillis(data.fecha);
    const publishedAtMs = toMillis(data.publishedAt);
    const createMs = doc.createTime ? doc.createTime.toMillis() : null;
    const changes: Record<string, unknown> = {};
    const reasons: string[] = [];

    // Regla 1: fecha string -> Timestamp
    if (typeof data.fecha === 'string' && fechaMs !== null) {
      changes.fecha = Timestamp.fromMillis(fechaMs);
      reasons.push('fecha:string->Timestamp');
    }

    // Regla 3: fecha pisada (publishedAt existe y fecha >> publishedAt)
    if (publishedAtMs !== null && fechaMs !== null && fechaMs > publishedAtMs + DAY_MS) {
      changes.fecha = Timestamp.fromMillis(publishedAtMs);
      reasons.push('fecha:clobbered->publishedAt');
    }

    // Regla 2/4: publishedAt ausente en doc publicado
    if (isPublished && publishedAtMs === null) {
      const fechaAfterRule3 = (changes.fecha as Timestamp | undefined)?.toMillis() ?? fechaMs;
      if (createMs !== null && fechaAfterRule3 !== null && fechaAfterRule3 > createMs + DAY_MS) {
        // fecha también fue pisada -> ambas vuelven a createTime
        changes.fecha = doc.createTime;
        changes.publishedAt = doc.createTime;
        reasons.push('fecha+publishedAt:clobbered->createTime');
      } else if (fechaAfterRule3 !== null) {
        changes.publishedAt = Timestamp.fromMillis(fechaAfterRule3);
        reasons.push('publishedAt:backfill<-fecha');
      } else if (createMs !== null) {
        changes.publishedAt = doc.createTime;
        reasons.push('publishedAt:backfill<-createTime');
      }
    }

    if (Object.keys(changes).length > 0) {
      fixes.push({ id: doc.id, slug, changes, reason: reasons.join(' | ') });
    }
  }

  console.log(`\n=== REPAIR fecha/publishedAt ${APPLY ? '(APPLY)' : '(DRY-RUN)'} ===`);
  console.log(`Docs escaneados: ${snap.size} | Docs a reparar: ${fixes.length}\n`);

  for (const f of fixes) {
    console.log(`- ${f.slug}\n    ${f.reason}\n    cambios: ${Object.keys(f.changes).join(', ')}`);
  }

  if (APPLY && fixes.length > 0) {
    const BATCH = 400;
    for (let i = 0; i < fixes.length; i += BATCH) {
      const batch = adminDb.batch();
      for (const f of fixes.slice(i, i + BATCH)) {
        batch.update(adminDb.collection('noticias').doc(f.id), f.changes);
      }
      await batch.commit();
      console.log(`Batch ${i / BATCH + 1}: ${Math.min(BATCH, fixes.length - i)} docs escritos`);
    }
    console.log(`\nReparados: ${fixes.length}`);
  } else if (!APPLY && fixes.length > 0) {
    console.log(`\nDry-run. Re-correr con --apply para escribir.`);
  }
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
