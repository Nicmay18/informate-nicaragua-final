/**
 * NIOS Business Command Center — contratos de la capa de dirección ejecutiva.
 *
 * Esta capa NO reimplementa ningún motor. Lee las salidas de MENI, EOS, NIOS,
 * Home Ranking, Daily Editor, Revenue y Distribution, y las traduce a
 * decisiones de negocio para quien dirige el medio.
 */

export type Severity = 'critica' | 'alta' | 'media' | 'baja';
export type Trend = 'up' | 'down' | 'flat';

/* ── 1. CEO Daily Decision ──────────────────────────────── */

export type DecisionKind = 'inmediata' | 'crecimiento' | 'negocio' | 'google' | 'riesgo';

export interface CeoDecision {
  id: string;
  kind: DecisionKind;
  icon: string;
  headline: string;
  detail: string;
  why: string;
  action: string;
  href?: string;
  severity: Severity;
  /** Motor que originó la decisión (trazabilidad). */
  source: string;
}

/* ── 2. Editorial Balance Engine ────────────────────────── */

export interface CategoryBalance {
  category: string;
  count: number;
  share: number;
  target: number;
  maxShare?: number;
  deviation: number;
  status: 'equilibrado' | 'excedido' | 'deficitario';
  verdict: string;
}

export interface EditorialBalance {
  total: number;
  categories: CategoryBalance[];
  identityScore: number;
  dominant: string | null;
  alerts: string[];
  verdict: string;
}

/* ── 3. Google Trust Score ──────────────────────────────── */

export interface TrustPillar {
  id: string;
  label: string;
  score: number;
  weight: number;
  strength: string;
  weakness: string;
  nextAction: string;
}

export interface GoogleTrust {
  score: number;
  level: 'sólido' | 'en construcción' | 'frágil';
  pillars: TrustPillar[];
  googleSees: {
    strengths: string[];
    weaknesses: string[];
    nextActions: string[];
  };
}

/* ── 4. Revenue Engine ──────────────────────────────────── */

export interface RevenueOpportunity {
  id: string;
  category: string;
  title: string;
  rationale: string;
  advertisers: string[];
  readiness: number;
  effort: 'bajo' | 'medio' | 'alto';
  potential: 'alto' | 'medio' | 'exploratorio';
  nextStep: string;
}

export interface RevenueEngine {
  commercialShare: number;
  monetizableArticles: number;
  opportunities: RevenueOpportunity[];
  verdict: string;
}

/* ── 5. Content War Room ────────────────────────────────── */

export interface WarRoomSlot {
  id: string;
  category: string;
  format: string;
  brief: string;
  reason: string;
  priority: Severity;
  conditional?: string;
}

export interface ContentWarRoom {
  date: string;
  slots: WarRoomSlot[];
  rationale: string[];
}

/* ── 6. Home Quality Control ────────────────────────────── */

export interface HomeSlotAudit {
  position: number;
  title: string;
  category: string;
  slug: string;
  onBrand: boolean;
  note: string;
}

export interface HomeQuality {
  score: number;
  analyzed: number;
  dominantCategory: string | null;
  dominantShare: number;
  brandSlots: HomeSlotAudit[];
  violations: string[];
  verdict: string;
}

/* ── 7. Distribution Command ────────────────────────────── */

export type Channel = 'Facebook' | 'Telegram' | 'WhatsApp' | 'Newsletter' | 'Google Discover';

export interface ChannelCopy {
  channel: Channel;
  angle: string;
  text: string;
  charCount: number;
}

export interface DistributionPlan {
  id: string;
  slug: string;
  title: string;
  category: string;
  priority: Severity;
  reason: string;
  copies: ChannelCopy[];
}

export interface DistributionCommand {
  pending: number;
  plans: DistributionPlan[];
}

/* ── 8. Content Opportunity Hunter ──────────────────────── */

export interface HuntedOpportunity {
  id: string;
  topic: string;
  intent: 'informacional' | 'transaccional' | 'navegacional';
  demand: 'permanente' | 'estacional' | 'coyuntural';
  format: 'guía' | 'explicador' | 'nota' | 'actualización';
  rationale: string;
  covered: boolean;
  commercialValue: 'alto' | 'medio' | 'bajo';
  action: string;
}

export interface OpportunityHunter {
  covered: number;
  uncovered: number;
  items: HuntedOpportunity[];
}

/* ── 9. Authority Health ───────────────────────────────── */

export interface AuthorityPillar {
  id: string;
  label: string;
  score: number;
  weight: number;
  note: string;
}

export interface AuthorityHealth {
  score: number;
  pillars: AuthorityPillar[];
  verdict: string;
  nextMilestone: string;
}

/* ── 10. Business Health ─────────────────────────────────── */

export interface BusinessPillar {
  id: string;
  label: string;
  score: number;
  weight: number;
  reading: string;
}

export interface BusinessHealth {
  score: number;
  stage: 'proyecto' | 'medio en crecimiento' | 'medio consolidado' | 'empresa editorial';
  pillars: BusinessPillar[];
  verdict: string;
  nextMilestone: string;
}

/* ── CEO Mode ───────────────────────────────────────────── */

export type CeoCardKind = 'reparar' | 'crecer' | 'google' | 'negocio' | 'marca';

export interface CeoCard {
  kind: CeoCardKind;
  headline: string;
  what: string;
  why: string;
  ifNot: string;
  action: string;
  source: string;
  severity: Severity;
  href?: string;
  count?: number;
}

export interface MediaHealthPillar {
  id: string;
  label: string;
  score: number;
  weight: number;
  status: 'green' | 'yellow' | 'red';
}

export interface MediaHealth {
  score: number;
  level: 'excelente' | 'buena' | 'regular' | 'deficiente';
  pillars: MediaHealthPillar[];
}

export interface CeoBriefing {
  greeting: string;
  state: string;
  bestYesterday?: string;
  biggestRisk: string;
  biggestOpportunity: string;
  absolutePriority: string;
}

export interface CeoChecklistItem {
  id: string;
  label: string;
  source: string;
  completed: boolean;
}

export interface NiosCeoView {
  briefing: CeoBriefing;
  mediaHealth: MediaHealth;
  cards: CeoCard[];
  checklist: CeoChecklistItem[];
  memory: {
    pending: number;
    message: string;
  };
}

/* ── Reporte agregado ───────────────────────────────────── */

export interface BusinessCommandCenter {
  generatedAt: string;
  date: string;
  status: 'ok' | 'partial';
  analyzed: number;
  decisions: CeoDecision[];
  balance: EditorialBalance;
  trust: GoogleTrust;
  revenue: RevenueEngine;
  warRoom: ContentWarRoom;
  home: HomeQuality;
  distribution: DistributionCommand;
  hunter: OpportunityHunter;
  authority: AuthorityHealth;
  business: BusinessHealth;
  ceo?: NiosCeoView;
  errors?: string[];
}
