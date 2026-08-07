import { unstable_cache } from 'next/cache';
import { logger } from '@/lib/logger';
import type { Firestore } from 'firebase-admin/firestore';
import {
  aggregateTrafficFromLog,
  generateTrafficPerformance,
  type TrafficDailySummary,
  type TrafficPerformance,
} from './traffic-aggregator';

export interface TrafficReadResult {
  source: 'traffic_daily' | 'traffic_log_fallback';
  views: number;
  articles: TrafficDailySummary[];
  performance: TrafficPerformance | null;
  fallbackReads: number;
  migrationHealth: number;
}

export interface TrafficMigrationStatus {
  dailySource: 'traffic_daily' | 'traffic_log_fallback';
  fallbackReads: number;
  migrationHealth: number;
  dailyGenerated: boolean;
}

const TRAFFIC_DAILY = 'traffic_daily';

const getCachedTrafficForDate = (db: Firestore, date: string, topN = 100) =>
  unstable_cache(
    async () => {
      return fetchTrafficForDate(db, date, topN);
    },
    ['traffic-for-date', date, topN.toString()],
    { revalidate: 300, tags: ['traffic-data'] },
  );

/**
 * Lee tráfico del día objetivo sin cache.
 */
async function fetchTrafficForDate(
  db: Firestore,
  date: string,
  topN = 100,
): Promise<TrafficReadResult> {
  const dailySummary: Record<string, TrafficDailySummary> = {};
  const fallbackReads = 0;

  try {
    const snap = await db
      .collection(TRAFFIC_DAILY)
      .doc(date)
      .collection('articles')
      .orderBy('views', 'desc')
      .limit(topN)
      .get();

    for (const doc of snap.docs) {
      const data = doc.data() as unknown as TrafficDailySummary;
      if (data.slug && typeof data.views === 'number') {
        dailySummary[data.slug] = data;
      }
    }
  } catch (err) {
    logger.warn('[traffic-reader] Failed to read traffic_daily:', err);
  }

  const hasDaily = Object.keys(dailySummary).length > 0;

  if (hasDaily) {
    const articles = Object.values(dailySummary).sort((a, b) => b.views - a.views);
    const views = articles.reduce((sum, a) => sum + a.views, 0);
    return {
      source: 'traffic_daily',
      views,
      articles,
      performance: null,
      fallbackReads,
      migrationHealth: 100,
    };
  }

  // Fallback a traffic_log
  const fallbackSummary = await aggregateTrafficFromLog(db, date, 5000);
  const articles = Object.values(fallbackSummary).sort((a, b) => b.views - a.views);
  const views = articles.reduce((sum, a) => sum + a.views, 0);

  return {
    source: 'traffic_log_fallback',
    views,
    articles,
    performance: null,
    fallbackReads: 1,
    migrationHealth: 0,
  };
}

/**
 * Lee tráfico del día objetivo.
 * Prioridad: traffic_daily → fallback traffic_log.
 * Centraliza lectura para dashboards y APIs con cache.
 */
export async function getTrafficForDate(
  db: Firestore,
  date: string,
  topN = 100,
): Promise<TrafficReadResult> {
  const cached = getCachedTrafficForDate(db, date, topN);
  return cached();
}

/**
 * Obtiene performance de tráfico con cache.
 * Combina traffic_daily y traffic_log según disponibilidad.
 */
const getCachedTrafficPerformance = (db: Firestore, days = 7, topN = 50) =>
  unstable_cache(
    async () => {
      return generateTrafficPerformance(db, days, topN);
    },
    ['traffic-performance', days.toString(), topN.toString()],
    { revalidate: 300, tags: ['traffic-data'] },
  );

export async function getTrafficPerformance(
  db: Firestore,
  days = 7,
  topN = 50,
): Promise<TrafficReadResult> {
  const cached = getCachedTrafficPerformance(db, days, topN);
  const performance = await cached();

  const today = new Date().toISOString().split('T')[0];
  const todayRead = await getTrafficForDate(db, today, topN);

  const source: 'traffic_daily' | 'traffic_log_fallback' =
    performance.topArticles.length > 0 ? 'traffic_daily' : 'traffic_log_fallback';

  const fallbackReads = source === 'traffic_daily' ? 0 : 1;
  const migrationHealth = todayRead.source === 'traffic_daily' ? 100 : 50;

  return {
    source,
    views: performance.topArticles.reduce((sum, a) => sum + a.views, 0) || todayRead.views,
    articles: todayRead.articles,
    performance,
    fallbackReads,
    migrationHealth,
  };
}

/**
 * Devuelve estado de migración para telemetry.
 */
export async function getTrafficMigrationStatus(
  db: Firestore,
): Promise<TrafficMigrationStatus> {
  const today = new Date().toISOString().split('T')[0];
  const read = await getTrafficForDate(db, today, 1);

  return {
    dailySource: read.source,
    fallbackReads: read.fallbackReads,
    migrationHealth: read.migrationHealth,
    dailyGenerated: read.source === 'traffic_daily',
  };
}
