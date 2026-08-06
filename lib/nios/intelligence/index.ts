/**
 * NIOS Intelligence Platform v1.0 — Barrel Export
 * ================================================
 * Punto de entrada único para el sistema de inteligencia editorial.
 */

export * from './types';
export { collectGSC } from './gsc-collector';
export { collectGA4 } from './ga4-collector';
export { mergeArticleData, loadNoticiasFromFirestore } from './data-merger';
export { generateRecommendations } from './editorial-rules';
export { generateComplianceReport } from './compliance';
export { generateReadinessReport } from './readiness';
export { buildGoogleIntelligenceDashboard } from './dashboard';
export { generateGoogleTrustReport, generateThinContentReport } from './google-trust';
export { generateAdSenseRecoveryReport } from './adsense-recovery';
export { generateLearningPatterns, saveLearningPatterns, getLearningPatterns, summarizeLearningPatterns } from './google-feedback';
export { generateWeeklyReport } from './weekly-report';
export { generateContentRecoveryReport, calculateRecoveryScore } from './content-recovery';
export { generateAdSenseTrustCheck } from './adsense-trust-check';
export { generateImprovementRecommendations } from './content-improvement';
export { generateAdSenseRecoveryFullReport } from './adsense-recovery-report';
export { generateContentOpportunityReport } from './opportunity-engine';
export { generateCategoryIntelligence } from './category-intelligence';
export { generateContentMixReport } from './content-mix-intelligence';
export { generateArticleUpdateReport } from './update-engine';
export { generateEditorCEOReport } from './editor-ceo-report';
export { generateMeniLearningFeedback } from './meni-learning';
export { saveDailySnapshot, getLatestSnapshot, getHistoricalSnapshots, getSnapshotByDate, getHistoricalDataDays } from './store';
export { runNIOSPipeline, NIOS_CONFIG } from './orchestrator';
export type { NIOSRunResult } from './orchestrator';
