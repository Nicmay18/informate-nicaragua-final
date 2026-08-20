/**
 * CEO Agent — Nicaragua Informate
 * Capa superior de decisión empresarial/editorial.
 * NO modifica MENI, canonical, taxonomía, ni publicación.
 * Usa datos existentes: noticias, traffic_daily, traffic_log, indexing_log.
 * No inventa métricas. Ausencia de datos = NO_DATA | CONNECTED_NO_DATA | ACCESS_BLOCKED.
 */

import type { Noticia } from '@/lib/types';
import { getEditorialDecision, resolvePublicCategory } from '@/lib/editorial/canonical';

// ─── TIPOS ───────────────────────────────────────────────────────

export type CEODecision =
  | 'PUBLISH'
  | 'PUBLISH_WITH_CHANGES'
  | 'HOLD'
  | 'REJECT'
  | 'UPDATE_EXISTING';

export type DataAvailability = 'REAL' | 'NO_DATA' | 'CONNECTED_NO_DATA' | 'ACCESS_BLOCKED';

export type ReaderInterest = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

export interface CEODataSignal {
  source: string;
  field: string;
  value: unknown;
  status: DataAvailability;
}

export interface CEODataStatus {
  source: 'meni' | 'traffic' | 'gsc' | 'ga4' | 'facebook' | 'indexing' | 'related' | 'history';
  field: string;
  status: DataAvailability;
  value?: unknown;
}

export interface TrafficEvidence {
  viewsTotal?: number;
  viewsRecent?: number; // últimos 7 días
  source?: string;
  status: DataAvailability;
}

export interface GscData {
  impressions: number;
  clicks: number;
  position?: number;
  queries?: string[];
  status: DataAvailability;
}

export interface Ga4Data {
  users?: number;
  sessions?: number;
  status: DataAvailability;
}

export interface FacebookData {
  reach?: number;
  clicks?: number;
  status: DataAvailability;
}

export interface IndexingEvidence {
  url?: string;
  status: DataAvailability;
  source?: string;
  lastNotified?: string;
}

export interface CEOOpportunity {
  type: string;
  reason: string;
  action: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RelatedArticle {
  slug: string;
  titulo: string;
  categoria: string;
  reason: string;
}

export interface CEOAnalysis {
  decision: CEODecision;
  confidence: number;
  confidenceReason: string;
  reasons: string[];
  evidence: string[];
  heuristics: string[];
  editorialQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  recommendedChanges: string[];
  readerInterest: ReaderInterest;
  trafficEvidence: CEODataSignal[];
  seoEvidence: CEODataSignal[];
  relatedArticles: RelatedArticle[];
  existingArticleOpportunity: {
    slug?: string;
    titulo?: string;
    reason: string;
    evidence: string[];
    recommendation: string;
    score?: number;
  } | null;
  risk: RiskLevel;
  nextAction: string;
  dataStatus: CEODataStatus[];
  opportunities: CEOOpportunity[];
}

export interface CEOAnalyzeContext {
  articlePool?: Noticia[]; // catálogo para recirculación y detección duplicados
  traffic?: TrafficEvidence;
  gsc?: GscData;
  ga4?: Ga4Data;
  facebook?: FacebookData;
  indexing?: IndexingEvidence;
}

export interface CEOBriefAction {
  priority: number;
  action: string;
  targetSlug: string;
  source: string;
  reason: string;
  evidence: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CEOBriefContext {
  articles: Noticia[];
  traffic?: TrafficEvidence[]; // por slug
  gsc?: GscData[]; // por slug
}

// ─── CONSTANTES ──────────────────────────────────────────────────

const SERVICE_MARKERS = new Set([
  'inss', 'seguro social', 'prestacion', 'prestaciones', 'beneficio', 'beneficios',
  'tramite', 'tramites', 'solicitar', 'solicitud', 'requisitos', 'como solicitar',
  'familiares', 'pension', 'jubilacion', 'subsidio', 'indemnizacion',
  'fallecimiento', 'procedimiento', 'aplicar', 'cobertura', 'afiliacion',
  'pago', 'cuota', 'aportes', 'matricula', 'licencia', 'pasaporte', 'dpi',
  'vacuna', 'hospital', 'salud', 'migracion', 'aduana', 'impuesto', 'iva',
]);

const EVENT_MARKERS = new Set([
  'accidente', 'transito', 'policia', 'homicidio', 'fallecido', 'muere', 'murio',
  'muerte', 'muerto', 'muerta', 'heridos', 'herido', 'lesionado', 'lesionada',
  'baleado', 'baleada', 'captura', 'delito', 'crimen', 'ataco', 'atacado',
  'atropello', 'embiste', 'embistio', 'incendio', 'rescate', 'arma', 'disparo',
  'balazo', 'golpeado', 'agredido', 'agredida', 'pelea', 'cocodrilo', 'ahogado',
  'desaparecido', 'secuestro', 'robo', 'asalto', 'atentado', 'explosion',
]);

const THRESHOLD_HIGH_VIEWS = 500;
const THRESHOLD_MEDIUM_VIEWS = 100;
const THRESHOLD_LOW_VIEWS = 20;

const HIGH_CONFIDENCE = 80;
const MEDIUM_CONFIDENCE = 50;

// ─── HELPERS ─────────────────────────────────────────────────────

function normalize(text = ''): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function hasMarker(text: string, markers: Set<string>): boolean {
  const n = normalize(text);
  for (const m of markers) {
    if (n.includes(m)) return true;
  }
  return false;
}

function tokenizeTitle(title: string): string[] {
  return normalize(title)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 3);
}

function wordsOverlap(a: string, b: string): number {
  const setA = new Set(tokenizeTitle(a));
  const setB = new Set(tokenizeTitle(b));
  let overlap = 0;
  for (const w of setA) if (setB.has(w)) overlap++;
  return overlap;
}

function categorySlug(c: string): string {
  return normalize(c).replace(/[^a-z0-9]/g, '');
}

function formatNumber(n: number | undefined | null): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return 'NO_DATA';
  return n.toLocaleString('es-NI');
}

