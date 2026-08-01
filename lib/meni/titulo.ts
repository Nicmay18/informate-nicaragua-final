/**
 * Normalización y validación de títulos para Nicaragua Informate.
 *
 * Previene que palabras sueltas, categorías truncadas o etiquetas
 * (como "Fe") sean añadidas al final del título.
 */

// Palabras sueltas que no deben aparecer como sufijo de un titular.
// "Fe" es el caso reportado; se puede ampliar la lista fácilmente.
const SUFIJOS_INVALIDOS = ['Fe', 'Fer'];

// Sufijos que son nombres de categorías del medio y no deben ir en el título.
const CATEGORIAS_REPETIDAS = [
  'Sucesos',
  'Nacionales',
  'Internacionales',
  'Deportes',
  'Espectáculos',
  'Tecnología',
  'Economía',
  'Cultura',
  'Política',
  'Salud',
  'Educación',
  'General',
];

function buildRegexForWords(words: string[]): RegExp {
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(`(\\s+[-–—]\\s*|\\s*[-–—]\\s+)(?:${escaped})$`, 'i');
}

const SUFIJOS_INVALIDOS_RE = buildRegexForWords(SUFIJOS_INVALIDOS);
const CATEGORIAS_REPETIDAS_RE = buildRegexForWords(CATEGORIAS_REPETIDAS);

/**
 * Quita del final del título:
 * - Sufijos inválidos (p. ej. " - Fe", " – Fe", " — Fe").
 * - Categorías añadidas como apéndice.
 * - Espacios múltiples y puntuación final redundante.
 */
export function normalizarTitulo(titulo: string): string {
  if (!titulo) return '';
  let limpio = titulo
    .replace(SUFIJOS_INVALIDOS_RE, '')
    .replace(CATEGORIAS_REPETIDAS_RE, '')
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '')
    .trim();

  // Si tras eliminar un sufijo quedó un guión al final, lo quitamos.
  limpio = limpio.replace(/\s*[-–—]\s*$/, '').trim();

  return limpio;
}

/**
 * Devuelve true si el título aún conserva un sufijo inválido o una
 * categoría añadida al final.
 */
export function tieneSufijoInvalido(titulo: string): boolean {
  if (!titulo) return false;
  return SUFIJOS_INVALIDOS_RE.test(titulo) || CATEGORIAS_REPETIDAS_RE.test(titulo);
}

/**
 * Devuelve un mensaje de validación. Útil para mostrar advertencias
 * en el editor antes de publicar.
 */
export function validarTitulo(titulo: string): { ok: boolean; mensaje?: string } {
  const limpio = normalizarTitulo(titulo);
  if (limpio !== titulo.trim()) {
    return { ok: false, mensaje: 'El título contiene palabras añadidas al final que no aportan valor (categoría, sufijo o etiqueta truncada).' };
  }
  return { ok: true };
}
