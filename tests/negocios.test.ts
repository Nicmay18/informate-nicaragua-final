// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  negocioSchema,
  solicitudSchema,
  campanaSchema,
  prospectoSchema,
  eventoMetricaSchema,
  slugifyNegocio,
  waLink,
  negocioDailyId,
  isNegocioPublicable,
  toPublicNegocio,
  diasParaVencer,
  ctrPct,
  campanaVigente,
  type Negocio,
} from '@/lib/negocios/modelo';

const baseNegocio = {
  nombre: 'Pupusería Doña Ana',
  slug: 'pupuseria-dona-ana',
  descripcion: 'Pupusas y comida típica en el centro de Masaya, abierto todos los días.',
  categoria: 'Restaurantes y comida',
  departamento: 'Masaya',
  plan: 'basico',
  estado: 'aprobado',
  destacado: false,
};

describe('negocios — schemas', () => {
  it('acepta un negocio válido mínimo', () => {
    const r = negocioSchema.safeParse(baseNegocio);
    expect(r.success).toBe(true);
  });

  it('rechaza whatsapp con formato libre (solo dígitos internacionales)', () => {
    expect(negocioSchema.safeParse({ ...baseNegocio, whatsapp: '+505 8888-1234' }).success).toBe(false);
    expect(negocioSchema.safeParse({ ...baseNegocio, whatsapp: '50588881234' }).success).toBe(true);
  });

  it('rechaza URL javascript: en web y fotos', () => {
    expect(negocioSchema.safeParse({ ...baseNegocio, web: 'javascript:alert(1)' }).success).toBe(false);
    expect(negocioSchema.safeParse({ ...baseNegocio, fotos: ['javascript:alert(1)'] }).success).toBe(false);
    expect(negocioSchema.safeParse({ ...baseNegocio, web: 'https://negocio.com' }).success).toBe(true);
  });

  it('rechaza categoría y departamento fuera del catálogo', () => {
    expect(negocioSchema.safeParse({ ...baseNegocio, categoria: 'Piratería' }).success).toBe(false);
    expect(negocioSchema.safeParse({ ...baseNegocio, departamento: 'San José' }).success).toBe(false);
  });

  it('slugify genera slug válido con tildes y ñ', () => {
    expect(slugifyNegocio('Pupusería Doña Ana — Masaya')).toBe('pupuseria-dona-ana-masaya');
    expect(slugifyNegocio('Óptica Niño Jesús')).toBe('optica-nino-jesus');
  });
});

describe('negocios — solicitud pública', () => {
  const sol = {
    tipo: 'alta',
    nombre: 'Barbería El Corte',
    descripcion: 'Cortes y arreglo de barba en Chinandega centro.',
    categoria: 'Belleza y barbería',
    departamento: 'Chinandega',
    consentimiento: true,
  };

  it('acepta solicitud de alta válida con honeypot vacío', () => {
    expect(solicitudSchema.safeParse({ ...sol, sitio: '' }).success).toBe(true);
    expect(solicitudSchema.safeParse(sol).success).toBe(true);
  });

  it('rechaza honeypot lleno (bot)', () => {
    expect(solicitudSchema.safeParse({ ...sol, sitio: 'http://spam' }).success).toBe(false);
  });

  it('exige perfil y texto de corrección; la existencia se valida en la ruta', () => {
    expect(solicitudSchema.safeParse({ ...sol, tipo: 'correccion' }).success).toBe(false);
    expect(solicitudSchema.safeParse({ ...sol, tipo: 'correccion', negocioId: 'perfil', correccion: 'Horario nuevo' }).success).toBe(true);
    expect(solicitudSchema.safeParse({ ...sol, consentimiento: false }).success).toBe(false);
  });
});

describe('negocios — regla comercial de pago', () => {
  const camp = {
    negocioId: 'abc123',
    planId: 'basico',
    precioAcordadoUsd: 10,
    fechaInicio: '2026-10-01',
    fechaVencimiento: '2026-11-01',
    estadoPago: 'pendiente',
  };

  it('schema acepta campaña pendiente sin referencia', () => {
    expect(campanaSchema.safeParse(camp).success).toBe(true);
  });

  it('exige referencia, importe y confirmación explícita para registrar un pago', () => {
    const paid = { ...camp, estadoPago: 'pagado', referenciaPago: 'PRUEBA-123', pagoConfirmado: true };
    expect(campanaSchema.safeParse(paid).success).toBe(true);
    for (const invalid of [{ referenciaPago: '' }, { pagoConfirmado: false }, { precioAcordadoUsd: 0 }]) {
      expect(campanaSchema.safeParse({ ...paid, ...invalid }).success).toBe(false);
    }
  });

  it('rechaza vigencia invertida a nivel de datos', () => {
    expect(campanaSchema.safeParse({ ...camp, fechaVencimiento: '2026-09-01' }).success).toBe(false);
    expect(campanaSchema.safeParse({ ...camp, fechaInicio: '2026-02-30' }).success).toBe(false);
  });
});

