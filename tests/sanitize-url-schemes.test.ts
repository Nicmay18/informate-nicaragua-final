import { describe, it, expect } from 'vitest';
import { sanitizeArticleHtml } from '@/lib/sanitize';

describe('sanitize — esquemas de URL peligrosos (SEC-05)', () => {
  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    '  javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'java\rscript:alert(1)',
    'j a v a s c r i p t:alert(1)',
    '\x01javascript:alert(1)',
    'javascript%3aalert(1)',
    '%6aavascript:alert(1)',
    'vbscript:msgbox(1)',
    'vb\tscript:msgbox(1)',
    'data:text/html;base64,PGI+',
  ])('elimina href con esquema peligroso: %j', (href) => {
    const out = sanitizeArticleHtml(`<a href="${href}">x</a>`);
    expect(out).not.toContain('href=');
  });

  it.each([
    'https://ejemplo.com/nota',
    'http://ejemplo.com/a?b=1&c=2',
    '/noticias/slug-interno',
    '#ancla',
    'mailto:editor@ejemplo.com',
  ])('conserva href legítimo: %j', (href) => {
    const out = sanitizeArticleHtml(`<a href="${href}">x</a>`);
    expect(out).toContain('href=');
  });
});
