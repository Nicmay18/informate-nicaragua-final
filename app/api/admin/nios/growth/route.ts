/**
 * NIOS v5 — Growth API
 * =====================
 * GET  → lista oportunidades, PLAN DE HOY y acciones persistidas.
 * POST → { op: 'prepare' | 'approve' | 'run' | 'measure', ... }
 *   - prepare: crea acción PREPARED con baseline real desde el snapshot.
 *   - approve: aprueba una acción PREPARED.
 *   - run:     ejecuta (nivel SAFE) una acción aprobada.
 *   - measure: mide AFTER contra el snapshot más reciente y genera learning.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';
import { buildGrowthEngineResult } from '@/lib/nios/growth/engine';
import {
  prepareGrowthAction,
  approveGrowthAction,
  runGrowthAction,
  measureGrowthAction,
  listGrowthActions,
  buildMetricsFromSnapshot,
} from '@/lib/nios/growth/store';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminOrCleanupToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await getLatestSnapshot(db);
    const articles = snapshot?.articlesFused || [];
    const growth = buildGrowthEngineResult(
      snapshot,
      articles,
      snapshot?.gsc || null,
      snapshot?.ga4 || null,
      snapshot?.trust || null,
      snapshot?.learningPatterns || [],
    );
    const actions = await listGrowthActions(db, { limit: 50 });
    return NextResponse.json({
      success: true,
      snapshotDate: snapshot?.date ?? null,
      opportunities: growth.opportunities,
      plan: growth.plan,
      summary: growth.summary,
      speaks: growth.speaks,
      actions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const op = String(body.op || '');
    const db = getAdminDb();

    if (op === 'prepare') {
      const opportunityId = String(body.opportunityId || '');
      if (!opportunityId) {
        return NextResponse.json({ success: false, error: 'opportunityId requerido' }, { status: 400 });
      }
      const snapshot = await getLatestSnapshot(db);
      const articles = snapshot?.articlesFused || [];
      const growth = buildGrowthEngineResult(
        snapshot,
        articles,
        snapshot?.gsc || null,
        snapshot?.ga4 || null,
        snapshot?.trust || null,
      );
      const opportunity = growth.opportunities.find((o) => o.id === opportunityId)
        // Los IDs incluyen timestamp; permitir matching por prefijo estable (kind+slug/query).
        ?? growth.opportunities.find((o) => opportunityId.startsWith(`growth-${o.kind}-${o.target.slug || o.target.query || o.target.category || 'na'}`));
      if (!opportunity) {
        return NextResponse.json({ success: false, error: 'Oportunidad no encontrada en el snapshot actual' }, { status: 404 });
      }
      const baseline = opportunity.target.slug
        ? buildMetricsFromSnapshot(opportunity.target.slug, snapshot)
        : null;
      if (!baseline) {
        return NextResponse.json({ success: false, error: 'No hay baseline real para esta oportunidad (sin slug o sin datos)' }, { status: 400 });
      }
      const action = await prepareGrowthAction(db, opportunity, baseline, String(body.requestedBy || 'admin'));
      return NextResponse.json({ success: true, action });
    }

    if (op === 'approve') {
      const actionId = String(body.actionId || '');
      if (!actionId) return NextResponse.json({ success: false, error: 'actionId requerido' }, { status: 400 });
      const action = await approveGrowthAction(db, actionId);
      if (!action) return NextResponse.json({ success: false, error: 'Acción no encontrada' }, { status: 404 });
      return NextResponse.json({ success: true, action });
    }

    if (op === 'run') {
      const actionId = String(body.actionId || '');
      if (!actionId) return NextResponse.json({ success: false, error: 'actionId requerido' }, { status: 400 });
      const action = await runGrowthAction(db, actionId);
      if (!action) return NextResponse.json({ success: false, error: 'Acción no encontrada' }, { status: 404 });
      return NextResponse.json({ success: true, action });
    }

    if (op === 'measure') {
      const actionId = String(body.actionId || '');
      if (!actionId) return NextResponse.json({ success: false, error: 'actionId requerido' }, { status: 400 });
      const snapshot = await getLatestSnapshot(db);
      const action = await measureGrowthAction(db, actionId, snapshot);
      if (!action) return NextResponse.json({ success: false, error: 'Acción no encontrada' }, { status: 404 });
      return NextResponse.json({ success: true, action });
    }

    return NextResponse.json({ success: false, error: `Operación desconocida: ${op}` }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
