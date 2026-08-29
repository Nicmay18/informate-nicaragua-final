import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// When USE_SA_FILE=1, load the real service-account JSON from disk.
// Otherwise, test the .env.local FIREBASE_PRIVATE_KEY.
const saPath = process.env.SA_FILE_PATH || 'G:\\RESPALDO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json';
if (process.env.USE_SA_FILE === '1') {
  const saJson = JSON.parse(readFileSync(saPath, 'utf8'));
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = Buffer.from(JSON.stringify(saJson)).toString('base64');
} else {
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = '';
}

import { readFileSync, writeFileSync } from 'fs';
import { getNiosExecutiveData } from './lib/nios/executive-center';
import { checkFirebaseHealth } from './lib/nios/intelligence/firebase-health';
import { collectGSC } from './lib/nios/intelligence/gsc-collector';
import { collectGA4 } from './lib/nios/intelligence/ga4-collector';
import { fetchFacebookSnapshot } from './lib/nios/intelligence/social-conversion';
import { getAdminDb } from './lib/firebase-admin';

const TIMEOUT = {
  firebaseHealth: 25_000,
  gsc: 45_000,
  ga4: 45_000,
  facebook: 25_000,
  executive: 120_000,
};

async function withTimeout<T>(name: string, ms: number, fn: () => Promise<T>): Promise<T | { __probeTimeout: true; name: string; message: string }> {
  const t = new Promise<{ __probeTimeout: true; name: string; message: string }>((resolve) =>
    setTimeout(() => resolve({ __probeTimeout: true, name, message: `TIMEOUT después de ${ms}ms` }), ms),
  );
  try {
    const p = fn();
    const r = await Promise.race([p, t]);
    return r;
  } catch (err) {
    return { __probeTimeout: false, name, message: err instanceof Error ? err.message : String(err) } as any;
  }
}

