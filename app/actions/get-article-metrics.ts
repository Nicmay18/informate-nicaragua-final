'use server';

import { getCanonicalArticleMetrics } from '@/lib/canonical-article-metrics';
import { logger } from '@/lib/logger';

export async function getArticleMetricsAction(slug: string) {
  try {
    const metrics = await getCanonicalArticleMetrics(slug);
    if (!metrics) {
      return { ok: false, error: 'Noticia no encontrada' };
    }
    return { ok: true, metrics };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[get-article-metrics] Server action failed:', err);
    return { ok: false, error: message };
  }
}
