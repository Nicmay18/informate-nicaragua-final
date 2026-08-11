import DOMPurify from 'isomorphic-dompurify';
import { escapeJsonLd } from './jsonld';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'a', 'blockquote', 'figure', 'figcaption',
  'img', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'video', 'audio', 'source', 'iframe',
];

const ALLOWED_ATTR = [
  'src', 'href', 'alt', 'title', 'class', 'target', 'rel',
  'width', 'height', 'loading', 'srcset', 'sizes',
  'controls', 'preload', 'autoplay', 'muted', 'loop', 'playsinline', 'poster',
  'frameborder', 'allow', 'allowfullscreen', 'scrolling',
];

const FORBID_ATTR = ['style'];

const ALLOWED_IFRAME_HOSTS = [
  'youtube.com',
  'youtube-nocookie.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'spotify.com',
];

const isAllowedUrl = (value: string): boolean => {
  const v = value.trim().toLowerCase();
  return !v.startsWith('javascript:') && !v.startsWith('data:') && !v.startsWith('vbscript:');
};

const isAllowedIframeUrl = (url: string): boolean => {
  try {
    const normalized = /^\/\//.test(url) ? `https:${url}` : /^\w+:\/\//.test(url) ? url : `https://${url}`;
    const { hostname } = new URL(normalized);
    const clean = hostname.replace(/^www\./, '').toLowerCase();
    return ALLOWED_IFRAME_HOSTS.some(h => clean === h || clean.endsWith(`.${h}`));
  } catch {
    return false;
  }
};

DOMPurify.addHook('uponSanitizeAttribute', (currentNode, data) => {
  const { attrName, attrValue } = data;
  if (attrName === 'href' || attrName === 'src') {
    if (!isAllowedUrl(attrValue)) {
      data.keepAttr = false;
    }
  }
  if (currentNode.nodeName === 'IFRAME' && attrName === 'src' && !isAllowedIframeUrl(attrValue)) {
    data.keepAttr = false;
  }
});

DOMPurify.addHook('afterSanitizeAttributes', (currentNode) => {
  if (currentNode.nodeName === 'A') {
    const a = currentNode as unknown as Element;
    const href = a.getAttribute('href') || '';
    if (/^https?:\/\//i.test(href) && !href.startsWith('https://nicaraguainformate.com')) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  }
});

const SANITIZE_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  FORBID_ATTR,
  ADD_TAGS: ['iframe'],
  ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
  KEEP_CONTENT: true,
  WHOLE_DOCUMENT: false,
};

/**
 * Sanitizador de artículos basado en DOMPurify.
 * Lista blanca de etiquetas editoriales y atributos.
 * Los iframes se restringen a hosts conocidos y los enlaces externos se abren en pestaña segura.
 */
export function sanitizeArticleHtml(dirty: string | undefined | null): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(String(dirty), SANITIZE_CONFIG);
}

export { escapeJsonLd };
