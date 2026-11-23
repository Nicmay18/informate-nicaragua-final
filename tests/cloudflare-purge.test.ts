import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(async () => ({ exists: false })),
        set: vi.fn(async () => ({})),
      })),
    })),
  })),
}));

import { buildPurgeUrls } from '@/lib/cloudflare-purge';

const ORIGIN = 'https://nicaraguainformate.com';

describe('buildPurgeUrls — matriz de invalidación Cloudflare', () => {
  it('publicar incluye superficies globales + artículo + categoría + temas + feeds', () => {
    const urls = buildPurgeUrls({
      reason: 'publish',
      slug: 'nueva-noticia',
      categoria: 'Sucesos',
      temas: ['policia-nacional'],
      autorNombre: 'Keyling Elieth Rivera Muñoz',
    });
    const set = new Set(urls);
    // Globales siempre presentes
    for (const p of ['/', '/noticias', '/feed.xml', '/feed.json', '/rss', '/rss.xml',
      '/news-sitemap.xml', '/sitemap.xml', '/mapa-del-sitio']) {
      expect(set.has(`${ORIGIN}${p}`)).toBe(true);
    }
    expect(set.has(`${ORIGIN}/noticias/nueva-noticia`)).toBe(true);
    expect(set.has(`${ORIGIN}/categoria/sucesos`)).toBe(true);
    expect(set.has(`${ORIGIN}/tema/policia-nacional`)).toBe(true);
    expect(set.has(`${ORIGIN}/autor/keyling-rivera`)).toBe(true);
    // NO incluye entidades (leen kb_*, no noticias)
    expect(urls.some((u) => u.includes('/entidad/'))).toBe(false);
    // NO incluye /buscar (bypass) ni /api ni /admin
    expect(urls.some((u) => u.includes('/buscar') || u.includes('/api/') || u.includes('/admin'))).toBe(false);
  });

  it('edición con cambio de slug y categoría purga ambas versiones', () => {
    const urls = buildPurgeUrls({
      reason: 'edit',
      slug: 'slug-nuevo',
      slugAnterior: 'slug-viejo',
      categoria: 'Deportes',
      categoriaAnterior: 'Sucesos',
      temas: ['deportes-nicaragua'],
      temasAnteriores: ['economia-nicaragua'],
    });
    const set = new Set(urls);
    expect(set.has(`${ORIGIN}/noticias/slug-nuevo`)).toBe(true);
    expect(set.has(`${ORIGIN}/noticias/slug-viejo`)).toBe(true);
    expect(set.has(`${ORIGIN}/categoria/deportes`)).toBe(true);
    expect(set.has(`${ORIGIN}/categoria/sucesos`)).toBe(true);
    expect(set.has(`${ORIGIN}/tema/deportes-nicaragua`)).toBe(true);
    expect(set.has(`${ORIGIN}/tema/economia-nicaragua`)).toBe(true);
  });

  it('eliminar/despublicar purga slug + categoría + globales', () => {
    const urls = buildPurgeUrls({
      reason: 'delete',
      slug: 'noticia-borrada',
      categoria: 'Nacionales',
    });
    const set = new Set(urls);
    expect(set.has(`${ORIGIN}/noticias/noticia-borrada`)).toBe(true);
    expect(set.has(`${ORIGIN}/categoria/nacionales`)).toBe(true);
    expect(set.has(`${ORIGIN}/`)).toBe(true);
  });

  it('respeta el límite de 30 URLs y deduplica', () => {
    const urls = buildPurgeUrls({
      reason: 'edit',
      slug: 'x',
      categoria: 'Sucesos',
      categoriaAnterior: 'Sucesos', // misma → dedup
      temas: Array.from({ length: 20 }, (_, i) => `tema-${i}`),
    });
    expect(new Set(urls).size).toBe(urls.length); // sin duplicados
    expect(urls.length).toBeLessThanOrEqual(30);
    // categoría duplicada colapsa a una sola URL
    expect(urls.filter((u) => u === `${ORIGIN}/categoria/sucesos`).length).toBe(1);
  });

  it('autorNombre no resoluble omite /autor sin romper', () => {
    const urls = buildPurgeUrls({ reason: 'publish', slug: 's', autorNombre: 'Desconocido XYZ' });
    expect(urls.some((u) => u.includes('/autor/'))).toBe(false);
  });
});
