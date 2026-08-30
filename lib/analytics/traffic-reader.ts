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
  /** Vistas del día o últimas 24h del calendario consultado (sin mezclar períodos). */
  views24h: number;
  /** Vistas acumuladas de los últimos 7 días (solo en lecturas de performance). */
  views7d?: number;
  /** Vistas acumuladas de los últimos 30 días (solo en lecturas de performance). */
  views30d?: number;
  /** Vistas históricas de todo el tiempo; NO_DATA si no está disponible. */
  viewsHistorical?: 'NO_DATA' | number;
  articles: TrafficDailySummary[];
  performance: TrafficPerformance | null;
  fallbackReads: number;
  migrationHealth: number;
}

export interface TrafficValidationResult {
  status: 'TRUSTED' | 'UNTRUSTED' | 'INSUFFICIENT';
  confidence: number;
  samples: number;
  variance: number;
  details: string;
}

export interface TrafficMigrationStatus {
  dailySource: 'traffic_daily' | 'traffic_log_fallback';
  fallbackReads: number;
  migrationHealth: number;
  dailyGenerated: boolean;
}

const TRAFFIC_DAILY = 'traffic_daily';

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
    logger.error('[traffic-reader] Failed to read traffic_daily:', err);
  }

  const hasDaily = Object.keys(dailySummary).length > 0;
  logger.info('[traffic-reader] fetchTrafficForDate', { date, hasDaily, dailyCount: Object.keys(dailySummary).length });

  if (hasDaily) {
    const articles = Object.values(dailySummary).sort((a, b) => b.views - a.views);
    const views = articles.reduce((sum, a) => sum + a.views, 0);
    logger.info('[traffic-reader] returning traffic_daily', { date, views, articleCount: articles.length });
    return {
      source: 'traffic_daily',
      views24h: views,
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
  logger.info('[traffic-reader] fallback traffic_log', { date, views, articleCount: articles.length });

  return {
    source: 'traffic_log_fallback',
    views24h: views,
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
  return fetchTrafficForDate(db, date, topN);
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
  _days = 7,
  topN = 50,
): Promise<TrafficReadResult> {
  const today = new Date().toISOString().split('T')[0];
  const todayRead = await getTrafficForDate(db, today, topN);

  // Leer 30 días para poder entregar views7d y views30d con una sola pasada.
  const performance = await getCachedTrafficPerformance(db, 30, topN)();

  const source: 'traffic_daily' | 'traffic_log_fallback' =
    performance.topArticles.length > 0 ? 'traffic_daily' : 'traffic_log_fallback';

  const fallbackReads = source === 'traffic_daily' ? 0 : 1;
  const migrationHealth = todayRead.source === 'traffic_daily' ? 100 : 50;

  // views24h proviene del día calendario actual; views7d y views30d desde dailyGrowth.
  const sortedDates = Object.keys(performance.dailyGrowth).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );
  const views7d = sortedDates.slice(0, 7).reduce((sum, d) => sum + (performance.dailyGrowth[d] || 0), 0);
  const views30d = sortedDates.slice(0, 30).reduce((sum, d) => sum + (performance.dailyGrowth[d] || 0), 0);

  return {
    source,
    views24h: todayRead.views24h,
    views7d,
    views30d,
    viewsHistorical: 'NO_DATA',
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

/**
 * Ejecuta 3 lecturas de tráfico y compara consistencia.
 * Si varía, el CEO debe degradar confianza.
 */
export async function validateTrafficReader(
  db: Firestore,
  runs = 3,
): Promise<TrafficValidationResult> {
  const samples: TrafficReadResult[] = [];
  for (let i = 0; i < runs; i++) {
    samples.push(await getTrafficPerformance(db, 7, 50));
  }

  const first = samples[0];
  const views = samples.map((s) => s.views24h);
  const articleCounts = samples.map((s) => s.articles.length);
  const minViews = Math.min(...views);
  const maxViews = Math.max(...views);
  const variance = maxViews - minViews;
  const consistent = views.every((v) => v === first.views24h) && articleCounts.every((c) => c === first.articles.length);
  const sufficient = first.articles.length > 0 || first.views24h > 0;

  if (!sufficient) {
    return {
      status: 'INSUFFICIENT',
      confidence: 0,
      samples: runs,
      variance,
      details: 'No traffic data available for validation',
    };
  }

  if (consistent) {
    return {
      status: 'TRUSTED',
      confidence: 100,
      samples: runs,
      variance: 0,
      details: `All ${runs} runs consistent (${first.views24h} views, ${first.articles.length} articles)`,
    };
  }

  return {
    status: 'UNTRUSTED',
    confidence: 0,
    samples: runs,
    variance,
    details: `Variance ${variance} views across ${runs} runs`,
  };
}
