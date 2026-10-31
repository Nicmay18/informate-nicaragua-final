import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { openIncident, resolveIncident } from './incidents';
import { recordLearning } from './learning';
import { getDepartmentHealth, writeHeartbeat } from './heartbeat';
import { enqueueJob } from './queue';
import { emitOperationalAlerts } from './ops-alerts';
import { resolveHeartbeatAlerts } from '@/lib/nios/intelligence/alerts';
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
    // Cierre simétrico: si un componente con incidente de heartbeat recuperó
    // su latido, el incidente se resuelve. Sin esto los incidentes quedaban
    // 'active' para siempre aunque el componente volviera a healthy.
    if (status !== 'CRITICAL') {
      await resolveIncident(`Heartbeat crítico: ${component}`, {
        diagnosis: `El componente volvió a reportar heartbeat (${status}).`,
        correction: 'Recuperación automática verificada por watchdog.',
        verification: `getDepartmentHealth reporta ${status}.`,
        learning: 'Heartbeat recuperado sin intervención manual.',
      });
      // Cierre simétrico en nios_alerts: el incidente se resolvía pero la
      // alerta persistida quedaba activa para siempre (falsos críticos en el
      // Command Center). No borra el registro; solo marca resolved.
      await resolveHeartbeatAlerts(db, component);
      continue;
    }
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

  // Variantes históricas con el contador embebido en el título (p.ej.
  // "Cola de trabajos acumulada: 188 pendientes") tienen otro slug: el dedup
  // de openIncident no las alcanza y cada día creaba un incidente nuevo del
  // MISMO evento. Se consolidan en el incidente canónico (título estable):
  // se resuelven como duplicadas conservando su historial, nunca se borran.
  const legacyBacklogSnap = await db
    .collection('depto_incidents')
    .where('status', 'in', ['active', 'monitoring'])
    .get();
  const legacyVariants = legacyBacklogSnap.docs.filter((d) => {
    const title = String(d.data().title || '');
    return title.startsWith('Cola de trabajos acumulada') && title !== 'Cola de trabajos acumulada';
  });

  if (pendingCount > PENDING_QUEUE_LIMIT) {
    // Título estable (sin el contador): el dedup de incidentes usa el slug del
    // título; embeber N generaba un incidente nuevo por día del mismo evento.
    await openIncident({
      type: 'infrastructure',
      severity: 'warning',
      title: 'Cola de trabajos acumulada',
      status: 'active',
      detectedAt: now.toISOString(),
      diagnosis: `${pendingCount} trabajos en estado pending/retry`,
    });
    actions.push('queue-backlog-warning');
    // El backlog sigue activo pero se representa por UN solo incidente
    // canónico; las variantes numeradas son duplicados históricos.
    for (const doc of legacyVariants) {
      await doc.ref.update({
        status: 'resolved',
        resolvedAt: now.toISOString(),
        diagnosis: `Condición consolidada en el incidente canónico (backlog real: ${pendingCount}).`,
        correction: 'Duplicado histórico cerrado; el incidente canónico sigue activo.',
        verification: `pending+retry=${pendingCount}.`,
        learning: 'Un mismo evento no debe abrir un incidente por valor de contador.',
        updatedAt: now.toISOString(),
      });
    }
  } else {
    await resolveIncident('Cola de trabajos acumulada', {
      diagnosis: `Cola dentro del límite (${pendingCount}/${PENDING_QUEUE_LIMIT}).`,
      correction: 'El drenaje de scheduler/watchdog procesó el backlog.',
      verification: `pending+retry=${pendingCount}.`,
      learning: 'Backlog normalizado.',
    });
    // La cola está dentro del límite: todas las variantes se cierran.
    for (const doc of legacyVariants) {
      await doc.ref.update({
        status: 'resolved',
        resolvedAt: now.toISOString(),
        diagnosis: `Cola dentro del límite (${pendingCount}/${PENDING_QUEUE_LIMIT}).`,
        correction: 'Backlog drenado; incidente histórico duplicado cerrado.',
        verification: `pending+retry=${pendingCount}.`,
        learning: 'Backlog normalizado.',
        updatedAt: now.toISOString(),
      });
    }
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
