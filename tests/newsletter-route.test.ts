import { describe, it, expect, vi } from 'vitest';

const addMock = vi.fn().mockResolvedValue({ id: 'doc1' });
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: { collection: vi.fn(() => ({ add: addMock })) },
}));

import { POST } from '@/app/api/newsletter/route';

function req(body: unknown, ip = '10.0.0.1', headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/newsletter', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
      ...(typeof body === 'string' ? {} : {}),
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('newsletter — endpoint público con controles de abuso', () => {
  it('rechaza emails inválidos que el viejo includes("@") aceptaba', async () => {
    for (const email of ['a@b', 'no-es-email', '@dominio.com', 'espacios en medio@x.com']) {
      const res = await POST(req({ email }, '10.1.0.1'));
      expect(res.status).toBe(400);
    }
    expect(addMock).not.toHaveBeenCalled();
  });

  it('rechaza payload mayor a 4KB sin parsear el body', async () => {
    const res = await POST(
      req({ email: 'a@b.com' }, '10.2.0.1', { 'content-length': String(10 * 1024) }),
    );
    expect(res.status).toBe(413);
    expect(addMock).not.toHaveBeenCalled();
  });

  it('acepta email válido y escribe una sola vez', async () => {
    const res = await POST(req({ email: 'Lector@Ejemplo.COM ' }, '10.3.0.1'));
    expect(res.status).toBe(200);
    expect(addMock).toHaveBeenCalledTimes(1);
    expect(addMock.mock.calls[0][0].email).toBe('lector@ejemplo.com');
  });

  it('rate limit: la 6.ª solicitud del mismo IP en 1 min → 429 con Retry-After', async () => {
    const ip = '10.4.0.1';
    for (let i = 0; i < 5; i++) {
      const res = await POST(req({ email: `u${i}@e.com` }, ip));
      expect([200, 400]).toContain(res.status); // emails válidos → 200
      expect(res.status).toBe(200);
    }
    const sixth = await POST(req({ email: 'u6@e.com' }, ip));
    expect(sixth.status).toBe(429);
    expect(Number(sixth.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  it('otro IP no hereda el contador (limiter por IP, no global)', async () => {
    const res = await POST(req({ email: 'otro@e.com' }, '10.5.0.1'));
    expect(res.status).toBe(200);
  });
});
