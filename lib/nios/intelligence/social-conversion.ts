/**
 * NIOS Social → Web Conversion Intelligence
 * ==========================================
 * Distingue alcance, interacción, clics, sesiones web y lectura.
 * No asume que likes = tráfico. No atribuye sin evidencia.
 */

import type { NiosDataStatus } from './types';
import { getMetricDefinition, wrapMetric, type MetricValue } from './metric-truth';
import { logger } from '@/lib/logger';

export type SocialConversionStage =
  | 'social-reach'
  | 'social-impressions'
  | 'social-reproductions'
  | 'social-engagement'
  | 'social-link-clicks'
  | 'web-sessions'
  | 'article-views'
  | 'engagement'
  | 'return';

export type AttributionConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE';

export type ConversionProblemType =
  | 'CONVERSION_PROBLEM'
  | 'SOCIAL_TO_WEB_PROBLEM'
  | 'POST_CLICK_PROBLEM'
  | 'CONTENT_PROBLEM'
  | 'DISTRIBUTION_PROBLEM'
  | 'MEASUREMENT_PROBLEM'
  | 'NO_DATA'
  | 'NONE';

export interface FacebookSnapshot {
  source: 'Meta';
  status: NiosDataStatus;
  collectedAt: string;
  periodDays: number;
  reach: number;
  impressions: number;
  reproductions: number;
  reactions: number;
  comments: number;
  shares: number;
  linkClicks: number;
  outboundClicks: number;
  errorMessage?: string;
}

export interface SocialWebFunnel {
  reach: MetricValue<number> | null;
  impressions: MetricValue<number> | null;
  reproductions: MetricValue<number> | null;
  reactions: MetricValue<number> | null;
  comments: MetricValue<number> | null;
  shares: MetricValue<number> | null;
  linkClicks: MetricValue<number> | null;
  outboundClicks: MetricValue<number> | null;
  webSessions: MetricValue<number> | null;
  articleViews: MetricValue<number> | null;
  /** Ratios válidos matemáticamente. Si el denominador es cero, el ratio es null. */
  socialCtr: number | null;
  clickToSessionRate: number | null;
  sessionToArticleRate: number | null;
  clickToArticleRate: number | null;
}

export type SocialConversionVerdictStatus = 'SALUDABLE' | 'REQUIERE_ATENCION' | 'RIESGO_CRITICO' | 'EVIDENCIA_INSUFICIENTE';

export interface SocialConversionVerdict {
  status: SocialConversionVerdictStatus;
  statusIcon: string;
  statusLabel: string;
  facebook: {
    status: NiosDataStatus;
    summary: string;
  };
  web: {
    sessions: number;
    articleViews: number;
    summary: string;
  };
  conversion: {
    point: string;
    attributionConfidence: AttributionConfidence;
  };
  mainProblem: ConversionProblemType;
  actions: string[];
  doNotDo: string[];
  evidence: { source: string; metric: string; value: number; period: string; note: string }[];
  confidence: number;
}

function safeRatio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(2)) : null;
}

function wrapSocialMetric(
  key: string,
  value: number,
  collectedAt?: string,
): MetricValue<number> | null {
  const def = getMetricDefinition(key);
  if (!def) return null;
  return { key, value, collectedAt, definition: def };
}

function deriveWebSessions(ga4: any, traffic: any): number {
  if (ga4?.status === 'REAL' && Array.isArray(ga4.sources)) {
    const fb = ga4.sources.find((s: any) => s.source?.toLowerCase() === 'facebook');
    if (fb && typeof fb.sessions === 'number') return fb.sessions;
  }
  if (traffic?.topSources && typeof traffic.topSources.facebook === 'number') {
    return traffic.topSources.facebook;
  }
  return 0;
}

function deriveArticleViews(articles: any[], slug?: string): number {
  if (!Array.isArray(articles)) return 0;
  if (slug) {
    const a = articles.find((x) => x.slug === slug);
    return a?.ga4Pageviews ?? a?.vistas ?? 0;
  }
  return articles.reduce((sum, a) => sum + (a?.ga4Pageviews ?? a?.vistas ?? 0), 0);
}

export interface SocialConversionInput {
  facebook: FacebookSnapshot | null;
  ga4: any;
  traffic: any;
  articles: any[];
  targetSlug?: string;
}

