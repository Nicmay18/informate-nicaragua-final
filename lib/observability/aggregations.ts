/**
 * Reader journey aggregation engine.
 * Computes real journey metrics from nios_telemetry without inventing data.
 * Reads events in time-bounded batches to control Firestore costs.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { JourneyEvent, SessionSummary, JourneyEventType } from './types';
import { createSession, recordEvent, summarizeSession } from './session';

const DEFAULT_WINDOW_HOURS = 24;
const MAX_BATCH_READS = 5000;

export interface JourneyMetrics {
  period: { from: string; to: string };
  sessions: number;
  pageViews: number;
  articleViews: number;
  categoryViews: number;
  searches: number;
  internalClicks: number;
  relatedClicks: number;
  outboundClicks: number;
  externalReferrals: number;
  avgPagesPerSession: number;
  avgArticlesPerSession: number;
  avgScrollDepth: number | null;
  avgEngagementMs: number;
  singlePageSessions: number;
  singlePageRate: number;
  topEntryPaths: { path: string; count: number }[];
  topExitPaths: { path: string; count: number }[];
  topRecirculationArticles: { slug: string; count: number }[];
  topSearchQueries: { query: string; count: number }[];
  dataStatus: 'DATA_AVAILABLE' | 'DATA_EMPTY' | 'ERROR' | 'UNKNOWN';
}

function parseTimestamp(ts: string): Date {
  return new Date(ts);
}

function eventToJourney(raw: Record<string, unknown>): JourneyEvent | null {
  if (!raw.type || typeof raw.type !== 'string') return null;
  const allowedTypes: JourneyEventType[] = [
    'SESSION_START', 'PAGE_VIEW', 'ARTICLE_VIEW', 'CATEGORY_VIEW', 'SEARCH',
    'INTERNAL_NAVIGATION', 'INTERNAL_CLICK', 'RELATED_CLICK', 'OUTBOUND_CLICK',
    'EXTERNAL_REFERRAL', 'ENGAGEMENT', 'SCROLL_50', 'SCROLL_90', 'SCROLL_DEPTH',
    'ERROR', 'SESSION_END',
  ];
  if (!allowedTypes.includes(raw.type as JourneyEventType)) return null;
  return {
    sessionId: typeof raw.sessionId === 'string' ? raw.sessionId : '',
    type: raw.type as JourneyEventType,
    timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : new Date().toISOString(),
    path: typeof raw.path === 'string' ? raw.path : '/',
    articleSlug: typeof raw.articleSlug === 'string' ? raw.articleSlug : undefined,
    referrer: typeof raw.referrer === 'string' ? raw.referrer : undefined,
    source: (typeof raw.source === 'string' ? raw.source : 'unknown') as JourneyEvent['source'],
    device: (typeof raw.device === 'string' ? raw.device : 'unknown') as JourneyEvent['device'],
    browser: typeof raw.browser === 'string' ? (raw.browser as JourneyEvent['browser']) : undefined,
    country: typeof raw.country === 'string' ? raw.country : undefined,
    durationMs: typeof raw.durationMs === 'number' ? raw.durationMs : undefined,
    metadata: typeof raw.metadata === 'object' && raw.metadata !== null && !Array.isArray(raw.metadata)
      ? raw.metadata as JourneyEvent['metadata']
      : undefined,
    dataStatus: (typeof raw.dataStatus === 'string' ? raw.dataStatus : undefined) as JourneyEvent['dataStatus'],
    id: typeof raw.id === 'string' ? raw.id : undefined,
  };
}

export async function aggregateJourneyMetrics(
  db: Firestore,
  options: { hours?: number; endAt?: Date } = {}
): Promise<JourneyMetrics> {
  const hours = options.hours ?? DEFAULT_WINDOW_HOURS;
  const to = options.endAt ? new Date(options.endAt) : new Date();
  const from = new Date(to.getTime() - hours * 60 * 60 * 1000);

  try {
    const snapshot = await db
      .collection('nios_telemetry')
      .where('timestamp', '>=', from.toISOString())
      .where('timestamp', '<=', to.toISOString())
      .orderBy('timestamp')
      .limit(MAX_BATCH_READS)
      .get();

    const events: JourneyEvent[] = [];
    for (const doc of snapshot.docs) {
      const e = eventToJourney(doc.data() as Record<string, unknown>);
      if (e) events.push(e);
    }

    if (events.length === 0) {
      return emptyMetrics(from, to);
    }

    // Build sessions from events
    const sessionsById: Record<string, JourneyEvent[]> = {};
    for (const e of events) {
      sessionsById[e.sessionId] = sessionsById[e.sessionId] || [];
      sessionsById[e.sessionId].push(e);
    }

    const sessionSummaries: SessionSummary[] = [];
    for (const [sessionId, sessEvents] of Object.entries(sessionsById)) {
      if (sessEvents.length === 0) continue;
      const source = sessEvents[0].source;
      const device = sessEvents[0].device;
      let session = createSession(source, device);
      session = { ...session, sessionId };
      for (const e of sessEvents.sort((a, b) => parseTimestamp(a.timestamp).getTime() - parseTimestamp(b.timestamp).getTime())) {
        session = recordEvent(session, e);
      }
      sessionSummaries.push(summarizeSession(session, to.getTime()));
    }

    const totals = sessionSummaries.reduce(
      (acc, s) => ({
        pages: acc.pages + s.pageViews,
        articles: acc.articles + s.articleViews.length,
        categories: acc.categories + s.categoryViews.length,
        searches: acc.searches + s.searches.length,
        internalClicks: acc.internalClicks + s.internalClicks.length,
        relatedClicks: acc.relatedClicks + s.relatedClicks.length,
        outboundClicks: acc.outboundClicks + s.outboundClicks.length,
        externalReferrals: acc.externalReferrals + s.externalReferrals.length,
        engagementMs: acc.engagementMs + s.engagementMs,
        scrollDepths: acc.scrollDepths.concat(s.scrollDepths),
      }),
      { pages: 0, articles: 0, categories: 0, searches: 0, internalClicks: 0, relatedClicks: 0, outboundClicks: 0, externalReferrals: 0, engagementMs: 0, scrollDepths: [] as number[] }
    );

    const entryPaths: Record<string, number> = {};
    const exitPaths: Record<string, number> = {};
    const recirculation: Record<string, number> = {};
    const searchQueries: Record<string, number> = {};

    for (const s of sessionSummaries) {
      entryPaths[s.entryPath] = (entryPaths[s.entryPath] || 0) + 1;
      if (s.exitPath) exitPaths[s.exitPath] = (exitPaths[s.exitPath] || 0) + 1;
      for (const slug of s.articleViews) {
        recirculation[slug] = (recirculation[slug] || 0) + s.recirculation;
      }
      for (const q of s.searches) {
        searchQueries[q] = (searchQueries[q] || 0) + 1;
      }
    }

    const singlePageSessions = sessionSummaries.filter(s => s.pageViews <= 1).length;

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      sessions: sessionSummaries.length,
      pageViews: totals.pages,
      articleViews: totals.articles,
      categoryViews: totals.categories,
      searches: totals.searches,
      internalClicks: totals.internalClicks,
      relatedClicks: totals.relatedClicks,
      outboundClicks: totals.outboundClicks,
      externalReferrals: totals.externalReferrals,
      avgPagesPerSession: sessionSummaries.length ? round(totals.pages / sessionSummaries.length) : 0,
      avgArticlesPerSession: sessionSummaries.length ? round(totals.articles / sessionSummaries.length) : 0,
      avgScrollDepth: totals.scrollDepths.length ? round(totals.scrollDepths.reduce((a, b) => a + b, 0) / totals.scrollDepths.length) : null,
      avgEngagementMs: sessionSummaries.length ? round(totals.engagementMs / sessionSummaries.length) : 0,
      singlePageSessions,
      singlePageRate: sessionSummaries.length ? round(singlePageSessions / sessionSummaries.length) : 0,
      topEntryPaths: topN(entryPaths, 10),
      topExitPaths: topN(exitPaths, 10),
      topRecirculationArticles: topArticles(recirculation, 10),
      topSearchQueries: topQueries(searchQueries, 10),
      dataStatus: 'DATA_AVAILABLE',
    };
  } catch (err) {
    return {
      ...emptyMetrics(from, to),
      dataStatus: 'ERROR',
    };
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function topN(map: Record<string, number>, limit: number): { path: string; count: number }[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([path, count]) => ({ path, count }));
}

function topArticles(map: Record<string, number>, limit: number): { slug: string; count: number }[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug, count]) => ({ slug, count }));
}

function topQueries(map: Record<string, number>, limit: number): { query: string; count: number }[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([query, count]) => ({ query, count }));
}

function emptyMetrics(from: Date, to: Date): JourneyMetrics {
  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    sessions: 0,
    pageViews: 0,
    articleViews: 0,
    categoryViews: 0,
    searches: 0,
    internalClicks: 0,
    relatedClicks: 0,
    outboundClicks: 0,
    externalReferrals: 0,
    avgPagesPerSession: 0,
    avgArticlesPerSession: 0,
    avgScrollDepth: null,
    avgEngagementMs: 0,
    singlePageSessions: 0,
    singlePageRate: 0,
    topEntryPaths: [],
    topExitPaths: [],
    topRecirculationArticles: [],
    topSearchQueries: [],
    dataStatus: 'DATA_EMPTY',
  };
}
