/**
 * NIOS v5 — Growth Engine
 * =========================
 * Detecta oportunidades reales de crecimiento editorial a partir de:
 * - Google Search Console
 * - Google Analytics 4
 * - Firestore (artículos fusionados)
 * - MENI / Trust Score
 *
 * No inventa datos. No afirma causalidad. Solo detecta señales, propone
 * acciones seguras o sujetas a aprobación, y deja preparada la medición.
 */

import type {
  DailySnapshot,
  ArticleFusion,
  GSCSnapshot,
  GA4Snapshot,
  GoogleTrustReport,
} from '@/lib/nios/intelligence/types';
import type {
  GrowthOpportunity,
  GrowthOpportunityKind,
  GrowthPlanItem,
  GrowthImpact,
  GrowthConfidence,
  GrowthEffort,
  GrowthUrgency,
  GrowthEvidence,
  GrowthEngineResult,
  GrowthOpportunityTarget,
} from './types';

const DEFAULT_SITE_URL = 'https://nicaraguainformate.com';

function daysSince(dateStr: string): number {
  return Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function urlForSlug(slug: string): string {
  return `${DEFAULT_SITE_URL}/noticias/${slug}`;
}

function evidence(source: string, metric: string, value: string | number, note?: string): GrowthEvidence {
  return { source, metric, value: typeof value === 'number' ? Math.round(value * 100) / 100 : value, note };
}

function impactFromScore(score: number): GrowthImpact {
  if (score >= 70) return 'alto';
  if (score >= 40) return 'medio';
  return 'bajo';
}

function confidenceFromData(hasGsc: boolean, hasGa4: boolean, sampleSize: number): GrowthConfidence {
  if (hasGsc && hasGa4 && sampleSize >= 500) return 'alta';
  if ((hasGsc || hasGa4) && sampleSize >= 100) return 'media';
  return 'baja';
}

function effortForKind(kind: GrowthOpportunityKind): GrowthEffort {
  if (kind.startsWith('distribution')) return 'bajo';
  if (kind.startsWith('seo')) return 'bajo';
  if (kind.startsWith('content')) return 'medio';
  return 'medio';
}

function slugFromUrl(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/\/noticias\/([^/?#]+)/);
  return m?.[1] ?? null;
}

function findArticleBySlug(articles: ArticleFusion[], slug?: string): ArticleFusion | undefined {
  if (!slug) return undefined;
  return articles.find((a) => a.slug === slug);
}

function makeOpportunity(
  kind: GrowthOpportunityKind,
  category: GrowthOpportunity['category'],
  target: GrowthOpportunityTarget,
  headline: string,
  what: string,
  why: string,
  recommendedAction: string,
  metric: string,
  window: 24 | 72 | 168,
  impactScore: number,
  confidence: GrowthConfidence,
  urgency: GrowthUrgency,
  evidenceList: GrowthEvidence[],
): GrowthOpportunity {
  return {
    id: `growth-${kind}-${target.slug || target.query || target.category || 'na'}-${Date.now()}`,
    kind,
    category,
    target,
    headline,
    what,
    why,
    evidence: evidenceList,
    recommendedAction,
    metricToMeasure: metric,
    measurementWindowHours: window,
    impact: impactFromScore(impactScore),
    impactScore: Math.max(1, Math.min(100, Math.round(impactScore))),
    confidence,
    effort: effortForKind(kind),
    urgency,
  };
}

/**
 * SEO: artículos con impresiones altas y CTR bajo (< 2%).
 */
function detectCtrOpportunities(
  articles: ArticleFusion[],
  hasGsc: boolean,
): GrowthOpportunity[] {
  const out: GrowthOpportunity[] = [];
  if (!hasGsc) return out;

  const candidates = articles
    .filter((a) => a.hasGscData && a.gscImpressions >= 500 && a.gscCtr < 2 && a.gscPosition <= 20)
    .sort((a, b) => b.gscImpressions - a.gscImpressions)
    .slice(0, 8);

  for (const a of candidates) {
    const query = a.gscTopQueries?.[0]?.query;
    const score = Math.min(100, a.gscImpressions / 20 + (2 - a.gscCtr) * 10);
    const conf = confidenceFromData(true, false, a.gscImpressions);
    out.push(
      makeOpportunity(
        'seo-ctr-title',
        'seo',
        { slug: a.slug, title: a.titulo, url: a.url, category: a.categoria, query },
        `CTR bajo en "${a.titulo.slice(0, 60)}" (${a.gscImpressions.toLocaleString('es-NI')} imp, CTR ${a.gscCtr}%, pos ${a.gscPosition})`,
        `Este artículo aparece en Google con muchas impresiones pero pocos clics.`,
        `Mejorar el título/snippet puede aumentar clics sin necesidad de subir posición.`,
        `Preparar experimento de título/meta basado en la consulta principal y solicitar aprobación antes de publicar.`,
        'CTR (clics / impresiones)',
        72,
        score,
        conf,
        'HIGH',
        [
          evidence('Google Search Console', 'Impresiones 28d', a.gscImpressions),
          evidence('Google Search Console', 'Clics 28d', a.gscClicks),
          evidence('Google Search Console', 'CTR', `${a.gscCtr}%`),
          evidence('Google Search Console', 'Posición promedio', a.gscPosition),
          evidence('Google Search Console', 'Consulta principal', query ?? 'N/D'),
        ],
      ),
    );
  }
  return out;
}

/**
 * SEO: consultas en zona de salto (posición 4-20 con impresiones).
 */
function detectStrikeZoneOpportunities(
  gsc: GSCSnapshot | null,
  articles: ArticleFusion[],
  hasGsc: boolean,
): GrowthOpportunity[] {
  const out: GrowthOpportunity[] = [];
  if (!hasGsc || !gsc) return out;

  const seen = new Set<string>();
  for (const q of gsc.queries || []) {
    if (q.impressions < 100) continue;
    if (q.position < 4 || q.position > 20) continue;
    if (seen.has(q.query)) continue;
    seen.add(q.query);

    const related = articles.find(
      (a) =>
        a.titulo.toLowerCase().includes(q.query.toLowerCase()) ||
        a.gscTopQueries.some((tq) => tq.query === q.query),
    );

    const score = Math.min(100, q.impressions / 15 + (20 - q.position) * 3);
    const conf = confidenceFromData(true, false, q.impressions);
    out.push(
      makeOpportunity(
        'seo-strike-zone',
        'seo',
        { slug: related?.slug, title: related?.titulo, url: related?.url, query: q.query },
        `Zona de salto: "${q.query}" (pos ${q.position.toFixed(1)}, ${q.impressions.toLocaleString('es-NI')} imp)`,
        `La consulta "${q.query}" está cerca de la primera página de Google.`,
        `Añadir una sección H2 que responda exactamente a esta consulta puede saltar a top 5.`,
        `Preparar brief de actualización del artículo con una sección dedicada a "${q.query}".`,
        'Posición promedio',
        168,
        score,
        conf,
        'MEDIUM',
        [
          evidence('Google Search Console', 'Consulta', q.query),
          evidence('Google Search Console', 'Impresiones 28d', q.impressions),
          evidence('Google Search Console', 'Clics 28d', q.clicks),
          evidence('Google Search Console', 'Posición', q.position.toFixed(1)),
        ],
      ),
    );
  }
  return out.slice(0, 8);
}

/**
 * Distribución: artículos con buen desempeño (alto engagement) que pueden recircularse.
 */
function detectRecirculationOpportunities(
  articles: ArticleFusion[],
  hasGa4: boolean,
): GrowthOpportunity[] {
  const out: GrowthOpportunity[] = [];
  if (!hasGa4) return out;

  const candidates = articles
    .filter(
      (a) =>
        a.hasGa4Data &&
        a.ga4Pageviews >= 50 &&
        a.ga4AvgEngagementTimeSec >= 45 &&
        a.relatedLinksCount < 2,
    )
    .sort((a, b) => b.ga4Pageviews - a.ga4Pageviews)
    .slice(0, 6);

  for (const a of candidates) {
    const score = Math.min(100, a.ga4Pageviews / 5 + a.ga4AvgEngagementTimeSec / 2);
    const conf = confidenceFromData(false, true, a.ga4Pageviews);
    out.push(
      makeOpportunity(
        'distribution-recirculation',
        'distribution',
        { slug: a.slug, title: a.titulo, url: a.url, category: a.categoria },
        `Recirculación: "${a.titulo.slice(0, 60)}" (${a.ga4Pageviews} pv, ${a.ga4AvgEngagementTimeSec}s eng)`,
        `Los lectores pasan tiempo en esta nota pero no tienen enlaces a contenido relacionado.`,
        `Añadir enlaces internos puede retener al lector y aumentar páginas vistas por sesión.`,
        `Preparar 2-3 sugerencias de enlaces internos y copia para segunda distribución.`,
        'Pageviews por sesión',
        72,
        score,
        conf,
        'MEDIUM',
        [
          evidence('Google Analytics 4', 'Pageviews 28d', a.ga4Pageviews),
          evidence('Google Analytics 4', 'Engagement promedio', `${a.ga4AvgEngagementTimeSec}s`),
          evidence('Firestore', 'Enlaces relacionados actuales', a.relatedLinksCount),
        ],
      ),
    );
  }
  return out;
}

/**
 * Recuperación: artículos que caen de posición o pierden tráfico.
 */
function detectRecoveryOpportunities(articles: ArticleFusion[], hasGsc: boolean): GrowthOpportunity[] {
  const out: GrowthOpportunity[] = [];
  if (!hasGsc) return out;

  const candidates = articles
    .filter(
      (a) =>
        a.hasGscData &&
        a.gscImpressions >= 200 &&
        a.gscPosition > 10 &&
        a.gscPosition <= 30 &&
        daysSince(a.fechaPublicacion) > 30,
    )
    .sort((a, b) => b.gscImpressions - a.gscImpressions)
    .slice(0, 5);

  for (const a of candidates) {
    const days = daysSince(a.fechaPublicacion);
    const score = Math.min(100, a.gscImpressions / 15 + (a.gscPosition - 10));
    const conf = confidenceFromData(true, false, a.gscImpressions);
    out.push(
      makeOpportunity(
        'recovery-position-drop',
        'recovery',
        { slug: a.slug, title: a.titulo, url: a.url, category: a.categoria },
        `Recuperar: "${a.titulo.slice(0, 60)}" (pos ${a.gscPosition}, ${a.gscImpressions.toLocaleString('es-NI')} imp, hace ${days}d)`,
        `Este artículo tiene demanda en Google pero ha perdido posiciones.`,
        `Actualizar la fecha, contexto y datos puede devolverlo a mejores posiciones.`,
        `Preparar plan de actualización con datos frescos y verificar enlaces rotos.`,
        'Posición promedio',
        168,
        score,
        conf,
        'MEDIUM',
        [
          evidence('Google Search Console', 'Impresiones 28d', a.gscImpressions),
          evidence('Google Search Console', 'Posición', a.gscPosition),
          evidence('Firestore', 'Días desde publicación', days),
        ],
      ),
    );
  }
  return out;
}

/**
 * Contenido: noticias con potencial evergreen (temas recurrentes con tráfico).
 */
function detectEvergreenOpportunities(articles: ArticleFusion[], hasGsc: boolean): GrowthOpportunity[] {
  const out: GrowthOpportunity[] = [];
  if (!hasGsc) return out;

  const evergreenTriggers = ['cómo', 'requisitos', 'pasos', 'guía', 'costo', 'dólar', 'salario', 'pasaporte', 'apostilla', 'récord policial', 'migración', 'turismo', 'destinos'];
  const candidates = articles
    .filter(
      (a) =>
        a.hasGscData &&
        a.gscImpressions >= 300 &&
        evergreenTriggers.some((t) => a.titulo.toLowerCase().includes(t)),
    )
    .sort((a, b) => b.gscImpressions - a.gscImpressions)
    .slice(0, 4);

  for (const a of candidates) {
    const score = Math.min(100, a.gscImpressions / 10);
    const conf = confidenceFromData(true, false, a.gscImpressions);
    out.push(
      makeOpportunity(
        'content-evergreen',
        'content',
        { slug: a.slug, title: a.titulo, url: a.url, category: a.categoria },
        `Evergreen: "${a.titulo.slice(0, 60)}" (${a.gscImpressions.toLocaleString('es-NI')} imp)`,
        `Este tema tiene búsqueda recurrente y tráfico sostenido.`,
        `Convertirlo o complementarlo con una guía permanente captura tráfico a largo plazo.`,
        `Preparar brief para guía evergreen derivada; no modificar la nota original.`,
        'Clics orgánicos',
        168,
        score,
        conf,
        'LOW',
        [
          evidence('Google Search Console', 'Impresiones 28d', a.gscImpressions),
          evidence('Google Search Console', 'Clics 28d', a.gscClicks),
          evidence('Firestore', 'Tema recurrente detectado', a.titulo),
        ],
      ),
    );
  }
  return out;
}

/**
 * Contenido: artículos antiguos con tráfico que necesitan actualización.
 */
function detectUpdateOpportunities(articles: ArticleFusion[], hasGsc: boolean): GrowthOpportunity[] {
  const out: GrowthOpportunity[] = [];
  if (!hasGsc) return out;

  const candidates = articles
    .filter(
      (a) =>
        a.hasGscData &&
        a.gscImpressions >= 500 &&
        daysSince(a.fechaPublicacion) > 60,
    )
    .sort((a, b) => b.gscImpressions - a.gscImpressions)
    .slice(0, 5);

  for (const a of candidates) {
    const days = daysSince(a.fechaPublicacion);
    const score = Math.min(100, a.gscImpressions / 10 + days / 10);
    const conf = confidenceFromData(true, false, a.gscImpressions);
    out.push(
      makeOpportunity(
        'content-update',
        'content',
        { slug: a.slug, title: a.titulo, url: a.url, category: a.categoria },
        `Actualizar: "${a.titulo.slice(0, 60)}" (${a.gscImpressions.toLocaleString('es-NI')} imp, hace ${days}d)`,
        `La nota sigue recibiendo búsquedas pero la información puede estar desactualizada.`,
        `Refrescar fechas, datos y contexto puede reactivar posiciones y clics.`,
        `Preparar plan de actualización; requiere aprobación editorial antes de publicar cambios.`,
        'Posición y clics',
        168,
        score,
        conf,
        'HIGH',
        [
          evidence('Google Search Console', 'Impresiones 28d', a.gscImpressions),
          evidence('Google Search Console', 'Posición', a.gscPosition),
          evidence('Firestore', 'Días desde publicación', days),
        ],
      ),
    );
  }
  return out;
}

/**
 * Distribución: artículos con momentum reciente para segunda distribución.
 */
function detectSecondPushOpportunities(
  articles: ArticleFusion[],
  hasGa4: boolean,
): GrowthOpportunity[] {
  const out: GrowthOpportunity[] = [];
  if (!hasGa4) return out;

  const candidates = articles
    .filter((a) => a.hasGa4Data && a.ga4Users >= 100 && a.ga4EngagementRate >= 0.5)
    .sort((a, b) => b.ga4Users - a.ga4Users)
    .slice(0, 4);

  for (const a of candidates) {
    const score = Math.min(100, a.ga4Users * 2 + a.ga4EngagementRate * 20);
    const conf = confidenceFromData(false, true, a.ga4Users);
    out.push(
      makeOpportunity(
        'distribution-second-push',
        'distribution',
        { slug: a.slug, title: a.titulo, url: a.url, category: a.categoria },
        `Segunda distribución: "${a.titulo.slice(0, 60)}" (${a.ga4Users} users, ${(a.ga4EngagementRate * 100).toFixed(0)}% eng)`,
        `Este artículo tiene engagement alto; una nueva distribución puede reactivar lectores.`,
        `Re-distribuir en Telegram/Facebook/WhatsApp cuando el tema siga vigente.`,
        `Preparar copia adaptada para redes y programar envío; requiere aprobación para publicar.`,
        'Usuarios 28d',
        24,
        score,
        conf,
        'LOW',
        [
          evidence('Google Analytics 4', 'Usuarios 28d', a.ga4Users),
          evidence('Google Analytics 4', 'Engagement rate', `${(a.ga4EngagementRate * 100).toFixed(1)}%`),
          evidence('Google Analytics 4', 'Pageviews 28d', a.ga4Pageviews),
        ],
      ),
    );
  }
  return out;
}

function actionIdFor(kind: GrowthOpportunityKind): string {
  const map: Record<GrowthOpportunityKind, string> = {
    'seo-ctr-title': 'prepare-seo-title-experiment',
    'seo-strike-zone': 'prepare-seo-strike-brief',
    'seo-internal-links': 'prepare-internal-links',
    'seo-title-experiment': 'prepare-seo-title-experiment',
    'content-update': 'prepare-update-brief',
    'content-evergreen': 'prepare-evergreen-brief',
    'content-related': 'prepare-content-related',
    'distribution-recirculation': 'prepare-recirculation-copy',
    'distribution-second-push': 'prepare-second-push-copy',
    'distribution-telegram': 'prepare-telegram-copy',
    'recovery-traffic-lost': 'prepare-recovery-brief',
    'recovery-position-drop': 'prepare-recovery-brief',
  };
  return map[kind];
}

function requiresApproval(kind: GrowthOpportunityKind): boolean {
  // SAFE: preparación nunca publica ni cambia nada en vivo.
  // La aprobación se requiere para ejecutar (publicar) cambios públicos.
  return !kind.startsWith('distribution');
}

function autoExecutable(_kind: GrowthOpportunityKind): boolean {
  // Todas las acciones N5 nivel SAFE se preparan automáticamente;
  // la ejecución pública requiere humano.
  return true;
}

function priorityScore(opp: GrowthOpportunity): number {
  const impact = opp.impactScore;
  const confidenceWeight = opp.confidence === 'alta' ? 1 : opp.confidence === 'media' ? 0.7 : 0.4;
  const effortWeight = opp.effort === 'bajo' ? 1 : opp.effort === 'medio' ? 0.8 : 0.6;
  const urgencyWeight = opp.urgency === 'HIGH' ? 1 : opp.urgency === 'MEDIUM' ? 0.7 : 0.4;
  return Math.round(impact * confidenceWeight * effortWeight * urgencyWeight);
}

export function buildGrowthOpportunities(
  _snapshot: DailySnapshot | null,
  articles: ArticleFusion[] = [],
  gsc: GSCSnapshot | null = null,
  ga4: GA4Snapshot | null = null,
  _trust?: GoogleTrustReport | null,
): GrowthOpportunity[] {
  const hasGsc = gsc?.status === 'REAL' && articles.some((a) => a.hasGscData);
  const hasGa4 = ga4?.status === 'REAL' && articles.some((a) => a.hasGa4Data);

  const opportunities: GrowthOpportunity[] = [];
  opportunities.push(...detectCtrOpportunities(articles, hasGsc));
  opportunities.push(...detectStrikeZoneOpportunities(gsc, articles, hasGsc));
  opportunities.push(...detectRecirculationOpportunities(articles, hasGa4));
  opportunities.push(...detectSecondPushOpportunities(articles, hasGa4));
  opportunities.push(...detectEvergreenOpportunities(articles, hasGsc));
  opportunities.push(...detectUpdateOpportunities(articles, hasGsc));
  opportunities.push(...detectRecoveryOpportunities(articles, hasGsc));

  return opportunities.sort((a, b) => priorityScore(b) - priorityScore(a));
}

export function buildGrowthPlan(
  opportunities: GrowthOpportunity[],
  _learningPatterns: unknown[] = [],
  maxItems = 5,
): GrowthPlanItem[] {
  const sorted = [...opportunities].sort((a, b) => priorityScore(b) - priorityScore(a));
  const now = new Date();

  return sorted.slice(0, maxItems).map((opp, i) => {
    const deadline = new Date(now.getTime() + opp.measurementWindowHours * 60 * 60 * 1000).toISOString();
    return {
      opportunity: opp,
      rank: i + 1,
      title: opp.headline,
      explanation: `${opp.what} ${opp.why} ${opp.recommendedAction}`,
      actionId: actionIdFor(opp.kind),
      requiresApproval: requiresApproval(opp.kind),
      autoExecutable: autoExecutable(opp.kind),
      impact: opp.impact,
      confidence: opp.confidence,
      effort: opp.effort,
      urgency: opp.urgency,
      metric: opp.metricToMeasure,
      deadline,
    };
  });
}

export function buildGrowthEngineResult(
  snapshot: DailySnapshot | null,
  articles: ArticleFusion[] = [],
  gsc: GSCSnapshot | null = null,
  ga4: GA4Snapshot | null = null,
  trust?: GoogleTrustReport | null,
  learningPatterns: unknown[] = [],
  maxPlan = 5,
): GrowthEngineResult {
  const opportunities = buildGrowthOpportunities(snapshot, articles, gsc, ga4, trust);
  const plan = buildGrowthPlan(opportunities, learningPatterns, maxPlan);

  const summary =
    opportunities.length === 0
      ? 'No se detectaron oportunidades de crecimiento con los datos actuales.'
      : `${opportunities.length} oportunidades detectadas. Plan de hoy: ${plan.length} acciones priorizadas.`;

  const speaks =
    plan.length === 0
      ? 'Hoy no encontré oportunidades de crecimiento claras con los datos disponibles. Continuaré monitoreando.'
      : `Hoy encontré ${opportunities.length} oportunidades de crecimiento. La más clara es: ${plan[0].title}. ` +
        `Recomiendo empezar por ${plan[0].opportunity.recommendedAction.toLowerCase()}.`;

  return { opportunities, plan, summary, speaks };
}

export { slugFromUrl, findArticleBySlug, urlForSlug, priorityScore };
