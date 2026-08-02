/**
 * SEO efectivo — fuente única de verdad.
 *
 * La página pública (`app/noticias/[slug]/page.tsx`) nunca emite una noticia sin
 * meta description, keywords ni alt: resuelve el valor almacenado y, si falta,
 * genera uno automáticamente. Las auditorías deben mirar exactamente lo mismo
 * que ve Google, no el campo crudo de Firestore.
 */

import type { Noticia } from '@/lib/types';
import { generateMetaDescription, generateKeywords, generateImageAlt } from './meta';

export type SeoSource = 'stored' | 'generated';

export interface EffectiveSeo {
  description: string;
  descriptionSource: SeoSource;
  keywords: string;
  keywordsSource: SeoSource;
  imageAlt: string;
  imageAltSource: SeoSource;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cutAt = text.lastIndexOf(' ', max - 3);
  return cutAt > 0 ? `${text.slice(0, cutAt)}…` : `${text.slice(0, max - 3)}…`;
}

/**
 * Replica la resolución de metadatos de la página pública.
 */
export function resolveEffectiveSeo(noticia: Noticia): EffectiveSeo {
  const stored = noticia.resumen?.trim() || noticia.metaDescription?.trim() || '';
  const description = stored || generateMetaDescription(noticia);

  const storedKeywords = noticia.keywords?.trim() || '';
  const tagKeywords = Array.isArray(noticia.tags) && noticia.tags.length > 0 ? noticia.tags.join(', ') : '';
  const keywords = storedKeywords || tagKeywords || generateKeywords(noticia);

  const storedAlt = noticia.pieFoto?.trim() || '';
  const imageAlt = storedAlt || generateImageAlt(noticia);

  return {
    description: truncate(description, 160),
    descriptionSource: stored ? 'stored' : 'generated',
    keywords,
    keywordsSource: storedKeywords || tagKeywords ? 'stored' : 'generated',
    imageAlt,
    imageAltSource: storedAlt ? 'stored' : 'generated',
  };
}

/**
 * Una meta description es débil solo si el resultado final que ve Google
 * queda fuera del rango recomendado.
 */
export function hasWeakMetaDescription(noticia: Noticia): boolean {
  const { description } = resolveEffectiveSeo(noticia);
  return description.length < 80 || description.length > 160;
}

export function hasWeakKeywords(noticia: Noticia): boolean {
  const { keywords } = resolveEffectiveSeo(noticia);
  return keywords.length < 10;
}
