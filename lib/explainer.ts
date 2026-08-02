import type { Noticia } from '@/lib/types';

export type ExplainerType = 'explicador' | 'guia' | 'analisis';

export const ARTICLE_TYPES = ['noticia', 'explicador', 'guia', 'analisis'] as const;

export function isExplainer(noticia: Noticia): boolean {
  return noticia.articleType === 'explicador' || noticia.articleType === 'guia' || noticia.articleType === 'analisis';
}

export function validateExplainer(noticia: Noticia): { valid: boolean; missing: string[] } {
  if (!isExplainer(noticia)) return { valid: true, missing: [] };
  const missing: string[] = [];
  if (!noticia.explainer?.contexto?.trim()) missing.push('contexto');
  if (!noticia.explainer?.conceptosClave?.length) missing.push('conceptosClave');
  if (!noticia.explainer?.faq?.length) missing.push('faq');
  return { valid: missing.length === 0, missing };
}

export function generateExplainerTeaser(noticia: Noticia): string {
  if (!isExplainer(noticia)) return noticia.resumen;
  const e = noticia.explainer;
  const pregunta = e?.faq?.[0]?.pregunta;
  const contexto = e?.contexto;
  return `Te explicamos: ${noticia.titulo}.${contexto ? ` ${contexto}` : ''}${pregunta ? ` Ejemplo: ${pregunta}` : ''}`;
}

export function explainerLabel(articleType: Noticia['articleType']): string {
  switch (articleType) {
    case 'explicador':
      return 'Te explicamos';
    case 'guia':
      return 'Guía';
    case 'analisis':
      return 'Análisis';
    default:
      return 'Noticia';
  }
}
