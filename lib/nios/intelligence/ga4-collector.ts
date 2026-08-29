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
    logger.error(`[ga4-collector] Error running report dimensions=${dimensions.join(',')}:`, err);
    throw err;
  }
}

/**
 * Recolecta el snapshot completo de GA4 para un rango de fechas.
 */
function emptySnapshot(
  propertyId: string,
  startDate: string,
  endDate: string,
  status: 'NO_DATA' | 'ACCESS_BLOCKED' | 'CONFIG_REQUIRED' | 'INVALID_CONFIGURATION' | 'TIMEOUT' | 'NETWORK_ERROR',
  errorMessage?: string,
): GA4Snapshot {
  return {
    date: formatDate(new Date()),
    collectedAt: new Date().toISOString(),
    propertyId,
    dateRange: { start: startDate, end: endDate },
    totalUsers: 0,
    totalSessions: 0,
    totalPageviews: 0,
    averageEngagementTimeSec: 0,
    engagementRate: 0,
    pages: [],
    sources: [],
    devices: [],
    status,
    errorMessage,
  };
}

export async function collectGA4(
  propertyId: string,
  daysToCollect = 28,
): Promise<GA4Snapshot> {
  const endDate = formatDate(new Date());
  const startDate = formatDate(new Date(Date.now() - daysToCollect * 24 * 60 * 60 * 1000));

  if (!propertyId) {
    logger.warn('[ga4-collector] No GA4 property ID configured');
    return emptySnapshot(
      '',
      startDate,
      endDate,
      'CONFIG_REQUIRED',
      'NIOS_GA4_PROPERTY_ID no está configurada.',
    );
  }

  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';
  const projectId = process.env.FIREBASE_PROJECT_ID || '';

  if (!clientEmail || !privateKey || !projectId) {
    logger.warn('[ga4-collector] Firebase service account not configured');
    return emptySnapshot(
      propertyId,
      startDate,
      endDate,
      'CONFIG_REQUIRED',
      'FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY o FIREBASE_PROJECT_ID no están configurados. NIOS no puede autenticar GA4.',
    );
  }

  const timeoutMs = 15000;
  logger.info(`[ga4-collector] Collecting GA4 data for property ${propertyId} from ${startDate} to ${endDate}`);

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('GA4_TIMEOUT')), timeoutMs),
    );

    const collectionPromise = (async () => {
      const client = getAnalyticsClient();

      // 1. Totales (sin dimensiones)
      const totalRows = await runReport(
        client, propertyId, startDate, endDate,
        [], ['totalUsers', 'sessions', 'screenPageViews', 'averageEngagementTime', 'engagementRate'],
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
        ['screenPageViews', 'totalUsers', 'sessions', 'averageEngagementTime', 'engagementRate'],
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
        source: r.dimensionValues[0]?.value || 'unknown',
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
        device: (r.dimensionValues[0]?.value || 'unknown') as 'mobile' | 'desktop' | 'tablet' | 'unknown',
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

      snapshot.status = pages.length > 0 || totalUsers > 0 ? 'REAL' : 'CONNECTED_NO_DATA';

      logger.info(`[ga4-collector] Collected: ${totalUsers} users, ${totalSessions} sessions, ${pages.length} pages`);

      return snapshot;
    })();

    return await Promise.race([collectionPromise, timeoutPromise]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[ga4-collector] Collection failed:', message);
    const status = message === 'GA4_TIMEOUT' || /\btimeout\b/i.test(message)
      ? 'TIMEOUT'
      : /\b(403|permission|unauthorized|insufficient)\b/i.test(message)
        ? 'ACCESS_BLOCKED'
        : /INVALID_ARGUMENT|invalid argument|not found/i.test(message)
          ? 'INVALID_CONFIGURATION'
          : /\b(ETIMEDOUT|ECONNRESET|ENOTFOUND|socket hang up|unreachable|network)\b/i.test(message)
            ? 'NETWORK_ERROR'
            : 'NO_DATA';
    const errorMessage = status === 'TIMEOUT'
      ? `GA4 no respondió en ${timeoutMs}ms. La propiedad ${propertyId} está lenta o inaccesible ahora. Reintentar más tarde.`
      : status === 'NETWORK_ERROR'
        ? `Error de red conectando a GA4: ${message}. Verificar conectividad y reintentar.`
        : status === 'ACCESS_BLOCKED'
          ? `Acceso bloqueado a GA4. Verifica que la cuenta de servicio tenga permisos de lectura sobre la propiedad ${propertyId}.`
          : status === 'INVALID_CONFIGURATION'
            ? `Configuración inválida de GA4: ${message}. Verifica NIOS_GA4_PROPERTY_ID y credenciales.`
            : message;
    return emptySnapshot(propertyId, startDate, endDate, status, errorMessage);
  }
}
