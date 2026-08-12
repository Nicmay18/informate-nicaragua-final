import { escapeJsonLd } from './jsonld';

// Server-safe HTML sanitizer. Replaces isomorphic-dompurify because it tries
// to read browser/default-stylesheet.css via jsdom at runtime, which fails in
// Vercel's serverless environment with ENOENT.

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'a', 'blockquote', 'figure', 'figcaption',
  'img', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'video', 'audio', 'source', 'iframe',
]);

const SELF_CLOSING = new Set(['br', 'img', 'source', 'iframe']);

const ALLOWED_ATTR = new Set([
  'src', 'href', 'alt', 'title', 'class', 'target', 'rel',
  'width', 'height', 'loading', 'srcset', 'sizes',
  'controls', 'preload', 'autoplay', 'muted', 'loop', 'playsinline', 'poster',
  'frameborder', 'allow', 'allowfullscreen', 'scrolling',
]);

const FORBID_ATTR = new Set(['style']);

const ALLOWED_IFRAME_HOSTS = [
  'youtube.com',
  'youtube-nocookie.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'spotify.com',
];

const HTML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

function decodeHtmlEntities(input: string): string {
  return input.replace(/&(?:amp|lt|gt|quot|#39|nbsp|#[0-9]+|#x[0-9a-fA-F]+);/g, (entity) => {
    if (entity in HTML_ENTITY_MAP) return HTML_ENTITY_MAP[entity];
    const numMatch = entity.match(/^&#(\d+);$/);
    if (numMatch) return String.fromCharCode(parseInt(numMatch[1], 10));
    const hexMatch = entity.match(/^#x([0-9a-fA-F]+);$/);
    if (hexMatch) return String.fromCharCode(parseInt(hexMatch[1], 16));
    return entity;
  });
}

function encodeHtmlEntities(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isAllowedUrl(value: string): boolean {
  const v = value.trim().toLowerCase();
  return !v.startsWith('javascript:') && !v.startsWith('data:') && !v.startsWith('vbscript:');
}

function isAllowedIframeUrl(url: string): boolean {
  try {
    const normalized = /^\/\//.test(url) ? `https:${url}` : /^\w+:\/\//.test(url) ? url : `https://${url}`;
    const { hostname } = new URL(normalized);
    const clean = hostname.replace(/^www\./, '').toLowerCase();
    return ALLOWED_IFRAME_HOSTS.some(h => clean === h || clean.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function parseAttrs(attrString: string): Map<string, string> {
  const attrs = new Map<string, string>();
  const regex = /([a-zA-Z][a-zA-Z0-9\-:]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(attrString)) !== null) {
    const name = m[1].toLowerCase().trim();
    const value = m[2] ?? m[3] ?? m[4] ?? '';
    attrs.set(name, value);
  }
  return attrs;
}

function buildAttrs(tag: string, attrs: Map<string, string>): string {
  const parts: string[] = [];
  const href = attrs.get('href');

  for (const [name, value] of attrs) {
    if (FORBID_ATTR.has(name)) continue;
    if (!ALLOWED_ATTR.has(name)) continue;

    if ((name === 'href' || name === 'src') && !isAllowedUrl(value)) continue;
    if (tag === 'iframe' && name === 'src' && !isAllowedIframeUrl(value)) continue;

    parts.push(`${name}="${encodeHtmlEntities(value)}"`);
  }

  if (tag === 'a' && href && isAllowedUrl(href)) {
    const abs = href.trim();
    if (/^https?:\/\//i.test(abs) && !abs.startsWith('https://nicaraguainformate.com')) {
      parts.push('target="_blank" rel="noopener noreferrer nofollow"');
    }
  }

  return parts.length ? ' ' + parts.join(' ') : '';
}

/**
 * Sanitizador de artículos basado en whitelist.
 * Lista blanca de etiquetas editoriales y atributos.
 * Los iframes se restringen a hosts conocidos y los enlaces externos se abren en pestaña segura.
 * No utiliza DOM ni lectura de archivos, es seguro para entornos serverless.
 */
export function sanitizeArticleHtml(dirty: string | undefined | null): string {
  if (!dirty) return '';

  const input = String(dirty);
  const out: string[] = [];
  const tagStack: string[] = [];
  let i = 0;

  while (i < input.length) {
    const lt = input.indexOf('<', i);
    if (lt === -1) {
      out.push(decodeHtmlEntities(input.slice(i)));
      break;
    }

    if (lt > i) {
      out.push(decodeHtmlEntities(input.slice(i, lt)));
    }

    const gt = input.indexOf('>', lt);
    if (gt === -1) {
      out.push(decodeHtmlEntities(input.slice(lt)));
      break;
    }

    const raw = input.slice(lt + 1, gt);
    if (raw.startsWith('!')) {
      i = gt + 1;
      continue;
    }

    const isEnd = raw[0] === '/';
    const token = isEnd ? raw.slice(1) : raw;
    const spaceIdx = token.search(/\s/);
    const tagName = (spaceIdx === -1 ? token : token.slice(0, spaceIdx)).toLowerCase().trim();
    const attrString = spaceIdx === -1 ? '' : token.slice(spaceIdx + 1);

    if (isEnd) {
      if (ALLOWED_TAGS.has(tagName) && !SELF_CLOSING.has(tagName)) {
        const pos = tagStack.lastIndexOf(tagName);
        if (pos !== -1) {
          while (tagStack.length > pos) {
            const t = tagStack.pop()!;
            if (ALLOWED_TAGS.has(t)) out.push(`</${t}>`);
          }
        }
      }
      i = gt + 1;
      continue;
    }

    if (!ALLOWED_TAGS.has(tagName)) {
      i = gt + 1;
      continue;
    }

    const attrs = parseAttrs(attrString);

    if (tagName === 'iframe') {
      const src = attrs.get('src');
      if (!src || !isAllowedIframeUrl(src)) {
        i = gt + 1;
        continue;
      }
    }

    const attrStringOut = buildAttrs(tagName, attrs);
    if (SELF_CLOSING.has(tagName)) {
      out.push(`<${tagName}${attrStringOut} />`);
    } else {
      out.push(`<${tagName}${attrStringOut}>`);
      tagStack.push(tagName);
    }

    i = gt + 1;
  }

  while (tagStack.length) {
    const t = tagStack.pop()!;
    if (ALLOWED_TAGS.has(t)) out.push(`</${t}>`);
  }

  return out.join('');
}

export { escapeJsonLd };
