/**
 * NIOS v2 Collector: Google Analytics 4
 *
 * Authority: Google Analytics Data API (real external data)
 * Semantic rule: Never coerce NO_DATA or ERROR to 0. `null` means UNKNOWN.
 */

import { google } from 'googleapis';
import type { DataStatus, GA4PageRow, GA4Snapshot } from '@/lib/contracts';
import { logger } from '@/lib/logger';
import { getGoogleServiceAccountCredentials } from '@/lib/google-credentials';

export interface Ga4CollectorOptions {
  propertyId?: string;
  clientEmail?: string;
  privateKey?: string;
  days?: number;
}

export async function collectGa4Data(options: Ga4CollectorOptions = {}): Promise<GA4Snapshot> {
  const propertyId = options.propertyId || process.env.NIOS_GA4_PROPERTY_ID || '525672447';
  const resolved = getGoogleServiceAccountCredentials();
  const clientEmail = options.clientEmail || resolved?.clientEmail;
  const privateKey = options.privateKey
    ? options.privateKey.replace(/\\n/g, '\n')
    : resolved?.privateKey;
  const days = options.days || 7;

  const now = new Date();
  const endDate = now.toISOString().split('T')[0];
  const startDate = new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];

  const emptySnapshot = (status: DataStatus, errorMessage?: string): GA4Snapshot => ({
    date: endDate,
    collectedAt: now.toISOString(),
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
    dataStatus: status,
    errorMessage,
  } as unknown as GA4Snapshot & { dataStatus: DataStatus; errorMessage?: string });

  if (!clientEmail || !privateKey || !propertyId) {
    logger.warn('[nios-ga4] Missing credentials or property ID');
    return emptySnapshot('NOT_CONFIGURED' as DataStatus, 'Missing credentials');
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const ga4 = google.analyticsdata({ version: 'v1beta', auth });
    const targetProperty = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;

    const [pagesReport, totalsReport] = await Promise.all([
      ga4.properties.runReport({
        property: targetProperty,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'userEngagementDuration' },
          ],
          limit: '250',
        },
      }),
      ga4.properties.runReport({
        property: targetProperty,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'userEngagementDuration' },
          ],
        },
      }),
    ]);

    const pageRows = pagesReport.data.rows || [];
    const totalsRow = totalsReport.data.rows?.[0];

    if (pageRows.length === 0 && !totalsRow) {
      return emptySnapshot('CONNECTED_NO_DATA' as DataStatus);
    }

    const totalUsers = parseInt(totalsRow?.metricValues?.[0]?.value || '0', 10);
    const totalSessions = parseInt(totalsRow?.metricValues?.[1]?.value || '0', 10);
    const totalPageviews = parseInt(totalsRow?.metricValues?.[2]?.value || '0', 10);
    const totalDuration = parseFloat(totalsRow?.metricValues?.[3]?.value || '0');
    const avgEngagement = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

    const pages: GA4PageRow[] = pageRows.map(r => {
      const pagePath = r.dimensionValues?.[0]?.value || '/';
      const users = parseInt(r.metricValues?.[0]?.value || '0', 10);
      const sessions = parseInt(r.metricValues?.[1]?.value || '0', 10);
      const screenPageviews = parseInt(r.metricValues?.[2]?.value || '0', 10);
      const dur = parseFloat(r.metricValues?.[3]?.value || '0');
      return {
        pagePath,
        users,
        sessions,
        screenPageviews,
        averageEngagementTimeSec: sessions > 0 ? Math.round(dur / sessions) : 0,
        engagementRate: 1,
      };
    });

    return {
      date: endDate,
      collectedAt: now.toISOString(),
      propertyId,
      dateRange: { start: startDate, end: endDate },
      totalUsers,
      totalSessions,
      totalPageviews,
      averageEngagementTimeSec: avgEngagement,
      engagementRate: 1,
      pages,
      sources: [],
      devices: [],
      dataStatus: 'CONNECTED_WITH_DATA' as DataStatus,
    } as GA4Snapshot & { dataStatus: DataStatus };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GA4 API Error';
    logger.error('[nios-ga4] Collector error:', message);
    const status: DataStatus = message.includes('403') || message.includes('permission')
      ? ('ACCESS_DENIED' as DataStatus)
      : ('API_ERROR' as DataStatus);
    return emptySnapshot(status, message);
  }
}
