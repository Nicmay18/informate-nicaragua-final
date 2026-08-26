import type { GSCSnapshot, GA4Snapshot, NiosDataStatus } from './intelligence/types';
import { generateNiosDiagnostics, type NiosDiagnosticSeverity } from './intelligence/diagnostics';
import { generateRepairPlan, type NiosRepairAction } from './intelligence/repair-plan';

export type NiosOperatingMode =
  | 'HEALTHY'
  | 'ACTION_REQUIRED'
  | 'AUTO_REPAIRING'
  | 'WAITING_HUMAN'
  | 'BLOCKED'
  | 'VERIFIED';

export interface NiosOperatingAction {
  id: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  title: string;
  source: string;
  type: 'AUTO_REPAIR' | 'HUMAN_ACTION' | 'BLOCKED';
  status: 'PENDING' | 'IN_PROGRESS' | 'WAITING_HUMAN' | 'FIXED' | 'VERIFIED' | 'SKIPPED';
  what: string;
  why: string;
}

export interface NiosAutoRepairRecord {
  repairId: string;
  problem: string;
  rootCause: string;
  action: string;
  type: string;
  status: 'FIXED' | 'VERIFIED';
  timestamp: string;
  verification: string;
  rollbackAvailable: boolean;
}

export interface NiosHumanActionItem {
  id: string;
  problem: string;
  rootCause: string;
  whatYouMustDo: string;
  source: string;
  status: 'PENDING' | 'WAITING_HUMAN';
}

export interface NiosWorkingItem {
  source: string;
  status: NiosDataStatus;
  note: string;
}

export interface NiosBlockedItem {
  source: string;
  status: NiosDataStatus;
  why: string;
  whatYouMustDo: string;
}

export interface NiosOperatingReport {
  mode: NiosOperatingMode;
  generatedAt: string;
  summary: string;
  top5Actions: NiosOperatingAction[];
  autoRepaired: NiosAutoRepairRecord[];
  humanActions: NiosHumanActionItem[];
  working: NiosWorkingItem[];
  blocked: NiosBlockedItem[];
  whatToDoNow: string[];
  whatNiosWillDo: string[];
  snapshotConsistency: { snapshotCount: number; dashboardCount: number; consistent: boolean };
  tests: { total: number; passed: number; failed: number; status: 'PASS' | 'FAIL' | 'NOT_RUN' };
  build: 'PASS' | 'FAIL' | 'NOT_RUN';
  finalState: 'OPERATIONAL' | 'DEGRADED' | 'BLOCKED';
  niosAhoraPuede: string[];
}

export interface NiosOperatingReportInput {
  gsc: GSCSnapshot | null;
  ga4: GA4Snapshot | null;
  adSenseClientId?: string;
  snapshotCount: number;
  dashboardCount: number;
  completedAutoRepairs?: NiosAutoRepairRecord[];
  tests?: { total: number; passed: number; failed: number };
  build?: 'PASS' | 'FAIL';
}

const SEVERITY_ORDER: Record<NiosDiagnosticSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

function severityToPriority(severity: NiosDiagnosticSeverity): NiosOperatingAction['priority'] {
  if (severity === 'critical') return 'P0';
  if (severity === 'high') return 'P1';
  if (severity === 'medium') return 'P2';
  return 'P3';
}

function actionType(a: NiosRepairAction): NiosOperatingAction['type'] {
  if (a.status === 'done') return 'AUTO_REPAIR';
  if (a.autoFixAvailable) return 'AUTO_REPAIR';
  return 'HUMAN_ACTION';
}

function actionStatus(a: NiosRepairAction): NiosOperatingAction['status'] {
  if (a.status === 'done') return 'VERIFIED';
  if (a.autoFixAvailable) return 'PENDING';
  return 'WAITING_HUMAN';
}

function isBlockedStatus(status: NiosDataStatus): boolean {
  return ['ACCESS_BLOCKED', 'CONFIG_REQUIRED', 'INVALID_CONFIGURATION', 'DATA_CONFLICT'].includes(status);
}

