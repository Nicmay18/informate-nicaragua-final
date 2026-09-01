#!/usr/bin/env tsx
/**
 * R4 — NIOS CEO Runtime Runner
 *
 * No inventa credenciales. No declara éxito. No expone secretos.
 * Carga .env.local, valida variables, ejecuta los 10 stages y loguea:
 *   timestamp, INPUT, OUTPUT, SIDE_EFFECT, VERIFICATION, ERROR.
 *
 * Uso:
 *   npx tsx scripts/nios-ceo-r4-runner.ts
 *   npx tsx scripts/nios-ceo-r4-runner.ts --two-cycles
 */

import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });

import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { checkFirebaseHealth } from '@/lib/nios/intelligence/firebase-health';
import { getTrafficMigrationStatus } from '@/lib/analytics/traffic-reader';
import { collectGscData } from '@/lib/nios/collectors/gsc';
import { collectGa4Data } from '@/lib/nios/collectors/ga4';
import { generateNiosDiagnostics, type NiosDiagnostic } from '@/lib/nios/intelligence/diagnostics';
import { runCEOLoop, type CEOLoopResult } from '@/lib/nios/ceo-loop';
import { getCeoMemory, recordCeoLoopRun } from '@/lib/nios/ceo-memory';
import {
  loadCeoLearningPatterns,
  calculateLearningBoost,
  type CeoLearningPattern,
} from '@/lib/nios/ceo-learning';
import { runAutonomousRepair, type NiosRepairEngineResult } from '@/lib/nios/repair-engine';
import { generateCEODailyBrief } from '@/lib/nios/ceo-daily-brief';
import { getCeoAction, determineExecutionMode, type CeoDecisionInput } from '@/lib/nios/ceo-action-registry';

const TWO_CYCLES = process.argv.includes('--two-cycles');

interface EnvCheck {
  name: string;
  source: string;
  usedBy: string;
  test: string;
}

const FIREBASE_BASE64: EnvCheck = {
  name: 'FIREBASE_SERVICE_ACCOUNT_BASE64',
  source: 'lib/firebase-admin.ts',
  usedBy: 'getAdminApp()',
  test: 'Stage 1 Firebase Admin init (alternativa a triple)',
};

const FIREBASE_TRIPLE: EnvCheck[] = [
  { name: 'FIREBASE_PROJECT_ID', source: 'lib/firebase-admin.ts', usedBy: 'getAdminApp()', test: 'Stage 1 Firebase Admin init' },
  { name: 'FIREBASE_CLIENT_EMAIL', source: 'lib/firebase-admin.ts', usedBy: 'getAdminApp()', test: 'Stage 1 Firebase Admin init' },
  { name: 'FIREBASE_PRIVATE_KEY', source: 'lib/firebase-admin.ts', usedBy: 'getAdminApp()', test: 'Stage 1 Firebase Admin init' },
];

const GSC_GA4: EnvCheck[] = [
  { name: 'NIOS_SITE_URL', source: 'lib/nios/intelligence/orchestrator.ts NIOS_CONFIG', usedBy: 'runNIOSPipeline', test: 'Stage 3 GSC / Stage 6 CEO Loop' },
  { name: 'NIOS_GSC_SITE_URL', source: 'lib/nios/intelligence/orchestrator.ts NIOS_CONFIG', usedBy: 'runNIOSPipeline', test: 'Stage 3 GSC' },
  { name: 'NIOS_GA4_PROPERTY_ID', source: 'lib/nios/collectors/ga4.ts', usedBy: 'collectGa4Data', test: 'Stage 4 GA4' },
];

const ADSENSE: EnvCheck[] = [
  { name: 'GOOGLE_ADSENSE_CLIENT_ID', source: 'lib/nios/intelligence/diagnostics.ts', usedBy: 'adSenseDiagnostic', test: 'Stage 5 AdSense' },
];

const CRON_ADMIN: EnvCheck[] = [
  { name: 'CRON_SECRET', source: 'lib/auth.ts', usedBy: 'verifyAdminOrCronToken', test: 'Fase 6 Cron auth' },
  { name: 'CRON_SECRET_TOKEN', source: 'lib/auth.ts', usedBy: 'verifyAdminOrCronToken', test: 'Fase 6 Cron auth' },
  { name: 'ADMIN_API_KEY', source: 'lib/auth.ts', usedBy: 'verifyAdminToken', test: 'Fase 6 Cron admin' },
];

