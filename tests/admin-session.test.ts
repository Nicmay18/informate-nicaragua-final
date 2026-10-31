// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { issueSessionToken, verifySessionToken } from '@/lib/admin-session';
import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const verifyIdToken = vi.hoisted(() => vi.fn());
vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({ verifyIdToken }),
}));
import { POST as login } from '@/app/api/admin/session/route';

/**
 * Seguridad: la cookie admin_session ya no contiene ADMIN_API_KEY en claro.
 * Un robo de cookie ya no expone la credencial permanente — solo un token
 * firmado con expiración y email validado contra la allowlist.
 */
describe('admin-session — cookie opaca (fix llave maestra)', () => {
  const KEY = 'test-admin-key-0123456789abcdef';
  const EMAILS = 'Admin@Example.com,otro@test.com';

  beforeEach(() => {
    vi.stubEnv('ADMIN_API_KEY', KEY);
    vi.stubEnv('ADMIN_EMAILS', EMAILS);
    vi.stubEnv('ADMIN_SESSION_SECRET', '');
  });
  afterEach(() => {
    delete process.env.ADMIN_API_KEY;
    delete process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_SESSION_SECRET;
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('emite y verifica un token válido', () => {
    const token = issueSessionToken('admin@example.com');
    expect(verifySessionToken(token)).toBe(true);
  });

  it('el token NO contiene la API key ni el email en claro', () => {
    const token = issueSessionToken('admin@example.com');
    expect(token).not.toContain(KEY);
    expect(token).not.toContain('admin@example.com');
    expect(token.split('.')).toHaveLength(3);
  });

  it('rechaza la cookie legada (API key en claro)', () => {
    expect(verifySessionToken(KEY)).toBe(false);
  });

  it('rechaza firma adulterada', () => {
    const token = issueSessionToken('admin@example.com');
    const tampered = token.slice(0, -1) + (token.endsWith('0') ? '1' : '0');
    expect(verifySessionToken(tampered)).toBe(false);
  });

  it('rechaza token expirado', () => {
    const token = issueSessionToken('admin@example.com', -1000);
    expect(verifySessionToken(token)).toBe(false);
  });

  it('rechaza email fuera de la allowlist aunque la firma sea válida', () => {
    const token = issueSessionToken('intruso@evil.com');
    expect(verifySessionToken(token)).toBe(false);
  });

  it('rechaza payload manipulado (exp extendido sin refirmar)', () => {
    const token = issueSessionToken('admin@example.com');
    const [, emailB64, sig] = token.split('.');
    const forged = `${Date.now() + 99999999}.${emailB64}.${sig}`;
    expect(verifySessionToken(forged)).toBe(false);
  });

  it('usa ADMIN_SESSION_SECRET si está definido (aislado de la API key)', () => {
    process.env.ADMIN_SESSION_SECRET = 'otro-secreto-de-sesion';
    const token = issueSessionToken('admin@example.com');
    expect(verifySessionToken(token)).toBe(true);
    delete process.env.ADMIN_SESSION_SECRET;
    expect(verifySessionToken(token)).toBe(false);
  });

  it('sin secreto configurado no verifica nada (fail-closed)', () => {
    delete process.env.ADMIN_API_KEY;
    const token = issueSessionToken('admin@example.com');
    expect(verifySessionToken(token)).toBe(false);
  });

  it('acepta email unicode (btoa-safe)', () => {
    process.env.ADMIN_EMAILS = 'josé@niño.ni';
    const token = issueSessionToken('josé@niño.ni');
    expect(verifySessionToken(token)).toBe(true);
  });

  it('la firma coincide con HMAC-SHA256 de node:crypto (implementación correcta)', () => {
    // Un roundtrip propio no detectaría un SHA-256 incorrecto-pero-consistente:
    // comparamos la firma emitida contra la referencia de node:crypto.
    const token = issueSessionToken('admin@example.com');
    const [exp, emailB64] = token.split('.');
    const expected = createHmac('sha256', KEY).update(`${exp}.${emailB64}`).digest('hex');
    expect(token.split('.')[2]).toBe(expected);
  });

  it('soporta secreto >64 bytes (ruta HMAC con key-hash)', () => {
    process.env.ADMIN_SESSION_SECRET = 's'.repeat(100);
    const token = issueSessionToken('admin@example.com');
    const [exp, emailB64] = token.split('.');
    const expected = createHmac('sha256', 's'.repeat(100)).update(`${exp}.${emailB64}`).digest('hex');
    expect(token.split('.')[2]).toBe(expected);
    expect(verifySessionToken(token)).toBe(true);
  });

  it('coincide con Node en los límites de bloque SHA-256', () => {
    for (let length = 1; length <= 130; length++) {
      const token = issueSessionToken(`${'a'.repeat(length)}@example.com`);
      const [exp, email, signature] = token.split('.');
      expect(signature, `email length ${length}`).toBe(
        createHmac('sha256', KEY).update(`${exp}.${email}`).digest('hex'),
      );
    }
  });

  it('vence exactamente a las 24 horas y revalida la allowlist', () => {
    vi.useFakeTimers();
    const token = issueSessionToken('admin@example.com');
    process.env.ADMIN_EMAILS = 'otro@test.com';
    expect(verifySessionToken(token)).toBe(false);
    process.env.ADMIN_EMAILS = EMAILS;
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 - 1);
    expect(verifySessionToken(token)).toBe(true);
    vi.advanceTimersByTime(1);
    expect(verifySessionToken(token)).toBe(false);
  });
});

// Inventario real: toda nueva ruta admin entra automáticamente en la matriz.
function adminRoutes(dir = 'app/api/admin'): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return adminRoutes(path);
    return entry.name === 'route.ts'
      ? ['/' + dir.replaceAll('\\', '/').replace(/^app\//, '').replace('[id]', 'test-id')]
      : [];
  });
}
const publicRoutes = ['/api/admin/session', '/api/admin/estado'];
const retired = ['/api/admin/clean-backlog', '/api/admin/eliminar-viejas',
  '/api/admin/limpiar-noindex', '/api/admin/limpiar-sucesos'];
