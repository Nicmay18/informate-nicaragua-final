import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { NO_STORE_401_HEADERS, extractRequestSecret, QUERY_SECRET_DEPRECATION_NOTE, verifyAdminOrCronToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { runCEOLoop, type CEOLoopResult } from '@/lib/nios/ceo-loop';
import { generateCEODailyBrief } from '@/lib/nios/ceo-daily-brief';
import { validateTrafficReader } from '@/lib/analytics/traffic-reader';
import { recordCronHeartbeat } from '@/lib/departamento-central/heartbeat';

// Hobby + Fluid compute: máximo documentado 300s (5 min). El pipeline mide
// ~99s + CEO loop; 300s da margen real sin "ocultar" el timeout — la función
// completa sus etapas dentro del límite del plan.
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const RUNS_COLLECTION = 'nios_runs';
const RUN_LEASE_MS = 15 * 60 * 1000; // si la función muere, el lock expira y el siguiente intento puede continuar

type RunStageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

interface NIOSRunState {
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  finishedAt?: string;
  lockedUntil: string;
  stages: Record<string, { status: RunStageStatus; durationMs?: number; detail?: string }>;
  summary?: string;
  errors?: string[];
  forced?: boolean;
}

/**
 * Cron diario — NIOS Intelligence Platform
 * Se ejecuta a las 6:00 UTC (00:00 CST Nicaragua) via Vercel Cron.
 * Recolecta datos de GSC + GA4, fusiona con Firestore, genera reportes.
 *
 * Estado de ejecución honesto en `nios_runs/{YYYY-MM-DD}`:
 * - `running` con `lockedUntil` = lease anti-ejecuciones duplicadas (Vercel
 *   cron no reintenta, pero una invocación manual concurrente o un retry del
 *   scheduler no debe lanzar dos pipelines sobre Firestore).
 * - Cada etapa actualiza su estado real; el heartbeat solo queda `healthy`
 *   si TODAS las etapas esenciales completaron sin errores.
 */
function isAuthorized(request: NextRequest): boolean {
  const { token, via } = extractRequestSecret(request);
  if (via === 'query') {
    logger.warn(`[cron/nios-collect] ${QUERY_SECRET_DEPRECATION_NOTE}`);
  }
  return verifyAdminOrCronToken(token);
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: NO_STORE_401_HEADERS });
  }

  const startedAt = Date.now();
  const force = request.nextUrl.searchParams.get('force') === '1';
  const db = getAdminDb();
  const runRef = db.collection(RUNS_COLLECTION).doc(todayUTC());

  // ── Lease: evita ejecuciones duplicadas del mismo día ──────────────────
  let acquired = false;
  try {
    acquired = await db.runTransaction(async (tx) => {
      const snap = await tx.get(runRef);
      const data = snap.data() as NIOSRunState | undefined;
      const now = Date.now();
      if (!force) {
        if (data?.status === 'completed') return false;
        if (
          data?.status === 'running' &&
          data.lockedUntil &&
          new Date(data.lockedUntil).getTime() > now
        ) {
          return false;
        }
      }
      tx.set(
        runRef,
        {
          status: 'running',
          startedAt: new Date(startedAt).toISOString(),
          lockedUntil: new Date(startedAt + RUN_LEASE_MS).toISOString(),
          stages: {},
          ...(force ? { forced: true } : {}),
        } satisfies Partial<NIOSRunState> & Record<string, unknown>,
        { merge: true },
      );
      return true;
    });
  } catch (err) {
    logger.error('[cron/nios-collect] Lease acquisition failed:', err);
  }

  if (!acquired) {
    const snap = await runRef.get();
    const data = snap.data() as NIOSRunState | undefined;
    const reason = data?.status === 'completed' ? 'already_completed' : 'already_running';
    return NextResponse.json(
      { success: true, skipped: reason, run: data ?? null },
      { status: reason === 'already_running' ? 409 : 200 },
    );
  }

  const setStage = async (stage: string, status: RunStageStatus, detail?: string, durationMs?: number) => {
    try {
      await runRef.set(
        { stages: { [stage]: { status, detail, durationMs } } },
        { merge: true },
      );
    } catch (err) {
      logger.warn(`[cron/nios-collect] No se pudo actualizar etapa ${stage}:`, err);
    }
  };

  const finishRun = async (status: 'completed' | 'failed', summary?: string, errors?: string[]) => {
    try {
      await runRef.set(
        {
          status,
          finishedAt: new Date().toISOString(),
          summary,
          errors: errors ?? [],
        },
        { merge: true },
      );
    } catch (err) {
      logger.warn('[cron/nios-collect] No se pudo cerrar run state:', err);
    }
  };

  try {
    const { runNIOSPipeline, NIOS_CONFIG } = await import('@/lib/nios/intelligence/orchestrator');

    await setStage('pipeline', 'running');
    const pipelineStarted = Date.now();
    const result = await runNIOSPipeline(db, NIOS_CONFIG);
    await setStage(
      'pipeline',
      result.success ? 'completed' : 'failed',
      `${result.articlesAnalyzed ?? '?'} artículos`,
      Date.now() - pipelineStarted,
    );

    // Invalidación directa: NIOS y el panel leen el snapshot nuevo sin esperar al CEO loop.
    if (result.success) {
      try {
        const { invalidateNiosAdminCaches } = await import('@/lib/nios/repair-engine');
        await invalidateNiosAdminCaches(db, 'nios-collect');
        await setStage('cache-invalidation', 'completed');
      } catch (err) {
        await setStage('cache-invalidation', 'failed', err instanceof Error ? err.message : String(err));
        logger.warn('[cron/nios-collect] Cache invalidation failed:', err);
      }
    } else {
      await setStage('cache-invalidation', 'skipped');
    }

    // CEO AUTONOMOUS LOOP: observe → diagnose → decide → plan → execute → verify → learn
    let ceo: CEOLoopResult | null = null;
    let ceoError: string | null = null;
    const ceoStarted = Date.now();
    await setStage('ceo-loop', 'running');
    try {
      ceo = await runCEOLoop(db, 'cron/nios-collect');
      logger.info('[nios-collect] CEO loop completed:', ceo.record.summary);
      await setStage('ceo-loop', 'completed', ceo.record.summary, Date.now() - ceoStarted);
    } catch (err) {
      ceoError = err instanceof Error ? err.message : String(err);
      await setStage('ceo-loop', 'failed', ceoError, Date.now() - ceoStarted);
      logger.error('[nios-collect] CEO loop failed:', err);
    }

    // Validar 3 corridas de tráfico para detectar datos no confiables
    let trafficValidation = null;
    let trafficValidationError: string | null = null;
    const trafficStarted = Date.now();
    await setStage('traffic-validation', 'running');
    try {
      trafficValidation = await validateTrafficReader(db, 3);
      await setStage(
        'traffic-validation',
        trafficValidation.status === 'UNTRUSTED' ? 'failed' : 'completed',
        `status=${trafficValidation.status}`,
        Date.now() - trafficStarted,
      );
      if (trafficValidation.status === 'UNTRUSTED') {
        logger.warn('[nios-collect] TRAFFIC_DATA_UNTRUSTED:', trafficValidation);
      }
    } catch (err) {
      trafficValidationError = err instanceof Error ? err.message : String(err);
      await setStage('traffic-validation', 'failed', trafficValidationError, Date.now() - trafficStarted);
      logger.error('[nios-collect] traffic validation failed:', err);
    }

    const durationMs = Date.now() - startedAt;
    // healthy SOLO si todas las etapas esenciales completaron limpias:
    // pipeline OK + CEO loop OK + tráfico confiable. Cualquier etapa
    // fallida o datos no confiables → degraded (down solo en excepción total).
    const essentialOk =
      result.success && ceo !== null && ceoError === null &&
      trafficValidation !== null && trafficValidationError === null &&
      trafficValidation.status !== 'UNTRUSTED';
    const runStatus = essentialOk ? 'completed' : 'failed';
    const heartbeatStatus = essentialOk ? 'healthy' : 'degraded';
    const noteParts = [
      `pipeline=${result.success ? 'ok' : 'fail'} (${result.articlesAnalyzed ?? '?'} art.)`,
      `ceo=${ceoError ? 'fail' : 'ok'}`,
      `traffic=${trafficValidation?.status ?? trafficValidationError ?? 'error'}`,
    ];

    await finishRun(runStatus, result.summary, [...result.errors, ...(ceoError ? [`ceo: ${ceoError}`] : []), ...(trafficValidationError ? [`traffic: ${trafficValidationError}`] : [])]);
    await recordCronHeartbeat('/api/cron/nios-collect', {
      status: heartbeatStatus,
      durationMs,
      note: `Cron /api/cron/nios-collect: ${noteParts.join(' · ')} (${durationMs}ms)`,
    });

    return NextResponse.json({
      success: essentialOk,
      runStatus,
      heartbeat: heartbeatStatus,
      date: result.date,
      summary: result.summary,
      errors: result.errors,
      durationMs,
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
    const errMsg = error instanceof Error ? error.message : 'desconocido';
    await finishRun('failed', undefined, [errMsg]);
    await recordCronHeartbeat('/api/cron/nios-collect', {
      status: 'down',
      durationMs: Date.now() - startedAt,
      note: `Error: ${errMsg.slice(0, 140)}`,
    });
    return NextResponse.json(
      { error: errMsg },
      { status: 500 },
    );
  }
}
