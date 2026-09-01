import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });

import { getNiosExecutiveData } from '@/lib/nios/executive-center';

function iso() {
  return new Date().toISOString();
}

function log(stage: string, event: string, payload: Record<string, unknown>) {
  console.log(JSON.stringify({ t: iso(), stage, event, ...payload }));
}

async function main() {
  log('command-center', 'START', {});

  const data = await getNiosExecutiveData();

  const snapshot = data.snapshot as any;
  const articles = snapshot?.articlesFused || [];
  const withGsc = articles.filter((a: any) => a?.hasGscData).length;
  const withGa4 = articles.filter((a: any) => a?.hasGa4Data).length;
  const withBoth = articles.filter((a: any) => a?.hasGscData && a?.hasGa4Data).length;

  // Multi-source top 3 (GSC + GA4)
  const top = [...articles]
    .filter((a: any) => a?.hasGscData || a?.hasGa4Data)
    .sort((a: any, b: any) => ((b.gscImpressions || 0) + (b.ga4Pageviews || 0)) - ((a.gscImpressions || 0) + (a.ga4Pageviews || 0)))
    .slice(0, 3)
    .map((a: any) => ({
      slug: a.slug,
      titulo: a.titulo?.slice(0, 80),
      scoreMeni: a.scoreMeni,
      gsc: a.hasGscData ? { impressions: a.gscImpressions, clicks: a.gscClicks, ctr: a.gscCtr, position: a.gscPosition } : null,
      ga4: a.hasGa4Data ? { users: a.ga4Users, sessions: a.ga4Sessions, pageviews: a.ga4Pageviews, engagementRate: a.ga4EngagementRate } : null,
    }));

  log('command-center', 'DATA_CHAIN', {
    getNiosExecutiveData: true,
    getLatestSnapshot: !!snapshot,
    snapshotDate: snapshot?.date,
    collectedAt: snapshot?.collectedAt,
    freshnessHours: data.dataAgeHours,
    stale: data.stale,
  });

  log('command-center', 'SOURCES', {
    gscStatus: data.gsc?.status,
    gscSiteUrl: data.gsc?.siteUrl,
    ga4Status: data.ga4?.status,
    ga4PropertyId: data.ga4?.propertyId,
    gscTotalImpressions: (data.gsc as any)?.totalImpressions,
    gscTotalClicks: (data.gsc as any)?.totalClicks,
    ga4TotalUsers: (data.ga4 as any)?.totalUsers,
    ga4TotalSessions: (data.ga4 as any)?.totalSessions,
    ga4TotalPageviews: (data.ga4 as any)?.totalPageviews,
  });

  log('command-center', 'ARTICLES', {
    totalFused: articles.length,
    withGsc,
    withGa4,
    withBoth,
  });

  for (const [i, article] of top.entries()) {
    log('command-center', `ARTICLE_${i + 1}`, article);
  }

  const diags = (data.diagnostics || []) as any[];
  const errors = diags.filter((d: any) => d?.severity === 'error' || d?.status === 'ERROR');
  const warnings = diags.filter((d: any) => d?.severity === 'warning');

  const recommendations = (snapshot?.recommendations || []) as any[];
  const ceo = data.ceoVerdict;

  log('command-center', 'DECISIONS', {
    recommendationsCount: recommendations.length,
    recommendationTypes: [...new Set(recommendations.map((r: any) => r.type))],
    ceoStatus: ceo?.status,
    whatToDoToday: ceo?.whatToDoToday || [],
    needsHuman: ceo?.needsHuman || [],
    doNotDo: ceo?.doNotDo || [],
    niosRepairs: ceo?.niosRepairs || [],
    learningPatternsCount: data.learningPatterns?.length ?? 0,
    pendingCeoTasks: (data.ceoVerdict as any)?.needsHuman?.length ?? 0,
    alertsCount: data.alerts?.length ?? 0,
  });

  log('command-center', 'DIAGNOSTICS', {
    total: diags.length,
    errors: errors.length,
    warnings: warnings.length,
    emptyStates: diags.filter((d: any) => d?.status === 'NO_DATA' || d?.status === 'NOT_CONFIGURED').length,
    errorDetails: errors.map((d: any) => ({ source: d.source, status: d.status, message: d.message })),
  });

  log('command-center', 'END', {
    ok: !!data.snapshot,
    realGsc: data.gsc?.status === 'REAL',
    realGa4: data.ga4?.status === 'REAL',
    articles328: articles.length === 328,
  });
}

main().catch((err) => {
  console.error(JSON.stringify({ t: iso(), stage: 'command-center', event: 'FATAL', error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
