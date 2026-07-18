/**
 * Editor IA V4 — Barrel export
 * Import único desde lib/editor-jefe-v4
 */

export { extract } from './extractor';
export { normalize } from './normalizador';
export { check, validateVerdicto } from './consistency-engine';
export { loadProfile, getAvailableCategories } from './profile-loader';
export { evaluate } from './engine';
export { generateExplainability } from './explainability';
export { pipelineV4 } from './pipeline';
export { runParallel } from './parallel-runner';
export type { ParallelResult, ComparacionV3V4 } from './parallel-runner';
export { mapV4ToV3 } from './mapper-v3';
export { consistencyAudit } from './consistency-audit';
export type { ConsistencyAudit } from './consistency-audit';
export { detectCategory } from './category-detector';
export { recordEditorialDecision, getEditorialDecisions, getDecisionsByCategory, getDisagreements, getDisagreementStats, detectErrorPatterns, getModuleContributionStats } from './observatorio';
export type { EditorialDecision } from './observatorio';
export { saveArticleKnowledge, getArticleKnowledge, getKnowledgeByCategory, getKnowledgeByVeredicto, updatePerformanceMetrics, getCategoryStats } from './knowledge-base';
export type { ArticleKnowledge } from './knowledge-base';
export { generateWeeklyAudit, saveWeeklyAudit, getWeeklyAudits } from './auditor-semanal';
export type { WeeklyAuditReport } from './auditor-semanal';
export { calcularMetricas } from './metrics';
export type { MetricasGlobales, MetricasCategoria } from './metrics';
export { auditExplainability, auditRelevanciaCategoria } from './explainability-validator';
export type { ExplainabilityAuditResult } from './explainability-validator';
export { testStability } from './stability-tester';
export type { StabilityResult } from './stability-tester';

export type {
  ArticleEvidence,
  SeoEvidence,
  EeatEvidence,
  DiscoverEvidence,
  AdsenseEvidence,
  ValorEditorialEvidence,
  ForenseEvidence,
  ContextEvidence,
  ChronologyEvidence,
  UtilityEvidence,
  OriginalityEvidence,
  EvidenceSignals,
  FollowUpEvidence,
  SourceEvidence,
  RiskEvidence,
  EvaluationResult,
  NormalizedResults,
  PenalizacionDeduplicada,
  ConsistencyCheck,
  ViolacionConsistencia,
  EditorialProfile,
  ExplainabilityItem,
  ResultadoEditorial,
  ScoreBreakdown,
  VeredictoEditorial,
} from './types';
