/**
 * NIOS Autonomous Repair Engine
 * ================================
 * Convierte a NIOS de auditor a sistema operativo.
 *
 * Ciclo:
 *   DETECT → CLASSIFY → PLAN → REPAIR → VERIFY → PERSIST → REPORT
 *
 * No inventa credenciales. No destruye datos. No marca como reparado sin verificar.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import { generateNiosDiagnostics, type NiosDiagnostic } from './intelligence/diagnostics';
import { loadNoticiasFromFirestore, mergeArticleData } from './intelligence/data-merger';
import { getLatestSnapshot } from './intelligence/store';
import { generateOperatingReport, type NiosOperatingReport, type NiosAutoRepairRecord } from './operating-mode';
import type {
  GSCSnapshot,
  GA4Snapshot,
  ArticleFusion,
  NiosDataStatus,
  DailySnapshot,
} from './intelligence/types';
import type { Noticia } from '@/lib/types';

const MAX_REPAIR_CYCLES = 3;
const COLLECTION_SNAPSHOTS = 'nios_daily_snapshots';
const SNAPSHOT_VERSION = '2.1-repaired';

export type NiosRepairActionType = 'AUTO_REPAIR' | 'HUMAN_ACTION' | 'VERIFY_ONLY';

export type NiosRepairActionStatus =
  | 'PLANNED'
  | 'REPAIRING'
  | 'REPAIRED'
  | 'VERIFIED'
  | 'FAILED'
  | 'WAITING_HUMAN'
  | 'SKIPPED';

export type NiosRepairActionPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface NiosRepairAction {
  id: string;
  priority: NiosRepairActionPriority;
  source: 'GSC' | 'GA4' | 'AdSense' | 'Facebook' | 'NIOS';
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: NiosRepairActionType;
  canAutoRepair: boolean;
  reason: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  status: NiosRepairActionStatus;
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'FAILED';
  nextAction: string;
  diagnostic: NiosDiagnostic;
}

export interface NiosRepairRecord {
  repairId: string;
  problem: string;
  rootCause: string;
  action: string;
  type: NiosRepairActionType;
  status: 'FIXED' | 'VERIFIED' | 'FAILED';
  timestamp: string;
  verification: string;
  rollbackAvailable: boolean;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface NiosRepairVerification {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  verified: boolean;
  message: string;
}

export interface NiosRepairEngineState {
  db: Firestore;
  gsc?: GSCSnapshot | null;
  ga4?: GA4Snapshot | null;
  maxCycles?: number;
}

export interface NiosRepairEngineResult {
  mode: NiosOperatingReport['mode'];
  modeChanged: boolean;
  repaired: NiosRepairRecord[];
  pendingHuman: NiosRepairAction[];
  failedRepairs: NiosRepairAction[];
  skipped: NiosRepairAction[];
  verification: NiosRepairVerification[];
  actions: NiosRepairAction[];
  summary: string;
  report: NiosOperatingReport;
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function priorityForSeverity(severity: NiosDiagnostic['severity']): NiosRepairActionPriority {
  switch (severity) {
    case 'critical':
      return 'P0';
    case 'high':
      return 'P1';
    case 'medium':
      return 'P2';
    default:
      return 'P3';
  }
}

function removeUndefined(obj: unknown): unknown {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== undefined) out[k] = removeUndefined(v);
  }
  return out;
}

function isAutoRepairable(diagnostic: NiosDiagnostic, state: NiosSystemState): boolean {
  if (!diagnostic.autoFixAvailable) return false;

  // Snapshot: solo si hay artículos canónicos reales en Firestore.
  if (diagnostic.id === 'nios-snapshot-inconsistent') {
    return state.dashboardCount > 0;
  }

  return true;
}

function actionTypeFor(diagnostic: NiosDiagnostic, state: NiosSystemState): NiosRepairActionType {
  if (isAutoRepairable(diagnostic, state)) return 'AUTO_REPAIR';
  if (diagnostic.requiresHuman) return 'HUMAN_ACTION';
  return 'VERIFY_ONLY';
}

interface NiosSystemState {
  db: Firestore;
  gsc: GSCSnapshot | null;
  ga4: GA4Snapshot | null;
  noticias: Noticia[];
  latestSnapshot: DailySnapshot | null;
  dashboardCount: number;
  snapshotCount: number;
  diagnostics: NiosDiagnostic[];
}

async function collectSystemState(state: NiosRepairEngineState): Promise<NiosSystemState> {
  const db = state.db;
  let gsc = state.gsc ?? null;
  let ga4 = state.ga4 ?? null;

  const [noticias, latestSnapshot] = await Promise.all([
    loadNoticiasFromFirestore(db, 1000).catch((err) => {
      logger.error('[repair-engine] loadNoticiasFromFirestore failed:', err);
      return [] as Noticia[];
    }),
    getLatestSnapshot(db).catch((err) => {
      logger.error('[repair-engine] getLatestSnapshot failed:', err);
      return null;
    }),
  ]);

  // Si no se pasaron gsc/ga4, intentar usarlos del último snapshot.
  if (!gsc && latestSnapshot?.gsc) gsc = latestSnapshot.gsc;
  if (!ga4 && latestSnapshot?.ga4) ga4 = latestSnapshot.ga4;

  const dashboardCount = noticias.length;
  const snapshotCount = latestSnapshot?.articlesFused?.length ?? 0;

  const diagnostics = generateNiosDiagnostics(gsc, ga4);

  // Diagnostic de consistencia snapshot vs dashboard
  if (dashboardCount !== snapshotCount) {
    diagnostics.push({
      id: 'nios-snapshot-inconsistent',
      severity: 'high',
      source: 'NIOS',
      status: 'DATA_CONFLICT' as NiosDataStatus,
      problem: `Snapshot (${snapshotCount} artículos) no coincide con dashboard (${dashboardCount} artículos).`,
      cause: 'El snapshot no refleja el conteo real de artículos publicados en Firestore.',
      impact: 'El Command Center y los reportes derivados trabajan con datos incompletos o distorsionados.',
      recommendedAction: 'Reconstruir el snapshot desde Firestore (noticias) y verificar el conteo.',
      action: 'AUTO_REPAIR',
      autoFixAvailable: true,
      requiresHuman: false,
      expectedResult: `snapshotCount === dashboardCount (${dashboardCount}).`,
    });
  }

  return { db, gsc, ga4, noticias, latestSnapshot, dashboardCount, snapshotCount, diagnostics };
}

function buildActions(diagnostics: NiosDiagnostic[], state: NiosSystemState): NiosRepairAction[] {
  return diagnostics.map((d) => {
    const type = actionTypeFor(d, state);
    const canAutoRepair = type === 'AUTO_REPAIR';
    const status: NiosRepairActionStatus = canAutoRepair ? 'PLANNED' : d.requiresHuman ? 'WAITING_HUMAN' : 'SKIPPED';

    let before: Record<string, unknown> | undefined;
    let after: Record<string, unknown> | undefined;
    if (d.id === 'nios-snapshot-inconsistent') {
      before = { snapshotCount: state.snapshotCount, dashboardCount: state.dashboardCount };
      after = { snapshotCount: state.dashboardCount, dashboardCount: state.dashboardCount };
    }

    return {
      id: d.id,
      priority: priorityForSeverity(d.severity),
      source: d.source,
      title: `[${d.source}] ${d.problem}`,
      severity: d.severity,
      type,
      canAutoRepair,
      reason: d.cause,
      before,
      after,
      status,
      verificationStatus: 'UNVERIFIED',
      nextAction: d.action,
      diagnostic: d,
    };
  });
}

async function repairSnapshotForDate(
  db: Firestore,
  date: string,
  articles: ArticleFusion[],
): Promise<void> {
  const docRef = db.collection(COLLECTION_SNAPSHOTS).doc(date);

  const sanitized = removeUndefined(articles) as ArticleFusion[];
  const payload: Record<string, unknown> = {
    date,
    version: SNAPSHOT_VERSION,
    articlesCount: articles.length,
    repairedAt: new Date().toISOString(),
    repairedBy: 'nios-repair-engine',
  };

  const json = JSON.stringify(sanitized);
  if (articles.length <= 400 && json.length < 900_000) {
    payload.articlesFused = sanitized;
  }

  await docRef.set(payload, { merge: true });

  if (!payload.articlesFused && articles.length > 0) {
    const batch = db.batch();
    for (const a of articles) {
      const slug = a.slug || Math.random().toString(36).slice(2);
      const ref = docRef.collection('articles').doc(slug);
      batch.set(ref, removeUndefined(a));
    }
    await batch.commit();
  }

  logger.info(`[repair-engine] Repaired snapshot ${date} with ${articles.length} articles`);
}

async function repairSnapshotConsistency(state: NiosSystemState): Promise<NiosRepairVerification> {
  const before = {
    snapshotCount: state.snapshotCount,
    dashboardCount: state.dashboardCount,
  };

  try {
    const articles = mergeArticleData(state.noticias, state.gsc, state.ga4);
    const date = state.latestSnapshot?.date ?? todayKey();
    await repairSnapshotForDate(state.db, date, articles);

    const latestAfter = await getLatestSnapshot(state.db);
    const snapshotCountAfter = latestAfter?.articlesFused?.length ?? 0;
    const dashboardCountAfter = state.dashboardCount;
    const verified = snapshotCountAfter === dashboardCountAfter;

    const after = { snapshotCount: snapshotCountAfter, dashboardCount: dashboardCountAfter };
    const message = verified
      ? `Snapshot reconstruido y verificado: ${snapshotCountAfter} artículos coinciden con dashboard.`
      : `Reparación incompleta: snapshot=${snapshotCountAfter}, dashboard=${dashboardCountAfter}.`;

    return { before, after, verified, message };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error('[repair-engine] repairSnapshotConsistency failed:', err);
    return { before, after: before, verified: false, message: `Falló la reparación: ${error}` };
  }
}

async function executeRepair(
  action: NiosRepairAction,
  state: NiosSystemState,
): Promise<{ record: NiosRepairRecord; verification: NiosRepairVerification; action: NiosRepairAction }> {
  action.status = 'REPAIRING';

  let verification: NiosRepairVerification;
  if (action.id === 'nios-snapshot-inconsistent') {
    verification = await repairSnapshotConsistency(state);
  } else {
    verification = {
      before: action.before ?? {},
      after: action.before ?? {},
      verified: false,
      message: 'No existe reparador automático para este diagnóstico.',
    };
  }

  const verified = verification.verified;
  const status: NiosRepairRecord['status'] = verified ? 'VERIFIED' : 'FAILED';

  action.after = verification.after;
  action.status = verified ? 'VERIFIED' : 'FAILED';
  action.verificationStatus = verified ? 'VERIFIED' : 'FAILED';

  const record: NiosRepairRecord = {
    repairId: action.id,
    problem: action.diagnostic.problem,
    rootCause: action.diagnostic.cause,
    action: `AUTO_REPAIR: ${action.diagnostic.recommendedAction}`,
    type: action.type,
    status,
    timestamp: new Date().toISOString(),
    verification: verification.message,
    rollbackAvailable: false,
    before: verification.before,
    after: verification.after,
  };

  return { record, verification, action };
}

function toAutoRepairRecord(record: NiosRepairRecord): NiosAutoRepairRecord {
  return {
    repairId: record.repairId,
    problem: record.problem,
    rootCause: record.rootCause,
    action: record.action,
    type: record.type,
    status: record.status === 'FAILED' ? 'FIXED' : 'VERIFIED',
    timestamp: record.timestamp,
    verification: record.verification,
    rollbackAvailable: record.rollbackAvailable,
  };
}

export async function runRepairEngine(state: NiosRepairEngineState): Promise<NiosRepairEngineResult> {
  const start = new Date().toISOString();
  const maxCycles = Math.min(state.maxCycles ?? MAX_REPAIR_CYCLES, MAX_REPAIR_CYCLES);

  let system = await collectSystemState(state);
  let actions = buildActions(system.diagnostics, system);

  const initialReport = generateOperatingReport({
    gsc: system.gsc,
    ga4: system.ga4,
    snapshotCount: system.snapshotCount,
    dashboardCount: system.dashboardCount,
    completedAutoRepairs: [],
  });

  const initialMode = initialReport.mode;

  const repaired: NiosRepairRecord[] = [];
  const verifications: NiosRepairVerification[] = [];
  let cycles = 0;
  let madeProgress = true;

  while (cycles < maxCycles && madeProgress) {
    cycles += 1;
    madeProgress = false;

    const candidate = actions.find(
      (a) => a.type === 'AUTO_REPAIR' && (a.status === 'PLANNED' || a.status === 'FAILED'),
    );

    if (!candidate) break;

    const { record, verification, action: updatedAction } = await executeRepair(candidate, system);
    verifications.push(verification);

    const actionIndex = actions.findIndex((a) => a.id === updatedAction.id);
    if (actionIndex >= 0) actions[actionIndex] = updatedAction;

    if (record.status === 'VERIFIED') {
      repaired.push(record);
      madeProgress = true;
    }

    // Releer estado después de cada reparación para verificación real.
    system = await collectSystemState(state);

    // Regenerar acciones con el nuevo estado; mantener histórico de acciones anteriores.
    const newActions = buildActions(system.diagnostics, system);
    actions = actions.map((old) => {
      const next = newActions.find((n) => n.id === old.id);
      if (next && (old.status === 'VERIFIED' || old.status === 'FAILED')) {
        return { ...next, status: old.status, verificationStatus: old.verificationStatus, after: old.after };
      }
      return next ?? old;
    });
  }

  const completedAutoRepairs = repaired.map(toAutoRepairRecord);
  const finalReport = generateOperatingReport({
    gsc: system.gsc,
    ga4: system.ga4,
    snapshotCount: system.snapshotCount,
    dashboardCount: system.dashboardCount,
    completedAutoRepairs,
  });

  const pendingHuman = actions.filter((a) => a.type === 'HUMAN_ACTION');
  const failedRepairs = actions.filter((a) => a.status === 'FAILED');
  const skipped = actions.filter((a) => a.status === 'SKIPPED');

  const summary = `NIOS Repair Engine ejecutado en ${new Date(start).toISOString()}.
Ciclos: ${cycles}/${maxCycles}.
Reparaciones verificadas: ${repaired.length}.
Pendientes humanos: ${pendingHuman.length}.
Fallidas: ${failedRepairs.length}.
Omitidas: ${skipped.length}.
Modo final: ${finalReport.mode}.`;

  return {
    mode: finalReport.mode,
    modeChanged: finalReport.mode !== initialMode,
    repaired,
    pendingHuman,
    failedRepairs,
    skipped,
    verification: verifications,
    actions,
    summary,
    report: finalReport,
  };
}

export async function runAutonomousRepair(state: NiosRepairEngineState): Promise<NiosRepairEngineResult> {
  return runRepairEngine({ ...state, maxCycles: MAX_REPAIR_CYCLES });
}
