import { logger } from '@/lib/logger';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';

export interface TrafficDailySummary {
  slug: string;
  date: string;
  views: number;
  sources: Record<string, number>;
  devices: Record<string, number>;
  updatedAt: string;
}

export interface TrafficAggregateOptions {
  date?: string;
  fallbackToTrafficLog?: boolean;
  limit?: number;
}

export interface TrafficPerformance {
  topArticles: { slug: string; views: number; sources: Record<string, number> }[];
  topSources: Record<string, number>;
  dailyGrowth: Record<string, number>;
  weeklyTrend: Record<string, number>;
  generatedAt: string;
}

const TRAFFIC_DAILY = 'traffic_daily';
const TRAFFIC_LOG = 'traffic_log';

/**
 * Construye un resumen diario de tráfico a partir de traffic_daily o traffic_log.
 * No modifica traffic_log. No borra datos.
 */
export async function getTrafficDailySummary(
  db: Firestore,
  date: string,
): Promise<Record<string, TrafficDailySummary>> {
  const result: Record<string, TrafficDailySummary> = {};

  try {
    const snap = await db
      .collection(TRAFFIC_DAILY)
      .doc(date)
      .collection('articles')
      .get();

    for (const doc of snap.docs) {
      const data = doc.data() as unknown as TrafficDailySummary;
      result[data.slug] = data;
    }
  } catch (err) {
    logger.warn('[traffic-aggregator] Failed to read traffic_daily:', err);
  }

  return result;
}

/**
 * Agraga visitas de un día a partir de traffic_log.
 * Método de compatibilidad mientras traffic_daily está en observación.
 */
export async function aggregateTrafficFromLog(
  db: Firestore,
  date?: string,
  limit = 5000,
): Promise<Record<string, TrafficDailySummary>> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const start = new Date(targetDate);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const result: Record<string, TrafficDailySummary> = {};

  try {
    const snap = await db
      .collection(TRAFFIC_LOG)
      .where('timestamp', '>=', start)
      .where('timestamp', '<', end)
      .limit(limit)
      .get();

    for (const doc of snap.docs) {
      const data = doc.data();
      const slug = data.slug;
      if (!slug || typeof slug !== 'string') continue;

      const summary = result[slug] || {
        slug,
        date: targetDate,
        views: 0,
        sources: {},
        devices: {},
        updatedAt: new Date().toISOString(),
      };

      summary.views += 1;
      const source = data.source || 'directo';
      summary.sources[source] = (summary.sources[source] || 0) + 1;

      const device = detectDevice(data.userAgent);
      summary.devices[device] = (summary.devices[device] || 0) + 1;

      result[slug] = summary;
    }
  } catch (err) {
    logger.warn('[traffic-aggregator] Failed to aggregate from traffic_log:', err);
  }

  return result;
}

/**
 * Guarda o actualiza un resumen diario de tráfico en traffic_daily.
 * Función idempotente; no borra traffic_log.
 */
export async function saveTrafficDailySummary(
  db: Firestore,
  date: string,
  slug: string,
  summary: Partial<TrafficDailySummary>,
): Promise<void> {
  const ref = db.collection(TRAFFIC_DAILY).doc(date).collection('articles').doc(slug);
  const payload: Partial<TrafficDailySummary> = {
    ...summary,
    updatedAt: new Date().toISOString(),
  };
  await ref.set(payload, { merge: true });
}

/**
 * Incrementa el contador de vistas de traffic_daily para un artículo.
 * Diseñada para dual-write junto con traffic_log.
 */
export async function incrementTrafficDaily(
  db: Firestore,
  slug: string,
  source: string,
  device: 'mobile' | 'desktop' | 'tablet' | 'unknown',
): Promise<void> {
  const date = new Date().toISOString().split('T')[0];
  const ref = db.collection(TRAFFIC_DAILY).doc(date).collection('articles').doc(slug);

  try {
    await ref.set(
      {
        slug,
        date,
        views: FieldValue.increment(1),
        [`sources.${source}`]: FieldValue.increment(1),
        [`devices.${device}`]: FieldValue.increment(1),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (err) {
    logger.warn('[traffic-aggregator] Failed to increment traffic_daily:', err);
  }
}

function detectDevice(userAgent?: string): 'mobile' | 'desktop' | 'tablet' | 'unknown' {
  const ua = (userAgent || '').toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  if (ua.includes('mac') || ua.includes('windows') || ua.includes('linux')) return 'desktop';
  return 'unknown';
}

/**
 * Genera el reporte de performance de tráfico para NIOS.
 * Combina traffic_daily + traffic_log como fallback.
 */
export async function generateTrafficPerformance(
  db: Firestore,
  days = 7,
  topN = 20,
): Promise<TrafficPerformance> {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    dates.push(d.toISOString().split('T')[0]);
  }

  const dailyMap: Record<string, Record<string, TrafficDailySummary>> = {};

  for (const date of dates) {
    let summary = await getTrafficDailySummary(db, date);
    if (Object.keys(summary).length === 0) {
      summary = await aggregateTrafficFromLog(db, date);
    }
    dailyMap[date] = summary;
  }

  const merged: Record<string, { slug: string; views: number; sources: Record<string, number> }> = {};
  const dailyGrowth: Record<string, number> = {};
  const topSources: Record<string, number> = {};

  for (const date of dates) {
    const summary = dailyMap[date];
    let dayTotal = 0;
    for (const slug of Object.keys(summary)) {
      const s = summary[slug];
      dayTotal += s.views;
      const entry = merged[slug] || { slug, views: 0, sources: {} };
      entry.views += s.views;
      for (const [k, v] of Object.entries(s.sources || {})) {
        entry.sources[k] = (entry.sources[k] || 0) + v;
        topSources[k] = (topSources[k] || 0) + v;
      }
      merged[slug] = entry;
    }
    dailyGrowth[date] = dayTotal;
  }

  const topArticles = Object.values(merged)
    .sort((a, b) => b.views - a.views)
    .slice(0, topN);

  const weeklyTrend: Record<string, number> = {};
  // Agrupar por semana ISO aproximada
  for (const [date, total] of Object.entries(dailyGrowth)) {
    const d = new Date(date);
    const week = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
    weeklyTrend[week] = (weeklyTrend[week] || 0) + total;
  }

  return {
    topArticles,
    topSources,
    dailyGrowth,
    weeklyTrend,
    generatedAt: new Date().toISOString(),
  };
}
