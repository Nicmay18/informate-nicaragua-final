import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { openIncident } from './incidents';
import { recordLearning } from './learning';
import { getDepartmentHealth, writeHeartbeat } from './heartbeat';
import { enqueueJob } from './queue';
import { emitOperationalAlerts } from './ops-alerts';
import { expireStaleActions } from '@/lib/nios/action-engine';
import { reconcileCeoTasks } from '@/lib/nios/ceo-memory';

const MAX_JOB_RUNTIME_MS = 30 * 60 * 1000;
const PENDING_QUEUE_LIMIT = 100;

// Componentes para los que existe un worker de recuperación real
// (ver watchdogRecoveryWorker en ./workers.ts). Para el resto, no tiene
// sentido encolar un job de recuperación: siempre fallaría con
// "no implementado" y, sin dedupKey, se acumularía un job nuevo en cada
// corrida del watchdog, inflando la cola indefinidamente.
const RECOVERABLE_COMPONENTS = new Set(['health-check', 'site-availability', 'growth', 'growth-check', 'monetization-check']);

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
      if (component !== 'watchdog' && RECOVERABLE_COMPONENTS.has(component)) {
        const hourBucket = new Date().toISOString().slice(0, 13);
        await enqueueJob({
          type: 'watchdog',
          priority: 'P0',
          source: 'watchdog',
          payload: { component },
          dedupKey: `watchdog:recovery:${component}:${hourBucket}`,
        });
        actions.push(`recovery-job-for-${component}`);
      } else if (component !== 'watchdog') {
        logger.warn('[depto-watchdog] Componente crítico sin recuperación automática disponible', { component });
        actions.push(`no-recovery-available-for-${component}`);
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

  // Alertas operativas reales → nios_alerts (dedup + cooldown internos).
  let stepFailures = 0;
  try {
    const alerts = await emitOperationalAlerts(db, stale);
    if (alerts.emitted > 0) actions.push(`alerts-emitted-${alerts.emitted}`);
  } catch (err) {
    stepFailures++;
    logger.error('[depto-watchdog] emitOperationalAlerts falló:', err);
  }

  // Reconciliación de ciclo de vida: acciones PENDING viejas → EXPIRED;
  // tareas CEO pending >30d → expired. Nunca borra documentos.
  try {
    const act = await expireStaleActions(7);
    if (act.expired + act.superseded > 0) actions.push(`actions-expired-${act.expired + act.superseded}`);
  } catch (err) {
    stepFailures++;
    logger.error('[depto-watchdog] expireStaleActions falló:', err);
  }
  try {
    const tasks = await reconcileCeoTasks(30);
    if (tasks.expired > 0) actions.push(`ceo-tasks-expired-${tasks.expired}`);
  } catch (err) {
    stepFailures++;
    logger.error('[depto-watchdog] reconcileCeoTasks falló:', err);
  }

  await recordLearning({
    source: 'departamento-central',
    kind: 'learning',
    note: `Watchdog ejecutado: salud=${overall}, componentes críticos=${stale.length}, trabajos atascados=${stuckSnap.size}, cola=${pendingCount}, fallos=${stepFailures}.`,
    tags: ['watchdog', 'infraestructura', '24x7'],
  });

  // El heartbeat reporta el resultado real del ciclo: 'healthy' solo si
  // todos los pasos corrieron y el sistema está sano; nunca incondicional.
  await writeHeartbeat('watchdog', stepFailures === 0 && overall !== 'CRITICAL' ? 'healthy' : 'degraded');

  return { health: overall, stale, actions };
}
