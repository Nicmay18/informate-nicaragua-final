import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/data', () => ({
  getCategoryPaginated: vi.fn(async () => [
    {
      id: 'a1',
      slug: 'nota-prueba',
      titulo: 'Nota de prueba',
      contenido: '<p>Contenido</p>',
      resumen: 'Resumen',
      fecha: '2026-09-23T12:00:00.000Z',
    },
  ]),
  getNewsPaginated: vi.fn(async () => []),
}));

vi.mock('@/lib/constants', () => ({
  CATEGORY_MAP: {
    sucesos: { name: 'Sucesos', slug: 'sucesos' },
  },
}));

describe('/api/list-all runtime regression', () => {
  it('usa la capa canónica de noticias para una categoría', async () => {
    const { GET } = await import('@/app/api/list-all/route');
    const res = await GET(
      new Request('https://nicaraguainformate.com/api/list-all?categoria=sucesos&limit=5'),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.articles[0].slug).toBe('nota-prueba');
  });

  it('rechaza una categoría desconocida sin tocar Firestore', async () => {
    const { GET } = await import('@/app/api/list-all/route');
    const res = await GET(
      new Request('https://nicaraguainformate.com/api/list-all?categoria=no-existe&limit=5'),
    );
    expect(res.status).toBe(400);
  });
});

describe('entity page loader runtime regression', () => {
  it('no llama getAll() cuando la entidad no tiene relaciones', async () => {
    const getAll = vi.fn(async (...refs: unknown[]) => {
      if (refs.length === 0) throw new Error('getAll called without document refs');
      return [];
    });

    const entityDoc = {
      id: 'entity-1',
      data: () => ({ id: 'entity-1', slug: 'entidad-prueba', name: 'Entidad prueba' }),
    };

    const query = {
      where: vi.fn(() => query),
      limit: vi.fn(() => query),
      get: vi.fn(async () => ({ empty: false, docs: [entityDoc] })),
    };

    const db = {
      collection: vi.fn((name: string) => {
        if (name === 'kb_entities') {
          return { where: () => query };
        }
        return { where: () => query };
      }),
      getAll,
    } as any;

    const { loadEntityPage } = await import('@/lib/meni/knowledge-base/entity-page');
    const result = await loadEntityPage(db, 'entidad-prueba');

    expect(result).not.toBeNull();
    expect(result?.relatedEntities).toEqual([]);
    expect(getAll).not.toHaveBeenCalled();
  });
});
