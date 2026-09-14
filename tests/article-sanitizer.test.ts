import { describe, it, expect } from 'vitest';
import { stripAICitationMarkers, cleanArticleBody } from '@/lib/sanitize';
import { isToxicSlug } from '@/lib/seo-toxic';

describe('article sanitizer', () => {
  it('removes :contentReference[oaicite:N]{index=N} markers', () => {
    const dirty =
      'Apple presentó el iPhone Duo.:contentReference[oaicite:1]{index=1} Más detalles.';
    const clean = stripAICitationMarkers(dirty);
    expect(clean).not.toContain('contentReference');
    expect(clean).not.toContain('oaicite');
    expect(clean).toBe('Apple presentó el iPhone Duo. Más detalles.');
  });

  it('removes multiple citation markers', () => {
    const dirty =
      'Texto.:contentReference[oaicite:2]{index=2} Otro.:contentReference[oaicite:3]{index=3} Fin.';
    const clean = stripAICitationMarkers(dirty);
    expect(clean).not.toContain('contentReference');
    expect(clean).toBe('Texto. Otro. Fin.');
  });

  it('cleanArticleBody is an alias that removes markers', () => {
    const dirty = 'Hola :contentReference[oaicite:0]{index=0} mundo';
    expect(cleanArticleBody(dirty)).toBe('Hola mundo');
  });
});

describe('isToxicSlug', () => {
  it('blocks the fabricated iPhone Duo article', () => {
    expect(isToxicSlug('apple-presenta-el-iphone-duo-su-primer-modelo-plegable')).toBe(true);
    expect(isToxicSlug('noticia-normal')).toBe(false);
    expect(isToxicSlug('')).toBe(false);
  });
});
