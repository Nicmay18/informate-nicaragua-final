/**
 * NIOS Intelligence Platform — GA4 Collector
 * ===========================================
 * Obtiene datos reales de Google Analytics 4 Data API.
 * Nada se estima. Nada se inventa. Todo viene de la API oficial de Google.
 *
 * Requiere:
 * - GA4 Property ID (numérico)
 * - Service Account con acceso a GA4 (añadir como usuario en GA4)
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { logger } from '@/lib/logger';
import type {
  GA4Snapshot,
  GA4PageRow,
  GA4SourceRow,
  GA4DeviceRow,
} from './types';

function getAnalyticsClient(): BetaAnalyticsDataClient {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';
  const projectId = process.env.FIREBASE_PROJECT_ID || '';

  if (!privateKey || !clientEmail || !projectId) {
    throw new Error('[ga4-collector] Credenciales de Firebase no configuradas');
  }

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    projectId,
  });
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

interface GA4ReportRow {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
}

/**
 * Ejecuta un reporte de GA4 y retorna las filas procesadas.
 */
async function runReport(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  startDate: string,
  endDate: string,
  dimensions: string[],
  metrics: string[],
  limit = 100,
): Promise<GA4ReportRow[]> {
  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: dimensions.map((name) => ({ name })),
      metrics: metrics.map((name) => ({ name })),
      limit,
    });

    return (response.rows || []) as unknown as GA4ReportRow[];
  } catch (err) {
    logger.warn(`[ga4-collector] Error running report dimensions=${dimensions.join(',')}:`, err);
    return [];
  }
}

/**
 * Recolecta el snapshot completo de GA4 para un rango de fechas.
 */
export async function collectGA4(
  propertyId: string,
  daysToCollect = 28,
): Promise<GA4Snapshot | null> {
  if (!propertyId) {
    logger.warn('[ga4-collector] No GA4 property ID configured');
    return null;
  }

  const client = getAnalyticsClient();
  const endDate = formatDate(new Date());
  const startDate = formatDate(new Date(Date.now() - daysToCollect * 24 * 60 * 60 * 1000));

  logger.info(`[ga4-collector] Collecting GA4 data for property ${propertyId} from ${startDate} to ${endDate}`);

  // 1. Totales (sin dimensiones)
  const totalRows = await runReport(
    client, propertyId, startDate, endDate,
    [], ['totalUsers', 'sessions', 'screenPageViews', 'averageEngagementTimePerUser', 'engagementRate'],
    1,
  );

  const totals = totalRows[0]?.metricValues || [];
  const totalUsers = parseInt(totals[0]?.value || '0', 10);
  const totalSessions = parseInt(totals[1]?.value || '0', 10);
  const totalPageviews = parseInt(totals[2]?.value || '0', 10);
  const averageEngagementTimeSec = parseFloat(totals[3]?.value || '0');
  const engagementRate = parseFloat(totals[4]?.value || '0');

  // 2. Páginas (top 100)
  const pageRows = await runReport(
    client, propertyId, startDate, endDate,
    ['pagePath'],
    ['screenPageViews', 'totalUsers', 'sessions', 'averageEngagementTimePerUser', 'engagementRate'],
    100,
  );

  const pages: GA4PageRow[] = pageRows.map((r) => ({
    pagePath: r.dimensionValues[0]?.value || '',
    screenPageviews: parseInt(r.metricValues[0]?.value || '0', 10),
    users: parseInt(r.metricValues[1]?.value || '0', 10),
    sessions: parseInt(r.metricValues[2]?.value || '0', 10),
    averageEngagementTimeSec: parseFloat(r.metricValues[3]?.value || '0'),
    engagementRate: parseFloat(r.metricValues[4]?.value || '0'),
  }));

  // 3. Fuentes de tráfico
  const sourceRows = await runReport(
    client, propertyId, startDate, endDate,
    ['sessionSource'],
    ['totalUsers', 'sessions', 'screenPageViews', 'engagementRate'],
    50,
  );

  const sources: GA4SourceRow[] = sourceRows.map((r) => ({
    source: r.dimensionValues[0]?.value || 'directo',
    users: parseInt(r.metricValues[0]?.value || '0', 10),
    sessions: parseInt(r.metricValues[1]?.value || '0', 10),
    screenPageviews: parseInt(r.metricValues[2]?.value || '0', 10),
    engagementRate: parseFloat(r.metricValues[3]?.value || '0'),
  }));

  // 4. Dispositivos
  const deviceRows = await runReport(
    client, propertyId, startDate, endDate,
    ['deviceCategory'],
    ['totalUsers', 'sessions'],
    10,
  );

  const devices: GA4DeviceRow[] = deviceRows.map((r) => ({
    device: (r.dimensionValues[0]?.value || 'mobile') as 'mobile' | 'desktop' | 'tablet',
    users: parseInt(r.metricValues[0]?.value || '0', 10),
    sessions: parseInt(r.metricValues[1]?.value || '0', 10),
  }));

  const snapshot: GA4Snapshot = {
    date: formatDate(new Date()),
    collectedAt: new Date().toISOString(),
    propertyId,
    dateRange: { start: startDate, end: endDate },
    totalUsers,
    totalSessions,
    totalPageviews,
    averageEngagementTimeSec,
    engagementRate,
    pages,
    sources,
    devices,
  };

  logger.info(`[ga4-collector] Collected: ${totalUsers} users, ${totalSessions} sessions, ${pages.length} pages`);

  return snapshot;
}
