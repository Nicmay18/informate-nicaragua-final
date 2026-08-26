import { runAudienceIntelligence } from './audience';
import { buildCeoReport } from './ceoReport';
export { runEditorialDiagnosis, generateCEOResponse } from './editorial-diagnosis';
export type { EditorialDiagnosis, EditorialProblem, CEOResponse } from './editorial-diagnosis';
import { runCompetitorIntelligence } from './competitors';
import { runContentLifecycle } from './contentLifecycle';
import { runDistributionIntelligence } from './distribution';
import { runGrowthIntelligence } from './growth';
import { runOpportunityHunter } from './opportunityHunter';
import { runRevenueIntelligence } from './revenue';
import { runSeoIntelligence } from './seo';
import type { NiosModuleReport, NiosRecommendation, NiosReport } from './types';
import { sortByPriority } from './utils';

export * from './types';

const MODULE_RUNNERS = [
  runGrowthIntelligence,
  runSeoIntelligence,
  runContentLifecycle,
  runAudienceIntelligence,
  runRevenueIntelligence,
  runDistributionIntelligence,
  runCompetitorIntelligence,
  runOpportunityHunter,
];

export async function getNiosReport(): Promise<NiosReport> {
  const results = await Promise.all(MODULE_RUNNERS.map((runner) => runner().catch((err) => ({
    module: 'unknown',
    status: 'requires_attention' as const,
    summary: 'Módulo falló al ejecutarse.',
    metrics: [],
    recommendations: [],
    errors: [err instanceof Error ? err.message : String(err)],
  }))));

  const modules: Record<string, NiosModuleReport> = {};
  const errors: string[] = [];

  results.forEach((r) => {
    modules[r.module] = r;
    if (r.errors) errors.push(...r.errors);
  });

  const allRecommendations = Object.values(modules).flatMap((m) => m.recommendations);
  const sorted = sortByPriority(allRecommendations);

  const ceoReport = buildCeoReport({ generatedAt: new Date().toISOString(), status: errors.length ? 'partial' : 'ok', errors: errors.length ? errors : undefined, modules, priorities: [], alerts: [], opportunities: [], risks: [], nextActions: [], ceoReport: {} as NiosReport['ceoReport'] } as NiosReport, modules);

  const report: NiosReport = {
    generatedAt: new Date().toISOString(),
    status: errors.length ? 'partial' : 'ok',
    errors: errors.length ? errors : undefined,
    modules,
    priorities: sorted.filter((r) => ['critical', 'high'].includes(r.priority)),
    alerts: sorted.filter((r) => r.priority === 'critical'),
    opportunities: sorted.filter((r) => ['medium', 'low'].includes(r.priority) && r.module !== 'competitors'),
    risks: sorted.filter((r) => ['critical', 'high'].includes(r.priority) || r.module === 'competitors'),
    nextActions: sorted.slice(0, 10),
    ceoReport,
  };

  return report;
}

export type { NiosModuleReport, NiosRecommendation, NiosReport };
