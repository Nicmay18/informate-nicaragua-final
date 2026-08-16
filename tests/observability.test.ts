import { describe, it, expect } from 'vitest';
import { buildJourneyEvent, persistEvent } from '@/lib/observability/log';
import { createSession, recordEvent, isSessionExpired, summarizeSession } from '@/lib/observability/session';
import type { JourneyEvent } from '@/lib/observability/types';

describe('observability — Fase 3', () => {
  it('buildJourneyEvent preserves null semantics and classifies source', () => {
    const e = buildJourneyEvent({
      type: 'PAGE_VIEW',
      path: '/noticias/test',
      sessionId: 's-1',
      referrer: 'https://google.com/search?q=nicaragua',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
    });

    expect(e.type).toBe('PAGE_VIEW');
    expect(e.path).toBe('/noticias/test');
    expect(e.source).toBe('organic');
    expect(e.device).toBe('desktop');
    expect(e.browser).toBe('chrome');
    expect(e.dataStatus).toBe('UNKNOWN');
    expect(e.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('session records events and can summarize', () => {
    let session = createSession('direct', 'desktop');
    const e: JourneyEvent = buildJourneyEvent({
      type: 'ARTICLE_VIEW',
      path: '/noticias/abc',
      sessionId: session.sessionId,
      articleSlug: 'abc',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile',
    });
    session = recordEvent(session, e);
    const summary = summarizeSession(session);

    expect(summary.eventCount).toBe(1);
    expect(summary.pageViews).toBe(1);
    expect(summary.articleViews).toContain('abc');
    expect(summary.device).toBe('desktop');
  });

  it('session expires after idle time', () => {
    const session = createSession('direct', 'mobile');
    session.lastEventAt = new Date(Date.now() - 31 * 60 * 1000).toISOString();
    expect(isSessionExpired(session)).toBe(true);
  });

  it('persistEvent does not throw on store failure', async () => {
    const e = buildJourneyEvent({
      type: 'SEARCH',
      path: '/buscar',
      sessionId: 's-2',
      metadata: { query: 'managua' },
    });
    const brokenStore = {
      collection: () => ({
        add: async () => { throw new Error('firestore down'); },
      }),
    };
    const result = await persistEvent(brokenStore as any, e);
    expect(result.id).toBeUndefined();
  });
});
