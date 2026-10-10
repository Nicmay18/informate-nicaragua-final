import { getISOWeek, getYear } from 'date-fns';
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

const CANONICAL_TRAFFIC_SOURCES = [
  'google',
  'facebook',
  'telegram',
  'whatsapp',
  'direct',
  'referral',
  'other',
  'unknown',
] as const;

export type TrafficSource = (typeof CANONICAL_TRAFFIC_SOURCES)[number];

const SOURCE_PATTERNS: Record<string, TrafficSource> = {
  google: 'google',
  gsearch: 'google',
  organic: 'google',
  search: 'google',
  googlediscover: 'google',
  facebook: 'facebook',
  fb: 'facebook',
  telegram: 'telegram',
  tme: 'telegram',
  whatsapp: 'whatsapp',
  wa: 'whatsapp',
  direct: 'direct',
  directo: 'direct',
  none: 'direct',
  referral: 'referral',
  referrer: 'referral',
};

function normalizeTrafficSource(raw?: string | null): TrafficSource {
  if (!raw || typeof raw !== 'string') return 'unknown';
  const trimmed = raw.trim().toLowerCase();
  if (CANONICAL_TRAFFIC_SOURCES.some(s => s === trimmed)) return trimmed as TrafficSource;
  const key = trimmed.replace(/[^a-z0-9]/g, '');
  if (key === '') return 'direct';
  return SOURCE_PATTERNS[key] ?? 'other';
}

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
      const source = normalizeTrafficSource(data.source);
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
  const dayRef = db.collection(TRAFFIC_DAILY).doc(date);
  const ref = dayRef.collection('articles').doc(slug);
  const updatedAt = new Date().toISOString();
  const payload: Partial<TrafficDailySummary> = {
    ...summary,
    updatedAt,
  };
  const batch = db.batch();
  // El doc padre traffic_daily/{date} se materializa (firestore.rules ya lo
  // permite: hasOnly(['updatedAt'])). Sin él el padre queda como documento
  // fantasma y cualquier lectura a nivel colección (collection.get(),
  // queries por campo, vista raíz de Firebase Console) reporta traffic_daily
  // vacío aunque la subcolección articles esté poblada.
  batch.set(dayRef, { updatedAt }, { merge: true });
  batch.set(ref, payload, { merge: true });
  await batch.commit();
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
  const dayRef = db.collection(TRAFFIC_DAILY).doc(date);
  const ref = dayRef.collection('articles').doc(slug);
  const normalizedSource = normalizeTrafficSource(source);
  const updatedAt = new Date().toISOString();

  try {
    const batch = db.batch();
    // Materializa el doc padre (ver saveTrafficDailySummary): evita que el
    // padre quede fantasma y la colección parezca vacía a nivel raíz.
    batch.set(dayRef, { updatedAt }, { merge: true });
    batch.set(
      ref,
      {
        slug,
        date,
        views: FieldValue.increment(1),
        [`sources.${normalizedSource}`]: FieldValue.increment(1),
        [`devices.${device}`]: FieldValue.increment(1),
        updatedAt,
      },
      { merge: true },
    );
    await batch.commit();
  } catch (err) {
    // logger.warn es silencioso en producción: un fallo aquí no dejaba rastro
    // ni en consola ni en Sentry, ocultando exactamente la clase de error que
    // vaciaría traffic_daily sin síntomas.
    logger.error('[traffic-aggregator] Failed to increment traffic_daily:', err);
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
  // Agrupar por semana ISO real
  for (const [date, total] of Object.entries(dailyGrowth)) {
    const d = new Date(`${date}T00:00:00Z`);
    const week = `${getYear(d)}-W${getISOWeek(d).toString().padStart(2, '0')}`;
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
