import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/firebase-admin', () => ({ getAdminDb: vi.fn(() => ({})) }));
vi.mock('@/lib/supervisor/cost-guard', () => ({ canCallLLM: vi.fn(), recordCall: vi.fn() }));

const article = {
  titulo: 'Hombre hallado sin vida en Masaya', slug: 'hombre-masaya', categoria: 'Sucesos',
  resumen: 'El hombre fue encontrado en la carretera Masaya-Catarina.',
  contenido: '<p>El dictamen forense estableció broncoaspiración.</p>',
};
let post: typeof import('@/app/api/admin/copy-social/route').POST;
let guard: ReturnType<typeof vi.fn>;
let record: ReturnType<typeof vi.fn>;
let fetchMock: ReturnType<typeof vi.fn>;
const request = (body: unknown = article, auth = true) => new NextRequest('https://nicaraguainformate.com/api/admin/copy-social', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { 'x-admin-token': 'test-social-admin' } : {}) },
  body: JSON.stringify(body),
});

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv('ADMIN_API_KEY', 'test-social-admin');
  vi.stubEnv('GROQ_API_KEY', 'test-groq-not-a-real-key');
  const cost = await import('@/lib/supervisor/cost-guard');
  guard = vi.mocked(cost.canCallLLM).mockResolvedValue({ allowed: true } as never);
  record = vi.mocked(cost.recordCall).mockResolvedValue(undefined);
  fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: '{"angleIndex":0,"openingIndex":1}' } }] }) });
  vi.stubGlobal('fetch', fetchMock);
  post = (await import('@/app/api/admin/copy-social/route')).POST;
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('copy-social API sin envíos reales', () => {
  it('rechaza solicitudes no autenticadas antes de usar IA', async () => {
    expect((await post(request(article, false))).status).toBe(401);
    expect(guard).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([null, {}, { ...article, contenido: [] }, { ...article, titulo: 'abc' }, { ...article, slug: '../otro' }, { ...article, url: 'https://otro.test/noticias/hombre-masaya' }, { ...article, url: 'https://nicaraguainformate.com/noticias/otra' }, { ...article, url: 'https://nicaraguainformate.com/noticias/%ZZ' }])('valida entrada: %j', async body => {
    expect((await post(request(body))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('rechaza JSON inválido y payload excesivo', async () => {
    const req = new NextRequest('https://nicaraguainformate.com/api/admin/copy-social', { method: 'POST', headers: { 'x-admin-token': 'test-social-admin' }, body: '{' });
    expect((await post(req)).status).toBe(400);
    expect((await post(request({ ...article, contenido: 'x'.repeat(100001) }))).status).toBe(413);
  });
  it('genera tres canales, evidencia y enlaces oficiales con selección validada', async () => {
    const response = await post(request());
    const data = await response.json();
    expect(data.source).toBe('ia');
    expect(data.analysis.enfoque).toBe('Dictamen forense');
    expect(data.analysis.evidencia).toContain('estableció broncoaspiración');
    expect(data.facebookPost).not.toContain('https://');
    expect(data.firstComment).toContain('https://nicaraguainformate.com/noticias/hombre-masaya?utm_source=facebook&utm_medium=social');
    expect(data.telegramText).not.toContain('<b>');
    expect(data.telegramText).toContain('utm_source=telegram');
    expect(data.whatsappText).toContain('utm_source=whatsapp');
    expect(data.copy).toBe(data.facebookPost);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(record).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(fetchMock.mock.calls[0][1].signal).toBeDefined();
  });
  it('admite URL oficial legacy pero reconstruye los UTM', async () => {
    const { slug: _slug, ...rest } = article;
    const data = await (await post(request({ ...rest, url: 'https://nicaraguainformate.com/noticias/hombre-masaya?utm_source=otro' }))).json();
    expect(data.firstComment).toContain('utm_source=facebook');
    expect(data.firstComment).not.toContain('utm_source=otro');
  });
  it('no consume llamadas si no hay clave o se pide solo respaldo', async () => {
    vi.stubEnv('GROQ_API_KEY', '');
    expect((await (await post(request())).json()).source).toBe('plantilla');
    vi.stubEnv('GROQ_API_KEY', 'test-groq');
    expect((await (await post(request({ ...article, useAI: false }))).json()).source).toBe('plantilla');
    expect(guard).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('devuelve respaldo profesional cuando el cost guard bloquea', async () => {
    guard.mockResolvedValue({ allowed: false, reason: 'Límite' });
    const data = await (await post(request())).json();
    expect(data.success).toBe(true);
    expect(data.validation).toBe('limite');
    expect(data.source).toBe('plantilla');
    expect(data.analysis.enfoque).toBe('Dictamen forense');
    expect(record).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(['{"angleIndex":99,"openingIndex":0}', '{"angleIndex":0,"openingIndex":0,"copy":"Dato inventado"}', 'no es JSON'])('rechaza IA inválida: %s', content => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content } }] }) });
    return post(request()).then(r => r.json()).then(data => {
      expect(data.source).toBe('plantilla');
      expect(data.validation).toBe('respuesta_invalida');
      expect(data.copy).not.toContain('Dato inventado');
      expect(record).toHaveBeenCalledTimes(1);
    });
  });
  it.each(['http', 'timeout'])('conserva respaldo ante error %s y cuenta el intento', async failure => {
    if (failure === 'http') fetchMock.mockResolvedValue({ ok: false });
    else fetchMock.mockRejectedValue(new Error('Timeout'));
    const data = await (await post(request())).json();
    expect(data.source).toBe('plantilla');
    expect(data.validation).toBe('no_disponible');
    expect(record).toHaveBeenCalledTimes(1);
  });
  it('deduplica concurrencia y reutiliza resultado sin repetir llamadas', async () => {
    const results = await Promise.all([post(request()), post(request()), post(request())]);
    const data = await Promise.all(results.map(r => r.json()));
    expect(data.map(d => d.cached)).toEqual([false, true, true]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledTimes(1);
    await post(request({ ...article, contenido: article.contenido + '<p>Información actualizada.</p>' }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('vuelve a analizar cuando expira el caché', async () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    await post(request());
    vi.mocked(Date.now).mockReturnValue(now + 300001);
    await post(request());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('analiza evidencia más allá del antiguo límite de 1200 caracteres', async () => {
    const contenido = '<p>' + 'Información de contexto. '.repeat(100) + '</p>' + article.contenido;
    const data = await (await post(request({ ...article, contenido }))).json();
    expect(data.analysis.enfoque).toBe('Dictamen forense');
    const prompt = JSON.parse(fetchMock.mock.calls[0][1].body).messages[1].content;
    expect(prompt).toContain('dictamen forense');
  });
});
