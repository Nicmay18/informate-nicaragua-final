/**
 * Editorial Supervisor — Barrel
 * Exporta la API pública del supervisor.
 */

export { evaluateRawTitle, makeEditorialDecision, detectAbandonedArticles, checkMediumHealth, applySafeAutoFixes, runSupervisorWatchCycle, evaluateOperationCost } from './editorial-supervisor';
export { canCallLLM, recordCall, detectWastefulCalls, getConfig, resetHourly } from './cost-guard';
export { auditHomepage } from './homepage-audit';
export type {
  ArticleLifecycleState,
  SupervisorVerdict,
  SupervisorDecision,
  SupervisorIssue,
  SupervisorAction,
  IssueSeverity,
  IssueDomain,
  ActionType,
  ArticleContext,
  MediumHealth,
  HomepageAudit,
  CostGuardStatus,
  CostGuardConfig,
  OperationsPanel,
} from './types';
export { SUPERVISOR_MODEL_VERSION } from './types';
