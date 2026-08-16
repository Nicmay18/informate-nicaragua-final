import { NextRequest, NextResponse } from 'next/server';
import { buildJourneyEvent, persistEvent } from '@/lib/observability/log';
import type { JourneyEvent, JourneyEventType } from '@/lib/observability/types';
import { RateLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const journeyLimiter = new RateLimiter({ intervalMs: 60_000, maxRequests: 60, cleanupThreshold: 500 });

const ALLOWED_METADATA_KEYS = [
  'query',
  'resultCount',
  'clickTarget',
  'scrollDepth',
  'errorMessage',
  'errorStack',
] as const;

function sanitizeMetadata(raw: unknown): JourneyEvent['metadata'] | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined;
  const input = raw as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const key of ALLOWED_METADATA_KEYS) {
    if (key in input && input[key] !== undefined) {
      output[key] = input[key];
    }
  }
  if (Object.keys(output).length === 0) return undefined;
  return output as JourneyEvent['metadata'];
}

const VALID_EVENT_TYPES: JourneyEventType[] = [
  'SESSION_START',
  'PAGE_VIEW',
  'ARTICLE_VIEW',
  'SEARCH',
  'INTERNAL_NAVIGATION',
  'OUTBOUND_CLICK',
  'ENGAGEMENT',
  'SCROLL_50',
  'SCROLL_90',
  'ERROR',
  'SESSION_END',
];

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limit = journeyLimiter.check(clientIp);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429,
      headers: {
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(limit.resetAt).toISOString(),
      },
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawType = typeof body.type === 'string' ? body.type : 'PAGE_VIEW';
    const type: JourneyEventType = VALID_EVENT_TYPES.includes(rawType as JourneyEventType)
      ? (rawType as JourneyEventType)
      : 'PAGE_VIEW';

    const path = typeof body.path === 'string' ? body.path.slice(0, 300) : '/';
    const sessionId = typeof body.sessionId === 'string' && body.sessionId.length > 0
      ? body.sessionId.slice(0, 100)
      : `s-${Date.now()}`;

    const articleSlug = typeof body.articleSlug === 'string' ? body.articleSlug.slice(0, 200) : undefined;
    const referrer = typeof body.referrer === 'string'
      ? body.referrer
      : request.headers.get('referer') || undefined;
    const utmSource = typeof body.utmSource === 'string' ? body.utmSource.slice(0, 50) : undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    const country = request.headers.get('x-vercel-ip-country') || undefined;
    const durationMs = typeof body.durationMs === 'number' && body.durationMs >= 0 ? body.durationMs : undefined;
    const metadata = sanitizeMetadata(body.metadata);

    const event = buildJourneyEvent({
      type,
      path,
      sessionId,
      articleSlug,
      referrer,
      utmSource,
      userAgent,
      country,
      durationMs,
      metadata,
    });

    // Lazy load adminDb to avoid blocking runtime in serverless cold-start
    const { adminDb } = await import('@/lib/firebase-admin');
    await persistEvent(adminDb, event);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    // Fail-safe: telemetry should never throw or degrade reader experience
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
