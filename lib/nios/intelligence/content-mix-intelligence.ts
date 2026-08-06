/**
 * NIOS Intelligence Platform — FASE 3.3: Content Mix Optimizer
 * ==============================================================
 * Recomienda semanalmente qué publicar basándose en datos reales.
 *
 * La recomendación explica: "Porque Google/usuarios muestran esta oportunidad"
 *
 * No genera contenido. No sustituye al periodista.
 * Solo recomienda cantidades y tipos basándose en evidencia.
 */

import type {
  ArticleFusion,
  GSCSnapshot,
  GA4Snapshot,
  GoogleTrustReport,
  ContentMixRecommendation,
  ContentMixReport,
  NIOSEvidence,
} from './types';
import { generateCategoryIntelligence } from './category-intelligence';

function makeEvidence(
  source: NIOSEvidence['source'],
  api: string,
  metric: string,
  value: string | number,
  comparison?: string,
): NIOSEvidence {
  return {
    source,
    api,
    dateRange: 'Últimos 28 días',
    metric,
    value,
    comparison,
    collectedAt: new Date().toISOString(),
  };
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Genera el reporte de content mix semanal.
 */
export function generateContentMixReport(
  articles: ArticleFusion[],
  gsc: GSCSnapshot | null,
  ga4: GA4Snapshot | null,
  trust: GoogleTrustReport | null,
): ContentMixReport {
  const now = new Date().toISOString();
  const weekStart = formatDate(new Date());
  const weekEnd = formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  if (articles.length === 0 || !gsc) {
    return {
      generatedAt: now,
      weekStart,
      weekEnd,
      recommendations: [],
      totalArticles: 0,
      summary: 'Datos insuficientes para generar recomendación de content mix. Ejecutar el pipeline de recolección primero.',
    };
  }

  const catReport = generateCategoryIntelligence(articles, gsc, ga4, trust);
  const recommendations: ContentMixRecommendation[] = [];

  // Categorías con oportunidad de aumentar
  const increaseCats = catReport.increaseCategories;

  for (const cat of increaseCats.slice(0, 3)) {
    const cantidad = cat.googleImpressions >= 5000 ? 5 : cat.googleImpressions >= 1000 ? 3 : 2;

    const isEvergreen = cat.avgPosition <= 8 && cat.avgCtr >= 3;
    const tipo = isEvergreen ? 'Guías evergreen' : 'Nacionales servicio';

    recommendations.push({
      tipo,
      cantidad,
      categoria: cat.categoria,
      razon: `Porque Google muestra ${cat.googleImpressions.toLocaleString()} impresiones en ${cat.categoria} con posición ${cat.avgPosition} y CTR ${cat.avgCtr}%. Hay demanda demostrada.`,
      evidence: cat.evidence,
    });
  }

  // Si hay categorías con posición 5-20, recomendar contenido explicativo
  const midPositionCats = catReport.categories.filter(
    c => c.avgPosition >= 5 && c.avgPosition <= 20 && c.googleImpressions >= 500,
  );

  for (const cat of midPositionCats.slice(0, 2)) {
    recommendations.push({
      tipo: 'Contenido explicativo',
      cantidad: 2,
      categoria: cat.categoria,
      razon: `Porque ${cat.categoria} está en posición ${cat.avgPosition} con ${cat.googleImpressions.toLocaleString()} impresiones. Contenido explicativo puede llevarlo al top 5.`,
      evidence: cat.evidence,
    });
  }

  // Si hay thin content o categorías limitadas, recomendar investigación
  const limitCats = catReport.limitCategories;
  if (limitCats.length > 0) {
    recommendations.push({
      tipo: 'Investigación propia',
      cantidad: 1,
      categoria: 'Nacionales',
      razon: `Porque ${limitCats.length} categorías tienen baja visibilidad en Google. Investigación propia con EEAT fuerte puede diferenciar el sitio.`,
      evidence: [
        makeEvidence(
          'Google Search Console',
          'searchanalytics.query',
          'Categorías con baja visibilidad',
          limitCats.length,
        ),
      ],
    });
  }

  // Si no hay recomendaciones, recomendar optimización
  if (recommendations.length === 0) {
    recommendations.push({
      tipo: 'Optimización de existentes',
      cantidad: 10,
      categoria: 'Todas',
      razon: 'No hay categorías con oportunidad clara esta semana. Priorizar optimización de artículos existentes sobre nueva publicación.',
      evidence: [
        makeEvidence(
          'Google Search Console',
          'searchanalytics.query',
          'Categorías con oportunidad alta',
          0,
        ),
      ],
    });
  }

  const totalArticles = recommendations.reduce((s, r) => s + r.cantidad, 0);

  const summary =
    recommendations.length > 0
      ? `Recomendación semanal: ${totalArticles} artículos. ${recommendations.map(r => `${r.cantidad} ${r.tipo} en ${r.categoria}`).join(', ')}. Basado en datos reales de GSC y GA4.`
      : 'No hay suficientes datos para recomendar un content mix esta semana.';

  return {
    generatedAt: now,
    weekStart,
    weekEnd,
    recommendations,
    totalArticles,
    summary,
  };
}
