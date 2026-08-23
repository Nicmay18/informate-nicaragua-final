/**
 * NIOS Intelligence Platform — FASE 3.5: Editor CEO Report
 * ==========================================================
 * Reporte estratégico semanal para el editor/CEO.
 *
 * Responde 6 preguntas:
 * 1. ¿Qué funcionó esta semana?
 * 2. ¿Qué fracasó?
 * 3. ¿Qué debemos repetir?
 * 4. ¿Qué debemos dejar de hacer?
 * 5. ¿Qué temas tienen oportunidad?
 * 6. ¿Qué artículos actualizar?
 *
 * Todo basado en datos reales de GSC, GA4, Firestore, MENI, Trust Score.
 * No inventa. No opina. Solo datos.
 */

import type {
  ArticleFusion,
  GSCSnapshot,
  GA4Snapshot,
  GoogleTrustReport,
  EditorCEOReport,
  QueryOpportunity,
  ArticleUpdateCandidate,
  CategoryIntelligenceRow,
  MeniLearningFeedback,
  NIOSEvidence,
} from './types';
import { generateContentOpportunityReport } from './opportunity-engine';
import { generateCategoryIntelligence } from './category-intelligence';
import { generateContentMixReport } from './content-mix-intelligence';
import { generateArticleUpdateReport } from './update-engine';

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
 * 1. ¿Qué funcionó esta semana?
 * Artículos con impresiones altas, CTR bueno, engagement alto.
 */
function findWhatWorked(articles: ArticleFusion[]): EditorCEOReport['whatWorked'] {
  const worked: EditorCEOReport['whatWorked'] = [];

  for (const a of articles) {
    if (a.gscImpressions >= 500 && a.gscCtr >= 2 && a.ga4AvgEngagementTimeSec >= 60) {
      worked.push({
        slug: a.slug,
        titulo: a.titulo,
        categoria: a.categoria,
        metric: 'Impresiones + CTR + Engagement',
        value: `${a.gscImpressions.toLocaleString()} imp, ${a.gscCtr}% CTR, ${a.ga4AvgEngagementTimeSec}s eng`,
        evidence: [
          makeEvidence('Google Search Console', 'searchanalytics.query', `Impresiones de "${a.titulo}"`, a.gscImpressions),
          makeEvidence('Google Search Console', 'searchanalytics.query', `CTR de "${a.titulo}"`, `${a.gscCtr}%`),
          makeEvidence('Google Analytics 4', 'data_api', `Engagement de "${a.titulo}"`, `${a.ga4AvgEngagementTimeSec}s`),
        ],
      });
    }
  }

  return worked.sort((a, b) => {
    const aImp = parseInt(a.value) || 0;
    const bImp = parseInt(b.value) || 0;
    return bImp - aImp;
  }).slice(0, 10);
}

/**
 * 2. ¿Qué fracasó?
 * Artículos con MENI alto pero 0 impresiones, o engagement muy bajo.
 */
function findWhatFailed(articles: ArticleFusion[]): EditorCEOReport['whatFailed'] {
  const failed: EditorCEOReport['whatFailed'] = [];

  for (const a of articles) {
    // MENI alto pero GSC sin datos (hipótesis, no conclusión)
    if (a.scoreMeni !== null && a.scoreMeni >= 80 && a.gscImpressions === 0) {
      failed.push({
        slug: a.slug,
        titulo: a.titulo,
        categoria: a.categoria,
        metric: 'MENI alto pero GSC no registra datos',
        value: `MENI ${a.scoreMeni}, 0 impresiones`,
        evidence: [
          makeEvidence('MENI', 'scoreMeni', `MENI de "${a.titulo}"`, a.scoreMeni ?? 'N/D'),
          makeEvidence('Google Search Console', 'searchanalytics.query', `Impresiones de "${a.titulo}"`, 0),
        ],
      });
    }

    // Engagement muy bajo (menos de 10s)
    if (a.ga4AvgEngagementTimeSec > 0 && a.ga4AvgEngagementTimeSec < 10 && a.ga4Pageviews > 50) {
      failed.push({
        slug: a.slug,
        titulo: a.titulo,
        categoria: a.categoria,
        metric: 'Engagement muy bajo',
        value: `${a.ga4AvgEngagementTimeSec}s promedio, ${a.ga4Pageviews} pageviews`,
        evidence: [
          makeEvidence('Google Analytics 4', 'data_api', `Engagement de "${a.titulo}"`, `${a.ga4AvgEngagementTimeSec}s`),
          makeEvidence('Google Analytics 4', 'data_api', `Pageviews de "${a.titulo}"`, a.ga4Pageviews),
        ],
      });
    }
  }

  return failed.slice(0, 10);
}

/**
 * 3. ¿Qué debemos repetir?
 * Patrones de categorías y tipos que funcionan.
 */
