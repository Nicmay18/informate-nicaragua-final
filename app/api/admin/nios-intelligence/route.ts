import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getLatestSnapshot, getHistoricalSnapshots } from '@/lib/nios/intelligence/store';
import { buildGoogleIntelligenceDashboard } from '@/lib/nios/intelligence/dashboard';
import { generateGoogleTrustReport } from '@/lib/nios/intelligence/google-trust';
import { generateAdSenseRecoveryReport } from '@/lib/nios/intelligence/adsense-recovery';
import { generateWeeklyReport } from '@/lib/nios/intelligence/weekly-report';
import { getLearningPatterns, summarizeLearningPatterns } from '@/lib/nios/intelligence/google-feedback';
import { generateContentRecoveryReport } from '@/lib/nios/intelligence/content-recovery';
import { generateAdSenseRecoveryFullReport } from '@/lib/nios/intelligence/adsense-recovery-report';
import { generateContentOpportunityReport } from '@/lib/nios/intelligence/opportunity-engine';
import { generateCategoryIntelligence } from '@/lib/nios/intelligence/category-intelligence';
import { generateContentMixReport } from '@/lib/nios/intelligence/content-mix-intelligence';
import { generateArticleUpdateReport } from '@/lib/nios/intelligence/update-engine';
import { generateEditorCEOReport } from '@/lib/nios/intelligence/editor-ceo-report';
import { generateMeniLearningFeedback } from '@/lib/nios/intelligence/meni-learning';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-token') || request.headers.get('x-admin-key');
  const expected = process.env.ADMIN_API_KEY || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  return !!expected && key === expected;
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
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'dashboard';
    const db = getAdminDb();

    if (action === 'history') {
      const days = parseInt(searchParams.get('days') || '30', 10);
      const snapshots = await getHistoricalSnapshots(db, days);
      return NextResponse.json({
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

    const latest = await getLatestSnapshot(db);

    if (!latest) {
      return NextResponse.json({
        success: true,
        message: 'No hay snapshots disponibles. Ejecuta POST /api/admin/nios-collect primero.',
        data: null,
      });
    }

    if (action === 'compliance') {
      return NextResponse.json({
        success: true,
        date: latest.date,
        compliance: latest.compliance,
      });
    }

    if (action === 'readiness') {
      return NextResponse.json({
        success: true,
        date: latest.date,
        readiness: latest.readiness,
      });
    }

    if (action === 'trust') {
      const trust = latest.articlesFused
        ? generateGoogleTrustReport(latest.articlesFused)
        : null;
      return NextResponse.json({
        success: true,
        date: latest.date,
        trust,
      });
    }

    if (action === 'adsense-recovery') {
      const trust = latest.articlesFused
        ? generateGoogleTrustReport(latest.articlesFused)
        : null;
      const recovery = trust && latest.articlesFused
        ? generateAdSenseRecoveryReport(latest.articlesFused, trust)
        : null;
      return NextResponse.json({
        success: true,
        date: latest.date,
        recovery,
      });
    }

    if (action === 'weekly') {
      const trust = latest.articlesFused
        ? generateGoogleTrustReport(latest.articlesFused)
        : null;
      const weekly = trust && latest.articlesFused && latest.gsc
        ? generateWeeklyReport(latest.articlesFused, trust, latest.gsc)
        : null;
      return NextResponse.json({
        success: true,
        date: latest.date,
        weekly,
      });
    }

    if (action === 'learning-patterns') {
      const patterns = await getLearningPatterns(db);
      const summary = summarizeLearningPatterns(patterns);
      return NextResponse.json({
        success: true,
        date: latest.date,
        summary,
        patterns: patterns.slice(0, 100),
      });
    }

    if (action === 'recovery') {
      const trust = latest.articlesFused
        ? generateGoogleTrustReport(latest.articlesFused)
        : null;
      const trustMap = new Map<string, { googleTrustScore: number; risk: 'alto' | 'medio' | 'bajo' }>();
      if (trust) {
        for (const a of trust.articles) {
          trustMap.set(a.slug, { googleTrustScore: a.googleTrustScore, risk: a.risk });
        }
      }
      const contentRecovery = latest.articlesFused && trust
        ? generateContentRecoveryReport(latest.articlesFused, trustMap)
        : null;
      return NextResponse.json({
        success: true,
        date: latest.date,
        recovery: contentRecovery,
      });
    }

    if (action === 'adsense-report') {
      const report = latest.articlesFused
        ? await generateAdSenseRecoveryFullReport(
            latest.articlesFused,
            latest.ga4 ? { totalUsers: latest.ga4.totalUsers, averageEngagementTimeSec: latest.ga4.averageEngagementTimeSec, devices: latest.ga4.devices } : null,
          )
        : null;
      return NextResponse.json({
        success: true,
        date: latest.date,
        report,
      });
    }

    if (action === 'opportunity') {
      const report = latest.articlesFused && latest.gsc
        ? generateContentOpportunityReport(latest.articlesFused, latest.gsc)
        : null;
      return NextResponse.json({ success: true, date: latest.date, report });
    }

    if (action === 'category-intelligence') {
      const trust = latest.articlesFused
        ? generateGoogleTrustReport(latest.articlesFused)
        : null;
      const report = latest.articlesFused
        ? generateCategoryIntelligence(latest.articlesFused, latest.gsc, latest.ga4, trust)
        : null;
      return NextResponse.json({ success: true, date: latest.date, report });
    }

    if (action === 'content-mix') {
      const trust = latest.articlesFused
        ? generateGoogleTrustReport(latest.articlesFused)
        : null;
      const report = latest.articlesFused
        ? generateContentMixReport(latest.articlesFused, latest.gsc, latest.ga4, trust)
        : null;
      return NextResponse.json({ success: true, date: latest.date, report });
    }

    if (action === 'update-engine') {
      const report = latest.articlesFused
        ? generateArticleUpdateReport(latest.articlesFused)
        : null;
      return NextResponse.json({ success: true, date: latest.date, report });
    }

    if (action === 'meni-learning') {
      const report = latest.articlesFused
        ? await generateMeniLearningFeedback(db, latest.articlesFused)
        : null;
      return NextResponse.json({ success: true, date: latest.date, report });
    }

    if (action === 'editor-strategy') {
      const trust = latest.articlesFused
        ? generateGoogleTrustReport(latest.articlesFused)
        : null;
      const meniLearning = latest.articlesFused
        ? await generateMeniLearningFeedback(db, latest.articlesFused)
        : null;
      const report = latest.articlesFused && trust
        ? generateEditorCEOReport(latest.articlesFused, latest.gsc, latest.ga4, trust, meniLearning)
        : null;
      return NextResponse.json({ success: true, date: latest.date, report });
    }

    // Dashboard completo
    const dashboard = buildGoogleIntelligenceDashboard(
      latest.articlesFused || [],
      latest.gsc,
      latest.ga4,
      latest.recommendations || [],
    );

    const trust = latest.articlesFused
      ? generateGoogleTrustReport(latest.articlesFused)
      : null;

    return NextResponse.json({
      success: true,
      date: latest.date,
      dashboard,
      compliance: latest.compliance,
      readiness: latest.readiness,
      trust,
    });
  } catch (error) {
    console.error('[nios-intelligence GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
