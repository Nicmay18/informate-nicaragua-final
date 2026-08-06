/**
 * NIOS Intelligence Platform — Editorial Intelligence
 * =====================================================
 * Motor de recomendaciones basado ÚNICAMENTE en reglas y datos reales.
 * No usa IA. No genera opiniones. No inventa métricas.
 *
 * Cada recomendación incluye:
 * - Fuente (GSC, GA4, Firestore, MENI)
 * - Fecha del dato
 * - API de origen
 * - Nivel de confianza
 * - Justificación completa
 */

import type {
  ArticleFusion,
  NIOSRecommendation,
  NIOSEvidence,
  GSCSnapshot,
  GA4Snapshot,
} from './types';

function makeId(type: string, slug: string): string {
  return `${type}-${slug}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
}

function evidence(
  source: NIOSEvidence['source'],
  api: string,
  dateRange: string,
  metric: string,
  value: string | number,
  comparison?: string,
): NIOSEvidence {
  return {
    source,
    api,
    dateRange,
    metric,
    value,
    comparison,
    collectedAt: new Date().toISOString(),
  };
}

/**
 * Genera recomendaciones basadas en reglas para cada artículo.
 * Solo recomienda si hay datos suficientes.
 */
export function generateRecommendations(
  articles: ArticleFusion[],
  gsc: GSCSnapshot | null,
  ga4: GA4Snapshot | null,
  daysToCollect: number,
): NIOSRecommendation[] {
  const recommendations: NIOSRecommendation[] = [];
  const now = new Date().toISOString();
  const dateRange = gsc
    ? `${gsc.dateRange.start} a ${gsc.dateRange.end}`
    : 'N/A';
  const siteAvgCtr = gsc?.avgCtr || 0;
  const siteAvgPosition = gsc?.avgPosition || 0;

  for (const article of articles) {
    // ─── Regla 1: CTR alto + posición baja → mejorar título ───
    if (article.hasGscData && article.gscImpressions >= 100) {
      if (article.gscCtr > siteAvgCtr * 1.5 && article.gscPosition > 10) {
        recommendations.push({
          id: makeId('title', article.slug),
          articleSlug: article.slug,
          articleTitle: article.titulo,
          type: 'title',
          severity: 'info',
          title: 'CTR alto con posición baja',
          description: `El CTR es de ${article.gscCtr}% con ${article.gscImpressions.toLocaleString()} impresiones según Google Search Console durante los últimos ${daysToCollect} días. La posición media es ${article.gscPosition}. El promedio del sitio es ${siteAvgCtr}% CTR. Se recomienda mejorar el título para ganar posiciones.`,
          evidence: [
            evidence('Google Search Console', 'searchanalytics.query', dateRange, 'CTR', `${article.gscCtr}%`, `Promedio del sitio: ${siteAvgCtr}%`),
            evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Posición media', article.gscPosition, `Promedio del sitio: ${siteAvgPosition}`),
            evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Impresiones', article.gscImpressions),
          ],
          confidence: 'high',
          createdAt: now,
        });
      }
    }

    // ─── Regla 2: Posición alta + CTR bajo → revisar meta description ───
    if (article.hasGscData && article.gscImpressions >= 100) {
      if (article.gscPosition <= 10 && article.gscCtr < siteAvgCtr * 0.5) {
        recommendations.push({
          id: makeId('meta', article.slug),
          articleSlug: article.slug,
          articleTitle: article.titulo,
          type: 'meta',
          severity: 'warning',
          title: 'Posición alta con CTR bajo',
          description: `El CTR es de ${article.gscCtr}% con ${article.gscImpressions.toLocaleString()} impresiones y posición ${article.gscPosition} según Google Search Console durante los últimos ${daysToCollect} días. El promedio del sitio es ${siteAvgCtr}% CTR. Se recomienda revisar el meta description y el snippet que Google muestra.`,
          evidence: [
            evidence('Google Search Console', 'searchanalytics.query', dateRange, 'CTR', `${article.gscCtr}%`, `Promedio del sitio: ${siteAvgCtr}%`),
            evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Posición media', article.gscPosition),
            evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Impresiones', article.gscImpressions),
          ],
          confidence: 'high',
          createdAt: now,
        });
      }
    }

    // ─── Regla 3: Muchas impresiones + pocos clics → revisar snippet ───
    if (article.hasGscData && article.gscImpressions >= 1000 && article.gscClicks < 10) {
      recommendations.push({
        id: makeId('snippet', article.slug),
        articleSlug: article.slug,
        articleTitle: article.titulo,
        type: 'snippet',
        severity: 'warning',
        title: 'Muchas impresiones, pocos clics',
        description: `${article.gscImpressions.toLocaleString()} impresiones generaron solo ${article.gscClicks} clics según Google Search Console durante los últimos ${daysToCollect} días. CTR: ${article.gscCtr}%. Se recomienda revisar el título y meta description que Google muestra en resultados.`,
        evidence: [
          evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Impresiones', article.gscImpressions),
          evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Clics', article.gscClicks),
          evidence('Google Search Console', 'searchanalytics.query', dateRange, 'CTR', `${article.gscCtr}%`),
        ],
        confidence: 'high',
        createdAt: now,
      });
    }

    // ─── Regla 4: Alto engagement + pocas impresiones → actualizar artículo ───
    if (article.hasGa4Data && article.hasGscData) {
      const avgEngagement = ga4?.engagementRate || 0;
      if (article.ga4EngagementRate > avgEngagement * 1.3 && article.gscImpressions < 100) {
        recommendations.push({
          id: makeId('update', article.slug),
          articleSlug: article.slug,
          articleTitle: article.titulo,
          type: 'update',
          severity: 'info',
          title: 'Alto engagement, pocas impresiones',
          description: `Google Analytics 4 muestra una tasa de engagement de ${(article.ga4EngagementRate * 100).toFixed(1)}% (promedio del sitio: ${(avgEngagement * 100).toFixed(1)}%) pero Google Search Console solo registra ${article.gscImpressions} impresiones en los últimos ${daysToCollect} días. Se recomienda actualizar el artículo para mejorar su visibilidad en búsqueda.`,
          evidence: [
            evidence('Google Analytics 4', 'runReport', dateRange, 'Tasa de engagement', `${(article.ga4EngagementRate * 100).toFixed(1)}%`, `Promedio del sitio: ${(avgEngagement * 100).toFixed(1)}%`),
            evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Impresiones', article.gscImpressions),
          ],
          confidence: 'medium',
          createdAt: now,
        });
      }
    }

    // ─── Regla 5: Alto tráfico Facebook + cero Google → revisar SEO ───
    if (article.hasGa4Data && article.gscImpressions === 0) {
      const ga4Sources = ga4?.sources || [];
      const facebookData = ga4Sources.find(s => s.source.toLowerCase().includes('facebook'));
      if (facebookData && facebookData.users > 50) {
        recommendations.push({
          id: makeId('seo', article.slug),
          articleSlug: article.slug,
          articleTitle: article.titulo,
          type: 'seo',
          severity: 'warning',
          title: 'Tráfico social sin tráfico orgánico',
          description: `Google Analytics 4 registra ${facebookData.users} usuarios desde Facebook, pero Google Search Console muestra 0 impresiones en los últimos ${daysToCollect} días. Se recomienda revisar el SEO técnico: indexación, sitemap, structured data, y meta tags.`,
          evidence: [
            evidence('Google Analytics 4', 'runReport', dateRange, 'Usuarios desde Facebook', facebookData.users),
            evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Impresiones', 0),
          ],
          confidence: 'high',
          createdAt: now,
        });
      }
    }

    // ─── Regla 6: URL con 0 impresiones → Google la ignora ───
    if (!article.hasGscData && article.scoreMeni > 0) {
      recommendations.push({
        id: makeId('google_ignore', article.slug),
        articleSlug: article.slug,
        articleTitle: article.titulo,
        type: 'seo',
        severity: 'critical',
        title: 'Google no muestra esta URL',
        description: `Google Search Console no registra impresiones para esta URL en los últimos ${daysToCollect} días. MENI score: ${article.scoreMeni}. Se recomienda verificar indexación, sitemap, y robots.txt.`,
        evidence: [
          evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Impresiones', 0),
          evidence('MENI', 'scoreCalidad', 'Publicación', 'Score MENI', article.scoreMeni),
        ],
        confidence: 'high',
        createdAt: now,
      });
    }
  }

  return recommendations;
}