// ─── TRÁFICO ─────────────────────────────────────────────────────

function buildTrafficSignals(
  article: Noticia,
  traffic?: TrafficEvidence,
): { signals: CEODataSignal[]; interest: ReaderInterest } {
  const signals: CEODataSignal[] = [];
  let interest: ReaderInterest = 'UNKNOWN';

  const totalViews = article.vistas ?? 0;
  signals.push({
    source: 'noticias.vistas',
    field: 'vistas',
    value: totalViews,
    status: totalViews > 0 ? 'REAL' : 'NO_DATA',
  });

  if (traffic) {
    signals.push({
      source: traffic.source ?? 'traffic',
      field: 'viewsRecent',
      value: traffic.viewsRecent ?? 'NO_DATA',
      status: traffic.status,
    });

    const recent = traffic.viewsRecent ?? 0;
    const effective = totalViews || recent;

    if (effective >= THRESHOLD_HIGH_VIEWS) {
      interest = 'HIGH';
    } else if (effective >= THRESHOLD_MEDIUM_VIEWS) {
      interest = 'MEDIUM';
    } else if (effective >= THRESHOLD_LOW_VIEWS) {
      interest = 'LOW';
    } else if (effective > 0) {
      interest = 'LOW';
    } else {
      interest = 'UNKNOWN';
    }
  } else if (totalViews > 0) {
    if (totalViews >= THRESHOLD_HIGH_VIEWS) interest = 'HIGH';
    else if (totalViews >= THRESHOLD_MEDIUM_VIEWS) interest = 'MEDIUM';
    else if (totalViews >= THRESHOLD_LOW_VIEWS) interest = 'LOW';
    else interest = 'LOW';
  }

  return { signals, interest };
}

// ─── SEO / GSC ───────────────────────────────────────────────────

