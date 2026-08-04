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
  level: 'excelente' | 'saludable' | 'observacion' | 'comprometido' | 'grave' | 'critico';
  pillars: MediaHealthPillar[];
  diagnostico: string;
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

/* ── NIOS v5 Editor en Jefe IA ─────────────────────────── */

export interface EditorJefePriority {
  label: string;
  action: string;
  source: string;
  severity: Severity;
}

export interface EditorJefeOpportunity {
  titulo: string;
  explicacion: string;
  accion: string;
}

export interface EditorJefeArticle {
  titulo: string;
  slug: string;
  explicacion: string;
}

export interface EditorJefeAdvertiserSimulation {
  marca: string;
  categoria: string;
  patrocinio: string;
  explicacion: string;
}

export interface EditorJefeAbandoned {
  categoria: string;
  ultimos7: number;
  ultimos30: number;
  ultimos90: number;
  explicacion: string;
}

export interface EditorJefeSalud {
  estado: 'Excelente' | 'Saludable' | 'En observación' | 'Comprometido' | 'Grave' | 'Crítico';
  explicacion: string;
}

export interface EditorJefeView {
  salud: EditorJefeSalud;
  prioridades: EditorJefePriority[];
  noPublicar: {
    razon: string;
    compensar: string;
  };
  oportunidadPerdida: EditorJefeOpportunity;
  googleVeredicto: {
    conclusion: string;
    problemas: string[];
    fortalezas: string[];
  };
  anunciante: {
    simulaciones: EditorJefeAdvertiserSimulation[];
  };
  noticiaAGuia: EditorJefeArticle;
  categoriaAbandonada: EditorJefeAbandoned;
  actualizar: EditorJefeArticle;
  merecePortada: EditorJefeArticle;
  lectorNuevo: {
    primeraImpresion: string;
    entenderia: string;
  };
  quePasaraSiNoHagoNada: string;
}

export interface BrandGuardianVerdict {
  representaMarca: boolean;
  pareceTabloide: boolean;
  excesoSucesos: boolean;
  equilibrioEditorial: boolean;
  googleEntenderia: boolean;
  categoriaDomina: string | null;
  categoriaDesaparecida: string | null;
  categoriaNecesitaCrecer: string | null;
  noticiaNoEnHero: string | null;
  noticiaMereceHero: string | null;
  diagnostico: string;
}

export interface EeatIndicator {
  id: string;
  label: string;
  score: number;
  cumple: boolean;
  noAplica: boolean;
  explicacion: string;
  impacto: string;
  accion: string;
}

export interface EeatEngine {
  score: number;
  level: 'excepcional' | 'sólido' | 'en construcción' | 'frágil';
  indicators: EeatIndicator[];
  faltan: string[];
  nextAction: string;
}

export interface BusinessMetric {
  id: string;
  label: string;
  value: string;
  disponible: boolean;
  explicacion: string;
}

export interface BusinessIntelligence {
  ingresosActuales: BusinessMetric;
  metaMensual: BusinessMetric;
  inventarioDisponible: BusinessMetric;
  inventarioVendido: BusinessMetric;
  patrociniosActivos: BusinessMetric;
  categoriasPatrocinables: BusinessMetric;
  valorInventario: BusinessMetric;
  oportunidades: BusinessMetric;
  riesgos: BusinessMetric;
  ingresosPotenciales: BusinessMetric;
  diagnostico: string;
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
  editorJefe: EditorJefeView;
  brandGuardian: BrandGuardianVerdict;
  eeat: EeatEngine;
  businessIntel: BusinessIntelligence;
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
  brandGuardian: BrandGuardianVerdict;
  eeat: EeatEngine;
  businessIntel: BusinessIntelligence;
  ceo?: NiosCeoView;
  errors?: string[];
}
