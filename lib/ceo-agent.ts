/**
 * CEO Agent — Nicaragua Informate
 * Capa ejecutiva editorial.
 * No es analytics. No es MENI. No es NIOS.
 * Observa, interpreta, decide y alerta.
 * REGLA: cada dato debe servir para una decisión editorial accionable.
 */

import type { Noticia } from '@/lib/types';
import { resolvePublicCategory } from '@/lib/editorial/canonical';

// ─── TIPOS ───────────────────────────────────────────────────────

export type CEOAction =
  | 'PUBLISH'
  | 'IMPROVE_BEFORE_PUBLISH'
  | 'REWRITE'
  | 'UPDATE_EXISTING'
  | 'DO_NOT_PUBLISH'
  | 'REPUBLISH'
  | 'RECIRCULATE'
  | 'WRITE_FOLLOWUP'
  | 'IMPROVE_HEADLINE'
  | 'IMPROVE_SNIPPET'
  | 'ADD_CONTEXT'
  | 'ADD_SERVICE_INFORMATION'
  | 'INVESTIGATE'
  | 'MONITOR'
  | 'ALERT_EDITOR'
  | 'NO_ACTION';

export type CEOUrgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type DataAvailability = 'REAL' | 'NO_DATA' | 'CONNECTED_NO_DATA' | 'ACCESS_BLOCKED';
export type ReaderInterest = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type CEORisk = 'LOW' | 'MEDIUM' | 'HIGH';

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
  viewsRecent?: number;
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

export interface RelatedArticle {
  slug: string;
  titulo: string;
  categoria: string;
  reason: string;
  evidence?: string[];
  confidence?: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedAction?: string;
}

export interface CEOExistingArticle {
  slug: string;
  titulo: string;
  reason: string;
  evidence: string[];
  whatToDo: string;
  similarity: number;
}

export interface CEOAlert {
  icon: string;
  title: string;
  message: string;
  action: string;
  urgency: CEOUrgency;
}

export interface CEOAnalysis {
  action: CEOAction;
  urgency: CEOUrgency;
  summary: string;
  whatIsHappening: string;
  whyItMatters: string;
  evidence: string[];
  whatToDo: string;
  whatNotToDo: string;
  risk: CEORisk;
  meni: CEODataSignal;
  traffic: CEODataSignal;
  google: CEODataSignal;
  dataStatus: CEODataStatus[];
  relatedArticles: RelatedArticle[];
  existingArticle: CEOExistingArticle | null;
  alert: CEOAlert | null;
}

export interface CEOAnalyzeContext {
  articlePool?: Noticia[];
  traffic?: TrafficEvidence;
  gsc?: GscData;
  ga4?: Ga4Data;
  facebook?: FacebookData;
  indexing?: IndexingEvidence;
}

export interface CEOBriefAction {
  action: CEOAction;
  slug: string;
  headline: string;
  why: string;
  evidence: string[];
  urgency: CEOUrgency;
}