describe('negocios — publicación', () => {
  it('solo estado aprobado es publicable', () => {
    for (const estado of ['borrador', 'pendiente', 'rechazado', 'suspendido'] as const) {
      expect(isNegocioPublicable({ estado, vigenteHasta: '' })).toBe(false);
    }
    expect(isNegocioPublicable({ estado: 'aprobado', vigenteHasta: '' })).toBe(true);
  });

  it('vigencia: fecha-corta cubre el día completo', () => {
    const n = { estado: 'aprobado' as const, vigenteHasta: '2026-10-21' };
    expect(isNegocioPublicable(n, new Date('2026-10-21T12:00:00Z'))).toBe(true);
    expect(isNegocioPublicable(n, new Date('2026-10-22T00:00:01Z'))).toBe(false);
  });

  it('vista pública no expone notas internas', () => {
    const full = negocioSchema.parse({ ...baseNegocio, notasInternas: 'paga en efectivo, negociar' }) as Negocio;
    const pub = toPublicNegocio('id1', full);
    expect(JSON.stringify(pub)).not.toContain('negociar');
    expect('notasInternas' in pub).toBe(false);
  });
});

describe('negocios — métricas', () => {
  it('dailyId estable por día UTC', () => {
    expect(negocioDailyId('abc', new Date('2026-10-21T23:00:00Z'))).toBe('abc_2026-10-21');
  });

  it('waLink produce wa.me seguro y con mensaje codificado', () => {
    expect(waLink('50588881234')).toBe('https://wa.me/50588881234');
    expect(waLink('50588881234', 'Hola Mundo')).toBe('https://wa.me/50588881234?text=Hola%20Mundo');
    expect(waLink('505-8888-1234')).toBe('https://wa.me/50588881234');
  });

  it('ctr 2 decimales y 0 sin impresiones', () => {
    expect(ctrPct(0, 0)).toBe(0);
    expect(ctrPct(200, 3)).toBe(1.5);
  });

  it('eventoMetricaSchema rechaza tipos arbitrarios', () => {
    const event = { negocioId: 'x', tipo: 'whatsapp', sessionId: 'test-session' };
    expect(eventoMetricaSchema.safeParse(event).success).toBe(true);
    expect(eventoMetricaSchema.safeParse({ ...event, tipo: 'hackeo' }).success).toBe(false);
    expect(eventoMetricaSchema.safeParse({ ...event, sessionId: '' }).success).toBe(false);
  });
});

describe('negocios — prospectos', () => {
  it('estado por defecto nuevo y seguimiento opcional', () => {
    const p = prospectoSchema.parse({ negocio: 'Farmacia San José' });
    expect(p.estado).toBe('nuevo');
    expect(p.proximoSeguimiento).toBe('');
  });
});

describe('negocios — vencimiento de campaña', () => {
  it('solo patrocina durante fechas inclusivas y con pago verificado', () => {
    const c = { estadoPago: 'pagado', pagoConfirmado: true, referenciaPago: 'PRUEBA',
      verificadoAt: '2026-10-01', fechaInicio: '2026-10-01', fechaVencimiento: '2026-10-31' };
    expect(campanaVigente(c, new Date('2026-10-31T23:59:59Z'))).toBe(true);
    expect(campanaVigente(c, new Date('2026-11-01T00:00:00Z'))).toBe(false);
    expect(campanaVigente(c, new Date('2026-09-30T23:59:59Z'))).toBe(false);
    expect(campanaVigente({ ...c, verificadoAt: null }, new Date('2026-10-10'))).toBe(false);
  });
  it('diasParaVencer negativo si venció', () => {
    expect(diasParaVencer('2026-10-01', new Date('2026-10-21'))).toBeLessThan(0);
    expect(diasParaVencer('2026-10-31', new Date('2026-10-21'))).toBeGreaterThanOrEqual(10);
  });
});

// --- Rutas admin: verificación de autorización real (sin mocks de auth) ---
vi.mock('@/lib/firebase-admin', () => ({ getAdminDb: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));

describe('negocios — endpoints admin rechazan sin sesión', () => {
  beforeEach(() => {
    process.env.ADMIN_API_KEY = 'test-admin-key';
  });
  afterEach(() => {
    delete process.env.ADMIN_API_KEY;
  });

  const routes = [
    '@/app/api/admin/negocios/route',
    '@/app/api/admin/negocios-planes/route',
    '@/app/api/admin/negocios-prospectos/route',
    '@/app/api/admin/negocios-campanas/route',
    '@/app/api/admin/negocios-solicitudes/route',
    '@/app/api/admin/negocios-reporte/route',
  ];

  it.each(routes)('%s GET → 401 sin credenciales', async (mod) => {
    const { GET } = await import(mod);
    const req = new Request('https://x.test' + mod.replace('@/app', '').replace('/route', ''), { method: 'GET' });
    const res = await GET(req as never, undefined as never);
    expect(res.status).toBe(401);
  });
});
