/**
 * Ciclo controlado de aprendizaje MENI (FASE 4 — Learning 4.0)
 * ==========================================================
 * Cron semanal (vercel.json). NO corre en cada publicación ni dentro del
 * flujo de evaluación. Ejecuta:
 *   1. runLearningCycle  — análisis de métricas → insights (solo escribe
 *      learning_cycles; los ajustes de peso NUNCA se auto-activan).
 *   2. runExperienceHarvest — correcciones → patrones candidatos
 *      (gobernados) + candidatos a falso positivo desde decision log.
 *
 * El ciclo solo OBSERVA, DETECTA y PROPONE. La activación de conocimiento
 * requiere aprobación humana vía /api/admin/meni-learning.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { runLearningCycle } from '@/lib/meni/learning-engine';
import { runExperienceHarvest } from '@/lib/meni/learning-engine/experience-harvest';
import { logger } from '@/lib/logger';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
    || request.nextUrl.searchParams.get('secret')
    || request.headers.get('x-admin-token')
    || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!verifyAdminOrCronToken(secret)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const [cycle, harvest] = await Promise.all([
      runLearningCycle(db).catch((err) => {
        logger.warn('[meni-learning-cycle] runLearningCycle falló:', err);
        return null;
      }),
      runExperienceHarvest(db).catch((err) => {
        logger.warn('[meni-learning-cycle] runExperienceHarvest falló:', err);
        return null;
      }),
    ]);

    return NextResponse.json({
      ok: true,
      cycle: cycle
        ? {
            articlesAnalyzed: cycle.totalArticlesAnalyzed,
            insights: cycle.insights.length,
            weightAdjustmentsProposed: cycle.weightAdjustments.length,
          }
        : null,
      harvest,
    });
  } catch (err) {
    logger.error('[meni-learning-cycle]', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
