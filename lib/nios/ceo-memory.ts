/**
 * CEO Memory — Memoria operativa de NIOS.
 * Guarda decisiones y tareas del CEO para recordar pendientes y celebrar avances.
 * No crea lógica editorial. Solo persiste el estado de las recomendaciones ejecutivas.
 */

import { type Firestore } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import type { CeoDecision } from './ceo-decision-engine';

export type CeoTaskStatus = 'pending' | 'done' | 'blocked' | 'expired';

export interface CeoMemoryTask {
  id: string;
  action: string;
  source: string;
  createdAt: string;
  completedAt?: string;
  status: CeoTaskStatus;
  blockedAt?: string;
  expiredAt?: string;
  blockReason?: string;
  lifecycleNote?: string;
}

export interface CeoMemory {
  pending: CeoMemoryTask[];
  recentDone: CeoMemoryTask[];
}

export interface CEOObservationRecord {
  source: string;
  status: string;
  note: string;
  dataAgeHours: number | null;
}

export interface CEODiagnosisRecord {
  id: string;
  source: string;
  severity: string;
  status: string;
  problem: string;
  expectedResult: string;
}

export interface CEOExecutionRecord {
  id: string;
  status: string;
  verification: string;
}

export interface CEOVerificationRecord {
  id: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  verified: boolean;
  message: string;
}

export interface CEOLearningRecord {
  decisionId: string;
  problem: string;
  decision: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  impact: string;
  confidence: number;
  timestamp: string;
}

export interface CEOLoopRecord {
  id: string;
  kind: 'ceo_loop';
  timestamp: string;
  startedAt: string;
  finishedAt: string;
  mode: string;
  trigger: string;
  autonomyScore: number;
  autonomyReport?: Record<string, 'VERIFIED' | 'PARCIAL' | 'SIN_EVIDENCIA'>;
  autonomyEvidence?: Record<string, string>;
  observations: CEOObservationRecord[];
  diagnoses: CEODiagnosisRecord[];
  decisions: CeoDecision[];
  actions: CEOExecutionRecord[];
  executions: CEOExecutionRecord[];
  verifications: CEOVerificationRecord[];
  failures: CEOExecutionRecord[];
  learnings: CEOLearningRecord[];
  repaired: Array<{
    repairId: string;
    problem: string;
    action: string;
    status: string;
    verification: string;
  }>;
  pendingHuman: number;
  failedRepairs: number;
  skipped: number;
  summary: string;
  report: Record<string, unknown>;
  status: 'COMPLETE' | 'PARTIAL' | 'FAILED';
}

function db(): Firestore {
  return getAdminDb();
}

export async function getCeoMemory(): Promise<CeoMemory> {
  const snap = await db().collection('nios_memory').orderBy('createdAt', 'desc').limit(50).get();
  const tasks: CeoMemoryTask[] = snap.docs.map((d) => d.data() as unknown as CeoMemoryTask);

  return {
    pending: tasks.filter((t) => t.status === 'pending').slice(0, 10),
    recentDone: tasks.filter((t) => t.status === 'done').slice(0, 5),
  };
}

export async function trackRecommendation(
  id: string,
  action: string,
  source: string,
): Promise<void> {
  const ref = db().collection('nios_memory').doc(id);
  const snap = await ref.get();
  if (snap.exists) return;

  await ref.set({
    id,
    action,
    source,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
}

export async function completeTask(id: string): Promise<void> {
  const ref = db().collection('nios_memory').doc(id);
  await ref.update({
    status: 'done',
    completedAt: new Date().toISOString(),
  });
}

export async function blockTask(id: string, reason: string): Promise<void> {
  const ref = db().collection('nios_memory').doc(id);
  await ref.update({
    status: 'blocked',
    blockedAt: new Date().toISOString(),
    blockReason: reason,
  });
}

/**
 * Reconcilia el ciclo de vida de las tareas pendientes del CEO.
 * Semántica:
 *   pending → la recomendación sigue vigente y espera consumo humano.
 *   done    → cerrada (completeTask o ya no aparece en syncRecommendations).
 *   blocked → impedimento externo documentado en blockReason.
 *   expired → superó maxAgeDays pendiente sin consumidor; se conserva el
 *             documento como evidencia histórica con lifecycleNote.
 * No borra documentos. Pensado para correr una vez al día (watchdog).
 */
export async function reconcileCeoTasks(maxAgeDays = 30): Promise<{ expired: number; kept: number }> {
  const snap = await db().collection('nios_memory').where('status', '==', 'pending').limit(500).get();
  if (snap.empty) return { expired: 0, kept: 0 };

  const cutoffMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const now = new Date().toISOString();
  let expired = 0;
  let kept = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as Record<string, unknown>;
    // Solo tareas de recomendación: tienen action+source y NO son registros
    // de otro kind (ceo_loop, operational_incident, rejected_action, etc.).
    if (data.kind !== undefined || typeof data.action !== 'string') {
      kept++;
      continue;
    }
    const createdMs = Date.parse(String(data.createdAt || ''));
    const ageMs = Number.isNaN(createdMs) ? Number.MAX_SAFE_INTEGER : Date.now() - createdMs;
    if (ageMs < cutoffMs) {
      kept++;
      continue;
    }
    await doc.ref.update({
      status: 'expired',
      expiredAt: now,
      lifecycleNote: `expired: pending > ${maxAgeDays} días sin consumidor`,
    });
    expired++;
  }

  return { expired, kept };
}

export async function syncRecommendations(recommendations: Array<{ id: string; action: string; source: string }>): Promise<void> {
  for (const r of recommendations) {
    await trackRecommendation(r.id, r.action, r.source);
  }

  // Marcar como posiblemente obsoletas las recomendaciones antiguas que ya no aparecen
  const activeIds = new Set(recommendations.map((r) => r.id));
  const snap = await db().collection('nios_memory').where('status', '==', 'pending').get();
  const batch = db().batch();
  snap.docs.forEach((d) => {
    const data = d.data() as unknown as CeoMemoryTask;
    if (!activeIds.has(data.id)) {
      batch.update(d.ref, { status: 'done', completedAt: new Date().toISOString() });
    }
  });
  await batch.commit();
}

export async function recordCeoLoopRun(record: Omit<CEOLoopRecord, 'id' | 'kind'>): Promise<string> {
  const ref = db().collection('nios_memory').doc();
  // Sanitize to avoid Firestore rejecting undefined fields or non-serializable values.
  const cleanRecord = JSON.parse(JSON.stringify(record)) as Omit<CEOLoopRecord, 'id' | 'kind'>;
  await ref.set({
    ...cleanRecord,
    id: ref.id,
    kind: 'ceo_loop',
    createdAt: record.timestamp,
  });
  return ref.id;
}

export async function getLatestCeoLoopRecord(limit = 1): Promise<CEOLoopRecord | null> {
  const db = getAdminDb();
  const snap = await db
    .collection('nios_memory')
    .where('kind', '==', 'ceo_loop')
    .limit(50)
    .get();
  const loops = snap.docs
    .map((d) => d.data() as CEOLoopRecord & { kind?: string })
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  return loops.slice(0, limit)[0] || null;
}
