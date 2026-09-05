import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { openIncident } from './incidents';
import { recordLearning } from './learning';
import { getDepartmentHealth, writeHeartbeat } from './heartbeat';
import { enqueueJob } from './queue';

const MAX_JOB_RUNTIME_MS = 30 * 60 * 1000;
const PENDING_QUEUE_LIMIT = 100;

export async function runWatchdog(): Promise<{
  health: string;
  stale: string[];
  actions: string[];
}> {
  const db = getAdminDb();
  const now = new Date();
  const actions: string[] = [];

  const { overall, components } = await getDepartmentHealth();
  const stale: string[] = [];

  for (const [component, status] of Object.entries(components)) {
    if (status === 'CRITICAL') {
      stale.push(component);
      await openIncident({
        type: 'infrastructure',
        severity: 'critical',
        title: `Heartbeat crítico: ${component}`,
        status: 'active',
        detectedAt: now.toISOString(),
      });
      if (component !== 'watchdog') {
        await enqueueJob({
          type: 'watchdog',
          priority: 'P0',
          source: 'watchdog',
          payload: { component },
        });
        actions.push(`recovery-job-for-${component}`);
      }
    }
  }

  const stuckSince = new Date(Date.now() - MAX_JOB_RUNTIME_MS).toISOString();
  const stuckSnap = await db
    .collection('depto_jobs')
    .where('status', '==', 'running')
    .limit(50)
    .get();

  for (const doc of stuckSnap.docs) {
    const data = doc.data() as { startedAt?: string };
    if (!data.startedAt || data.startedAt > stuckSince) continue;
    await db.collection('depto_jobs').doc(doc.id).update({
      status: 'failed',
      error: 'Timeout detectado por watchdog',
      completedAt: now.toISOString(),
    });
    actions.push(`stuck-job-recovered-${doc.id}`);
    logger.warn('[depto-watchdog] Trabajo atascado marcado como fallido', { jobId: doc.id });
  }

  const [pendingCountSnap, retryCountSnap] = await Promise.all([
    db.collection('depto_jobs').where('status', '==', 'pending').count().get(),
    db.collection('depto_jobs').where('status', '==', 'retry').count().get(),
  ]);
  const pendingCount = (pendingCountSnap.data().count || 0) + (retryCountSnap.data().count || 0);
  if (pendingCount > PENDING_QUEUE_LIMIT) {
    await openIncident({
      type: 'infrastructure',
      severity: 'warning',
      title: `Cola de trabajos acumulada: ${pendingCount} pendientes`,
      status: 'active',
      detectedAt: now.toISOString(),
    });
    actions.push('queue-backlog-warning');
  }

  await recordLearning({
    source: 'departamento-central',
    kind: 'learning',
    note: `Watchdog ejecutado: salud=${overall}, componentes críticos=${stale.length}, trabajos atascados=${stuckSnap.size}, cola=${pendingCount}.`,
    tags: ['watchdog', 'infraestructura', '24x7'],
  });

  await writeHeartbeat('watchdog', 'healthy');

  return { health: overall, stale, actions };
}
