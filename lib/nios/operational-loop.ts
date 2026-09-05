/**
 * NIOS Operational Loop
 * =====================
 *
 * Cierra el ciclo operativo real:
 *   DETECTED → INVESTIGATING → ACTION_REQUIRED → RUNNING →
 *   VERIFICATION → RESOLVED / FAILED / ESCALATED
 *
 * Conecta (sin duplicar):
 *   - conflict-detector + MENI/Forense
 *   - repair-engine
 *   - depto_jobs / workers
 *   - aprobaciones humanas
 *   - memoria operativa y detección de patrones
 *   - CEO Loop (datos para priorización)
 *   - Centro de Comando (estado por equipo y feed)
 *
 * Reglas:
 *   1. No marcar RESOLVED solo porque un worker terminó.
 *   2. No ejecutar acciones destructivas sin aprobación.
 *   3. Toda transición guarda timestamp, causa, actor y evidencia.
 *   4. Memoria: PROBLEMA / CAUSA / ACCIÓN / RESULTADO / VERIFICACIÓN / EQUIPO.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import { detectConflicts, type DetectConflictsInput, type NiosConflict } from './conflict-detector';
import { runRepairEngine, type NiosRepairEngineResult } from './repair-engine';
import { enqueueJob } from '@/lib/departamento-central/queue';
import { loadNoticiasFromFirestore } from './intelligence/data-merger';
import type { NoticiaInput } from '@/lib/meni';
import type { Noticia } from '@/lib/types';

const COLLECTION = 'nios_memory';
const MAX_ATTEMPTS = 3;

export type OperationalState =
  | 'DETECTED'
  | 'INVESTIGATING'
  | 'ACTION_REQUIRED'
  | 'RUNNING'
  | 'VERIFICATION'
  | 'RESOLVED'
  | 'FAILED'
  | 'ESCALATED';

export type OperationalTeam =
  | 'AUDITOR'
  | 'REPARADOR'
  | 'GROWTH'
  | 'EDITOR'
  | 'MENI'
  | 'FORENSE'
  | 'GOOGLE'
  | 'DISTRIBUCION'
  | 'NEGOCIO'
  | 'CEO'
  | 'MEMORIA';

export interface OperationalTransition {
  from: OperationalState;
  to: OperationalState;
  at: string;
  cause: string;
  actor: OperationalTeam | string;
  evidence?: Record<string, unknown>;
  result?: string;
}

export interface OperationalDiagnosis {
  what: string;
  system: string;
  severity: 'critical' | 'warning' | 'info';
  impact: string;
  evidence: Record<string, unknown>;
  responsibleTeam: OperationalTeam;
  autoRepairable: boolean;
  action: string;
}

export interface OperationalIncident {
  id: string;
  kind: 'operational_incident';
  conflictId: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  source: string;
  team: OperationalTeam;
  state: OperationalState;
  detectedAt: string;
  updatedAt: string;
  evidence: Record<string, unknown>;
  diagnosis?: OperationalDiagnosis;
  approvalId?: string;
  jobIds: string[];
  transitions: OperationalTransition[];
  attemptCount: number;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface OperationalApproval {
  id: string;
  kind: 'operational_approval';
  incidentId: string;
  action: string;
  motivo: string;
  evidencia: Record<string, unknown>;
  impacto: string;
  riesgo: number;
  solicitante: string;
  equipo: OperationalTeam;
  efectoEsperado: string;
  estado: ApprovalStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface OperationalMemoryEntry {
  kind: 'operational_memory';
  incidentId: string;
  problema: string;
  causa: string;
  accion: string;
  resultado: string;
  verificacion: string;
  equipo: OperationalTeam;
  fecha: string;
}

export interface OperationalPattern {
  key: string;
  count: number;
  since: string;
  lastAt: string;
  severity: string;
  recommendedWatch: boolean;
}

export interface OperationalTeamStatus {
  state: 'IDLE' | 'WORKING' | 'BLOCKED';
  current: string[];
  count: number;
  lastAt: string | null;
}

export interface OperationalSummary {
  teams: Record<OperationalTeam, OperationalTeamStatus>;
  incidents: OperationalIncident[];
  approvals: OperationalApproval[];
  feed: string[];
}

export interface OperationalLoopResult {
  incidents: OperationalIncident[];
  approvals: OperationalApproval[];
  jobs: string[];
  memory: OperationalMemoryEntry[];
  patterns: OperationalPattern[];
  summary: string;
}

const ALLOWED_TRANSITIONS: Record<OperationalState, OperationalState[]> = {
  DETECTED: ['INVESTIGATING', 'ESCALATED'],
  INVESTIGATING: ['ACTION_REQUIRED', 'RESOLVED', 'ESCALATED'],
  ACTION_REQUIRED: ['RUNNING', 'ESCALATED', 'RESOLVED', 'FAILED'],
  RUNNING: ['VERIFICATION', 'FAILED'],
  VERIFICATION: ['RESOLVED', 'FAILED', 'INVESTIGATING', 'ESCALATED'],
  RESOLVED: [],
  FAILED: ['INVESTIGATING', 'ESCALATED', 'ACTION_REQUIRED'],
  ESCALATED: ['ACTION_REQUIRED', 'RESOLVED'],
};

const ALL_TEAMS: OperationalTeam[] = [
  'AUDITOR',
  'REPARADOR',
  'GROWTH',
  'EDITOR',
  'MENI',
  'FORENSE',
  'GOOGLE',
  'DISTRIBUCION',
  'NEGOCIO',
  'CEO',
  'MEMORIA',
];

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function now(): string {
  return new Date().toISOString();
}

function sanitize(obj: unknown): unknown {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== undefined) out[k] = sanitize(v);
  }
  return out;
}

export function isValidTransition(from: OperationalState, to: OperationalState): boolean {
  if (from === to) return true;
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  return allowed.includes(to);
}

function severityToPriority(severity: 'critical' | 'warning' | 'info'): 'P0' | 'P1' | 'P2' | 'P3' {
  if (severity === 'critical') return 'P0';
  if (severity === 'warning') return 'P1';
  return 'P2';
}

function teamForConflict(conflict: NiosConflict): OperationalTeam {
  switch (conflict.category) {
    case 'traffic-source':
      return 'GOOGLE';
    case 'repair':
      return 'REPARADOR';
    case 'human-approval':
      return 'CEO';
    case 'data-integrity':
      return conflict.status === 'DATA_CONFLICT' ? 'REPARADOR' : 'AUDITOR';
    case 'source-failure':
      return conflict.status === 'SOURCE_FAILURE' ? 'REPARADOR' : 'GOOGLE';
    case 'meni-forense':
      return 'FORENSE';
    default:
      return 'AUDITOR';
  }
}

function isSnapshotConflict(conflict: NiosConflict): boolean {
  if (conflict.id === 'nios-snapshot-inconsistent') return true;
  if (conflict.category !== 'data-integrity') return false;
  if (conflict.status !== 'DATA_CONFLICT') return false;
  if (conflict.evidence.source !== 'NIOS') return false;
  const note = String(conflict.evidence?.note || '').toLowerCase();
  return note.includes('snapshot') || note.includes('coincidir') || note.includes('conteo');
}

function diagnosisForConflict(conflict: NiosConflict, dashboardCount: number): OperationalDiagnosis {
  const team = teamForConflict(conflict);
  const system = conflict.sources.join(', ') || 'NIOS';
  let auto = false;
  let action = 'investigate';

  if (isSnapshotConflict(conflict) && dashboardCount > 0) {
    auto = true;
    action = 'rebuild-snapshot';
  } else if (conflict.status === 'STALE_DATA' && conflict.category === 'data-integrity') {
    const note = String(conflict.evidence?.note || '').toLowerCase();
    if (note.includes('cache') || note.includes('caché')) {
      auto = true;
      action = 'invalidate-cache';
    }
  } else if (conflict.status === 'REPAIR_FAILURE') {
    auto = false;
    action = 'retry-or-escalate';
  } else if (conflict.status === 'MENI_FORENSE') {
    auto = false;
    action = 'editorial-review';
  } else if (conflict.status === 'HUMAN_APPROVAL_REQUIRED') {
    auto = false;
    action = 'human-approval';
  } else if (['NO_DATA', 'ACCESS_BLOCKED', 'INVALID_CONFIGURATION', 'SOURCE_FAILURE'].includes(conflict.status)) {
    auto = false;
    action = 'configure-source';
  } else if (conflict.status === 'DATA_CONFLICT') {
    auto = isSnapshotConflict(conflict) && dashboardCount > 0;
    action = auto ? 'rebuild-snapshot' : 'investigate';
  }

  return {
    what: conflict.title,
    system,
    severity: conflict.severity,
    impact: conflict.description,
    evidence: conflict.evidence,
    responsibleTeam: team,
    autoRepairable: auto,
    action,
  };
}

function requiresApproval(conflict: NiosConflict, diagnosis: OperationalDiagnosis): boolean {
  if (diagnosis.autoRepairable) return false;
  // Información pura que no requiere intervención.
  if (conflict.severity === 'info' && ['STALE_DATA', 'NO_DATA'].includes(conflict.status)) return false;
  return true;
}

async function findActiveIncidentByConflictId(
  db: Firestore,
  conflictId: string,
): Promise<OperationalIncident | null> {
  const snap = await db
    .collection(COLLECTION)
    .where('conflictId', '==', conflictId)
    .limit(20)
    .get();
  const active = snap.docs
    .map((d) => d.data() as OperationalIncident)
    .filter((inc) => inc.kind === 'operational_incident' && !['RESOLVED', 'FAILED'].includes(inc.state))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  return active[0] || null;
}

export async function getOperationalIncidentById(db: Firestore, id: string): Promise<OperationalIncident | null> {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as OperationalIncident;
}

export async function getOperationalApprovalById(db: Firestore, id: string): Promise<OperationalApproval | null> {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data() as OperationalApproval | undefined;
  return data?.kind === 'operational_approval' ? data : null;
}

function buildIncident(conflict: NiosConflict, diagnosis: OperationalDiagnosis): OperationalIncident {
  return {
    id: newId(),
    kind: 'operational_incident',
    conflictId: conflict.id,
    title: conflict.title,
    description: conflict.description,
    severity: conflict.severity,
    category: conflict.category,
    source: conflict.sources.join(', ') || 'NIOS',
    team: diagnosis.responsibleTeam,
    state: 'DETECTED',
    detectedAt: conflict.detectedAt || now(),
    updatedAt: now(),
    evidence: conflict.evidence,
    diagnosis,
    jobIds: [],
    transitions: [],
    attemptCount: 0,
  };
}

async function createIncident(
  db: Firestore,
  conflict: NiosConflict,
  diagnosis: OperationalDiagnosis,
): Promise<OperationalIncident> {
  const ref = db.collection(COLLECTION).doc();
  const incident = buildIncident(conflict, diagnosis);
  incident.id = ref.id;
  await ref.set(sanitize(incident) as any);
  return incident;
}

async function updateIncident(db: Firestore, incident: OperationalIncident): Promise<void> {
  incident.updatedAt = now();
  await db.collection(COLLECTION).doc(incident.id).set(sanitize(incident) as any, { merge: true });
}

export async function transitionIncident(
  db: Firestore,
  incident: OperationalIncident,
  to: OperationalState,
  cause: string,
  actor: OperationalTeam | string,
  evidence?: Record<string, unknown>,
  result?: string,
): Promise<void> {
  if (!isValidTransition(incident.state, to)) {
    const msg = `Transición inválida de ${incident.state} a ${to} para incidente ${incident.id}`;
    logger.error('[operational-loop]', msg);
    throw new Error(msg);
  }

  const transition: OperationalTransition = {
    from: incident.state,
    to,
    at: now(),
    cause,
    actor,
    evidence,
    result,
  };

  incident.transitions.push(transition);
  incident.state = to;
  await updateIncident(db, incident);
}

async function createApproval(
  db: Firestore,
  incident: OperationalIncident,
  diagnosis: OperationalDiagnosis,
): Promise<OperationalApproval> {
  const ref = db.collection(COLLECTION).doc();
  const approval: OperationalApproval = {
    id: ref.id,
    kind: 'operational_approval',
    incidentId: incident.id,
    action: diagnosis.action,
    motivo: incident.description,
    evidencia: incident.evidence,
    impacto: incident.description,
    riesgo: incident.severity === 'critical' ? 0.9 : incident.severity === 'warning' ? 0.5 : 0.2,
    solicitante: 'NIOS',
    equipo: diagnosis.responsibleTeam,
    efectoEsperado: `Resolución controlada: ${diagnosis.action}`,
    estado: 'PENDING',
    createdAt: now(),
  };
  await ref.set(sanitize(approval) as any);
  return approval;
}

async function recordOperationalMemory(
  db: Firestore,
  incident: OperationalIncident,
  verification: string,
  result: string,
): Promise<OperationalMemoryEntry> {
  const ref = db.collection(COLLECTION).doc();
  const memory: OperationalMemoryEntry = {
    kind: 'operational_memory',
    incidentId: incident.id,
    problema: incident.title,
    causa: incident.diagnosis?.what || incident.description,
    accion: incident.diagnosis?.action || 'ninguna',
    resultado: result,
    verificacion: verification,
    equipo: incident.team,
    fecha: now(),
  };
  await ref.set(sanitize(memory) as any);
  return memory;
}

async function defaultEnqueueOperationalRepair(opts: {
  type: 'operational-repair';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  source: string;
  payload: Record<string, unknown>;
  dedupKey?: string;
  scheduledFor?: string;
}): Promise<string> {
  return enqueueJob({
    type: opts.type,
    priority: opts.priority,
    source: opts.source,
    payload: opts.payload,
    dedupKey: opts.dedupKey,
    scheduledFor: opts.scheduledFor,
  });
}

export interface ProcessOperationalOptions {
  executeNow?: boolean;
  maxAttempts?: number;
  enqueueJob?: (opts: {
    type: 'operational-repair';
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    source: string;
    payload: Record<string, unknown>;
    dedupKey?: string;
    scheduledFor?: string;
  }) => Promise<string>;
}

export async function processOperationalConflicts(
  db: Firestore,
  input: DetectConflictsInput,
  options?: ProcessOperationalOptions,
): Promise<OperationalLoopResult> {
  const conflicts = detectConflicts(input);
  const dashboardCount = input.nios?.articlesCount ?? input.noticias?.length ?? 0;
  const result: OperationalLoopResult = { incidents: [], approvals: [], jobs: [], memory: [], patterns: [], summary: '' };
  const enqueue = options?.enqueueJob ?? defaultEnqueueOperationalRepair;

  for (const conflict of conflicts) {
    let incident = await findActiveIncidentByConflictId(db, conflict.id);

    if (!incident) {
      const diagnosis = diagnosisForConflict(conflict, dashboardCount);
      incident = await createIncident(db, conflict, diagnosis);
    }

    // Si ya está en estado terminal, no lo reprocesamos.
    if (['RESOLVED', 'FAILED', 'ESCALATED'].includes(incident.state)) {
      result.incidents.push(incident);
      continue;
    }

    await transitionIncident(db, incident, 'INVESTIGATING', 'Diagnóstico automático inicial', 'AUDITOR', { conflict });

    // Refrescar diagnóstico con datos actuales.
    const diagnosis = diagnosisForConflict(conflict, dashboardCount);
    incident.diagnosis = diagnosis;
    await updateIncident(db, incident);

    if (diagnosis.autoRepairable) {
      await transitionIncident(
        db,
        incident,
        'ACTION_REQUIRED',
        `Reparación automática segura disponible: ${diagnosis.action}`,
        diagnosis.responsibleTeam,
        { autoRepairable: true, action: diagnosis.action },
      );

      const jobId = await enqueue({
        type: 'operational-repair',
        priority: severityToPriority(incident.severity),
        source: 'nios-operational-loop',
        payload: {
          incidentId: incident.id,
          conflictId: incident.conflictId,
          action: diagnosis.action,
          team: incident.team,
        },
        dedupKey: `operational-repair:${incident.conflictId}:${incident.id}`,
        scheduledFor: now(),
      });

      incident.jobIds.push(jobId);
      await updateIncident(db, incident);
      result.jobs.push(jobId);

      if (options?.executeNow) {
        await executeOperationalRepair(
          db,
          { jobId, type: 'operational-repair', payload: { incidentId: incident.id, action: diagnosis.action, team: incident.team } },
          { maxAttempts: options.maxAttempts },
        );
      }
    } else if (requiresApproval(conflict, diagnosis)) {
      await transitionIncident(
        db,
        incident,
        'ACTION_REQUIRED',
        'Requiere aprobación humana o decisión del equipo responsable',
        diagnosis.responsibleTeam,
        { requiresApproval: true },
      );
      const approval = await createApproval(db, incident, diagnosis);
      incident.approvalId = approval.id;
      await updateIncident(db, incident);
      result.approvals.push(approval);
    } else {
      await transitionIncident(
        db,
        incident,
        'RESOLVED',
        'Sin acción requerida; solo monitoreo',
        'AUDITOR',
        undefined,
        'Registrado como observación',
      );
      const memory = await recordOperationalMemory(db, incident, 'Sin verificación', 'No se requirió acción');
      result.memory.push(memory);
    }

    result.incidents.push(incident);
  }

  result.patterns = await detectRepeatedPatterns(db, 7, 3);
  result.summary = `Conflictos=${conflicts.length}, Incidentes=${result.incidents.length}, Jobs=${result.jobs.length}, Aprobaciones=${result.approvals.length}, Memoria=${result.memory.length}, Patrones=${result.patterns.length}`;

  logger.info('[operational-loop] Procesamiento de conflictos completado', {
    summary: result.summary,
  });

  return result;
}

export interface OperationalRepairJobInput {
  jobId: string;
  type?: string;
  payload?: Record<string, unknown>;
}

export async function executeOperationalRepair(
  db: Firestore,
  job: OperationalRepairJobInput,
  options?: { maxAttempts?: number },
): Promise<Record<string, unknown>> {
  const incidentId = String(job.payload?.incidentId || '');
  const action = String(job.payload?.action || '');

  if (!incidentId) {
    throw new Error('operational-repair sin incidentId');
  }

  const incident = await getOperationalIncidentById(db, incidentId);
  if (!incident) {
    throw new Error(`Incidente no encontrado: ${incidentId}`);
  }

  const team = (job.payload?.team as OperationalTeam) || incident.team;

  await transitionIncident(
    db,
    incident,
    'RUNNING',
    `Worker ${job.jobId} ejecutando reparación`,
    team,
    { jobId: job.jobId, action },
  );

  incident.attemptCount = (incident.attemptCount || 0) + 1;
  await updateIncident(db, incident);

  try {
    const repairResult = await performRepair(db, incident, action);
    await transitionIncident(
      db,
      incident,
      'VERIFICATION',
      'Reparación ejecutada; verificando condición original',
      team,
      { repairResult },
    );

    const verification = await verifyOperationalIncident(db, incident, repairResult);

    if (verification.verified) {
      await transitionIncident(db, incident, 'RESOLVED', verification.message, team, verification.after, 'RESOLVED');
      await recordOperationalMemory(db, incident, verification.message, 'RESOLVED');
      return { verified: true, message: verification.message, incidentId, state: 'RESOLVED' };
    }

    if (incident.attemptCount >= (options?.maxAttempts ?? MAX_ATTEMPTS)) {
      await transitionIncident(
        db,
        incident,
        'ESCALATED',
        `Máximo de intentos alcanzado: ${verification.message}`,
        team,
        verification.after,
        'ESCALATED',
      );
      await recordOperationalMemory(db, incident, verification.message, 'ESCALATED');
      return { verified: false, message: verification.message, incidentId, state: 'ESCALATED' };
    }

    await transitionIncident(db, incident, 'FAILED', `Verificación fallida: ${verification.message}`, team, verification.after, 'FAILED');
    await recordOperationalMemory(db, incident, verification.message, 'FAILED');
    return { verified: false, message: verification.message, incidentId, state: 'FAILED' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[operational-loop] Error en reparación', { incidentId, error: message });

    if (incident.attemptCount >= (options?.maxAttempts ?? MAX_ATTEMPTS)) {
      await transitionIncident(db, incident, 'ESCALATED', `Error en ejecución: ${message}`, team, undefined, 'ESCALATED');
      await recordOperationalMemory(db, incident, message, 'ESCALATED');
      return { verified: false, error: message, incidentId, state: 'ESCALATED' };
    }

    await transitionIncident(db, incident, 'FAILED', `Error en ejecución: ${message}`, team, undefined, 'FAILED');
    await recordOperationalMemory(db, incident, message, 'FAILED');
    return { verified: false, error: message, incidentId, state: 'FAILED' };
  }
}

async function performRepair(
  db: Firestore,
  incident: OperationalIncident,
  action: string,
): Promise<Record<string, unknown>> {
  if (action === 'rebuild-snapshot' || action === 'invalidate-cache' || action === 'nios-cache-refresh') {
    const repair = await runRepairEngine({ db, gsc: null, ga4: null, maxCycles: 1 });
    return { repairEngine: repair, repairedIds: repair.repaired.map((r) => r.repairId) };
  }

  if (incident.category === 'meni-forense' || action === 'editorial-review') {
    return { note: 'Revisión editorial/forense; no se modifica el artículo automáticamente.' };
  }

  return { note: `No hay reparador automático configurado para acción ${action}` };
}

async function verifyOperationalIncident(
  db: Firestore,
  incident: OperationalIncident,
  repairResult: Record<string, unknown>,
): Promise<{ verified: boolean; message: string; after?: Record<string, unknown> }> {
  const action = incident.diagnosis?.action || 'investigate';

  if (action === 'rebuild-snapshot') {
    const repair = repairResult.repairEngine as NiosRepairEngineResult | undefined;
    const record = repair?.repaired.find((r) => r.repairId === 'nios-snapshot-inconsistent');
    const after = (repair?.report?.snapshotConsistency as Record<string, unknown> | undefined) ?? {};

    if (record && record.status === 'VERIFIED' && after && after.consistent === true) {
      return { verified: true, message: record.verification, after };
    }

    const failed = repair?.failedRepairs.find((a) => a.id === 'nios-snapshot-inconsistent');
    return {
      verified: false,
      message: failed?.diagnostic.problem || record?.verification || 'Snapshot no verificado',
      after,
    };
  }

  if (action === 'invalidate-cache' || action === 'nios-cache-refresh') {
    const repair = repairResult.repairEngine as NiosRepairEngineResult | undefined;
    const record = repair?.repaired.find((r) => r.repairId === 'nios-cache-refresh');

    if (record && record.status === 'VERIFIED') {
      return { verified: true, message: record.verification, after: { cacheInvalidatedAt: now() } };
    }

    return { verified: false, message: 'No se pudo invalidar la caché', after: {} };
  }

  if (incident.category === 'meni-forense' || action === 'editorial-review') {
    const slug = String(incident.evidence?.slug || '');
    if (slug) {
      const noticia = await loadNoticiaInputBySlug(db, slug);
      if (noticia) {
        const { detectMeniForenseConflicts } = await import('./meni-forense-judge');
        const conflicts = detectMeniForenseConflicts([noticia], { maxArticles: 1, minConfianza: 1 });
        const same = conflicts.find((c) => c.evidence?.slug === slug);
        if (!same) {
          return {
            verified: true,
            message: 'Discrepancia forense no se reproduce tras revisión editorial.',
            after: { slug, reevaluatedAt: now() },
          };
        }
        return {
          verified: false,
          message: `Discrepancia forense persiste para ${slug}`,
          after: { slug, remainingConflicts: conflicts.length },
        };
      }
    }
    return { verified: false, message: 'Requiere verificación editorial manual', after: {} };
  }

  return {
    verified: false,
    message: `No existe verificación automática para acción ${action}`,
    after: {},
  };
}

async function loadNoticiaInputBySlug(db: Firestore, slug: string): Promise<NoticiaInput | null> {
  const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return mapNoticiaToNoticiaInput({ id: doc.id, ...(doc.data() as any) } as Noticia);
}

function mapNoticiaToNoticiaInput(n: Noticia): NoticiaInput {
  return {
    id: n.id,
    titulo: n.titulo,
    resumen: n.resumen ?? '',
    contenido: n.contenido ?? n.resumen ?? '',
    categoria: n.categoria,
    autor: n.autor ?? 'Redacción',
    fecha: n.fecha,
    slug: n.slug,
    imagen: n.imagen || n.featuredImage || '',
  };
}

export async function approveOperationalApproval(
  db: Firestore,
  approvalId: string,
  user = 'human',
): Promise<OperationalApproval | null> {
  const ref = db.collection(COLLECTION).doc(approvalId);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const approval = doc.data() as OperationalApproval;

  await ref.update({ estado: 'APPROVED', updatedAt: now(), aprobadoPor: user });

  const incident = await getOperationalIncidentById(db, approval.incidentId);
  if (incident && incident.state === 'ACTION_REQUIRED') {
    await transitionIncident(
      db,
      incident,
      'RUNNING',
      `Aprobada por ${user}: ${approval.action}`,
      approval.equipo,
      { approvalId, action: approval.action },
    );
  }

  return { ...approval, estado: 'APPROVED', updatedAt: now() };
}

export async function rejectOperationalApproval(
  db: Firestore,
  approvalId: string,
  reason = '',
  user = 'human',
): Promise<OperationalApproval | null> {
  const ref = db.collection(COLLECTION).doc(approvalId);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const approval = doc.data() as OperationalApproval;

  await ref.update({ estado: 'REJECTED', updatedAt: now(), rechazadoPor: user, razonRechazo: reason });

  const incident = await getOperationalIncidentById(db, approval.incidentId);
  if (incident && incident.state === 'ACTION_REQUIRED') {
    await transitionIncident(
      db,
      incident,
      'ESCALATED',
      `Aprobación rechazada por ${user}: ${reason}`,
      'CEO',
      { approvalId, reason },
    );
  }

  return { ...approval, estado: 'REJECTED', updatedAt: now() };
}

export async function expireStaleApprovals(db: Firestore, ttlDays = 7): Promise<number> {
  const since = new Date(Date.now() - ttlDays * 24 * 60 * 60 * 1000).toISOString();
  const snap = await db
    .collection(COLLECTION)
    .where('kind', '==', 'operational_approval')
    .where('estado', '==', 'PENDING')
    .where('createdAt', '<=', since)
    .get();

  let expired = 0;
  for (const doc of snap.docs) {
    await doc.ref.update({ estado: 'EXPIRED', updatedAt: now() });
    expired++;
  }

  return expired;
}

export async function detectRepeatedPatterns(
  db: Firestore,
  windowDays = 7,
  threshold = 3,
): Promise<OperationalPattern[]> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const snap = await db
    .collection(COLLECTION)
    .orderBy('fecha', 'desc')
    .limit(300)
    .get();

  const groups: Record<
    string,
    { count: number; since: string; lastAt: string; severity: string }
  > = {};

  for (const doc of snap.docs) {
    const m = doc.data() as OperationalMemoryEntry;
    if (m.kind !== 'operational_memory' || !m.fecha || m.fecha < since) continue;
    const key = m.problema || 'problema-desconocido';
    if (!groups[key]) {
      groups[key] = { count: 0, since: m.fecha, lastAt: m.fecha, severity: 'info' };
    }
    groups[key].count++;
    if (m.fecha < groups[key].since) groups[key].since = m.fecha;
    if (m.fecha > groups[key].lastAt) groups[key].lastAt = m.fecha;
  }

  return Object.entries(groups)
    .filter(([, v]) => v.count >= threshold)
    .map(([key, v]) => ({
      key,
      count: v.count,
      since: v.since,
      lastAt: v.lastAt,
      severity: v.count >= threshold * 2 ? 'critical' : v.count >= threshold ? 'warning' : 'info',
      recommendedWatch: true,
    }));
}

export async function getOperationalTeamStatuses(db: Firestore): Promise<Record<OperationalTeam, OperationalTeamStatus>> {
  const snap = await db
    .collection(COLLECTION)
    .where('kind', '==', 'operational_incident')
    .where('state', 'not-in', ['RESOLVED'])
    .orderBy('updatedAt', 'desc')
    .limit(200)
    .get();

  const statuses: Record<OperationalTeam, OperationalTeamStatus> = {} as Record<OperationalTeam, OperationalTeamStatus>;
  for (const team of ALL_TEAMS) {
    statuses[team] = { state: 'IDLE', current: [], count: 0, lastAt: null };
  }

  for (const doc of snap.docs) {
    const inc = doc.data() as OperationalIncident;
    const team = inc.team;
    if (!statuses[team]) continue;

    statuses[team].count++;
    if (!statuses[team].lastAt || inc.updatedAt > statuses[team].lastAt) {
      statuses[team].lastAt = inc.updatedAt;
    }

    if (['RUNNING', 'INVESTIGATING'].includes(inc.state)) {
      statuses[team].state = statuses[team].state === 'BLOCKED' ? 'BLOCKED' : 'WORKING';
      statuses[team].current.push(inc.title);
    } else if (['ACTION_REQUIRED', 'FAILED', 'ESCALATED'].includes(inc.state)) {
      statuses[team].state = 'BLOCKED';
      statuses[team].current.push(inc.title);
    }
  }

  return statuses;
}

export async function getOperationalFeed(db: Firestore, limit = 20): Promise<string[]> {
  const [incidentsSnap, memorySnap] = await Promise.all([
    db
      .collection(COLLECTION)
      .where('kind', '==', 'operational_incident')
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get(),
    db
      .collection(COLLECTION)
      .where('kind', '==', 'operational_memory')
      .orderBy('fecha', 'desc')
      .limit(limit)
      .get(),
  ]);

  const items: { at: string; text: string }[] = [];

  for (const doc of incidentsSnap.docs) {
    const inc = doc.data() as OperationalIncident;
    if (inc.transitions && inc.transitions.length > 0) {
      const last = inc.transitions[inc.transitions.length - 1];
      items.push({
        at: last.at,
        text: `[${last.actor}] ${last.from} → ${last.to}: ${inc.title} (${last.cause})`,
      });
    } else {
      items.push({ at: inc.detectedAt, text: `[AUDITOR] Detectado: ${inc.title}` });
    }
  }

  for (const doc of memorySnap.docs) {
    const m = doc.data() as OperationalMemoryEntry;
    items.push({
      at: m.fecha,
      text: `[MEMORIA] ${m.equipo}: ${m.problema} → ${m.resultado}`,
    });
  }

  return items
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit)
    .map((i) => i.text);
}

export async function getOperationalSummary(db: Firestore): Promise<OperationalSummary> {
  const [incidentsSnap, approvalsSnap, teamStatuses] = await Promise.all([
    db
      .collection(COLLECTION)
      .where('kind', '==', 'operational_incident')
      .orderBy('updatedAt', 'desc')
      .limit(100)
      .get(),
    db
      .collection(COLLECTION)
      .where('kind', '==', 'operational_approval')
      .where('estado', '==', 'PENDING')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get(),
    getOperationalTeamStatuses(db),
  ]);

  const incidents = incidentsSnap.docs.map((d) => d.data() as OperationalIncident);
  const approvals = approvalsSnap.docs.map((d) => d.data() as OperationalApproval);
  const feed = await getOperationalFeed(db, 20);

  return { teams: teamStatuses, incidents, approvals, feed };
}

export async function runOperationalVerification(db: Firestore, incidentId: string): Promise<Record<string, unknown>> {
  const incident = await getOperationalIncidentById(db, incidentId);
  if (!incident) return { ok: false, error: 'Incidente no encontrado' };

  const team = incident.team;
  await transitionIncident(db, incident, 'VERIFICATION', 'Verificación manual solicitada', team);

  const repairResult: Record<string, unknown> = {};
  const verification = await verifyOperationalIncident(db, incident, repairResult);

  if (verification.verified) {
    await transitionIncident(db, incident, 'RESOLVED', verification.message, team, verification.after, 'RESOLVED');
    await recordOperationalMemory(db, incident, verification.message, 'RESOLVED');
    return { verified: true, state: 'RESOLVED' };
  }

  if (incident.attemptCount >= MAX_ATTEMPTS) {
    await transitionIncident(db, incident, 'ESCALATED', verification.message, team, verification.after, 'ESCALATED');
    await recordOperationalMemory(db, incident, verification.message, 'ESCALATED');
    return { verified: false, state: 'ESCALATED' };
  }

  await transitionIncident(db, incident, 'FAILED', verification.message, team, verification.after, 'FAILED');
  await recordOperationalMemory(db, incident, verification.message, 'FAILED');
  return { verified: false, state: 'FAILED' };
}

export async function loadNoticiasAsInputs(db: Firestore, limit = 3): Promise<NoticiaInput[]> {
  const noticias = await loadNoticiasFromFirestore(db, limit);
  return noticias.map(mapNoticiaToNoticiaInput);
}
