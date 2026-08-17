/**
 * Article lifecycle tracking.
 * Defines temporal windows and data-source states for every article.
 * GSC/GA4 connectors are prepared but do NOT invent data.
 */

import type { Firestore } from 'firebase-admin/firestore';

export type LifecycleWindow = '1h' | '6h' | '24h' | '3d' | '7d' | '14d' | '30d';

export const LIFECYCLE_WINDOWS: LifecycleWindow[] = ['1h', '6h', '24h', '3d', '7d', '14d', '30d'];

export interface ArticleLifecycleData {
  slug: string;
  publishedAt: string;
  window: LifecycleWindow;
  gsc: {
    status: 'CONNECTED_WITH_DATA' | 'CONNECTED_NO_DATA' | 'STALE_DATA' | 'ERROR' | 'UNKNOWN';
    impressions?: number;
    clicks?: number;
    ctr?: number;
    averagePosition?: number;
    queries?: string[];
    error?: string;
  };
  ga4: {
    status: 'CONNECTED_WITH_DATA' | 'CONNECTED_NO_DATA' | 'STALE_DATA' | 'ERROR' | 'UNKNOWN';
    users?: number;
    sessions?: number;
    engagement?: number;
    source?: string;
    error?: string;
  };
  site: {
    status: 'CONNECTED_WITH_DATA' | 'CONNECTED_NO_DATA' | 'STALE_DATA' | 'ERROR' | 'UNKNOWN' | 'DATA_EMPTY';
    views?: number;
    internalClicks?: number;
    recirculation?: number;
    engagementMs?: number;
    error?: string;
  };
}

function windowToMs(w: LifecycleWindow): number {
  const map: Record<LifecycleWindow, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '14d': 14 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  return map[w];
}

export async function fetchArticleLifecycle(
  _db: Firestore,
  slug: string,
  publishedAt: string,
  windows?: LifecycleWindow[]
): Promise<ArticleLifecycleData[]> {
  const targets = windows ?? LIFECYCLE_WINDOWS;
  const now = new Date();

  const results: ArticleLifecycleData[] = [];

  for (const window of targets) {
    const windowEnd = new Date(new Date(publishedAt).getTime() + windowToMs(window));
    // Si la ventana aún no ha transcurrido, la medición se pospone.
    const isPast = now >= windowEnd;

    const site = await fetchSiteMetrics(_db, slug, new Date(publishedAt), windowEnd);

    results.push({
      slug,
      publishedAt,
      window,
      gsc: {
        status: 'UNKNOWN',
        error: 'GSC no configurado: añade GSC_SERVICE_ACCOUNT_KEY y GSC_PROPERTY a las variables de entorno.',
      },
      ga4: {
        status: 'UNKNOWN',
        error: 'GA4 no configurado: añade GA4_PROPERTY_ID y credenciales.',
      },
      site: isPast ? site : { status: 'UNKNOWN' },
    });
  }

  return results;
}

async function fetchSiteMetrics(
  db: Firestore,
  slug: string,
  from: Date,
  to: Date
): Promise<ArticleLifecycleData['site']> {
  try {
    const snapshot = await db
      .collection('nios_telemetry')
      .where('type', '==', 'ARTICLE_VIEW')
      .where('articleSlug', '==', slug)
      .where('timestamp', '>=', from.toISOString())
      .where('timestamp', '<=', to.toISOString())
      .count()
      .get();

    const views = snapshot.data().count;

    if (views === 0) {
      return { status: 'DATA_EMPTY', views: 0 };
    }

    return {
      status: 'CONNECTED_WITH_DATA',
      views,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown';
    return { status: 'ERROR', error: message };
  }
}
