import DOMPurify from 'isomorphic-dompurify';

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

DOMPurify.addHook('uponSanitizeAttribute', (node: any, data: any) => {
  if (node && node.nodeName === 'IFRAME' && data.attrName === 'src') {
    try {
      const url = new URL(data.attrValue);
      const hostname = url.hostname.replace(/^www\./, '');
      if (!ALLOWED_IFRAME_HOSTS.includes(hostname)) {
        data.attrValue = '';
      }
    } catch {
      data.attrValue = '';
    }
  }
});

export function sanitizeArticleHtml(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_ATTR,
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
  });
}

export function escapeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
