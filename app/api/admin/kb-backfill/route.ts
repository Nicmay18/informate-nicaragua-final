/**
 * Knowledge Base Backfill — MENI Learning 4.0 (FASE 5)
 * =====================================================
 * Reconstruye la Knowledge Base (kb_entities / kb_relations / kb_timeline)
 * sobre notas YA publicadas, usando el mismo `ingestArticle` que corre
 * post-publicación en guardar-directo. Cierra la brecha detectada en la
 * auditoría: 17 entidades para 522 notas (~3% de cobertura).
 *
 * Uso (paginado por documentId — `fecha` es de tipo mixto y no es
 * ordenable de forma fiable):
 *   POST { "limit": 50, "cursor": "<ultimoIdPrevio>" }
 * Repetir hasta `done: true`.
 *
 * Solo indexa notas publicadas (la KB alimenta contexto de noticias
 * reales, no borradores). dryRun: true cuenta sin escribir.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldPath } from 'firebase-admin/firestore';
import { ingestArticle } from '@/lib/meni/knowledge-base';
import { logger } from '@/lib/logger';

export const maxDuration = 60;

const MAX_BATCH = 100;

export async function POST(request: NextRequest) {
  if (!verifyAdminOrCleanupToken(request.headers.get('x-admin-token'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const limit = Math.min(Math.max(1, Number(body.limit) || 50), MAX_BATCH);
  const cursor = typeof body.cursor === 'string' && body.cursor ? body.cursor : null;
  const dryRun = body.dryRun === true;
  const onlyPublished = body.onlyPublished !== false;

  try {
    const db = getAdminDb();
    let query = db.collection('noticias')
      .select('titulo', 'contenido', 'slug', 'categoria', 'fecha', 'publicado', 'autor', 'departamento')
      .orderBy(FieldPath.documentId())
      .limit(limit);
    if (cursor) query = query.startAfter(cursor);

    const snap = await query.get();

    const totals = {
      processed: 0,
      skippedNotPublished: 0,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      relationsCreated: 0,
      relationsUpdated: 0,
      timelineEntries: 0,
      errors: 0,
    };

    for (const doc of snap.docs) {
      const d = doc.data();
      if (onlyPublished && d.publicado !== true) {
        totals.skippedNotPublished++;
        continue;
      }
      totals.processed++;
      if (dryRun) continue;
      try {
        const fechaRaw = d.fecha;
        const date = fechaRaw?.toDate
          ? fechaRaw.toDate().toISOString()
          : typeof fechaRaw === 'string'
            ? fechaRaw
            : new Date().toISOString();
        const res = await ingestArticle(db, {
          articleId: doc.id,
          title: String(d.titulo || ''),
          content: String(d.contenido || ''),
          slug: String(d.slug || doc.id),
          category: String(d.categoria || 'General'),
          departamento: String(d.departamento || ''),
          date,
          author: String(d.autor || ''),
        });
        totals.entitiesCreated += res.entitiesCreated;
        totals.entitiesUpdated += res.entitiesUpdated;
        totals.relationsCreated += res.relationsCreated;
        totals.relationsUpdated += res.relationsUpdated;
        totals.timelineEntries += res.timelineEntries;
      } catch (err) {
        totals.errors++;
        logger.warn('[kb-backfill] ingestArticle falló', { id: doc.id, err: String(err) });
      }
    }

    const last = snap.docs[snap.docs.length - 1];
    return NextResponse.json({
      ok: true,
      dryRun,
      ...totals,
      batchSize: snap.size,
      nextCursor: last ? last.id : null,
      done: snap.size < limit,
    });
  } catch (err) {
    logger.error('[kb-backfill]', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
