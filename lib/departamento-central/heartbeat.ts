import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { DeptoHeartbeat, DeptoHealthLevel } from './types';

const COLLECTION = 'depto_heartbeat';

const EXPECTED_INTERVALS: Record<string, number> = {
  scheduler: 10 * 60 * 1000,
  'health-check': 5 * 60 * 1000,
  'article-pipeline': 60 * 60 * 1000,
  growth: 30 * 60 * 1000,
  watchdog: 15 * 60 * 1000,
  'daily-report': 26 * 60 * 60 * 1000,
};

export async function writeHeartbeat(
  component: DeptoHeartbeat['component'],
  status: DeptoHeartbeat['status'],
  options?: { note?: string; durationMs?: number; jobsCompleted?: number; jobsFailed?: number },
): Promise<void> {
  const db = getAdminDb();
  const now = new Date();
  const lastRunAt = now.toISOString();
  const nextExpectedAt = new Date(
    now.getTime() + (EXPECTED_INTERVALS[component] || 60 * 60 * 1000),
  ).toISOString();

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
    const expected = new Date(h.nextExpectedAt).getTime();
    const last = new Date(h.lastRunAt).getTime();

    if (h.status === 'down' || now > expected + 5 * 60 * 1000) {
      components[h.component] = 'CRITICAL';
      worst = 'CRITICAL';
    } else if (now > expected || now - last > (EXPECTED_INTERVALS[h.component] || 60 * 60 * 1000) * 2) {
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