export function buildSocialWebFunnel(input: SocialConversionInput): SocialWebFunnel {
  const fb = input.facebook;
  const now = new Date().toISOString();

  const webSessions = deriveWebSessions(input.ga4, input.traffic);
  const articleViews = deriveArticleViews(input.articles, input.targetSlug);

  const linkClicks = fb?.linkClicks ?? 0;
  const impressions = fb?.impressions ?? 0;
  const reach = fb?.reach ?? 0;

  const socialCtr = safeRatio(linkClicks, impressions);
  const clickToSessionRate = safeRatio(webSessions, linkClicks);
  const clickToArticleRate = safeRatio(articleViews, linkClicks);
  const sessionToArticleRate = safeRatio(articleViews, webSessions);

  return {
    reach: wrapSocialMetric('social.facebook.reach', reach, now),
    impressions: wrapSocialMetric('social.facebook.impressions', impressions, now),
    reproductions: wrapSocialMetric('social.facebook.reproductions', fb?.reproductions ?? 0, now),
    reactions: wrapSocialMetric('social.facebook.reactions', fb?.reactions ?? 0, now),
    comments: wrapSocialMetric('social.facebook.comments', fb?.comments ?? 0, now),
    shares: wrapSocialMetric('social.facebook.shares', fb?.shares ?? 0, now),
    linkClicks: wrapSocialMetric('social.facebook.linkClicks', linkClicks, now),
    outboundClicks: wrapSocialMetric('social.facebook.outboundClicks', fb?.outboundClicks ?? 0, now),
    webSessions: wrapMetric('social.facebook.webSessions', webSessions, now) as MetricValue<number> | null,
    articleViews: wrapMetric('social.facebook.articleViews', articleViews, now) as MetricValue<number> | null,
    socialCtr,
    clickToSessionRate,
    clickToArticleRate,
    sessionToArticleRate,
  };
}

function attributionConfidence(fb: FacebookSnapshot | null, input: SocialConversionInput): AttributionConfidence {
  if (!fb || fb.status !== 'REAL') return 'UNAVAILABLE';
  if (input.targetSlug) {
    // Solo si existe una publicación explícitamente ligada a un slug podría ser MEDIUM/HIGH.
    // Actualmente no hay post_id en el modelo, por tanto LOW/MEDIUM según UTM.
    const hasUtm = input.ga4?.pages?.some((p: any) =>
      p.pagePath?.includes(input.targetSlug) && p.pagePath?.includes('utm_source=facebook')
    );
    return hasUtm ? 'MEDIUM' : 'LOW';
  }
  const hasWebSignal =
    input.ga4?.status === 'REAL' ||
    (input.traffic?.topSources && typeof input.traffic.topSources.facebook === 'number');
  return hasWebSignal ? 'LOW' : 'UNAVAILABLE';
}

function detectScenario(input: SocialConversionInput, funnel: SocialWebFunnel): ConversionProblemType {
  const fb = input.facebook;
  if (!fb || fb.status !== 'REAL') return 'NO_DATA';

  const reach = funnel.reach?.value ?? 0;
  // impressions se usa implícitamente en el funnel; no se necesita aquí
  const linkClicks = funnel.linkClicks?.value ?? 0;
  const webSessions = funnel.webSessions?.value ?? 0;
  const articleViews = funnel.articleViews?.value ?? 0;

  const articleFromSessionRate = safeRatio(articleViews, webSessions) ?? 0;

  // A — Social funciona.
  if (reach > 0 && linkClicks > 0 && webSessions > 0 && articleViews > 0 && articleFromSessionRate >= 50) {
    return 'NONE';
  }

  // B — Mucho alcance, pocos clicks.
  if (reach > 0 && (safeRatio(linkClicks, reach) ?? 0) < 1) {
    return 'CONVERSION_PROBLEM';
  }

  // C — Clicks altos, pocas sesiones.
  if (linkClicks > 0 && webSessions > 0 && (safeRatio(webSessions, linkClicks) ?? 0) < 30) {
    return 'SOCIAL_TO_WEB_PROBLEM';
  }

  // D — Sesiones, poca lectura.
  if (webSessions > 0 && (safeRatio(articleViews, webSessions) ?? 0) < 30) {
    return 'POST_CLICK_PROBLEM';
  }

  return 'MEASUREMENT_PROBLEM';
}

