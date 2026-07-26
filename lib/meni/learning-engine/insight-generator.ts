/**
 * Insight Generator — Learning Engine
 * ======================================
 * Genera insights accionables basados en el análisis de métricas reales.
 */

import type {
  ArticleMetrics,
  CategoryPerformance,
  SourcePerformance,
  TemporalPattern,
  Correlation,
  WeightAdjustment,
  LearningInsight,
} from './types';

function makeId(type: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${type}-${slug}`;
}

export function generateInsights(
  articles: ArticleMetrics[],
  categoryPerformance: CategoryPerformance[],
  sourcePerformance: SourcePerformance[],
  temporalPatterns: TemporalPattern[],
  correlations: Correlation[],
  weightAdjustments: WeightAdjustment[],
): LearningInsight[] {
  const insights: LearningInsight[] = [];
  const now = new Date().toISOString();

  // ─── Categoría estrella ───
  if (categoryPerformance.length > 0 && categoryPerformance[0].vistasPromedio > 0) {
    const top = categoryPerformance[0];
    insights.push({
      id: makeId('performance', `categoria-estrella-${top.categoria}`),
      type: 'positive',
      title: `Categoría estrella: ${top.categoria}`,
      description: `${top.categoria} promedia ${top.vistasPromedio} vistas por artículo (${top.totalArticulos} artículos). Es la categoría con mejor rendimiento.`,
      severity: 'positive',
      data: { categoria: top.categoria, vistasPromedio: top.vistasPromedio, totalArticulos: top.totalArticulos },
      generatedAt: now,
    });
  }

  // ─── Categoría subutilizada ───
  if (categoryPerformance.length > 1) {
    const low = [...categoryPerformance]
      .filter((c) => c.totalArticulos >= 3)
      .sort((a, b) => a.vistasPromedio - b.vistasPromedio)[0];
    if (low && low.vistasPromedio < categoryPerformance[0].vistasPromedio * 0.3) {
      insights.push({
        id: makeId('alert', `categoria-subutilizada-${low.categoria}`),
        type: 'alert',
        title: `Categoría subutilizada: ${low.categoria}`,
        description: `${low.categoria} solo promedia ${low.vistasPromedio} vistas. Considera mejorar titulares, agregar contexto o reducir frecuencia si no hay demanda.`,
        severity: 'warning',
        data: { categoria: low.categoria, vistasPromedio: low.vistasPromedio, totalArticulos: low.totalArticulos },
        generatedAt: now,
      });
    }
  }

  // ─── Mejor horario de publicación ───
  if (temporalPatterns.length > 0) {
    const best = temporalPatterns[0];
    const worst = temporalPatterns[temporalPatterns.length - 1];
    insights.push({
      id: makeId('pattern', `mejor-horario-${best.diaSemana}-${best.horaPublicacion}`),
      type: 'pattern',
      title: `Mejor horario: ${best.diaSemana} a las ${best.horaPublicacion}:00`,
      description: `Publicar los ${best.diaSemana} a las ${best.horaPublicacion}:00 genera ${best.vistasPromedio} vistas promedio (${best.totalArticulos} artículos analizados).`,
      severity: 'info',
      data: { dia: best.diaSemana, hora: best.horaPublicacion, vistasPromedio: best.vistasPromedio },
      generatedAt: now,
    });

    if (worst && worst.vistasPromedio < best.vistasPromedio * 0.3 && worst.totalArticulos >= 3) {
      insights.push({
        id: makeId('pattern', `peor-horario-${worst.diaSemana}-${worst.horaPublicacion}`),
        type: 'pattern',
        title: `Peor horario: ${worst.diaSemana} a las ${worst.horaPublicacion}:00`,
        description: `Publicar los ${worst.diaSemana} a las ${worst.horaPublicacion}:00 solo genera ${worst.vistasPromedio} vistas promedio. Evita este horario.`,
        severity: 'warning',
        data: { dia: worst.diaSemana, hora: worst.horaPublicacion, vistasPromedio: worst.vistasPromedio },
        generatedAt: now,
      });
    }
  }

  // ─── Fuente de tráfico principal ───
  if (sourcePerformance.length > 0) {
    const top = sourcePerformance[0];
    insights.push({
      id: makeId('performance', `fuente-principal-${top.fuente}`),
      type: 'performance',
      title: `Fuente de tráfico #1: ${top.fuente}`,
      description: `${top.fuente} genera ${top.visitas} visitas (${top.porcentajeTotal}% del total) a ${top.articulosUnicos} artículos. ${top.visitasPorArticulo} visitas por artículo.`,
      severity: 'info',
      data: { fuente: top.fuente, visitas: top.visitas, porcentaje: top.porcentajeTotal },
      generatedAt: now,
    });
  }

  // ─── Correlaciones significativas ───
  for (const corr of correlations.slice(0, 3)) {
    const absCorr = Math.abs(corr.correlation);
    if (absCorr > 0.3 && corr.sampleSize >= 10) {
      insights.push({
        id: makeId('correlation', corr.feature),
        type: 'correlation',
        title: `Correlación: ${corr.feature}`,
        description: corr.description,
        severity: absCorr > 0.5 ? 'positive' : 'info',
        data: { feature: corr.feature, correlation: corr.correlation, sampleSize: corr.sampleSize },
        generatedAt: now,
      });
    }
  }

  // ─── Ajustes de peso sugeridos ───
  for (const adj of weightAdjustments) {
    insights.push({
      id: makeId('recommendation', `ajuste-peso-${adj.component}`),
      type: 'recommendation',
      title: `Ajuste sugerido: ${adj.component}`,
      description: `${adj.reason} Confianza: ${(adj.confidence * 100).toFixed(0)}%.`,
      severity: adj.confidence > 0.7 ? 'positive' : 'info',
      data: { component: adj.component, current: adj.currentWeight, suggested: adj.suggestedWeight, confidence: adj.confidence },
      generatedAt: now,
    });
  }

  // ─── Artículos sin vistas (oportunidad de distribución) ───
  const sinVistas = articles.filter((a) => a.vistas === 0);
  if (sinVistas.length > articles.length * 0.3) {
    insights.push({
      id: makeId('alert', 'articulos-sin-vistas'),
      type: 'alert',
      title: `${sinVistas.length} artículos sin vistas`,
      description: `${Math.round((sinVistas.length / articles.length) * 100)}% de los artículos no han recibido vistas. Revisar distribución en redes sociales y SEO.`,
      severity: 'critical',
      data: { totalSinVistas: sinVistas.length, totalArticles: articles.length, porcentaje: Math.round((sinVistas.length / articles.length) * 100) },
      generatedAt: now,
    });
  }

  // ─── Top performers ───
  const top5 = [...articles].sort((a, b) => b.vistas - a.vistas).slice(0, 5);
  if (top5[0] && top5[0].vistas > 0) {
    insights.push({
      id: makeId('positive', 'top-performers'),
      type: 'performance',
      title: `Artículo más visto: ${top5[0].vistas} vistas`,
      description: `"${top5[0].titulo}" es el artículo con más vistas (${top5[0].vistas}). Categoría: ${top5[0].categoria}.`,
      severity: 'positive',
      data: { titulo: top5[0].titulo, vistas: top5[0].vistas, categoria: top5[0].categoria },
      generatedAt: now,
    });
  }

  return insights;
}
