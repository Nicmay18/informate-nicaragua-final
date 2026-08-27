/**
 * NIOS Executive Control Center — Data Aggregator
 * ================================================
 * Construye la vista ejecutiva consolidada a partir de datos YA EXISTENTES.
 * No recalcula motores. No modifica MENI, Editorial Engine, noticias, ni NIOS.
 */

import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { getLatestSnapshot, getHistoricalSnapshots } from './intelligence/store';
import { buildGoogleIntelligenceDashboard } from './intelligence/dashboard';
import { buildReliabilitySnapshot } from './intelligence/reliability-monitor';
import { buildWeeklyReliabilityReport } from './intelligence/weekly-reliability-report';
import { getActiveAlerts } from './intelligence/alerts';
import { reconcileTraffic, type ReconciledTrafficIntelligence } from './intelligence/traffic-reconciler';
import { buildTrendReport, siteSeriesFromDailyGrowth, type TrendReport } from './intelligence/trend-engine';
import {
  evaluateArticleMomentum,
  type ArticleMomentum,
} from './intelligence/article-momentum';
import { buildCeoVerdict, type CeoVerdict, type CeoVerdictInput } from './ceo-verdict';
import { buildSocialConversionVerdict, fetchFacebookSnapshot, type SocialConversionVerdict } from './intelligence/social-conversion';
import { checkFirebaseHealth, type FirebaseHealth } from './intelligence/firebase-health';
import { fetchNotificationForensics, type NotificationForensicsReport } from './intelligence/notification-forensics';
import { generateNiosDiagnostics } from './intelligence/diagnostics';
import type { NiosDiagnostic } from './intelligence/diagnostics';
import type {
  DailySnapshot,
  GoogleIntelligenceDashboard,
  GoogleTrustReport,
  AdSenseRecoveryFullReport,
  TrafficPerformance,
  GoogleLearningPattern,
  MeniLearningFeedback,
  ContentOpportunityReport,
  CategoryIntelligenceReport,
  EditorCEOReport,
  GSCSnapshot,
  GA4Snapshot,
} from './intelligence/types';
import type { ReliabilitySnapshot } from './intelligence/reliability-monitor';
import type { WeeklyReliabilityReport } from './intelligence/weekly-reliability-report';
import type { NiosAlert } from './intelligence/alerts';
import type { NiosTelemetryDocument } from './intelligence/telemetry';

export interface SnapshotSummary {
  date: string;
  collectedAt: string;
  articlesCount: number;
  hasGsc: boolean;
  hasGa4: boolean;
  trustScore: number | null;
}

export interface LifetimeArticle {
  slug: string;
  titulo: string;
  vistas: number;
}

export interface NiosExecutiveData {
  snapshot: DailySnapshot | null;
  snapshotDate: string | null;
  google: GoogleIntelligenceDashboard | null;
  trust: GoogleTrustReport | null;
  adsense: AdSenseRecoveryFullReport | null;
  traffic: TrafficPerformance | null;
  trafficIntelligence: ReconciledTrafficIntelligence;
  ceoVerdict: CeoVerdict;
  meniLearning: MeniLearningFeedback | null;
  learningPatterns: GoogleLearningPattern[];
  reliability: ReliabilitySnapshot | null;
  weekly: WeeklyReliabilityReport | null;
  alerts: NiosAlert[];
  telemetry: NiosTelemetryDocument | null;
  telemetryHistory: NiosTelemetryDocument[];
  ttlStatus: 'activo' | 'pendiente';
  articlesCount: number;
  gsc: GSCSnapshot | null;
  ga4: GA4Snapshot | null;
  contentOpportunity: ContentOpportunityReport | null;
  categoryIntelligence: CategoryIntelligenceReport | null;
  editorCEOReport: EditorCEOReport | null;
  snapshotHistory: SnapshotSummary[];
  socialConversion: SocialConversionVerdict;
  trends: TrendReport | null;
  /** Artículos con momentum reciente. */
  articleMomentum?: ArticleMomentum[];
  /** Salud operacional de Firebase: HEALTHY, DEGRADED, DOWN. */
  firebaseHealth?: FirebaseHealth | null;
  /** Diagnósticos consolidados de GSC, GA4 y Firebase. */
  diagnostics?: NiosDiagnostic[];
  topMovingArticles?: ArticleMomentum[];
  topLifetimeArticles?: LifetimeArticle[];
  lastRunAt?: string | null;
  dataAgeHours?: number | null;
  stale?: boolean;
  /** Forense de notificaciones por canal (telegram, facebook, push, etc.). */
  notificationForensics?: NotificationForensicsReport | null;
}

