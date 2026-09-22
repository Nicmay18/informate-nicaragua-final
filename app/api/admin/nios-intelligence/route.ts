import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, must-revalidate' } as const;

function respond(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...NO_STORE_HEADERS, ...(init?.headers ?? {}) },
  });
}

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminOrCleanupToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

/**
 * GET — Obtiene el dashboard de Google Intelligence.
 * ?action=dashboard (default) — Dashboard completo
 * ?action=compliance — Reporte de compliance
 * ?action=readiness — Reporte de AdSense Readiness
 * ?action=trust — Google Trust Audit
 * ?action=adsense-recovery — AdSense Recovery
 * ?action=weekly — NIOS Weekly Intelligence
 * ?action=learning-patterns — Google Learning Patterns
 * ?action=recovery — Content Recovery Queue
 * ?action=adsense-report — AdSense Recovery Full Report
 * ?action=opportunity — Content Opportunity Engine
 * ?action=category-intelligence — Category Intelligence
 * ?action=content-mix — Content Mix Optimizer
 * ?action=update-engine — Article Update Intelligence
 * ?action=editor-strategy — Editor CEO Report
 * ?action=meni-learning — Aprendizaje MENI
 * ?action=history — Snapshots históricos
 * ?action=command-center — NIOS Intelligence Graph
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return respond({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'dashboard';
    const db = getAdminDb();

    if (action === 'history') {
      const { getHistoricalSnapshots } = await import('@/lib/nios/intelligence/store');
      const days = parseInt(searchParams.get('days') || '30', 10);
      const snapshots = await getHistoricalSnapshots(db, days);
      return respond({
        success: true,
        count: snapshots.length,
        snapshots: snapshots.map(s => ({
          date: s.date,
          gscCollected: !!s.gsc,
          ga4Collected: !!s.ga4,
          totalImpressions: s.gsc?.totalImpressions || 0,
          totalClicks: s.gsc?.totalClicks || 0,
          totalUsers: s.ga4?.totalUsers || 0,
          articlesAnalyzed: s.articlesFused?.length || 0,
          recommendations: s.recommendations?.length || 0,
          trustScore: s.trust?.averageGoogleTrustScore || 0,
          highRiskArticles: s.trust?.highRiskArticles || 0,
          recoveryGreenPct: s.contentRecovery?.greenPct || 0,
          recoveryRedPct: s.contentRecovery?.redPct || 0,
          adSenseTrustScore: s.adSenseRecoveryFullReport?.trustCheck.adSenseTrustScore || 0,
          opportunityCount: s.contentOpportunity?.opportunities.length || 0,
          editorCEOGenerated: !!s.editorCEOReport,
          meniLearningGenerated: !!s.meniLearning,
        })),
      });
    }

    if (action === 'command-center') {
      const { buildIntelligenceGraph } = await import('@/lib/nios/command-center/intelligence-graph');
      const articleLimit = parseInt(searchParams.get('limit') || '50', 10);
      const graph = await buildIntelligenceGraph({ articleLimit });
      return respond({ success: true, date: graph.collectedAt, graph });
    }

    const { getLatestSnapshot } = await import('@/lib/nios/intelligence/store');
    const latest = await getLatestSnapshot(db);

    if (!latest) {
      return respond({
        success: true,
        message: 'No hay snapshots disponibles. Ejecuta POST /api/admin/nios-collect primero.',
        data: null,
      });
    }

    if (action === 'compliance') {
      return respond({
        success: true,
        date: latest.date,
        compliance: latest.compliance,
      });
    }

    if (action === 'readiness') {
      return respond({
        success: true,
        date: latest.date,
        readiness: latest.readiness,
      });
    }

    if (action === 'trust') {
      const { generateGoogleTrustReport } = await import('@/lib/nios/intelligence/google-trust');
      const trust = latest.articlesFused
        ? generateGoogleTrustReport(latest.articlesFused)
        : null;
      return respond({
        success: true,
        date: latest.date,
        trust,
      });
    }

    if (action === 'adsense-recovery') {
      const [{ generateGoogleTrustReport }, { generateAdSenseRecoveryReport }] = await Promise.all([
        import('@/lib/nios/intelligence/google-trust'),
        import('@/lib/nios/intelligence/adsense-recovery'),
      ]);
      const trust = latest.articlesFused
        ? generateGoogleTrustReport(latest.articlesFused)
        : null;
      const recovery = trust && latest.articlesFused
        ? generateAdSenseRecoveryReport(latest.articlesFused, trust)
        : null;
      return respond({
        success: true,
        date: latest.date,
        recovery,
      });
    }

    if (action === 'weekly') {
      const [{ generateGoogleTrustReport }, { generateWeeklyReport }] = await Promise.all([
        import('@/lib/nios/intelligence/google-trust'),
        import('@/lib/nios/intelligence/weekly-report'),
      ]);
      const trust = latest.articlesFused
        ? generateGoogleTrustReport(latest.articlesFused)
        : null;
      const weekly = trust && latest.articlesFused && latest.gsc
        ? generateWeeklyReport(latest.articlesFused, trust, latest.gsc)
        : null;
      return respond({
        success: true,
        date: latest.date,
        weekly,
      });
    }

    if (action === 'learning-patterns') {
      const { getLearningPatterns, summarizeLearningPatterns } = await import('@/lib/nios/intelligence/google-feedback');
      const patterns = await getLearningPatterns(db);
      const summary = summarizeLearningPatterns(patterns);
      return respond({
        success: true,
        date: latest.date,
        summary,
        patterns: patterns.slice(0, 100),
      });
    }

    if (action === 'recovery') {
      const { generateGoogleTrustReport } = await import('@/lib/nios/intelligence/google-trust');
      const trust = latest.articlesFused
        ? generateGoogleTrustReport(latest.articlesFused)
        : null;
      const trustMap = new Map<string, { googleTrustScore: number; risk: 'alto' | 'medio' | 'bajo' }>();
      if (trust) {
        for (const a of trust.articles) {
          trustMap.set(a.slug, { googleTrustScore: a.googleTrustScore, risk: a.risk });
        }
      }
      const { generateContentRecoveryReport } = await import('@/lib/nios/intelligence/content-recovery');
      const contentRecovery = latest.articlesFused && trust
        ? generateContentRecoveryReport(latest.articlesFused, trustMap)
        : null;
      return respond({
        success: true,
        date: latest.date,
        recovery: contentRecovery,
      });
    }

    if (action === 'adsense-report') {
      const { generateAdSenseRecoveryFullReport } = await import('@/lib/nios/intelligence/adsense-recovery-report');
      const report = latest.articlesFused
        ? await generateAdSenseRecoveryFullReport(
            latest.articlesFused,
            latest.ga4 ? { totalUsers: latest.ga4.totalUsers, averageEngagementTimeSec: latest.ga4.averageEngagementTimeSec, devices: latest.ga4.devices } : null,
          )
        : null;
      return respond({
        success: true,
        date: latest.date,
        report,
      });
    }

    if (action === 'opportunity') {
      const { generateContentOpportunityReport } = await import('@/lib/nios/intelligence/opportunity-engine');
      const report = latest.articlesFused && latest.gsc
        ? generateContentOpportunityReport(latest.articlesFused, latest.gsc)
        : null;
      return respond({ success: true, date: latest.date, report });
    }

    if (action === 'category-intelligence') {
      const [{ generateGoogleTrustReport }, { generateCategoryIntelligence }] = await Promise.all([
        import('@/lib/nios/intelligence/google-trust'),
        import('@/lib/nios/intelligence/category-intelligence'),
      ]);
      const trust = latest.articlesFused
        ? generateGoogleTrustReport(latest.articlesFused)
        : null;
      const report = latest.articlesFused
        ? generateCategoryIntelligence(latest.articlesFused, latest.gsc, latest.ga4, trust)
        : null;
      return respond({ success: true, date: latest.date, report });
    }

    if (action === 'content-mix') {
      const [{ generateGoogleTrustReport }, { generateContentMixReport }] = await Promise.all([
        import('@/lib/nios/intelligence/google-trust'),
        import('@/lib/nios/intelligence/content-mix-intelligence'),
      ]);
      const trust = latest.articlesFused
        ? generateGoogleTrustReport(latest.articlesFused)
        : null;
      const report = latest.articlesFused
        ? generateContentMixReport(latest.articlesFused, latest.gsc, latest.ga4, trust)
        : null;
      return respond({ success: true, date: latest.date, report });
    }

    if (action === 'update-engine') {
      const { generateArticleUpdateReport } = await import('@/lib/nios/intelligence/update-engine');
      const report = latest.articlesFused
        ? generateArticleUpdateReport(latest.articlesFused)
        : null;
      return respond({ success: true, date: latest.date, report });
    }

    if (action === 'meni-learning') {
      const { generateMeniLearningFeedback } = await import('@/lib/nios/intelligence/meni-learning');
      const report = latest.articlesFused
        ? await generateMeniLearningFeedback(db, latest.articlesFused)
        : null;
      return respond({ success: true, date: latest.date, report });
    }

    if (action === 'calibration') {
      const { computeCalibrationReport } = await import('@/lib/meni/calibration');
      const report = await computeCalibrationReport(db);
      return respond({ success: true, report });
    }

    if (action === 'editor-strategy') {
      const [
        { generateGoogleTrustReport },
        { generateMeniLearningFeedback },
        { generateEditorCEOReport },
      ] = await Promise.all([
        import('@/lib/nios/intelligence/google-trust'),
        import('@/lib/nios/intelligence/meni-learning'),
        import('@/lib/nios/intelligence/editor-ceo-report'),
      ]);
      const trust = latest.articlesFused
        ? generateGoogleTrustReport(latest.articlesFused)
        : null;
      const meniLearning = latest.articlesFused
        ? await generateMeniLearningFeedback(db, latest.articlesFused)
        : null;
      const report = latest.articlesFused && trust
        ? generateEditorCEOReport(latest.articlesFused, latest.gsc, latest.ga4, trust, meniLearning)
        : null;
      return respond({ success: true, date: latest.date, report });
    }

    // Dashboard completo
    const [
      { buildGoogleIntelligenceDashboard },
      { generateGoogleTrustReport },
    ] = await Promise.all([
      import('@/lib/nios/intelligence/dashboard'),
      import('@/lib/nios/intelligence/google-trust'),
    ]);
    const dashboard = buildGoogleIntelligenceDashboard(
      latest.articlesFused || [],
      latest.gsc,
      latest.ga4,
      latest.recommendations || [],
    );

    const trust = latest.articlesFused
      ? generateGoogleTrustReport(latest.articlesFused)
      : null;

    return respond({
      success: true,
      date: latest.date,
      dashboard,
      compliance: latest.compliance,
      readiness: latest.readiness,
      trust,
      gscSummary: latest.gsc
        ? {
            status: latest.gsc.status ?? 'NO_DATA',
            totalImpressions: latest.gsc.totalImpressions,
            totalClicks: latest.gsc.totalClicks,
            avgCtr: latest.gsc.avgCtr,
            avgPosition: latest.gsc.avgPosition,
            collectedAt: latest.gsc.collectedAt,
            errorMessage: latest.gsc.errorMessage,
            pagesReturned: latest.gsc.pages?.length ?? 0,
            articlesMatched: (latest.articlesFused ?? []).filter((x) => x.hasGscData).length,
          }
        : null,
      ga4Summary: latest.ga4
        ? {
            status: latest.ga4.status ?? 'NO_DATA',
            totalUsers: latest.ga4.totalUsers,
            totalSessions: latest.ga4.totalSessions,
            totalPageviews: latest.ga4.totalPageviews,
            averageEngagementTimeSec: latest.ga4.averageEngagementTimeSec,
            engagementRate: latest.ga4.engagementRate,
            collectedAt: latest.ga4.collectedAt,
            errorMessage: latest.ga4.errorMessage,
            pagesReturned: latest.ga4.pages?.length ?? 0,
            articlesMatched: (latest.articlesFused ?? []).filter((x) => x.hasGa4Data).length,
          }
        : null,
    });
  } catch (error) {
    logger.error('[nios-intelligence GET] Error:', error);
    return respond(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
