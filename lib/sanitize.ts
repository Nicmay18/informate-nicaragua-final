/**
 * Sanitización nativa de HTML para contenido periodístico.
 * Whitelist estricta de etiquetas y atributos seguros.
 * Elimina scripts, event handlers JS y atributos peligrosos.
 *
 * Alternativa ligera a DOMPurify (evita dependencia externa).
 * Si en el futuro se necesita soporte completo de SVG/math, migrar a isomorphic-dompurify.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'a', 'blockquote', 'figure', 'figcaption',
  'img', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'caption', 'col', 'colgroup', 'hr', 'sub', 'sup',
]);

const ALLOWED_ATTRS = new Set([
  'href', 'title', 'alt', 'src', 'class', 'id', 'target',
  'width', 'height', 'style', 'itemprop', 'datetime',
  'rel', 'download', 'lang', 'dir', 'role', 'aria-label',
]);

const FORBIDDEN_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<script[^>]*\/>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*\/?>/gi,
  /<form[^>]*>.*?<\/form>/gi,
  /<input[^>]*\/?>/gi,
  /<textarea[^>]*>.*?<\/textarea>/gi,
  /javascript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi,
];

/**
 * Escapa caracteres HTML especiales en texto plano.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Limpia atributos de una etiqueta, permitiendo solo la whitelist.
 */
function cleanAttributes(_tagName: string, attrString: string): string {
  if (!attrString.trim()) return '';

  const attrs: string[] = [];
  // Parseo simple de atributos key="value" o key='value' o key
  const regex = /(\w+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(attrString)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';

    if (!ALLOWED_ATTRS.has(name)) continue;

    // Bloquear javascript: en href/src
    if ((name === 'href' || name === 'src') && /^javascript:/i.test(value)) {
      continue;
    }

    // Bloquear data: en src (vectores de XSS via SVG)
    if (name === 'src' && /^data:/i.test(value)) {
      continue;
    }

    attrs.push(`${name}="${escapeHtml(value)}"`);
  }

  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

/**
 * Sanitiza HTML de artículos provenientes de Firestore/CMS.
 * Solo permite etiquetas periodísticas seguras. Elimina todo lo demás.
 */
export function sanitizeArticleHtml(dirty: string): string {
  if (!dirty) return '';

  // Paso 1: eliminar patrones prohibidos (scripts, iframes, event handlers)
  let cleaned = dirty;
  for (const pattern of FORBIDDEN_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Paso 2: parsear y limpiar etiquetas individualmente
  cleaned = cleaned.replace(/<(\/?)([\w-]+)([^>]*)>/g, (_match, slash, tagName, attrString) => {
    const lowerTag = tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(lowerTag)) {
      // Etiqueta no permitida: eliminar completamente (incluyendo contenido para etiquetas peligrosas)
      return '';
    }

    const attrs = cleanAttributes(lowerTag, attrString);
    return `<${slash}${lowerTag}${attrs}>`;
  });

  // Paso 3: eliminar entidades numéricas potencialmente peligrosas
  cleaned = cleaned.replace(/&#x0*([0-9a-f]+);?/gi, (_match, hex) => {
    const code = parseInt(hex, 16);
    // Eliminar caracteres de control (0-31 excepto tab, newline, carriage return)
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) return '';
    return _match;
  });

  // Paso 4: normalizar espacios múltiples
  return cleaned.replace(/\s{3,}/g, '  ').trim();
}

/**
 * Escapa JSON-LD para inyección segura en <script type="application/ld+json">.
 * Reemplaza '</' por '\u003c/' para prevenir cierre prematuro de script.
 */
export function escapeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
