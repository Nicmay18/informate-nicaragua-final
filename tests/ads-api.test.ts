import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const isAdminRequestMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  isAdminRequest: (...args: unknown[]) => isAdminRequestMock(...args),
  unauthorized: () => new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    increment: (n: number) => ({ __inc: n }),
    serverTimestamp: () => new Date('2026-10-15T00:00:00Z'),
  },
}));

/* ── Firestore en memoria: colecciones con docs, batch y merge ── */
interface Doc { id: string; data: Record<string, unknown>; }
const store: Record<string, Map<string, Doc>> = {};

function applySet(data: Record<string, unknown>, payload: Record<string, unknown>) {
  for (const [k, v] of Object.entries(payload)) {
    if (v && typeof v === 'object' && '__inc' in v) {
      const prev = typeof data[k] === 'number' ? (data[k] as number) : 0;
      data[k] = prev + (v as { __inc: number }).__inc;
    } else if (k.includes('.')) {
      // field-paths (paises.NI etc.) — para el test basta guardarlos planos
      data[k] = v;
    } else {
      data[k] = v;
    }
  }
}

function makeCollection(name: string) {
  store[name] = store[name] || new Map();
  const col = store[name];
  return {
    add: async (payload: Record<string, unknown>) => {
      const id = `doc_${col.size + 1}`;
      col.set(id, { id, data: { ...payload } });
      return { id };
    },
    get: async () => ({ docs: [...col.values()].map(d => ({ id: d.id, data: () => d.data })) }),
    doc: (id: string) => ({
      get: async () => ({ exists: col.has(id), data: () => col.get(id)?.data }),
      update: async (payload: Record<string, unknown>) => applySet(col.get(id)!.data, payload),
      set: async (payload: Record<string, unknown>, opts?: { merge?: boolean }) => {
        const d = col.get(id) || { id, data: {} };
        applySet(d.data, payload);
        col.set(id, d);
      },
    }),
    where: () => ({ limit: () => ({ get: async () => ({ docs: [], empty: true }) }), get: async () => ({ docs: [] }) }),
  };
}

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => ({
    collection: (name: string) => makeCollection(name),
    batch: () => {
      const ops: (() => Promise<void>)[] = [];
      return {
        set: (ref: { set: (p: Record<string, unknown>, o?: { merge?: boolean }) => Promise<void> }, payload: Record<string, unknown>, opts?: { merge?: boolean }) => {
          ops.push(() => ref.set(payload, opts));
        },
        commit: async () => { for (const op of ops) await op(); },
      };
    },
  }),
}));

import { GET as listGET, POST as createPOST } from '@/app/api/admin/auspiciadores/route';
import { PUT as updatePUT, PATCH as togglePATCH } from '@/app/api/admin/auspiciadores/[id]/route';
import { POST as trackPOST } from '@/app/api/telemetry/ads/route';

const VALID = {
  nombre: 'Ferretería El Martillo',
  logoUrl: 'https://ejemplo.com/logo.png',
  url: 'https://wa.me/50588887777',
  posicion: 'articulo',
  activo: false,
  fechaInicio: '2026-10-15',
  fechaVencimiento: '2026-11-15',
};

function req(url: string, body?: unknown, method = 'POST'): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function createSponsor(): Promise<string> {
  const res = await createPOST(req('/api/admin/auspiciadores', VALID));
  expect(res.status).toBe(201);
  return (await res.json()).id;
}

beforeEach(() => {
  isAdminRequestMock.mockReturnValue(true);
  for (const k of Object.keys(store)) delete store[k];
});

describe('API admin auspiciadores — autorización y creación', () => {
  it('rechaza sin token admin (401)', async () => {
    isAdminRequestMock.mockReturnValue(false);
    expect((await createPOST(req('/api/admin/auspiciadores', VALID))).status).toBe(401);
    expect((await listGET(req('/api/admin/auspiciadores', undefined, 'GET'))).status).toBe(401);
  });

  it('crea auspiciador con contadores en cero', async () => {
    const id = await createSponsor();
    const doc = store['auspiciadores'].get(id)!;
    expect(doc.data.impresiones).toBe(0);
    expect(doc.data.clics).toBe(0);
    expect(doc.data.nombre).toBe(VALID.nombre);
  });

  it('rechaza payload inválido (400) sin persistir nada', async () => {
    const res = await createPOST(req('/api/admin/auspiciadores', { ...VALID, url: 'not-a-url' }));
    expect(res.status).toBe(400);
    expect(store['auspiciadores']?.size ?? 0).toBe(0);
  });

  it('rechaza vencimiento anterior al inicio (400)', async () => {
    const res = await createPOST(req('/api/admin/auspiciadores', { ...VALID, fechaVencimiento: '2026-10-01' }));
    expect(res.status).toBe(400);
  });
});

