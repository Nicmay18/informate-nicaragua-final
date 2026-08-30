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
import { recordCeoLoopRun, type CEOLoopRecord } from './ceo-memory';
import { decide, type CeoDecision } from './ceo-decision-engine';
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

  try {
    repair = await runAutonomousRepair({ db, gsc: null, ga4: null });
    if (repair.failedRepairs.length > 0) status = 'PARTIAL';
  } catch (err) {
    repairError = err instanceof Error ? err.message : String(err);
    status = 'FAILED';
    logger.error('[ceo-loop] runAutonomousRepair failed:', err);
  }

  const actions = repair?.actions ?? [];
  const noticiasCount = (repair?.report.snapshotConsistency?.dashboardCount as number) ?? 0;

  const diagnoses: CEOLoopRecord['diagnoses'] = actions.map((a) => ({
    id: a.id,
    source: a.source,
    severity: a.severity,
    status: a.diagnostic.status,
    problem: a.diagnostic.problem,
    expectedResult: a.diagnostic.expectedResult,
  }));

  const observations: CEOLoopRecord['observations'] = actions.map((a) => ({
    source: a.source,
    status: a.diagnostic.status,
    note: a.diagnostic.cause,
    dataAgeHours: a.diagnostic.dataAgeHours ?? null,
  }));

  const decisions: CeoDecision[] = actions.map((a) => decide(a.diagnostic, { noticiasCount }));

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

  const summary = repair?.summary ?? `CEO loop failed: ${repairError}`;

  const loopRecord: Omit<CEOLoopRecord, 'id' | 'kind'> = {
    timestamp: new Date().toISOString(),
    startedAt,
    finishedAt: new Date().toISOString(),
    mode: repair?.mode ?? 'FAILED',
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
    pendingHuman: repair?.pendingHuman.length ?? 0,
    failedRepairs: repair?.failedRepairs.length ?? 0,
    skipped: repair?.skipped.length ?? 0,
    summary,
    report: repair ? (repair.report as unknown as Record<string, unknown>) : { error: repairError },
    status,
  };

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
