import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import {
  runLearningCycle,
  getLatestInsights,
  getLearningConfig,
  setLearningConfig,
  invalidateLearningCache,
} from '@/lib/meni/learning-engine';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-token') || request.headers.get('x-admin-key');
  const expected = process.env.ADMIN_API_KEY || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  return !!expected && key === expected;
}

/**
 * POST — Ejecutar un ciclo de aprendizaje
 * Body: { daysToAnalyze?: number, enableWeightTuning?: boolean }
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const db = getAdminDb();

    const configOverride: Record<string, unknown> = {};
    if (typeof body.daysToAnalyze === 'number') configOverride.daysToAnalyze = body.daysToAnalyze;
    if (typeof body.enableWeightTuning === 'boolean') configOverride.enableWeightTuning = body.enableWeightTuning;

    const result = await runLearningCycle(db, configOverride);

    return NextResponse.json({
      success: true,
      result,
      message: `Ciclo completado: ${result.totalArticlesAnalyzed} artículos analizados, ${result.insights.length} insights generados.`,
    });
  } catch (error) {
    console.error('[learning POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}

/**
 * GET — Obtener últimos insights o configuración
 * ?action=config para obtener/actualizar configuración
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'insights';
    const force = searchParams.get('force') === '1';
    const db = getAdminDb();

    if (action === 'config') {
      const config = await getLearningConfig(db);
      return NextResponse.json({ success: true, config });
    }

    const result = await getLatestInsights(db, force);

    if (!result) {
      return NextResponse.json({
        success: true,
        message: 'No hay ciclos de aprendizaje ejecutados aún. Usa POST para ejecutar el primero.',
        result: null,
      });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[learning GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}

/**
 * PUT — Actualizar configuración del Learning Engine
 */
export async function PUT(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const db = getAdminDb();

    const configUpdate: Record<string, unknown> = {};
    if (typeof body.daysToAnalyze === 'number') configUpdate.daysToAnalyze = body.daysToAnalyze;
    if (typeof body.minArticlesForAnalysis === 'number') configUpdate.minArticlesForAnalysis = body.minArticlesForAnalysis;
    if (typeof body.minViewsForInsight === 'number') configUpdate.minViewsForInsight = body.minViewsForInsight;
    if (typeof body.enableWeightTuning === 'boolean') configUpdate.enableWeightTuning = body.enableWeightTuning;

    await setLearningConfig(db, configUpdate);
    invalidateLearningCache();

    return NextResponse.json({ success: true, message: 'Configuración actualizada.' });
  } catch (error) {
    console.error('[learning PUT] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
