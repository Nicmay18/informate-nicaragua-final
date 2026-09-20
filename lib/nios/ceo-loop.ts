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

export type AutonomyStageStatus = 'VERIFIED' | 'PARCIAL' | 'SIN_EVIDENCIA';

export interface CEOLoopResult {
  record: CEOLoopRecord;
  autonomy: {
    score: number;
    max: number;
    report: Record<string, AutonomyStageStatus>;
    evidence: Record<string, string>;
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

interface AutonomyVerification {
  score: number;
  max: number;
  report: Record<string, AutonomyStageStatus>;
  evidence: Record<string, string>;
}

function cronComponentForTrigger(trigger: string): string | null {
  const map: Record<string, string> = {
    'cron/nios-collect': 'cron/api/cron/nios-collect',
    'cron/nios-ceo-loop': 'cron/api/cron/nios-ceo-loop',
    'cron/supervisor-watch': 'cron/api/cron/supervisor-watch',
  };
  if (map[trigger]) return map[trigger];
  if (trigger.startsWith('/api/cron/')) return `cron${trigger}`;
  return null;
}

/**
 * Verificación independiente de autonomía.
 * Un estado VERIFIED depende de evidencia observable desde fuera del
 * componente evaluado: el registro persistido se relee (read-back), el
 * snapshot lo escribió el pipeline y el heartbeat lo escribe la ruta cron.
 * Si la evidencia no existe, el estado es SIN_EVIDENCIA — nunca se infiere
 * del auto-reporte del propio loop.
 */
async function verifyAutonomyEvidence(
  db: Firestore,
  ctx: { recordId: string | null; observatory: CeoObservatoryResult; trigger: string },
): Promise<AutonomyVerification> {
  const report: Record<string, AutonomyStageStatus> = {};
  const evidence: Record<string, string> = {};
  const set = (stage: string, status: AutonomyStageStatus, why: string) => {
    report[stage] = status;
    evidence[stage] = why;
  };

  // Persistencia: read-back del registro (fuente externa de verdad)
  let persisted: CEOLoopRecord | null = null;
  if (ctx.recordId) {
    try {
      const doc = await db.collection('nios_memory').doc(ctx.recordId).get();
      if (doc.exists) persisted = doc.data() as CEOLoopRecord;
    } catch (err) {
      logger.error('[ceo-loop] verifyAutonomy: read-back de memoria falló:', err);
    }
  }
  set(
    'MEMORY',
    persisted ? 'VERIFIED' : 'SIN_EVIDENCIA',
    persisted
      ? `registro ${ctx.recordId} legible en nios_memory`
      : 'registro del ciclo no encontrado al releer nios_memory',
  );

  // OBSERVE: snapshot persistido por el pipeline (no por este loop)
  const snapDate = ctx.observatory.snapshotDate;
  if (!snapDate) {
    set('OBSERVE', 'SIN_EVIDENCIA', 'observatory no produjo snapshotDate');
  } else {
    try {
      const doc = await db.collection('nios_daily_snapshots').doc(snapDate).get();
      set(
        'OBSERVE',
        doc.exists ? 'VERIFIED' : 'SIN_EVIDENCIA',
        doc.exists
          ? `snapshot ${snapDate} existe en nios_daily_snapshots`
          : `snapshot ${snapDate} no existe en nios_daily_snapshots`,
      );
    } catch (err) {
      logger.error('[ceo-loop] verifyAutonomy: lectura de snapshot falló:', err);
      set('OBSERVE', 'SIN_EVIDENCIA', 'error leyendo nios_daily_snapshots');
    }
  }

  // DIAGNOSE / DECIDE / EXECUTE / VERIFY / LEARN: leídos del documento
  // persistido, no de los arrays en memoria del propio loop.
  if (persisted) {
    set('DIAGNOSE', persisted.diagnoses.length > 0 ? 'VERIFIED' : 'SIN_EVIDENCIA',
      `${persisted.diagnoses.length} diagnósticos persistidos`);
    set('DECIDE', persisted.decisions.length > 0 ? 'VERIFIED' : 'SIN_EVIDENCIA',
      `${persisted.decisions.length} decisiones persistidas`);
    const verifiedExec = persisted.executions.filter((e) => e.status === 'VERIFIED').length;
    set('EXECUTE',
      persisted.executions.length === 0 ? 'SIN_EVIDENCIA' : verifiedExec > 0 ? 'VERIFIED' : 'PARCIAL',
      `${persisted.executions.length} ejecuciones persistidas, ${verifiedExec} con estado VERIFIED`);
    const confirmed = persisted.verifications.filter((v) => v.verified).length;
    set('VERIFY',
      persisted.verifications.length === 0 ? 'SIN_EVIDENCIA' : confirmed > 0 ? 'VERIFIED' : 'PARCIAL',
      `${persisted.verifications.length} verificaciones persistidas, ${confirmed} confirmadas`);
    set('LEARN', persisted.learnings.length > 0 ? 'VERIFIED' : 'SIN_EVIDENCIA',
      `${persisted.learnings.length} aprendizajes persistidos`);
  } else {
    for (const stage of ['DIAGNOSE', 'DECIDE', 'EXECUTE', 'VERIFY', 'LEARN']) {
      set(stage, 'SIN_EVIDENCIA', 'registro del ciclo no persistido');
    }
  }

  // CRON: heartbeat escrito por la ruta cron (artefacto externo al loop)
  const component = cronComponentForTrigger(ctx.trigger);
  if (!component) {
    set('CRON', 'SIN_EVIDENCIA', `trigger "${ctx.trigger}" sin heartbeat asociado`);
  } else {
    try {
      const snap = await db.collection('depto_heartbeat').where('component', '==', component).limit(1).get();
      const hb = snap.empty ? null : (snap.docs[0].data() as { lastRunAt?: string });
      if (!hb?.lastRunAt) {
        set('CRON', 'SIN_EVIDENCIA', `sin heartbeat para ${component}`);
      } else {
        const ageH = (Date.now() - Date.parse(hb.lastRunAt)) / 36e5;
        set('CRON', ageH <= 30 ? 'VERIFIED' : 'PARCIAL',
          `heartbeat ${component} lastRunAt=${hb.lastRunAt} (~${Math.round(ageH)}h)`);
      }
    } catch (err) {
      logger.error('[ceo-loop] verifyAutonomy: lectura de heartbeat falló:', err);
      set('CRON', 'SIN_EVIDENCIA', 'error leyendo depto_heartbeat');
    }
  }

  const score = Object.values(report).filter((v) => v === 'VERIFIED').length;
  return { score, max: 8, report, evidence };
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

  // Persistir → read-back → verificación independiente de autonomía.
  // El score ya no se auto-declara: cada etapa se verifica leyendo
  // evidencia persistida fuera del propio componente.
  let id = '';
  try {
    id = await recordCeoLoopRun({ ...loopRecord, autonomyScore: 0 });
  } catch (err) {
    logger.error('[ceo-loop] recordCeoLoopRun failed:', err);
  }

  const autonomy = await verifyAutonomyEvidence(db, {
    recordId: id || null,
    observatory,
    trigger,
  });

  if (id) {
    try {
      await db.collection('nios_memory').doc(id).update({
        autonomyScore: autonomy.score,
        autonomyReport: autonomy.report,
        autonomyEvidence: autonomy.evidence,
      });
    } catch (err) {
      logger.error('[ceo-loop] persist autonomy evidence failed:', err);
    }
  }

  const record: CEOLoopRecord = {
    ...loopRecord,
    id,
    kind: 'ceo_loop',
    autonomyScore: autonomy.score,
  };

  return { record, autonomy };
}
