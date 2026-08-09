/**
 * NIOS Executive Control Center — Data Aggregator
 * ================================================
 * Construye la vista ejecutiva consolidada a partir de datos YA EXISTENTES.
 * No recalcula motores. No modifica MENI, Editorial Engine, noticias, ni NIOS.
 */

import { getAdminDb } from '@/lib/firebase-admin';
import { getLatestSnapshot, getHistoricalSnapshots } from './intelligence/store';
import { buildGoogleIntelligenceDashboard } from './intelligence/dashboard';
import { buildReliabilitySnapshot } from './intelligence/reliability-monitor';
import { buildWeeklyReliabilityReport } from './intelligence/weekly-reliability-report';
import { getActiveAlerts } from './intelligence/alerts';
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

export interface NiosExecutiveData {
  snapshot: DailySnapshot | null;
  snapshotDate: string | null;
  google: GoogleIntelligenceDashboard | null;
  trust: GoogleTrustReport | null;
  adsense: AdSenseRecoveryFullReport | null;
  traffic: TrafficPerformance | null;
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

  const google = snapshot?.gsc
    ? buildGoogleIntelligenceDashboard(
        articles,
        snapshot.gsc,
        snapshot.ga4,
        snapshot.recommendations || [],
      )
    : null;

  const weekly = buildWeeklyReliabilityReport(reliability, telemetryHistory);

  const snapshotHistory: SnapshotSummary[] = historicalSnapshots.map((s) => ({
    date: s.date,
    collectedAt: s.collectedAt,
    articlesCount: s.articlesFused?.length ?? 0,
    hasGsc: !!s.gsc,
    hasGa4: !!s.ga4,
    trustScore: s.trust?.averageGoogleTrustScore ?? null,
  }));

  return {
    snapshot,
    snapshotDate: snapshot?.date || null,
    google,
    trust: snapshot?.trust || null,
    adsense: snapshot?.adSenseRecoveryFullReport || null,
    traffic: snapshot?.trafficPerformance || null,
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
  };
};

export async function getNiosExecutiveData(): Promise<NiosExecutiveData> {
  return buildExecutiveData();
}
