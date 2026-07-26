/**
 * Pattern Analyzer — Learning Engine
 * ====================================
 * Analiza patrones en los datos reales: categorías, longitud, horarios, fuentes.
 * Calcula correlaciones entre características editoriales y rendimiento.
 */

import type {
  ArticleMetrics,
  CategoryPerformance,
  TemporalPattern,
  Correlation,
} from './types';

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function analyzeCategoryPerformance(articles: ArticleMetrics[]): CategoryPerformance[] {
  const byCategory = new Map<string, ArticleMetrics[]>();

  for (const a of articles) {
    const list = byCategory.get(a.categoria) || [];
    list.push(a);
    byCategory.set(a.categoria, list);
  }

  return Array.from(byCategory.entries())
    .map(([categoria, list]) => {
      const vistasTotales = list.reduce((s, a) => s + a.vistas, 0);
      const sorted = [...list].sort((a, b) => b.vistas - a.vistas);
      const scores = list.filter((a) => a.scoreMeni > 0);
      const aprobados = list.filter((a) => a.aprobadoMeni);

      return {
        categoria,
        totalArticulos: list.length,
        vistasTotales,
        vistasPromedio: Math.round(vistasTotales / list.length),
        mejorArticulo: sorted[0]
          ? { titulo: sorted[0].titulo, vistas: sorted[0].vistas }
          : null,
        peorArticulo: sorted[sorted.length - 1]
          ? { titulo: sorted[sorted.length - 1].titulo, vistas: sorted[sorted.length - 1].vistas }
          : null,
        scorePromedio: scores.length > 0 ? Math.round(scores.reduce((s, a) => s + a.scoreMeni, 0) / scores.length) : 0,
        tasaAprobacion: list.length > 0 ? Math.round((aprobados.length / list.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.vistasPromedio - a.vistasPromedio);
}

export function analyzeTemporalPatterns(articles: ArticleMetrics[]): TemporalPattern[] {
  const bySlot = new Map<string, { dia: string; hora: number; vistas: number; count: number }>();

  for (const a of articles) {
    const fecha = new Date(a.fechaPublicacion);
    const dia = DIAS_SEMANA[fecha.getDay()] || 'desconocido';
    const hora = fecha.getHours();
    const slotKey = `${dia}-${hora}`;

    const existing = bySlot.get(slotKey) || { dia, hora, vistas: 0, count: 0 };
    existing.vistas += a.vistas;
    existing.count++;
    bySlot.set(slotKey, existing);
  }

  return Array.from(bySlot.values())
    .map((s) => ({
      diaSemana: s.dia,
      horaPublicacion: s.hora,
      vistasPromedio: Math.round(s.vistas / s.count),
      totalArticulos: s.count,
    }))
    .filter((p) => p.totalArticulos >= 2)
    .sort((a, b) => b.vistasPromedio - a.vistasPromedio);
}

/**
 * Calcula correlación de Pearson entre dos arrays numéricos.
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;

  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  return denominator === 0 ? 0 : numerator / denominator;
}

export function analyzeCorrelations(articles: ArticleMetrics[]): Correlation[] {
  const correlations: Correlation[] = [];
  const withViews = articles.filter((a) => a.vistas > 0);

  if (withViews.length < 5) return correlations;

  // Correlación: longitud del título vs vistas
  const titleLengths = withViews.map((a) => a.titulo.length);
  const views = withViews.map((a) => a.vistas);
  const corrTitle = pearsonCorrelation(titleLengths, views);
  correlations.push({
    feature: 'longitud_titulo',
    description: `Correlación entre longitud del título y vistas (r=${corrTitle.toFixed(2)})`,
    correlation: corrTitle,
    sampleSize: withViews.length,
    recommendation: corrTitle < -0.2
      ? 'Los títulos más cortos performan mejor. Considera titulares concisos (50-60 chars).'
      : corrTitle > 0.2
        ? 'Los títulos más largos performan mejor. Considera titulares descriptivos.'
        : 'No hay correlación significativa entre longitud del título y vistas.',
  });

  // Correlación: palabras del contenido vs vistas
  const withWords = withViews.filter((a) => a.palabras > 0);
  if (withWords.length >= 5) {
    const wordCounts = withWords.map((a) => a.palabras);
    const wordViews = withWords.map((a) => a.vistas);
    const corrWords = pearsonCorrelation(wordCounts, wordViews);
    correlations.push({
      feature: 'longitud_contenido',
      description: `Correlación entre palabras del contenido y vistas (r=${corrWords.toFixed(2)})`,
      correlation: corrWords,
      sampleSize: withWords.length,
      recommendation: corrWords > 0.2
        ? 'El contenido más extenso recibe más vistas. Mantén artículos de 500+ palabras.'
        : corrWords < -0.2
          ? 'El contenido más corto recibe más vistas. Los lectores prefieren notas concisas.'
          : 'La longitud del contenido no correlaciona significativamente con las vistas.',
    });
  }

  // Correlación: score MENI vs vistas
  const withScore = withViews.filter((a) => a.scoreMeni > 0);
  if (withScore.length >= 5) {
    const scores = withScore.map((a) => a.scoreMeni);
    const scoreViews = withScore.map((a) => a.vistas);
    const corrScore = pearsonCorrelation(scores, scoreViews);
    correlations.push({
      feature: 'score_meni',
      description: `Correlación entre score MENI y vistas reales (r=${corrScore.toFixed(2)})`,
      correlation: corrScore,
      sampleSize: withScore.length,
      recommendation: corrScore > 0.3
        ? 'El score MENI correlaciona positivamente con vistas reales. El sistema está calibrado correctamente.'
        : corrScore < -0.2
          ? 'El score MENI no predice bien las vistas. Revisar pesos del scoring.'
          : 'La correlación entre score MENI y vistas es baja. Considerar ajustar pesos.',
    });
  }

  // Impacto de tener imagen
  const conImagen = withViews.filter((a) => a.tieneImagen);
  const sinImagen = withViews.filter((a) => !a.tieneImagen);
  if (conImagen.length >= 3 && sinImagen.length >= 3) {
    const avgCon = conImagen.reduce((s, a) => s + a.vistas, 0) / conImagen.length;
    const avgSin = sinImagen.reduce((s, a) => s + a.vistas, 0) / sinImagen.length;
    const diff = avgCon - avgSin;
    correlations.push({
      feature: 'tiene_imagen',
      description: `Diferencia de vistas: con imagen ${Math.round(avgCon)} vs sin imagen ${Math.round(avgSin)} (Δ=${Math.round(diff)})`,
      correlation: diff > 0 ? 1 : -1,
      sampleSize: conImagen.length + sinImagen.length,
      recommendation: diff > 0
        ? `Las noticias con imagen reciben ${Math.round(diff)} vistas más en promedio. Siempre incluir imagen destacada.`
        : 'No se observa ventaja significativa de incluir imagen.',
    });
  }

  // Impacto de tener resumen
  const conResumen = withViews.filter((a) => a.tieneResumen);
  const sinResumen = withViews.filter((a) => !a.tieneResumen);
  if (conResumen.length >= 3 && sinResumen.length >= 3) {
    const avgCon = conResumen.reduce((s, a) => s + a.vistas, 0) / conResumen.length;
    const avgSin = sinResumen.reduce((s, a) => s + a.vistas, 0) / sinResumen.length;
    const diff = avgCon - avgSin;
    correlations.push({
      feature: 'tiene_resumen',
      description: `Diferencia de vistas: con resumen ${Math.round(avgCon)} vs sin resumen ${Math.round(avgSin)} (Δ=${Math.round(diff)})`,
      correlation: diff > 0 ? 1 : -1,
      sampleSize: conResumen.length + sinResumen.length,
      recommendation: diff > 0
        ? `Las noticias con resumen reciben ${Math.round(diff)} vistas más. Siempre escribir meta descripción.`
        : 'No se observa ventaja significativa de incluir resumen.',
    });
  }

  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}
