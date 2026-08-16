/**
 * NIOS v2 Collector: Internal Traffic & Session Journeys
 *
 * Authority: Firestore `nios_telemetry` & `traffic_log`
 * Privacy: Aggregates anonymous events only. No PII.
 */

import type { JourneyEvent, TrafficSource, DeviceCategory } from '@/lib/contracts';
import { logger } from '@/lib/logger';

export interface InternalTelemetrySummary {
  periodDays: number;
  totalEvents: number;
  uniqueSessions: number;
  recirculationRate: number; // percentage of sessions with > 1 article view
  deviceBreakdown: Record<DeviceCategory, number>;
  sourceBreakdown: Record<TrafficSource, number>;
  topArticlesByViews: { slug: string; views: number }[];
  topSearches: { query: string; count: number }[];
  collectedAt: string;
}

export interface InternalStore {
  collection(name: string): {
    orderBy(field: string, direction?: 'asc' | 'desc'): {
      limit(n: number): {
        get(): Promise<{ docs: { data(): Record<string, unknown> }[] }>;
      };
    };
  };
}

export async function collectInternalTelemetry(
  store: InternalStore,
  limit = 1000
): Promise<InternalTelemetrySummary> {
  const now = new Date().toISOString();
  try {
    const snap = await store
      .collection('nios_telemetry')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const events = snap.docs.map(d => d.data() as unknown as JourneyEvent);

    if (events.length === 0) {
      return {
        periodDays: 7,
        totalEvents: 0,
        uniqueSessions: 0,
        recirculationRate: 0,
        deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0, unknown: 0 },
        sourceBreakdown: { direct: 0, organic: 0, social: 0, referral: 0, search: 0, unknown: 0 },
        topArticlesByViews: [],
        topSearches: [],
        collectedAt: now,
      };
    }

    const sessions = new Map<string, JourneyEvent[]>();
    const articleViews = new Map<string, number>();
    const searches = new Map<string, number>();
    const devices: Record<DeviceCategory, number> = { mobile: 0, desktop: 0, tablet: 0, unknown: 0 };
    const sources: Record<TrafficSource, number> = { direct: 0, organic: 0, social: 0, referral: 0, search: 0, unknown: 0 };

    for (const ev of events) {
      if (ev.sessionId) {
        const list = sessions.get(ev.sessionId) || [];
        list.push(ev);
        sessions.set(ev.sessionId, list);
      }

      if (ev.type === 'ARTICLE_VIEW' && ev.articleSlug) {
        articleViews.set(ev.articleSlug, (articleViews.get(ev.articleSlug) || 0) + 1);
      }

      if (ev.type === 'SEARCH' && ev.metadata?.query) {
        const q = (ev.metadata.query as string).toLowerCase().trim();
        if (q) searches.set(q, (searches.get(q) || 0) + 1);
      }

      const dev: DeviceCategory = ev.device || 'unknown';
      devices[dev] = (devices[dev] || 0) + 1;

      const src: TrafficSource = ev.source || 'unknown';
      sources[src] = (sources[src] || 0) + 1;
    }

    let sessionsWithMultipleArticles = 0;
    for (const [, evList] of sessions.entries()) {
      const distinctArticles = new Set(
        evList.filter(e => e.type === 'ARTICLE_VIEW' && e.articleSlug).map(e => e.articleSlug)
      );
      if (distinctArticles.size > 1) {
        sessionsWithMultipleArticles++;
      }
    }

    const recirculationRate = sessions.size > 0
      ? Math.round((sessionsWithMultipleArticles / sessions.size) * 1000) / 10
      : 0;

    const topArticlesByViews = Array.from(articleViews.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([slug, views]) => ({ slug, views }));

    const topSearches = Array.from(searches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    return {
      periodDays: 7,
      totalEvents: events.length,
      uniqueSessions: sessions.size,
      recirculationRate,
      deviceBreakdown: devices,
      sourceBreakdown: sources,
      topArticlesByViews,
      topSearches,
      collectedAt: now,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal telemetry error';
    logger.error('[nios-internal] Telemetry collection failed:', msg);
    return {
      periodDays: 7,
      totalEvents: 0,
      uniqueSessions: 0,
      recirculationRate: 0,
      deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0, unknown: 0 },
      sourceBreakdown: { direct: 0, organic: 0, social: 0, referral: 0, search: 0, unknown: 0 },
      topArticlesByViews: [],
      topSearches: [],
      collectedAt: now,
    };
  }
}
