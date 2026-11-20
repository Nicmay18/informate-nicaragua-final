/**
 * HTML → texto visible — utilidad canónica del proyecto.
 * ======================================================
 * Única implementación para convertir HTML editorial a texto plano.
 * Reglas:
 *  - Elimina comentarios, <script>, <style>, <noscript> y <template>:
 *    su contenido NO es texto visible para el lector.
 *  - Convierte cierres de bloque y <br> en saltos de línea.
 *  - Decodifica entidades HTML (&amp;, &oacute;, &#233;, &nbsp;…) antes
 *    de contar o comparar — un "&oacute;" no debe pegar palabras ni
 *    ocultar acentos a las regex editoriales.
 *  - htmlToVisibleText conserva bloques separados por línea en blanco;
 *    htmlToPlainText aplana todo a una sola línea para regex/keywords.
 */

const NON_CONTENT_RE =
  /<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>|<noscript\b[\s\S]*?<\/noscript\s*>|<template\b[\s\S]*?<\/template\s*>/gi;

// Etiquetas de bloque (apertura o cierre) y <br>/<hr> → salto de línea.
const BLOCK_TAG_RE =
  /<\/?(?:p|div|section|article|header|footer|aside|main|nav|figure|figcaption|blockquote|ul|ol|li|dl|dt|dd|table|thead|tbody|tfoot|tr|td|th|h[1-6]|pre|form|fieldset|details|summary|address|br|hr)\b[^>]*>/gi;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  copy: '©', reg: '®', trade: '™', hellip: '…', mdash: '—', ndash: '–',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»',
  bull: '•', middot: '·', deg: '°', plusmn: '±', times: '×', divide: '÷',
  micro: 'µ', para: '¶', sect: '§', shy: '\u00AD',
  iexcl: '¡', iquest: '¿',
  agrave: 'à', aacute: 'á', acirc: 'â', atilde: 'ã', auml: 'ä', aring: 'å', aelig: 'æ', ccedil: 'ç',
  egrave: 'è', eacute: 'é', ecirc: 'ê', euml: 'ë',
  igrave: 'ì', iacute: 'í', icirc: 'î', iuml: 'ï',
  eth: 'ð', ntilde: 'ñ', ograve: 'ò', oacute: 'ó', ocirc: 'ô', otilde: 'õ', ouml: 'ö', oslash: 'ø',
  ugrave: 'ù', uacute: 'ú', ucirc: 'û', uuml: 'ü', yacute: 'ý', yuml: 'ÿ', szlig: 'ß',
  Agrave: 'À', Aacute: 'Á', Acirc: 'Â', Atilde: 'Ã', Auml: 'Ä', Aring: 'Å', AElig: 'Æ', Ccedil: 'Ç',
  Egrave: 'È', Eacute: 'É', Ecirc: 'Ê', Euml: 'Ë',
  Igrave: 'Ì', Iacute: 'Í', Icirc: 'Î', Iuml: 'Ï', ETH: 'Ð', Ntilde: 'Ñ',
  Ograve: 'Ò', Oacute: 'Ó', Ocirc: 'Ô', Otilde: 'Õ', Ouml: 'Ö', Oslash: 'Ø',
  Ugrave: 'Ù', Uacute: 'Ú', Ucirc: 'Û', Uuml: 'Ü', Yacute: 'Ý', THORN: 'Þ',
};

export function decodeHtmlEntities(text: string): string {
  if (!text || text.indexOf('&') === -1) return text;
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, entity: string) => {
    if (entity.charCodeAt(0) === 35 /* # */) {
      const isHex = entity[1] === 'x' || entity[1] === 'X';
      const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    const named = NAMED_ENTITIES[entity];
    return named !== undefined ? named : match;
  });
}

/** Quita todo lo que no es texto visible (comentarios, scripts, estilos). */
export function stripNonContent(html: string): string {
  return (html || '').replace(NON_CONTENT_RE, ' ');
}

/**
 * HTML → texto visible conservando bloques.
 * Cada bloque (<p>, <h2>, <li>, <br>…) produce una línea separada por
 * línea en blanco. Devuelve '' para entrada vacía.
 */
export function htmlToVisibleText(html: string): string {
  if (!html) return '';
  let s = stripNonContent(html);
  // Etiquetas de bloque → salto de línea (antes de quitar las inline).
  s = s.replace(BLOCK_TAG_RE, '\n');
  // Solo tags reales: letra o '/' tras '<'. Un "< pequeños >" en texto
  // plano (comparación) NO es una etiqueta y debe conservarse.
  s = s.replace(/<\/?[a-zA-Z][^>]*>/g, ' ');
  s = s.replace(/<![^>]*>/g, ' ');
  s = decodeHtmlEntities(s);
  return s
    .split('\n')
    .map((line) => line.replace(/[^\S\n]+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n\n');
}

/** Versión plana: una sola línea, espacios colapsados. Para regex y keywords. */
export function htmlToPlainText(html: string): string {
  return htmlToVisibleText(html).replace(/\s+/g, ' ').trim();
}

/** Conteo canónico de palabras sobre texto visible. */
export function countVisibleWords(html: string): number {
  const text = htmlToVisibleText(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Textos internos de elementos HTML con etiqueta de cierre pareada.
 * Solo cuenta elementos con contenido visible no vacío; ignora
 * comentarios/scripts (el contenido eliminado no genera falsos positivos).
 */
export function extractElementTexts(html: string, tag: string): string[] {
  if (!html || !tag) return [];
  const clean = stripNonContent(html);
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}\\s*>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean)) !== null) {
    const inner = htmlToVisibleText(m[1]).replace(/\s+/g, ' ').trim();
    if (inner) out.push(inner);
  }
  return out;
}

export function countElements(html: string, tag: string): number {
  return extractElementTexts(html, tag).length;
}

/** Encabezados <hN> con contenido real. level: 1-6 (por defecto 2). */
export function countHeadings(html: string, level = 2): number {
  return countElements(html, `h${level}`);
}

/** Textos de los encabezados <hN> (útil para análisis de estructura). */
export function extractHeadings(html: string, level = 2): string[] {
  return extractElementTexts(html, `h${level}`);
}

/** Negritas reales: <strong> y <b> con contenido visible. */
export function countStrongEmphasis(html: string): number {
  return countElements(html, 'strong') + countElements(html, 'b');
}

/** Citas estructuradas <blockquote> con contenido. */
export function countBlockquotes(html: string): number {
  return countElements(html, 'blockquote');
}

/** Párrafos <p> con contenido visible suficiente (minChars). */
export function countParagraphs(html: string, minChars = 1): number {
  return extractElementTexts(html, 'p').filter((t) => t.length >= minChars).length;
}
