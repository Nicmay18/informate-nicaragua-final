import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getLatestNews } from '@/lib/db/homepage';
import { getPortadaConfig } from '@/lib/portada/config-service';
import { PORTADA_SECTIONS } from '@/lib/portada/helpers';
import {
  analyzePortada,
  getLatestAnalysis,
  getStrategyConfig,
  setStrategyConfig,
} from '@/lib/meni/portada-intel';
import type { Noticia } from '@/lib/types';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminOrCleanupToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

/**
 * GET — Obtener análisis de portada
 * ?force=1 para refrescar
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === '1';
    const db = getAdminDb();

    if (searchParams.get('action') === 'config') {
      const config = await getStrategyConfig(db);
      return NextResponse.json({ success: true, config });
    }

    const analysis = await getLatestAnalysis(db, force);

    if (!analysis) {
      return NextResponse.json({
        success: true,
        message: 'No hay análisis de portada aún. Usa POST para ejecutar el primero.',
        analysis: null,
      });
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('[portada-intel GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}

/**
 * POST — Ejecutar análisis de portada
 * Body: { portadaArticles?: Noticia[], allArticles?: Noticia[] } (opcional, se auto-detecta si no se provee)
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const db = getAdminDb();

    // Obtener artículos de portada desde la config guardada
    const [allNews, portadaConfig] = await Promise.all([
      getLatestNews(120),
      getPortadaConfig(),
    ]);

    let portadaArticles: Noticia[] = [];

    if (portadaConfig) {
      // Extraer artículos que están en secciones visibles de la portada
      const visibleSections = PORTADA_SECTIONS.filter((s) => s !== 'ocultas');
      for (const section of visibleSections) {
        const slugs = portadaConfig.sections[section]?.map((s) => s.slug) || [];
        const articles = allNews.filter((n) => slugs.includes(n.slug || n.id));
        portadaArticles.push(...articles);
      }
    } else {
      // Sin config: usar los más recientes como portada por defecto
      portadaArticles = allNews.slice(0, 15);
    }

    // Si el body provee artículos, usar esos
    if (body.portadaArticles && Array.isArray(body.portadaArticles)) {
      portadaArticles = body.portadaArticles;
    }
    const allArticles = body.allArticles && Array.isArray(body.allArticles) ? body.allArticles : allNews;

    const configOverride: Record<string, unknown> = {};
    if (typeof body.maxArticlesPerCategory === 'number') configOverride.maxArticlesPerCategory = body.maxArticlesPerCategory;
    if (typeof body.maxArticlesPerAuthor === 'number') configOverride.maxArticlesPerAuthor = body.maxArticlesPerAuthor;
    if (typeof body.freshnessThresholdHours === 'number') configOverride.freshnessThresholdHours = body.freshnessThresholdHours;

    const analysis = await analyzePortada(db, portadaArticles, allArticles, configOverride);

    return NextResponse.json({
      success: true,
      analysis,
      message: `Análisis completado: ${analysis.totalArticles} artículos, balance ${analysis.balance.balanceScore}/100 (${analysis.balance.estado}), ${analysis.suggestions.length} sugerencias.`,
    });
  } catch (error) {
    console.error('[portada-intel POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}

/**
 * PUT — Actualizar configuración de estrategia
 */
export async function PUT(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const db = getAdminDb();

    const configUpdate: Record<string, unknown> = {};
    if (body.targetCategoryDistribution) configUpdate.targetCategoryDistribution = body.targetCategoryDistribution;
    if (typeof body.maxArticlesPerAuthor === 'number') configUpdate.maxArticlesPerAuthor = body.maxArticlesPerAuthor;
    if (typeof body.maxArticlesPerCategory === 'number') configUpdate.maxArticlesPerCategory = body.maxArticlesPerCategory;
    if (typeof body.freshnessThresholdHours === 'number') configUpdate.freshnessThresholdHours = body.freshnessThresholdHours;
    if (typeof body.enableAutoSuggestions === 'boolean') configUpdate.enableAutoSuggestions = body.enableAutoSuggestions;
    if (body.balanceWeights) configUpdate.balanceWeights = body.balanceWeights;

    await setStrategyConfig(db, configUpdate);

    return NextResponse.json({ success: true, message: 'Configuración de estrategia actualizada.' });
  } catch (error) {
    console.error('[portada-intel PUT] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
