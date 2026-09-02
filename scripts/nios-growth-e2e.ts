/**
 * NIOS v5 — Growth E2E Probe
 * ===========================
 * Flujo completo con datos reales:
 *   snapshot real → oportunidades → PLAN DE HOY → preparar acción (baseline)
 *   → aprobar → ejecutar (SAFE) → medir (AFTER + learning) → verificar Firestore.
 *
 * Uso: npx tsx scripts/nios-growth-e2e.ts
 */

import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });

import { getAdminDb } from '@/lib/firebase-admin';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';
import { buildGrowthEngineResult } from '@/lib/nios/growth/engine';
import {
  prepareGrowthAction,
  approveGrowthAction,
  runGrowthAction,
  measureGrowthAction,
  buildMetricsFromSnapshot,
} from '@/lib/nios/growth/store';

function iso() {
  return new Date().toISOString();
}

function log(stage: string, event: string, payload: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ t: iso(), stage, event, ...payload }));
}

async function main() {
  log('growth-e2e', 'START');

  const db = getAdminDb();
  const snapshot = await getLatestSnapshot(db);
  if (!snapshot) {
    log('growth-e2e', 'FATAL', { error: 'No hay snapshot en Firestore. Ejecuta primero el pipeline NIOS.' });
    process.exit(1);
  }

  const articles = snapshot.articlesFused || [];
  log('growth-e2e', 'SNAPSHOT', {
    date: snapshot.date,
    articles: articles.length,
    gscStatus: snapshot.gsc?.status,
    ga4Status: snapshot.ga4?.status,
    withGsc: articles.filter((a) => a.hasGscData).length,
    withGa4: articles.filter((a) => a.hasGa4Data).length,
  });

  // 1. Detección de oportunidades reales
  const growth = buildGrowthEngineResult(
    snapshot,
    articles,
    snapshot.gsc || null,
    snapshot.ga4 || null,
    snapshot.trust || null,
    snapshot.learningPatterns || [],
  );

  log('growth-e2e', 'OPPORTUNITIES', {
    total: growth.opportunities.length,
    byCategory: growth.opportunities.reduce<Record<string, number>>((acc, o) => {
      acc[o.category] = (acc[o.category] || 0) + 1;
      return acc;
    }, {}),
    top3: growth.opportunities.slice(0, 3).map((o) => ({
      kind: o.kind,
      headline: o.headline,
      impact: o.impact,
      confidence: o.confidence,
      evidence: o.evidence,
    })),
  });

  // 2. PLAN DE HOY (≤5)
  log('growth-e2e', 'PLAN_DE_HOY', {
    items: growth.plan.map((p) => ({
      rank: p.rank,
      title: p.title,
      actionId: p.actionId,
      requiresApproval: p.requiresApproval,
      impact: p.impact,
      confidence: p.confidence,
      metric: p.metric,
      deadline: p.deadline,
    })),
    speaks: growth.speaks,
  });

  // 3. Preparar acción para la primera oportunidad con slug real
  const target = growth.plan.find((p) => p.opportunity.target.slug);
  if (!target) {
    log('growth-e2e', 'END', { ok: true, note: 'Sin oportunidad con slug real; no se preparó acción.' });
    return;
  }

  const baseline = buildMetricsFromSnapshot(target.opportunity.target.slug!, snapshot);
  if (!baseline) {
    log('growth-e2e', 'FATAL', { error: 'No hay baseline real para el slug seleccionado.' });
    process.exit(1);
  }

  log('growth-e2e', 'BASELINE', { slug: target.opportunity.target.slug, baseline });

  const prepared = await prepareGrowthAction(db, target.opportunity, baseline, 'e2e-probe');
  log('growth-e2e', 'PREPARED', { actionId: prepared.id, status: prepared.status, payload: prepared.payload });

  // 4. Aprobar
  const approved = await approveGrowthAction(db, prepared.id);
  log('growth-e2e', 'APPROVED', { actionId: approved?.id, status: approved?.status, approvedAt: approved?.approvedAt });

  // 5. Ejecutar (SAFE)
  const executed = await runGrowthAction(db, prepared.id);
  log('growth-e2e', 'EXECUTED', { actionId: executed?.id, status: executed?.status, executedAt: executed?.executedAt });

  // 6. Medir (AFTER + learning). Con el mismo snapshot esperamos INCONCLUSIVE (sin cambio real).
  const measured = await measureGrowthAction(db, prepared.id, snapshot);
  log('growth-e2e', 'MEASURED', {
    actionId: measured?.id,
    status: measured?.status,
    result: measured?.learning?.result,
    trend: measured?.learning?.trend,
    learning: measured?.learning?.learning,
    absoluteChange: measured?.learning?.absoluteChange,
  });

  // 7. Verificar persistencia en Firestore
  const doc = await db.collection('nios_actions').doc(prepared.id).get();
  const data = doc.data();
  log('growth-e2e', 'FIRESTORE_VERIFY', {
    exists: doc.exists,
    hasBaseline: !!data?.baseline,
    hasAfter: !!data?.after,
    hasLearning: !!data?.learning,
    status: data?.status,
  });

  log('growth-e2e', 'END', {
    ok: doc.exists && !!data?.baseline && !!data?.after && !!data?.learning,
    actionId: prepared.id,
  });
}

main().catch((err) => {
  console.error(JSON.stringify({ t: iso(), stage: 'growth-e2e', event: 'FATAL', error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
