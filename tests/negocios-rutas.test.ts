// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Pruebas de rutas del módulo Negocios contra un Firestore en memoria.
 * La autenticación NO se mockea: las rutas usan isAdminRequest real
 * (ADMIN_API_KEY del entorno). Solo se sustituye la base de datos.
 */

type Doc = Record<string, unknown>;
type Filter = [string, string, unknown];

function createFakeDb() {
  const store = new Map<string, Map<string, Doc>>();
  const col = (name: string) => {
    if (!store.has(name)) store.set(name, new Map());
    return store.get(name)!;
  };
  let autoId = 0;
  const resolveInc = (v: unknown, prev: unknown): unknown =>
    (v && typeof v === 'object' && '__inc' in v) ? (Number(prev) || 0) + (v as { __inc: number }).__inc : v;
  const mergeDeep = (base: Doc, patch: Doc): Doc => {
    const out: Doc = { ...base };
    for (const [k, v] of Object.entries(patch)) {
      out[k] = (v && typeof v === 'object' && !Array.isArray(v) && !('__inc' in v))
        ? mergeDeep((out[k] as Doc) ?? {}, v as Doc) : resolveInc(v, out[k]);
    }
    return out;
  };
  const docRef = (name: string, id?: string): Record<string, unknown> => {
    const refId = id ?? `auto-${++autoId}`;
    const ref = {
      id: refId,
      get: async () => {
        const d = col(name).get(refId);
        return { id: refId, ref, exists: d !== undefined, data: () => d };
      },
      set: async (data: Doc, opts?: { merge?: boolean }) => {
        const c = col(name);
        c.set(refId, opts?.merge ? mergeDeep(c.get(refId) ?? {}, data) : { ...data });
      },
    };
    return ref;
  };
  const runQuery = (name: string, filters: Filter[], lim: number, sel?: string[]) => {
    let docs = [...col(name).entries()].filter(([, d]) =>
      filters.every(([f, op, v]) => (op === 'in' ? (v as unknown[]).includes(d?.[f]) : d?.[f] === v)));
    if (lim) docs = docs.slice(0, lim);
    return {
      docs: docs.map(([id, d]) => ({ id, exists: true, data: () => (sel ? Object.fromEntries(sel.map((k) => [k, d?.[k]])) : d) })),
      size: docs.length,
    };
  };
  const query = (name: string, filters: Filter[] = [], lim = 0, sel?: string[]): Record<string, unknown> => ({
    where: (f: string, op: string, v: unknown) => query(name, [...filters, [f, op, v]], lim, sel),
    limit: (n: number) => query(name, filters, n, sel),
    select: (...f: string[]) => query(name, filters, lim, f),
    get: async () => runQuery(name, filters, lim, sel),
  });
  const db: Record<string, unknown> = {
    collection: (name: string) => ({
      doc: (id?: string) => docRef(name, id),
      where: (f: string, op: string, v: unknown) => query(name, [[f, op, v]]),
      limit: (n: number) => query(name, [], n),
      select: (...f: string[]) => query(name, [], 0, f),
      add: async (data: Doc) => { const r = docRef(name); await (r.set as (d: Doc) => Promise<void>)(data); return r; },
      get: async () => runQuery(name, [], 0),
    }),
    runTransaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const writes: (() => Promise<void>)[] = [];
      const result = await fn({
        get: (x: { get: () => Promise<unknown> }) => {
          if (writes.length) throw new Error('Lectura después de escritura en transacción');
          return x.get();
        },
        set: (ref: { set: (d: Doc, o?: unknown) => Promise<void> }, data: Doc, opts?: unknown) => {
          writes.push(() => ref.set(data, opts));
        },
      });
      for (const write of writes) await write();
      return result;
    },
    _store: store,
  };
  return db as typeof db & { collection: (name: string) => any };
}

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { increment: (n: number) => ({ __inc: n }) },
}));

