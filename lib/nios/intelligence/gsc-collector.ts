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
import { getGoogleServiceAccountCredentials } from '@/lib/google-credentials';
import type {
  NiosDataStatus,
  GSCSnapshot,
  GSCDataRow,
  GSCQueryRow,
  GSCCountryRow,
  GSCDeviceRow,
} from './types';

async function getAuthClient() {
  const credentials = getGoogleServiceAccountCredentials();

  if (!credentials) {
    throw new Error('[gsc-collector] Credenciales de Firebase no configuradas');
  }

  const { google } = await import('googleapis');
  return new google.auth.JWT({
    email: credentials.clientEmail,
    key: credentials.privateKey,
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
    const message = err instanceof Error ? err.message : String(err);
    const data = (err as any)?.response?.data;
    const dataText = data ? JSON.stringify(data) : '';
    const combined = `${message} ${dataText}`;
    if (/\b(403|permission|unauthorized|insufficient)\b/i.test(combined)) {
      logger.error(`[gsc-collector] Access blocked: ${message}`);
      throw err;
    }
    if (/\b(invalid|jwt|signature|malformed|key|credential|invalid_grant)\b/i.test(combined)) {
      logger.error(`[gsc-collector] Invalid configuration: ${message}`);
      throw err;
    }
    if (/\b(timeout|ETIMEDOUT|ECONNRESET|ENOTFOUND|socket hang up|unreachable|network)\b/i.test(message)) {
      throw err;
    }
    logger.warn(`[gsc-collector] Error query dimensions=${dimensions.join(',')}, type=${type}: ${message}`);
    return [];
  }
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Recolecta el snapshot completo de GSC para un rango de fechas.
 */
function emptySnapshot(
  siteUrl: string,
  startDate: string,
  endDate: string,
  status: NiosDataStatus,
  errorMessage?: string,
): GSCSnapshot {
  return {
    date: formatDate(new Date()),
    collectedAt: new Date().toISOString(),
    siteUrl,
    dateRange: { start: startDate, end: endDate },
    totalImpressions: 0,
    totalClicks: 0,
    avgCtr: 0,
    avgPosition: 0,
    pages: [],
    queries: [],
    countries: [],
    devices: [],
    status,
    errorMessage,
  };
}

export async function collectGSC(
  siteUrl: string,
  daysToCollect = 28,
): Promise<GSCSnapshot | null> {
  const endDate = formatDate(new Date());
  const startDate = formatDate(new Date(Date.now() - daysToCollect * 24 * 60 * 60 * 1000));

  if (!siteUrl) {
    logger.warn('[gsc-collector] No GSC site URL configured');
    return emptySnapshot(
      '',
      startDate,
      endDate,
      'CONFIG_REQUIRED',
      'NIOS_GSC_SITE_URL / NIOS_SITE_URL no está configurada.',
    );
  }

  const credentials = getGoogleServiceAccountCredentials();

  if (!credentials) {
    logger.warn('[gsc-collector] Firebase service account not configured');
    return emptySnapshot(
      siteUrl,
      startDate,
      endDate,
      'CONFIG_REQUIRED',
      'No hay credenciales de cuenta de servicio (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY o FIREBASE_SERVICE_ACCOUNT_BASE64). NIOS no puede autenticar GSC.',
    );
  }

  logger.info(`[gsc-collector] Collecting GSC data for ${siteUrl} from ${startDate} to ${endDate}`);

  const timeoutMs = 30000;
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('GSC_TIMEOUT')), timeoutMs),
  );

  try {
    const collectionPromise = (async () => {
      const auth = await getAuthClient();

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

    snapshot.status = pages.length > 0 || queries.length > 0 ? 'REAL' : 'CONNECTED_NO_DATA';

    logger.info(`[gsc-collector] Collected: ${pages.length} pages, ${queries.length} queries, ${totalImpressions} impressions, ${totalClicks} clicks`);

      return snapshot;
    })();

    return await Promise.race([collectionPromise, timeoutPromise]);
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : String(err);
    const data = (err as any)?.response?.data;
    const dataText = data ? JSON.stringify(data) : '';
    const combined = `${rawMessage} ${dataText}`;
    logger.error('[gsc-collector] Collection failed:', combined);
    const status = rawMessage === 'GSC_TIMEOUT' || /\btimeout\b/i.test(combined)
      ? 'TIMEOUT'
      : /\b(403|permission|unauthorized|insufficient)\b/i.test(combined)
        ? 'ACCESS_BLOCKED'
        : /\b(invalid|jwt|signature|malformed|key|credential|invalid_grant)\b/i.test(combined)
          ? 'INVALID_CONFIGURATION'
          : /\b(ETIMEDOUT|ECONNRESET|ENOTFOUND|socket hang up|unreachable|network)\b/i.test(combined)
            ? 'NETWORK_ERROR'
            : 'NO_DATA';
    const errorMessage = status === 'ACCESS_BLOCKED'
      ? `Acceso bloqueado. Cuenta utilizada: ${credentials.clientEmail || 'no configurada'}. ` +
        `Propiedad solicitada: ${siteUrl}. ` +
        `Permiso requerido: permiso de lectura en Google Search Console. ` +
        `Consecuencia: Google Trust, recomendaciones orgánicas y reportes CEO no pueden evaluarse con evidencia. ` +
        `Acción recomendada: agregar la cuenta de servicio ${credentials.clientEmail || 'FIREBASE_CLIENT_EMAIL'} ` +
        `como propietario o usuario de la propiedad ${siteUrl} en Search Console.`
      : status === 'INVALID_CONFIGURATION'
        ? `Credencial inválida para Google Search Console. Verifica las credenciales de la cuenta de servicio, SCOPES y permisos. Respuesta: ${dataText}`
        : rawMessage;
    return emptySnapshot(siteUrl, startDate, endDate, status, errorMessage);
  }
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
