import { describe, it, expect } from 'vitest';
import { selectHomeSections, FRONT_WINDOWS_HOURS, articleAgeHours } from '@/lib/home-ranking';
import { mapDocToNoticia } from '@/lib/data';
import { Timestamp } from 'firebase-admin/firestore';
import type { Noticia } from '@/lib/types';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

const NOW = new Date('2026-11-07T18:00:00Z').getTime();
const H = 3600 * 1000;

let seq = 0;
function noticia(ageHours: number, extra: Partial<Noticia> = {}): Noticia {
  seq += 1;
  return {
    id: extra.id ?? `n${seq}`,
    slug: extra.slug ?? `nota-${seq}`,
    titulo: `Nota ${seq}`,
    resumen: 'Resumen',
    imagen: '/images/x.png',
    categoria: extra.categoria ?? 'Nacionales',
    fecha: new Date(NOW - ageHours * H).toISOString(),
    estado: 'publicado',
    publicado: true,
    aprobadoMeni: true,
    ...extra,
  };
}

const slugs = (ns: Noticia[]) => ns.map(n => n.slug);

describe('Portada — actualidad primero (casos A–H)', () => {
  it('A/B: noticia de 30 min con pocas vistas encabeza; la de 17 días con miles de vistas no gana', () => {
    const nueva = noticia(0.5, { vistas: 2, scoreMeni: 70 });
    const vieja = noticia(17 * 24, { vistas: 5000, scoreMeni: 99 });
    const media = noticia(20, { vistas: 40 });
    const s = selectHomeSections([vieja, media, nueva], NOW);

    expect(s.hero?.slug).toBe(nueva.slug);
    expect(s.enPortada.map(n => n.slug)).not.toContain(vieja.slug);
    expect(slugs(s.ultimas)[0]).toBe(nueva.slug);
    // Con solo 3 notas publicadas, «Últimas» muestra las 3 en orden
    // cronológico: la vieja va ÚLTIMA, nunca desplaza a las recientes.
    expect(slugs(s.ultimas)).toEqual([nueva.slug, media.slug, vieja.slug]);
    expect(s.breaking.map(n => n.slug)).not.toContain(vieja.slug);
  });

  it('C: nota de 3h con MENI alto gana el titular sobre una antigua aunque tenga menos score absoluto', () => {
    const reciente = noticia(3, { scoreMeni: 95, categoria: 'Deportes' });
    const antigua = noticia(10 * 24, { scoreMeni: 50, vistas: 9000 });
    const otra = noticia(8, { scoreMeni: 60 });
    const s = selectHomeSections([antigua, otra, reciente], NOW);
    expect(s.hero?.slug).toBe(reciente.slug);
  });

  it('ventana progresiva: con <6 notas en 24h, En portada amplía a 48h/7d', () => {
    // Solo 2 notas en 24h, el resto de hace 4 días
    const pool = [noticia(1), noticia(2), ...Array.from({ length: 6 }, () => noticia(96))];
    const s = selectHomeSections(pool, NOW);
    // hero sale de la ventana de 24h
    expect(NOW - new Date(s.hero!.fecha).getTime()).toBeLessThanOrEqual(24 * H);
    // enPortada se completa con notas de la ventana ampliada
    expect(s.enPortada.length).toBeGreaterThan(0);
    for (const n of s.enPortada) {
      expect(NOW - new Date(n.fecha).getTime()).toBeLessThanOrEqual(FRONT_WINDOWS_HOURS[2] * H + 1000);
    }
  });

  it('sin noticias en 7 días: fallback muestra lo mejor disponible sin fabricar recencia', () => {
    const vieja = noticia(30 * 24, { scoreMeni: 90 });
    const s = selectHomeSections([vieja], NOW);
    expect(s.hero?.slug).toBe(vieja.slug); // única opción — portada no queda vacía
    expect(slugs(s.ultimas)).toEqual([vieja.slug]);
  });

  it('D/E: formatos de fecha mixtos (ISO con/sin zona) ordenan cronológicamente', () => {
    const a = noticia(0, { fecha: new Date(NOW - 30 * 60 * 1000).toISOString() });
    const b = noticia(0, { fecha: '2026-11-05T10:00:00' }); // string sin zona horaria (legacy)
    const c = noticia(0, { fecha: new Date(NOW - 2 * H).toISOString() });
    const s = selectHomeSections([b, c, a], NOW);
    // a (30 min) primero; c (2h) antes que b (2 días)
    expect(slugs(s.ultimas).slice(0, 3)).toEqual([a.slug, c.slug, b.slug]);
  });

  it('G: edición de una nota de hace 10 días NO la convierte en reciente', () => {
    // fecha de publicación antigua + fechaActualizacion reciente (edición)
    const editada = noticia(10 * 24, {
      fechaActualizacion: new Date(NOW - 10 * 60 * 1000).toISOString(),
      scoreMeni: 98, vistas: 3000,
    });
    const fresca = noticia(1, { scoreMeni: 60 });
    const s = selectHomeSections([editada, fresca], NOW);
    expect(s.hero?.slug).toBe(fresca.slug);
    expect(slugs(s.ultimas)[0]).toBe(fresca.slug);
  });

  it('H: borradores, archivadas y no aprobadas nunca aparecen en portada', () => {
    const borrador = noticia(0.2, { estado: 'borrador', aprobadoMeni: false });
    const archivada = noticia(0.3, { estado: 'archivado' });
    const noAprobada = noticia(0.4, { aprobadoMeni: false });
    const buena = noticia(1);
    const s = selectHomeSections([borrador, archivada, noAprobada, buena], NOW);
    const todo = [s.hero, ...s.enPortada, ...s.ultimas, ...s.breaking].filter(Boolean);
    expect(todo.every(n => n!.aprobadoMeni === true && n!.estado === 'publicado')).toBe(true);
    expect(s.hero?.slug).toBe(buena.slug);
  });

  it('F: noticia reciente que aparece en sección temática sigue en «Últimas noticias»', () => {
    // Simula que la nota está en porCategoria: selectHomeSections no recibe
    // ese dato — el carril cronológico es independiente por diseño.
    const reciente = noticia(0.5, { categoria: 'Deportes' });
    const s = selectHomeSections([reciente], NOW);
    expect(slugs(s.ultimas)).toContain(reciente.slug);
  });

  it('concentración por categoría: 6 notas de Nacionales en 24h → «En portada» se amplía a 48h/7d', () => {
    // 6 notas frescas TODAS en Nacionales: con tope 2/categoría solo entran
    // 2; la sección debe ampliarse a la ventana de 48h/7d para completar
    // con categorías distintas — sin desplazar las recientes.
    const nacionales = Array.from({ length: 6 }, (_, i) =>
      noticia(1 + i, { categoria: 'Nacionales', scoreMeni: 90 }));
    const deportes48 = Array.from({ length: 3 }, (_, i) =>
      noticia(30 + i, { categoria: 'Deportes' }));
    const sucesos7d = Array.from({ length: 3 }, (_, i) =>
      noticia(100 + i, { categoria: 'Sucesos' }));
    const s = selectHomeSections([...sucesos7d, ...deportes48, ...nacionales], NOW);

    expect(s.enPortada.length).toBe(5);
    const cats = s.enPortada.map(n => n.categoria);
    expect(new Set(cats).size).toBeGreaterThan(1);
    for (const n of s.enPortada) {
      const cCount = s.enPortada.filter(x => x.categoria === n.categoria).length;
      expect(cCount).toBeLessThanOrEqual(2);
    }
    // Las notas de 7d solo aparecen si la diversidad lo exige; ninguna
    // supera la ventana máxima de 7 días.
    for (const n of s.enPortada) {
      expect(NOW - new Date(n.fecha).getTime()).toBeLessThanOrEqual(FRONT_WINDOWS_HOURS[2] * H + 1000);
    }
  });

  it('sin duplicados por slug en «Últimas noticias»', () => {
    const base = noticia(1, { slug: 'misma-nota' });
    const dup = { ...noticia(2), slug: 'misma-nota', id: 'otro-id' };
    const s = selectHomeSections([base, dup], NOW);
    expect(slugs(s.ultimas).filter(s => s === 'misma-nota').length).toBe(1);
  });

  it('recorrido real: Timestamp de Firestore → safeDateString → mapDocToNoticia → selectHomeSections', () => {
    // Documento como lo devuelve Firestore: publishedAt Timestamp real,
    // fecha como string ISO legacy VIEJA y dateModified Timestamp reciente.
    // La fecha canónica debe ser publishedAt (30 min), NO dateModified
    // ni la fecha string antigua.
    const publishedAt = Timestamp.fromDate(new Date(NOW - 30 * 60 * 1000));
    const dateModified = Timestamp.fromDate(new Date(NOW - 5 * 60 * 1000));
    const fakeDoc = {
      id: 'doc-timestamp',
      data: () => ({
        slug: 'nota-timestamp',
        titulo: 'Nota con Timestamp real',
        resumen: 'Resumen',
        categoria: 'Nacionales',
        estado: 'publicado',
        publicado: true,
        aprobadoMeni: true,
        publishedAt,
        dateModified,
        fecha: '2026-01-01T00:00:00.000Z', // string legacy de hace meses
        vistas: 3,
      }),
    } as unknown as QueryDocumentSnapshot;

    const n = mapDocToNoticia(fakeDoc);
    // Canonical: publishedAt gana sobre fecha string y dateModified.
    expect(n.fecha).toBe(publishedAt.toDate().toISOString());
    expect(articleAgeHours(n, NOW)).toBeLessThan(1);

    const s = selectHomeSections([n], NOW);
    expect(s.hero?.slug).toBe('nota-timestamp');
    expect(slugs(s.ultimas)).toContain('nota-timestamp');
  });

  it('recorrido real: fecha como string ISO legacy ordena junto a Timestamps', () => {
    const tsDoc = {
      id: 'doc-ts',
      data: () => ({
        slug: 'nota-ts', titulo: 'Nueva', categoria: 'Deportes',
        estado: 'publicado', publicado: true, aprobadoMeni: true,
        publishedAt: Timestamp.fromDate(new Date(NOW - 2 * H)),
      }),
    } as unknown as QueryDocumentSnapshot;
    const strDoc = {
      id: 'doc-str',
      data: () => ({
        slug: 'nota-str', titulo: 'Vieja string', categoria: 'Nacionales',
        estado: 'publicado', publicado: true, aprobadoMeni: true,
        fecha: '2026-11-01T12:00:00.000Z', // ~6 días atrás, solo string
      }),
    } as unknown as QueryDocumentSnapshot;
    const [nueva, vieja] = [mapDocToNoticia(tsDoc), mapDocToNoticia(strDoc)];
    const s = selectHomeSections([vieja, nueva], NOW);
    expect(slugs(s.ultimas)).toEqual([nueva.slug, vieja.slug]);
    expect(articleAgeHours(vieja, NOW)).toBeGreaterThan(24);
  });

  it('«Últimas noticias» es cronología estricta aunque haya sección editorial', () => {
    // 10 notas: las 5 más nuevas en distintas categorías + 5 antiguas con muchas vistas
    const nuevas = Array.from({ length: 5 }, (_, i) =>
      noticia(0.5 + i, { categoria: ['Nacionales', 'Deportes', 'Sucesos', 'Tecnología', 'Internacionales'][i] }));
    const viejas = Array.from({ length: 5 }, (_, i) =>
      noticia(10 * 24 + i, { vistas: 9999 - i, scoreMeni: 99 }));
    const s = selectHomeSections([...viejas, ...nuevas], NOW);
    const ultimasSlugs = slugs(s.ultimas);
    // Las 5 nuevas deben aparecer (cronología estricta, tope 8)
    for (const n of nuevas) expect(ultimasSlugs).toContain(n.slug);
    // Orden descendente por fecha
    const times = s.ultimas.map(n => new Date(n.fecha).getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});