const buildExecutiveData = async (): Promise<NiosExecutiveData> => {
  const db = getAdminDb();

  const [latestSnapshot, historicalSnapshots] = await Promise.all([
    getLatestSnapshot(db),
    getHistoricalSnapshots(db, 14),
  ]);

  const [reliability, alerts, telemetryHistory] = await Promise.all([
    buildReliabilitySnapshot(db, 7),
    getActiveAlerts(db, 7),
    db
      .collection('nios_telemetry')
      .orderBy('date', 'desc')
      .limit(7)
      .get()
      .then((s) => s.docs.map((d) => d.data() as NiosTelemetryDocument)),
  ]);

  const telemetry = telemetryHistory[0] || null;
  const snapshot = latestSnapshot;
  const articles = snapshot?.articlesFused || [];

  const [facebook] = await Promise.all([
    fetchFacebookSnapshot(),
  ]);

  const socialConversion = buildSocialConversionVerdict({
    facebook,
    ga4: snapshot?.ga4 || null,
    traffic: snapshot?.trafficPerformance || null,
    articles,
  });

  const google = snapshot?.gsc
    ? buildGoogleIntelligenceDashboard(
        articles,
        snapshot.gsc,
        snapshot.ga4,
        snapshot.recommendations || [],
      )
    : null;

  const weekly = buildWeeklyReliabilityReport(reliability, telemetryHistory);

  const sitePoints = siteSeriesFromDailyGrowth(snapshot?.trafficPerformance?.dailyGrowth);
  const trends: TrendReport | null =
    sitePoints.length > 0
      ? buildTrendReport({ site: { metric: 'visitas', points: sitePoints } })
      : null;

  const snapshotHistory: SnapshotSummary[] = historicalSnapshots.map((s) => ({
    date: s.date,
    collectedAt: s.collectedAt,
    articlesCount: s.articlesCount ?? s.articlesFused?.length ?? 0,
    hasGsc: s.gsc?.status === 'REAL',
    hasGa4: s.ga4?.status === 'REAL',
    trustScore: s.trust?.averageGoogleTrustScore ?? null,
  }));

  const previousSnapshot = historicalSnapshots[0] ?? null;
  const articleMomentum = evaluateArticleMomentum(
    snapshot?.trafficPerformance ?? null,
    previousSnapshot?.trafficPerformance ?? null,
  );

  const [firebaseHealth, notificationForensics, topLifetimeRaw] = await Promise.all([
    checkFirebaseHealth(),
    fetchNotificationForensics(db, 7),
    db
      .collection('noticias')
      .orderBy('vistas', 'desc')
      .limit(5)
      .get()
      .then((snap) =>
        snap.docs.map((d) => {
          const data = d.data();
          return {
            slug: String(d.id),
            titulo: String(data.titulo ?? data.title ?? ''),
            vistas: Number(data.vistas ?? 0),
          };
        }),
      )
      .catch((err) => {
        logger.error('[executive-center] Error fetching top lifetime articles:', err);
        return [];
      }),
  ]);

  const topLifetimeArticles: LifetimeArticle[] = topLifetimeRaw.filter((a) => a.titulo);
  const topMovingArticles = [...articleMomentum]
    .sort((a, b) => b.momentum - a.momentum)
    .slice(0, 5);

  const now = new Date();
  const lastRunAt = snapshot?.collectedAt ?? snapshot?.date ?? null;
  const dataAgeHours = lastRunAt
    ? Math.max(0, Math.round((now.getTime() - new Date(lastRunAt).getTime()) / 36e5))
    : null;
  const stale = dataAgeHours === null || dataAgeHours > 25;
  const diagnostics = generateNiosDiagnostics(snapshot?.gsc ?? null, snapshot?.ga4 ?? null);

  const data: CeoVerdictInput = {
    snapshot,
    snapshotDate: snapshot?.date || null,
    google,
    trust: snapshot?.trust || null,
    adsense: snapshot?.adSenseRecoveryFullReport || null,
    traffic: snapshot?.trafficPerformance || null,
    trafficIntelligence: reconcileTraffic(
      snapshot?.trafficPerformance ?? null,
      snapshot?.gsc ?? null,
      snapshot?.ga4 ?? null,
    ),
    meniLearning: snapshot?.meniLearning || null,
    learningPatterns: snapshot?.learningPatterns || [],
    reliability,
    weekly,
    alerts,
    telemetry,
    telemetryHistory,
    ttlStatus: process.env.NIOS_TRAFFIC_LOG_TTL === '1' ? 'activo' : 'pendiente',
    articlesCount: articles.length,
    gsc: snapshot?.gsc || null,
    ga4: snapshot?.ga4 || null,
    contentOpportunity: snapshot?.contentOpportunity || null,
    categoryIntelligence: snapshot?.categoryIntelligence || null,
    editorCEOReport: snapshot?.editorCEOReport || null,
    snapshotHistory,
    socialConversion,
    trends,
    articleMomentum,
    firebaseHealth,
    diagnostics,
    topMovingArticles,
    topLifetimeArticles,
    lastRunAt,
    dataAgeHours,
    stale,
    notificationForensics,
  };

  return {
    ...data,
    ceoVerdict: buildCeoVerdict(data),
  };
};

export async function getNiosExecutiveData(): Promise<NiosExecutiveData> {
  return buildExecutiveData();
}