export function buildSocialConversionVerdict(input: SocialConversionInput): SocialConversionVerdict {
  const funnel = buildSocialWebFunnel(input);
  const fb = input.facebook;
  const attr = attributionConfidence(fb, input);
  const problem = detectScenario(input, funnel);

  const evidence: { source: string; metric: string; value: number; period: string; note: string }[] = [];

  if (fb?.status === 'REAL') {
    evidence.push({
      source: 'Meta',
      metric: 'social.facebook.reach',
      value: funnel.reach?.value ?? 0,
      period: `${fb.periodDays}d`,
      note: 'Alcance social. No es tráfico web.',
    });
    evidence.push({
      source: 'Meta',
      metric: 'social.facebook.linkClicks',
      value: funnel.linkClicks?.value ?? 0,
      period: `${fb.periodDays}d`,
      note: 'Clics en enlace. No son sesiones web.',
    });
  }

  if (input.ga4?.status === 'REAL') {
    evidence.push({
      source: 'GA4',
      metric: 'social.facebook.webSessions',
      value: funnel.webSessions?.value ?? 0,
      period: '28d',
      note: 'Sesiones con sessionSource=facebook.',
    });
  }

  evidence.push({
    source: 'Firestore',
    metric: 'social.facebook.articleViews',
    value: funnel.articleViews?.value ?? 0,
    period: '28d',
    note: 'Vistas canónicas atribuibles a Facebook (UTM/referrer).',
  });

  let status: SocialConversionVerdict['status'];
  let statusIcon: string;
  let statusLabel: string;

  if (!fb || fb.status === 'NOT_CONFIGURED' || fb.status === 'CONFIG_REQUIRED') {
    status = 'EVIDENCIA_INSUFICIENTE';
    statusIcon = '🔵';
    statusLabel = 'EVIDENCIA INSUFICIENTE';
  } else if (fb.status === 'ACCESS_BLOCKED' || fb.status === 'NO_DATA' || fb.status === 'INVALID_CONFIGURATION' || fb.status === 'NOT_VERIFIED') {
    status = 'REQUIERE_ATENCION';
    statusIcon = '🟡';
    statusLabel = 'REQUIERE ATENCIÓN';
  } else if (problem === 'CONVERSION_PROBLEM' || problem === 'SOCIAL_TO_WEB_PROBLEM' || problem === 'POST_CLICK_PROBLEM') {
    status = 'REQUIERE_ATENCION';
    statusIcon = '🟡';
    statusLabel = 'REQUIERE ATENCIÓN';
  } else if (problem === 'NO_DATA' || problem === 'MEASUREMENT_PROBLEM') {
    status = 'EVIDENCIA_INSUFICIENTE';
    statusIcon = '🔵';
    statusLabel = 'EVIDENCIA INSUFICIENTE';
  } else if (problem === 'NONE') {
    status = 'SALUDABLE';
    statusIcon = '🟢';
    statusLabel = 'SALUDABLE';
  } else {
    status = 'SALUDABLE';
    statusIcon = '🟢';
    statusLabel = 'SALUDABLE';
  }

  const actions: string[] = [];
  const doNotDo: string[] = [];

  if (status === 'EVIDENCIA_INSUFICIENTE') {
    actions.push('Conectar Meta Business / Facebook Insights para medir conversión real.');
    doNotDo.push('No asumir que likes o alcance son tráfico web.');
  } else if (problem === 'CONVERSION_PROBLEM') {
    actions.push('Cambiar estrategia de titular o call-to-action en publicaciones de Facebook.');
    actions.push('Probar CTA más directo: "Lee la nota completa" en lugar de engagement genérico.');
    doNotDo.push('No impulsar publicaciones que generan likes pero no clics.');
    doNotDo.push('No recomendar profundizar un artículo si el problema es conversión social.');
  } else if (problem === 'SOCIAL_TO_WEB_PROBLEM') {
    actions.push('Investigar puente social → web: velocidad de landing, UTM, bloqueadores.');
    actions.push('Verificar que el enlace publicado lleva a la noticia y no a una intermedia.');
    doNotDo.push('No culpar automáticamente a Facebook sin revisar el camino del click.');
  } else if (problem === 'POST_CLICK_PROBLEM') {
    actions.push('Revisar UX de landing: velocidad, encabezado, contenido visible, navegación.');
    actions.push('Verificar que el titular social coincide con el contenido del artículo.');
    doNotDo.push('No recomendar "publicar más" si el problema está después del click.');
  } else if (status === 'SALUDABLE' || problem === 'NONE') {
    actions.push('Distribuir nuevamente contenido con alta conversión web.');
    actions.push('Priorizar contenidos del mismo perfil/categoría que convirtieron.');
    doNotDo.push('No tocar artículos que ya convierten bien de social a web.');
  }

  const confidence = attr === 'HIGH' ? 90 : attr === 'MEDIUM' ? 70 : attr === 'LOW' ? 45 : 25;

  return {
    status,
    statusIcon,
    statusLabel,
    facebook: {
      status: fb?.status ?? 'NOT_CONFIGURED',
      summary: fb?.status === 'REAL'
        ? `Alcance ${funnel.reach?.value ?? 0} / clics ${funnel.linkClicks?.value ?? 0}`
        : (fb?.errorMessage || 'Meta no configurado o sin datos.'),
    },
    web: {
      sessions: funnel.webSessions?.value ?? 0,
      articleViews: funnel.articleViews?.value ?? 0,
      summary: `Sesiones web Facebook: ${funnel.webSessions?.value ?? 0}. Vistas canónicas: ${funnel.articleViews?.value ?? 0}.`,
    },
    conversion: {
      point: problem === 'NO_DATA' || problem === 'MEASUREMENT_PROBLEM' ? 'Sin datos suficientes' : problem,
      attributionConfidence: attr,
    },
    mainProblem: problem,
    actions: actions.slice(0, 3),
    doNotDo: doNotDo.slice(0, 3),
    evidence,
    confidence,
  };
}