const getAdminDbMock = vi.fn();
vi.mock('@/lib/firebase-admin', () => ({ getAdminDb: () => getAdminDbMock() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock('@/lib/data', () => ({ getSitemapNews: vi.fn(async () => []) }));
vi.mock('@/lib/authors', () => ({ getAllAuthors: () => [] }));
vi.mock('@/lib/evergreen', () => ({ getAllEvergreen: () => [] }));
vi.mock('@/lib/topics', () => ({ getAllTemaSlugs: () => [] }));

const ADMIN = 'test-admin-key';
let requestSequence = 0;
function req(path: string, o: { method?: string; body?: unknown; admin?: boolean; origin?: string; ua?: string; ip?: string } = {}) {
  const headers: Record<string, string> = {};
  if (o.body !== undefined) headers['content-type'] = 'application/json';
  if (o.admin) headers['x-admin-token'] = ADMIN;
  if (o.origin) headers['origin'] = o.origin;
  if (o.ua) headers['user-agent'] = o.ua;
  headers['x-forwarded-for'] = o.ip ?? `test-client-${++requestSequence}`;
  return new Request(`https://ni.test${path}`, {
    method: o.method ?? (o.body !== undefined ? 'POST' : 'GET'), headers,
    ...(o.body !== undefined ? { body: JSON.stringify(o.body) } : {}),
  });
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });

const NEGOCIO = {
  nombre: 'Pupusería Doña Ana', slug: 'pupuseria-dona-ana',
  descripcion: 'Pupusas y comida típica en el centro de Masaya.',
  categoria: 'Restaurantes y comida', departamento: 'Masaya', whatsapp: '50588881234',
};
const PLAN = { nombre: 'Básico', precioUsd: 10, features: ['Perfil revisado'], orden: 1, activo: true };
const CAMPANA = (o: Partial<Doc> = {}) => ({
  negocioId: 'pupuseria-dona-ana', planId: 'plan-1', precioAcordadoUsd: 10,
  fechaInicio: '2026-10-20', fechaVencimiento: '2026-11-20', estadoPago: 'pendiente', ...o,
});

let db: ReturnType<typeof createFakeDb>;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-21T12:00:00Z'));
  vi.stubEnv('ADMIN_API_KEY', ADMIN);
  db = createFakeDb();
  getAdminDbMock.mockReturnValue(db);
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

async function seed(pathCol: string, id: string, data: Doc) {
  await ((db.collection(pathCol) as { doc: (i: string) => { set: (d: Doc) => Promise<void> } }).doc(id)).set(data);
}
const getDoc = async (c: string, id: string): Promise<any> => db.collection(c).doc(id).get();

describe('rutas — solicitud pública', () => {
  it('alta válida queda pendiente y campos extra se descartan', async () => {
    const { POST } = await import('@/app/api/negocios/solicitud/route');
    const res = await POST(req('/api/negocios/solicitud', {
      body: { tipo: 'alta', nombre: 'Barbería El Corte', descripcion: 'Cortes y barba en Chinandega centro.', consentimiento: true, rol: 'admin', precio: 0 },
    }));
    expect(res.status).toBe(201);
    const stored = [...(db._store as Map<string, Map<string, Doc>>).get('negocios_solicitudes')!.values()][0];
    expect(stored.estado).toBe('pendiente');
    expect((stored.datos as Doc).rol).toBeUndefined();
    expect((stored.datos as Doc).precio).toBeUndefined();
  });

  it('rechaza honeypot, sin consentimiento y corrección sin texto', async () => {
    const { POST } = await import('@/app/api/negocios/solicitud/route');
    const base = { tipo: 'alta', nombre: 'Tienda X', descripcion: 'Una tienda con descripción válida.', consentimiento: true };
    expect((await POST(req('/api/negocios/solicitud', { body: { ...base, sitio: 'http://bot' } }))).status).toBe(400);
    expect((await POST(req('/api/negocios/solicitud', { body: { ...base, consentimiento: false } }))).status).toBe(400);
    expect((await POST(req('/api/negocios/solicitud', { body: { tipo: 'correccion', negocioId: 'x', nombre: 'N N', descripcion: 'descripcion ok ok', consentimiento: true } }))).status).toBe(400);
  });

  it('corrección sobre perfil inexistente → 404; origen cruzado → 403', async () => {
    const { POST } = await import('@/app/api/negocios/solicitud/route');
    const body = { tipo: 'correccion', negocioId: 'no-existe', nombre: 'N N', descripcion: 'descripcion ok ok', correccion: 'Horario nuevo', consentimiento: true };
    expect((await POST(req('/api/negocios/solicitud', { body }))).status).toBe(404);
    expect((await POST(req('/api/negocios/solicitud', { body, origin: 'https://evil.test' }))).status).toBe(403);
  });
});

describe('rutas — administración de perfiles', () => {
  const endpoints = [
    ['negocios', ['GET', 'POST']],
    ['negocios/[id]', ['GET', 'PUT', 'PATCH']],
    ['negocios-planes', ['GET', 'POST', 'PUT']],
    ['negocios-prospectos', ['GET', 'POST', 'PUT']],
    ['negocios-campanas', ['GET', 'POST', 'PUT']],
    ['negocios-solicitudes', ['GET', 'PUT']],
    ['negocios-reporte', ['GET']],
    ['negocios-auditoria', ['GET']],
  ] as const;
  it.each(endpoints)('%s protege cada método incluso sin middleware', async (path, methods) => {
    const route = await import(`@/app/api/admin/${path}/route`);
    for (const method of methods) {
      for (const headers of [{}, { cookie: 'admin_session=falso' }, { 'x-admin-token': 'falso' },
        { 'x-cron-secret': 'cron-prueba' }, { 'x-admin-key': 'cleanup-prueba' }, { 'x-role': 'admin' }]) {
        const request = new NextRequest(`https://ni.test/api/admin/${path}`, { method, headers });
        expect((await route[method](request, params('x'))).status).toBe(401);
      }
    }
  });

  it('rechaza acciones cross-site autenticadas, URLs peligrosas y cuerpos excesivos', async () => {
    const { POST } = await import('@/app/api/admin/negocios/route');
    expect((await POST(req('/api/admin/negocios', { admin: true, body: NEGOCIO, origin: 'https://evil.test' }))).status).toBe(403);
    for (const web of ['javascript:alert(1)', 'data:text/html,malicioso', 'https://usuario:clave@example.org', 'no es una url']) {
      expect((await POST(req('/api/admin/negocios', { admin: true, body: { ...NEGOCIO, web } }))).status).toBe(400);
    }
    expect((await POST(req('/api/admin/negocios', { admin: true, body: { ...NEGOCIO, descripcion: 'a'.repeat(25000) } }))).status).toBe(400);
    expect((await POST(req('/api/admin/negocios', { admin: true, body: { ...NEGOCIO, fotos: ['javascript:alert(1)'] } }))).status).toBe(400);
  });
  it('sin sesión: POST/PATCH/PUT → 401', async () => {
    const admin = await import('@/app/api/admin/negocios/route');
    const byId = await import('@/app/api/admin/negocios/[id]/route');
    expect((await admin.POST(req('/api/admin/negocios', { body: NEGOCIO }))).status).toBe(401);
    expect((await byId.PUT(req('/api/admin/negocios/x', { method: 'PUT', body: NEGOCIO }), params('x'))).status).toBe(401);
    expect((await byId.PATCH(req('/api/admin/negocios/x', { method: 'PATCH', body: { estado: 'aprobado' } }), params('x'))).status).toBe(401);
  });

  it('crea como pendiente (aunque pidan aprobado), slug duplicado → 409', async () => {
    const { POST } = await import('@/app/api/admin/negocios/route');
    const res1 = await POST(req('/api/admin/negocios', { admin: true, body: { ...NEGOCIO, estado: 'aprobado' } }));
    expect(res1.status).toBe(201);
    expect((await getDoc('negocios', NEGOCIO.slug)).data!().estado).toBe('pendiente');
    expect((await POST(req('/api/admin/negocios', { admin: true, body: NEGOCIO }))).status).toBe(409);
  });

  it('PATCH aprueba; PUT con otro slug → permanente; estado inválido → 400', async () => {
    await seed('negocios', 'perfil-1', { ...NEGOCIO, slug: 'perfil-1', estado: 'pendiente' });
    const byId = await import('@/app/api/admin/negocios/[id]/route');
    expect((await byId.PATCH(req('/api/admin/negocios/perfil-1', { method: 'PATCH', admin: true, body: { estado: 'aprobado' } }), params('perfil-1'))).status).toBe(200);
    expect((await getDoc('negocios', 'perfil-1')).data!().estado).toBe('aprobado');
    expect((await byId.PATCH(req('/api/admin/negocios/perfil-1', { method: 'PATCH', admin: true, body: { estado: 'pendiente' } }), params('perfil-1'))).status).toBe(400);
    expect((await byId.PUT(req('/api/admin/negocios/perfil-1', { method: 'PUT', admin: true, body: { ...NEGOCIO, slug: 'otro-slug' } }), params('perfil-1'))).status).toBe(400);
  });
});

describe('rutas — campañas y pago verificable', () => {
  beforeEach(async () => {
    await seed('negocios', 'pupuseria-dona-ana', { ...NEGOCIO, estado: 'aprobado' });
    await seed('negocios_planes', 'plan-1', PLAN);
  });

  it('pagado sin evidencia → 400; con evidencia → 201 + verificadoAt/Por', async () => {
    const { POST } = await import('@/app/api/admin/negocios-campanas/route');
    expect((await POST(req('/api/admin/negocios-campanas', { admin: true, body: CAMPANA({ estadoPago: 'pagado' }) }))).status).toBe(400);
    expect((await POST(req('/api/admin/negocios-campanas', { admin: true, body: CAMPANA({ estadoPago: 'pagado', referenciaPago: 'TRX-1' }) }))).status).toBe(400);
    const ok = await POST(req('/api/admin/negocios-campanas', { admin: true, body: CAMPANA({ estadoPago: 'pagado', referenciaPago: 'TRX-1', pagoConfirmado: true }) }));
    expect(ok.status).toBe(201);
    const { id } = await ok.json();
    const c = (await getDoc('negocios_campanas', id)).data!();
    expect(c.verificadoAt).toBeTruthy();
    expect(String(c.verificadoPor)).toContain('admin:');
    const audits = [...(db._store as Map<string, Map<string, Doc>>).get('negocios_audit')!.values()];
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({ entidad: 'negocios_campanas', entidadId: id,
      diff: { referenciaPago: { despues: 'TRX-1' }, estadoPago: { despues: 'pagado' },
        verificadoPor: { despues: c.verificadoPor } } });
  });

  it('campaña pagada queda cerrada: modificar pago → 409', async () => {
    await seed('negocios_campanas', 'camp-1', CAMPANA({ estadoPago: 'pagado', pagoConfirmado: true, referenciaPago: 'TRX-1', verificadoAt: 'x', verificadoPor: 'admin:x' }));
    const { PUT } = await import('@/app/api/admin/negocios-campanas/route');
    const res = await PUT(req('/api/admin/negocios-campanas?id=camp-1', { method: 'PUT', admin: true, body: CAMPANA({ estadoPago: 'pagado', referenciaPago: 'TRX-1', pagoConfirmado: true }) }));
    expect(res.status).toBe(409);
  });

  it('piloto: >45d, con pago o con renovación → 400', async () => {
    const { POST } = await import('@/app/api/admin/negocios-campanas/route');
    expect((await POST(req('/api/admin/negocios-campanas', { admin: true, body: CAMPANA({ estadoPago: 'piloto', fechaVencimiento: '2027-02-01' }) }))).status).toBe(400);
    expect((await POST(req('/api/admin/negocios-campanas', { admin: true, body: CAMPANA({ estadoPago: 'piloto', pagoConfirmado: true }) }))).status).toBe(400);
    expect((await POST(req('/api/admin/negocios-campanas', { admin: true, body: CAMPANA({ estadoPago: 'piloto', referenciaPago: 'X' }) }))).status).toBe(400);
    expect((await POST(req('/api/admin/negocios-campanas', { admin: true, body: CAMPANA({ estadoPago: 'piloto', renovacionDe: 'camp-1' }) }))).status).toBe(400);
  });

  it('piloto válido → 201 y activa patrocinio; máximo 3 pilotos activos', async () => {
    const { POST } = await import('@/app/api/admin/negocios-campanas/route');
    await seed('negocios', 'n2', { ...NEGOCIO, slug: 'n2', estado: 'aprobado' });
    await seed('negocios', 'n3', { ...NEGOCIO, slug: 'n3', estado: 'aprobado' });
    await seed('negocios', 'n4', { ...NEGOCIO, slug: 'n4', estado: 'aprobado' });
    const piloto = (negocioId: string) => CAMPANA({ negocioId, estadoPago: 'piloto', precioAcordadoUsd: 0 });
    expect((await POST(req('/api/admin/negocios-campanas', { admin: true, body: piloto('pupuseria-dona-ana') }))).status).toBe(201);
    expect((await POST(req('/api/admin/negocios-campanas', { admin: true, body: piloto('n2') }))).status).toBe(201);
    expect((await POST(req('/api/admin/negocios-campanas', { admin: true, body: piloto('n3') }))).status).toBe(201);
    expect((await POST(req('/api/admin/negocios-campanas', { admin: true, body: piloto('n4') }))).status).toBe(409);
    const { listarNegociosPublicos } = await import('@/lib/negocios/datos');
    const items = await listarNegociosPublicos();
    expect(items.find((n) => n.slug === 'pupuseria-dona-ana')!.patrocinado).toBe(true);
    vi.setSystemTime(new Date('2026-11-21T00:00:00Z'));
    expect((await listarNegociosPublicos()).map((n) => n.id)).toEqual(['n4']);
  });

  it('campañas activas solapadas del mismo negocio → 409', async () => {
    await seed('negocios_campanas', 'camp-p', CAMPANA({ estadoPago: 'piloto' }));
    const { POST } = await import('@/app/api/admin/negocios-campanas/route');
    const res = await POST(req('/api/admin/negocios-campanas', { admin: true, body: CAMPANA({ estadoPago: 'pagado', referenciaPago: 'TRX-9', pagoConfirmado: true }) }));
    expect(res.status).toBe(409);
  });

  it('resumen: piloto no suma a cobrado ni pendiente', async () => {
    const { GET } = await import('@/app/api/admin/negocios-campanas/route');
    await seed('negocios_campanas', 'c1', CAMPANA({ estadoPago: 'piloto' }));
    await seed('negocios_campanas', 'c2', CAMPANA({ estadoPago: 'pagado', pagoConfirmado: true, referenciaPago: 'R', verificadoAt: 'x' }));
    const res = await GET(req('/api/admin/negocios-campanas', { admin: true }));
    const j = await res.json();
    expect(j.resumen.cobradoUsd).toBe(10);
    expect(j.resumen.pilotosActivos).toBe(1);
    expect(j.resumen.pendienteUsd).toBe(0);
  });
});

describe('rutas — telemetría', () => {
  beforeEach(async () => {
    await seed('negocios', 'n-ok', { ...NEGOCIO, slug: 'n-ok', estado: 'aprobado' });
    await seed('negocios', 'n-exp', { ...NEGOCIO, slug: 'n-exp', estado: 'aprobado', vigenteHasta: '2020-01-01' });
    await seed('negocios', 'n-pend', { ...NEGOCIO, slug: 'n-pend', estado: 'pendiente' });
  });

  const evento = (negocioId: string, tipo = 'vista', ip?: string) =>
    req('/api/telemetry/negocios', { body: { negocioId, tipo, sessionId: 'sesion-1234' }, ip });

  it('cuenta vista, deduplica la repetición y rechaza tipo forjado', async () => {
    const { POST } = await import('@/app/api/telemetry/negocios/route');
    const ip = '10.20.30.40';
    expect((await POST(evento('n-ok', 'vista', ip))).status).toBe(200);
    const again = await POST(evento('n-ok', 'vista', ip));
    expect((await again.json()).dedup).toBe(true);
    expect((await POST(evento('n-ok', 'compra', ip))).status).toBe(400);
    expect((await POST(req('/api/telemetry/negocios', { body: { negocioId: 'n-ok', tipo: 'vista', sessionId: 'x' }, ip }))).status).toBe(400);
  });

  it('perfil vencido o pendiente → 404; bot → ignorado; cross-site → 403', async () => {
    const { POST } = await import('@/app/api/telemetry/negocios/route');
    expect((await POST(evento('n-exp'))).status).toBe(404);
    expect((await POST(evento('n-pend'))).status).toBe(404);
    const bot = await POST(req('/api/telemetry/negocios', { body: { negocioId: 'n-ok', tipo: 'vista', sessionId: 'sesion-1234' }, ua: 'Googlebot/2.1' }));
    expect((await bot.json()).ignored).toBe(true);
    expect((await POST(req('/api/telemetry/negocios', { body: { negocioId: 'n-ok', tipo: 'vista', sessionId: 'sesion-1234' }, origin: 'https://evil.test' }))).status).toBe(403);
  });

  it('no permite inyectar contadores/campañas ni evadir dedup rotando sesión', async () => {
    const { POST } = await import('@/app/api/telemetry/negocios/route');
    const event = { negocioId: 'n-ok', tipo: 'vista', sessionId: 'session-one' };
    expect((await POST(req('/api/telemetry/negocios', { body: { ...event, vistas: 1000 } }))).status).toBe(400);
    expect((await POST(req('/api/telemetry/negocios', { body: { ...event, campanaId: 'falsa' } }))).status).toBe(400);
    const ip = 'same-network';
    await POST(req('/api/telemetry/negocios', { body: event, ip }));
    const duplicate = await POST(req('/api/telemetry/negocios', { body: { ...event, sessionId: 'session-two' }, ip }));
    expect((await duplicate.json()).dedup).toBe(true);
    expect((await getDoc('negocios_daily', 'n-ok_2026-10-21')).data().vistas).toBe(1);
    // La ventana es móvil: cruzar una marca fija del reloj no reinicia dedup.
    vi.setSystemTime(new Date('2026-10-21T12:09:59Z'));
    expect((await (await POST(req('/api/telemetry/negocios', { body: event, ip }))).json()).dedup).toBe(true);
    vi.setSystemTime(new Date('2026-10-21T12:10:00Z'));
    expect((await (await POST(req('/api/telemetry/negocios', { body: event, ip }))).json()).dedup).toBe(false);
    expect((await getDoc('negocios_daily', 'n-ok_2026-10-21')).data().vistas).toBe(2);
  });
});

describe('rutas — reporte CSV y auditoría', () => {
  it('CSV con métricas reales y nota honesta; sin sesión → 401', async () => {
    await seed('negocios', 'n1', { ...NEGOCIO, slug: 'n1', estado: 'aprobado' });
    const day = new Date().toISOString().slice(0, 10);
    await seed('negocios_daily', `n1_${day}`, { vistas: 5, clics_whatsapp: 2 });
    const { GET } = await import('@/app/api/admin/negocios-reporte/route');
    const unauth = await GET(new NextRequest('https://ni.test/api/admin/negocios-reporte?negocioId=n1'));
    expect(unauth.status).toBe(401);
    const res = await GET(new NextRequest('https://ni.test/api/admin/negocios-reporte?negocioId=n1&dias=7', { headers: { 'x-admin-token': ADMIN } }));
    expect(res.status).toBe(200);
    const csv = await res.text();
    expect(csv).toContain(`TOTAL,5,2,0,0`);
    expect(csv).toContain('no equivalen a conversaciones');
    expect(res.headers.get('content-type')).toContain('text/csv');
  });

  it('cada mutación deja registro auditable sin datos privados', async () => {
    const { POST } = await import('@/app/api/admin/negocios/route');
    await POST(req('/api/admin/negocios', { admin: true, body: { ...NEGOCIO, notasInternas: 'secreto-comercial' } }));
    const audits = [...(db._store as Map<string, Map<string, Doc>>).get('negocios_audit')!.values()];
    expect(audits.length).toBe(1);
    expect(audits[0].accion).toBe('crear');
    expect(String(audits[0].actor)).toContain('admin:');
    expect(JSON.stringify(audits[0].diff)).not.toContain('secreto-comercial');
  });
});

describe('rutas — directorio público y estados', () => {
  it('solo aprobado y vigente aparece; vencido/suspendido/rechazado quedan fuera', async () => {
    await seed('negocios', 'ok', { ...NEGOCIO, slug: 'ok', estado: 'aprobado' });
    await seed('negocios', 'exp', { ...NEGOCIO, slug: 'exp', estado: 'aprobado', vigenteHasta: '2020-01-01' });
    await seed('negocios', 'pend', { ...NEGOCIO, slug: 'pend', estado: 'pendiente' });
    await seed('negocios', 'susp', { ...NEGOCIO, slug: 'susp', estado: 'suspendido' });
    await seed('negocios', 'rech', { ...NEGOCIO, slug: 'rech', estado: 'rechazado' });
    const { listarNegociosPublicos, getNegocioPublicoBySlug } = await import('@/lib/negocios/datos');
    const items = await listarNegociosPublicos();
    expect(items.map((n) => n.slug)).toEqual(['ok']);
    expect(await getNegocioPublicoBySlug('exp')).toBeNull();
    expect(await getNegocioPublicoBySlug('pend')).toBeNull();
    const { GET } = await import('@/app/api/negocios/route');
    const res = await GET(new NextRequest('https://ni.test/api/negocios'));
    const j = await res.json();
    expect(j.items.map((n: { slug: string }) => n.slug)).toEqual(['ok']);
    const { default: sitemap, dynamic } = await import('@/app/sitemap');
    expect(dynamic).toBe('force-dynamic');
    const businessUrls = (await sitemap()).filter((x) => x.url.includes('/negocios/')).map((x) => x.url);
    expect(businessUrls).toEqual(expect.arrayContaining(['https://nicaraguainformate.com/negocios/ok']));
    for (const slug of ['exp', 'pend', 'susp', 'rech']) expect(businessUrls).not.toContain(`https://nicaraguainformate.com/negocios/${slug}`);
    await seed('negocios', 'ok', { ...NEGOCIO, slug: 'ok', estado: 'suspendido' });
    expect((await sitemap()).some((x) => x.url.endsWith('/negocios/ok'))).toBe(false);
  });
});
