import { escapeJsonLd } from './jsonld';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'a', 'blockquote', 'figure', 'figcaption',
  'img', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'video', 'audio', 'iframe',
];

const ALLOWED_ATTR = [
  'src', 'href', 'alt', 'title', 'class', 'id',
  'controls', 'preload', 'width', 'height',
  'frameborder', 'allow', 'allowfullscreen',
];

const FORBID_ATTR = ['style'];

const ALLOWED_IFRAME_HOSTS = [
  'youtube.com',
  'youtube-nocookie.com',
  'facebook.com',
  'twitter.com',
  'x.com',
];

const ALLOWED_TAGS_SET = new Set(ALLOWED_TAGS);
const ALLOWED_ATTR_SET = new Set(ALLOWED_ATTR);

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function isAllowedUrl(value: string): boolean {
  const v = value.trim().toLowerCase();
  return !v.startsWith('javascript:') && !v.startsWith('data:') && !v.startsWith('vbscript:');
}

function cleanTag(full: string): string {
  const closeMatch = full.match(/<\/\s*([a-z0-9]+)[^>]*>/i);
  if (closeMatch) {
    const name = closeMatch[1].toLowerCase();
    return ALLOWED_TAGS_SET.has(name) ? `</${name}>` : '';
  }

  const openMatch = full.match(/<\s*([a-z0-9]+)([\s\S]*?)\/?\s*>/i);
  if (!openMatch) return '';

  const name = openMatch[1].toLowerCase();
  if (!ALLOWED_TAGS_SET.has(name)) return '';

  const attrString = openMatch[2];
  const attrRegex = /([a-zA-Z0-9-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  const attrs: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = attrRegex.exec(attrString)) !== null) {
    const attrName = m[1].toLowerCase();
    if (!ALLOWED_ATTR_SET.has(attrName) || FORBID_ATTR.includes(attrName)) continue;

    let value = m[2] ?? m[3] ?? m[4] ?? '';

    if (attrName === 'href' || attrName === 'src') {
      if (!isAllowedUrl(value)) continue;

      if (name === 'iframe' && attrName === 'src') {
        try {
          const normalized = value.startsWith('//')
            ? `https:${value}`
            : value.startsWith('http')
              ? value
              : `https://${value}`;
          const url = new URL(normalized);
          const hostname = url.hostname.replace(/^www\./, '');
          if (!ALLOWED_IFRAME_HOSTS.includes(hostname)) continue;
        } catch {
          continue;
        }
      }
    }

    attrs.push(`${attrName}="${escapeAttr(value)}"`);
  }

  const attrStr = attrs.length ? ` ${attrs.join(' ')}` : '';
  const isSelfClose = full.trim().endsWith('/>');
  return isSelfClose ? `<${name}${attrStr} />` : `<${name}${attrStr}>`;
}

/**
 * Sanitizador ligero sin jsdom/DOMPurify para evitar errores ESM en SSR.
 * El HTML ya es saneado en el guardado; esto es una capa defensiva en render.
 */
export function sanitizeArticleHtml(dirty: string): string {
  if (!dirty) return '';

  // Eliminar bloques script/style (incluyendo contenido interno)
  let html = dirty.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

  // Limpiar etiquetas y atributos restantes
  return html.replace(/<\/?[^>]+>/g, (tag) => cleanTag(tag));
}

export { escapeJsonLd };
