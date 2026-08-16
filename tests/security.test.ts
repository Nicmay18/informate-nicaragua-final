import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminToken,
  verifyAdminOrCronToken,
  verifyAdminOrCleanupToken,
  timingSafeCompare,
  isAdminRequest,
} from '@/lib/auth';
import { withCronSecret } from '@/lib/api-error-handler';

describe('Seguridad — helpers de autenticación', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_API_KEY', 'admin-secret');
    vi.stubEnv('CRON_SECRET_TOKEN', 'cron-secret');
    vi.stubEnv('CLEANUP_TOKEN', 'cleanup-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rechaza tokens nulos o vacíos', () => {
    expect(verifyAdminToken(null)).toBe(false);
    expect(verifyAdminToken('')).toBe(false);
    expect(verifyAdminOrCronToken(undefined)).toBe(false);
    expect(verifyAdminOrCleanupToken(undefined)).toBe(false);
  });

  it('admin token válido pasa, inválido falla', () => {
    expect(verifyAdminToken('admin-secret')).toBe(true);
    expect(verifyAdminToken('wrong')).toBe(false);
  });

  it('cron token válido pasa y fallback CRON_SECRET funciona', () => {
    expect(verifyAdminOrCronToken('cron-secret')).toBe(true);
    expect(verifyAdminOrCronToken('admin-secret')).toBe(true);
    expect(verifyAdminOrCronToken('wrong')).toBe(false);

    vi.unstubAllEnvs();
    vi.stubEnv('CRON_SECRET', 'legacy-cron');
    vi.stubEnv('ADMIN_API_KEY', 'admin-secret');
    expect(verifyAdminOrCronToken('legacy-cron')).toBe(true);
  });

  it('cleanup token válido pasa con fallback', () => {
    expect(verifyAdminOrCleanupToken('cleanup-secret')).toBe(true);
    expect(verifyAdminOrCleanupToken('admin-secret')).toBe(true);

    vi.unstubAllEnvs();
    vi.stubEnv('TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR', 'legacy-cleanup');
    vi.stubEnv('ADMIN_API_KEY', 'admin-secret');
    expect(verifyAdminOrCleanupToken('legacy-cleanup')).toBe(true);
  });

  it('timingSafeCompare rechaza longitudes distintas y valores diferentes', () => {
    expect(timingSafeCompare('abc', 'abcd')).toBe(false);
    expect(timingSafeCompare('abc', 'abx')).toBe(false);
    expect(timingSafeCompare('abc', 'abc')).toBe(true);
  });

  it('isAdminRequest reconoce header x-admin-token', () => {
    const request = new Request('http://localhost/', {
      headers: { 'x-admin-token': 'admin-secret' },
    });
    expect(isAdminRequest(request)).toBe(true);
  });

  it('withCronSecret rechaza sin header y acepta válido', async () => {
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const wrapped = withCronSecret(handler);

    const noAuth = new NextRequest('http://localhost/api/test', { method: 'POST' });
    const resNoAuth = await wrapped(noAuth);
    expect(resNoAuth.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();

    const withAuth = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      headers: { 'x-cron-secret': 'cron-secret' },
    });
    const resAuth = await wrapped(withAuth);
    expect(resAuth.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });
});
