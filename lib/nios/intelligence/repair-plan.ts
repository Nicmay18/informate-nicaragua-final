import type { NiosDiagnostic, NiosDiagnosticSeverity } from './diagnostics';

export interface NiosRepairAction {
  id: string;
  title: string;
  severity: NiosDiagnosticSeverity;
  source: NiosDiagnostic['source'];
  problem: string;
  cause: string;
  impact: string;
  recommendation: string;
  action: string;
  autoFixAvailable: boolean;
  requiresHuman: boolean;
  status: 'pending' | 'done';
  expectedResult: string;
  account?: string;
  property?: string;
  variable?: string;
}

export interface NiosRepairPlan {
  generatedAt: string;
  critical: NiosRepairAction[];
  high: NiosRepairAction[];
  medium: NiosRepairAction[];
  low: NiosRepairAction[];
  info: NiosRepairAction[];
  autoFixes: NiosRepairAction[];
  humanActions: NiosRepairAction[];
  summary: string;
  nextAction: string;
  health: 'healthy' | 'partial' | 'critical';
}

function toAction(d: NiosDiagnostic): NiosRepairAction {
  return {
    id: d.id,
    title: `[${d.source}] ${d.problem}`,
    severity: d.severity,
    source: d.source,
    problem: d.problem,
    cause: d.cause,
    impact: d.impact,
    recommendation: d.recommendedAction,
    action: d.action,
    autoFixAvailable: d.autoFixAvailable,
    requiresHuman: d.requiresHuman,
    status: d.status === 'REAL' ? 'done' : 'pending',
    expectedResult: d.expectedResult,
    account: d.account,
    property: d.property,
    variable: d.variable,
  };
}

export function generateRepairPlan(diagnostics: NiosDiagnostic[]): NiosRepairPlan {
  const actions = diagnostics.map(toAction);
  const bucket = (severity: NiosDiagnosticSeverity) => actions.filter((a) => a.severity === severity);
  const autoFixes = actions.filter((a) => a.autoFixAvailable);
  const humanActions = actions.filter((a) => a.requiresHuman && a.status === 'pending');
  const critical = bucket('critical');
  const high = bucket('high');
  const hasCritical = critical.length > 0;

  const pendingHumanCritical = critical.filter((a) => a.requiresHuman);
  const nextAction = pendingHumanCritical.length > 0
    ? pendingHumanCritical[0].recommendation
    : high.filter((a) => a.requiresHuman)[0]?.recommendation
      || autoFixes[0]?.recommendation
      || 'No hay acciones pendientes.';

  const summary = `Plan de reparación NIOS: ${critical.length} críticas, ${high.length} altas, ${bucket('medium').length} medias, ${bucket('low').length} bajas, ${bucket('info').length} informativas. Auto-fixes disponibles: ${autoFixes.length}. Acciones que requieren humano: ${humanActions.length}.`;

  const health = hasCritical ? 'critical' : high.length > 0 ? 'partial' : 'healthy';

  return {
    generatedAt: new Date().toISOString(),
    critical,
    high,
    medium: bucket('medium'),
    low: bucket('low'),
    info: bucket('info'),
    autoFixes,
    humanActions,
    summary,
    nextAction,
    health,
  };
}
