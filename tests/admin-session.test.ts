import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { issueSessionToken, verifySessionToken } from '@/lib/admin-session';

/**
 * Seguridad: la cookie admin_session ya no contiene ADMIN_API_KEY en claro.
 * Un robo de cookie ya no expone la credencial permanente — solo un token
 * firmado con expiración y email validado contra la allowlist.
 */
describe('admin-session — cookie opaca (fix llave maestra)', () => {
  const KEY = 'test-admin-key-0123456789abcdef';
  const EMAILS = 'Admin@Example.com,otro@test.com';

  beforeEach(() => {
    process.env.ADMIN_API_KEY = KEY;
    process.env.ADMIN_EMAILS = EMAILS;
    delete process.env.ADMIN_SESSION_SECRET;
  });
  afterEach(() => {
    delete process.env.ADMIN_API_KEY;
    delete process.env.ADMIN_EMAILS;
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
    const tampered = token.slice(0, -2) + '00';
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
});
