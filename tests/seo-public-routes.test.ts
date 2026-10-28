// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { Noticia } from '@/lib/types';
const mocks = vi.hoisted(() => ({ news: vi.fn(), slug: vi.fn(), evergreen: vi.fn() }));
vi.mock('@/lib/data', () => ({
  getSitemapNews: mocks.news, getNewsBySlug: mocks.slug, getRelatedNews: vi.fn(async () => []),
}));
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock('@/lib/firebase-admin', () => ({ getAdminDb: () => { throw new Error('isolated test'); } }));
vi.mock('@/lib/evergreen', () => ({ getAllEvergreen: mocks.evergreen }));
vi.mock('@/lib/authors', () => ({ getAllAuthors: () => [] }));
vi.mock('@/lib/topics', () => ({ getAllTemaSlugs: () => [] }));
vi.mock('@/components/ArticlePage', () => ({ default: () => null }));
vi.mock('@/lib/nonce', () => ({ getCspNonce: async () => 'test-nonce' }));
vi.mock('@/lib/ads/server', () => ({ getAuspiciadorPublico: async () => null }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import sitemap from '@/app/sitemap';
import { GET } from '@/app/news-sitemap.xml/route';
import NewsPage, { generateMetadata } from '@/app/noticias/[slug]/page';
const params = { params: Promise.resolve({ slug: 'noticia-prueba' }) };
const valid = {
  id: 'test', slug: 'noticia-prueba', titulo: 'Información verificada de la prueba',
  contenido: '<p>Este contenido sintético solo existe en la prueba aislada de regresión.</p>',
  resumen: 'Resumen sintético para la prueba.', categoria: 'Nacionales',
  fecha: '2026-10-28T10:00:00-06:00', publicado: true, aprobadoMeni: true, estado: 'publicado',
} as Noticia;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-28T18:00:00Z'));
  mocks.news.mockResolvedValue([valid]);
  mocks.slug.mockResolvedValue(valid);
  mocks.evergreen.mockReturnValue([]);
});
afterEach(() => vi.useRealTimers());

describe('sitemaps públicos', () => {
  it.each([undefined, '', 'not-a-date', new Date('invalid')])('omite lastmod evergreen inválido: %s', async updatedDate => {
    mocks.evergreen.mockReturnValue([{ slug: 'guia-prueba', updatedDate }]);
    const item = (await sitemap()).find(x => x.url.endsWith('/guia/guia-prueba'));
    expect(item).toBeDefined();
    expect(item).not.toHaveProperty('lastModified');
  });
  it('conserva la fecha real evergreen', async () => {
    mocks.evergreen.mockReturnValue([{ slug: 'guia-prueba', updatedDate: '2026-09-01T12:00:00Z' }]);
    expect((await sitemap()).find(x => x.url.endsWith('/guia/guia-prueba'))?.lastModified)
      .toEqual(new Date('2026-09-01T12:00:00Z'));
  });
  it('cero noticias reales es XML vacío 200', async () => {
    mocks.news.mockResolvedValue([]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain('<url>');
  });
  it('fallo de datos es 503 no cacheable sin detalles internos', async () => {
    mocks.news.mockRejectedValue(new Error('sensitive internal context'));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('cdn-cache-control')).toBe('no-store');
    expect(response.headers.get('retry-after')).toBe('300');
    expect(await response.text()).not.toContain('sensitive');
  });
  it('excluye fechas inválidas, futuras y anteriores a 48h; conserva zona y escapa XML', async () => {
    mocks.news.mockResolvedValue([
      { ...valid, titulo: 'Managua & León: "información" <verificada>' },
      ...['invalid', '2026-10-28T18:00:01Z', '2026-10-26T17:59:59Z']
        .map((fecha, i) => ({ ...valid, slug: `excluida-${i}`, fecha })),
    ]);
    const xml = await (await GET()).text();
    expect(xml.match(/<url>/g)).toHaveLength(1);
    expect(xml).toContain('2026-10-28T10:00:00-06:00');
    expect(xml).toContain('&amp;');
    expect(xml).not.toContain('excluida');
  });
  it.each([
    { estado: 'borrador' }, { estado: 'archivado' }, { archived: true },
    { noindex: true }, { aprobadoMeni: false }, { publicado: false },
  ])('excluye contenido no elegible de ambos sitemaps: %j', async flags => {
    mocks.news.mockResolvedValue([{ ...valid, ...flags }]);
    expect((await sitemap()).some(x => x.url.includes('/noticias/noticia-prueba'))).toBe(false);
    expect(await (await GET()).text()).not.toContain('<url>');
  });
});

describe('metadata y página comparten regla de publicación', () => {
  it.each([
    null, { ...valid, estado: 'borrador' }, { ...valid, estado: 'archivado' },
    { ...valid, archived: true }, { ...valid, aprobadoMeni: false }, { ...valid, publicado: false },
    { ...valid, titulo: 'A' }, { ...valid, contenido: 'Corto' },
  ])('ambas rechazan el artículo no renderizable', async article => {
    mocks.slug.mockResolvedValue(article);
    await expect(generateMetadata(params)).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
    await expect(NewsPage(params)).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
  });
  it('un noindex público conserva la exclusión de indexación', async () => {
    mocks.slug.mockResolvedValue({ ...valid, noindex: true });
    expect((await generateMetadata(params)).robots).toEqual({ index: false, follow: false });
  });
  it('conserva redirección canónica 308 en ambos recorridos', async () => {
    mocks.slug.mockResolvedValue({ ...valid, slug: 'slug-canonico' });
    for (const fn of [generateMetadata, NewsPage]) {
      await expect(fn(params)).rejects.toMatchObject({ digest: 'NEXT_REDIRECT;replace;/noticias/slug-canonico;308;' });
    }
  });
  it('una avería de datos nunca se convierte en 404', async () => {
    const error = new Error('database unavailable');
    mocks.slug.mockRejectedValue(error);
    await expect(generateMetadata(params)).rejects.toBe(error);
    await expect(NewsPage(params)).rejects.toBe(error);
  });
});
