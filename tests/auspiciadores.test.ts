import { describe, it, expect } from 'vitest';
import {
  auspiciadorSchema,
  estadoAuspiciador,
  isAuspiciadorPublicable,
  seleccionarAuspiciador,
  ctr,
  diasParaVencer,
  adsDailyId,
  toPublicAuspiciador,
  type Auspiciador,
} from '@/lib/ads/auspiciadores';

const NOW = new Date('2026-10-15T12:00:00Z');

function base(over: Partial<Auspiciador> = {}): Auspiciador {
  return {
    nombre: 'Restaurante Prueba',
    logoUrl: 'https://ejemplo.com/logo.png',
    url: 'https://wa.me/50588888888',
    posicion: 'articulo',
    activo: true,
    fechaInicio: '2026-10-01',
    fechaVencimiento: '2026-10-31',
    impresiones: 0,
    clics: 0,
    ...over,
  };
}

describe('auspiciadorSchema — validación de creación', () => {
  it('acepta un auspiciador válido', () => {
    const r = auspiciadorSchema.safeParse({
      nombre: 'Ferretería Central',
      logoUrl: 'https://x.com/l.png',
      url: 'https://wa.me/50512345678',
      posicion: 'articulo',
      activo: true,
      fechaInicio: '2026-10-15',
      fechaVencimiento: '2026-11-15',
    });
    expect(r.success).toBe(true);
  });

  it('rechaza URLs inválidas (logo y destino)', () => {
    for (const campo of ['logoUrl', 'url'] as const) {
      const r = auspiciadorSchema.safeParse({
        nombre: 'X'.repeat(3), logoUrl: 'https://a.com/l.png', url: 'https://b.com',
        fechaInicio: '2026-10-15', fechaVencimiento: '2026-11-15',
        [campo]: 'javascript:alert(1)',
      });
      expect(r.success).toBe(false);
    }
  });

  it('rechaza posición fuera del enum y fechas mal formadas', () => {
    expect(auspiciadorSchema.safeParse({
      nombre: 'Ok Negocio', logoUrl: 'https://a.com/l.png', url: 'https://b.com',
      posicion: 'sidebar', activo: true, fechaInicio: '2026-10-15', fechaVencimiento: '2026-11-15',
    }).success).toBe(false);
    expect(auspiciadorSchema.safeParse({
      nombre: 'Ok Negocio', logoUrl: 'https://a.com/l.png', url: 'https://b.com',
      posicion: 'articulo', activo: true, fechaInicio: '15/10/2026', fechaVencimiento: '2026-11-15',
    }).success).toBe(false);
  });

  it('rechaza nombre vacío o demasiado corto', () => {
    const r = auspiciadorSchema.safeParse({
      nombre: 'A', logoUrl: 'https://a.com/l.png', url: 'https://b.com',
      fechaInicio: '2026-10-15', fechaVencimiento: '2026-11-15',
    });
    expect(r.success).toBe(false);
  });
});

describe('estadoAuspiciador — vigencia', () => {
  it('activo dentro de la ventana', () => {
    expect(estadoAuspiciador(base(), NOW)).toBe('activo');
  });

  it('inactivo cuando activo=false aunque esté en fecha', () => {
    expect(estadoAuspiciador(base({ activo: false }), NOW)).toBe('inactivo');
  });

  it('programado antes del inicio', () => {
    expect(estadoAuspiciador(base({ fechaInicio: '2026-11-01' }), NOW)).toBe('programado');
  });

  it('vencido después del vencimiento', () => {
    expect(estadoAuspiciador(base({ fechaVencimiento: '2026-10-14' }), NOW)).toBe('vencido');
  });

  it('el día de vencimiento cubre el día completo (fecha corta)', () => {
    expect(estadoAuspiciador(base({ fechaVencimiento: '2026-10-15' }), NOW)).toBe('activo');
  });
});

describe('seleccionarAuspiciador — rotación y posición', () => {
  it('devuelve null sin vigentes', () => {
    expect(seleccionarAuspiciador([], 'articulo', NOW)).toBeNull();
    expect(seleccionarAuspiciador([base({ activo: false })], 'articulo', NOW)).toBeNull();
  });

  it('excluye posiciones distintas salvo ambos', () => {
    const portada = base({ posicion: 'portada' });
    const ambos = base({ posicion: 'ambos', nombre: 'Otro Negocio' });
    expect(seleccionarAuspiciador([portada], 'articulo', NOW)).toBeNull();
    expect(seleccionarAuspiciador([portada, ambos], 'articulo', NOW)?.posicion).toBe('ambos');
  });

  it('rota determinísticamente por día entre varios vigentes', () => {
    const lista = [base({ nombre: 'A' }), base({ nombre: 'B' })];
    const d1 = seleccionarAuspiciador(lista, 'articulo', NOW);
    const d2 = seleccionarAuspiciador(lista, 'articulo', new Date(NOW.getTime() + 86_400_000));
    expect(d1).not.toBeNull();
    expect(d2).not.toBeNull();
    expect(d1!.nombre).not.toBe(d2!.nombre);
  });

  it('ignora auspiciadores vencidos aunque activo=true', () => {
    const vencido = base({ fechaVencimiento: '2026-10-10' });
    const vigente = base({ nombre: 'Vigente' });
    expect(seleccionarAuspiciador([vencido, vigente], 'articulo', NOW)?.nombre).toBe('Vigente');
  });
});

describe('ctr — cálculo', () => {
  it('0 sin impresiones (sin NaN ni Infinity)', () => {
    expect(ctr(0, 0)).toBe(0);
    expect(ctr(0, 5)).toBe(0);
  });

  it('porcentaje con 2 decimales', () => {
    expect(ctr(200, 5)).toBe(2.5);
    expect(ctr(1000, 33)).toBe(3.3);
  });
});

describe('utilidades', () => {
  it('diasParaVencer cuenta días restantes', () => {
    // Oct 15 12:00Z → vencimiento Oct 25 23:59Z = 10.5d → ceil = 11
    expect(diasParaVencer('2026-10-25', NOW)).toBe(11);
    expect(diasParaVencer('2026-10-10', NOW)).toBeLessThan(0);
  });

  it('adsDailyId es sponsorId_fecha-UTC', () => {
    expect(adsDailyId('abc123', new Date('2026-10-15T03:00:00Z'))).toBe('abc123_2026-10-15');
  });

  it('toPublicAuspiciador expone solo campos públicos', () => {
    const p = toPublicAuspiciador('id1', base({ notas: 'secreto interno' }));
    expect(p).toEqual({
      id: 'id1', nombre: 'Restaurante Prueba',
      logoUrl: 'https://ejemplo.com/logo.png', bannerUrl: undefined,
      url: 'https://wa.me/50588888888',
    });
    expect('notas' in p).toBe(false);
    expect('impresiones' in p).toBe(false);
  });
});
