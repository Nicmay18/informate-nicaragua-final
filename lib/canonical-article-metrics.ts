import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { getMetricDefinition, type MetricScope } from '@/lib/nios/intelligence/metric-truth';

export type MetricSource = 'cms' | 'traffic_log' | 'traffic_daily' | 'ga4' | 'gsc' | 'facebook' | 'unknown';

export interface ArticleMetricValue {
  source: MetricSource;
  metric: 'views' | 'users' | 'sessions' | 'clicks' | 'impressions' | 'reach' | 'reproductions';
  value: number;
  definition: string;
  scope: MetricScope;
  period: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CanonicalArticleMetrics {
  slug: string;
  generatedAt: string;
  cmsViews: number;
  sources: ArticleMetricValue[];
}

const SLUG_RE = /^[a-zA-Z0-9_-]+$/;
const SLUG_MAX_LEN = 200;

function isValidSlug(slug: string): boolean {
  return typeof slug === 'string' && slug.length <= SLUG_MAX_LEN && SLUG_RE.test(slug);
}

/**
 * Lee la fuente canónica de vistas de un artículo.
 * El valor canónico es `noticias.vistas` (contador propio del CMS).
 * Otras fuentes (traffic_log, GA4, GSC, Facebook) se exponen por separado
 * con su propia definición, periodo y confianza. No se mezclan.
 */
export async function getCanonicalArticleMetrics(slug: string): Promise<CanonicalArticleMetrics | null> {
  if (!isValidSlug(slug)) {
    logger.warn('[canonical-article-metrics] slug inválido:', slug);
    return null;
  }

  try {
    const db = getAdminDb();

    const docRef = db.collection('noticias').doc(slug);
    let docSnap = await docRef.get();

    if (!docSnap.exists) {
      const snap = await db
        .collection('noticias')
        .where('slug', '==', slug)
        .limit(1)
        .get();
      if (snap.empty) {
        logger.warn('[canonical-article-metrics] noticia no encontrada:', slug);
        return null;
      }
      docSnap = snap.docs[0];
    }

    const data = docSnap.data() || {};
    const cmsViews = typeof data.vistas === 'number' ? data.vistas : 0;
    const viewDef = getMetricDefinition('article.views.canonical');

    return {
      slug,
      generatedAt: new Date().toISOString(),
      cmsViews,
      sources: [
        {
          source: 'cms',
          metric: 'views',
          value: cmsViews,
          definition:
            viewDef?.definition ||
            'Vistas registradas por el contador propio de Nicaragua Informate (noticias.vistas).',
          scope: viewDef?.scope || 'article',
          period: 'lifetime',
          confidence: viewDef?.confidence || 'high',
        },
      ],
    };
  } catch (err) {
    logger.error('[canonical-article-metrics] error:', err instanceof Error ? err.message : String(err));
    return null;
  }
}
