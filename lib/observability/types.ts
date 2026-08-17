/**
 * Observability contracts — NIOS User Journey
 * No PII. No secrets. No fingerprinting.
 */

export type JourneyEventType =
  | 'SESSION_START'
  | 'PAGE_VIEW'
  | 'ARTICLE_VIEW'
  | 'CATEGORY_VIEW'
  | 'SEARCH'
  | 'INTERNAL_NAVIGATION'
  | 'INTERNAL_CLICK'
  | 'RELATED_CLICK'
  | 'OUTBOUND_CLICK'
  | 'EXTERNAL_REFERRAL'
  | 'ENGAGEMENT'
  | 'SCROLL_50'
  | 'SCROLL_90'
  | 'SCROLL_DEPTH'
  | 'ERROR'
  | 'SESSION_END';

export type DeviceCategory = 'mobile' | 'desktop' | 'tablet' | 'unknown';
export type TrafficSource = 'direct' | 'organic' | 'social' | 'referral' | 'search' | 'unknown';
export type DataStatus = 'UNKNOWN' | 'DATA_AVAILABLE' | 'DATA_EMPTY' | 'ERROR';

export interface JourneyEvent {
  /** Firestore document id (generated) */
  id?: string;
  /** Session id (ephemeral, not PII) */
  sessionId: string;
  /** Event type */
  type: JourneyEventType;
  /** ISO 8601 */
  timestamp: string;
  /** URL path */
  path: string;
  /** Article slug if applicable */
  articleSlug?: string;
  /** Referrer host or full referrer (sanitized) */
  referrer?: string;
  /** Classified traffic source */
  source: TrafficSource;
  /** Device category */
  device: DeviceCategory;
  /** User agent category (only browser family, no full string) */
  browser?: 'chrome' | 'safari' | 'firefox' | 'edge' | 'other';
  /** Country from Cloudflare/Vercel header if available, otherwise unknown */
  country?: string;
  /** Event duration in ms where applicable */
  durationMs?: number;
  /** Optional engagement data — no PII, only controlled keys */
  metadata?: {
    query?: string;
    resultCount?: number;
    clickTarget?: string;
    clickTargetArticleSlug?: string;
    clickTargetCategory?: string;
    clickTargetUrl?: string;
    scrollDepth?: number;
    scrollThreshold?: 25 | 50 | 75 | 90 | 100;
    errorMessage?: string;
    errorStack?: string;
    engagedMs?: number;
    visibleMs?: number;
  };
  /** Status of related external data at event time */
  dataStatus?: DataStatus;
}

export interface SessionSummary {
  sessionId: string;
  startedAt: string;
  lastEventAt: string;
  endedAt?: string;
  eventCount: number;
  pageViews: number;
  articleViews: string[];
  categoryViews: string[];
  searches: string[];
  internalClicks: string[];
  relatedClicks: string[];
  outboundClicks: string[];
  externalReferrals: string[];
  source: TrafficSource;
  device: DeviceCategory;
  entryPath: string;
  exitPath?: string;
  scrollDepths: number[];
  engagementMs: number;
  recirculation: number;
  status: 'active' | 'closed' | 'unknown';
}

export interface ObservabilityBatch {
  runId: string;
  module: string;
  version: string;
  timestamp: string;
  inputSource: string;
  recordsRead: number;
  recordsWritten: number;
  durationMs: number;
  status: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  errors: string[];
  warnings: string[];
}

export interface TelemetryEnvelope<T = unknown> {
  type: string;
  payload: T;
  recordedAt: string;
  sessionId?: string;
}
