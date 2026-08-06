/**
 * NIOS Intelligence Platform — Data Merger
 * =========================================
 * Fusiona datos de Firestore (MENI), GSC y GA4 por artículo.
 * Cada noticia queda con su score MENI + datos reales de Google + Analytics.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { Noticia } from '@/lib/types';
import type { GSCSnapshot, GA4Snapshot, ArticleFusion, GSCQueryRow } from './types';
import { logger } from '@/lib/logger';

const SITE_URL = 'https://nicaraguainformate.com';

/**
 * Extrae el slug de una URL de GSC.
 */
function slugFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    // /noticias/{slug} o /{slug}
    if (parts[0] === 'noticias') return parts[1] || '';
    return parts[0] || '';
  } catch {
    // Si no es URL válida, intentar como path directo
    const parts = url.split('/').filter(Boolean);
    if (parts[0] === 'noticias') return parts[1] || '';
    return parts[parts.length - 1] || url;
  }
}

/**
 * Extrae el path de una URL de GA4.
 */
function pathFromGa4(pagePath: string): string {
  if (pagePath.startsWith('/noticias/')) {
    return pagePath.replace('/noticias/', '').replace(/\/$/, '');
  }
  const parts = pagePath.split('/').filter(Boolean);
  if (parts[0] === 'noticias') return parts[1] || '';
  return parts[parts.length - 1] || pagePath;
}

/**
 * Fusiona datos de Firestore, GSC y GA4 en una lista de artículos.
 */
export function mergeArticleData(
  noticias: Noticia[],
  gsc: GSCSnapshot | null,
  ga4: GA4Snapshot | null,
): ArticleFusion[] {
  // Mapas para lookup rápido
  const gscBySlug = new Map<string, { impressions: number; clicks: number; ctr: number; position: number; url: string }>();
  const gscQueriesBySlug = new Map<string, GSCQueryRow[]>();

  if (gsc) {
    for (const page of gsc.pages) {
      const slug = slugFromUrl(page.url);
      if (slug) {
        gscBySlug.set(slug, {
          impressions: page.impressions,
          clicks: page.clicks,
          ctr: page.ctr,
          position: page.position,
          url: page.url,
        });
      }
    }

    // Top queries por página (si están disponibles)
    const pageQueries = (gsc as any).pageQueries as Record<string, GSCQueryRow[]> | undefined;
    if (pageQueries) {
      for (const [url, queries] of Object.entries(pageQueries)) {
        const slug = slugFromUrl(url);
        if (slug && queries.length > 0) {
          gscQueriesBySlug.set(slug, queries);
        }
      }
    }
  }

  const ga4BySlug = new Map<string, {
    users: number;
    sessions: number;
    pageviews: number;
    avgEngagementTimeSec: number;
    engagementRate: number;
  }>();

  if (ga4) {
    for (const page of ga4.pages) {
      const slug = pathFromGa4(page.pagePath);
      if (slug) {
        ga4BySlug.set(slug, {
          users: page.users,
          sessions: page.sessions,
          pageviews: page.screenPageviews,
          avgEngagementTimeSec: page.averageEngagementTimeSec,
          engagementRate: page.engagementRate,
        });
      }
    }
  }

  const fusions: ArticleFusion[] = [];

  for (const n of noticias) {
    if (n.estado !== 'publicado') continue;

    const gscData = gscBySlug.get(n.slug);
    const ga4Data = ga4BySlug.get(n.slug);

    fusions.push({
      slug: n.slug,
      url: `${SITE_URL}/noticias/${n.slug}`,
      titulo: n.titulo,
      categoria: n.categoria,
      autor: n.autor || '',
      fechaPublicacion: n.fecha,
      palabras: n.palabras || 0,
      scoreMeni: n.scoreCalidad || 0,
      tags: n.tags || [],
      relatedLinksCount: n.related_links?.length || 0,
      gscImpressions: gscData?.impressions || 0,
      gscClicks: gscData?.clicks || 0,
      gscCtr: gscData?.ctr || 0,
      gscPosition: gscData?.position || 0,
      gscTopQueries: gscQueriesBySlug.get(n.slug) || [],
      ga4Users: ga4Data?.users || 0,
      ga4Sessions: ga4Data?.sessions || 0,
      ga4Pageviews: ga4Data?.pageviews || 0,
      ga4AvgEngagementTimeSec: ga4Data?.avgEngagementTimeSec || 0,
      ga4EngagementRate: ga4Data?.engagementRate || 0,
      hasGscData: !!gscData,
      hasGa4Data: !!ga4Data,
    });
  }

  logger.info(`[data-merger] Fused ${fusions.length} articles: ${fusions.filter(f => f.hasGscData).length} with GSC data, ${fusions.filter(f => f.hasGa4Data).length} with GA4 data`);

  return fusions;
}

/**
 * Carga noticias desde Firestore.
 */
export async function loadNoticiasFromFirestore(db: Firestore, limit = 500): Promise<Noticia[]> {
  const snap = await db
    .collection('noticias')
    .where('estado', '==', 'publicado')
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      slug: d.slug || '',
      titulo: d.titulo || '',
      resumen: d.resumen || '',
      contenido: d.contenido || '',
      categoria: d.categoria || 'General',
      imagen: d.imagen || '',
      fecha: d.fecha || new Date().toISOString(),
      autor: d.autor || '',
      palabras: d.palabras || 0,
      scoreCalidad: d.scoreCalidad || d.scoreMeni || 0,
      tags: d.tags || [],
      related_links: d.related_links || [],
      estado: d.estado || 'publicado',
    } as Noticia;
  });
}