export function detectGoogleOpportunities(
  article: Partial<Noticia>,
  gsc?: GscData,
): CEOOpportunity[] {
  const opportunities: CEOOpportunity[] = [];

  if (!gsc) {
    return [
      { type: 'GSC_UNAVAILABLE', reason: 'No hay datos de Google Search Console.', action: 'Conectar GSC para obtener métricas reales.', severity: 'LOW' },
    ];
  }

  if (gsc.status !== 'REAL' || typeof gsc.impressions !== 'number' || typeof gsc.clicks !== 'number') {
    return [
      { type: 'GSC_NO_DATA', reason: 'GSC conectado pero sin datos para esta URL.', action: 'Esperar acumulación de datos o verificar URL.', severity: 'LOW' },
    ];
  }

  const ctr = gsc.impressions > 0 ? gsc.clicks / gsc.impressions : 0;

  if (gsc.impressions >= 1000 && ctr < 0.02) {
    opportunities.push({
      type: 'HIGH_IMPRESSIONS_LOW_CTR',
      reason: `Muchas impresiones (${formatNumber(gsc.impressions)}) y CTR bajo (${(ctr * 100).toFixed(2)}%).`,
      action: 'Revisar título y meta descripción para mejorar conversión en resultados.',
      severity: 'HIGH',
    });
  }

  if (gsc.impressions >= 1000 && ctr >= 0.05) {
    opportunities.push({
      type: 'HIGH_IMPRESSIONS_HIGH_CTR',
      reason: `Tema con demanda y buen CTR (${(ctr * 100).toFixed(2)}%).`,
      action: 'Mantener posición y considerar contenido relacionado.',
      severity: 'LOW',
    });
  }

  if (gsc.position !== undefined) {
    if (gsc.position <= 10 && gsc.position > 3 && ctr < 0.03) {
      opportunities.push({
        type: 'POSITION_IMPROVEMENT',
        reason: `Posición observada ${gsc.position}. Hay margen para ascender con mejores snippets.`,
        action: 'Optimizar H1, título y primer párrafo para la query principal.',
        severity: 'MEDIUM',
      });
    }
    if (gsc.position > 15) {
      opportunities.push({
        type: 'POSITION_DECLINE',
        reason: `Posición ${gsc.position}: lejos del top 10.`,
        action: 'Evaluar si el contenido satisface la intención de búsqueda.',
        severity: 'MEDIUM',
      });
    }
  }

  if (gsc.impressions > 0 && gsc.impressions < 100) {
    opportunities.push({
      type: 'LOW_IMPRESSIONS',
      reason: `Solo ${formatNumber(gsc.impressions)} impresiones. Demanda de búsqueda aún no probada.`,
      action: 'Verificar indexación y difusión social.',
      severity: 'LOW',
    });
  }

  const title = article.titulo || '';
  if (title.length > 0 && (title.length < 30 || title.length > 70)) {
    const isLong = title.length > 70;
    opportunities.push({
      type: 'TITLE_WEAK',
      reason: isLong ? `Título demasiado largo (${title.length} caracteres).` : 'Título posiblemente corto (<30 caracteres) o poco descriptivo.',
      action: isLong ? 'Reducir a máximo 60 caracteres.' : 'Ampliar el título con palabra clave principal si no excede 60 caracteres.',
      severity: isLong ? 'MEDIUM' : 'LOW',
    });
  }

  if (gsc.impressions >= 1000 && ctr < 0.015) {
    opportunities.push({
      type: 'SNIPPET_WEAK',
      reason: `CTR muy bajo (${(ctr * 100).toFixed(2)}%) a pesar de impresiones reales. Posible problema de título o meta descripción.`,
      action: 'Reescribir título y meta para aumentar relevancia en el snippet.',
      severity: 'HIGH',
    });
  }

  if (gsc.queries && gsc.queries.length > 0) {
    const content = `${article.titulo || ''} ${article.resumen || ''} ${article.contenido || ''}`.toLowerCase();
    const topQueries = gsc.queries.slice(0, 5);
    const missing = topQueries.filter(q => !content.includes(normalize(q)));
    if (missing.length > 0) {
      opportunities.push({
        type: 'CONTENT_GAP',
        reason: `GSC reporta queries reales no cubiertas en el contenido: ${missing.slice(0, 3).join(', ')}.`,
        action: 'Ampliar contenido respondiendo esas búsquedas con datos verificables.',
        severity: 'MEDIUM',
      });
    }
  } else {
    opportunities.push({
      type: 'QUERY_MISMATCH',
      reason: 'Sin queries reales reportadas por GSC.',
      action: 'No optimizar por queries inventadas; esperar datos reales.',
      severity: 'LOW',
    });
  }

  return opportunities;
}

