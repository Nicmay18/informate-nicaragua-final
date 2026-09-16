import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  verifyAdminToken: vi.fn(() => true),
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(),
}));

describe('admin/news estado fallback', () => {
  it('devuelve estado publicado/borrador correctamente', async () => {
    const { getAdminDb: mockGetAdminDb } = await import('@/lib/firebase-admin');
    const q: any = {};
    q.where = vi.fn().mockReturnValue(q);
    q.orderBy = vi.fn().mockReturnValue(q);
    q.limit = vi.fn().mockReturnValue(q);
    q.select = vi.fn().mockReturnValue(q);
    q.get = vi.fn().mockResolvedValue({
      docs: [
        {
          id: 'a',
          data: () => ({ slug: 'a', titulo: 'A', publicado: true, estado: 'publicado', categoria: 'Nacionales' }),
        },
        {
          id: 'b',
          data: () => ({ slug: 'b', titulo: 'B', publicado: false, categoria: 'Sucesos' }),
        },
        {
          id: 'c',
          data: () => ({ slug: 'c', titulo: 'C', categoria: 'Tecnología' }),
        },
      ],
    });
    mockGetAdminDb.mockReturnValue({ collection: vi.fn().mockReturnValue(q) });

    const { GET } = await import('@/app/api/admin/news/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/admin/news');
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.news[0].estado).toBe('publicado');
    expect(json.news[1].estado).toBe('borrador');
    expect(json.news[2].estado).toBe('publicado');
  }, 60000);
});