const TRAFFIC: EnvCheck[] = [
  { name: 'NIOS_TRAFFIC_LOG_TTL', source: 'lib/nios/executive-center.ts', usedBy: 'ttlStatus', test: 'Stage 2 Traffic / Fase 6 Cron' },
  { name: 'NIOS_TRAFFIC_LOG_TTL_DAYS', source: 'lib/analytics/traffic-ttl.ts', usedBy: 'trafficLogTTLDays', test: 'Stage 2 Traffic / Fase 6 Cron' },
];

const REQUIRED = [FIREBASE_BASE64, ...FIREBASE_TRIPLE, ...GSC_GA4, ...ADSENSE];
const OPTIONAL = [...CRON_ADMIN, ...TRAFFIC];

function iso() {
  return new Date().toISOString();
}

function logEntry(
  stage: string,
  event: 'START' | 'INPUT' | 'OUTPUT' | 'SIDE_EFFECT' | 'VERIFICATION' | 'ERROR' | 'END',
  payload: Record<string, unknown>,
) {
  console.log(JSON.stringify({ t: iso(), stage, event, ...payload }));
}

function hasValue(v: string | undefined, min = 1) {
  return typeof v === 'string' && v.trim().length >= min;
}

function checkEnv(): { missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];

  const fbBase64 = hasValue(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 10);
  const fbTriple = FIREBASE_TRIPLE.every((e) => hasValue(process.env[e.name]));
  if (!fbBase64 && !fbTriple) {
    missing.push('Firebase: se requiere FIREBASE_SERVICE_ACCOUNT_BASE64 (>=10 chars) o (FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)');
  } else if (fbBase64 && !fbTriple) {
    logEntry('env', 'VERIFICATION', { note: 'Firebase autenticado por base64' });
  } else if (fbTriple) {
    logEntry('env', 'VERIFICATION', { note: 'Firebase autenticado por triple' });
  }

  for (const e of REQUIRED) {
    if (e.name.startsWith('FIREBASE')) continue;
    if (!hasValue(process.env[e.name])) {
      missing.push(`${e.name} | ${e.source} | ${e.usedBy} | ${e.test}`);
    }
  }

  for (const e of OPTIONAL) {
    if (!hasValue(process.env[e.name])) {
      warnings.push(`${e.name} | ${e.source} | ${e.usedBy} | ${e.test}`);
    }
  }

  return { missing, warnings };
}

async function runStage<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  logEntry(name, 'START', {});
  const started = Date.now();
  try {
    const value = await fn();
    const duration = Date.now() - started;
    logEntry(name, 'OUTPUT', { status: 'ok', durationMs: duration });
    return { ok: true, value };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logEntry(name, 'ERROR', { error });
    return { ok: false, error };
  }
}

function summarizeGsc(value: { status: string; siteUrl?: string; errorMessage?: string } | null) {
  return value ? { status: value.status, siteUrl: value.siteUrl, error: value.errorMessage } : null;
}

function summarizeGa4(value: { status: string; propertyId?: string; errorMessage?: string } | null) {
  return value ? { status: value.status, propertyId: value.propertyId, error: value.errorMessage } : null;
}

