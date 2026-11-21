import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';

/**
 * COST GUARD — protección financiera operativa (Fase 7 de la misión de emergencia).
 * ============================================================================
 * Problema: los budgets de Google Cloud notifican pero NO detienen el gasto.
 * Este módulo da un control real dentro de la aplicación: un documento
 * `config/cost_guard` en Firestore que el propietario (o un admin) puede
 * cambiar sin redesplegar para poner el sitio en "modo economía" durante
 * una contingencia de costos.
 *
 * Doc: config/cost_guard
 *   {
 *     mode: 'normal' | 'economy',        // default 'normal' si no existe
 *     disabledStages: string[],          // etapas NIOS a saltar: 'ceo', 'finalize', ...
 *     disabledCrons: string[],           // paths de cron a omitir: '/api/cron/nios-ceo-loop', ...
 *     note?: string,
 *     updatedAt?: string,
 *     updatedBy?: string
 *   }
 *
 * Comportamiento:
 *  - mode 'normal' (o doc ausente/ilegible): TODO funciona igual que antes.
 *    Un fallo de lectura del guard NUNCA debe tumbar el sitio → fail-open a normal.
 *  - mode 'economy': las etapas/crons listados se marcan 'skipped' (honesto,
 *    queda registrado en nios_runs) en vez de ejecutarse. Las etapas
 *    esenciales de recolección (collect/analyze) NO se desactivan por defecto.
 *
 * Lectura cacheada 5 min por instancia — costo despreciable (1 doc).
 */

export type CostGuardMode = 'normal' | 'economy';

export interface CostGuardConfig {
  mode: CostGuardMode;
  disabledStages: string[];
  disabledCrons: string[];
  note?: string;
}

const GUARD_COLLECTION = 'config';
const GUARD_DOC = 'cost_guard';
const CACHE_TTL_MS = 5 * 60 * 1000;
const DAILY_COLLECTION = 'cost_daily';

const DEFAULT_CONFIG: CostGuardConfig = {
  mode: 'normal',
  disabledStages: [],
  disabledCrons: [],
};

let cache: { config: CostGuardConfig; at: number } | null = null;

export async function getCostGuardConfig(db: Firestore): Promise<CostGuardConfig> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.config;
  try {
    const snap = await db.collection(GUARD_COLLECTION).doc(GUARD_DOC).get();
    const data = snap.exists ? (snap.data() as Partial<CostGuardConfig>) : {};
    const config: CostGuardConfig = {
      mode: data.mode === 'economy' ? 'economy' : 'normal',
      disabledStages: Array.isArray(data.disabledStages) ? data.disabledStages.filter((s): s is string => typeof s === 'string') : [],
      disabledCrons: Array.isArray(data.disabledCrons) ? data.disabledCrons.filter((s): s is string => typeof s === 'string') : [],
      ...(typeof data.note === 'string' ? { note: data.note } : {}),
    };
    cache = { config, at: Date.now() };
    return config;
  } catch (err) {
    // Fail-open: si Firestore no responde, el sitio sigue en modo normal.
    logger.warn('[cost-guard] No se pudo leer config/cost_guard; modo normal:', err instanceof Error ? err.message : String(err));
    return DEFAULT_CONFIG;
  }
}

/** Etapa NIOS permitida según el guard. 'skipped' se registra, no se ejecuta. */
export async function isNiosStageAllowed(db: Firestore, stage: string): Promise<boolean> {
  const cfg = await getCostGuardConfig(db);
  if (cfg.mode !== 'economy') return true;
  return !cfg.disabledStages.includes(stage);
}

/** Ruta de cron permitida según el guard. */
export async function isCronAllowed(db: Firestore, path: string): Promise<boolean> {
  const cfg = await getCostGuardConfig(db);
  if (cfg.mode !== 'economy') return true;
  return !cfg.disabledCrons.includes(path);
}

/** Solo para tests: reinicia la caché en memoria. */
export function __resetCostGuardCache(): void {
  cache = null;
}

/**
 * Snapshot diario de métricas de costo — escribe UN doc por día en
 * `cost_daily/{YYYY-MM-DD}` usando count() (barato: ~1 lectura por 1000
 * entradas de índice, no descarga documentos). Permite al propietario ver
 * la tendencia real de volumen sin acceso a billing:
 *   noticias, traffic_log, depto_jobs abiertos, nios_actions pendientes.
 * Se invoca desde /api/cron/traffic-cleanup (diario 03:00 UTC).
 */
export async function recordDailyCostSnapshot(db: Firestore): Promise<Record<string, number>> {
  const date = new Date().toISOString().slice(0, 10);
  const [noticias, trafficLog, deptoPending, deptoRetry, niosPending] = await Promise.all([
    db.collection('noticias').count().get(),
    db.collection('traffic_log').count().get(),
    db.collection('depto_jobs').where('status', '==', 'pending').count().get(),
    db.collection('depto_jobs').where('status', '==', 'retry').count().get(),
    db.collection('nios_actions').where('status', 'in', ['PENDING', 'PREPARED', 'QUEUED', 'RUNNING']).count().get(),
  ]);

  const metrics = {
    noticias: noticias.data().count,
    trafficLog: trafficLog.data().count,
    deptoJobsOpen: deptoPending.data().count + deptoRetry.data().count,
    niosActionsOpen: niosPending.data().count,
  };

  // Delta vs. ayer para detectar anomalías de crecimiento.
  let prev: Record<string, number> | null = null;
  try {
    const prevDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const prevSnap = await db.collection(DAILY_COLLECTION).doc(prevDate).get();
    prev = prevSnap.exists ? (prevSnap.data() as Record<string, number>) : null;
  } catch { /* delta es best-effort */ }

  const deltas = prev
    ? Object.fromEntries(Object.entries(metrics).map(([k, v]) => [k, v - (Number(prev?.[k]) || 0)]))
    : null;

  await db.collection(DAILY_COLLECTION).doc(date).set({
    date,
    recordedAt: new Date().toISOString(),
    metrics,
    deltas,
  }, { merge: true });

  logger.info('[cost-guard] snapshot diario', { date, metrics });
  return metrics;
}
