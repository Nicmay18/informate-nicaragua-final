/**
 * NIOS Intelligence Graph
 * =======================
 * Construye una vista unificada de artículos + señales + decisiones
 * sin duplicar motores. Es la fuente única del Command Center.
 *
 * Cada dato conserva su status, source y timestamp. NO_DATA no se convierte en 0.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { loadNoticiasFromFirestore, mergeArticleData } from '@/lib/nios/intelligence/data-merger';
import { getLatestSnapshot } from '@/lib/nios/intelligence/store';
import { evaluateArticleMomentum, type ArticleMomentum } from '@/lib/nios/intelligence/article-momentum';
import { getCeoMemory, type CeoMemory } from '@/lib/nios/ceo-memory';
import type { TrafficPerformance } from '@/lib/analytics/traffic-aggregator';
import type { NiosDataStatus, ArticleFusion, GSCSnapshot, GA4Snapshot } from '@/lib/nios/intelligence/types';
import { logger } from '@/lib/logger';

/* ── Types ───────────────────────────────────────────────────────── */

export interface EvidenceItem {
  source: string;
  api?: string;
  dateRange?: { start: string; end: string };
  metric: string;
  value: number | string | null;
  comparison?: string;
  collectedAt: string;
  freshnessHours?: number;
  confidence: number;
}

export interface IntelligenceEvent {
  id: string;
  articleId?: string;
  timestamp: string;
  source: 'MENI' | 'FORENSE' | 'EDITOR' | 'GSC' | 'GA4' | 'TRAFFIC' | 'GROWTH' | 'ENTITIES' | 'CEO' | 'NIOS' | 'SYSTEM';
  module: string;
  signal: string;
  metric?: string;
  value: number | string | null;
  status: NiosDataStatus;
  confidence: number;
  evidence: EvidenceItem[];
  recommendation?: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  action?: string;
  expectedOutcome?: string;
}

export interface CommandDecision {
  id: string;
  articleId?: string;
  timestamp: string;
  signal: string;
  source: string;
  inputs: string[];
  decision: 'NO_ACTION' | 'AUTO_EXECUTE' | 'QUEUE_FOR_HUMAN' | 'BLOCKED';
  priority: number;
  confidence: number;
  impact: number;
  risk: number;
  actionId?: string;
  actionTitle: string;
  reason: string;
  expectedOutcome: string;
  evidence: EvidenceItem[];
}

export interface ArticleIntelligence {
  identity: {
    articleId: string;
    url: string;
    title: string;
    category: string;
    author: string;
    publishedAt: string;
    updatedAt: string;
  };
  editorial: {
    meni: number | null;
    forense: { status: NiosDataStatus; issues: string[] };
    quality: number | null;
    originality: string;
    eeat: string;
    issues: string[];
    lastUpdated: string;
  };
  seo: {
    gscImpressions: number | null;
    gscClicks: number | null;
    gscCtr: number | null;
    gscPosition: number | null;
    gscTopQueries: { query: string; impressions: number; clicks: number }[];
    gscStatus: NiosDataStatus;
    indexStatus: string;
  };
  audience: {
    ga4Users: number | null;
    ga4Sessions: number | null;
    ga4Pageviews: number | null;
    ga4EngagementTimeSec: number | null;
    ga4Status: NiosDataStatus;
  };
  traffic: {
    internalViews: number | null;
    topSource: string | null;
    status: NiosDataStatus;
  };
  distribution: {
    facebook?: number;
    telegram?: number;
    x?: number;
    push?: number;
    indexNow?: boolean;
    status: NiosDataStatus;
  };
  growth: {
    momentum: number | null;
    trend: 'rising' | 'falling' | 'stable' | null;
    potential: 'alto' | 'medio' | 'bajo' | null;
  };
  entities: string[];
  opportunities: string[];
  decisions: string[];
  learning: string[];
  lastUpdated: string;
}

export interface IntelligenceGraph {
  collectedAt: string;
  snapshotDate: string | null;
  articles: ArticleIntelligence[];
  events: IntelligenceEvent[];
  decisions: CommandDecision[];
  systemStatus: {
    gsc: NiosDataStatus;
    ga4: NiosDataStatus;
    traffic: NiosDataStatus;
    firestore: NiosDataStatus;
  };
  errors: string[];
}

