#!/usr/bin/env tsx
/**
 * NIOS Pipeline Probe — GA4 / GSC / Firestore end-to-end
 * No inventa datos. No expone secretos. Loguea evidencia concreta.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getGoogleServiceAccountCredentials } from '@/lib/google-credentials';
import { getAdminDb } from '@/lib/firebase-admin';
import { collectGA4 } from '@/lib/nios/intelligence/ga4-collector';
import { collectGSC } from '@/lib/nios/intelligence/gsc-collector';
import { runNIOSPipeline, NIOS_CONFIG } from '@/lib/nios/intelligence/orchestrator';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';

function iso() { return new Date().toISOString(); }
function log(stage: string, event: string, payload: Record<string, unknown>) {
  console.log(JSON.stringify({ t: iso(), stage, event, ...payload }));
}

async function main() {
  const propertyId = process.env.NIOS_GA4_PROPERTY_ID;
  const siteUrl = process.env.NIOS_GSC_SITE_URL || process.env.NIOS_SITE_URL;

  log('env', 'INPUT', {
    niosGa4PropertyId: propertyId || 'NOT_SET',
    niosGscSiteUrl: siteUrl || 'NOT_SET',
  });

  const db = getAdminDb();

  const creds = getGoogleServiceAccountCredentials();
  log('credentials', 'VERIFICATION', {
    hasCreds: !!creds,
    projectId: creds?.projectId,
    clientEmailDomain: creds ? creds.clientEmail.split('@')[1] : null,
    keyLength: creds?.privateKey.length,
    hasBeginPrivateKey: creds?.privateKey.includes('-----BEGIN PRIVATE KEY-----'),
    hasBeginRsa: creds?.privateKey.includes('-----BEGIN RSA PRIVATE KEY-----'),
    hasBegin: creds?.privateKey.includes('-----BEGIN'),
    hasEnd: creds?.privateKey.includes('-----END'),
    hasBackslashN: creds?.privateKey.includes('\\n'),
    hasCr: creds?.privateKey.includes('\r'),
    newlineCount: creds?.privateKey.split('\n').length,
  });

  // 1. Real GA4 API
  const ga4 = await collectGA4(propertyId || '525672447', 7);
  log('ga4', 'OUTPUT', {
    propertyId: ga4.propertyId,
    status: (ga4 as any).status || ga4.status,
    totalUsers: ga4.totalUsers,
    totalSessions: ga4.totalSessions,
    totalPageviews: ga4.totalPageviews,
    pages: ga4.pages?.length,
    sources: ga4.sources?.length,
    devices: ga4.devices?.length,
    dateRange: ga4.dateRange,
    collectedAt: ga4.collectedAt,
    errorMessage: (ga4 as any).errorMessage,
  });

  // 2. Real GSC API
  const gsc = await collectGSC(siteUrl || 'sc-domain:nicaraguainformate.com', 7);
  log('gsc', 'OUTPUT', {
    siteUrl: gsc?.siteUrl,
    status: (gsc as any).status,
    totalImpressions: gsc?.totalImpressions,
    totalClicks: gsc?.totalClicks,
    pages: gsc?.pages?.length,
    queries: gsc?.queries?.length,
    collectedAt: gsc?.collectedAt,
    errorMessage: (gsc as any).errorMessage,
  });

  // 3. Remove stale snapshot to force a fresh write for this verification
  const todayKey = new Date().toISOString().split('T')[0];
  const stale = db.collection('nios_daily_snapshots').doc(todayKey);
  const staleDoc = await stale.get();
  if (staleDoc.exists) {
    await stale.delete();
    log('firestore', 'SIDE_EFFECT', { action: 'deleted-stale-snapshot', collection: 'nios_daily_snapshots', docId: todayKey });
  }

  // 4. Full NIOS pipeline + Firestore snapshot
  const pipeline = await runNIOSPipeline(db, {
    ...NIOS_CONFIG,
    ga4PropertyId: propertyId || '525672447',
    siteUrl: siteUrl || 'sc-domain:nicaraguainformate.com',
  });
  log('pipeline', 'OUTPUT', {
    success: pipeline.success,
    date: pipeline.date,
    gscCollected: pipeline.gscCollected,
    ga4Collected: pipeline.ga4Collected,
    articlesAnalyzed: pipeline.articlesAnalyzed,
    recommendationsGenerated: pipeline.recommendationsGenerated,
    errors: pipeline.errors,
  });

  // 4. Verify persisted snapshot
  const snapshot = await getLatestSnapshot(db).catch(() => null);
  log('firestore', 'VERIFICATION', {
    hasSnapshot: !!snapshot,
    date: snapshot?.date,
    collectedAt: snapshot?.collectedAt,
    articlesFused: snapshot?.articlesFused?.length,
    gscStatus: (snapshot as any)?.gsc?.status,
    ga4Status: (snapshot as any)?.ga4?.status,
    ga4Property: (snapshot as any)?.ga4?.propertyId,
    gscSiteUrl: (snapshot as any)?.gsc?.siteUrl,
  });

  // 5. Top 3 articles with GA4/GSC signals
  const fused = ((snapshot as any)?.articlesFused || []) as any[];
  const withSignals = fused
    .filter((a) => a.hasGscData || a.hasGa4Data)
    .sort((a, b) => (b.gscImpressions + b.ga4Pageviews) - (a.gscImpressions + a.ga4Pageviews));
  const top = (withSignals.length >= 3 ? withSignals : fused).slice(0, 3);
  log('article-intelligence', 'SUMMARY', {
    totalFused: fused.length,
    withGsc: fused.filter((a) => a.hasGscData).length,
    withGa4: fused.filter((a) => a.hasGa4Data).length,
  });
  for (const article of top) {
    log('article-intelligence', 'SAMPLE', {
      slug: article.slug,
      titulo: article.titulo?.slice(0, 80),
      scoreMeni: article.scoreMeni,
      gsc: article.hasGscData ? {
        impressions: article.gscImpressions,
        clicks: article.gscClicks,
        ctr: article.gscCtr,
        position: article.gscPosition,
        source: 'GSC',
      } : null,
      ga4: article.hasGa4Data ? {
        users: article.ga4Users,
        sessions: article.ga4Sessions,
        pageviews: article.ga4Pageviews,
        engagementRate: article.ga4EngagementRate,
        source: 'GA4',
      } : null,
    });
  }

  log('probe', 'END', { ok: pipeline.success });
}

main().catch((err) => {
  console.error(JSON.stringify({ t: iso(), stage: 'probe', event: 'FATAL', error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