async function main() {
  const { missing, warnings } = checkEnv();
  if (missing.length) {
    console.error(JSON.stringify({ t: iso(), event: 'MISSING_CREDENTIALS', missing }));
    process.exit(1);
  }
  if (warnings.length) {
    console.warn(JSON.stringify({ t: iso(), event: 'OPTIONAL_CREDENTIALS', warnings }));
  }

  logEntry('r4', 'START', { twoCycles: TWO_CYCLES });

  // 1. Firebase
  const db = getAdminDb();
  logEntry('firebase', 'INPUT', { action: 'getAdminDb()', projectId: process.env.FIREBASE_PROJECT_ID });
  const firebase = await runStage('firebase', () => checkFirebaseHealth());
  if (!firebase.ok) {
    process.exit(1);
  }
  logEntry('firebase', 'VERIFICATION', { status: firebase.value.status, projectId: firebase.value.projectId });

  // 2. Traffic Reader
  const traffic = await runStage('traffic-reader', () => getTrafficMigrationStatus(db));
  if (traffic.ok) {
    logEntry('traffic-reader', 'OUTPUT', { source: traffic.value.dailySource, migrationHealth: traffic.value.migrationHealth });
  }

  // 3. GSC
  const gsc = await runStage('gsc', () => collectGscData({ days: 7 }));
  if (gsc.ok) {
    logEntry('gsc', 'OUTPUT', summarizeGsc(gsc.value));
  }

  // 4. GA4
  const ga4 = await runStage('ga4', () => collectGa4Data({ days: 7 }));
  if (ga4.ok) {
    logEntry('ga4', 'OUTPUT', summarizeGa4(ga4.value));
  }

  // 5. AdSense (diagnostic from generateNiosDiagnostics)
  const adsenseStage = await runStage<NiosDiagnostic | null>('adsense', async () => {
    const diags = generateNiosDiagnostics(gsc.ok ? gsc.value : null, ga4.ok ? ga4.value : null);
    return diags.find((d) => d.source === 'AdSense') ?? null;
  });
  if (adsenseStage.ok && adsenseStage.value) {
    logEntry('adsense', 'OUTPUT', { status: adsenseStage.value.status, variable: adsenseStage.value.variable });
  }

  // 6. CEO Loop
  const ceo = await runStage<CEOLoopResult>('ceo-loop', () => runCEOLoop(db, 'r4/manual/cycle1'));
  if (ceo.ok) {
    logEntry('ceo-loop', 'OUTPUT', { autonomyScore: ceo.value.autonomy.score, mode: ceo.value.record.mode });
  }

  // 7. Memory Write + Read
  let memoryId: string | null = null;
  if (ceo.ok) {
    const write = await runStage<string>('memory-write', () => recordCeoLoopRun(ceo.value.record));
    if (write.ok) {
      memoryId = write.value;
      logEntry('memory', 'SIDE_EFFECT', { docId: memoryId, collection: 'nios_memory' });
    }
    const read = await runStage('memory-read', () => getCeoMemory());
    if (read.ok) {
      logEntry('memory', 'VERIFICATION', { pending: read.value.pending.length, recentDone: read.value.recentDone.length });
    }
  }

  // 8. Learning
  const patterns = await runStage<CeoLearningPattern[]>('learning', () => loadCeoLearningPatterns(db, 100));
  if (patterns.ok) {
    const sample: CeoDecisionInput = {
      id: 'r4-learning-sample',
      domain: 'system',
      priority: 'P0',
      evidence: ['r4-sample'],
      reason: 'r4 sample decision',
      expectedImpact: 'no impact',
      suggestedActionId: 'nios-cache-refresh',
      risk: 0.1,
    };
    const boost = calculateLearningBoost(sample, patterns.value);
    logEntry('learning', 'OUTPUT', { patterns: patterns.value.length, boost });
  }

  // 9. Auto Execution
  const repair = await runStage<NiosRepairEngineResult>('auto-execution', () =>
    runAutonomousRepair({ db, gsc: gsc.ok ? gsc.value : null, ga4: ga4.ok ? ga4.value : null }),
  );
  if (repair.ok) {
    logEntry('auto-execution', 'SIDE_EFFECT', {
      repaired: repair.value.repaired.length,
      pendingHuman: repair.value.pendingHuman.length,
      failedRepairs: repair.value.failedRepairs.length,
    });
    const action = getCeoAction('nios-cache-refresh');
    if (action) {
      const mode = determineExecutionMode(action, {});
      logEntry('auto-execution', 'VERIFICATION', { action: action.id, mode });
    }
  }

  // 10. Daily Brief
  if (ceo.ok) {
    const brief = generateCEODailyBrief(ceo.value);
    logEntry('daily-brief', 'OUTPUT', { overallStatus: brief.overallStatus, points: brief.points.length });
  }

  // Fase 5 — Two cycles
  if (TWO_CYCLES) {
    const cycle2 = await runStage<CEOLoopResult>('cycle2/ceo-loop', () => runCEOLoop(db, 'r4/manual/cycle2'));
    if (cycle2.ok && ceo.ok) {
      const prev = ceo.value.record.decisions.map((d) => d.id);
      const next = cycle2.value.record.decisions.map((d) => d.id);
      const same = prev.filter((id) => next.includes(id));
      const added = next.filter((id) => !prev.includes(id));
      logEntry('cycle2/decision-comparison', 'VERIFICATION', { same: same.length, added: added.length, removed: prev.length - same.length });
    }

    const patterns2 = await runStage<CeoLearningPattern[]>('cycle2/learning', () => loadCeoLearningPatterns(db, 100));
    if (patterns2.ok && patterns.ok) {
      const delta = patterns2.value.length - patterns.value.length;
      logEntry('cycle2/learning-comparison', 'VERIFICATION', { before: patterns.value.length, after: patterns2.value.length, delta });
    }
  }

  logEntry('r4', 'END', { twoCycles: TWO_CYCLES, ok: true });
}

main().catch((err) => {
  console.error(JSON.stringify({ t: iso(), event: 'FATAL', error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
