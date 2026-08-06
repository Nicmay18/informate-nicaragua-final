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
    const hasGsc = article.hasGscData && article.gscImpressions > 0;
    const impressions = article.gscImpressions;
    const scoreMeni = article.scoreMeni;

    let googleVerdict: ComplianceVerdict['googleVerdict'];
    let meniVsGoogleGap: ComplianceVerdict['meniVsGoogleGap'];
    let explanation: string;
    const evidenceList: NIOSEvidence[] = [];

    evidenceList.push(
      evidence('MENI', 'scoreCalidad', 'Publicación', 'Score MENI', scoreMeni),
    );

    if (!hasGsc || impressions === 0) {
      googleVerdict = 'google_ignores';
      evidenceList.push(
        evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Impresiones', 0),
      );

      if (scoreMeni >= 90) {
        meniVsGoogleGap = 'meni_overestimates';
        explanation = `MENI otorga ${scoreMeni} puntos, pero Google Search Console registra 0 impresiones en los últimos 28 días. Google NO considera útil esta nota. MENI está sobreestimando el valor de este contenido.`;
      } else if (scoreMeni > 0) {
        meniVsGoogleGap = 'no_data';
        explanation = `MENI otorga ${scoreMeni} puntos. Google Search Console no registra impresiones. No hay datos suficientes para determinar si Google valora esta nota.`;
      } else {
        meniVsGoogleGap = 'no_data';
        explanation = `Sin score MENI y sin impresiones en Google Search Console. No hay datos suficientes.`;
      }
    } else if (impressions < 10) {
      googleVerdict = 'google_ignores';
      evidenceList.push(
        evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Impresiones', impressions),
      );

      if (scoreMeni >= 90) {
        meniVsGoogleGap = 'meni_overestimates';
        explanation = `MENI otorga ${scoreMeni} puntos, pero Google Search Console solo registra ${impressions} impresiones en 28 días. Google prácticamente ignora esta nota. MENI está sobreestimando.`;
      } else {
        meniVsGoogleGap = 'no_data';
        explanation = `MENI: ${scoreMeni}. Google: ${impressions} impresiones. Datos insuficientes para una conclusión firme.`;
      }
    } else {
      googleVerdict = 'google_values';
      evidenceList.push(
        evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Impresiones', impressions),
        evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Clics', article.gscClicks),
        evidence('Google Search Console', 'searchanalytics.query', dateRange, 'Posición media', article.gscPosition),
      );

      if (scoreMeni < 85 && impressions > 1000) {
        meniVsGoogleGap = 'meni_underestimates';
        explanation = `MENI otorga solo ${scoreMeni} puntos, pero Google Search Console registra ${impressions.toLocaleString()} impresiones y ${article.gscClicks} clics. Google SÍ encontró valor en este contenido. MENI está subestimando.`;
      } else if (scoreMeni >= 90 && impressions > 1000) {
        meniVsGoogleGap = 'aligned';
        explanation = `MENI otorga ${scoreMeni} puntos y Google Search Console registra ${impressions.toLocaleString()} impresiones. MENI y Google están alineados: este contenido tiene valor real.`;
      } else {
        meniVsGoogleGap = 'aligned';
        explanation = `MENI: ${scoreMeni}. Google: ${impressions} impresiones. Hay datos de Google pero el volumen es moderado.`;
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
  const articlesGoogleIgnores = verdicts.filter(v => v.googleVerdict === 'google_ignores').length;
  const articlesGoogleValues = verdicts.filter(v => v.googleVerdict === 'google_values').length;
  const meniOverestimates = verdicts.filter(v => v.meniVsGoogleGap === 'meni_overestimates').length;
  const meniUnderestimates = verdicts.filter(v => v.meniVsGoogleGap === 'meni_underestimates').length;
  const alignedCount = verdicts.filter(v => v.meniVsGoogleGap === 'aligned').length;

  // Top ignored (MENI alto pero Google ignora)
  const topIgnored = verdicts
    .filter(v => v.googleVerdict === 'google_ignores' && v.scoreMeni >= 85)
    .sort((a, b) => b.scoreMeni - a.scoreMeni)
    .slice(0, 20);

  // Top valued (Google muestra impresiones)
  const topValued = verdicts
    .filter(v => v.googleVerdict === 'google_values')
    .sort((a, b) => b.gscImpressions - a.gscImpressions)
    .slice(0, 20);

  // Resumen
  const pctIgnored = verdicts.length > 0 ? Math.round((articlesGoogleIgnores / verdicts.length) * 100) : 0;
  const pctOverestimates = verdicts.length > 0 ? Math.round((meniOverestimates / verdicts.length) * 100) : 0;

  let summary: string;
  if (articlesGoogleIgnores > articlesGoogleValues) {
    summary = `Google Search Console indica que ${pctIgnored}% de los artículos analizados no reciben impresiones. ${meniOverestimates} artículos con score MENI ≥ 85 son ignorados por Google (${pctOverestimates}% del total). Esto sugiere que MENI está calificando contenido que Google considera de poco valor. Recomendación: revisar los criterios de MENI para alinearlos con lo que Google realmente valora.`;
  } else if (articlesGoogleValues > articlesGoogleIgnores) {
    summary = `Google Search Console indica que ${articlesGoogleValues} artículos reciben impresiones orgánicas. ${alignedCount} artículos están alineados entre MENI y Google. ${meniUnderestimates} artículos son subestimados por MENI pero valorados por Google.`;
  } else {
    summary = `Google Search Console muestra datos mixtos. ${articlesGoogleIgnores} artículos ignorados, ${articlesGoogleValues} artículos con impresiones. Se necesitan más datos para una conclusión firme.`;
  }

  return {
    generatedAt: now,
    totalArticles: verdicts.length,
    articlesWithGscData,
    articlesGoogleIgnores,
    articlesGoogleValues,
    meniOverestimates,
    meniUnderestimates,
    alignedCount,
    verdicts,
    topIgnored,
    topValued,
    summary,
  };
}
