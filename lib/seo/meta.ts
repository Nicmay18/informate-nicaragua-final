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
 * Extract entities from content for automated keyword generation
 */
function extractEntities(titulo: string, contenido?: string): string[] {
  const text = `${titulo} ${contenido || ''}`.toLowerCase();
  const entities: string[] = [];

  // Locations
  const locations = ['managua', 'leon', 'granada', 'esteli', 'matagalpa', 'jinotega', 'chinandega', 'masaya', 'rivas', 'boaco', 'chontales', 'carazo', 'madriz', 'nueva segovia', 'rio san juan', 'raan', 'raas', 'nicaragua', 'centroamérica'];
  locations.forEach(loc => { if (text.includes(loc)) entities.push(loc); });

  // High-value commercial categories for interlinking
  const commercial = ['tecnología', 'deportes', 'espectáculos', 'turismo', 'economía', 'inversión', 'fútbol', 'béisbol', 'cinema', 'música', 'celulares', 'internet'];
  commercial.forEach(c => { if (text.includes(c)) entities.push(c); });

  // Named entity extraction (capitalized words in title)
  const capitalized = titulo.match(/[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*/g) || [];
  capitalized.forEach(e => { if (e.length > 3) entities.push(e); });

  return [...new Set(entities)].slice(0, 8);
}

/**
 * Genera keywords/tags para una noticia (automática + semántica)
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

  // Entidades extraídas del contenido completo (EEAT: demuestra relevancia semántica)
  const entities = extractEntities(noticia.titulo, noticia.contenido);
  base.push(...entities);

  // Palabras clave del título (excluyendo stopwords)
  const titleWords = noticia.titulo
    .toLowerCase()
    .replace(/[^a-záéíóúñ\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['para', 'con', 'por', 'que', 'una', 'los', 'las', 'del', 'como', 'ante', 'bajo', 'desde', 'entre', 'hacia', 'hasta', 'sobre', 'tras'].includes(w))
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