async function main() {
  const startedAt = new Date().toISOString();
  const db = getAdminDb();

  const gscSiteUrl = process.env.NIOS_GSC_SITE_URL || process.env.NIOS_SITE_URL || '';
  const ga4PropertyId = process.env.NIOS_GA4_PROPERTY_ID || '';

  const envPresence = {
    FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_SERVICE_ACCOUNT_BASE64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    NIOS_GSC_SITE_URL: !!process.env.NIOS_GSC_SITE_URL,
    NIOS_GA4_PROPERTY_ID: !!process.env.NIOS_GA4_PROPERTY_ID,
    FB_PAGE_ACCESS_TOKEN: !!process.env.FB_PAGE_ACCESS_TOKEN,
    FB_PAGE_ID: !!process.env.FB_PAGE_ID,
  };

  const rawFirestore = await Promise.allSettled([
    db.collection('noticias').get().then((s) => ({
      count: s.size,
      topLifetime: s.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.vistas ?? 0) - (a.vistas ?? 0))
        .slice(0, 10)
        .map((d: any) => ({ slug: d.id, titulo: d.titulo ?? d.title ?? '', vistas: Number(d.vistas ?? 0) })),
      newest: s.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => new Date(b.fechaPublicacion ?? 0).getTime() - new Date(a.fechaPublicacion ?? 0).getTime())
        .slice(0, 5)
        .map((d: any) => ({ slug: d.id, titulo: d.titulo ?? d.title ?? '', fechaPublicacion: d.fechaPublicacion ?? null, vistas: Number(d.vistas ?? 0) })),
    })),
    db.collection('traffic_log').orderBy('timestamp', 'desc').limit(20).get().then((s) =>
      s.docs.map((d) => ({
        id: d.id,
        slug: (d.data() as any).slug,
        source: (d.data() as any).source,
        timestamp: (d.data() as any).timestamp,
        userAgent: (d.data() as any).userAgent,
      })),
    ),
    db.collection('traffic_daily').orderBy('date', 'desc').limit(14).get().then((s) =>
      s.docs.map((d) => ({
        id: d.id,
        date: (d.data() as any).date,
        totalViews: (d.data() as any).totalViews,
        sources: (d.data() as any).sources,
      })),
    ),
    db.collection('nios_alerts').orderBy('createdAt', 'desc').limit(20).get().then((s) =>
      s.docs.map((d) => ({
        id: d.id,
        severity: (d.data() as any).severity,
        message: (d.data() as any).message,
        fingerprint: (d.data() as any).fingerprint,
        createdAt: (d.data() as any).createdAt,
        resolved: (d.data() as any).resolved,
        slug: (d.data() as any).slug,
      })),
    ),
    db.collection('distribuciones').orderBy('fecha', 'desc').limit(30).get().then((s) =>
      s.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          slug: data.slug,
          titulo: data.titulo,
          fecha: data.fecha,
          resultados: data.resultados,
        };
      }),
    ),
    db.collection('distribuciones_pendientes').limit(20).get().then((s) =>
      s.docs.map((d) => ({
        id: d.id,
        slug: (d.data() as any).slug,
        canalesFallidos: (d.data() as any).canalesFallidos,
        reintentos: (d.data() as any).reintentos,
        proximoIntento: (d.data() as any).proximoIntento,
      })),
    ),
  ]);

  const [rFirebase, rGsc, rGa4, rFacebook, rExecutive] = await Promise.all([
    withTimeout('firebaseHealth', TIMEOUT.firebaseHealth, () => checkFirebaseHealth()),
    withTimeout('gsc', TIMEOUT.gsc, () => collectGSC(gscSiteUrl, 28)),
    withTimeout('ga4', TIMEOUT.ga4, () => collectGA4(ga4PropertyId, 28)),
    withTimeout('facebook', TIMEOUT.facebook, () => fetchFacebookSnapshot()),
    withTimeout('executive', TIMEOUT.executive, () => getNiosExecutiveData()),
  ]);

  const stripSensitive = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;
    const text = JSON.stringify(obj);
    return text.includes(process.env.FIREBASE_PRIVATE_KEY?.slice(20, 40) || '') ? '[POSIBLE SECRETO — NO SE REGISTRA]' : obj;
  };

  const compact = (ex: any) => {
    if (!ex) return null;
    return {
      snapshotDate: ex.snapshotDate ?? null,
      dataAgeHours: ex.dataAgeHours ?? null,
      stale: ex.stale ?? null,
      articlesCount: ex.articlesCount ?? null,
      lastRunAt: ex.lastRunAt ?? null,
      gsc: {
        status: ex.gsc?.status ?? null,
        totalClicks: ex.gsc?.totalClicks ?? null,
        totalImpressions: ex.gsc?.totalImpressions ?? null,
        pagesCount: ex.gsc?.pages?.length ?? null,
        queriesCount: ex.gsc?.queries?.length ?? null,
        errorMessage: ex.gsc?.errorMessage ?? null,
      },
      ga4: {
        status: ex.ga4?.status ?? null,
        totalUsers: ex.ga4?.totalUsers ?? null,
        totalSessions: ex.ga4?.totalSessions ?? null,
        totalPageviews: ex.ga4?.totalPageviews ?? null,
        pagesCount: ex.ga4?.pages?.length ?? null,
        errorMessage: ex.ga4?.errorMessage ?? null,
      },
      topLifetimeArticles: ex.topLifetimeArticles?.slice(0, 10) ?? null,
      topMovingArticles: ex.topMovingArticles?.slice(0, 10) ?? null,
      articleMomentum: ex.articleMomentum?.slice(0, 10).map((m: any) => ({
        slug: m.slug,
        currentViews: m.currentViews,
        previousViews: m.previousViews,
        delta: m.delta,
        deltaPercent: m.deltaPercent,
        trend: m.trend,
        level: m.level,
        alertLevel: m.alertLevel,
        confidence: m.confidence,
        attribution: m.attribution,
        recommendedAction: m.recommendedAction,
      })) ?? null,
      socialConversion: ex.socialConversion ?? null,
      notificationForensics: ex.notificationForensics ?? null,
      ceoVerdict: ex.ceoVerdict ?? null,
      diagnostics: ex.diagnostics ?? null,
      firebaseHealth: ex.firebaseHealth ?? null,
      alerts: ex.alerts?.slice(0, 10).map((a: any) => ({
        severity: a.severity,
        message: a.message,
        createdAt: a.createdAt,
        fingerprint: a.fingerprint,
        resolved: a.resolved,
        slug: a.slug,
      })) ?? null,
    };
  };

  const output = {
    startedAt,
    finishedAt: new Date().toISOString(),
    envPresence,
    checks: {
      firebaseHealth: rFirebase,
      gsc: rGsc,
      ga4: rGa4,
      facebook: rFacebook,
    },
    executive: compact(rExecutive),
    rawFirestore: {
      noticias: rawFirestore[0].status === 'fulfilled' ? rawFirestore[0].value : { error: rawFirestore[0].reason?.message },
      traffic_log: rawFirestore[1].status === 'fulfilled' ? rawFirestore[1].value : { error: rawFirestore[1].reason?.message },
      traffic_daily: rawFirestore[2].status === 'fulfilled' ? rawFirestore[2].value : { error: rawFirestore[2].reason?.message },
      nios_alerts: rawFirestore[3].status === 'fulfilled' ? rawFirestore[3].value : { error: rawFirestore[3].reason?.message },
      distribuciones: rawFirestore[4].status === 'fulfilled' ? rawFirestore[4].value : { error: rawFirestore[4].reason?.message },
      distribuciones_pendientes: rawFirestore[5].status === 'fulfilled' ? rawFirestore[5].value : { error: rawFirestore[5].reason?.message },
    },
  };

  const safe = stripSensitive(output);
  writeFileSync('m18-probe-output.json', JSON.stringify(safe, null, 2));
  console.log('PROBE_OUTPUT: m18-probe-output.json');
}

main().catch((err) => {
  console.error('PROBE_FATAL:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
