import type { NiosDataStatus } from './types';
import type { NiosDiagnostic, NiosDiagnosticSeverity } from './diagnostics';
import type { NiosRepairPlan } from './repair-plan';

export type NiosHealth = 'healthy' | 'partial' | 'critical';

export interface CEOStrategicRecommendation {
  id: string;
  observation: string;
  problem: string;
  impact: string;
  recommendation: string;
  priority: NiosDiagnosticSeverity;
  action: string;
  status: 'pending' | 'done';
  autoFixAvailable: boolean;
  requiresHuman: boolean;
  source: 'GSC' | 'GA4' | 'AdSense' | 'Facebook' | 'NIOS';
}

export interface NiosDataStatusEntry {
  source: 'GSC' | 'GA4' | 'AdSense' | 'Facebook';
  status: NiosDataStatus | 'REAL' | 'NOT_CONFIGURED';
  value?: number;
  note?: string;
}

export interface NiosStatusSummary {
  generatedAt: string;
  health: NiosHealth;
  canOperate: boolean;
  data: NiosDataStatusEntry[];
  criticalBlockers: string[];
  observations: string[];
  recommendations: CEOStrategicRecommendation[];
  recommendedNextAction: string;
  autoFixAvailable: CEOStrategicRecommendation[];
  humanActionRequired: CEOStrategicRecommendation[];
  summary: string;
  conversationReady: boolean;
}

export function generateCEOStatusReport(
  gscStatus: NiosDataStatus | undefined,
  ga4Status: NiosDataStatus | undefined,
  diagnostics: NiosDiagnostic[],
  repairPlan: NiosRepairPlan,
): NiosStatusSummary {
  const generatedAt = new Date().toISOString();
  const health = repairPlan.health;

  const data: NiosDataStatusEntry[] = [
    { source: 'GSC', status: gscStatus ?? 'NO_DATA' },
    { source: 'GA4', status: ga4Status ?? 'NO_DATA' },
    { source: 'AdSense', status: 'NOT_CONFIGURED', note: 'No hay collector real configurado.' },
    { source: 'Facebook', status: 'REAL', value: 23952, note: 'FACEBOOK_VIEWS aislado del site traffic.' },
  ];

  const canOperate = data.some((d) => d.status === 'REAL');

  const criticalBlockers = repairPlan.humanActions
    .filter((a) => a.severity === 'critical')
    .map((a) => a.problem);

  const observations: string[] = diagnostics.map((d) => {
    if (d.status === 'REAL') return `${d.source}: operativo.`;
    return `${d.source} — ${d.problem}`;
  });

  const recommendations: CEOStrategicRecommendation[] = repairPlan.humanActions.map((a) => ({
    id: a.id,
    observation: `[${a.source}] ${a.problem}`,
    problem: a.cause,
    impact: a.impact,
    recommendation: a.recommendation,
    priority: a.severity,
    action: a.requiresHuman ? 'REQUIRES_HUMAN_ACTION' : a.autoFixAvailable ? 'AUTO_FIX' : 'NO_ACTION',
    status: a.status,
    autoFixAvailable: a.autoFixAvailable,
    requiresHuman: a.requiresHuman,
    source: a.source,
  }));

  const autoFixAvailable = recommendations.filter((r) => r.autoFixAvailable);
  const humanActionRequired = recommendations.filter((r) => r.requiresHuman);

  const summary = health === 'critical'
    ? `NIOS está crítico: ${criticalBlockers.length} bloqueos impiden evaluación orgánica. Siguiente acción: ${repairPlan.nextAction}`
    : health === 'partial'
      ? `NIOS es operativo parcialmente. Fuentes bloqueadas: ${criticalBlockers.length}. ${repairPlan.nextAction}`
      : 'NIOS está operativo con fuentes reales disponibles.';

  return {
    generatedAt,
    health,
    canOperate,
    data,
    criticalBlockers,
    observations,
    recommendations,
    recommendedNextAction: repairPlan.nextAction,
    autoFixAvailable,
    humanActionRequired,
    summary,
    conversationReady: true,
  };
}
