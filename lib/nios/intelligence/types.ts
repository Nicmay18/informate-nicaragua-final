/**
 * NIOS Intelligence Platform v1.0 — Types
 * ========================================
 * Tipos para el sistema de inteligencia editorial basado en datos reales.
 * Nada se inventa. Nada se estima. Todo proviene de APIs de Google o Firestore.
 */

// ─── GSC (Google Search Console) ───────────────────────────────

export interface GSCDataRow {
  url: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface GSCQueryRow {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface GSCCountryRow {
  country: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface GSCDeviceRow {
  device: 'mobile' | 'desktop' | 'tablet';
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface GSCPageData {
  url: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  topQueries: GSCQueryRow[];
}

export interface GSCSnapshot {
  date: string;
  collectedAt: string;
  siteUrl: string;
  dateRange: { start: string; end: string };
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgPosition: number;
  pages: GSCDataRow[];
  queries: GSCQueryRow[];
  countries: GSCCountryRow[];
  devices: GSCDeviceRow[];
  discover?: GSCDataRow[];
  googleNews?: GSCDataRow[];
}

// ─── GA4 (Google Analytics 4 Data API) ─────────────────────────

export interface GA4PageRow {
  pagePath: string;
  screenPageviews: number;
  users: number;
  sessions: number;
  averageEngagementTimeSec: number;
  engagementRate: number;
}

export interface GA4SourceRow {
  source: string;
  users: number;
  sessions: number;
  screenPageviews: number;
  engagementRate: number;
}

export interface GA4DeviceRow {
  device: 'mobile' | 'desktop' | 'tablet';
  users: number;
  sessions: number;
}

export interface GA4Snapshot {
  date: string;
  collectedAt: string;
  propertyId: string;
  dateRange: { start: string; end: string };
  totalUsers: number;
  totalSessions: number;
  totalPageviews: number;
  averageEngagementTimeSec: number;
  engagementRate: number;
  pages: GA4PageRow[];
  sources: GA4SourceRow[];
  devices: GA4DeviceRow[];
}

// ─── Artículo fusionado: MENI + Google + GA4 ───────────────────

export interface ArticleFusion {
  slug: string;
  url: string;
  titulo: string;
  categoria: string;
  autor: string;
  fechaPublicacion: string;
  palabras: number;
  scoreMeni: number;
  tags: string[];
  relatedLinksCount: number;
  // GSC
  gscImpressions: number;
  gscClicks: number;
  gscCtr: number;
  gscPosition: number;
  gscTopQueries: GSCQueryRow[];
  // GA4
  ga4Users: number;
  ga4Sessions: number;
  ga4Pageviews: number;
  ga4AvgEngagementTimeSec: number;
  ga4EngagementRate: number;
  // Estado de datos
  hasGscData: boolean;
  hasGa4Data: boolean;
}

// ─── Recomendaciones basadas en reglas ─────────────────────────

export interface NIOSRecommendation {
  id: string;
  articleSlug: string;
  articleTitle: string;
  type: 'title' | 'meta' | 'snippet' | 'seo' | 'update' | 'internal_links' | 'depth' | 'originality' | 'eeat' | 'freshness';
  severity: 'critical' | 'warning' | 'info' | 'positive';
  title: string;
  description: string;
  evidence: NIOSEvidence[];
  confidence: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface NIOSEvidence {
  source: 'Google Search Console' | 'Google Analytics 4' | 'Firestore' | 'MENI' | 'Google Indexing API';
  api: string;
  dateRange: string;
  metric: string;
  value: string | number;
  comparison?: string;
  collectedAt: string;
}

// ─── Compliance Intelligence (Módulo 0) ────────────────────────

export interface ComplianceVerdict {
  slug: string;
  titulo: string;
  categoria: string;
  scoreMeni: number;
  gscImpressions: number;
  gscClicks: number;
  googleVerdict: 'google_values' | 'google_ignores' | 'no_data';
  meniVsGoogleGap: 'meni_overestimates' | 'meni_underestimates' | 'aligned' | 'no_data';
  explanation: string;
  evidence: NIOSEvidence[];
}

export interface ComplianceReport {
  generatedAt: string;
  totalArticles: number;
  articlesWithGscData: number;
  articlesGoogleIgnores: number;
  articlesGoogleValues: number;
  meniOverestimates: number;
  meniUnderestimates: number;
  alignedCount: number;
  verdicts: ComplianceVerdict[];
  topIgnored: ComplianceVerdict[];
  topValued: ComplianceVerdict[];
  summary: string;
}

// ─── AdSense Readiness (Módulo 6) ──────────────────────────────

export interface AdSenseReadinessArticle {
  slug: string;
  titulo: string;
  categoria: string;
  scoreMeni: number;
  gscImpressions: number;
  gscClicks: number;
  // Dimensiones de calidad
  contenidoUtil: boolean;
  profundidad: boolean;
  originalidad: boolean;
  contexto: boolean;
  servicio: boolean;
  experiencia: boolean;
  enlacesInternos: boolean;
  autoridad: boolean;
  eeat: boolean;
  actualizado: boolean;
  duplicidad: boolean;
  // Score compuesto
  readinessScore: number;
  issues: string[];
}

export interface AdSenseReadinessReport {
  generatedAt: string;
  totalArticles: number;
  readyArticles: number;
  needsWorkArticles: number;
  criticalArticles: number;
  averageReadinessScore: number;
  articles: AdSenseReadinessArticle[];
  topIssues: { issue: string; count: number }[];
  googleIgnoredWithHighMeni: { slug: string; titulo: string; scoreMeni: number; gscImpressions: number }[];
  summary: string;
}

// ─── Dashboard Google Intelligence ─────────────────────────────

export interface GoogleIntelligenceDashboard {
  generatedAt: string;
  dateRange: { start: string; end: string };
  hasData: boolean;
  // Totales
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgPosition: number;
  totalUsers: number;
  totalSessions: number;
  // Top 20 notas por impresiones
  topImpressions: ArticleFusion[];
  // Mejor CTR
  topCtr: ArticleFusion[];
  // Peor CTR
  worstCtr: ArticleFusion[];
  // Categorías que crecen
  categoryGrowth: { categoria: string; impressions: number; clicks: number; trend: 'up' | 'down' | 'stable' | 'no_data' }[];
  // Queries que generan más tráfico
  topQueries: GSCQueryRow[];
  // Notas que perdieron posiciones
  positionLosers: { slug: string; titulo: string; position: number; impressions: number }[];
  // Notas que ganaron posiciones
  positionGainers: { slug: string; titulo: string; position: number; impressions: number }[];
  // URLs que nunca reciben impresiones
  zeroImpressionUrls: { slug: string; titulo: string; fecha: string }[];
  // URLs que Google ignora (impresiones < 10 en 28 días)
  googleIgnoredUrls: { slug: string; titulo: string; scoreMeni: number }[];
  // Recomendaciones
  recommendations: NIOSRecommendation[];
  // Fuentes de tráfico GA4
  trafficSources: GA4SourceRow[];
}

// ─── Snapshot diario en Firestore ──────────────────────────────

export interface DailySnapshot {
  date: string;
  collectedAt: string;
  gsc: GSCSnapshot | null;
  ga4: GA4Snapshot | null;
  articlesFused: ArticleFusion[];
  recommendations: NIOSRecommendation[];
  compliance: ComplianceReport | null;
  readiness: AdSenseReadinessReport | null;
  trust: GoogleTrustReport | null;
  learningPatterns: GoogleLearningPattern[];
  contentRecovery: ContentRecoveryReport | null;
  adSenseRecoveryFullReport: AdSenseRecoveryFullReport | null;
}

// ─── FASE 2: Google Trust & AdSense Recovery ─────────────────

export interface GoogleTrustArticle {
  slug: string;
  titulo: string;
  categoria: string;
  autor: string;
  fechaPublicacion: string;
  palabras: number;
  scoreMeni: number;
  gscImpressions: number;
  gscClicks: number;
  gscCtr: number;
  gscPosition: number;
  ga4AvgEngagementTimeSec: number;
  relatedLinksCount: number;
  hasAutor: boolean;
  hasFecha: boolean;
  hasFuente: boolean;
  hasContexto: boolean;
  isThin: boolean;
  isDuplicateRisk: boolean;
  isUpdated: boolean;
  googleTrustScore: number;
  editorialAuthorityScore: number;
  contentValueScore: number;
  thinContentFlags: string[];
  risk: 'alto' | 'medio' | 'bajo';
}

export interface GoogleTrustReport {
  generatedAt: string;
  totalArticles: number;
  highRiskArticles: number;
  mediumRiskArticles: number;
  lowRiskArticles: number;
  averageGoogleTrustScore: number;
  thinContentCount: number;
  duplicateRiskCount: number;
  articlesWithoutAuthor: number;
  articlesWithoutSources: number;
  articlesWithLowGoogle: number;
  articlesHighMeniZeroImpressions: number;
  articlesLowMeniHighImpressions: number;
  articles: GoogleTrustArticle[];
  topBlocked: GoogleTrustArticle[];
  summary: string;
}

export interface ThinContentArticle {
  slug: string;
  titulo: string;
  categoria: string;
  palabras: number;
  scoreMeni: number;
  gscImpressions: number;
  reasons: string[];
}

export interface AdSenseRecoveryReport {
  generatedAt: string;
  totalArticles: number;
  riskLevel: 'alto' | 'medio' | 'bajo';
  contentOriginalityPct: number;
  contentContextPct: number;
  contentAuthorPct: number;
  contentSourcesPct: number;
  contentUsefulPct: number;
  topRiskUrls: GoogleTrustArticle[];
  thinContent: ThinContentArticle[];
  blockedArticles: GoogleTrustArticle[];
  recommendations: NIOSRecommendation[];
  summary: string;
}

export interface GoogleLearningPattern {
  id: string;
  slug: string;
  titulo: string;
  categoria: string;
  scoreMeni: number;
  gscImpressions: number;
  gscClicks: number;
  gscCtr: number;
  gscPosition: number;
  pattern: 'meni_correct' | 'meni_overestimates' | 'meni_underestimates' | 'insufficient_data';
  confidence: 'high' | 'medium' | 'low';
  conclusion: string;
  generatedAt: string;
  dateRange: string;
}

export interface CategoryOpportunity {
  categoria: string;
  totalArticles: number;
  googleImpressions: number;
  googleClicks: number;
  avgCtr: number;
  avgPosition: number;
  avgMeniScore: number;
  opportunity: 'alta' | 'media' | 'baja';
  reasoning: string;
}

export interface ContentUpdateCandidate {
  slug: string;
  titulo: string;
  categoria: string;
  gscImpressions: number;
  gscClicks: number;
  gscPosition: number;
  gscCtr: number;
  ga4Users: number;
  ga4AvgEngagementTimeSec: number;
  scoreMeni: number;
  reason: string;
  expectedImpact: 'alto' | 'medio' | 'bajo';
}

export interface NIOSWeeklyReport {
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  hasData: boolean;
  // 1. Contenido funcionando en Google
  topPerforming: ArticleFusion[];
  // 2. Contenido que Google ignora
  ignoredByGoogle: ArticleFusion[];
  // 3. Categorías con oportunidad
  categoryOpportunities: CategoryOpportunity[];
  // 4. Qué producir la próxima semana
  productionRecommendations: NIOSRecommendation[];
  // 5. Qué actualizar
  updateCandidates: ContentUpdateCandidate[];
  // 6. Qué bloquea AdSense
  adsenseBlockers: GoogleTrustArticle[];
  trust: GoogleTrustReport;
  learningPatterns: GoogleLearningPattern[];
  summary: string;
}

// ─── FASE 2.5: AdSense Recovery Operation ──────────────────────

export type RecoveryStatus = 'green' | 'yellow' | 'red';

export interface RecoveryArticle {
  slug: string;
  titulo: string;
  categoria: string;
  url: string;
  scoreMeni: number;
  googleTrustScore: number;
  gscImpressions: number;
  gscClicks: number;
  gscCtr: number;
  gscPosition: number;
  ga4Users: number;
  ga4Sessions: number;
  ga4Pageviews: number;
  ga4AvgEngagementTimeSec: number;
  ga4EngagementRate: number;
  palabras: number;
  hasAutor: boolean;
  hasFecha: boolean;
  hasFuente: boolean;
  hasContexto: boolean;
  recoveryScore: number;
  status: RecoveryStatus;
  mainProblem: string;
  recommendedAction: string;
  evidence: NIOSEvidence[];
}

export interface ContentRecoveryReport {
  generatedAt: string;
  totalArticles: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  greenPct: number;
  yellowPct: number;
  redPct: number;
  avgRecoveryScore: number;
  articles: RecoveryArticle[];
  topImprovement: RecoveryArticle[];
  topRisk: RecoveryArticle[];
  summary: string;
}

export interface AdSenseTrustCheck {
  generatedAt: string;
  adSenseTrustScore: number;
  editorialIdentityScore: number;
  contentQualityScore: number;
  userExperienceScore: number;
  trustScore: number;
  status: 'preparado' | 'mejorar' | 'no_solicitar';
  identity: {
    aboutComplete: boolean | null;
    teamVisible: boolean | null;
    contact: boolean | null;
    editorialPolicy: boolean | null;
    privacyPolicy: boolean | null;
    corrections: boolean | null;
  };
  contentQuality: {
    originalContentPct: number;
    depthPct: number;
    contextPct: number;
    sourcesPct: number;
    updatedPct: number;
  };
  userExperience: {
    avgEngagementTimeSec: number;
    mobileSharePct: number;
    internalLinksCoveragePct: number;
  };
  recommendations: NIOSRecommendation[];
  summary: string;
}

export interface ImprovementRecommendation {
  id: string;
  slug: string;
  titulo: string;
  categoria: string;
  trigger: string;
  observation: string;
  recommendedAction: string;
  evidence: NIOSEvidence[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface AdSenseRecoveryFullReport {
  generatedAt: string;
  likelyRejectionReason: string;
  topAffectingUrls: RecoveryArticle[];
  topPotentialUrls: RecoveryArticle[];
  authorityCategories: { categoria: string; avgGoogleTrust: number; avgMeni: number; articleCount: number; strengthensAuthority: boolean }[];
  transformationCategories: { categoria: string; avgGoogleTrust: number; avgMeni: number; articleCount: number; redCount: number; reason: string }[];
  readyToReapply: 'no' | 'maybe' | 'yes';
  trustCheck: AdSenseTrustCheck;
  contentRecovery: ContentRecoveryReport;
  improvements: ImprovementRecommendation[];
  summary: string;
}

// ─── Config ────────────────────────────────────────────────────

export interface NIOSConfig {
  siteUrl: string;
  ga4PropertyId: string;
  daysToCollect: number;
  minImpressionsForInsight: number;
  minArticlesForCompliance: number;
}

export const DEFAULT_NIOS_CONFIG: NIOSConfig = {
  siteUrl: 'https://nicaraguainformate.com',
  ga4PropertyId: '',
  daysToCollect: 28,
  minImpressionsForInsight: 10,
  minArticlesForCompliance: 5,
};
