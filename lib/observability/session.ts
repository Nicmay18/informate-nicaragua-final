/**
 * Session manager — privacy-first, no PII.
 * Session id is a random token; it is not linked to auth identity.
 */

import { JourneyEvent, SessionSummary, TrafficSource, DeviceCategory } from './types';

const SESSION_IDLE_MS = 30 * 60 * 1000; // 30 min

export interface SessionHandle {
  sessionId: string;
  startedAt: string;
  lastEventAt: string;
  source: TrafficSource;
  device: DeviceCategory;
  events: JourneyEvent[];
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createSession(source: TrafficSource, device: DeviceCategory): SessionHandle {
  const now = new Date().toISOString();
  return {
    sessionId: generateId(),
    startedAt: now,
    lastEventAt: now,
    source,
    device,
    events: [],
  };
}

export function recordEvent(session: SessionHandle, event: JourneyEvent): SessionHandle {
  return {
    ...session,
    lastEventAt: event.timestamp,
    events: [...session.events, event].slice(-100), // keep last 100 in memory only
  };
}

export function isSessionExpired(session: SessionHandle, now = Date.now()): boolean {
  const last = new Date(session.lastEventAt).getTime();
  return now - last > SESSION_IDLE_MS;
}

export function summarizeSession(session: SessionHandle, now = Date.now()): SessionSummary {
  const pageEvents = session.events.filter(e =>
    e.type === 'PAGE_VIEW' || e.type === 'ARTICLE_VIEW' || e.type === 'CATEGORY_VIEW'
  );
  const articleViews = session.events
    .filter(e => e.type === 'ARTICLE_VIEW' && e.articleSlug)
    .map(e => e.articleSlug!);
  const categoryViews = session.events
    .filter(e => e.type === 'CATEGORY_VIEW' && e.metadata?.clickTargetCategory)
    .map(e => e.metadata?.clickTargetCategory as string);
  const searches = session.events
    .filter(e => e.type === 'SEARCH' && e.metadata?.query)
    .map(e => e.metadata?.query as string);
  const internalClicks = session.events
    .filter(e => (e.type === 'INTERNAL_NAVIGATION' || e.type === 'INTERNAL_CLICK') && e.metadata?.clickTarget)
    .map(e => e.metadata?.clickTarget as string);
  const relatedClicks = session.events
    .filter(e => e.type === 'RELATED_CLICK' && e.metadata?.clickTargetArticleSlug)
    .map(e => e.metadata?.clickTargetArticleSlug as string);
  const outboundClicks = session.events
    .filter(e => e.type === 'OUTBOUND_CLICK' && e.metadata?.clickTarget)
    .map(e => e.metadata?.clickTarget as string);
  const externalReferrals = session.events
    .filter(e => e.type === 'EXTERNAL_REFERRAL' && e.metadata?.clickTarget)
    .map(e => e.metadata?.clickTarget as string);
  const scrollDepths = session.events
    .filter(e => (e.type === 'SCROLL_50' || e.type === 'SCROLL_90' || e.type === 'SCROLL_DEPTH') && typeof e.metadata?.scrollDepth === 'number')
    .map(e => e.metadata?.scrollDepth as number);
  const engagementMs = session.events
    .reduce((sum, e) => sum + (e.durationMs || 0), 0);

  const recirculation = Math.max(0, articleViews.length - 1);
  const status = isSessionExpired(session, now) ? 'closed' : 'active';

  return {
    sessionId: session.sessionId,
    startedAt: session.startedAt,
    lastEventAt: session.lastEventAt,
    endedAt: status === 'closed' ? new Date(now).toISOString() : undefined,
    eventCount: session.events.length,
    pageViews: pageEvents.length,
    articleViews: [...new Set(articleViews)],
    categoryViews: [...new Set(categoryViews)],
    searches: [...new Set(searches)],
    internalClicks: [...new Set(internalClicks)],
    relatedClicks: [...new Set(relatedClicks)],
    outboundClicks: [...new Set(outboundClicks)],
    externalReferrals: [...new Set(externalReferrals)],
    source: session.source,
    device: session.device,
    entryPath: session.events[0]?.path || '/',
    exitPath: session.events[session.events.length - 1]?.path,
    scrollDepths,
    engagementMs,
    recirculation,
    status,
  };
}