// ─── RELACIONADOS ────────────────────────────────────────────────

export function findRelatedArticles(
  article: Noticia,
  pool: Noticia[] = [],
  max = 3,
): RelatedArticle[] {
  const sameCategory = pool
    .filter(n => n.slug !== article.slug && normalize(n.categoria) === normalize(article.categoria));

  const scored = sameCategory.map(n => {
    const overlap = wordsOverlap(article.titulo, n.titulo);
    const tagOverlap = (article.tags || []).filter(t => (n.tags || []).includes(t)).length;
    const score = overlap * 2 + tagOverlap * 3;
    return { noticia: n, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, max).map(({ noticia: n }) => ({
    slug: n.slug,
    titulo: n.titulo,
    categoria: n.categoria,
    reason: 'Misma categoría y temas relacionados.',
  }));
}

function tokenSet(text: string): Set<string> {
  return new Set(tokenizeTitle(text));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
}

function tagScore(aTags: string[] = [], bTags: string[] = []): number {
  if (aTags.length === 0 || bTags.length === 0) return 0;
  const setA = new Set(aTags.map(normalize));
  const setB = new Set(bTags.map(normalize));
  const shared = [...setA].filter(x => setB.has(x)).length;
  const max = Math.max(setA.size, setB.size);
  return max === 0 ? 0 : shared / max;
}

function daysBetween(a?: string, b?: string): number {
  if (!a || !b) return Number.MAX_SAFE_INTEGER;
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb)) return Number.MAX_SAFE_INTEGER;
  return Math.abs(ta - tb) / (1000 * 60 * 60 * 24);
}

function scoreExistingSimilarity(article: Noticia, candidate: Noticia): number {
  const titleA = tokenSet(article.titulo);
  const titleB = tokenSet(candidate.titulo);
  const summaryA = tokenSet(`${article.resumen || ''} ${article.contenido || ''}`);
  const summaryB = tokenSet(`${candidate.resumen || ''} ${candidate.contenido || ''}`);

  const titleJaccard = jaccard(titleA, titleB);
  const summaryJaccard = jaccard(summaryA, summaryB);
  const tagSimilarity = tagScore(article.tags, candidate.tags);
  const sameCategory = normalize(article.categoria) === normalize(candidate.categoria) ? 1 : 0;
  const dateGap = daysBetween(article.fecha, candidate.fecha);
  const recent = article.fecha && candidate.fecha ? 1 - Math.min(dateGap / 30, 1) : 0;

  // Pesos: título e intención son dominantes; categoría y tags refuerzan; cercanía temporal es secundaria.
  return Math.min(
    1,
    titleJaccard * 0.45 +
      summaryJaccard * 0.25 +
      tagSimilarity * 0.15 +
      sameCategory * 0.10 +
      recent * 0.05,
  );
}

