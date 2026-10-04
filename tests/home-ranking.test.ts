import { describe, it, expect } from 'vitest';
import {
  articleAgeHours,
  isFrontPageEligible,
  FRONT_PAGE_MAX_AGE_HOURS,
  rankNoticias,
} from '@/lib/home-ranking';
import type { Noticia } from '@/lib/types';

const NOW = new Date('2026-10-01T18:00:00Z').getTime();

function noticia(slug: string, ageHours: number, extra: Partial<Noticia> = {}): Noticia {
  return {
    id: slug,
    slug,
    titulo: `Nota ${slug}`,
    resumen: 'Resumen de prueba',
    imagen: '/images/x.png',
    categoria: 'Nacionales',
    fecha: new Date(NOW - ageHours * 3600 * 1000).toISOString(),
    estado: 'publicado',
    ...extra,
  };
}

describe('articleAgeHours', () => {
  it('mide horas desde fecha de publicación', () => {
    expect(articleAgeHours(noticia('a', 6), NOW)).toBeCloseTo(6);
  });
  it('usa fechaPublicacion cuando existe (no la edición técnica)', () => {
    const n = noticia('b', 200, { fechaPublicacion: new Date(NOW - 3600e3).toISOString() });
    expect(articleAgeHours(n, NOW)).toBeCloseTo(1);
  });
  it('fecha inválida → Infinity (no elegible como reciente)', () => {
    const n = noticia('c', 0, { fecha: 'basura' });
    expect(articleAgeHours(n, NOW)).toBe(Infinity);
  });
});

describe('isFrontPageEligible — gate de posiciones primarias', () => {
  it('noticia de <48h es elegible sin actividad', () => {
    expect(isFrontPageEligible(noticia('a', 10), new Set(), NOW)).toBe(true);
    expect(isFrontPageEligible(noticia('a', 47.9), new Set(), NOW)).toBe(true);
  });

  it('noticia de >48h NO es elegible sin actividad medida', () => {
    expect(isFrontPageEligible(noticia('vieja', 72), new Set(), NOW)).toBe(false);
    // aunque tenga MENI perfecto y muchas vistas históricas
    expect(isFrontPageEligible(
      noticia('vieja', 96, { scoreMeni: 100, vistas: 99999 }),
      new Set(),
      NOW,
    )).toBe(false);
  });

  it('noticia vieja CON tráfico medido hoy sí es elegible', () => {
    const active = new Set(['vieja']);
    expect(isFrontPageEligible(noticia('vieja', 200), active, NOW)).toBe(true);
  });

  it('el umbral es exactamente FRONT_PAGE_MAX_AGE_HOURS', () => {
    expect(isFrontPageEligible(noticia('a', FRONT_PAGE_MAX_AGE_HOURS), new Set(), NOW)).toBe(true);
    expect(isFrontPageEligible(noticia('a', FRONT_PAGE_MAX_AGE_HOURS + 0.1), new Set(), NOW)).toBe(false);
  });
});

describe('rankNoticias — regresión de score', () => {
  it('sigue ordenando por score combinado (no rompe ranking existente)', () => {
    const fresca = noticia('fresca', 1, { scoreMeni: 80 });
    const out = rankNoticias([noticia('otra', 30, { scoreMeni: 10 }), fresca]);
    expect(out[0].slug).toBe('fresca');
  });

  it('aplica tope de categoría en el bloque top cuando hay diversidad suficiente', () => {
    // applyCategoryCap permite máx 3 por categoría dentro del bloque top-10.
    // Con un pool de >=4 categorías el bloque se llena respetando el cap;
    // el overflow solo rellena lo que la diversidad real no puede cubrir.
    const mk = (p: string, cat: string, n: number, age0: number, meni: number) =>
      Array.from({ length: n }, (_, i) => noticia(`${p}${i}`, age0 + i, { categoria: cat, scoreMeni: meni }));
    const pool = [
      ...mk('s', 'Sucesos', 12, 1, 90),   // dominante en score
      ...mk('n', 'Nacionales', 8, 2, 85),
      ...mk('d', 'Deportes', 8, 3, 80),
      ...mk('i', 'Internacionales', 8, 4, 75),
    ];
    const top10 = rankNoticias(pool).slice(0, 10);
    const porCat: Record<string, number> = {};
    for (const n of top10) porCat[n.categoria] = (porCat[n.categoria] || 0) + 1;
    for (const count of Object.values(porCat)) expect(count).toBeLessThanOrEqual(3);
    expect(porCat['Sucesos']).toBe(3);
  });
});
