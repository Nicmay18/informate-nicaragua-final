import { describe, it, expect, vi } from 'vitest';
import { buildJourneyEvent, persistEvent } from '@/lib/observability/log';
import { createSession, recordEvent, summarizeSession } from '@/lib/observability/session';
import type { JourneyEvent } from '@/lib/observability/types';

describe('Journey Tracking & Observability — Bloque 2', () => {
  it('buildJourneyEvent builds ARTICLE_VIEW without PII and sanitizes referrer', () => {
    const event = buildJourneyEvent({
      type: 'ARTICLE_VIEW',
      path: '/noticias/sismo-en-managua',
      sessionId: 'sess-abc-123',
      articleSlug: 'sismo-en-managua',
      referrer: 'https://www.facebook.com/posts/12345?query=private#fragment',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      country: 'NI',
    });

    expect(event.type).toBe('ARTICLE_VIEW');
    expect(event.articleSlug).toBe('sismo-en-managua');
    expect(event.source).toBe('social');
    expect(event.device).toBe('mobile');
    expect(event.browser).toBe('safari');
    expect(event.country).toBe('NI');
    // Sanitized referrer must not contain query parameters or hash
    expect(event.referrer).toBe('https://www.facebook.com/posts/12345');
    // Never store raw user agent or personal data
    expect((event as any).userAgent).toBeUndefined();
    expect((event as any).ip).toBeUndefined();
  });

  it('buildJourneyEvent classifies organic Google and direct traffic correctly', () => {
    const googleEvent = buildJourneyEvent({
      type: 'PAGE_VIEW',
      path: '/',
      sessionId: 'sess-1',
      referrer: 'https://www.google.com/search?q=noticias+nicaragua',
    });
    expect(googleEvent.source).toBe('organic');

    const directEvent = buildJourneyEvent({
      type: 'PAGE_VIEW',
      path: '/categoria/sucesos',
      sessionId: 'sess-2',
    });
    expect(directEvent.source).toBe('direct');
  });

  it('summarizeSession aggregates full reader journey and detects recirculation', () => {
    let session = createSession('social', 'mobile');

    const e1 = buildJourneyEvent({ type: 'PAGE_VIEW', path: '/', sessionId: session.sessionId });
    const e2 = buildJourneyEvent({
      type: 'ARTICLE_VIEW',
      path: '/noticias/nota-1',
      sessionId: session.sessionId,
      articleSlug: 'nota-1',
    });
    const e3 = buildJourneyEvent({
      type: 'ARTICLE_VIEW',
      path: '/noticias/nota-2',
      sessionId: session.sessionId,
      articleSlug: 'nota-2',
    });
    const e4 = buildJourneyEvent({
      type: 'SEARCH',
      path: '/buscar?q=dengue',
      sessionId: session.sessionId,
      metadata: { query: 'dengue' },
    });

    session = recordEvent(session, e1);
    session = recordEvent(session, e2);
    session = recordEvent(session, e3);
    session = recordEvent(session, e4);

    const summary = summarizeSession(session);
    expect(summary.eventCount).toBe(4);
    expect(summary.pageViews).toBe(3); // 1 home + 2 articles
    expect(summary.articleViews).toEqual(['nota-1', 'nota-2']);
    expect(summary.searches).toEqual(['dengue']);
    expect(summary.source).toBe('social');
    expect(summary.device).toBe('mobile');
  });

  it('persistEvent attaches a 30-day TTL expiresAt timestamp to Firestore doc', async () => {
    let addedPayload: Record<string, unknown> | null = null;
    const mockStore = {
      collection: (name: string) => ({
        add: async (data: Record<string, unknown>) => {
          if (name === 'nios_telemetry') {
            addedPayload = data;
            return { id: 'doc-tel-123' };
          }
          return { id: undefined };
        },
      }),
    };

    const event = buildJourneyEvent({
      type: 'PAGE_VIEW',
      path: '/categoria/nacionales',
      sessionId: 'sess-ttl',
    });

    const res = await persistEvent(mockStore, event);
    expect(res.id).toBe('doc-tel-123');
    expect(addedPayload).not.toBeNull();
    expect(addedPayload!._writtenAt).toBeDefined();
    expect(addedPayload!.expiresAt).toBeDefined();

    const writtenTime = new Date(addedPayload!._writtenAt as string).getTime();
    const expireTime = new Date(addedPayload!.expiresAt as string).getTime();
    const diffDays = Math.round((expireTime - writtenTime) / (24 * 60 * 60 * 1000));
    expect(diffDays).toBe(30);
  });
});
