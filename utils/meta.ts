/**
 * meta.ts — Módulo de Extracción de Keywords Automatizado
 * Pilar 5: Arquitectura de Keywords Automatizadas
 *
 * Extrae entidades semánticas de título y contenido para:
 *   - Meta-tags dinámicas
 *   - Interlinking automatizado hacia secciones de alto valor comercial
 *   - NLP de Google Discover / Google News
 */

// ─── Diccionarios de entidades ───

/** Ubicaciones geográficas clave de Nicaragua para SEO local */
const NICARAGUA_LOCATIONS = [
  'managua', 'leon', 'granada', 'esteli', 'matagalpa', 'jinotega',
  'chinandega', 'masaya', 'rivas', 'boaco', 'chontales', 'carazo',
  'madriz', 'nueva segovia', 'rio san juan', 'raan', 'raas',
  'raccs', 'raccn', 'nicaragua', 'centroamérica', 'américa central',
];

/** Categorías comerciales de alto valor para interlinking */
const HIGH_VALUE_CATEGORIES = [
  'tecnología', 'deportes', 'espectáculos', 'turismo', 'economía',
  'inversión', 'fútbol', 'béisbol', 'cinema', 'música', 'celulares',
  'internet', 'programación', 'software', 'hardware', 'streaming',
  'criptomonedas', 'startup', 'emprendimiento', 'negocios',
];

// ─── Función principal ───

/**
 * Extrae entidades semánticas del texto completo (título + contenido).
 *
 * @param titulo   — Título de la noticia
 * @param contenido — Cuerpo HTML o texto plano (opcional)
 * @returns Array de keywords únicas ordenadas por relevancia
 */
export function extractEntities(titulo: string, contenido?: string): string[] {
  const text = `${titulo} ${contenido || ''}`.toLowerCase();
  const entities: string[] = [];

  // 1. Ubicaciones geográficas (mejora ranking local)
  NICARAGUA_LOCATIONS.forEach((loc) => {
    if (text.includes(loc)) entities.push(loc);
  });

  // 2. Categorías comerciales de alto valor (impulsa interlinking)
  HIGH_VALUE_CATEGORIES.forEach((cat) => {
    if (text.includes(cat)) entities.push(cat);
  });

  // 3. Entidades con mayúsculas en el título (NLP de Google Discover)
  //    Captura nombres propios: "Daniel Ortega", "Managua FC", "Apple"
  const capitalized = titulo.match(
    /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*/g
  );
  if (capitalized) {
    capitalized.forEach((entity) => {
      if (entity.length > 3) entities.push(entity);
    });
  }

  // 4. Stopwords de español (no añadir como keywords)
  const stopwords = new Set([
    'para', 'con', 'por', 'que', 'una', 'los', 'las', 'del', 'como',
    'ante', 'bajo', 'desde', 'entre', 'hacia', 'hasta', 'sobre', 'tras',
    'pero', 'más', 'sin', 'sobre', 'también', 'donde', 'cuando',
    'cada', 'todos', 'todas', 'este', 'esta', 'ese', 'esa',
  ]);

  // 5. Palabras del título (excluyendo stopwords y cortas)
  const titleWords = titulo
    .toLowerCase()
    .replace(/[^a-záéíóúñ\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopwords.has(w));
  entities.push(...titleWords);

  // Deduplicar y limitar a 12 keywords máximas (Google recomienda 5-10)
  return [...new Set(entities)].slice(0, 12);
}

/**
 * Genera la meta tag "keywords" como string separado por comas.
 * Combina entidades extraídas + categoría base + tags manuales.
 */
export function generateMetaKeywords(
  titulo: string,
  contenido?: string,
  categoria?: string,
  tags?: string[]
): string {
  const base = [categoria || 'Nicaragua', 'noticias', 'actualidad'];
  if (tags && Array.isArray(tags)) {
    base.push(...tags.slice(0, 5));
  }

  const entities = extractEntities(titulo, contenido);
  base.push(...entities);

  return [...new Set(base)].join(', ');
}