function isWorkingStatus(status: NiosDataStatus): boolean {
  return ['REAL', 'NOT_CONFIGURED', 'CONNECTED_NO_DATA'].includes(status);
}

export function generateOperatingReport(input: NiosOperatingReportInput): NiosOperatingReport {
  const generatedAt = new Date().toISOString();
  const completedAutoRepairs = input.completedAutoRepairs ?? [];

  const diagnostics = generateNiosDiagnostics(input.gsc, input.ga4);

  const snapshotConsistent = input.snapshotCount === input.dashboardCount;
  if (!snapshotConsistent) {
    diagnostics.push({
      id: 'nios-snapshot-inconsistent',
      severity: 'high',
      source: 'NIOS',
      status: 'DATA_CONFLICT',
      problem: `Snapshot (${input.snapshotCount} artículos) no coincide con dashboard (${input.dashboardCount} artículos).`,
      cause: 'El pipeline de snapshot no almacena la misma cantidad de artículos que ve el dashboard.',
      impact: 'El Command Center y el snapshot muestran dos realidades distintas. No se puede confiar en las métricas derivadas.',
      recommendedAction: 'Revisar data-merger, snapshot-save y snapshot-read; alinear el conteo antes de calcular métricas.',
      action: 'INVESTIGATE',
      autoFixAvailable: false,
      requiresHuman: true,
      expectedResult: 'snapshotCount === dashboardCount y el dashboard consume el mismo snapshot.',
    });
  }

  const repairPlan = generateRepairPlan(diagnostics);

  const allRepairActions = [
    ...repairPlan.critical,
    ...repairPlan.high,
    ...repairPlan.medium,
    ...repairPlan.low,
    ...repairPlan.info,
  ].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const top5Actions: NiosOperatingAction[] = allRepairActions
    .filter((a) => a.action !== 'NO_ACTION')
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      priority: severityToPriority(a.severity),
      title: a.title,
      source: a.source,
      type: actionType(a),
      status: actionStatus(a),
      what: a.action,
      why: `${a.problem}. Causa: ${a.cause}`,
    }));

  const autoRepaired: NiosAutoRepairRecord[] = [
    ...completedAutoRepairs,
    ...repairPlan.autoFixes
      .filter((a) => a.status === 'done')
      .map((a) => ({
        repairId: a.id,
        problem: a.problem,
        rootCause: a.cause,
        action: a.action,
        type: a.autoFixAvailable ? 'AUTO_REPAIR' : 'HUMAN_ACTION',
        status: 'FIXED' as const,
        timestamp: repairPlan.generatedAt,
        verification: a.expectedResult,
        rollbackAvailable: false,
      })),
  ];

  const humanActions: NiosHumanActionItem[] = allRepairActions
    .filter((a) => a.requiresHuman)
    .map((a) => ({
      id: a.id,
      problem: a.problem,
      rootCause: a.cause,
      whatYouMustDo: a.recommendation,
      source: a.source,
      status: a.autoFixAvailable ? 'PENDING' : a.requiresHuman ? 'WAITING_HUMAN' : 'PENDING',
    }));

  const working: NiosWorkingItem[] = diagnostics
    .filter((d) => isWorkingStatus(d.status))
    .map((d) => ({
      source: d.source,
      status: d.status,
      note: d.problem,
    }));

  const blocked: NiosBlockedItem[] = diagnostics
    .filter((d) => isBlockedStatus(d.status))
    .map((d) => ({
      source: d.source,
      status: d.status,
      why: d.cause,
      whatYouMustDo: d.recommendedAction,
    }));

  const whatToDoNow: string[] = [];
  if (humanActions.length > 0) {
    whatToDoNow.push(`Acción inmediata: ${humanActions[0].whatYouMustDo}`);
  }
  if (!snapshotConsistent) {
    whatToDoNow.push('Revisar consistencia entre snapshot y dashboard antes de publicar nuevas decisiones.');
  }
  const firstAuto = allRepairActions.find((a) => a.autoFixAvailable && a.status !== 'done');
  if (firstAuto) {
    whatToDoNow.push(`NIOS puede ejecutar: ${firstAuto.recommendation}`);
  }
  if (whatToDoNow.length === 0) {
    whatToDoNow.push('No hay acciones críticas. Mantener monitoreo.');
  }

  const whatNiosWillDo: string[] = [
    'Verificar estados de fuentes en cada corrida.',
    'No propagar ceros cuando la fuente esté bloqueada o sin configurar.',
    'Mantener la cola de reparación priorizada por severidad.',
    ...repairPlan.autoFixes
      .filter((a) => a.status !== 'done')
      .map((a) => `Ejecutar cuando sea seguro: ${a.problem} — ${a.recommendation}`),
  ];

  const hasSnapshotConflict = input.snapshotCount !== input.dashboardCount && input.dashboardCount > 0;

  let mode: NiosOperatingMode = 'HEALTHY';
  if (hasSnapshotConflict) {
    mode = 'BLOCKED';
  } else if (blocked.some((b) => b.status === 'ACCESS_BLOCKED' || b.status === 'INVALID_CONFIGURATION')) {
    mode = 'WAITING_HUMAN';
  } else if (blocked.some((b) => b.status === 'CONFIG_REQUIRED' || b.status === 'DATA_CONFLICT')) {
    mode = 'ACTION_REQUIRED';
  } else if (humanActions.length > 0) {
    mode = 'WAITING_HUMAN';
  } else if (autoRepaired.length > 0) {
    mode = 'VERIFIED';
  }

  const summary =
    mode === 'HEALTHY'
      ? 'NIOS está operativo. Fuentes reales disponibles y sin inconsistencias detectadas.'
      : mode === 'WAITING_HUMAN'
        ? `NIOS está en espera: ${humanActions.length} acción(es) requieren decisión del editor.`
        : mode === 'ACTION_REQUIRED'
          ? `NIOS requiere acción: ${blocked.length} bloqueo(s) o inconsistencia(s) deben resolverse.`
          : `NIOS modo ${mode}: ${repairPlan.summary}`;

  const finalState: NiosOperatingReport['finalState'] =
    mode === 'HEALTHY' || mode === 'VERIFIED'
      ? 'OPERATIONAL'
      : mode === 'BLOCKED'
        ? 'BLOCKED'
        : 'DEGRADED';

  const testsStatus: NiosOperatingReport['tests']['status'] =
    input.tests === undefined
      ? 'NOT_RUN'
      : input.tests.failed === 0 && input.tests.total > 0
        ? 'PASS'
        : 'FAIL';

  const tests = input.tests ?? { total: 0, passed: 0, failed: 0 };
  const build = input.build ?? 'NOT_RUN';

  const niosAhoraPuede: string[] = [
    'Detectar el estado real de GSC, GA4, AdSense y snapshots.',
    'Distinguir REAL, ACCESS_BLOCKED, CONFIG_REQUIRED, INVALID_CONFIGURATION y NO_DATA sin confundirlos con ceros.',
    'Generar exactamente 5 acciones priorizadas (P0–P3) para el editor.',
    'Explicar qué NIOS puede reparar automáticamente y qué requiere aprobación humana.',
    'Verificar consistencia entre dashboard y snapshot y reportarla como DATA_CONFLICT.',
    'Responder en lenguaje humano: qué está mal, qué es importante, qué ya reparó y qué sigue.',
    'No marcar artículos como RED solo por falta de datos de Google.',
    'No presentar hipótesis de AdSense ni Trust como hechos de Google.',
  ];

  return {
    mode,
    generatedAt,
    summary,
    top5Actions,
    autoRepaired,
    humanActions,
    working,
    blocked,
    whatToDoNow,
    whatNiosWillDo,
    snapshotConsistency: {
      snapshotCount: input.snapshotCount,
      dashboardCount: input.dashboardCount,
      consistent: snapshotConsistent,
    },
    tests: { ...tests, status: testsStatus },
    build,
    finalState,
    niosAhoraPuede,
  };
}
