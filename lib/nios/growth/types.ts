/**
 * NIOS v5 — Growth Engine Types
 * ==============================
 * Tipos canónicos para el motor de crecimiento editorial.
 * Nada se inventa; todo proviene de GSC, GA4, Firestore y MENI.
 */

export type GrowthOpportunityKind =
  | 'seo-ctr-title'
  | 'seo-strike-zone'
  | 'seo-internal-links'
  | 'seo-title-experiment'
  | 'content-update'
  | 'content-evergreen'
  | 'content-related'
  | 'distribution-recirculation'
  | 'distribution-second-push'
  | 'distribution-telegram'
  | 'recovery-traffic-lost'
  | 'recovery-position-drop';

export type GrowthImpact = 'alto' | 'medio' | 'bajo';
export type GrowthConfidence = 'alta' | 'media' | 'baja';
export type GrowthEffort = 'bajo' | 'medio' | 'alto';
export type GrowthUrgency = 'HIGH' | 'MEDIUM' | 'LOW';
export type GrowthActionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED'
  | 'PREPARED'
  | 'QUEUED'
  | 'SENT';

export interface GrowthEvidence {
  source: string;
  metric: string;
  value: string | number;
  note?: string;
}

export interface GrowthOpportunityTarget {
  slug?: string;
  title?: string;
  url?: string;
  category?: string;
  query?: string;
}

export interface GrowthOpportunity {
  id: string;
  kind: GrowthOpportunityKind;
  category: 'seo' | 'content' | 'distribution' | 'recovery';
  target: GrowthOpportunityTarget;
  headline: string;
  what: string;
  why: string;
  evidence: GrowthEvidence[];
  recommendedAction: string;
  metricToMeasure: string;
  measurementWindowHours: 24 | 72 | 168;
  impact: GrowthImpact;
  impactScore: number; // 1-100
  confidence: GrowthConfidence;
  effort: GrowthEffort;
  urgency: GrowthUrgency;
}

export interface GrowthPlanItem {
  opportunity: GrowthOpportunity;
  rank: number;
  title: string;
  explanation: string;
  actionId: string; // maps to ceo-action-registry
  requiresApproval: boolean;
  autoExecutable: boolean;
  impact: GrowthImpact;
  confidence: GrowthConfidence;
  effort: GrowthEffort;
  urgency: GrowthUrgency;
  metric: string;
  deadline: string; // ISO date
}

export interface GrowthActionPayload {
  preparedCopy?: string;
  preparedTitle?: string;
  proposedTitle?: string;
  suggestedLinks?: { slug: string; title: string; reason: string }[];
  distributionChannels?: ('Telegram' | 'Facebook' | 'WhatsApp' | 'Newsletter')[];
  updateNotes?: string;
  evergreenBrief?: string;
  experimentHypothesis?: string;
}

export interface GrowthMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  users: number;
  sessions: number;
  pageviews: number;
  engagementRate: number;
  avgEngagementTimeSec: number;
  capturedAt: string;
  source: 'snapshot' | 'live';
}

export interface GrowthLearning {
  result: 'SUCCESS' | 'FAILURE' | 'INCONCLUSIVE' | 'PENDING';
  observation: string;
  absoluteChange: Record<string, number | null>;
  percentChange: Record<string, number | null>;
  trend: 'up' | 'down' | 'flat' | 'unknown';
  learning: string;
  confidence: GrowthConfidence;
  nextAction: string;
}

export interface GrowthAction {
  id: string;
  status: GrowthActionStatus;
  kind: GrowthOpportunityKind;
  category: GrowthOpportunity['category'];
  opportunityId: string;
  articleSlug?: string;
  articleTitle?: string;
  articleUrl?: string;
  query?: string;
  baseline: GrowthMetrics;
  preparedAt: string;
  actionTaken: string;
  payload: GrowthActionPayload;
  after?: GrowthMetrics;
  learning?: GrowthLearning;
  approvedAt?: string;
  executedAt?: string;
  measuredAt?: string;
  nextMeasurementAt?: string;
  createdAt: string;
  updatedAt: string;
  requestedBy?: string;
  errorMessage?: string;
}

export interface GrowthEngineResult {
  opportunities: GrowthOpportunity[];
  plan: GrowthPlanItem[];
  summary: string;
  speaks: string;
}
