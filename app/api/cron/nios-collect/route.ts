import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { NO_STORE_401_HEADERS, extractRequestSecret, QUERY_SECRET_DEPRECATION_NOTE, verifyAdminOrCronToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { runCEOLoop } from '@/lib/nios/ceo-loop';
import { validateTrafficReader } from '@/lib/analytics/traffic-reader';
import { recordCronHeartbeat } from '@/lib/departamento-central/heartbeat';

// Vercel Hobby (este proyecto NO tiene Fluid compute): máximo real 60s.
// El pipeline completo mide ~163s (collect ~35s + analyze ~40s + CEO ~53s
// + tráfico ~21s), así que se divide en 4 etapas reanudables invocadas por
// cron entries escalonados (vercel.json). Cada etapa persiste su estado en
// nios_runs/{YYYY-MM-DD} y es idempotente: re-ejecutarla no repite trabajo.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const RUNS_COLLECTION = 'nios_runs';
const STAGE_LEASE_MS = 12 * 60 * 1000; // una etapa que exceda esto se considera colgada y puede reintentarse

const STAGES = ['collect', 'analyze', 'ceo', 'finalize'] as const;
type Stage = (typeof STAGES)[number];

// Etapas previas que deben estar completadas antes de ejecutar cada una.
// finalize admite ceo 'failed': debe poder cerrar el run honestamente.
const PREREQUISITES: Record<Stage, Stage[]> = {
  collect: [],
  analyze: ['collect'],
  ceo: ['analyze'],
  finalize: ['ceo'],
};

interface StageState {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  finishedAt?: string;
  lockedUntil?: string;
  durationMs?: number;
  detail?: string;
  data?: Record<string, unknown>;
}

interface NIOSRunState {
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  finishedAt?: string;
  stages: Record<Stage, StageState>;
  summary?: string;
  errors?: string[];
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function initialStages(): Record<Stage, StageState> {
  return {
    collect: { status: 'pending' },
    analyze: { status: 'pending' },
    ceo: { status: 'pending' },
    finalize: { status: 'pending' },
  };
}

/**
 * Cron diario — NIOS Intelligence Platform (por etapas, Hobby-safe)
 * =================================================================
 * Verdad operativa (corregida): el cron está configurado a las 08:00 UTC
 * (02:00 CST Nicaragua), NO a las 06:00 como decía el comentario anterior.
 *
 * Etapas (vercel.json, una invocación por etapa):
 *   08:00 UTC  ?stage=collect   → GSC + GA4 + merge + persiste artículos
 *   08:30 UTC  ?stage=analyze   → reportes + snapshot diario + telemetría
 *   09:00 UTC  ?stage=ceo       → invalidación cache + CEO loop
 *   09:30 UTC  ?stage=finalize  → validación tráfico + heartbeat + cierre
 *
 * Sin ?stage= ejecuta la primera etapa pendiente (permite recuperación
 * manual: invocar la ruta varias veces avanza el run).
 * ?force=1 permite re-ejecutar una etapa ya completada.
 */
function isAuthorized(request: NextRequest): boolean {
  const { token, via } = extractRequestSecret(request);
  if (via === 'query') {
    logger.warn(`[cron/nios-collect] ${QUERY_SECRET_DEPRECATION_NOTE}`);
  }
  return verifyAdminOrCronToken(token);
}

async function getRunState(db: FirebaseFirestore.Firestore, date: string) {
  const snap = await db.collection(RUNS_COLLECTION).doc(date).get();
  return snap.data() as NIOSRunState | undefined;
}

// Firestore rechaza `undefined` en cualquier nivel del documento.
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripUndefined) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

async function writeRunState(
  db: FirebaseFirestore.Firestore,
  date: string,
  patch: Record<string, unknown>,
) {
  await db.collection(RUNS_COLLECTION).doc(date).set(stripUndefined(patch), { merge: true });
}

function nextPendingStage(run: NIOSRunState | undefined): Stage {
  const stages = run?.stages ?? initialStages();
  for (const s of STAGES) {
    if (stages[s]?.status !== 'completed' && stages[s]?.status !== 'skipped') return s;
  }
  return 'finalize';
}

/**
 * Heartbeat agregado y honesto: refleja el estado del run COMPLETO.
 * healthy solo cuando finalize completó con todas las etapas esenciales OK.
 * degraded mientras falten etapas o alguna falló; down solo en excepción.
 */
async function heartbeatForRun(
  run: NIOSRunState | undefined,
  durationMs: number,
  note: string,
  forceStatus?: 'healthy' | 'degraded' | 'down',
) {
  let status: 'healthy' | 'degraded' | 'down' = forceStatus ?? 'degraded';
  if (!forceStatus && run?.status === 'completed') {
    const stages = run.stages;
    const analyzeData = stages.analyze?.data as { resultSuccess?: boolean } | undefined;
    const ceoOk = stages.ceo?.status === 'completed';
    const trafficOk = stages.finalize?.data?.trafficStatus !== 'UNTRUSTED' &&
      stages.finalize?.data?.trafficStatus !== 'ERROR';
    status = stages.collect?.status === 'completed' &&
      stages.analyze?.status === 'completed' && analyzeData?.resultSuccess === true &&
      ceoOk && trafficOk ? 'healthy' : 'degraded';
  }
  await recordCronHeartbeat('/api/cron/nios-collect', {
    status,
    durationMs,
    note,
  });
}

async function markStage(
  db: FirebaseFirestore.Firestore,
  date: string,
  stage: Stage,
  status: StageState['status'],
  extra?: { detail?: string; data?: Record<string, unknown>; durationMs?: number },
) {
  const now = new Date().toISOString();
  const stageState: StageState = {
    status,
    finishedAt: now,
    ...(extra?.detail !== undefined ? { detail: extra.detail } : {}),
    ...(extra?.data !== undefined ? { data: extra.data } : {}),
    ...(extra?.durationMs !== undefined ? { durationMs: extra.durationMs } : {}),
  };
  await writeRunState(db, date, { stages: { [stage]: stageState } });
}

// ─── Ejecutores de etapa ────────────────────────────────────────────────────

async function execCollect(db: FirebaseFirestore.Firestore, date: string) {
  const { NIOS_CONFIG, createPipelineContext, runPipelineCollectPhase, persistCollectPhase } =
    await import('@/lib/nios/intelligence/orchestrator');
  const ctx = createPipelineContext(NIOS_CONFIG);
  const { articlesCount } = await runPipelineCollectPhase(db, ctx);
  await persistCollectPhase(db, date, ctx);
  return {
    articlesCount,
    gsc: Boolean(ctx.gsc),
    ga4: Boolean(ctx.ga4),
    errors: ctx.errors,
  };
}

async function execAnalyze(db: FirebaseFirestore.Firestore, date: string) {
  const {
    NIOS_CONFIG,
    restorePipelineContext,
    runPipelineAnalyzePhase,
    cleanupPipelineState,
  } = await import('@/lib/nios/intelligence/orchestrator');
  const ctx = await restorePipelineContext(db, date, NIOS_CONFIG);
  const result = await runPipelineAnalyzePhase(db, ctx, { deferTelemetrySave: true });
  // Limpieza: los artículos intermedios ya viven en el snapshot diario;
  // sin borrarlos se acumularían ~500 docs/día en nios_runs para siempre.
  // Solo tras analyze exitoso: si falla, el estado se conserva para retry.
  if (result.success) {
    try {
      await cleanupPipelineState(db, date);
    } catch (err) {
      logger.warn('[cron/nios-collect:analyze] Pipeline state cleanup failed (non-fatal):', err);
    }
  }
  return { result, ctxErrors: ctx.errors };
}

async function execCeo(
  db: FirebaseFirestore.Firestore,
  analyzeOk: boolean,
): Promise<{ cacheInvalidated: unknown; ceoError: string | null; ceoData: Record<string, unknown> }> {
  let cacheInvalidated: unknown = analyzeOk ? false : 'skipped_pipeline_failed';
  if (analyzeOk) {
    try {
      const { invalidateNiosAdminCaches } = await import('@/lib/nios/repair-engine');
      await invalidateNiosAdminCaches(db, 'nios-collect');
      cacheInvalidated = true;
    } catch (err) {
      logger.warn('[cron/nios-collect:ceo] Cache invalidation failed:', err);
    }
  }

  let ceoError: string | null = null;
  let ceoData: Record<string, unknown> = {};
  try {
    const { record, autonomy } = await runCEOLoop(db, 'cron/nios-collect');
    ceoData = {
      mode: record.mode,
      autonomyScore: autonomy.score,
      autonomyMax: autonomy.max,
      repaired: record.repaired.length,
      pendingHuman: record.pendingHuman,
      failedRepairs: record.failedRepairs,
      decisions: record.decisions.length,
      learnings: record.learnings.length,
      summary: record.summary,
    };
    logger.info('[cron/nios-collect:ceo] CEO loop completed:', record.summary);
  } catch (err) {
    ceoError = err instanceof Error ? err.message : String(err);
    logger.error('[cron/nios-collect:ceo] CEO loop failed:', err);
  }
  return { cacheInvalidated, ceoError, ceoData };
}

async function execFinalize(
  db: FirebaseFirestore.Firestore,
  date: string,
): Promise<{
  trafficValidation: Awaited<ReturnType<typeof validateTrafficReader>> | null;
  trafficValidationError: string | null;
  telemetry: { saved?: boolean; healthScore?: number | null; error?: string };
}> {
  let telemetry: { saved?: boolean; healthScore?: number | null; error?: string } = { saved: false };
  // Telemetría diferida: saveTelemetry + momentum alerts con los insumos
  // que analyze persistió (la etapa analyze ya no los ejecuta en modo
  // por etapas para caber en el límite de 60s).
  try {
    const { runDeferredTelemetry } = await import('@/lib/nios/intelligence/orchestrator');
    telemetry = await runDeferredTelemetry(db, date);
  } catch (err) {
    telemetry = { saved: false, error: err instanceof Error ? err.message : String(err) };
    logger.error('[cron/nios-collect:finalize] deferred telemetry failed:', err);
  }

  let trafficValidation = null;
  let trafficValidationError: string | null = null;
  try {
    trafficValidation = await validateTrafficReader(db, 3);
    if (trafficValidation.status === 'UNTRUSTED') {
      logger.warn('[cron/nios-collect:finalize] TRAFFIC_DATA_UNTRUSTED:', trafficValidation);
    }
  } catch (err) {
    trafficValidationError = err instanceof Error ? err.message : String(err);
    logger.error('[cron/nios-collect:finalize] traffic validation failed:', err);
  }

  // Última limpieza: meta.telemetryInput ya fue consumido
  try {
    const { cleanupPipelineMeta } = await import('@/lib/nios/intelligence/orchestrator');
    await cleanupPipelineMeta(db, date);
  } catch (err) {
    logger.warn('[cron/nios-collect:finalize] meta cleanup failed (non-fatal):', err);
  }

  return { trafficValidation, trafficValidationError, telemetry };
}

// ─── GET ────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: NO_STORE_401_HEADERS });
  }

  const startedAt = Date.now();
  const db = getAdminDb();
  const date = todayUTC();
  const force = request.nextUrl.searchParams.get('force') === '1';
  const stageParam = request.nextUrl.searchParams.get('stage') as Stage | null;

  try {
    // Asegurar run doc con stages inicializados
    const existing = await getRunState(db, date);
    if (!existing) {
      await writeRunState(db, date, {
        status: 'running',
        startedAt: new Date(startedAt).toISOString(),
        stages: initialStages(),
      });
    } else if (existing.status !== 'running') {
      // Run ya cerrado hoy: solo re-ejecutar con ?force=1
      if (!force) {
        return NextResponse.json({ success: true, skipped: 'run_closed', run: existing }, { status: 200 });
      }
      await writeRunState(db, date, { status: 'running', startedAt: new Date(startedAt).toISOString() });
    }

    const run = (await getRunState(db, date)) as NIOSRunState;
    const stage: Stage = stageParam && STAGES.includes(stageParam) ? stageParam : nextPendingStage(run);

    // Guard de prerrequisitos
    const missing = PREREQUISITES[stage].filter((p) => {
      const s = run.stages[p]?.status;
      return s !== 'completed' && !(stage === 'finalize' && p === 'ceo' && s === 'failed');
    });
    if (missing.length > 0) {
      return NextResponse.json(
        { error: 'stage_prerequisite_missing', stage, missing, run },
        { status: 409 },
      );
    }

    // Idempotencia por etapa
    const cur = run.stages[stage];
    if (!force) {
      if (cur?.status === 'completed' || cur?.status === 'skipped') {
        return NextResponse.json({ success: true, skipped: 'stage_completed', stage, run }, { status: 200 });
      }
      if (cur?.status === 'running' && cur.lockedUntil && new Date(cur.lockedUntil).getTime() > Date.now()) {
        return NextResponse.json({ success: true, skipped: 'stage_running', stage, run }, { status: 409 });
      }
    }

    // Lock de etapa
    await writeRunState(db, date, {
      stages: {
        [stage]: {
          status: 'running',
          startedAt: new Date().toISOString(),
          lockedUntil: new Date(Date.now() + STAGE_LEASE_MS).toISOString(),
        },
      },
    });

    const stageStarted = Date.now();
    let stageData: Record<string, unknown> = {};
    let stageFailed = false;
    let stageError: string | null = null;

    try {
      switch (stage) {
        case 'collect': {
          const r = await execCollect(db, date);
          stageData = { articlesCount: r.articlesCount, gsc: r.gsc, ga4: r.ga4 };
          if (r.errors.length > 0) stageData.collectErrors = r.errors.slice(0, 5);
          break;
        }
        case 'analyze': {
          const { result } = await execAnalyze(db, date);
          stageData = {
            resultSuccess: result.success,
            articlesAnalyzed: result.articlesAnalyzed,
            summary: result.summary,
            errors: result.errors.slice(0, 10),
          };
          if (!result.success) stageFailed = true;
          break;
        }
        case 'ceo': {
          const analyzeData = run.stages.analyze?.data as { resultSuccess?: boolean } | undefined;
          const r = await execCeo(db, analyzeData?.resultSuccess === true);
          stageData = { ...r.ceoData, cacheInvalidated: r.cacheInvalidated };
          if (r.ceoError) {
            stageFailed = true;
            stageError = r.ceoError;
            stageData.ceoError = r.ceoError;
          }
          break;
        }
        case 'finalize': {
          const r = await execFinalize(db, date);
          stageData = {
            trafficStatus: r.trafficValidation?.status ?? 'ERROR',
            ...(r.trafficValidationError ? { trafficError: r.trafficValidationError } : {}),
            telemetrySaved: (r.telemetry as { saved?: boolean } | undefined)?.saved ?? null,
          };
          break;
        }
      }
    } catch (err) {
      stageFailed = true;
      stageError = err instanceof Error ? err.message : String(err);
      stageData = { ...stageData, error: stageError.slice(0, 300) };
      logger.error(`[cron/nios-collect:${stage}] Error:`, err);
    }

    const stageDuration = Date.now() - stageStarted;
    await markStage(db, date, stage, stageFailed ? 'failed' : 'completed', {
      detail: stageError ?? (typeof stageData.summary === 'string' ? stageData.summary.slice(0, 400) : undefined),
      data: stageData,
      durationMs: stageDuration,
    });

    // Releer estado para decidir heartbeat y cierre
    const runAfter = (await getRunState(db, date)) as NIOSRunState;
    const allDone = STAGES.every((s) => ['completed', 'skipped', 'failed'].includes(runAfter.stages[s]?.status ?? ''));
    const anyFailed = STAGES.some((s) => runAfter.stages[s]?.status === 'failed');
    const totalMs = Date.now() - new Date(runAfter.startedAt).getTime();

    if (stage === 'finalize' || anyFailed || stageFailed) {
      // Cierre honesto: heartbeat refleja el run completo
      const essentialOk =
        runAfter.stages.collect?.status === 'completed' &&
        runAfter.stages.analyze?.status === 'completed' &&
        (runAfter.stages.analyze?.data as { resultSuccess?: boolean } | undefined)?.resultSuccess === true &&
        runAfter.stages.ceo?.status === 'completed' &&
        runAfter.stages.finalize?.status === 'completed' &&
        runAfter.stages.finalize?.data?.trafficStatus !== 'UNTRUSTED';

      const heartbeatStatus = essentialOk ? 'healthy' : 'degraded';
      await heartbeatForRun(runAfter, totalMs,
        `nios-collect stages: collect=${runAfter.stages.collect?.status} analyze=${runAfter.stages.analyze?.status} ceo=${runAfter.stages.ceo?.status} finalize=${runAfter.stages.finalize?.status} traffic=${runAfter.stages.finalize?.data?.trafficStatus ?? '?'}`,
        heartbeatStatus,
      );

      if (allDone || stage === 'finalize') {
        await writeRunState(db, date, {
          status: essentialOk ? 'completed' : 'failed',
          finishedAt: new Date().toISOString(),
          summary: (runAfter.stages.analyze?.data?.summary as string | undefined) ?? undefined,
          errors: STAGES.flatMap((s) => {
            const d = runAfter.stages[s]?.data;
            return d?.errors ? (d.errors as string[]) : [];
          }).slice(0, 20),
        });
      }
    } else {
      // Etapa intermedia OK: heartbeat degraded (run en progreso, honesto)
      await heartbeatForRun(runAfter, totalMs,
        `nios-collect en progreso: ${stage} completada (${stageDuration}ms); restan ${STAGES.filter((s) => runAfter.stages[s]?.status !== 'completed' && runAfter.stages[s]?.status !== 'skipped').join(',') || 'ninguna'}`,
        'degraded',
      );
    }

    return NextResponse.json({
      success: !stageFailed,
      stage,
      stageDurationMs: stageDuration,
      runStatus: runAfter.status,
      stages: Object.fromEntries(STAGES.map((s) => [s, runAfter.stages[s]?.status])),
      data: stageData,
    });
  } catch (error) {
    logger.error('[cron/nios-collect] Error:', error);
    await recordCronHeartbeat('/api/cron/nios-collect', {
      status: 'down',
      durationMs: Date.now() - startedAt,
      note: `Error: ${(error instanceof Error ? error.message : 'desconocido').slice(0, 140)}`,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
