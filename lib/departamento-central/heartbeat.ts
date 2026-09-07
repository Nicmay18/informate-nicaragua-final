import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { DeptoHeartbeat, DeptoHealthLevel } from './types';

const COLLECTION = 'depto_heartbeat';

const CRON_DEFAULT_INTERVAL_MS = 25 * 60 * 60 * 1000; // 25h cubre crons diarios con drift

const EXPECTED_INTERVALS: Record<string, number> = {
  scheduler: CRON_DEFAULT_INTERVAL_MS,
  'health-check': CRON_DEFAULT_INTERVAL_MS,
  growth: CRON_DEFAULT_INTERVAL_MS,
  watchdog: CRON_DEFAULT_INTERVAL_MS,
  'daily-report': 26 * 60 * 60 * 1000,
  'monetization-check': CRON_DEFAULT_INTERVAL_MS,
  'article-pipeline': CRON_DEFAULT_INTERVAL_MS,
};

export function getExpectedInterval(component: string): number {
  if (component.startsWith('cron/') || component.startsWith('cron/api/cron/')) {
    return CRON_DEFAULT_INTERVAL_MS;
  }
  return EXPECTED_INTERVALS[component] || CRON_DEFAULT_INTERVAL_MS;
}

// Componentes disparados por eventos (no por un cron periódico): sólo corren
// cuando hay trabajo real que procesar (p.ej. un artículo nuevo). La ausencia
// de ejecución durante el intervalo esperado NO significa una falla; sólo
// significa que no hubo trabajo. Por eso se excluyen de la detección de
// staleness por tiempo y se reportan según su último status real.
const EVENT_DRIVEN_COMPONENTS = new Set(['article-pipeline']);

export async function writeHeartbeat(
  component: DeptoHeartbeat['component'],
  status: DeptoHeartbeat['status'],
  options?: {
    note?: string;
    durationMs?: number;
    jobsCompleted?: number;
    jobsFailed?: number;
    nextExpectedAt?: string;
  },
): Promise<void> {
  const db = getAdminDb();
  const now = new Date();
  const lastRunAt = now.toISOString();
  const nextExpectedAt =
    options?.nextExpectedAt ??
    new Date(now.getTime() + getExpectedInterval(component)).toISOString();

  const snap = await db.collection(COLLECTION).where('component', '==', component).limit(1).get();
  const data: Record<string, unknown> = {
    component,
    status,
    lastRunAt,
    nextExpectedAt,
    updatedAt: lastRunAt,
  };
  if (options?.note !== undefined) data.note = options.note;
  if (options?.durationMs !== undefined) data.durationMs = options.durationMs;
  if (options?.jobsCompleted !== undefined) data.jobsCompleted = options.jobsCompleted;
  if (options?.jobsFailed !== undefined) data.jobsFailed = options.jobsFailed;

  if (snap.empty) {
    await db.collection(COLLECTION).add(data);
  } else {
    await db.collection(COLLECTION).doc(snap.docs[0].id).update(data);
  }

  logger.debug('[depto-heartbeat] Heartbeat actualizado', { component, status });
}

export async function recordCronHeartbeat(
  cronPath: string,
  options?: { status?: DeptoHeartbeat['status']; durationMs?: number; note?: string },
): Promise<void> {
  const component = cronPath.startsWith('cron/') ? cronPath : `cron${cronPath}`;
  const nextExpectedAt = new Date(Date.now() + CRON_DEFAULT_INTERVAL_MS).toISOString();
  try {
    await writeHeartbeat(component, options?.status ?? 'healthy', {
      durationMs: options?.durationMs,
      note: options?.note ?? `Cron ${cronPath} ejecutado`,
      nextExpectedAt,
    });
  } catch (err) {
    logger.warn('[depto-heartbeat] No se pudo escribir heartbeat de cron', { cronPath, error: err });
  }
}

export async function getLatestHeartbeat(
  component: string,
): Promise<DeptoHeartbeat | null> {
  const db = getAdminDb();
  const snap = await db
    .collection(COLLECTION)
    .where('component', '==', component)
    .orderBy('lastRunAt', 'desc')
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as DeptoHeartbeat;
}

export async function getDepartmentHealth(): Promise<{
  overall: DeptoHealthLevel;
  components: Record<string, 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN'>;
}> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTION).get();
  const now = Date.now();
  const components: Record<string, 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN'> = {};
  let worst: DeptoHealthLevel = 'HEALTHY';

  for (const doc of snap.docs) {
    const h = doc.data() as DeptoHeartbeat;

    if (EVENT_DRIVEN_COMPONENTS.has(h.component)) {
      if (h.status === 'down') {
        components[h.component] = 'CRITICAL';
        worst = 'CRITICAL';
      } else if (h.status === 'degraded') {
        components[h.component] = 'DEGRADED';
        if (worst === 'HEALTHY') worst = 'DEGRADED';
      } else {
        components[h.component] = 'HEALTHY';
      }
      continue;
    }

    const last = new Date(h.lastRunAt).getTime();
    const expected = last + getExpectedInterval(h.component);

    if (h.status === 'down' || now > expected + 5 * 60 * 1000) {
      components[h.component] = 'CRITICAL';
      worst = 'CRITICAL';
    } else if (now > expected || now - last > getExpectedInterval(h.component) * 2) {
      components[h.component] = 'DEGRADED';
      if (worst === 'HEALTHY') worst = 'DEGRADED';
    } else if (h.status === 'degraded') {
      components[h.component] = 'DEGRADED';
      if (worst === 'HEALTHY') worst = 'DEGRADED';
    } else {
      components[h.component] = 'HEALTHY';
    }
  }

  for (const key of Object.keys(EXPECTED_INTERVALS)) {
    if (!components[key]) {
      components[key] = 'UNKNOWN';
    }
  }

  return { overall: worst, components };
}
