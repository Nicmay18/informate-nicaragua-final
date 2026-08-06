/**
 * NIOS Intelligence Platform — GSC Collector
 * ===========================================
 * Obtiene datos reales de Google Search Console API.
 * Nada se estima. Nada se inventa. Todo viene de la API oficial de Google.
 *
 * Requiere:
 * - Site URL verificada en GSC
 * - Service Account con acceso a GSC (mismo Firebase SA)
 */

import { logger } from '@/lib/logger';
import type {
  GSCSnapshot,
  GSCDataRow,
  GSCQueryRow,
  GSCCountryRow,
  GSCDeviceRow,
} from './types';

async function getAuthClient() {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';

  if (!privateKey || !clientEmail) {
    throw new Error('[gsc-collector] Credenciales de Firebase no configuradas');
  }

  const { google } = await import('googleapis');
  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
}

interface GSCRawRow {
  keys: string[];
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

async function runQuery(
  auth: any,
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimensions: string[],
  type: 'web' | 'discover' | 'news' = 'web',
  rowLimit = 1000,
): Promise<GSCRawRow[]> {
  try {
    const { google } = await import('googleapis');
    const searchconsole = google.searchconsole('v1');
    const res = await searchconsole.searchanalytics.query({
      auth,
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions,
        type,
        rowLimit,
      },
    });

    return (res.data.rows || []) as unknown as GSCRawRow[];
  } catch (err) {
    logger.warn(`[gsc-collector] Error query dimensions=${dimensions.join(',')}, type=${type}:`, err);
    return [];
  }
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Recolecta el snapshot completo de GSC para un rango de fechas.
 */
export async function collectGSC(
  siteUrl: string,
  daysToCollect = 28,
): Promise<GSCSnapshot | null> {
  const auth = await getAuthClient();
  const endDate = formatDate(new Date());
  const startDateRaw = new Date(Date.now() - daysToCollect * 24 * 60 * 60 * 1000);
  const startDate = formatDate(startDateRaw);

  logger.info(`[gsc-collector] Collecting GSC data for ${siteUrl} from ${startDate} to ${endDate}`);

  // 1. Páginas (URLs)
  const pageRows = await runQuery(auth, siteUrl, startDate, endDate, ['page']);
  const pages: GSCDataRow[] = pageRows.map((r) => ({
    url: r.keys[0],
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: Number((r.ctr * 100).toFixed(2)),
    position: Number(r.position.toFixed(1)),
  }));

  // 2. Consultas (queries)
  const queryRows = await runQuery(auth, siteUrl, startDate, endDate, ['query']);
  const queries: GSCQueryRow[] = queryRows.map((r) => ({
    query: r.keys[0],
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: Number((r.ctr * 100).toFixed(2)),
    position: Number(r.position.toFixed(1)),
  }));

  // 3. Países
  const countryRows = await runQuery(auth, siteUrl, startDate, endDate, ['country']);
  const countries: GSCCountryRow[] = countryRows.map((r) => ({
    country: r.keys[0],
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: Number((r.ctr * 100).toFixed(2)),
    position: Number(r.position.toFixed(1)),
  }));

  // 4. Dispositivos
  const deviceRows = await runQuery(auth, siteUrl, startDate, endDate, ['device']);
  const devices: GSCDeviceRow[] = deviceRows.map((r) => ({
    device: r.keys[0] as 'mobile' | 'desktop' | 'tablet',
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: Number((r.ctr * 100).toFixed(2)),
    position: Number(r.position.toFixed(1)),
  }));

  // 5. Discover (si existe)
  const discoverRows = await runQuery(auth, siteUrl, startDate, endDate, ['page'], 'discover');
  const discover: GSCDataRow[] = discoverRows.map((r) => ({
    url: r.keys[0],
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: Number((r.ctr * 100).toFixed(2)),
    position: Number(r.position.toFixed(1)),
  }));

  // 6. Google News (si existe)
  const newsRows = await runQuery(auth, siteUrl, startDate, endDate, ['page'], 'news');
  const googleNews: GSCDataRow[] = newsRows.map((r) => ({
    url: r.keys[0],
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: Number((r.ctr * 100).toFixed(2)),
    position: Number(r.position.toFixed(1)),
  }));

  // 7. Top queries por página (para las top 50 páginas)
  const topPageUrls = pages.slice(0, 50).map((p) => p.url);
  const pageQueriesMap = new Map<string, GSCQueryRow[]>();

  for (const url of topPageUrls) {
    try {
      const { google } = await import('googleapis');
      const searchconsole = google.searchconsole('v1');
      const res = await searchconsole.searchanalytics.query({
        auth,
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['query'],
          type: 'web',
          dimensionFilterGroups: [{
            filters: [{ dimension: 'page', operator: 'equals', expression: url }],
          }],
          rowLimit: 10,
        },
      });

      const rows = (res.data.rows || []) as unknown as GSCRawRow[];
      pageQueriesMap.set(url, rows.map((r) => ({
        query: r.keys[0],
        impressions: r.impressions,
        clicks: r.clicks,
        ctr: Number((r.ctr * 100).toFixed(2)),
        position: Number(r.position.toFixed(1)),
      })));
    } catch {
      pageQueriesMap.set(url, []);
    }
  }