function findExistingArticleOpportunity(
  article: Noticia,
  pool: Noticia[] = [],
): CEOAnalysis['existingArticleOpportunity'] {
  const scored = pool
    .filter(n => n.slug !== article.slug)
    .map(n => ({
      noticia: n,
      score: scoreExistingSimilarity(article, n),
      signals: {
        titleJaccard: jaccard(tokenSet(article.titulo), tokenSet(n.titulo)),
        summaryJaccard: jaccard(tokenSet(`${article.resumen || ''} ${article.contenido || ''}`), tokenSet(`${n.resumen || ''} ${n.contenido || ''}`)),
        tagSimilarity: tagScore(article.tags, n.tags),
        sameCategory: normalize(article.categoria) === normalize(n.categoria),
        daysApart: daysBetween(article.fecha, n.fecha),
      },
    }))
    .filter(({ score }) => score >= 0.55)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  const best = scored[0];
  const { noticia, score, signals } = best;
  const evidence: string[] = [
    `Puntuación de similitud: ${(score * 100).toFixed(0)}%.`,
    `Coincidencia de título: ${(signals.titleJaccard * 100).toFixed(0)}%.`,
    `Coincidencia de contenido/resumen: ${(signals.summaryJaccard * 100).toFixed(0)}%.`,
    signals.sameCategory ? `Misma categoría: ${article.categoria}.` : 'Categoría distinta.',
  ];
  if ((article.tags || []).length > 0 || (noticia.tags || []).length > 0) {
    evidence.push(`Etiquetas compartidas: ${(signals.tagSimilarity * 100).toFixed(0)}%.`);
  }
  if (signals.daysApart < Number.MAX_SAFE_INTEGER) {
    evidence.push(`Diferencia de fecha: ${signals.daysApart.toFixed(0)} días.`);
  }

  return {
    slug: noticia.slug,
    titulo: noticia.titulo,
    reason: `Existe una noticia con intención temática muy cercana. Considerar actualizar el existente antes de crear una URL nueva.`,
    evidence,
    recommendation: `Actualizar /noticias/${noticia.slug} con la nueva información y redirigir o fusionar contenido en lugar de crear otra URL.`,
    score,
  };
}

// ─── ANÁLISIS PRINCIPAL ──────────────────────────────────────────