describe('API admin auspiciadores — edición y activación', () => {
  it('edita campos sin tocar contadores (preservación de datos)', async () => {
    const id = await createSponsor();
    const doc = store['auspiciadores'].get(id)!;
    doc.data.impresiones = 150;
    doc.data.clics = 7;

    const res = await updatePUT(
      req(`/api/admin/auspiciadores/${id}`, { ...VALID, nombre: 'Nombre Nuevo' }, 'PUT'),
      { params: Promise.resolve({ id }) },
    );
    expect(res.status).toBe(200);
    expect(doc.data.nombre).toBe('Nombre Nuevo');
    expect(doc.data.impresiones).toBe(150); // contadores intactos
    expect(doc.data.clics).toBe(7);
  });

  it('activa/desactiva con PATCH sin borrar otros campos', async () => {
    const id = await createSponsor();
    let res = await togglePATCH(req(`/api/admin/auspiciadores/${id}`, { activo: true }, 'PATCH'), { params: Promise.resolve({ id }) });
    expect(res.status).toBe(200);
    const doc = store['auspiciadores'].get(id)!;
    expect(doc.data.activo).toBe(true);
    expect(doc.data.nombre).toBe(VALID.nombre);

    res = await togglePATCH(req(`/api/admin/auspiciadores/${id}`, { activo: false }, 'PATCH'), { params: Promise.resolve({ id }) });
    expect(doc.data.activo).toBe(false);
  });

  it('404 al editar ID inexistente', async () => {
    const res = await updatePUT(req('/api/admin/auspiciadores/nope', VALID, 'PUT'), { params: Promise.resolve({ id: 'nope' }) });
    expect(res.status).toBe(404);
  });
});

describe('API telemetría de anuncios — impresiones y clics', () => {
  it('cuenta una impresión en el auspiciador y en ads_daily', async () => {
    const id = await createSponsor();
    const res = await trackPOST(req('/api/telemetry/ads', { sponsorId: id, tipo: 'impresion', slug: 'nota-x', sessionId: 's1' }));
    expect(res.status).toBe(200);
    expect(store['auspiciadores'].get(id)!.data.impresiones).toBe(1);
    const daily = [...store['ads_daily'].values()][0];
    expect(daily.data.sponsorId).toBe(id);
    expect(daily.data.impresiones).toBe(1);
  });

  it('cuenta un clic', async () => {
    const id = await createSponsor();
    await trackPOST(req('/api/telemetry/ads', { sponsorId: id, tipo: 'clic', slug: 'nota-x' }));
    expect(store['auspiciadores'].get(id)!.data.clics).toBe(1);
    expect(store['auspiciadores'].get(id)!.data.impresiones).toBe(0);
  });

  it('deduplica impresiones de la misma sesión en ventana corta', async () => {
    const id = await createSponsor();
    const r1 = await trackPOST(req('/api/telemetry/ads', { sponsorId: id, tipo: 'impresion', sessionId: 'misma' }));
    const r2 = await trackPOST(req('/api/telemetry/ads', { sponsorId: id, tipo: 'impresion', sessionId: 'misma' }));
    expect((await r1.json()).ok).toBe(true);
    expect((await r2.json()).dedup).toBe(true);
    expect(store['auspiciadores'].get(id)!.data.impresiones).toBe(1);
  });

  it('ignora sponsorId inexistente sin escribir contadores', async () => {
    const res = await trackPOST(req('/api/telemetry/ads', { sponsorId: 'no-existe', tipo: 'impresion' }));
    expect(res.status).toBe(404);
    expect((store['auspiciadores']?.size ?? 0)).toBe(0);
    expect((store['ads_daily']?.size ?? 0)).toBe(0);
  });

  it('rechaza payload inválido', async () => {
    expect((await trackPOST(req('/api/telemetry/ads', { sponsorId: '', tipo: 'otro' }))).status).toBe(400);
    expect((await trackPOST(req('/api/telemetry/ads', 'no-json'))).status).toBe(400);
  });
});
