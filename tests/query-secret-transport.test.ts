/**
 * SEC-03 — transporte de credenciales: headers primero, query string es
 * fallback legado detectado para advertencia (sin exponer el valor).
 */
import { describe, it, expect } from 'vitest';
import { extractRequestSecret, QUERY_SECRET_DEPRECATION_NOTE } from '@/lib/auth';

function req(url: string, headers: Record<string, string> = {}) {
  return new Request(url, { headers });
}

describe('extractRequestSecret — prioridad de transporte', () => {
  it('Authorization: Bearer gana sobre query string', () => {
    const { token, via } = extractRequestSecret(
      req('http://x/api/cron/y?secret=en-la-url', { authorization: 'Bearer abc123' }),
    );
    expect(token).toBe('abc123');
    expect(via).toBe('authorization');
  });

  it('x-cron-secret gana sobre query string', () => {
    const { token, via } = extractRequestSecret(
      req('http://x/api/cron/y?token=en-la-url', { 'x-cron-secret': 'h' }),
    );
    expect(via).toBe('x-cron-secret');
  });

  it('x-admin-token / x-admin-key se reconocen como transporte admin', () => {
    expect(extractRequestSecret(req('http://x/', { 'x-admin-token': 'k' })).via).toBe('x-admin-token');
    expect(extractRequestSecret(req('http://x/', { 'x-admin-key': 'k' })).via).toBe('x-admin-token');
  });

  it('?secret= y ?token= en query se detectan como transporte legado', () => {
    expect(extractRequestSecret(req('http://x/?secret=s1')).via).toBe('query');
    expect(extractRequestSecret(req('http://x/?token=t1')).via).toBe('query');
    expect(extractRequestSecret(req('http://x/?secret=s1')).token).toBe('s1');
  });

  it('Bearer vacío no tapa el fallback por header', () => {
    const { via } = extractRequestSecret(
      req('http://x/', { authorization: 'Bearer   ', 'x-cron-secret': 'c' }),
    );
    expect(via).toBe('x-cron-secret');
  });

  it('sin credencial → none', () => {
    expect(extractRequestSecret(req('http://x/')).via).toBe('none');
  });

  it('el mensaje de deprecación nunca incluye el valor del secreto', () => {
    expect(QUERY_SECRET_DEPRECATION_NOTE).not.toMatch(/token=[a-z0-9]/i);
    expect(QUERY_SECRET_DEPRECATION_NOTE).toContain('Bearer');
  });
});
