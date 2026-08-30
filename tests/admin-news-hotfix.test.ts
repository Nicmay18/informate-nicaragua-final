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
  const get = vi.fn().mockResolvedValue(snap);
  const limit = vi.fn().mockReturnThis().mockReturnValue({ get });
  const orderBy = vi.fn().mockReturnThis().mockReturnValue({ limit });
  return { collection: vi.fn().mockReturnValue({ orderBy, limit, get }) };
}

describe('admin/news hotfix — noticias recién publicadas deben aparecer', () => {
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
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });

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
