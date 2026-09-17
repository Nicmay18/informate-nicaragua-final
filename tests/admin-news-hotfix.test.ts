import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  verifyAdminToken: vi.fn(() => true),
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(),
}));

function createSnap(docs: any[]) {
  return {
    docs: docs.map((d) => ({
      id: d.id,
      data: () => d.data,
    })),
  };
}

function mockChain(snap: any) {
  // Query encadenable que soporta where/orderBy/limit/select en cualquier orden
  // (el GET ahora parte el query por tipo de `fecha` con dos where+orderBy).
  const q: any = {};
  q.where = vi.fn().mockReturnValue(q);
  q.orderBy = vi.fn().mockReturnValue(q);
  q.limit = vi.fn().mockReturnValue(q);
  q.select = vi.fn().mockReturnValue(q);
  q.get = vi.fn().mockResolvedValue(snap);
  return { collection: vi.fn().mockReturnValue(q) };
}

describe('admin/news hotfix — noticias recién publicadas deben aparecer', () => {
  it('recupera todos los tipos y fechas ausentes sin rangos ni límites que oculten documentos', async () => {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const rows = Array.from({ length: 2101 }, (_, i) => ({
      id: `nota-${String(i).padStart(4, '0')}`,
      data: {
        fecha: i % 2 ? new Date(1700000000000 + i * 1000).toISOString() : { toDate: () => new Date(1700000000000 + i * 1000) },
        publicado: true,
      },
    }));
    const docs = createSnap(rows).docs;
    docs.push({ id: 'sin-fecha', data: () => ({}) });
    const get = vi.fn().mockResolvedValue({ docs });
    vi.mocked(getAdminDb).mockReturnValue({ collection: vi.fn().mockReturnValue({ get }) } as any);
    const { GET } = await import('@/app/api/admin/news/route');
    const { NextRequest } = await import('next/server');
    const res = await GET(new NextRequest('http://localhost/api/admin/news'));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.news).toHaveLength(2102);
    expect(json.news.map((n: any) => n.id)).toEqual([...rows].reverse().map(n => n.id).concat('sin-fecha'));
    expect(json.news.at(-1).fecha).toBe('');
    expect(get).toHaveBeenCalledTimes(1);
  }, 60000);

  it('usa la primera fecha canónica válida y no mueve una edición por dateModified', async () => {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const docs = createSnap([
      { id: 'a', data: { publishedAt: 'inválida', fechaPublicacion: '2026-09-17T10:00:00Z', fecha: null } },
      { id: 'b', data: { fecha: '2026-09-16T10:00:00Z', dateModified: '2026-09-18T10:00:00Z' } },
      { id: 'c', data: { fecha: null } },
    ]).docs;
    vi.mocked(getAdminDb).mockReturnValue({ collection: () => ({ get: async () => ({ docs }) }) } as any);
    const { GET } = await import('@/app/api/admin/news/route');
    const { NextRequest } = await import('next/server');
    const json = await (await GET(new NextRequest('http://localhost/api/admin/news'))).json();
    expect(json.news.map((n: any) => n.id)).toEqual(['a', 'b', 'c']);
    expect(json.news[0].fecha).toBe('2026-09-17T10:00:00.000Z');
  });

  it('un fallo de lectura no se convierte en una lista parcial exitosa', async () => {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    vi.mocked(getAdminDb).mockReturnValue({ collection: () => ({ get: async () => { throw new Error('lectura fallida'); } }) } as any);
    const { GET } = await import('@/app/api/admin/news/route');
    const { NextRequest } = await import('next/server');
    const res = await GET(new NextRequest('http://localhost/api/admin/news'));
    expect(res.status).toBe(500);
    expect((await res.json()).success).toBe(false);
  });
  it('Caso A: noticia publicada nueva aparece en /api/admin/news', async () => {
    const { getAdminDb: mockGetAdminDb } = await import('@/lib/firebase-admin');
    mockGetAdminDb.mockReturnValue(mockChain(createSnap([
      { id: 'nueva1', data: { slug: 'nueva-1', titulo: 'Nueva 1', estado: 'publicado', publicado: true, categoria: 'Sucesos', vistas: 0, fecha: { toDate: () => new Date('2026-08-30T03:25:00Z') } } },
      { id: 'antigua1', data: { slug: 'antigua-1', titulo: 'Antigua 1', estado: 'publicado', publicado: true, categoria: 'Nacionales', vistas: 100, fecha: { toDate: () => new Date('2026-08-25T10:00:00Z') } } },
    ])));

    const { GET } = await import('@/app/api/admin/news/route');
    const { NextRequest } = await import('next/server');
    const res = await GET(new NextRequest('http://localhost/api/admin/news'));
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.news.some((n: any) => n.id === 'nueva1' && n.estado === 'publicado')).toBe(true);
    // La nota más reciente debe ir PRIMERO aunque comparta pool con notas legacy
    expect(json.news[0].id).toBe('nueva1');
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  }, 60000);

  it('Caso B: noticia publicada con vistas = 0 sigue apareciendo', async () => {
    const { getAdminDb: mockGetAdminDb } = await import('@/lib/firebase-admin');
    mockGetAdminDb.mockReturnValue(mockChain(createSnap([
      { id: 'sinvistas', data: { slug: 'sin-vistas', titulo: 'Sin Vistas', estado: 'publicado', publicado: true, categoria: 'Sucesos', vistas: 0 } },
    ])));

    const { GET } = await import('@/app/api/admin/news/route');
    const { NextRequest } = await import('next/server');
    const res = await GET(new NextRequest('http://localhost/api/admin/news'));
    const json = await res.json();

    expect(json.news).toHaveLength(1);
    expect(json.news[0].estado).toBe('publicado');
    expect(json.news[0].vistas).toBe(0);
  });

  it('Caso C: noticia borrador no cuenta como activa', async () => {
    const { getAdminDb: mockGetAdminDb } = await import('@/lib/firebase-admin');
    mockGetAdminDb.mockReturnValue(mockChain(createSnap([
      { id: 'borrador', data: { slug: 'borrador', titulo: 'Borrador', publicado: false, categoria: 'Tecnología', vistas: 0 } },
      { id: 'publicada', data: { slug: 'publicada', titulo: 'Publicada', publicado: true, categoria: 'Nacionales', vistas: 5 } },
    ])));

    const { GET } = await import('@/app/api/admin/news/route');
    const { NextRequest } = await import('next/server');
    const res = await GET(new NextRequest('http://localhost/api/admin/news'));
    const json = await res.json();

    const borrador = json.news.find((n: any) => n.id === 'borrador');
    const publicada = json.news.find((n: any) => n.id === 'publicada');
    expect(borrador.estado).toBe('borrador');
    expect(publicada.estado).toBe('publicado');
  });

  it('Caso D: noticia publicada antigua sigue apareciendo', async () => {
    const { getAdminDb: mockGetAdminDb } = await import('@/lib/firebase-admin');
    mockGetAdminDb.mockReturnValue(mockChain(createSnap([
      { id: 'antigua', data: { slug: 'antigua', titulo: 'Antigua', publicado: true, categoria: 'Sucesos', vistas: 42, fecha: '2025-01-01T00:00:00Z' } },
    ])));

    const { GET } = await import('@/app/api/admin/news/route');
    const { NextRequest } = await import('next/server');
    const res = await GET(new NextRequest('http://localhost/api/admin/news'));
    const json = await res.json();

    expect(json.news).toHaveLength(1);
    expect(json.news[0].estado).toBe('publicado');
  });

  it('Caso F: /api/admin/news no inventa tráfico ni modifica vistas', async () => {
    const { getAdminDb: mockGetAdminDb } = await import('@/lib/firebase-admin');
    mockGetAdminDb.mockReturnValue(mockChain(createSnap([
      { id: 'nueva-sin-trafico', data: { slug: 'nueva-sin-trafico', titulo: 'Nueva sin tráfico', estado: 'publicado', publicado: true, categoria: 'Espectáculos', vistas: 0 } },
    ])));

    const { GET } = await import('@/app/api/admin/news/route');
    const { NextRequest } = await import('next/server');
    const res = await GET(new NextRequest('http://localhost/api/admin/news'));
    const json = await res.json();

    expect(json.news[0].vistas).toBe(0);
    expect(json.news[0].estado).toBe('publicado');
  });
});
