import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const authState = vi.hoisted(() => ({ ok: true }));
vi.mock('@/lib/auth', () => ({
  verifyAdminOrCronToken: () => authState.ok,
  extractRequestSecret: () => ({ token: 'cron', via: 'header' }),
  QUERY_SECRET_DEPRECATION_NOTE: 'nota',
  NO_STORE_401_HEADERS: {},
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/departamento-central/heartbeat', () => ({ recordCronHeartbeat: vi.fn(async () => {}) }));

const tgMock = vi.fn(async () => ({ ok: true, channel: 'telegram' as const, retryable: false, sentAt: '' }));
vi.mock('@/lib/distribution/channels', () => ({
  enviarTelegram: (...a: unknown[]) => tgMock(...a),
  enviarFacebook: vi.fn(async () => ({ ok: true })),
  enviarIndexNow: vi.fn(async () => ({ ok: true })),
  enviarPush: vi.fn(async () => ({ ok: true })),
  enviarTwitter: vi.fn(async () => ({ ok: true })),
  yaDistribuido: vi.fn(async () => false),
}));

/* Firestore mínimo */
const pendientes: Record<string, any> = {};
const claims: Record<string, any> = {};
const noticias: Record<string, any> = {};
const added: any[] = [];

function makeDoc(store: Record<string, any>, id: string) {
  return {
    id,
    data: () => store[id],
    ref: {
      async update(patch: any) { store[id] = { ...(store[id] || {}), ...patch }; },
    },
  };
}

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => ({
    collection(name: string) {
      if (name === 'distribuciones_pendientes') {
        return {
          where: () => ({
            limit: () => ({
              get: async () => ({
                docs: Object.keys(pendientes)
                  .filter(k => (pendientes[k].proximoIntento || '') <= new Date().toISOString())
                  .map(k => makeDoc(pendientes, k)),
              }),
            }),
          }),
        };
      }
      if (name === 'noticias') {
        return {
          where: (_f: string, _op: string, slug: string) => ({
            limit: () => ({
              get: async () => ({
                empty: !noticias[slug],
                docs: noticias[slug] ? [{ data: () => noticias[slug] }] : [],
              }),
            }),
          }),
        };
      }
      if (name === 'distribuciones_envios') {
        return { doc: (id: string) => ({ async get() { return { data: () => claims[id] }; } }) };
      }
      if (name === 'distribuciones') {
        return { add: async (d: any) => { added.push(d); } };
      }
      throw new Error(`col inesperada: ${name}`);
    },
  }),
}));

import { GET } from '@/app/api/cron/distribuciones-retry/route';

function req(): NextRequest {
  return new NextRequest('http://localhost/api/cron/distribuciones-retry', { method: 'GET' });
}

beforeEach(() => {
  for (const k of Object.keys(pendientes)) delete pendientes[k];
  for (const k of Object.keys(claims)) delete claims[k];
  for (const k of Object.keys(noticias)) delete noticias[k];
  added.length = 0;
  tgMock.mockClear();
  authState.ok = true;
});

describe('distribuciones-retry — estados terminales y claims', () => {
  it('doc en requiere_verificacion NO se reprocesa ni se degrada a fallo_definitivo', async () => {
    pendientes['nota-1'] = {
      slug: 'nota-1', estado: 'requiere_verificacion', reintentos: 1,
      proximoIntento: '2020-01-01T00:00:00.000Z', canalesFallidos: ['telegram'], fecha: new Date().toISOString(),
    };
    noticias['nota-1'] = { slug: 'nota-1', titulo: 'Nota' };
    claims['telegram_nota-1'] = { status: 'unknown' };

    const res = await GET(req());
    expect(res.status).toBe(200);
    // Estado preservado — la señal humana no se pierde
    expect(pendientes['nota-1'].estado).toBe('requiere_verificacion');
    // Y sale de la ventana de la query
    expect(pendientes['nota-1'].proximoIntento).toBe('9999-12-31T00:00:00.000Z');
    expect(tgMock).not.toHaveBeenCalled();
  });

  it('claim unknown en cola fresca → requiere_verificacion, sin envío', async () => {
    pendientes['nota-2'] = {
      slug: 'nota-2', reintentos: 0,
      proximoIntento: '2020-01-01T00:00:00.000Z', canalesFallidos: ['telegram'], fecha: new Date().toISOString(),
    };
    noticias['nota-2'] = { slug: 'nota-2', titulo: 'Nota 2' };
    claims['telegram_nota-2'] = { status: 'unknown', claimedAt: new Date().toISOString() };

    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(tgMock).not.toHaveBeenCalled();
    expect(pendientes['nota-2'].estado).toBe('requiere_verificacion');
    expect(pendientes['nota-2'].ultimoIntento.telegram).toBe('requiere_verificacion');
  });

  it('claim failed → forceRetry → reenvío permitido y registro limpio', async () => {
    pendientes['nota-3'] = {
      slug: 'nota-3', reintentos: 0,
      proximoIntento: '2020-01-01T00:00:00.000Z', canalesFallidos: ['telegram'], fecha: new Date().toISOString(),
    };
    noticias['nota-3'] = { slug: 'nota-3', titulo: 'Nota 3' };
    claims['telegram_nota-3'] = { status: 'failed', claimedAt: new Date().toISOString() };

    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(tgMock).toHaveBeenCalledTimes(1);
    expect(tgMock.mock.calls[0][2]).toEqual({ forceRetry: true });
    expect(pendientes['nota-3'].estado).toBe('procesado');
    expect(added.length).toBe(1);
    // Sin campos undefined en el registro
    expect(JSON.stringify(added[0])).not.toContain('undefined');
  });

  it('sin credencial → 401', async () => {
    authState.ok = false;
    const res = await GET(req());
    expect(res.status).toBe(401);
  });
});
