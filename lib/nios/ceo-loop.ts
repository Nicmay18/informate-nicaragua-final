/**
 * NIOS CEO Loop
 * =============
 * Ciclo operativo completo:
 *   OBSERVE → DIAGNOSE → DECIDE → PLAN → EXECUTE → VERIFY → LEARN → MEMORY
 *
 * No inventa datos. No ejecuta sin verificar. Persiste cada ciclo en nios_memory.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { runAutonomousRepair, type NiosRepairEngineResult, type NiosRepairRecord } from './repair-engine';
import { recordCeoLoopRun, trackRecommendation, type CEOLoopRecord } from './ceo-memory';
import { decide, type CeoDecision } from './ceo-decision-engine';
import { observeCeoInputs, type CeoObservatoryResult } from './ceo-observatory';
import {
  getCeoAction,
  determineExecutionMode,
  scorePriority,
  labelPriority,
  type CeoEnrichedDecision,
} from './ceo-action-registry';
import { calculateLearningBoost, loadCeoLearningPatterns, type CeoLearningPattern } from './ceo-learning';
import { processOperationalConflicts, loadNoticiasAsInputs } from './operational-loop';
import type { NiosExecutiveData } from './executive-center';
import { logger } from '@/lib/logger';

export interface CEOLoopResult {
  record: CEOLoopRecord;
  autonomy: {
    score: number;
    max: number;
    report: Record<string, 'REAL' | 'PARTIAL' | 'DEAD'>;
  };
}

function formatImpact(record: NiosRepairRecord): string {
  if (record.repairId === 'nios-snapshot-inconsistent') {
    const before = (record.before?.snapshotCount as number) ?? 0;
    const after = (record.after?.snapshotCount as number) ?? 0;
    const delta = after - before;
    return `snapshot: ${after} (${delta >= 0 ? '+' : ''}${delta}) — ${record.verification}`;
  }
  if (record.repairId === 'nios-cache-refresh') {
    return `cache invalidated at ${record.after?.invalidatedAt ?? 'unknown'} — ${record.verification}`;
  }
  return `${record.status}: ${record.verification}`;
}

interface AutonomyInput {
  observations: CEOLoopRecord['observations'];
  diagnoses: CEOLoopRecord['diagnoses'];
  decisions: CeoDecision[];
  executions: CEOLoopRecord['executions'];
  failedRepairs: number;
  verifications: CEOLoopRecord['verifications'];
  learnings: CEOLoopRecord['learnings'];
  memoryRecorded: boolean;
  trigger: string;
}

function calculateAutonomy(input: AutonomyInput) {
  const report: Record<string, 'REAL' | 'PARTIAL' | 'DEAD'> = {
    OBSERVE: input.observations.length > 0 ? 'REAL' : 'DEAD',
    DIAGNOSE: input.diagnoses.length > 0 ? 'REAL' : 'DEAD',
    DECIDE: input.decisions.length > 0 ? 'REAL' : 'DEAD',
    EXECUTE: input.executions.length + input.failedRepairs > 0 ? 'REAL' : 'DEAD',
    VERIFY:
      input.verifications.length > 0
        ? input.verifications.some((v) => v.verified)
          ? 'REAL'
          : 'PARTIAL'
        : 'DEAD',
    LEARN: input.learnings.length > 0 ? 'REAL' : 'DEAD',
    MEMORY: input.memoryRecorded ? 'REAL' : 'DEAD',
    CRON: ['cron/nios-collect', 'cron/supervisor-watch'].includes(input.trigger) ? 'REAL' : 'DEAD',
  };

  const score = Object.values(report).filter((v) => v === 'REAL').length;
  return { score, max: 8, report };
}

export async function runCEOLoop(db: Firestore, trigger = 'cron/nios-collect'): Promise<CEOLoopResult> {
  const startedAt = new Date().toISOString();
  let repair: NiosRepairEngineResult | null = null;
  let repairError: string | null = null;
  let status: CEOLoopRecord['status'] = 'COMPLETE';

  // OBSERVE
  let observatory: CeoObservatoryResult;
  try {
    observatory = await observeCeoInputs(db);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[ceo-loop] observeCeoInputs failed:', err);
    observatory = {
      inputs: [],
      commandCenter: null,
      snapshotDate: null,
      articlesFused: [],
      gsc: null,
      ga4: null,
      trafficArticles: 0,
      totalViews24h: 0,
      errors: [message],
    };
  }

  // LEARN (memoria previa)
  let learningPatterns: CeoLearningPattern[] = [];
  try {
    learningPatterns = await loadCeoLearningPatterns(db, 50);
  } catch (err) {
    logger.error('[ceo-loop] loadCeoLearningPatterns failed:', err);
    learningPatterns = [];
  }

  // DIAGNOSE / PLAN técnicos
  try {
    repair = await runAutonomousRepair({ db, gsc: observatory.gsc, ga4: observatory.ga4 });
    if (repair.failedRepairs.length > 0) status = 'PARTIAL';
  } catch (err) {
    repairError = err instanceof Error ? err.message : String(err);
    status = 'FAILED';
    logger.error('[ceo-loop] runAutonomousRepair failed:', err);
  }

  const repairActions = repair?.actions ?? [];
  const noticiasCount =
    (repair?.report.snapshotConsistency?.dashboardCount as number) ?? observatory.articlesFused.length;

  // Observaciones y decisiones técnicas
  const technicalObservations: CEOLoopRecord['observations'] = repairActions.map((a) => ({
    source: a.source,
    status: a.diagnostic.status,
    note: a.diagnostic.cause,
    dataAgeHours: a.diagnostic.dataAgeHours ?? null,
  }));

  const technicalDiagnoses: CEOLoopRecord['diagnoses'] = repairActions.map((a) => ({
    id: a.id,
    source: a.source,
    severity: a.severity,
    status: a.diagnostic.status,
    problem: a.diagnostic.problem,
    expectedResult: a.diagnostic.expectedResult,
  }));

  const technicalDecisions: CeoDecision[] = repairActions.map((a) => decide(a.diagnostic, { noticiasCount }));

  // DECIDE negocio
  const businessObservations: CEOLoopRecord['observations'] = observatory.inputs.map((i) => ({
    source: i.domain,
    status: i.suggestedActionId === 'no-action-healthy' ? 'REAL' : 'ACTION_REQUIRED',
    note: i.reason,
    dataAgeHours: 0,
  }));

  const businessDiagnoses: CEOLoopRecord['diagnoses'] = observatory.inputs.map((i) => ({
    id: i.id,
    source: i.domain,
    severity: i.priority === 'P0' ? 'critical' : i.priority === 'P1' ? 'high' : i.priority === 'P2' ? 'medium' : 'low',
    status: i.suggestedActionId === 'no-action-healthy' ? 'REAL' : 'ACTION_REQUIRED',
    problem: i.reason,
    expectedResult: i.expectedImpact,
  }));

  const businessDecisions: CeoDecision[] = [];
  const businessEnriched: CeoEnrichedDecision[] = [];
  for (const input of observatory.inputs) {
    const action = getCeoAction(input.suggestedActionId) ?? getCeoAction('no-action-insufficient-evidence')!;
    const learningBoost = calculateLearningBoost(input, learningPatterns);
    const score = scorePriority(input, learningBoost);
    const priorityLabel = labelPriority(score);
    const mode = determineExecutionMode(action);

    const decision: CeoDecision = {
      id: input.id,
      source: input.domain,
      problem: input.reason,
      decision: mode,
      priority: score,
      factors: {
        impact: score,
        confidence: 1 - input.risk,
        effort: action.level,
        risk: input.risk,
        urgency: score,
      },
      reason: input.expectedImpact,
      expectedResult: action.verification,
    };

    businessDecisions.push(decision);
    businessEnriched.push({
      ...input,
      priority: score,
      priorityLabel,
      action,
      executionMode: mode,
    });

    // EXECUTE solo acciones autorizadas y seguras; el resto se encola para humano
    if (mode === 'QUEUE_FOR_HUMAN') {
      try {
        await trackRecommendation(input.id, action.title, input.domain);
      } catch (err) {
        logger.error('[ceo-loop] trackRecommendation failed:', err);
      }
    }
  }

  const observations = [...technicalObservations, ...businessObservations];
  const diagnoses = [...technicalDiagnoses, ...businessDiagnoses];
  const decisions: CeoDecision[] = [...technicalDecisions, ...businessDecisions];

  const executions: CEOLoopRecord['executions'] =
    repair?.repaired.map((r) => ({
      id: r.repairId,
      status: r.status,
      verification: r.verification,
    })) ?? [];

  const failures: CEOLoopRecord['failures'] =
    repair?.failedRepairs.map((a) => ({
      id: a.id,
      status: a.status,
      verification: a.diagnostic.problem,
    })) ?? [];

  const verifications: CEOLoopRecord['verifications'] =
    repair?.verification.map((v) => ({
      id: v.id ?? 'unknown',
      before: v.before,
      after: v.after,
      verified: v.verified,
      message: v.message,
    })) ?? [];

  const repaired: CEOLoopRecord['repaired'] =
    repair?.repaired.map((r) => ({
      repairId: r.repairId,
      problem: r.problem,
      action: r.action,
      status: r.status,
      verification: r.verification,
    })) ?? [];

  const repairById = new Map(repair?.repaired.map((r) => [r.repairId, r]));
  const failureById = new Map(repair?.failedRepairs.map((a) => [a.id, a]));
  const businessById = new Map(businessEnriched.map((b) => [b.id, b]));

  // LEARN: transformar cada decisión en un aprendizaje verificable
  const learnings: CEOLoopRecord['learnings'] = decisions.map((d) => {
    const record = repairById.get(d.id);
    if (record) {
      return {
        decisionId: d.id,
        problem: d.problem,
        decision: d.decision,
        before: record.before ?? {},
        after: record.after ?? {},
        impact: formatImpact(record),
        confidence: d.factors.confidence,
        timestamp: record.timestamp,
      };
    }
    const failed = failureById.get(d.id);
    if (failed) {
      return {
        decisionId: d.id,
        problem: d.problem,
        decision: d.decision,
        before: failed.before ?? {},
        after: failed.after ?? {},
        impact: `FAILED: ${d.reason}`,
        confidence: d.factors.confidence,
        timestamp: new Date().toISOString(),
      };
    }
    const business = businessById.get(d.id);
    if (business) {
      return {
        decisionId: d.id,
        problem: d.problem,
        decision: d.decision,
        before: { input: business },
        after: { action: business.action.id, mode: business.executionMode },
        impact:
          business.executionMode === 'AUTO_EXECUTE'
            ? `Auto-executed: ${business.action.title}`
            : business.executionMode === 'QUEUE_FOR_HUMAN'
              ? `Queued for human: ${business.action.title}`
              : business.executionMode,
        confidence: d.factors.confidence,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      decisionId: d.id,
      problem: d.problem,
      decision: d.decision,
      before: {},
      after: {},
      impact: `${d.decision}: ${d.reason}`,
      confidence: d.factors.confidence,
      timestamp: new Date().toISOString(),
    };
  });

  const businessQueues = businessEnriched.filter((b) => b.executionMode === 'QUEUE_FOR_HUMAN');
  const businessActions = businessQueues.map((b) => `${b.action.title} (${b.id})`);
  const autoActions = repair?.repaired.map((r) => r.repairId) ?? [];
  const summaryParts: string[] = [];
  if (autoActions.length > 0) summaryParts.push(`Reparaciones: ${autoActions.join(', ')}.`);
  if (businessActions.length > 0) summaryParts.push(`Tareas para humano: ${businessActions.length}.`);
  if (summaryParts.length === 0) summaryParts.push('Sin acciones requeridas.');
  const summary = repair?.summary
    ? `${repair.summary} | ${summaryParts.join(' ')}`
    : summaryParts.join(' ');

  const loopRecord: Omit<CEOLoopRecord, 'id' | 'kind'> = {
    timestamp: new Date().toISOString(),
    startedAt,
    finishedAt: new Date().toISOString(),
    mode: repair?.mode ?? 'OBSERVING',
    trigger,
    autonomyScore: 0,
    observations,
    diagnoses,
    decisions,
    actions: executions,
    executions,
    verifications,
    failures,
    learnings,
    repaired,
    pendingHuman: businessQueues.length + (repair?.pendingHuman.length ?? 0),
    failedRepairs: repair?.failedRepairs.length ?? 0,
    skipped: repair?.skipped.length ?? 0,
    summary,
    report: repair ? (repair.report as unknown as Record<string, unknown>) : { error: repairError },
    status,
  };

  // Enriquecer reporte con señales de negocio
  loopRecord.report = {
    ...(loopRecord.report as Record<string, unknown>),
    businessObservations: businessObservations.length,
    businessDecisions: businessEnriched.length,
    businessQueues: businessQueues.length,
    businessAuto: businessEnriched.filter((b) => b.executionMode === 'AUTO_EXECUTE').length,
    businessBlocked: businessEnriched.filter((b) => b.executionMode === 'BLOCKED').length,
    trafficArticles: observatory.trafficArticles,
    totalViews24h: observatory.totalViews24h,
    snapshotDate: observatory.snapshotDate,
    learningPatterns: learningPatterns.length,
  };

  // OPERATIONAL LOOP: cerrar ciclo con incidentes, jobs, aprobaciones y memoria
  try {
    const noticias = await loadNoticiasAsInputs(db, 3);
    const niosForConflicts = {
      gsc: observatory.gsc,
      ga4: observatory.ga4,
      articlesCount: noticias.length,
    } as unknown as NiosExecutiveData;

    const operational = await processOperationalConflicts(
      db,
      { nios: niosForConflicts, loop: loopRecord as unknown as CEOLoopRecord, noticias },
      { executeNow: false },
    );

    loopRecord.report = {
      ...(loopRecord.report as Record<string, unknown>),
      operational,
    };
  } catch (err) {
    logger.error('[ceo-loop] processOperationalConflicts failed:', err);
    loopRecord.report = {
      ...(loopRecord.report as Record<string, unknown>),
      operationalError: err instanceof Error ? err.message : String(err),
    };
  }

  // MEMORY
  let id = '';
  let memoryRecorded = false;
  try {
    id = await recordCeoLoopRun(loopRecord);
    memoryRecorded = true;
  } catch (err) {
    logger.error('[ceo-loop] recordCeoLoopRun failed:', err);
  }

  const autonomy = calculateAutonomy({
    observations,
    diagnoses,
    decisions,
    executions,
    failedRepairs: loopRecord.failedRepairs,
    verifications,
    learnings,
    memoryRecorded,
    trigger,
  });

  const record: CEOLoopRecord = {
    ...loopRecord,
    id,
    kind: 'ceo_loop',
    autonomyScore: autonomy.score,
  };

  return { record, autonomy };
}