/* ── Helpers ───────────────────────────────────────────────────────── */

const now = () => new Date().toISOString();

function safe(n: number | null | undefined): number | null {
  if (n === null || n === undefined || Number.isNaN(n)) return null;
  return n;
}

function eventId(source: string, signal: string, articleId?: string): string {
  return [source, signal, articleId, now()].join('|');
}

function topTrafficSource(sources: Record<string, number> | undefined): string | null {
  if (!sources) return null;
  const entries = Object.entries(sources).filter(([, v]) => v > 0);
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function trendFromMomentum(m?: ArticleMomentum | null): ArticleIntelligence['growth']['trend'] {
  if (!m) return null;
  if (m.trend === 'BREAKOUT' || m.trend === 'BREAKOUT_FROM_ZERO' || m.trend === 'RISING') return 'rising';
  if (m.trend === 'DECLINING') return 'falling';
  return 'stable';
}

function potentialFromArticle(a: ArticleFusion): 'alto' | 'medio' | 'bajo' | null {
  if (a.gscImpressions > 1000 && a.gscCtr < 0.02) return 'alto';
  if (a.gscImpressions > 100) return 'medio';
  if ((a.ga4Pageviews ?? 0) > 20) return 'medio';
  return 'bajo';
}

/* ── Builders ──────────────────────────────────────────────────────── */

export function buildArticleIntelligence(
  a: ArticleFusion,
  momentum?: ArticleMomentum | null,
  snapshotDate?: string | null,
): ArticleIntelligence {
  const gscReal = a.gscStatus === 'REAL';
  const ga4Real = a.ga4Status === 'REAL';

  const gscImpressions = gscReal ? safe(a.gscImpressions) : null;
  const gscClicks = gscReal ? safe(a.gscClicks) : null;
  const gscCtr = gscReal ? safe(a.gscCtr) : null;
  const gscPosition = gscReal ? safe(a.gscPosition) : null;

  const ga4Users = ga4Real ? safe(a.ga4Users) : null;
  const ga4Sessions = ga4Real ? safe(a.ga4Sessions) : null;
  const ga4Pageviews = ga4Real ? safe(a.ga4Pageviews) : null;
  const ga4EngagementTimeSec = ga4Real ? safe(a.ga4AvgEngagementTimeSec) : null;

  const internalViews = momentum?.currentViews ?? null;
  const topSource = topTrafficSource(momentum?.sources);

  const opportunities: string[] = [];
  if (gscReal && (a.gscImpressions > 1000) && (a.gscCtr < 0.02)) {
    opportunities.push(`Bajo CTR con alto volumen de impresiones; considerar ajustar título/snippet para ${a.slug}`);
  }
  if (ga4Real && (a.ga4Pageviews ?? 0) > 50 && (ga4EngagementTimeSec ?? 0) < 30) {
    opportunities.push(`Alto tráfico pero baja retención; revisar apertura y estructura de ${a.slug}`);
  }
  if (a.palabras > 0 && a.palabras < 400) {
    opportunities.push(`Contenido breve; evaluar profundidad vs competencia`);
  }

  return {
    identity: {
      articleId: a.slug,
      url: a.url,
      title: a.titulo,
      category: a.categoria,
      author: a.autor,
      publishedAt: a.fechaPublicacion,
      updatedAt: snapshotDate ?? now(),
    },
    editorial: {
      meni: safe(a.scoreMeni),
      forense: { status: 'NOT_CONFIGURED', issues: [] },
      quality: safe(a.scoreMeni),
      originality: 'unknown',
      eeat: 'unknown',
      issues: a.palabras < 300 ? ['Contenido posiblemente delgado (< 300 palabras)'] : [],
      lastUpdated: snapshotDate ?? now(),
    },
    seo: {
      gscImpressions,
      gscClicks,
      gscCtr,
      gscPosition,
      gscTopQueries: (a.gscTopQueries ?? []).slice(0, 5).map((q) => ({
        query: q.query,
        impressions: q.impressions,
        clicks: q.clicks,
      })),
      gscStatus: a.gscStatus ?? 'NO_DATA',
      indexStatus: gscReal ? 'indexed' : 'unknown',
    },
    audience: {
      ga4Users,
      ga4Sessions,
      ga4Pageviews,
      ga4EngagementTimeSec,
      ga4Status: a.ga4Status ?? 'NO_DATA',
    },
    traffic: {
      internalViews,
      topSource,
      status: internalViews === null ? 'NO_DATA' : 'REAL',
    },
    distribution: {
      indexNow: false,
      status: 'NOT_CONFIGURED',
    },
    growth: {
      momentum: momentum?.momentum ?? null,
      trend: trendFromMomentum(momentum),
      potential: potentialFromArticle(a),
    },
    entities: [],
    opportunities,
    decisions: [],
    learning: [],
    lastUpdated: now(),
  };
}

export function buildIntelligenceEvents(
  articles: ArticleIntelligence[],
  gsc: GSCSnapshot | null,
  ga4: GA4Snapshot | null,
  traffic: TrafficPerformance | null,
): IntelligenceEvent[] {
  const events: IntelligenceEvent[] = [];
  const collectedAt = now();

  // System-level events
  events.push({
    id: eventId('SYSTEM', 'gsc_status'),
    timestamp: collectedAt,
    source: 'SYSTEM',
    module: 'gsc-collector',
    signal: 'gsc_status',
    value: gsc?.status ?? 'NO_DATA',
    status: gsc?.status ?? 'NO_DATA',
    confidence: gsc?.status === 'REAL' ? 1 : 0,
    evidence: [{
      source: 'GSC API',
      metric: 'status',
      value: gsc?.status ?? 'NO_DATA',
      collectedAt: gsc?.collectedAt ?? collectedAt,
      confidence: gsc?.status === 'REAL' ? 1 : 0,
    }],
    priority: gsc?.status === 'REAL' ? 'P3' : 'P0',
    recommendation: gsc?.status === 'REAL' ? undefined : 'Verificar credenciales y permisos en Google Search Console',
  });

  events.push({
    id: eventId('SYSTEM', 'ga4_status'),
    timestamp: collectedAt,
    source: 'SYSTEM',
    module: 'ga4-collector',
    signal: 'ga4_status',
    value: ga4?.status ?? 'NO_DATA',
    status: ga4?.status ?? 'NO_DATA',
    confidence: ga4?.status === 'REAL' ? 1 : 0,
    evidence: [{
      source: 'GA4 Data API',
      metric: 'status',
      value: ga4?.status ?? 'NO_DATA',
      collectedAt: ga4?.collectedAt ?? collectedAt,
      confidence: ga4?.status === 'REAL' ? 1 : 0,
    }],
    priority: ga4?.status === 'REAL' ? 'P3' : 'P0',
    recommendation: ga4?.status === 'REAL' ? undefined : `Configurar NIOS_GA4_PROPERTY_ID y permisos (actual=${process.env.NIOS_GA4_PROPERTY_ID || 'NOT_CONFIGURED'})`,
  });

  events.push({
    id: eventId('SYSTEM', 'traffic_status'),
    timestamp: collectedAt,
    source: 'SYSTEM',
    module: 'traffic-aggregator',
    signal: 'traffic_status',
    value: traffic ? 'REAL' : 'NO_DATA',
    status: traffic ? 'REAL' : 'NO_DATA',
    confidence: traffic ? 1 : 0,
    evidence: [{
      source: 'Firestore traffic_daily',
      metric: 'topArticles',
      value: traffic?.topArticles?.length ?? 0,
      collectedAt: traffic?.generatedAt ?? collectedAt,
      confidence: traffic ? 1 : 0,
    }],
    priority: traffic ? 'P3' : 'P1',
  });

  for (const a of articles) {
    const articleId = a.identity.articleId;

    if (a.seo.gscStatus === 'REAL' && a.seo.gscImpressions !== null) {
      events.push({
        id: eventId('GSC', 'impressions', articleId),
        articleId,
        timestamp: collectedAt,
        source: 'GSC',
        module: 'gsc-collector',
        signal: 'gsc_impressions',
        metric: 'impressions',
        value: a.seo.gscImpressions,
        status: 'REAL',
        confidence: 0.95,
        evidence: [{
          source: 'GSC API',
          metric: 'impressions',
          value: a.seo.gscImpressions ?? 0,
          collectedAt: gsc?.collectedAt ?? collectedAt,
          confidence: 0.95,
        }],
        priority: 'P2',
      });
    }

    if (a.audience.ga4Status === 'REAL' && a.audience.ga4Pageviews !== null) {
      events.push({
        id: eventId('GA4', 'pageviews', articleId),
        articleId,
        timestamp: collectedAt,
        source: 'GA4',
        module: 'ga4-collector',
        signal: 'ga4_pageviews',
        metric: 'pageviews',
        value: a.audience.ga4Pageviews,
        status: 'REAL',
        confidence: 0.95,
        evidence: [{
          source: 'GA4 Data API',
          metric: 'screenPageviews',
          value: a.audience.ga4Pageviews ?? 0,
          collectedAt: ga4?.collectedAt ?? collectedAt,
          confidence: 0.95,
        }],
        priority: 'P2',
      });
    }

    if (a.traffic.internalViews !== null) {
      events.push({
        id: eventId('TRAFFIC', 'internal_views', articleId),
        articleId,
        timestamp: collectedAt,
        source: 'TRAFFIC',
        module: 'traffic-aggregator',
        signal: 'internal_views',
        metric: 'views',
        value: a.traffic.internalViews,
        status: 'REAL',
        confidence: 0.9,
        evidence: [{
          source: 'Firestore traffic',
          metric: 'views',
          value: a.traffic.internalViews,
          collectedAt: traffic?.generatedAt ?? collectedAt,
          confidence: 0.9,
        }],
        priority: 'P2',
      });
    }

    if (a.editorial.meni !== null) {
      events.push({
        id: eventId('MENI', 'score', articleId),
        articleId,
        timestamp: collectedAt,
        source: 'MENI',
        module: 'meni-engine',
        signal: 'meni_score',
        metric: 'score',
        value: a.editorial.meni,
        status: 'REAL',
        confidence: 0.9,
        evidence: [{
          source: 'MENI engine',
          metric: 'scoreMeni',
          value: a.editorial.meni,
          collectedAt: collectedAt,
          confidence: 0.9,
        }],
        priority: a.editorial.meni < 80 ? 'P1' : 'P3',
      });
    }

    for (const opp of a.opportunities) {
      events.push({
        id: eventId('NIOS', 'opportunity', articleId),
        articleId,
        timestamp: collectedAt,
        source: 'NIOS',
        module: 'intelligence-graph',
        signal: 'opportunity',
        metric: 'opportunity',
        value: opp,
        status: 'REAL',
        confidence: 0.7,
        evidence: [{
          source: 'NIOS intelligence graph',
          metric: 'opportunity',
          value: opp,
          collectedAt,
          confidence: 0.7,
        }],
        priority: 'P1',
        recommendation: opp,
      });
    }
  }

  return events;
}

export function buildCommandDecisions(events: IntelligenceEvent[]): CommandDecision[] {
  const decisions: CommandDecision[] = [];
  const collectedAt = now();

  for (const e of events) {
    if (e.priority === 'P3') continue;

    const isBlocked = ['ACCESS_BLOCKED', 'INVALID_CONFIGURATION', 'NOT_CONFIGURED', 'CONFIG_REQUIRED', 'DATA_CONFLICT'].includes(e.status);
    const needsHuman = e.priority === 'P0' || e.priority === 'P1';

    let decision: CommandDecision['decision'] = 'NO_ACTION';
    if (isBlocked) decision = 'BLOCKED';
    else if (needsHuman) decision = 'QUEUE_FOR_HUMAN';

    const impact = e.priority === 'P0' ? 1 : e.priority === 'P1' ? 0.8 : e.priority === 'P2' ? 0.5 : 0.1;
    const risk = isBlocked ? 0.9 : needsHuman ? 0.5 : 0.1;
    const confidence = e.confidence;
    const priority = Math.round(impact * confidence * (1 - risk) * 100) / 100;

    if (decision === 'NO_ACTION') continue;

    decisions.push({
      id: eventId('CEO', e.signal, e.articleId),
      articleId: e.articleId,
      timestamp: collectedAt,
      signal: e.signal,
      source: e.module,
      inputs: [e.id],
      decision,
      priority,
      confidence,
      impact,
      risk,
      actionId: e.action,
      actionTitle: e.action || e.recommendation || 'Revisar evidencia',
      reason: e.recommendation || `Señal ${e.signal} requiere atención`,
      expectedOutcome: e.expectedOutcome || 'Decisión basada en evidencia; medir resultado en próximo ciclo',
      evidence: e.evidence,
    });
  }

  return decisions.sort((a, b) => b.priority - a.priority);
}

/* ── Main orchestrator ─────────────────────────────────────────────── */

export interface BuildIntelligenceGraphOptions {
  articleLimit?: number;
  momentumWindow?: number;
}

export async function buildIntelligenceGraph(
  options: BuildIntelligenceGraphOptions = {},
): Promise<IntelligenceGraph> {
  const { articleLimit = 50, momentumWindow = 7 } = options;
  const collectedAt = now();
  const errors: string[] = [];

  let db: Firestore;
  try {
    db = getAdminDb();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[intelligence-graph] getAdminDb failed:', err);
    return {
      collectedAt,
      snapshotDate: null,
      articles: [],
      events: [],
      decisions: [],
      systemStatus: { gsc: 'NOT_CONFIGURED', ga4: 'NOT_CONFIGURED', traffic: 'NOT_CONFIGURED', firestore: 'ACCESS_BLOCKED' },
      errors: [message],
    };
  }

  const [snapshotResult, noticiasResult, memoryResult] = await Promise.allSettled([
    getLatestSnapshot(db).catch((err) => { logger.error('[intelligence-graph] getLatestSnapshot:', err); throw err; }),
    loadNoticiasFromFirestore(db, articleLimit),
    getCeoMemory().catch((err) => { logger.error('[intelligence-graph] getCeoMemory:', err); return { pending: [], recentDone: [] } as CeoMemory; }),
  ]);

  const snapshot = snapshotResult.status === 'fulfilled' ? snapshotResult.value : null;
  if (snapshotResult.status === 'rejected') errors.push(String(snapshotResult.reason));

  const noticias = noticiasResult.status === 'fulfilled' ? noticiasResult.value : [];
  if (noticiasResult.status === 'rejected') errors.push(String(noticiasResult.reason));

  const memory = memoryResult.status === 'fulfilled' ? memoryResult.value : { pending: [], recentDone: [] };

  const gsc = snapshot?.gsc ?? null;
  const ga4 = snapshot?.ga4 ?? null;
  const traffic = snapshot?.trafficPerformance ?? null;
  const snapshotDate = snapshot?.date ?? null;

  const fusions = mergeArticleData(noticias, gsc, ga4).slice(0, articleLimit);

  // Get previous traffic for momentum (use snapshot? no previous in this call; pass null)
  const momentums = new Map<string, ArticleMomentum>();
  if (traffic) {
    for (const m of evaluateArticleMomentum(traffic, null, { baselineDays: momentumWindow })) {
      momentums.set(m.slug, m);
    }
  }

  const articles: ArticleIntelligence[] = [];
  for (const a of fusions) {
    const momentum = momentums.get(a.slug) ?? null;
    const ai = buildArticleIntelligence(a, momentum, snapshotDate);
    // Link pending CEO memory tasks that match slug
    ai.decisions = memory.pending.filter((t) => t.id.includes(a.slug)).map((t) => t.id);
    articles.push(ai);
  }

  const events = buildIntelligenceEvents(articles, gsc, ga4, traffic);
  const decisions = buildCommandDecisions(events);

  return {
    collectedAt,
    snapshotDate,
    articles,
    events,
    decisions,
    systemStatus: {
      gsc: gsc?.status ?? 'NO_DATA',
      ga4: ga4?.status ?? 'NO_DATA',
      traffic: traffic ? 'REAL' : 'NO_DATA',
      firestore: 'REAL',
    },
    errors,
  };
}