export function analyzeForPublication(
  article: Noticia,
  context: CEOAnalyzeContext = {},
): CEOAnalysis {
  const dataStatus: CEODataStatus[] = [];
  const evidence: string[] = [];
  const reasons: string[] = [];
  const recommendedChanges: string[] = [];

  // 1. MENI: autoridad editorial (sin modificar)
  const editorial = getEditorialDecision(article);
  dataStatus.push({
    source: 'meni',
    field: 'aprobadoMeni',
    status: article.aprobadoMeni === true ? 'REAL' : 'NO_DATA',
    value: { aprobado: editorial.aprobado, razon: editorial.razon },
  });

  // 2. Tráfico
  const { signals: trafficSignals, interest } = buildTrafficSignals(article, context.traffic);
  dataStatus.push({
    source: 'traffic',
    field: 'views',
    status: context.traffic ? context.traffic.status : 'NO_DATA',
    value: article.vistas,
  });

  // 3. SEO
  const opportunities = detectGoogleOpportunities(article, context.gsc);
  const seoSignals: CEODataSignal[] = [];
  if (context.gsc) {
    seoSignals.push({
      source: 'gsc',
      field: 'impressions/clicks',
      value: { impressions: context.gsc.impressions, clicks: context.gsc.clicks },
      status: context.gsc.status,
    });
  } else {
    seoSignals.push({
      source: 'gsc',
      field: 'impressions/clicks',
      value: null,
      status: 'ACCESS_BLOCKED',
    });
  }

  // 4. GA4 / Facebook
  dataStatus.push({
    source: 'ga4',
    field: 'users/sessions',
    status: context.ga4?.status ?? 'ACCESS_BLOCKED',
    value: context.ga4 ?? null,
  });
  dataStatus.push({
    source: 'facebook',
    field: 'reach/clicks',
    status: context.facebook?.status ?? 'ACCESS_BLOCKED',
    value: context.facebook ?? null,
  });

  dataStatus.push({
    source: 'indexing',
    field: 'indexing_log',
    status: context.indexing?.status ?? 'NO_DATA',
    value: context.indexing ?? null,
  });

  // 5. Recirculación
  const related = context.articlePool ? findRelatedArticles(article, context.articlePool, 3) : [];
  dataStatus.push({
    source: 'related',
    field: 'relatedArticles',
    status: related.length > 0 ? 'REAL' : 'NO_DATA',
    value: related.length,
  });

  // 6. Oportunidad UPDATE_EXISTING
  const existing = context.articlePool
    ? findExistingArticleOpportunity(article, context.articlePool)
    : null;
  dataStatus.push({
    source: 'history',
    field: 'existingArticleOpportunity',
    status: existing ? 'REAL' : 'NO_DATA',
    value: existing ?? null,
  });

  // 7. Calidad editorial (MENI) — evidencia, no tráfico
  const meniScore = article.scoreMeni ?? 0;
  const editorialQuality: CEOAnalysis['editorialQuality'] =
    article.aprobadoMeni && meniScore >= 80
      ? 'HIGH'
      : article.aprobadoMeni
        ? 'MEDIUM'
        : meniScore > 0
          ? 'LOW'
          : 'UNKNOWN';

  dataStatus.push({
    source: 'meni',
    field: 'scoreMeni',
    status: article.scoreMeni !== undefined ? 'REAL' : 'NO_DATA',
    value: article.scoreMeni,
  });

  // 8. Patrones temáticos / intención del lector
  const publicCategory = resolvePublicCategory(article);
  const fullText = `${article.titulo} ${article.resumen} ${article.contenido || ''}`;
  const isService = hasMarker(fullText, SERVICE_MARKERS);
  const isEvent = hasMarker(fullText, EVENT_MARKERS);
  const wordCount = article.palabras ?? 0;
  const titleLength = article.titulo.length;
  const hasContext = (article.contenido || '').includes('<h2') || (article.palabras ?? 0) >= 350;

  const heuristics: string[] = [
    'Clasificación de servicio/suceso mediante marcadores léxicos.',
    'Umbrales de interés del lector: HIGH >= 500, MEDIUM >= 100, LOW >= 20 vistas.',
    'Detección de similitud para UPDATE_EXISTING mediante múltiples señales (título, resumen, etiquetas, categoría, fecha).',
  ];

  // Evidencia textual (real: proviene del propio artículo)
  if (isService) evidence.push('El contenido se identifica como información de servicio (trámites, prestaciones, derechos).');
  if (isEvent) evidence.push('El contenido trata un suceso o evento de actualidad.');
  if (interest === 'HIGH') evidence.push(`Tráfico histórico alto: ${formatNumber(article.vistas ?? (context.traffic?.viewsRecent ?? 0))} vistas.`);
  if (interest === 'MEDIUM') evidence.push(`Tráfico histórico moderado: ${formatNumber(article.vistas ?? (context.traffic?.viewsRecent ?? 0))} vistas.`);

  // 9. Decisión
  let decision: CEODecision = 'HOLD';
  let confidence = 0;
  let risk: RiskLevel = 'UNKNOWN';

  if (!editorial.aprobado && meniScore > 0 && meniScore < 60) {
    decision = 'REJECT';
    reasons.push(`MENI rechazó el artículo con score bajo (${meniScore}).`);
    recommendedChanges.push('Revisar según retroalimentación de MENI.');
    risk = 'HIGH';
    confidence = 25;
  } else if (!editorial.aprobado) {
    decision = 'HOLD';
    reasons.push(`MENI no aprobó: ${editorial.razon}`);
    recommendedChanges.push('Revisar según retroalimentación de MENI.');
    risk = 'HIGH';
    confidence = 30;
  } else if (existing) {
    decision = 'UPDATE_EXISTING';
    reasons.push(`Existe una noticia similar: “${existing.titulo}”.`);
    evidence.push(`Similitud temática con artículo existente (${existing.slug}) — ${(existing.score ?? 0 * 100).toFixed(0)}%.`);
    recommendedChanges.push(existing.recommendation);
    risk = 'MEDIUM';
    confidence = 75;
  } else if (interest === 'HIGH' && (isService || hasContext)) {
    decision = 'PUBLISH';
    reasons.push('Evidencia fuerte de demanda y contenido útil.');
    risk = 'LOW';
    confidence = 92;
  } else if (interest === 'MEDIUM' && (isService || publicCategory === 'Sucesos')) {
    decision = 'PUBLISH';
    reasons.push('Demanda moderada y categoría con tráfico recurrente.');
    risk = 'LOW';
    confidence = 78;
  } else if (interest === 'HIGH' && !hasContext) {
    decision = 'PUBLISH_WITH_CHANGES';
    reasons.push('Alta demanda histórica, pero el artículo necesita más contexto.');
    recommendedChanges.push('Agregar contexto, antecedentes y subtítulos descriptivos.');
    heuristics.push('Heurística: contenido con alta demanda histórica pero sin contexto suficiente (H2 o >= 350 palabras).');
    risk = 'MEDIUM';
    confidence = 70;
  } else if (interest === 'LOW' && !isService && publicCategory !== 'Sucesos') {
    decision = 'HOLD';
    reasons.push('Tráfico bajo y sin patrón de servicio/suceso demostrado.');
    risk = 'MEDIUM';
    confidence = 60;
  } else if (wordCount > 0 && wordCount < 200) {
    decision = 'PUBLISH_WITH_CHANGES';
    reasons.push('Contenido demasiado superficial (menos de 200 palabras).');
    recommendedChanges.push('Expandir a mínimo 350 palabras con subtítulos y contexto.');
    heuristics.push('Heurística: artículo con menos de 200 palabras se considera superficial.');
    risk = 'HIGH';
    confidence = 55;
  } else if (titleLength > 70) {
    decision = 'PUBLISH_WITH_CHANGES';
    reasons.push('Título posiblemente muy largo para SEO (más de 70 caracteres).');
    recommendedChanges.push('Reducir título a máximo 60 caracteres.');
    heuristics.push('Heurística: títulos superiores a 70 caracteres requieren ajuste SEO.');
    risk = 'MEDIUM';
    confidence = 62;
  } else {
    decision = 'HOLD';
    reasons.push('No hay evidencia suficiente de demanda o utilidad.');
    risk = 'MEDIUM';
    confidence = 40;
  }

  // SEO sobreescribe a PUBLISH solo si hay datos reales y problema claro
  if (decision === 'PUBLISH' && opportunities.some(o => o.type === 'HIGH_IMPRESSIONS_LOW_CTR' || o.type === 'SNIPPET_WEAK')) {
    decision = 'PUBLISH_WITH_CHANGES';
    recommendedChanges.push('Optimizar título/meta porque GSC muestra CTR bajo.');
    confidence = Math.max(confidence - 10, 60);
  }

  // 10. Data status de contexto
  if (!context.articlePool || context.articlePool.length === 0) {
    dataStatus.push({ source: 'related', field: 'articlePool', status: 'NO_DATA' });
  }

  // 11. Next action
  const nextAction = decisionToNextAction(decision, existing, related);

  return {
    decision,
    confidence,
    confidenceReason: confidence >= HIGH_CONFIDENCE ? 'Múltiples señales de evidencia.' : confidence >= MEDIUM_CONFIDENCE ? 'Evidencia parcial.' : 'Datos insuficientes o contradictorios.',
    reasons,
    evidence,
    heuristics,
    editorialQuality,
    recommendedChanges,
    readerInterest: interest,
    trafficEvidence: trafficSignals,
    seoEvidence: seoSignals,
    relatedArticles: related,
    existingArticleOpportunity: existing,
    risk,
    nextAction,
    dataStatus,
    opportunities,
  };
}

