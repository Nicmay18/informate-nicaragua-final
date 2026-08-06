import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { runNIOSPipeline, NIOS_CONFIG } from '@/lib/nios/intelligence/orchestrator';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-token') || request.headers.get('x-admin-key');
  const cronSecret = request.headers.get('x-cron-secret');
  const expected = process.env.ADMIN_API_KEY || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  const expectedCron = process.env.CRON_SECRET;
  if (expected && key === expected) return true;
  if (expectedCron && cronSecret === expectedCron) return true;
  return false;
}

/**
 * POST — Ejecuta el pipeline completo de NIOS Intelligence Platform.
 * Diseñado para cron diario (Vercel Cron, GitHub Actions, etc).
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const config = {
      ...NIOS_CONFIG,
      siteUrl: body.siteUrl || NIOS_CONFIG.siteUrl,
      ga4PropertyId: body.ga4PropertyId || NIOS_CONFIG.ga4PropertyId,
      daysToCollect: body.daysToCollect || NIOS_CONFIG.daysToCollect,
    };

    const db = getAdminDb();
    const result = await runNIOSPipeline(db, config);

    return NextResponse.json({
      success: result.success,
      result,
      message: result.summary,
    });
  } catch (error) {
    console.error('[nios-collect POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}

/**
 * GET — Estado del pipeline (sin ejecutar).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const { getHistoricalDataDays, getLatestSnapshot } = await import('@/lib/nios/intelligence/store');

    const [days, latest] = await Promise.all([
      getHistoricalDataDays(db),
      getLatestSnapshot(db),
    ]);

    return NextResponse.json({
      success: true,
      config: {
        siteUrl: NIOS_CONFIG.siteUrl,
        ga4PropertyId: NIOS_CONFIG.ga4PropertyId ? '***configured***' : 'NOT_CONFIGURED',
        daysToCollect: NIOS_CONFIG.daysToCollect,
      },
      historicalDays: days,
      latestSnapshotDate: latest?.date || null,
      latestGscCollected: !!latest?.gsc,
      latestGa4Collected: !!latest?.ga4,
      latestArticlesAnalyzed: latest?.articlesFused?.length || 0,
      latestRecommendations: latest?.recommendations?.length || 0,
    });
  } catch (error) {
    console.error('[nios-collect GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
