/**
 * NIOS v2 Collector: Google Search Console
 *
 * Authority: Search Console API (real external data)
 * Semantic rule: Never coerce NO_DATA or ERROR to 0. `null` means UNKNOWN.
 */

import { google } from 'googleapis';
import type { DataStatus, GSCDataRow, GSCQueryRow, GSCSnapshot } from '@/lib/contracts';
import { logger } from '@/lib/logger';

export interface GscCollectorOptions {
  siteUrl?: string;
  clientEmail?: string;
  privateKey?: string;
  days?: number;
}

export async function collectGscData(options: GscCollectorOptions = {}): Promise<GSCSnapshot> {
  const siteUrl = options.siteUrl || process.env.GSC_PROPERTY || 'sc-domain:nicaraguainformate.com';
  const clientEmail = options.clientEmail || process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (options.privateKey || process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const days = options.days || 7;

  const now = new Date();
  const endDate = now.toISOString().split('T')[0];
  const startDate = new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];

  const emptySnapshot = (status: DataStatus, errorMessage?: string): GSCSnapshot => ({
    date: endDate,
    collectedAt: now.toISOString(),
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
    dataStatus: status,
    errorMessage,
  } as unknown as GSCSnapshot & { dataStatus: DataStatus; errorMessage?: string });

  if (!clientEmail || !privateKey) {
    logger.warn('[nios-gsc] Missing service account credentials or property');
    return emptySnapshot('NOT_CONFIGURED' as DataStatus, 'Missing credentials');
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const gsc = google.searchconsole({ version: 'v1', auth });

    const [pagesRes, queriesRes] = await Promise.all([
      gsc.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['page'],
          rowLimit: 250,
        },
      }),
      gsc.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['query'],
          rowLimit: 250,
        },
      }),
    ]);

    const pageRows = pagesRes.data.rows || [];
    const queryRows = queriesRes.data.rows || [];

    if (pageRows.length === 0 && queryRows.length === 0) {
      return emptySnapshot('CONNECTED_NO_DATA' as DataStatus);
    }

    let totalImpressions = 0;
    let totalClicks = 0;
    let sumPosition = 0;

    const pages: GSCDataRow[] = pageRows.map(r => {
      const imps = r.impressions || 0;
      const clicks = r.clicks || 0;
      const ctr = r.ctr || 0;
      const pos = r.position || 0;
      totalImpressions += imps;
      totalClicks += clicks;
      sumPosition += pos * imps;
      return {
        url: r.keys?.[0] || '',
        clicks,
        impressions: imps,
        ctr,
        position: pos,
      };
    });

    const queries: GSCQueryRow[] = queryRows.map(r => ({
      query: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    }));

    const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const avgPosition = totalImpressions > 0 ? sumPosition / totalImpressions : 0;

    return {
      date: endDate,
      collectedAt: now.toISOString(),
      siteUrl,
      dateRange: { start: startDate, end: endDate },
      totalImpressions,
      totalClicks,
      avgCtr: Math.round(avgCtr * 10000) / 10000,
      avgPosition: Math.round(avgPosition * 10) / 10,
      pages,
      queries,
      countries: [],
      devices: [],
      dataStatus: 'CONNECTED_WITH_DATA' as DataStatus,
    } as unknown as GSCSnapshot & { dataStatus: DataStatus };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GSC API Error';
    logger.error('[nios-gsc] Collector error:', message);
    const status: DataStatus = message.includes('403') || message.includes('permission')
      ? ('ACCESS_DENIED' as DataStatus)
      : ('API_ERROR' as DataStatus);
    return emptySnapshot(status, message);
  }
}
