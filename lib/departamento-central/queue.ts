import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { DeptoJob, DeptoJobType, DeptoPriority, DeptoJobStatus } from './types';

const JOBS = 'depto_jobs';

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateDedupKey(
  type: DeptoJobType,
  source: string,
  key: string,
  period = 'default',
): string {
  return `${type}:${source}:${key}:${period}`;
}

export async function enqueueJob(input: {
  type: DeptoJobType;
  priority?: DeptoPriority;
  source: string;
  payload?: Record<string, unknown>;
  dedupKey?: string;
  scheduledFor?: string;
  delayMs?: number;
}): Promise<string> {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const scheduledFor =
    input.scheduledFor ??
    new Date(Date.now() + (input.delayMs ?? 0)).toISOString();

  if (input.dedupKey) {
    const existing = await db
      .collection(JOBS)
      .where('dedupKey', '==', input.dedupKey)
      .limit(1)
      .get();
    if (!existing.empty) {
      const first = existing.docs[0].data() as DeptoJob;
      if (['pending', 'running', 'completed'].includes(first.status)) {
        logger.debug('[depto-queue] Trabajo duplicado ignorado', { dedupKey: input.dedupKey, existingJobId: first.jobId });
        return first.jobId;
      }
    }
  }

  const job: Omit<DeptoJob, 'id'> = {
    jobId: newId(),
    type: input.type,
    priority: input.priority ?? 'P2',
    source: input.source,
    createdAt: now,
    scheduledFor,
    status: 'pending',
    attempts: 0,
    correlationId: newId(),
    dedupKey: input.dedupKey,
    payload: input.payload,
  };

  // Elimina campos undefined antes de escribir en Firestore.
  const cleanJob = JSON.parse(JSON.stringify(job)) as typeof job;
  await db.collection(JOBS).doc(job.jobId).set(cleanJob);
  logger.info('[depto-queue] Trabajo encolado', { jobId: job.jobId, type: job.type, priority: job.priority });
  return job.jobId;
}

const PRIORITY_RANK: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

export async function claimNextJob(): Promise<DeptoJob | null> {
  const db = getAdminDb();
  const now = new Date().toISOString();

  const snap = await db
    .collection(JOBS)
    .where('scheduledFor', '<=', now)
    .orderBy('scheduledFor', 'asc')
    .limit(50)
    .get();

  const candidates = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as DeptoJob))
    .filter((j) => ['pending', 'retry'].includes(j.status))
    .sort((a, b) => {
      const pa = PRIORITY_RANK[a.priority] ?? 99;
      const pb = PRIORITY_RANK[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;
      return (a.scheduledFor ?? '').localeCompare(b.scheduledFor ?? '');
    });

  const next = candidates[0];
  if (!next) return null;

  await db.collection(JOBS).doc(next.id ?? next.jobId).update({
    status: 'running',
    startedAt: now,
    attempts: (next.attempts || 0) + 1,
  });

  return next;
}

export async function completeJob(
  jobId: string,
  result?: Record<string, unknown>,
): Promise<void> {
  const db = getAdminDb();
  const now = new Date().toISOString();
  await db.collection(JOBS).doc(jobId).update({
    status: 'completed',
    completedAt: now,
    result,
  });
  logger.info('[depto-queue] Trabajo completado', { jobId });
}

export async function failJob(
  jobId: string,
  error: string,
  maxRetries = 3,
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(JOBS).doc(jobId);
  const doc = await ref.get();
  if (!doc.exists) return;

  const data = doc.data() as DeptoJob;
  const now = new Date().toISOString();

  if (data.attempts >= maxRetries) {
    await ref.update({
      status: 'dead-letter',
      error,
      completedAt: now,
    });
    logger.warn('[depto-queue] Trabajo enviado a dead-letter', { jobId, attempts: data.attempts });
  } else {
    const backoffMs = 1000 * Math.pow(2, data.attempts);
    await ref.update({
      status: 'retry',
      error,
      scheduledFor: new Date(Date.now() + backoffMs).toISOString(),
    });
    logger.info('[depto-queue] Trabajo reencolado para reintento', { jobId, attempts: data.attempts });
  }
}

export async function getJobStatus(jobId: string): Promise<DeptoJob | null> {
  const db = getAdminDb();
  const doc = await db.collection(JOBS).doc(jobId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as DeptoJob;
}

export async function countJobsByStatus(status: DeptoJobStatus): Promise<number> {
  const db = getAdminDb();
  const snap = await db.collection(JOBS).where('status', '==', status).count().get();
  return snap.data().count || 0;
}

export async function getRecentJobs(limit = 20): Promise<DeptoJob[]> {
  const db = getAdminDb();
  const snap = await db
    .collection(JOBS)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeptoJob));
}

export async function getDeadLetter(limit = 20): Promise<DeptoJob[]> {
  const db = getAdminDb();
  const snap = await db.collection(JOBS).orderBy('createdAt', 'desc').limit(limit * 10).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as DeptoJob))
    .filter((j) => j.status === 'dead-letter')
    .slice(0, limit);
}

export async function getWorkDone24h(): Promise<number> {
  const db = getAdminDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const snap = await db.collection(JOBS).where('completedAt', '>=', since).limit(1000).get();
  return snap.docs.filter((d) => (d.data() as { status?: string }).status === 'completed').length;
}
