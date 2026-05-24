/**
 * Meta Description Templates — Nicaragua Informate
 * Genera descripciones SEO optimizadas por categoría
 */

import type { Noticia } from '../types';

const TEMPLATES: Record<string, (titulo: string) => string> = {
  'Tecnología': (t) =>
    `${t}. El avance tecnológico podría impactar la industria y el desarrollo científico internacional.`,

  'Sucesos': (t) =>
    `${t}. Autoridades investigan las causas del incidente mientras continúan las labores de atención en la zona.`,

  'Economía': (t) =>
    `${t}. La inversión busca ampliar operaciones y generar impacto económico en el mercado local.`,

  'Salud': (t) =>
    `${t}. Expertos sanitarios mantienen vigilancia sobre posibles efectos y recomendaciones oficiales.`,

  'Infraestructura': (t) =>
    `${t}. El proyecto busca mejorar servicios y atención para miles de ciudadanos en la región.`,

  'Judicial': (t) =>
    `${t}. El caso continúa bajo seguimiento de las autoridades judiciales y policiales.`,

  'Deportes': (t) =>
    `${t}. Cobertura completa del evento deportivo con análisis de resultados y próximos encuentros.`,

  'Nacionales': (t) =>
    `${t}. Noticia de actualidad en Nicaragua con información verificada y contexto para la comunidad.`,

  'Internacionales': (t) =>
    `${t}. Información internacional verificada con análisis de impacto global y regional.`,

  'Espectáculos': (t) =>
    `${t}. Cobertura del mundo del entretenimiento con información actualizada y confirmada.`,

  'General': (t) =>
    `${t}. Noticia de Nicaragua Informate con información verificada y análisis contextual.`,
};

const FALLBACK = (t: string) =>
  `${t}. Noticia de Nicaragua Informate — periodismo verificado desde Managua.`;

/**
 * Genera meta description optimizada para una noticia
 */
export function generateMetaDescription(noticia: Noticia): string {
  const categoria = noticia.categoria || 'General';
  const template = TEMPLATES[categoria] || FALLBACK;

  let desc = template(noticia.titulo);

  // Limitar a 150 caracteres (especialmente para evitar truncado en SERPs)
  if (desc.length > 150) {
    desc = desc.substring(0, 147).trim() + '...';
  }

  return desc;
}

/**
 * Genera keywords/tags para una noticia
 */
export function generateKeywords(noticia: Noticia): string {
  const base = [
    noticia.categoria,
    'Nicaragua',
    'noticias',
    'Nicaragua Informate',
    'actualidad',
  ];

  if (noticia.tags && Array.isArray(noticia.tags)) {
    base.push(...noticia.tags.slice(0, 5));
  }

  // Extraer posibles palabras clave del título
  const titleWords = noticia.titulo
    .toLowerCase()
    .replace(/[^a-záéíóúñ\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['para', 'con', 'por', 'que', 'una', 'los', 'las', 'del', 'como'].includes(w))
    .slice(0, 3);

  base.push(...titleWords);

  return [...new Set(base)].join(', ');
}

/**
 * Genera alt text optimizado para la imagen
 */
export function generateImageAlt(noticia: Noticia): string {
  return `Imagen de ${noticia.categoria}: ${noticia.titulo} — Nicaragua Informate`;
}

/**
 * Genera canonical URL para una noticia
 */
export function generateCanonicalUrl(noticia: Noticia): string {
  return `https://nicaraguainformate.com/noticias/${noticia.slug}`;
}
