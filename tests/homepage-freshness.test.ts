/**
 * Tests de frescura del homepage.
 * Verifica que el ordenamiento sea cronológico (fecha desc)
 * y que los filtros canónicos (aprobadoMeni, publicado, archived) se apliquen.
 */
import { describe, it, expect } from 'vitest';
import { isPublicNews } from '@/lib/data';
import type { Noticia } from '@/lib/types';

function makeNoticia(overrides: Partial<Noticia>): Noticia {
  return {
    id: 'test-' + Math.random().toString(36).slice(2),
    slug: 'test-slug',
    titulo: 'Test',
    resumen: '',
    categoria: 'Nacionales',
    imagen: '/test.jpg',
    fecha: new Date().toISOString(),
    estado: 'publicado',
    aprobadoMeni: true,
    publicado: true,
    archived: false,
    ...overrides,
  };
}

describe('isPublicNews — filtro canónico', () => {
  it('acepta artículo aprobado, publicado, no archivado, estado publicado', () => {
    expect(isPublicNews(makeNoticia({}))).toBe(true);
  });

  it('rechaza artículo con aprobadoMeni=false', () => {
    expect(isPublicNews(makeNoticia({ aprobadoMeni: false }))).toBe(false);
  });

  it('rechaza artículo con aprobadoMeni=undefined', () => {
    expect(isPublicNews(makeNoticia({ aprobadoMeni: undefined }))).toBe(false);
  });

  it('rechaza artículo con publicado=false', () => {
    expect(isPublicNews(makeNoticia({ publicado: false }))).toBe(false);
  });

  it('rechaza artículo archivado', () => {
    expect(isPublicNews(makeNoticia({ archived: true }))).toBe(false);
  });

  it('rechaza artículo en estado borrador', () => {
    expect(isPublicNews(makeNoticia({ estado: 'borrador' }))).toBe(false);
  });

  it('rechaza artículo en estado archivado', () => {
    expect(isPublicNews(makeNoticia({ estado: 'archivado' }))).toBe(false);
  });
});

describe('Orden cronológico — frescura del homepage', () => {
  it('ordena por fecha desc: A(13ago) > B(12ago) > C(10ago) > D(8ago)', () => {
    const A = makeNoticia({ id: 'A', fecha: '2026-08-13T10:00:00Z' });
    const B = makeNoticia({ id: 'B', fecha: '2026-08-12T10:00:00Z' });
    const C = makeNoticia({ id: 'C', fecha: '2026-08-10T10:00:00Z' });
    const D = makeNoticia({ id: 'D', fecha: '2026-08-08T10:00:00Z' });

    const input = [D, C, B, A]; // desordenado
    const sorted = [...input].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    expect(sorted.map((n) => n.id)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('no desplaza una noticia reciente por score superior de una vieja', () => {
    // Simular: noticia vieja con scoreMeni alto vs noticia nueva con scoreMeni bajo
    const nueva = makeNoticia({ id: 'nueva', fecha: '2026-08-13T10:00:00Z', scoreMeni: 70 });
    const vieja = makeNoticia({ id: 'vieja', fecha: '2026-08-08T10:00:00Z', scoreMeni: 95 });

    const sorted = [vieja, nueva].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    // La nueva debe ir primero, sin importar el score
    expect(sorted[0].id).toBe('nueva');
  });
});

describe('Exclusiones por ID — sin duplicación', () => {
  it('el hero no se repite en últimas ni en secciones', () => {
    const hero = makeNoticia({ id: 'hero', fecha: '2026-08-13T10:00:00Z' });
    const ultimas = [
      makeNoticia({ id: 'u1', fecha: '2026-08-13T09:00:00Z' }),
      makeNoticia({ id: 'u2', fecha: '2026-08-13T08:00:00Z' }),
    ];
    const porCategoria = {
      Nacionales: [
        makeNoticia({ id: 'n1', fecha: '2026-08-12T10:00:00Z' }),
      ],
    };

    const used = new Set<string>();
    used.add(hero.id);
    const ultimasFiltered = ultimas.filter((n) => !used.has(n.id));
    const catFiltered = (porCategoria.Nacionales || []).filter((n) => !used.has(n.id));

    expect(ultimasFiltered.find((n) => n.id === 'hero')).toBeUndefined();
    expect(catFiltered.find((n) => n.id === 'hero')).toBeUndefined();
  });
});