  // Totales
  const totalImpressions = pages.reduce((s, p) => s + p.impressions, 0);
  const totalClicks = pages.reduce((s, p) => s + p.clicks, 0);
  const avgCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
  const avgPosition = pages.length > 0
    ? Number((pages.reduce((s, p) => s + p.position * p.impressions, 0) / totalImpressions).toFixed(1))
    : 0;

  const snapshot: GSCSnapshot = {
    date: formatDate(new Date()),
    collectedAt: new Date().toISOString(),
    siteUrl,
    dateRange: { start: startDate, end: endDate },
    totalImpressions,
    totalClicks,
    avgCtr,
    avgPosition,
    pages,
    queries,
    countries,
    devices,
    discover: discover.length > 0 ? discover : undefined,
    googleNews: googleNews.length > 0 ? googleNews : undefined,
  };

  // Adjuntar top queries a páginas
  (snapshot as any).pageQueries = Object.fromEntries(pageQueriesMap);

  logger.info(`[gsc-collector] Collected: ${pages.length} pages, ${queries.length} queries, ${totalImpressions} impressions, ${totalClicks} clicks`);

  return snapshot;
}

/**
 * Obtiene las top queries para una URL específica.
 */
export async function getQueriesForPage(
  siteUrl: string,
  pageUrl: string,
  daysToCollect = 28,
): Promise<GSCQueryRow[]> {
  const auth = getAuthClient();
  const endDate = formatDate(new Date());
  const startDate = formatDate(new Date(Date.now() - daysToCollect * 24 * 60 * 60 * 1000));

  const rows = await runQueryWithFilter(auth, siteUrl, startDate, endDate, 'page', pageUrl);
  return rows.map((r) => ({
    query: r.keys[0],
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: Number((r.ctr * 100).toFixed(2)),
    position: Number(r.position.toFixed(1)),
  }));
}

async function runQueryWithFilter(
  auth: any,
  siteUrl: string,
  startDate: string,
  endDate: string,
  filterDimension: string,
  filterValue: string,
): Promise<GSCRawRow[]> {
  try {
    const { google } = await import('googleapis');
    const searchconsole = google.searchconsole('v1');
    const res = await searchconsole.searchanalytics.query({
      auth,
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        type: 'web',
        dimensionFilterGroups: [{
          filters: [{ dimension: filterDimension, operator: 'equals', expression: filterValue }],
        }],
        rowLimit: 10,
      },
    });
    return (res.data.rows || []) as unknown as GSCRawRow[];
  } catch {
    return [];
  }
}
