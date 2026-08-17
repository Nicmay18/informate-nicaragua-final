import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

const isAdminRequestMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  isAdminRequest: (...args: any[]) => isAdminRequestMock(...args),
  unauthorized: () => new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } }),
  badRequest: (msg: string) => new Response(JSON.stringify({ error: msg }), { status: 400, headers: { 'Content-Type': 'application/json' } }),
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(() =>
            Promise.resolve({
              docs: [
                {
                  id: 'test-1',
                  data: () => ({
                    titulo: 'Noticia de prueba',
                    contenido: '<p>Contenido de prueba</p>',
                    slug: 'noticia-prueba',
                    categoria: 'Sucesos',
                    autor: 'Test',
                    fecha: { toDate: () => new Date('2026-01-01') },
                  }),
                },
              ],
            })
          ),
        })),
      })),
    })),
  })),
}));

vi.mock('@/lib/editorial', () => ({
  evaluate: vi.fn(() => ({
    adsense: { score: 80 },
    eeat: { score: 80 },
    forense: { score: 80 },
    seo: { score: 80 },
    valorEditorial: { score: 80 },
    riesgo: { seguro: true, advertencias: [] },
  })),
  mapV4ToV3: vi.fn(() => ({
    aprobado: true,
    nivel: 'ORO',
    puntuacion: 90,
    filtros: {},
    accionesRequeridas: [],
    metadataSugerida: {},
  })),
}));

const auditorRoute = await import('@/app/api/auditor/route');
const auditorWordcountRoute = await import('@/app/api/auditor-wordcount/route');
const adminConfigRoute = await import('@/app/api/admin/config/route');

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('https://nicaraguainformate.com/api/auditor', { headers });
}

function makePostRequest(url: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('API Authorization — /api/auditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza petición sin token (401)', async () => {
    isAdminRequestMock.mockReturnValue(false);
    const req = makeRequest();
    const res = await auditorRoute.GET(req as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('rechaza petición con token incorrecto (401)', async () => {
    isAdminRequestMock.mockReturnValue(false);
    const req = makeRequest({ 'x-admin-token': 'wrong-key' });
    const res = await auditorRoute.GET(req as any);
    expect(res.status).toBe(401);
  });

  it('acepta petición con token correcto (200)', async () => {
    isAdminRequestMock.mockReturnValue(true);
    const req = makeRequest({ 'x-admin-token': 'test-secret-key' });
    const res = await auditorRoute.GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
  });
});

describe('API Authorization — /api/auditor-wordcount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza petición sin token (401)', async () => {
    isAdminRequestMock.mockReturnValue(false);
    const req = makeRequest();
    const res = await auditorWordcountRoute.GET(req as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('rechaza petición con token incorrecto (401)', async () => {
    isAdminRequestMock.mockReturnValue(false);
    const req = makeRequest({ 'x-admin-token': 'wrong-key' });
    const res = await auditorWordcountRoute.GET(req as any);
    expect(res.status).toBe(401);
  });

  it('acepta petición con token correcto (200)', async () => {
    isAdminRequestMock.mockReturnValue(true);
    const req = makeRequest({ 'x-admin-token': 'test-secret-key' });
    const res = await auditorWordcountRoute.GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

describe('API Authorization — /api/admin/config (F-004: exposición de secretos)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza GET sin token (401) — ya no expone tokens de GitHub/Telegram anónimamente', async () => {
    isAdminRequestMock.mockReturnValue(false);
    const req = new Request('https://nicaraguainformate.com/api/admin/config');
    const res = await adminConfigRoute.GET(req as any);
    expect(res.status).toBe(401);
  });

  it('rechaza POST sin token (401)', async () => {
    isAdminRequestMock.mockReturnValue(false);
    const req = makePostRequest('https://nicaraguainformate.com/api/admin/config', {
      github: { token: 'malicious' },
    });
    const res = await adminConfigRoute.POST(req as any);
    expect(res.status).toBe(401);
  });
});