function decisionToNextAction(
  decision: CEODecision,
  existing: { slug?: string } | null,
  related: RelatedArticle[],
): string {
  switch (decision) {
    case 'PUBLISH':
      return `Publicar y enlazar a ${related.slice(0, 3).map(r => r.slug).join(', ') || 'artículos relacionados'} después de publicar.`;
    case 'PUBLISH_WITH_CHANGES':
      return 'Aplicar cambios recomendados, luego publicar y monitorear CTR en GSC.';
    case 'UPDATE_EXISTING':
      return `Actualizar ${existing?.slug || 'artículo existente'} y notificar a Google.`;
    case 'HOLD':
      return 'Esperar más evidencia o datos de tráfico antes de publicar.';
    case 'REJECT':
      return 'No publicar; archivar o redirigir esfuerzo a otro tema.';
    default:
      return 'Revisar manualmente.';
  }
}

// ─── DAILY BRIEF ─────────────────────────────────────────────────

export function getCEODailyBrief(context: CEOBriefContext): CEOBriefAction[] {
  const actions: CEOBriefAction[] = [];
  const byViews = [...context.articles].filter(a => (a.vistas ?? 0) > 0).sort((a, b) => (b.vistas ?? 0) - (a.vistas ?? 0));

  // 1. Actualizar artículo con más vistas si es de servicio
  const topService = byViews.find(a => {
    const text = `${a.titulo} ${a.resumen}`;
    return hasMarker(text, SERVICE_MARKERS);
  });

  if (topService) {
    actions.push({
      priority: 1,
      action: 'ACTUALIZAR_ARTICULO_SERVICIO',
      targetSlug: topService.slug,
      source: 'noticias.vistas + marcadores de servicio',
      reason: 'Contenido de servicio con tráfico demostrado.',
      evidence: [`${formatNumber(topService.vistas)} vistas históricas.`, 'Tema de trámites/prestaciones.'],
      confidence: 'HIGH',
    });
  }

  // 2. Revisar títulos con muchas impresiones y CTR bajo
  const gscHighImpressionsLowCtr = (context.gsc || []).find(g => g.status === 'REAL' && g.impressions > 1000 && (g.clicks / g.impressions) < 0.02);
  if (gscHighImpressionsLowCtr) {
    actions.push({
      priority: 2,
      action: 'REVISAR_TITULAR_CTR_BAJO',
      targetSlug: 'UNKNOWN',
      source: 'gsc',
      reason: 'GSC reporta impresiones altas con CTR bajo.',
      evidence: [`Impresiones: ${formatNumber(gscHighImpressionsLowCtr.impressions)}.`, `CTR: ${((gscHighImpressionsLowCtr.clicks / gscHighImpressionsLowCtr.impressions) * 100).toFixed(2)}%.`],
      confidence: 'HIGH',
    });
  }

  // 3. Identificar contenido antiguo con demanda (vistas altas y antiguo)
  const oldHigh = byViews.find(a => {
    const age = Date.now() - new Date(a.fecha || Date.now()).getTime();
    return (a.vistas ?? 0) > THRESHOLD_HIGH_VIEWS && age > 30 * 24 * 60 * 60 * 1000;
  });
  if (oldHigh) {
    actions.push({
      priority: 3,
      action: 'ACTUALIZAR_NOTICIA_ANTIGUA',
      targetSlug: oldHigh.slug,
      source: 'noticias.vistas + noticias.fecha',
      reason: 'Artículo antiguo con tráfico sostenido.',
      evidence: [`${formatNumber(oldHigh.vistas)} vistas históricas.`, `Publicado el ${oldHigh.fecha}.`],
      confidence: 'MEDIUM',
    });
  }

  // 4. Detectar categoría con poco tráfico
  const byCategory = new Map<string, number>();
  for (const a of context.articles) {
    byCategory.set(a.categoria, (byCategory.get(a.categoria) || 0) + (a.vistas ?? 0));
  }
  const [weakCategory] = [...byCategory.entries()].sort((a, b) => a[1] - b[1])[0] ?? [];
  if (weakCategory) {
    actions.push({
      priority: 4,
      action: 'EVALUAR_CATEGORIA_BAJO_RENDIMIENTO',
      targetSlug: categorySlug(weakCategory),
      source: 'noticias.vistas por categoría',
      reason: `La categoría "${weakCategory}" acumula el menor tráfico histórico.`,
      evidence: [`Vistas acumuladas: ${formatNumber(byCategory.get(weakCategory) || 0)}.`],
      confidence: 'LOW',
    });
  }

  // 5. Mejorar recirculación si hay artículo con muchas vistas
  if (byViews[0]) {
    actions.push({
      priority: 5,
      action: 'MEJORAR_RECIRCULACION',
      targetSlug: byViews[0].slug,
      source: 'noticias.vistas',
      reason: 'El artículo más leído puede canalizar tráfico a contenido relacionado.',
      evidence: [`${formatNumber(byViews[0].vistas)} vistas.`, 'Enlace a 1-3 artículos del mismo tema.'],
      confidence: 'HIGH',
    });
  }

  return actions.slice(0, 5);
}