export interface CEOBriefContext {
  articles: Noticia[];
  traffic?: Record<string, TrafficEvidence>;
  gsc?: GscData[];
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

function tokenSet(text: string): Set<string> {
  return new Set(tokenizeTitle(text));
}

function formatNumber(n: number | undefined | null): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return 'NO_DATA';
  return n.toLocaleString('es-NI');
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

interface SimilaritySignals {
  titleJaccard: number;
  summaryJaccard: number;
  keywordScore: number;
  tagScore: number;
  sameCategory: number;
  dateGapDays: number;
  dateRecency: number;
}

interface SimilarityResult {
  score: number;
  signals: SimilaritySignals;
}

function keywordScore(a?: string, b?: string): number {
  if (!a || !b) return 0;
  const setA = new Set(normalize(a).split(/[,;\s]+/).filter(Boolean));
  const setB = new Set(normalize(b).split(/[,;\s]+/).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  const shared = [...setA].filter(x => setB.has(x)).length;
  return shared / Math.max(setA.size, setB.size);
}

function scoreAndExplain(article: Noticia, candidate: Noticia): SimilarityResult {
  const titleA = tokenSet(article.titulo);
  const titleB = tokenSet(candidate.titulo);
  const summaryA = tokenSet(`${article.resumen || ''} ${article.contenido || ''}`);
  const summaryB = tokenSet(`${candidate.resumen || ''} ${candidate.contenido || ''}`);

  const titleJaccard = jaccard(titleA, titleB);
  const summaryJaccard = jaccard(summaryA, summaryB);
  const kws = keywordScore(article.keywords, candidate.keywords);
  const tags = tagScore(article.tags, candidate.tags);
  const sameCategory = normalize(article.categoria) === normalize(candidate.categoria) ? 1 : 0;
  const dateGap = daysBetween(article.fecha, candidate.fecha);
  const dateRecency = article.fecha && candidate.fecha ? 1 - Math.min(dateGap / 30, 1) : 0;
  const categoryPenalty = sameCategory ? 0 : 0.35;

  const score = Math.max(
    0,
    Math.min(
      1,
      titleJaccard * 0.35 +
        summaryJaccard * 0.25 +
        kws * 0.15 +
        tags * 0.10 +
        sameCategory * 0.10 +
        dateRecency * 0.05 -
        categoryPenalty,
    ),
  );

  return {
    score,
    signals: { titleJaccard, summaryJaccard, keywordScore: kws, tagScore: tags, sameCategory, dateGapDays: dateGap, dateRecency },
  };
}

// ─── RELACIONADOS ────────────────────────────────────────────────

export function findRelatedArticles(
  article: Noticia,
  pool: Noticia[] = [],
  max = 3,
): RelatedArticle[] {
  const scored = pool
    .filter(n => n.slug !== article.slug)
    .map(n => ({ noticia: n, ...scoreAndExplain(article, n) }))
    .filter(({ score }) => score > 0.15)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, max).map(({ noticia: n, score, signals }) => {
    const reasons: string[] = [];
    if (signals.sameCategory) reasons.push(`misma categoría (${n.categoria})`);
    if (signals.titleJaccard > 0) reasons.push(`coincidencia de título ${(signals.titleJaccard * 100).toFixed(0)}%`);
    if (signals.summaryJaccard > 0) reasons.push(`coincidencia de contenido ${(signals.summaryJaccard * 100).toFixed(0)}%`);
    if (signals.keywordScore > 0) reasons.push(`palabras clave compartidas ${(signals.keywordScore * 100).toFixed(0)}%`);
    if (signals.tagScore > 0) reasons.push(`${(signals.tagScore * 100).toFixed(0)}% de tags compartidos`);
    if (signals.dateRecency > 0) reasons.push(`publicada a ${Math.round(signals.dateGapDays)} días`);

    return {
      slug: n.slug,
      titulo: n.titulo,
      categoria: n.categoria,
      reason: reasons.length > 0 ? reasons.join('; ') : 'Coincidencia temática débil.',
      evidence: [
        `similitud=${(score * 100).toFixed(0)}%`,
        `categoría=${n.categoria}`,
        ...reasons,
      ],
      confidence: score > 0.4 ? 'MEDIUM' : 'LOW',
      recommendedAction: score > 0.55 ? `Considerar enlazar o fusionar con /noticias/${n.slug}` : `Enlazar contextualmente a /noticias/${n.slug} si aporta valor.`,
    };
  });
}

// ─── DUPLICADOS ──────────────────────────────────────────────────

export function findExistingArticleOpportunity(
  article: Noticia,
  pool: Noticia[] = [],
): CEOExistingArticle | null {
  const scored = pool
    .filter(n => n.slug !== article.slug)
    .map(n => ({ noticia: n, ...scoreAndExplain(article, n) }))
    .filter(({ score }) => score >= 0.55)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  const { noticia, score, signals } = scored[0];
  const evidence: string[] = [
    `Coincidencia temática: ${(score * 100).toFixed(0)}%.`,
    `Artículo existente: “${noticia.titulo}” (${noticia.categoria}).`,
    `Misma categoría: ${signals.sameCategory ? 'sí' : 'no'}.`,
    `Coincidencia título: ${(signals.titleJaccard * 100).toFixed(0)}%.`,
    `Coincidencia contenido: ${(signals.summaryJaccard * 100).toFixed(0)}%.`,
    `Coincidencia keywords: ${(signals.keywordScore * 100).toFixed(0)}%.`,
    `Coincidencia tags: ${(signals.tagScore * 100).toFixed(0)}%.`,
    `Diferencia de fechas: ${Math.round(signals.dateGapDays)} días.`,
  ];

  const mainReason =
    signals.titleJaccard >= 0.6
      ? 'El título es casi idéntico; es preferible actualizar la URL existente.'
      : signals.summaryJaccard >= 0.4
        ? 'El contenido aborda el mismo tema en profundidad; actualizar evita canibalización.'
        : 'Existe una noticia con intención temática muy cercana. No conviene crear otra URL.';

  return {
    slug: noticia.slug,
    titulo: noticia.titulo,
    reason: mainReason,
    evidence,
    whatToDo: `Actualizar /noticias/${noticia.slug} con la información nueva y redirigir o fusionar contenido.`,
    similarity: score,
  };
}

// ─── TRÁFICO ─────────────────────────────────────────────────────

function readTraffic(
  article: Noticia,
  traffic?: TrafficEvidence,
): { signal: CEODataSignal; interest: ReaderInterest; effective: number | undefined } {
  const totalViews = article.vistas;
  const recentViews = traffic?.viewsRecent;
  const effective: number | undefined = traffic ? (recentViews ?? totalViews) : totalViews;
  const source = traffic?.source ?? 'noticias.vistas';
  const status = traffic ? traffic.status : totalViews !== undefined ? 'REAL' : 'NO_DATA';

  let interest: ReaderInterest = 'UNKNOWN';
  if (traffic && traffic.status !== 'REAL') {
    interest = 'UNKNOWN';
  } else if (effective === undefined) {
    interest = 'UNKNOWN';
  } else if (effective >= THRESHOLD_HIGH_VIEWS) {
    interest = 'HIGH';
  } else if (effective >= THRESHOLD_MEDIUM_VIEWS) {
    interest = 'MEDIUM';
  } else if (effective >= THRESHOLD_LOW_VIEWS) {
    interest = 'LOW';
  } else if (effective >= 0) {
    interest = 'LOW';
  }

  const signal: CEODataSignal = {
    source,
    field: 'views',
    value: { total: totalViews ?? null, recent: recentViews ?? null },
    status,
  };

  return { signal, interest, effective };
}

// ─── GOOGLE / GSC ────────────────────────────────────────────────

export interface GoogleSignal {
  action: CEOAction;
  reason: string;
  evidence: string;
  urgency: CEOUrgency;
  field: 'headline' | 'snippet' | 'content' | 'none';
}

export function detectGoogleOpportunities(article: Partial<Noticia>, gsc?: GscData): GoogleSignal[] {
  const signals: GoogleSignal[] = [];

  if (!gsc) {
    return [];
  }

  if (gsc.status !== 'REAL' || typeof gsc.impressions !== 'number' || typeof gsc.clicks !== 'number') {
    return [];
  }

  const ctr = gsc.impressions > 0 ? gsc.clicks / gsc.impressions : 0;

  if (gsc.impressions >= 1000 && ctr < 0.02) {
    signals.push({
      action: 'IMPROVE_HEADLINE',
      reason: 'Google muestra la página, pero el titular o snippet no convierten suficientemente.',
      evidence: `Impresiones: ${formatNumber(gsc.impressions)}; CTR: ${(ctr * 100).toFixed(2)}%.`,
      urgency: 'HIGH',
      field: 'headline',
    });
  }

  if (gsc.impressions >= 1000 && ctr >= 0.05) {
    signals.push({
      action: 'WRITE_FOLLOWUP',
      reason: 'Tema con demanda y buen CTR confirmado.',
      evidence: `Impresiones: ${formatNumber(gsc.impressions)}; CTR: ${(ctr * 100).toFixed(2)}%.`,
      urgency: 'LOW',
      field: 'none',
    });
  }

  if (gsc.impressions >= 1000 && ctr < 0.015) {
    signals.push({
      action: 'IMPROVE_SNIPPET',
      reason: 'CTR muy bajo a pesar de impresiones reales. Posible problema de meta descripción o título.',
      evidence: `CTR: ${(ctr * 100).toFixed(2)}% con ${formatNumber(gsc.impressions)} impresiones.`,
      urgency: 'HIGH',
      field: 'snippet',
    });
  }

  if (gsc.queries && gsc.queries.length > 0) {
    const content = `${article.titulo || ''} ${article.resumen || ''} ${article.contenido || ''}`.toLowerCase();
    const missing = gsc.queries.slice(0, 5).filter(q => !content.includes(normalize(q)));
    if (missing.length > 0) {
      signals.push({
        action: 'ADD_CONTEXT',
        reason: 'GSC reporta búsquedas reales no cubiertas en el contenido.',
        evidence: `Queries no respondidas: ${missing.slice(0, 3).join(', ')}.`,
        urgency: 'MEDIUM',
        field: 'content',
      });
    }
  }

  return signals;
}

// ─── CALIDAD EDITORIAL LOCAL ─────────────────────────────────────

function evaluateContentShape(article: Noticia): { weakness: string; whatToDo: CEOAction; evidence: string } | null {
  const wordCount = article.palabras ?? 0;
  const hasContext = (article.contenido || '').includes('<h2') || (article.palabras ?? 0) >= 350;

  if (wordCount > 0 && wordCount < 200) {
    return {
      weakness: 'El contenido es demasiado superficial.',
      whatToDo: 'ADD_CONTEXT',
      evidence: `Solo ${wordCount} palabras. Mínimo recomendado: 350 con subtítulos y contexto.`,
    };
  }

  if (article.titulo.length > 70) {
    return {
      weakness: 'Título muy largo para SEO.',
      whatToDo: 'IMPROVE_HEADLINE',
      evidence: `Título de ${article.titulo.length} caracteres. Recomendado: máximo 60.`,
    };
  }

  if (wordCount >= 200 && !hasContext) {
    return {
      weakness: 'El contenido no entrega contexto suficiente.',
      whatToDo: 'ADD_CONTEXT',
      evidence: 'Faltan subtítulos descriptivos o antecedentes que respondan la intención del lector.',
    };
  }

  return null;
}

// ─── ANÁLISIS PRINCIPAL ──────────────────────────────────────────

function pickUrgency(action: CEOAction, interest: ReaderInterest, risk: CEORisk): CEOUrgency {
  if (action === 'DO_NOT_PUBLISH' || action === 'ALERT_EDITOR') return 'CRITICAL';
  if (risk === 'HIGH' || action === 'IMPROVE_HEADLINE' || action === 'UPDATE_EXISTING') return 'HIGH';
  if (interest === 'HIGH' || action === 'PUBLISH') return 'MEDIUM';
  return 'LOW';
}

function buildMeniSignal(article: Noticia): { signal: CEODataSignal; approved: boolean; score: number | undefined } {
  const approved = article.aprobadoMeni === true;
  const score = article.scoreMeni ?? undefined;
  const status = typeof score === 'number' ? 'REAL' : 'NO_DATA';
  return {
    signal: { source: 'meni', field: 'score', value: { score: score ?? null, approved }, status },
    approved,
    score,
  };
}

export function analyzeForPublication(article: Noticia, context: CEOAnalyzeContext = {}): CEOAnalysis {
  const dataStatus: CEODataStatus[] = [];
  const evidence: string[] = [];

  // 1. MENI
  const meni = buildMeniSignal(article);
  dataStatus.push({ source: 'meni', field: 'aprobadoMeni', status: meni.approved ? 'REAL' : 'NO_DATA', value: meni.signal.value });

  // 2. Tráfico
  const { signal: trafficSignal, interest, effective: trafficEffective } = readTraffic(article, context.traffic);
  dataStatus.push({ source: 'traffic', field: 'views', status: trafficSignal.status, value: trafficSignal.value });

  // 3. GSC
  const googleSignals = detectGoogleOpportunities(article, context.gsc);
  const googleSignal: CEODataSignal = context.gsc
    ? { source: 'gsc', field: 'impressions/clicks', value: { impressions: context.gsc.impressions, clicks: context.gsc.clicks }, status: context.gsc.status }
    : { source: 'gsc', field: 'impressions/clicks', value: null, status: 'ACCESS_BLOCKED' };
  dataStatus.push({ source: 'gsc', field: 'impressions/clicks', status: googleSignal.status, value: googleSignal.value });

  // 4. Indexación
  dataStatus.push({
    source: 'indexing',
    field: 'indexing_log',
    status: context.indexing?.status ?? 'NO_DATA',
    value: context.indexing ?? null,
  });

  // 5. Relacionados y duplicados
  const related = context.articlePool ? findRelatedArticles(article, context.articlePool, 3) : [];
  const existing = context.articlePool ? findExistingArticleOpportunity(article, context.articlePool) : null;

  dataStatus.push({
    source: 'related',
    field: 'relatedArticles',
    status: related.length > 0 ? 'REAL' : 'NO_DATA',
    value: related.length,
  });
  dataStatus.push({
    source: 'history',
    field: 'existingArticle',
    status: existing ? 'REAL' : 'NO_DATA',
    value: existing ? existing.slug : null,
  });

  // 6. Clasificación temática
  const publicCategory = resolvePublicCategory(article);
  const fullText = `${article.titulo} ${article.resumen} ${article.contenido || ''}`;
  const isService = hasMarker(fullText, SERVICE_MARKERS);
  const isEvent = hasMarker(fullText, EVENT_MARKERS);
  const wordCount = article.palabras ?? 0;

  if (isService) evidence.push('El contenido trata un tema de servicio ciudadano (trámites, prestaciones, derechos).');
  if (isEvent) evidence.push('El contenido trata un suceso o evento de actualidad.');
  if (interest === 'HIGH') evidence.push(`Interés del lector: alto (${formatNumber(trafficEffective)} vistas efectivas).`);
  if (interest === 'MEDIUM') evidence.push(`Interés del lector: moderado (${formatNumber(trafficEffective)} vistas efectivas).`);

  // 7. Decisión ejecutiva
  let action: CEOAction = 'NO_ACTION';
  let risk: CEORisk = 'LOW';
  let whatIsHappening = 'No se detecta una situación que requiera una decisión ejecutiva concreta.';
  let whyItMatters = 'Sin evidencia suficiente, el CEO no recomienda acción.';
  let whatToDo = 'No hacer nada por ahora. Monitorizar si se obtienen datos reales.';
  let whatNotToDo = 'No inventar conclusiones ni forzar una acción sin evidencia.';
  let alert: CEOAlert | null = null;

  if (!meni.approved && typeof meni.score === 'number' && meni.score > 0 && meni.score < 60) {
    action = 'DO_NOT_PUBLISH';
    risk = 'HIGH';
    whatIsHappening = 'MENI evaluó la nota y la rechazó por calidad editorial insuficiente.';
    whyItMatters = 'Publicar contenido rechazado por MENI daña la credibilidad del sitio.';
    whatToDo = 'No publicar. Reescribir desde cero siguiendo la retroalimentación de MENI.';
    whatNotToDo = 'No intentar publicar con ajustes cosméticos.';
    alert = { icon: '🛑', title: 'NO PUBLICAR', message: 'MENI rechazó la nota con score bajo.', action: 'Descartar o reescribir', urgency: 'CRITICAL' };
  } else if (!meni.approved) {
    action = 'IMPROVE_BEFORE_PUBLISH';
    risk = 'MEDIUM';
    whatIsHappening = 'MENI no aprobó la nota todavía.';
    whyItMatters = 'La nota necesita cumplir el umbral de calidad editorial antes de salir.';
    whatToDo = 'Revisar según retroalimentación de MENI y volver a evaluar.';
    whatNotToDo = 'No publicar antes de obtener aprobación de MENI.';
    alert = { icon: '✍️', title: 'MENI NO APROBÓ', message: 'La calidad editorial no alcanza el umbral.', action: 'Mejorar antes de publicar', urgency: 'HIGH' };
  } else if (existing) {
    action = 'UPDATE_EXISTING';
    risk = 'MEDIUM';
    whatIsHappening = `Existe una noticia con la misma intención: “${existing.titulo}”.`;
    whyItMatters = 'Crear otra URL fragmenta la autoridad del contenido y confunde al lector.';
    whatToDo = existing.whatToDo;
    whatNotToDo = 'No crear una nueva URL para el mismo tema.';
    alert = { icon: '🛑', title: 'NO CREAR OTRA URL', message: existing.reason, action: 'Actualizar la nota existente', urgency: 'HIGH' };
    evidence.push(...existing.evidence);
  } else if (googleSignals.length > 0) {
    const top = googleSignals[0];
    action = top.action;
    risk = top.urgency === 'HIGH' ? 'MEDIUM' : 'LOW';
    whatIsHappening = top.reason;
    whyItMatters = 'GSC entrega evidencia real de cómo Google está mostrando la página.';
    whatToDo = top.action === 'IMPROVE_HEADLINE' ? 'Reescribir el titular para que sea más claro y atractivo en resultados.'
      : top.action === 'IMPROVE_SNIPPET' ? 'Reescribir título y meta descripción para mejorar el snippet.'
      : top.action === 'ADD_CONTEXT' ? 'Ampliar el contenido respondiendo las búsquedas reales reportadas por GSC.'
      : 'Mantener posición y considerar contenido relacionado.';
    whatNotToDo = 'No ignorar la evidencia de GSC ni inventar queries.';
    alert = { icon: '⚠️', title: 'GOOGLE EVIDENCIA', message: top.reason, action: whatToDo, urgency: top.urgency };
    evidence.push(top.evidence);
  } else {
    const ageInDays = daysBetween(article.fecha, new Date().toISOString());
    const historical = article.vistas;
    const recent = context.traffic?.viewsRecent;
    const isFalling = ageInDays > 30 && typeof historical === 'number' && historical > THRESHOLD_HIGH_VIEWS && typeof recent === 'number' && recent < THRESHOLD_MEDIUM_VIEWS;
    const shape = evaluateContentShape(article);

    if (isFalling) {
      action = 'UPDATE_EXISTING';
      risk = 'HIGH';
      whatIsHappening = 'Esta nota está cayendo.';
      whyItMatters = 'El contenido perdió interés con el tiempo; actualizarlo recupera valor.';
      whatToDo = 'Revisar datos nuevos, actualizar contexto y volver a distribuir.';
      whatNotToDo = 'No dejar la URL obsoleta sin actualizar.';
      alert = { icon: '🚨', title: 'ACTUALIZAR', message: whatIsHappening, action: 'Actualizar', urgency: 'HIGH' };
      evidence.push(`Vistas históricas: ${formatNumber(historical)}; recientes: ${formatNumber(recent)}.`);
    } else if (shape) {
      action = shape.whatToDo;
      risk = 'MEDIUM';
      whatIsHappening = shape.weakness;
      whyItMatters = 'El contenido no responde suficientemente la intención del lector o tiene un problema técnico claro.';
      whatToDo = action === 'IMPROVE_HEADLINE' ? 'Acortar el título a máximo 60 caracteres sin perder sentido.'
        : 'Agregar contexto, antecedentes, subtítulos descriptivos y datos verificables.';
      whatNotToDo = 'No publicar tal como está.';
      alert = { icon: '⚠️', title: 'CONTENIDO DÉBIL', message: shape.weakness, action: whatToDo, urgency: 'HIGH' };
      evidence.push(shape.evidence);
    } else if (interest === 'HIGH' && (isService || isEvent || publicCategory === 'Sucesos')) {
      action = 'PUBLISH';
      risk = 'LOW';
      whatIsHappening = 'La nota tiene evidencia real de demanda y cumple la calidad editorial.';
      whyItMatters = 'Publicar ahora aprovecha el interés del lector y la autoridad del tema.';
      whatToDo = 'Publicar y, después, considerar contenido relacionado o recirculación.';
      whatNotToDo = 'No dejar la nota en borrador si ya hay demanda demostrada.';
      alert = { icon: '🔥', title: 'PUBLICAR', message: 'Evidencia de demanda y calidad editorial aprobada.', action: 'Publicar', urgency: 'MEDIUM' };
    } else if (interest === 'MEDIUM' && (isService || publicCategory === 'Sucesos')) {
      action = 'PUBLISH';
      risk = 'LOW';
      whatIsHappening = 'Demanda moderada real en una categoría con tráfico recurrente.';
      whyItMatters = 'La nota aporta valor en un tema con tráfico moderado real.';
      whatToDo = 'Publicar y monitorear evolución de tráfico y CTR.';
      whatNotToDo = 'No esperar datos infinitos si ya hay demanda moderada.';
      alert = { icon: '🔥', title: 'PUBLICAR', message: 'Demanda moderada demostrada.', action: 'Publicar', urgency: 'LOW' };
    } else if (interest === 'HIGH' && !isService && publicCategory !== 'Sucesos') {
      action = 'WRITE_FOLLOWUP';
      risk = 'MEDIUM';
      whatIsHappening = 'La nota genera interés alto; puede abrirse a piezas complementarias.';
      whyItMatters = 'Aprovechar el interés con contenido relacionado fortalece la cobertura del tema.';
      whatToDo = 'Publicar y planificar una segunda pieza relacionada con datos reales.';
      whatNotToDo = 'No repetir el mismo ángulo en otra URL.';
      alert = { icon: '📈', title: 'CREAR SEGUIMIENTO', message: 'Interés alto: producir pieza complementaria.', action: 'Planificar follow-up', urgency: 'MEDIUM' };
    } else if (interest === 'LOW' && (isService || isEvent)) {
      action = 'MONITOR';
      risk = 'LOW';
      whatIsHappening = 'El tema es relevante pero aún no hay evidencia de tráfico.';
      whyItMatters = 'Si recién se publica o el evento es reciente, puede necesitar tiempo para acumular datos.';
      whatToDo = 'Monitorear tráfico y GSC durante 24-48 horas.';
      whatNotToDo = 'No descartarla solo porque el tráfico todavía es bajo.';
      alert = { icon: 'ℹ️', title: 'MONITOR', message: 'Tema relevante sin tráfico demostrado todavía.', action: 'Esperar datos', urgency: 'LOW' };
    } else if (interest === 'UNKNOWN' && (isService || isEvent)) {
      action = 'MONITOR';
      risk = 'LOW';
      whatIsHappening = 'El tema tiene potencial editorial pero no hay datos de tráfico disponibles.';
      whyItMatters = 'Sin tráfico no se puede confirmar interés; tampoco se puede descartar.';
      whatToDo = 'Publicar si MENI aprueba y monitorear.';
      whatNotToDo = 'No inventar interés del lector.';
    } else if (wordCount > 0 && wordCount < 200) {
      action = 'ADD_CONTEXT';
      risk = 'HIGH';
      whatIsHappening = 'El contenido es demasiado corto para justificar una URL propia.';
      whyItMatters = 'Una nota superficial no responde la intención del lector y perjudica el SEO.';
      whatToDo = 'Expandir a mínimo 350 palabras con subtítulos, antecedentes y datos concretos.';
      whatNotToDo = 'No publicar una nota de menos de 200 palabras.';
    } else if (interest === 'LOW' && !isService && !isEvent) {
      action = 'DO_NOT_PUBLISH';
      risk = 'HIGH';
      whatIsHappening = 'Bajo tráfico y sin patrón de servicio o suceso demostrado.';
      whyItMatters = 'Este contenido no aporta suficiente valor para ocupar una URL.';
      whatToDo = 'No publicar; redirigir esfuerzo a un tema con evidencia de demanda.';
      whatNotToDo = 'No publicar por inercia.';
      alert = { icon: '🛑', title: 'NO APORTA SUFICIENTE VALOR', message: whatIsHappening, action: 'Descartar', urgency: 'HIGH' };
    } else {
      action = 'NO_ACTION';
      risk = 'LOW';
      whatIsHappening = 'No hay evidencia suficiente para recomendar una acción concreta.';
      whyItMatters = 'Actuar sin evidencia es peor que esperar.';
      whatToDo = 'No hacer nada. Monitorear si llegan datos reales.';
      whatNotToDo = 'No inventar tráfico, GSC o GA4 para justificar una decisión.';
    }
  }

  // 8. Resumen ejecutivo
  const summaryParts = [whatIsHappening, whyItMatters, `Acción: ${whatToDo}`];
  if (existing) summaryParts.unshift(`⚠️ ${existing.reason}`);
  if (meni.approved && action === 'PUBLISH') summaryParts.push('MENI aprobó la calidad editorial.');
  const summary = summaryParts.join(' ');

  // 9. Si MENI aprobó pero hay problema de contenido, no publicar tal cual
  if (meni.approved && (action === 'PUBLISH' || action === 'WRITE_FOLLOWUP') && wordCount < 250) {
    action = 'ADD_CONTEXT';
    whatIsHappening = 'MENI aprueba, pero el contenido es demasiado corto para publicar.';
    whyItMatters = 'Una nota aprobada pero escasa no satisface al lector ni a Google.';
    whatToDo = 'Agregar contexto y datos antes de publicar.';
    whatNotToDo = 'No publicar una nota aprobada pero incompleta.';
    alert = { icon: '✍️', title: 'FALTA CONTEXTO', message: whatIsHappening, action: 'Agregar contexto', urgency: 'HIGH' };
  }

  const urgency = pickUrgency(action, interest, risk);

  return {
    action,
    urgency,
    summary,
    whatIsHappening,
    whyItMatters,
    evidence,
    whatToDo,
    whatNotToDo,
    risk,
    meni: meni.signal,
    traffic: trafficSignal,
    google: googleSignal,
    dataStatus,
    relatedArticles: related,
    existingArticle: existing,
    alert,
  };
}

// ─── DAILY BRIEF ─────────────────────────────────────────────────

function hasRealViews(a: Noticia, traffic?: TrafficEvidence): boolean {
  const effective = traffic?.viewsRecent ?? a.vistas;
  return typeof effective === 'number';
}

function articleViews(a: Noticia, traffic?: TrafficEvidence): number | undefined {
  return traffic?.viewsRecent ?? a.vistas;
}

export function getCEODailyBrief(context: CEOBriefContext): CEOBriefAction[] {
  const actions: CEOBriefAction[] = [];
  const { articles, traffic, gsc } = context;

  // 1. Contenido de servicio que funciona → agregar información
  const serviceByViews = [...articles]
    .filter(a => hasRealViews(a, traffic?.[a.slug]))
    .filter(a => hasMarker(`${a.titulo} ${a.resumen}`, SERVICE_MARKERS))
    .sort((a, b) => (articleViews(b, traffic?.[b.slug]) ?? -1) - (articleViews(a, traffic?.[a.slug]) ?? -1));

  const topService = serviceByViews[0];
  if (topService) {
    const ev = traffic?.[topService.slug];
    actions.push({
      action: 'ADD_SERVICE_INFORMATION',
      slug: topService.slug,
      headline: topService.titulo,
      why: 'El contenido de servicio está generando tráfico real. Puede profundizarse.',
      evidence: [`Vistas: ${formatNumber(articleViews(topService, ev))}.`, 'Tema de trámites/prestaciones.'],
      urgency: 'HIGH',
    });
  }

  // 2. GSC: titular con alto CTR bajo
  if (gsc) {
    const weakHeadline = gsc.find(g => g.status === 'REAL' && g.impressions >= 1000 && (g.clicks / g.impressions) < 0.02);
    const targetSlug = articles.find(a => hasRealViews(a, traffic?.[a.slug]))?.slug ?? 'UNKNOWN';
    if (weakHeadline) {
      const article = articles.find(a => a.slug === targetSlug);
      actions.push({
        action: 'IMPROVE_HEADLINE',
        slug: targetSlug,
        headline: article?.titulo ?? 'Artículo con GSC',
        why: 'GSC muestra muchas impresiones pero pocos clics.',
        evidence: [`Impresiones: ${formatNumber(weakHeadline.impressions)}.`, `CTR: ${((weakHeadline.clicks / weakHeadline.impressions) * 100).toFixed(2)}%.`],
        urgency: 'HIGH',
      });
    }
  }

  // 3. Artículo antiguo con tráfico sostenido → actualizar
  const oldHigh = [...articles].find(a => {
    const age = Date.now() - new Date(a.fecha || Date.now()).getTime();
    const views = articleViews(a, traffic?.[a.slug]) ?? -1;
    return views > THRESHOLD_HIGH_VIEWS && age > 30 * 24 * 60 * 60 * 1000;
  });

  if (oldHigh) {
    const ev = traffic?.[oldHigh.slug];
    actions.push({
      action: 'UPDATE_EXISTING',
      slug: oldHigh.slug,
      headline: oldHigh.titulo,
      why: 'Artículo antiguo con tráfico demostrado. Puede perder interés si no se actualiza.',
      evidence: [`Vistas: ${formatNumber(articleViews(oldHigh, ev))}.`, `Publicado: ${oldHigh.fecha}.`],
      urgency: 'MEDIUM',
    });
  }

  // 4. Suceso de alta demanda → seguimiento
  const eventByViews = [...articles]
    .filter(a => hasRealViews(a, traffic?.[a.slug]))
    .filter(a => hasMarker(`${a.titulo} ${a.resumen}`, EVENT_MARKERS))
    .sort((a, b) => (articleViews(b, traffic?.[b.slug]) ?? -1) - (articleViews(a, traffic?.[a.slug]) ?? -1));

  const topEvent = eventByViews[0];
  if (topEvent && !actions.some(a => a.slug === topEvent.slug)) {
    const ev = traffic?.[topEvent.slug];
    actions.push({
      action: 'WRITE_FOLLOWUP',
      slug: topEvent.slug,
      headline: topEvent.titulo,
      why: 'El suceso tiene tráfico real. Un seguimiento puede capturar más interés.',
      evidence: [`Vistas: ${formatNumber(articleViews(topEvent, ev))}.`, 'Tema de actualidad.'],
      urgency: 'MEDIUM',
    });
  }

  // 5. Artículo más leído → recircular
  const topByViews = [...articles]
    .filter(a => hasRealViews(a, traffic?.[a.slug]))
    .sort((a, b) => (articleViews(b, traffic?.[b.slug]) ?? -1) - (articleViews(a, traffic?.[a.slug]) ?? -1))[0];

  if (topByViews && !actions.some(a => a.slug === topByViews.slug)) {
    const ev = traffic?.[topByViews.slug];
    actions.push({
      action: 'RECIRCULATE',
      slug: topByViews.slug,
      headline: topByViews.titulo,
      why: 'El artículo más leído puede canalizar tráfico a contenido relacionado.',
      evidence: [`Vistas: ${formatNumber(articleViews(topByViews, ev))}.`],
      urgency: 'LOW',
    });
  }

  return actions.slice(0, 5);
}