const cronRoutes = ['/api/admin/departamento/ejecutar', '/api/admin/nios/loop',
  '/api/admin/nios-collect', '/api/admin/reindexar-google', '/api/admin/watch'];
const protectedRoutes = adminRoutes().filter((route) => !publicRoutes.includes(route) && !retired.includes(route));

describe('middleware — autorización real, sin mocks de auth', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_API_KEY', 'test-admin-key');
    vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');
    vi.stubEnv('ADMIN_SESSION_SECRET', 'test-signing-secret');
    vi.stubEnv('CRON_SECRET_TOKEN', 'test-cron-key');
    vi.stubEnv('CRON_SECRET', 'test-old-cron-key');
    vi.stubEnv('CLEANUP_TOKEN', 'test-cleanup-key');
  });
  afterEach(() => vi.unstubAllEnvs());
  const request = (path: string, headers: Record<string, string> = {}) =>
    new NextRequest(`https://example.com${path}`, { headers });

  it.each(protectedRoutes)('%s rechaza credenciales inválidas y separa cron de admin', (path) => {
    const invalid = [
      {},
      { cookie: 'admin_session=false-cookie' },
      { cookie: 'admin_session=test-admin-key' },
      { cookie: `admin_session=${issueSessionToken('admin@example.com', -1000)}` },
      { cookie: `admin_session=${issueSessionToken('unauthorized@example.com')}` },
      { 'x-admin-token': 'test-cron-key' },
      { 'x-admin-key': 'test-cleanup-key' },
      { 'x-cron-secret': 'test-old-cron-key' },
    ];
    for (const headers of invalid) {
      const res = middleware(request(path, headers));
      expect(res.status).toBe(401);
      // Todo rechazo de autenticación es no-cacheable (401 no-cacheable
      // en edge: ver describe "401 nunca cacheable").
      expect(res.headers.get('Cache-Control')).toBe('private, no-cache, no-store, must-revalidate');
      expect(res.headers.get('CDN-Cache-Control')).toBe('no-store');
      expect(res.headers.get('Cloudflare-CDN-Cache-Control')).toBe('no-store');
    }
    const cronRes = middleware(request(path, { 'x-cron-secret': 'test-cron-key' }));
    expect(cronRes.status).toBe(cronRoutes.includes(path) ? 200 : 401);
    if (!cronRoutes.includes(path)) {
      expect(cronRes.headers.get('Cloudflare-CDN-Cache-Control')).toBe('no-store');
    }
    const response = middleware(request(path, {
      cookie: `admin_session=${issueSessionToken('admin@example.com')}`,
      'x-admin-token': 'session-cookie',
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-request-x-admin-token')).toBe('test-admin-key');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(middleware(request(path, { 'x-admin-token': 'test-admin-key' })).status).toBe(200);
  });

  it.each(publicRoutes)('%s permite llegar al handler público', (path) => {
    expect(middleware(request(path)).status).toBe(200);
  });
  it.each(retired)('%s permanece retirado incluso con credenciales', (path) => {
    expect(middleware(request(path, { 'x-admin-token': 'test-admin-key' })).status).toBe(410);
  });
});

describe('middleware — 401 nunca cacheable (pulido Cache-Control)', () => {
  // Producción 2026-10-31: /api/count-news devolvía 401 con
  // `Cache-Control: public, max-age=0, must-revalidate` y CF-Cache-Status
  // DYNAMIC — bajo la regla "Cache Everything" un rechazo podía quedar
  // almacenado en edge. Todo 401 debe llevar no-store explícito.
  beforeEach(() => {
    vi.stubEnv('ADMIN_API_KEY', 'test-admin-key');
    vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');
    vi.stubEnv('ADMIN_SESSION_SECRET', 'test-signing-secret');
    vi.stubEnv('CRON_SECRET_TOKEN', 'test-cron-key');
    vi.stubEnv('CRON_SECRET', 'test-old-cron-key');
    vi.stubEnv('CLEANUP_TOKEN', 'test-cleanup-key');
  });
  afterEach(() => vi.unstubAllEnvs());
  const request = (path: string, headers: Record<string, string> = {}) =>
    new NextRequest(`https://example.com${path}`, { headers });

  const NO_STORE_HEADERS: [string, string][] = [
    ['Cache-Control', 'private, no-cache, no-store, must-revalidate'],
    ['CDN-Cache-Control', 'no-store'],
    ['Cloudflare-CDN-Cache-Control', 'no-store'],
  ];

  it.each(['/api/count-news', '/api/admin/negocios', '/api/nios'])(
    '%s sin credenciales → 401 con los tres headers no-store',
    async (path) => {
      const res = middleware(request(path));
      expect(res.status).toBe(401);
      for (const [name, value] of NO_STORE_HEADERS) {
        expect(res.headers.get(name), name).toBe(value);
      }
      expect(await res.json()).toEqual({ error: 'Unauthorized', code: 'INVALID_AUTH' });
    },
  );

  it('credenciales inválidas → 401 con no-store (no solo sin credenciales)', () => {
    for (const headers of [
      { 'x-admin-token': 'clave-falsa' },
      { cookie: 'admin_session=token-falso' },
      { 'x-cron-secret': 'cron-falso' },
    ]) {
      const res = middleware(request('/api/count-news', headers));
      expect(res.status).toBe(401);
      expect(res.headers.get('Cache-Control')).toBe('private, no-cache, no-store, must-revalidate');
      expect(res.headers.get('Cloudflare-CDN-Cache-Control')).toBe('no-store');
    }
  });

  it('el secreto de cron viejo también devuelve 401 no cacheable', () => {
    const res = middleware(request('/api/admin/nios-collect', { 'x-cron-secret': 'test-old-cron-key' }));
    expect(res.status).toBe(401);
    expect(res.headers.get('Cloudflare-CDN-Cache-Control')).toBe('no-store');
  });

  it('autenticación válida NO se altera: header, cookie y cron siguen pasando', () => {
    // Header ADMIN_API_KEY en ruta sensible
    expect(middleware(request('/api/count-news', { 'x-admin-token': 'test-admin-key' })).status).toBe(200);
    // Cookie de sesión válida en ruta admin (con marcador del panel)
    const cookieRes = middleware(request('/api/admin/negocios', {
      cookie: `admin_session=${issueSessionToken('admin@example.com')}`,
      'x-admin-token': 'session-cookie',
    }));
    expect(cookieRes.status).toBe(200);
    // Cron solo en rutas autorizadas
    expect(middleware(request('/api/admin/nios-collect', { 'x-cron-secret': 'test-cron-key' })).status).toBe(200);
    expect(middleware(request('/api/admin/negocios', { 'x-cron-secret': 'test-cron-key' })).status).toBe(401);
  });

  it('cookie válida por sí sola autentica (sin header adicional)', () => {
    const res = middleware(request('/api/admin/negocios', {
      cookie: `admin_session=${issueSessionToken('admin@example.com')}`,
    }));
    expect(res.status).toBe(200);
    // La respuesta autenticada sigue siendo no-cacheable (misma política).
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });

  it('unauthorized() de lib/auth (defensa en profundidad de handlers) también es no-store', async () => {
    const { unauthorized } = await import('@/lib/auth');
    const res = unauthorized();
    expect(res.status).toBe(401);
    expect(res.headers.get('Cache-Control')).toBe('private, no-cache, no-store, must-revalidate');
    expect(res.headers.get('CDN-Cache-Control')).toBe('no-store');
    expect(res.headers.get('Cloudflare-CDN-Cache-Control')).toBe('no-store');
  });
});

describe('handler de login — Firebase y allowlist', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_API_KEY', 'test-admin-key');
    vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');
    vi.stubEnv('ADMIN_SESSION_SECRET', 'test-signing-secret');
    verifyIdToken.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());
  const request = () => new NextRequest('https://example.com/api/admin/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'fixture-firebase-token' }),
  });

  it('rechaza usuario válido en Firebase fuera de ADMIN_EMAILS', async () => {
    verifyIdToken.mockResolvedValue({ email: 'unauthorized@example.com' });
    const response = await login(request());
    expect(response.status).toBe(403);
    expect(response.headers.has('Set-Cookie')).toBe(false);
  });
  it('rechaza ID token expirado', async () => {
    verifyIdToken.mockRejectedValue(new Error('auth/id-token-expired'));
    const response = await login(request());
    expect(response.status).toBe(401);
    expect(response.headers.has('Set-Cookie')).toBe(false);
  });
  it('rechaza allowlist vacía', async () => {
    vi.stubEnv('ADMIN_EMAILS', '');
    verifyIdToken.mockResolvedValue({ email: 'admin@example.com' });
    expect((await login(request())).status).toBe(403);
  });
  it('emite cookie firmada de 24h sin transmitir la clave', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    verifyIdToken.mockResolvedValue({ email: 'admin@example.com' });
    const response = await login(request());
    expect(response.status).toBe(200);
    const cookie = response.headers.get('Set-Cookie')!;
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Max-Age=86400']) {
      expect(cookie).toContain(flag);
    }
    expect(cookie).not.toContain('test-admin-key');
    expect(await response.text()).not.toContain('test-admin-key');
    const token = decodeURIComponent(cookie.split(';')[0].split('=')[1]);
    expect(verifySessionToken(token)).toBe(true);
  });
});
