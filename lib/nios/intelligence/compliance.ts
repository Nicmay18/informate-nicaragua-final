/**
 * NIOS Intelligence Platform — Google Compliance Intelligence (Módulo 0)
 * =======================================================================
 * Responde una sola pregunta: ¿Qué está viendo Google como "contenido de
 * poco valor" en Nicaragua Informate y qué cambios concretos aumentan la
 * probabilidad de aprobación en AdSense?
 *
 * Compara score MENI con datos reales de Google Search Console.
 * Descubre dónde MENI se equivoca.
 * Nada se inventa. Todo se basa en datos reales.
 */

import type {
  ArticleFusion,
  ComplianceReport,
  ComplianceVerdict,
  NIOSEvidence,
  GSCSnapshot,
} from './types';

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
 * Genera el reporte de compliance comparando MENI vs Google.
 */
export function generateComplianceReport(
  articles: ArticleFusion[],
  gsc: GSCSnapshot | null,
  minArticles: number,
): ComplianceReport {
  const now = new Date().toISOString();
  const dateRange = gsc
    ? `${gsc.dateRange.start} a ${gsc.dateRange.end}`
    : 'Sin datos';

  if (!gsc || articles.length < minArticles) {
    return {
      generatedAt: now,
      totalArticles: articles.length,
      articlesWithGscData: 0,
      articlesGoogleIgnores: 0,
      articlesGoogleValues: 0,
      meniOverestimates: 0,
      meniUnderestimates: 0,
      alignedCount: 0,
      verdicts: [],
      topIgnored: [],
      topValued: [],
      summary: 'No hay datos suficientes para emitir una recomendación.',
    };
  }

  const verdicts: ComplianceVerdict[] = [];

  for (const article of articles) {
    const hasGsc = article.hasGscData;
    const impressions = article.gscImpressions;
    const scoreMeni = article.scoreMeni ?? null;

    let googleVerdict: ComplianceVerdict['googleVerdict'];
    let meniVsGoogleGap: ComplianceVerdict['meniVsGoogleGap'];
    let explanation: string;
    const evidenceList: NIOSEvidence[] = [];

    evidenceList.push(
      evidence('MENI', 'scoreMeni', 'Publicación', 'Score MENI', scoreMeni ?? 'N/D'),
    );

    if (!hasGsc) {
      googleVerdict = 'no_data';
      evidenceList.push(
        evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Impresiones', 'N/D'),
      );

      meniVsGoogleGap = 'no_data';
      if (scoreMeni !== null && scoreMeni >= 90) {
        explanation = `MENI otorga ${scoreMeni} puntos, pero Google Search Console no está conectado o no tiene datos reales. No se puede determinar si Google valora esta nota.`;
      } else if (scoreMeni !== null && scoreMeni > 0) {
        explanation = `MENI otorga ${scoreMeni} puntos. Google Search Console no está conectado o no tiene datos reales. No hay datos suficientes para determinar si Google valora esta nota.`;
      } else {
        explanation = `Sin score MENI y sin conexión real con Google Search Console. No hay datos suficientes.`;
      }
    } else if (impressions === 0) {
      googleVerdict = 'low_gsc_visibility';
      evidenceList.push(
        evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Impresiones', 0),
      );

      if (scoreMeni !== null && scoreMeni >= 90) {
        meniVsGoogleGap = 'meni_gsc_gap_hypothesis';
        explanation = `HIPÓTESIS INTERNA: MENI otorga ${scoreMeni} puntos, pero Google Search Console registra 0 impresiones reales en los últimos 28 días. Esto NO significa que Google "rechace" el contenido. Puede deberse a: indexación pendiente, baja demanda de búsqueda, o competencia. No se puede concluir que MENI sobreestime sin más evidencia.`;
      } else if (scoreMeni !== null && scoreMeni > 0) {
        meniVsGoogleGap = 'no_data';
        explanation = `MENI otorga ${scoreMeni} puntos. Google Search Console registra 0 impresiones reales. Datos insuficientes para una conclusión firme.`;
      } else {
        meniVsGoogleGap = 'no_data';
        explanation = `Sin score MENI y 0 impresiones reales en Google Search Console. No hay datos suficientes.`;
      }
    } else if (impressions < 10) {
      googleVerdict = 'low_gsc_visibility';
      evidenceList.push(
        evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Impresiones', impressions),
      );

      if (scoreMeni !== null && scoreMeni >= 90) {
        meniVsGoogleGap = 'meni_gsc_gap_hypothesis';
        explanation = `HIPÓTESIS INTERNA: MENI otorga ${scoreMeni} puntos, pero Google Search Console solo registra ${impressions} impresiones en 28 días. Esto NO significa que Google "ignore" la nota. El volumen es insuficiente para una conclusión firme.`;
      } else {
        meniVsGoogleGap = 'no_data';
        explanation = `MENI: ${scoreMeni ?? 'N/D'}. Google: ${impressions} impresiones. Datos insuficientes para una conclusión firme.`;
      }
    } else {
      googleVerdict = 'google_values';
      evidenceList.push(
        evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Impresiones', impressions),
        evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Clics', article.gscClicks),
        evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Posición media', article.gscPosition),
      );

      if (scoreMeni !== null && scoreMeni < 85 && impressions > 1000) {
        meniVsGoogleGap = 'meni_underestimates';
        explanation = `MENI otorga solo ${scoreMeni} puntos, pero Google Search Console registra ${impressions.toLocaleString()} impresiones y ${article.gscClicks} clics. Google SÍ encontró valor en este contenido. MENI está subestimando.`;
      } else if (scoreMeni !== null && scoreMeni >= 90 && impressions > 1000) {
        meniVsGoogleGap = 'aligned';
        explanation = `MENI otorga ${scoreMeni} puntos y Google Search Console registra ${impressions.toLocaleString()} impresiones. MENI y Google están alineados: este contenido tiene valor real.`;
      } else {
        meniVsGoogleGap = 'aligned';
        explanation = `MENI: ${scoreMeni ?? 'N/D'}. Google: ${impressions} impresiones. Hay datos de Google pero el volumen es moderado.`;
      }
    }

    verdicts.push({
      slug: article.slug,
      titulo: article.titulo,
      categoria: article.categoria,
      scoreMeni,
      gscImpressions: impressions,
      gscClicks: article.gscClicks,
      googleVerdict,
      meniVsGoogleGap,
      explanation,
      evidence: evidenceList,
    });
  }

  // Estadísticas
  const articlesWithGscData = verdicts.filter(v => v.googleVerdict !== 'no_data' && v.gscImpressions > 0).length;
  const articlesLowVisibility = verdicts.filter(v => v.googleVerdict === 'low_gsc_visibility').length;
  const articlesGoogleValues = verdicts.filter(v => v.googleVerdict === 'google_values').length;
  const meniGscGapHypothesis = verdicts.filter(v => v.meniVsGoogleGap === 'meni_gsc_gap_hypothesis').length;
  const meniUnderestimates = verdicts.filter(v => v.meniVsGoogleGap === 'meni_underestimates').length;
  const alignedCount = verdicts.filter(v => v.meniVsGoogleGap === 'aligned').length;

  // Top low GSC visibility (MENI alto pero GSC sin impresiones — hipótesis, no conclusión)
  const topIgnored = verdicts
    .filter(v => v.googleVerdict === 'low_gsc_visibility' && v.scoreMeni !== null && v.scoreMeni >= 85)
    .sort((a, b) => (b.scoreMeni ?? 0) - (a.scoreMeni ?? 0))
    .slice(0, 20);

  // Top valued (Google muestra impresiones)
  const topValued = verdicts
    .filter(v => v.googleVerdict === 'google_values')
    .sort((a, b) => b.gscImpressions - a.gscImpressions)
    .slice(0, 20);

  // Resumen: sin afirmaciones de "Google ignora"; solo datos GSC + hipótesis interna
  const pctLowVisibility = verdicts.length > 0 ? Math.round((articlesLowVisibility / verdicts.length) * 100) : 0;

  let summary: string;
  if (articlesGoogleValues > articlesLowVisibility) {
    summary = `Google Search Console registra impresiones para ${articlesGoogleValues} artículos. ${alignedCount} artículos muestran alineación MENI-GSC. ${meniGscGapHypothesis} artículos con score MENI alto tienen 0 impresiones en GSC, lo cual es una HIPÓTESIS INTERNA (puede deberse a indexación pendiente, demanda de búsqueda o ausencia de datos).`;
  } else if (articlesLowVisibility > 0) {
    summary = `Google Search Console registra baja visibilidad para ${pctLowVisibility}% de los artículos analizados. ${meniGscGapHypothesis} artículos con score MENI alto no tienen impresiones, lo cual es una HIPÓTESIS INTERNA — no se puede concluir que Google "ignore" el contenido sin más evidencia.`;
  } else {
    summary = 'Sin datos suficientes de Google Search Console para emitir conclusiones.';
  }

  return {
    generatedAt: now,
    totalArticles: verdicts.length,
    articlesWithGscData,
    articlesGoogleIgnores: articlesLowVisibility,
    articlesGoogleValues,
    meniOverestimates: meniGscGapHypothesis,
    meniUnderestimates,
    alignedCount,
    verdicts,
    topIgnored,
    topValued,
    summary,
  };
}
