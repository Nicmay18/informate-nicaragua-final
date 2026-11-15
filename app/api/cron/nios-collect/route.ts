import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { NO_STORE_401_HEADERS, extractRequestSecret, QUERY_SECRET_DEPRECATION_NOTE, verifyAdminOrCronToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { runCEOLoop, type CEOLoopResult } from '@/lib/nios/ceo-loop';
import { generateCEODailyBrief } from '@/lib/nios/ceo-daily-brief';
import { validateTrafficReader } from '@/lib/analytics/traffic-reader';
import { recordCronHeartbeat } from '@/lib/departamento-central/heartbeat';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Cron diario — NIOS Intelligence Platform
 * Se ejecuta a las 6:00 UTC (00:00 CST Nicaragua) via Vercel Cron.
 * Recolecta datos de GSC + GA4, fusiona con Firestore, genera reportes.
 */
function isAuthorized(request: NextRequest): boolean {
  const { token, via } = extractRequestSecret(request);
  if (via === 'query') {
    logger.warn(`[cron/nios-collect] ${QUERY_SECRET_DEPRECATION_NOTE}`);
  }
  return verifyAdminOrCronToken(token);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: NO_STORE_401_HEADERS });
  }

  const startedAt = Date.now();

  try {
    const db = getAdminDb();
    const { runNIOSPipeline, NIOS_CONFIG } = await import('@/lib/nios/intelligence/orchestrator');
    const result = await runNIOSPipeline(db, NIOS_CONFIG);

    // Heartbeat inmediato tras el pipeline: el CEO loop y la validación de
    // tráfico pueden empujar la función más allá de maxDuration (60s) y el
    // heartbeat al final nunca llegaba a escribirse — la señal quedaba
    // "stale" aunque la recolección sí se ejecutara (evidencia: snapshots
    // diarios frescos + telemetry completa, heartbeat congelado desde el
    // 2026-10-31). El status refleja el resultado real del pipeline.
    await recordCronHeartbeat('/api/cron/nios-collect', {
      status: result.success ? 'healthy' : 'degraded',
      durationMs: Date.now() - startedAt,
      note: result.success
        ? `Cron /api/cron/nios-collect ejecutado (${result.articlesAnalyzed ?? '?'} artículos)`
        : `Pipeline con errores: ${(result.errors ?? []).slice(0, 3).join('; ') || 'ver telemetry'}`,
    });

    // Invalidación directa: NIOS y el panel leen el snapshot nuevo sin esperar al CEO loop.
    if (result.success) {
      try {
        const { invalidateNiosAdminCaches } = await import('@/lib/nios/repair-engine');
        await invalidateNiosAdminCaches(db, 'nios-collect');
      } catch (err) {
        logger.warn('[cron/nios-collect] Cache invalidation failed:', err);
      }
    }

    // CEO AUTONOMOUS LOOP: observe → diagnose → decide → plan → execute → verify → learn
    let ceo: CEOLoopResult | null = null;
    let ceoError: string | null = null;
    try {
      ceo = await runCEOLoop(db, 'cron/nios-collect');
      logger.info('[nios-collect] CEO loop completed:', ceo.record.summary);
    } catch (err) {
      ceoError = err instanceof Error ? err.message : String(err);
      logger.error('[nios-collect] CEO loop failed:', err);
    }

    // Validar 3 corridas de tráfico para detectar datos no confiables
    let trafficValidation = null;
    let trafficValidationError: string | null = null;
    try {
      trafficValidation = await validateTrafficReader(db, 3);
      if (trafficValidation.status === 'UNTRUSTED') {
        logger.warn('[nios-collect] TRAFFIC_DATA_UNTRUSTED:', trafficValidation);
      }
    } catch (err) {
      trafficValidationError = err instanceof Error ? err.message : String(err);
      logger.error('[nios-collect] traffic validation failed:', err);
    }

    return NextResponse.json({
      success: result.success,
      date: result.date,
      summary: result.summary,
      errors: result.errors,
      trafficValidation,
      trafficValidationError,
      ceo: {
        mode: ceo?.record.mode ?? 'UNKNOWN',
        autonomyScore: ceo?.autonomy.score ?? 0,
        autonomyMax: ceo?.autonomy.max ?? 8,
        autonomyReport: ceo?.autonomy.report ?? { OBSERVE: 'SIN_EVIDENCIA' },
        repaired: ceo?.record.repaired.length ?? 0,
        pendingHuman: ceo?.record.pendingHuman ?? 0,
        failedRepairs: ceo?.record.failedRepairs ?? 0,
        decisions: ceo?.record.decisions ?? [],
        learnings: ceo?.record.learnings ?? [],
        dailyBrief: ceo ? generateCEODailyBrief(ceo, result.date) : { dataStatus: 'UNKNOWN', points: [] },
        summary: ceo?.record.summary ?? ceoError,
        whatISaw: ceo?.record.observations ?? [],
        whatIDecided: ceo?.record.decisions ?? [],
        whatIDid: {
          repaired: ceo?.record.repaired ?? [],
          queued: (ceo?.record.decisions ?? []).filter((d) => d.decision === 'QUEUE_FOR_HUMAN'),
          failed: ceo?.record.failures ?? [],
        },
        whatILearned: ceo?.record.learnings ?? [],
        business: {
          observations: (ceo?.record.report as Record<string, unknown> | undefined)?.businessObservations ?? 0,
          decisions: (ceo?.record.report as Record<string, unknown> | undefined)?.businessDecisions ?? 0,
          queued: (ceo?.record.report as Record<string, unknown> | undefined)?.businessQueues ?? 0,
          auto: (ceo?.record.report as Record<string, unknown> | undefined)?.businessAuto ?? 0,
          blocked: (ceo?.record.report as Record<string, unknown> | undefined)?.businessBlocked ?? 0,
          trafficArticles: (ceo?.record.report as Record<string, unknown> | undefined)?.trafficArticles ?? 0,
          totalViews24h: (ceo?.record.report as Record<string, unknown> | undefined)?.totalViews24h ?? 0,
          learningPatterns: (ceo?.record.report as Record<string, unknown> | undefined)?.learningPatterns ?? 0,
        },
      },
    });
  } catch (error) {
    logger.error('[cron/nios-collect] Error:', error);
    // Fallo total del pipeline: registrar 'down' de inmediato para que la
    // alerta no dependa de esperar a que el heartbeat quede stale.
    await recordCronHeartbeat('/api/cron/nios-collect', {
      status: 'down',
      durationMs: Date.now() - startedAt,
      note: `Error: ${error instanceof Error ? error.message.slice(0, 140) : 'desconocido'}`,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
