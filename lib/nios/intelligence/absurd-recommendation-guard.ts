import type { ArticleFusion, ImprovementRecommendation, NIOSRecommendation } from './types';

const ABSURD_EXPAND_PATTERNS = /profundiz|profundic|ampliar|más largo|extender|completar|agregar contexto/i;
export const COMPLETE_SCORE_THRESHOLD = 85;
export const COMPLETE_WORDS_MIN = 400;
export const COMPLETE_VIEWS_MIN = 50;

export interface ContentCompletenessInput {
  scoreMeni: number | null;
  palabras: number;
  vistas?: number;
  ga4Pageviews?: number;
  hasGscData?: boolean;
}

export function isContentComplete(article: ContentCompletenessInput): boolean {
  const goodMeni = article.scoreMeni !== null && article.scoreMeni >= COMPLETE_SCORE_THRESHOLD;
  const enoughWords = (article.palabras || 0) >= COMPLETE_WORDS_MIN;
  const rawViews = article.vistas ?? article.ga4Pageviews ?? 0;
  const hasTraffic = rawViews >= COMPLETE_VIEWS_MIN || article.hasGscData === true;
  return goodMeni && enoughWords && hasTraffic;
}

function isArticleComplete(article: ArticleFusion): boolean {
  return isContentComplete(article);
}

function looksAbsurd(text: string, article: ArticleFusion): boolean {
  return ABSURD_EXPAND_PATTERNS.test(text) && isArticleComplete(article);
}

function findArticleBySlug(articles: ArticleFusion[], slug: string): ArticleFusion | undefined {
  return articles.find((a) => a.slug === slug);
}

/**
 * Elimina recomendaciones absurdas como "profundizar" o "ampliar" para artículos
 * que ya están completos y con tráfico. Si un artículo cumple, no debe pedírsele más.
 */
export function filterAbsurdNIOSRecommendations(
  recommendations: NIOSRecommendation[],
  articles: ArticleFusion[],
): NIOSRecommendation[] {
  return recommendations.filter((rec) => {
    const target = rec.articleSlug && findArticleBySlug(articles, rec.articleSlug);
    if (!target) return true;
    const text = `${rec.title || ''} ${rec.description || ''}`;
    return !looksAbsurd(text, target);
  });
}

export function filterAbsurdImprovementRecommendations(
  recommendations: ImprovementRecommendation[],
  articles: ArticleFusion[],
): ImprovementRecommendation[] {
  return recommendations.filter((rec) => {
    const target = rec.slug && findArticleBySlug(articles, rec.slug);
    if (!target) return true;
    const text = `${rec.recommendedAction || ''} ${rec.observation || ''}`;
    return !looksAbsurd(text, target);
  });
}