export async function fetchFacebookSnapshot(): Promise<FacebookSnapshot> {
  const token = process.env.FB_PAGE_ACCESS_TOKEN || '';
  const pageId = process.env.FB_PAGE_ID || '';

  if (!token || !pageId) {
    return {
      source: 'Meta',
      status: 'NOT_CONFIGURED',
      collectedAt: new Date().toISOString(),
      periodDays: 28,
      reach: 0,
      impressions: 0,
      reproductions: 0,
      reactions: 0,
      comments: 0,
      shares: 0,
      linkClicks: 0,
      outboundClicks: 0,
      errorMessage: 'FB_PAGE_ACCESS_TOKEN / FB_PAGE_ID no configurados.',
    };
  }

  try {
    const fields = [
      'followers_count',
      'posts.limit(50){insights.metric(post_impressions,post_impressions_unique,post_clicks,post_clicks_by_type)}',
    ].join(',');

    const url = `https://graph.facebook.com/v18.0/${pageId}?fields=${encodeURIComponent(fields)}&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      logger.warn('[facebook-collector] API error:', data.error);
      return {
        source: 'Meta',
        status: data.error.code === 190 || data.error.code === 104 ? 'ACCESS_BLOCKED' : 'NO_DATA',
        collectedAt: new Date().toISOString(),
        periodDays: 28,
        reach: 0,
        impressions: 0,
        reproductions: 0,
        reactions: 0,
        comments: 0,
        shares: 0,
        linkClicks: 0,
        outboundClicks: 0,
        errorMessage: data.error.message,
      };
    }

    const posts = data.posts?.data || [];
    let reach = 0;
    let impressions = 0;
    let linkClicks = 0;
    let outboundClicks = 0;
    let shares = 0;
    let comments = 0;
    let reactions = 0;

    for (const p of posts) {
      const insights = p.insights?.data || [];
      for (const ins of insights) {
        const name = ins.name;
        const value = Array.isArray(ins.values) ? ins.values[0]?.value : 0;
        if (name === 'post_impressions_unique') reach += value || 0;
        if (name === 'post_impressions') impressions += value || 0;
        if (name === 'post_clicks') linkClicks += value || 0;
        if (name === 'post_clicks_by_type' && typeof value === 'object') {
          linkClicks += value?.['link clicks'] || 0;
          outboundClicks += value?.['other clicks'] || 0;
        }
      }
      shares += (p.shares?.count || 0);
      comments += (p.comments?.summary?.total_count || 0);
      reactions += (p.reactions?.summary?.total_count || 0);
    }

    return {
      source: 'Meta',
      status: posts.length > 0 ? 'REAL' : 'CONNECTED_NO_DATA',
      collectedAt: new Date().toISOString(),
      periodDays: 28,
      reach,
      impressions,
      reproductions: 0,
      reactions,
      comments,
      shares,
      linkClicks,
      outboundClicks,
      errorMessage: undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[facebook-collector] Failed to collect:', msg);
    return {
      source: 'Meta',
      status: 'NO_DATA',
      collectedAt: new Date().toISOString(),
      periodDays: 28,
      reach: 0,
      impressions: 0,
      reproductions: 0,
      reactions: 0,
      comments: 0,
      shares: 0,
      linkClicks: 0,
      outboundClicks: 0,
      errorMessage: msg,
    };
  }
}
