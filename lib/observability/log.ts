/**
 * Observability logging — safe, no-PII, batched where possible.
 * Does not block the user path. Errors are logged but not thrown.
 */

import { logger } from '@/lib/logger';
import type { JourneyEvent, ObservabilityBatch } from './types';

const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 5000;

const memoryQueue: JourneyEvent[] = [];
let batchInterval: ReturnType<typeof setInterval> | null = null;

export interface ObservabilityStore {
  collection(name: string): {
    add(data: Record<string, unknown>): Promise<{ id: string } | { id: undefined }>;
  };
}

function sanitizeReferrer(referrer?: string): string | undefined {
  if (!referrer) return undefined;
  try {
    const u = new URL(referrer);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return referrer.length > 120 ? referrer.slice(0, 120) : referrer;
  }
}

function classifySource(referrer?: string, utmSource?: string): JourneyEvent['source'] {
  if (utmSource) {
    if (/google|bing|duckduckgo/.test(utmSource)) return 'organic';
    if (/facebook|x|twitter|telegram|whatsapp|instagram|linkedin/.test(utmSource)) return 'social';
    return 'referral';
  }
  if (!referrer) return 'direct';
  const r = referrer.toLowerCase();
  if (/google\.com|bing\.com|duckduckgo\.com/.test(r)) return 'organic';
  if (/facebook\.com|x\.com|twitter\.com|t\.co|telegram\.me|wa\.me|instagram\.com|linkedin\.com/.test(r)) return 'social';
  if (r.includes(windowOrHost())) return 'direct';
  return 'referral';
}

function windowOrHost(): string {
  if (typeof window !== 'undefined') return window.location.host;
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '') || 'nicaraguainformate.com';
}

function inferDevice(userAgent?: string): JourneyEvent['device'] {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return 'tablet';
  if (/mobile|android|iphone/.test(ua)) return 'mobile';
  if (/windows|macintosh|linux/.test(ua)) return 'desktop';
  return 'unknown';
}

function inferBrowser(userAgent?: string): JourneyEvent['browser'] | undefined {
  if (!userAgent) return undefined;
  const ua = userAgent.toLowerCase();
  if (/edg/.test(ua)) return 'edge';
  if (/chrome|crios/.test(ua)) return 'chrome';
  if (/firefox|fxios/.test(ua)) return 'firefox';
  if (/safari|applewebkit/.test(ua)) return 'safari';
  return 'other';
}

export function buildJourneyEvent(input: {
  type: JourneyEvent['type'];
  path: string;
  sessionId: string;
  articleSlug?: string;
  referrer?: string;
  utmSource?: string;
  userAgent?: string;
  country?: string;
  durationMs?: number;
  metadata?: JourneyEvent['metadata'];
}): JourneyEvent {
  return {
    sessionId: input.sessionId,
    type: input.type,
    timestamp: new Date().toISOString(),
    path: input.path,
    articleSlug: input.articleSlug,
    referrer: sanitizeReferrer(input.referrer),
    source: classifySource(input.referrer, input.utmSource),
    device: inferDevice(input.userAgent),
    browser: inferBrowser(input.userAgent),
    country: input.country === 'unknown' ? undefined : input.country,
    durationMs: input.durationMs,
    metadata: input.metadata,
    dataStatus: 'UNKNOWN',
  };
}

export async function persistEvent(store: ObservabilityStore, event: JourneyEvent): Promise<{ id?: string }> {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days TTL
    const { id } = await store.collection('nios_telemetry').add({
      ...event,
      _writtenAt: now.toISOString(),
      expiresAt,
    });
    return { id: typeof id === 'string' ? id : undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown';
    logger.error('[observability] failed to persist event:', message);
    return {};
  }
}

export function queueEvent(store: ObservabilityStore, event: JourneyEvent): void {
  memoryQueue.push(event);
  if (memoryQueue.length >= BATCH_SIZE) {
    void flushQueue(store);
  } else if (!batchInterval) {
    batchInterval = setInterval(() => void flushQueue(store), FLUSH_INTERVAL_MS);
  }
}

export async function flushQueue(store: ObservabilityStore): Promise<void> {
  if (memoryQueue.length === 0) return;
  const events = memoryQueue.splice(0, memoryQueue.length);
  if (batchInterval) {
    clearInterval(batchInterval);
    batchInterval = null;
  }
  logger.debug('[observability] flush:', events.length);
  await Promise.all(events.map((event) => persistEvent(store, event)));
}

export async function logAuditTrail(batch: ObservabilityBatch, store: ObservabilityStore): Promise<{ id?: string }> {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days TTL for audit
    const { id } = await store.collection('nios_audit_trail').add({
      ...batch,
      _writtenAt: now.toISOString(),
      expiresAt,
    });
    return { id: typeof id === 'string' ? id : undefined };
  } catch (err) {
    logger.error('[observability] failed to persist audit trail:', err);
    return {};
  }
}