function findWhatToRepeat(
  articles: ArticleFusion[],
  categories: CategoryIntelligenceRow[],
  hasGscData: boolean,
): EditorCEOReport['whatToRepeat'] {
  const actions: EditorCEOReport['whatToRepeat'] = [];

  const goodCats = hasGscData ? categories.filter(c => c.opportunity === 'aumentar' && c.googleImpressions >= 1000) : [];
  for (const cat of goodCats.slice(0, 3)) {
    actions.push({
      action: `Publicar más en ${cat.categoria}`,
      reasoning: `${cat.categoria} tiene ${cat.googleImpressions.toLocaleString()} impresiones, CTR ${cat.avgCtr}% y posición ${cat.avgPosition}. El contenido de esta categoría está funcionando en Google.`,
      evidence: cat.evidence,
    });
  }

  const evergreen = hasGscData ? articles.filter(a => {
    const days = (Date.now() - new Date(a.fechaPublicacion).getTime()) / (1000 * 60 * 60 * 24);
    return days > 60 && a.gscImpressions >= 500;
  }) : [];

  if (evergreen.length > 0) {
    actions.push({
      action: 'Crear más contenido evergreen',
      reasoning: `${evergreen.length} artículos publicados hace más de 60 días siguen recibiendo tráfico. El contenido evergreen tiene retorno a largo plazo.`,
      evidence: [
        makeEvidence('Google Search Console', 'searchanalytics.query', 'Artículos evergreen con tráfico', evergreen.length),
      ],
    });
  }

  return actions;
}

/**
 * 4. ¿Qué debemos dejar de hacer?
 */
function findWhatToStop(
  articles: ArticleFusion[],
  categories: CategoryIntelligenceRow[],
  hasGscData: boolean,
): EditorCEOReport['whatToStop'] {
  const actions: EditorCEOReport['whatToStop'] = [];

  const limitCats = hasGscData ? categories.filter(c => c.opportunity === 'limitar') : [];
  for (const cat of limitCats.slice(0, 3)) {
    actions.push({
      action: `Limitar publicación en ${cat.categoria}`,
      reasoning: cat.reasoning,
      evidence: cat.evidence,
    });
  }

  // Thin content repetido
  const thinCount = articles.filter(a => a.palabras < 400).length;
  if (thinCount > 5) {
    actions.push({
      action: 'Dejar de publicar contenido corto (<400 palabras)',
      reasoning: `${thinCount} artículos con menos de 400 palabras. Google penaliza thin content. No publicar más notas cortas sin contexto.`,
      evidence: [
        makeEvidence('Firestore', 'noticias', 'Artículos thin content', thinCount),
      ],
    });
  }

  // Artículos sin autor
  const noAuthor = articles.filter(a => !a.autor || a.autor.trim() === '').length;
  if (noAuthor > 3) {
    actions.push({
      action: 'No publicar sin autor identificado',
      reasoning: `${noAuthor} artículos sin autor. EEAT requiere autoría clara. No publicar más artículos anónimos.`,
      evidence: [
        makeEvidence('Firestore', 'noticias', 'Artículos sin autor', noAuthor),
      ],
    });
  }

  return actions;
}

/**
 * Genera el Editor CEO Report completo.
 */
export function generateEditorCEOReport(
  articles: ArticleFusion[],
  gsc: GSCSnapshot | null,
  ga4: GA4Snapshot | null,
  trust: GoogleTrustReport | null,
  meniLearning: MeniLearningFeedback | null,
): EditorCEOReport {
  const now = new Date().toISOString();
  const periodEnd = formatDate(new Date());
  const periodStart = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  if (articles.length === 0) {
    return {
      generatedAt: now,
      periodStart,
      periodEnd,
      hasData: false,
      whatWorked: [],
      whatFailed: [],
      whatToRepeat: [],
      whatToStop: [],
      topicOpportunities: [],
      articlesToUpdate: [],
      categoryIntelligence: [],
      contentMix: [],
      meniLearning: null,
      summary: 'Datos insuficientes para generar el reporte del editor. Ejecutar el pipeline de recolección primero.',
    };
  }

  // Generar sub-reportes
  const opportunityReport = generateContentOpportunityReport(articles, gsc);
  const categoryReport = generateCategoryIntelligence(articles, gsc, ga4, trust);
  const mixReport = generateContentMixReport(articles, gsc, ga4, trust);
  const updateReport = generateArticleUpdateReport(articles);

  const hasGsc = gsc?.status === 'REAL';

  // 1. ¿Qué funcionó?
  const whatWorked = findWhatWorked(articles);

  // 2. ¿Qué fracasó?
  const whatFailed = findWhatFailed(articles);

  // 3. ¿Qué repetir?
  const whatToRepeat = findWhatToRepeat(articles, categoryReport.categories, hasGsc);

  // 4. ¿Qué dejar de hacer?
  const whatToStop = findWhatToStop(articles, categoryReport.categories, hasGsc);

  // 5. ¿Qué temas tienen oportunidad?
  const topicOpportunities: QueryOpportunity[] = opportunityReport.topOpportunities;

  // 6. ¿Qué artículos actualizar?
  const articlesToUpdate: ArticleUpdateCandidate[] = updateReport.topPriority;

  const gscStatus = hasGsc ? 'con datos GSC' : 'GSC ACCESS_BLOCKED; métricas orgánicas no determinables';
  const summary = `Reporte editorial: ${whatWorked.length} artículos funcionando, ${whatFailed.length} fracasando. GSC: ${gscStatus}. Repetir: ${whatToRepeat.length} acciones. Detener: ${whatToStop.length} acciones. ${topicOpportunities.length} oportunidades de temas. ${articlesToUpdate.length} artículos para actualizar. ${mixReport.totalArticles} artículos recomendados para próxima semana.`;

  return {
    generatedAt: now,
    periodStart,
    periodEnd,
    hasData: true,
    whatWorked,
    whatFailed,
    whatToRepeat,
    whatToStop,
    topicOpportunities,
    articlesToUpdate,
    categoryIntelligence: categoryReport.categories,
    contentMix: mixReport.recommendations,
    meniLearning,
    summary,
  };
}
