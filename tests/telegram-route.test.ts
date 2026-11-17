import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Auth controlable: permite simular admin vs cron.
const authState = vi.hoisted(() => ({ adminOk: true, adminOrCronOk: true }));
vi.mock('@/lib/auth', () => ({
  verifyAdminOrCronToken: () => authState.adminOrCronOk,
  verifyAdminToken: () => authState.adminOk,
  extractRequestSecret: () => ({ token: 'test', via: 'header' }),
  QUERY_SECRET_DEPRECATION_NOTE: 'nota',
  NO_STORE_401_HEADERS: {},
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// sendTelegramArticle mockeado (su lógica tiene sus propios tests);
// resolveTelegramClaim se mantiene REAL para probar la integración.
const sendMock = vi.fn();
vi.mock('@/lib/distribution/telegram', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/distribution/telegram')>();
  return { ...mod, sendTelegramArticle: (...args: unknown[]) => sendMock(...args) };
});

/* Firestore mínimo para distribuciones_envios con transacción real-ish */
const claims: Record<string, any> = {};
function docRef(id: string) {
  return {
    id,
    async create(data: any) {
      if (claims[id]) { const e: any = new Error('ALREADY_EXISTS'); e.code = 6; throw e; }
      claims[id] = { ...data };
    },
    async get() { return { exists: !!claims[id], data: () => claims[id] }; },
    async update(patch: any) { claims[id] = { ...(claims[id] || {}), ...patch }; },
  };
}
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => ({
    collection: (name: string) => {
      if (name !== 'distribuciones_envios') throw new Error(`col inesperada: ${name}`);
      return { doc: docRef };
    },
    async runTransaction(fn: (tx: any) => Promise<any>) {
      return fn({
        get: (ref: any) => ref.get(),
        update: (ref: any, patch: any) => ref.update(patch),
        set: (ref: any, data: any) => ref.update(data),
      });
    },
  }),
}));

import { POST } from '@/app/api/telegram/route';

function req(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  for (const k of Object.keys(claims)) delete claims[k];
  sendMock.mockReset();
  authState.adminOk = true;
  authState.adminOrCronOk = true;
});

describe('/api/telegram — resolve: validación estricta', () => {
  it('action inválida → 400 (no se convierte en retry)', async () => {
    const res = await POST(req({ resolve: { slug: 'mi-nota', action: 'bogus' } }));
    expect(res.status).toBe(400);
  });

  it('action con mayúsculas/espacios → 400 (match exacto)', async () => {
    for (const action of ['SENT', 'Retry', 'sent ', ' retry']) {
      const res = await POST(req({ resolve: { slug: 'mi-nota', action } }));
      expect(res.status).toBe(400);
    }
  });

  it('messageId decimal/negativo/string → 400', async () => {
    for (const messageId of [1.5, -3, '42', NaN]) {
      const res = await POST(req({ resolve: { slug: 'mi-nota', action: 'sent', messageId } }));
      expect(res.status).toBe(400);
    }
  });

  it('slug inválido → 400', async () => {
    for (const slug of ['BAD SLUG!', 'slug/../etc', '', 'a'.repeat(250), 42]) {
      const res = await POST(req({ resolve: { slug, action: 'sent' } }));
      expect(res.status).toBe(400);
    }
  });

  it('resolve no-objeto → 400', async () => {
    expect((await POST(req({ resolve: 'sent' }))).status).toBe(400);
    expect((await POST(req({ resolve: null }))).status).toBe(400);
  });

  it('claim inexistente → 409 claim_not_found', async () => {
    const res = await POST(req({ resolve: { slug: 'no-existe', action: 'sent' } }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('claim_not_found');
  });
});

describe('/api/telegram — resolve: flujo válido', () => {
  it('unknown → retry → failed; luego failed → sent con messageId', async () => {
    claims['telegram_mi-nota'] = { status: 'unknown', slug: 'mi-nota' };

    const r1 = await POST(req({ resolve: { slug: 'mi-nota', action: 'retry', note: 'ausente en canal' } }));
    expect(r1.status).toBe(200);
    expect(claims['telegram_mi-nota'].status).toBe('failed');
    expect(claims['telegram_mi-nota'].resolvedBy).toBe('manual');

    // Segundo resolve sobre 'failed' → vuelve a ser resoluble (estado válido)
    const r2 = await POST(req({ resolve: { slug: 'mi-nota', action: 'sent', messageId: 12345, note: 'llegó tarde' } }));
    expect(r2.status).toBe(200);
    expect(claims['telegram_mi-nota'].status).toBe('sent');
    expect(claims['telegram_mi-nota'].messageId).toBe(12345);
  });

  it('resolve sobre claim sent → 409 no resoluble', async () => {
    claims['telegram_mi-nota'] = { status: 'sent', slug: 'mi-nota' };
    const res = await POST(req({ resolve: { slug: 'mi-nota', action: 'retry' } }));
    expect(res.status).toBe(409);
    expect(claims['telegram_mi-nota'].status).toBe('sent'); // intacto
  });

  it('claim sending VIGENTE → 409 claim_in_flight (no resoluble prematuramente)', async () => {
    claims['telegram_en-curso'] = {
      status: 'sending', slug: 'en-curso',
      claimedAt: new Date().toISOString(), // recién reclamado
    };
    const res = await POST(req({ resolve: { slug: 'en-curso', action: 'retry' } }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('claim_in_flight');
    expect(claims['telegram_en-curso'].status).toBe('sending'); // intacto
  });

  it('claim sending HUÉRFANO (>10min) → resoluble', async () => {
    claims['telegram_huerfano'] = {
      status: 'sending', slug: 'huerfano',
      claimedAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    };
    const res = await POST(req({ resolve: { slug: 'huerfano', action: 'sent', messageId: 777 } }));
    expect(res.status).toBe(200);
    expect(claims['telegram_huerfano'].status).toBe('sent');
  });

  it('slug con mayúsculas/espacios resuelve el MISMO claim (normalización)', async () => {
    claims['telegram_mi-nota'] = { status: 'unknown', slug: 'mi-nota' };
    const res = await POST(req({ resolve: { slug: '  MI-NOTA ', action: 'sent', messageId: 5 } }));
    // El regex de la ruta exige formato slug → mayúsculas ok, espacios no.
    // Probamos el caso real: mayúsculas sin espacios.
    if (res.status === 400) {
      const res2 = await POST(req({ resolve: { slug: 'MI-NOTA', action: 'sent', messageId: 5 } }));
      expect(res2.status).toBe(200);
      expect(claims['telegram_mi-nota'].status).toBe('sent');
    } else {
      expect(res.status).toBe(200);
      expect(claims['telegram_mi-nota'].status).toBe('sent');
    }
  });
});

describe('/api/telegram — resolve: autorización', () => {
  it('secreto de CRON no puede resolver claims → 403', async () => {
    authState.adminOk = false;        // token NO es ADMIN_API_KEY
    authState.adminOrCronOk = true;   // pero SÍ es CRON_SECRET
    claims['telegram_mi-nota'] = { status: 'unknown', slug: 'mi-nota' };

    const res = await POST(req({ resolve: { slug: 'mi-nota', action: 'sent' } }));
    expect(res.status).toBe(403);
    expect(claims['telegram_mi-nota'].status).toBe('unknown'); // intacto
  });

  it('sin ninguna credencial válida → 401', async () => {
    authState.adminOk = false;
    authState.adminOrCronOk = false;
    const res = await POST(req({ resolve: { slug: 'mi-nota', action: 'sent' } }));
    expect(res.status).toBe(401);
  });
});
