import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { enqueueJob, claimNextJob, getWorkDone24h, generateDedupKey } from './queue';
import { executeJob } from './workers';
import { writeHeartbeat } from './heartbeat';
import { runWatchdog } from './watchdog';
import type { DeptoJobType, DeptoPriority } from './types';

const MAX_JOBS_PER_RUN = 15;
const WATCHDOG_DRAIN_LIMIT = 10;

/**
 * Drena la cola ejecutando jobs pending/retry ya vencidos.
 * Reutilizable por el scheduler y por el watchdog (segunda pasada diaria)
 * para que los jobs encolados fuera de la ventana del scheduler no
 * permanezcan pending hasta el día siguiente.
 */
export async function processJobQueue(maxJobs = MAX_JOBS_PER_RUN): Promise<{
  processed: number;
  completed: number;
  failed: number;
}> {
  let processed = 0;
  let completed = 0;
  let failed = 0;

  while (processed < maxJobs) {
    const job = await claimNextJob();
    if (!job) break;
    await executeJob(job);
    processed++;
    if (job.status === 'completed') {
      completed++;
    } else {
      failed++;
    }
  }

  return { processed, completed, failed };
}

export function watchdogDrainLimit(): number {
  return WATCHDOG_DRAIN_LIMIT;
}

function dedup(type: DeptoJobType, key: string, period = 'default'): string {
  return generateDedupKey(type, 'scheduler', key, period);
}

async function hasRecentJob(
  type: DeptoJobType,
  periodMs: number,
): Promise<boolean> {
  const db = getAdminDb();
  const since = new Date(Date.now() - periodMs).toISOString();

  try {
    const snap = await db
      .collection('depto_jobs')
      .where('type', '==', type)
      .limit(50)
      .get();
    return snap.docs.some((d) => {
      const j = d.data() as { createdAt?: string; status?: string };
      return (
        (j.createdAt || '') >= since &&
        ['pending', 'running', 'completed'].includes(j.status || '')
      );
    });
  } catch (err) {
    logger.error('[depto-scheduler] Error consultando trabajos recientes:', err);
    // Fail-loud: devolver false permite encolar (el dedupKey único por ventana
    // sigue evitando duplicados reales). Devolver true silenciaba TODOS los
    // encolados ante cualquier error de Firestore, sin dejar rastro.
    return false;
  }
}

function timeBucket(periodMs: number): string {
  return String(Math.floor(Date.now() / periodMs));
}

async function maybeEnqueueHealthCheck(): Promise<string | null> {
  if (await hasRecentJob('health-check', 4.5 * 60 * 1000)) return null;
  const bucket = timeBucket(5 * 60 * 1000);
  return enqueueJob({
    type: 'health-check',
    priority: 'P0',
    source: 'scheduler',
    dedupKey: dedup('health-check', bucket, bucket),
  });
}

async function maybeEnqueueDailyReport(): Promise<string | null> {
  const today = new Date().toISOString().slice(0, 10);
  if (await hasRecentJob('daily-report', 23 * 60 * 60 * 1000)) return null;
  return enqueueJob({
    type: 'daily-report',
    priority: 'P1',
    source: 'scheduler',
    dedupKey: dedup('daily-report', today, today),
  });
}

async function maybeEnqueueGrowth(): Promise<string | null> {
  if (await hasRecentJob('growth-check', 29 * 60 * 1000)) return null;
  const bucket = timeBucket(30 * 60 * 1000);
  return enqueueJob({
    type: 'growth-check',
    priority: 'P2',
    source: 'scheduler',
    dedupKey: dedup('growth-check', bucket, bucket),
  });
}

async function maybeEnqueueMonetization(): Promise<string | null> {
  if (await hasRecentJob('monetization-check', 59 * 60 * 1000)) return null;
  const bucket = timeBucket(60 * 60 * 1000);
  return enqueueJob({
    type: 'monetization-check',
    priority: 'P2',
    source: 'scheduler',
    dedupKey: dedup('monetization-check', bucket, bucket),
  });
}

async function enqueueNewArticles(): Promise<number> {
  const db = getAdminDb();
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000);

  try {
    // dateModified se escribe como Timestamp en cada creacion/edicion.
    // El campo 'updatedAt' no existe en el esquema actual.
    const snap = await db
      .collection('noticias')
      .where('dateModified', '>=', since)
      .orderBy('dateModified', 'desc')
      .limit(20)
      .get();

    let enqueued = 0;
    for (const doc of snap.docs) {
      const data = doc.data();
      const modified =
        data?.dateModified?.toDate?.()?.toISOString?.() ||
        String(data?.dateModified || '');
      const jobId = await enqueueJob({
        type: 'article-pipeline',
        priority: (data?.priority as DeptoPriority) || 'P2',
        source: 'firestore-noticia',
        payload: { articleId: doc.id, createdAt: data?.createdAt },
        dedupKey: `article-pipeline:${doc.id}:${modified}`,
      });
      if (jobId) enqueued++;
    }
    return enqueued;
  } catch (err) {
    logger.error('[depto-scheduler] Error consultando noticias:', err);
    return 0;
  }
}

export async function runScheduler(): Promise<{
  enqueued: number;
  processed: number;
  completed: number;
  failed: number;
}> {
  const started = Date.now();
  await writeHeartbeat('scheduler', 'healthy', { note: 'Scheduler iniciado' });

  let enqueued = 0;
  const healthJob = await maybeEnqueueHealthCheck();
  if (healthJob) enqueued++;

  const dailyJob = await maybeEnqueueDailyReport();
  if (dailyJob) enqueued++;

  const growthJob = await maybeEnqueueGrowth();
  if (growthJob) enqueued++;

  const moneyJob = await maybeEnqueueMonetization();
  if (moneyJob) enqueued++;

  const articles = await enqueueNewArticles();
  enqueued += articles;

  const { processed, completed, failed } = await processJobQueue(MAX_JOBS_PER_RUN);

  await runWatchdog();

  const durationMs = Date.now() - started;
  const workDone = await getWorkDone24h();

  await writeHeartbeat('scheduler', 'healthy', {
    durationMs,
    jobsCompleted: completed,
    jobsFailed: failed,
    note: `Enqueued ${enqueued}, processed ${processed}, workDone24h ${workDone}.`,
  });

  logger.info('[depto-scheduler] Ronda completada', { enqueued, processed, completed, failed, durationMs });
  return { enqueued, processed, completed, failed };
}
