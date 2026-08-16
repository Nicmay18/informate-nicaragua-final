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

export function summarizeSession(session: SessionHandle): SessionSummary {
  const pageViews = session.events.filter(e => e.type === 'PAGE_VIEW' || e.type === 'ARTICLE_VIEW').length;
  const articleViews = session.events
    .filter(e => e.type === 'ARTICLE_VIEW' && e.articleSlug)
    .map(e => e.articleSlug!);
  const searches = session.events
    .filter(e => e.type === 'SEARCH' && e.metadata?.query)
    .map(e => e.metadata?.query as string);
  const outboundClicks = session.events
    .filter(e => e.type === 'OUTBOUND_CLICK' && e.metadata?.clickTarget)
    .map(e => e.metadata?.clickTarget as string);

  return {
    sessionId: session.sessionId,
    startedAt: session.startedAt,
    lastEventAt: session.lastEventAt,
    eventCount: session.events.length,
    pageViews,
    articleViews: [...new Set(articleViews)],
    searches: [...new Set(searches)],
    outboundClicks: [...new Set(outboundClicks)],
    source: session.source,
    device: session.device,
    status: 'active',
  };
}
