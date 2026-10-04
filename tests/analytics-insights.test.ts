import { describe, it, expect } from 'vitest';
import {
  aggregateSources,
  bucketViewsByHour,
  buildHeatmapDays,
  buildInsights,
  buildSuggestedActions,
  classifyTrend,
  dailySeries,
  hourSummary,
  managuaHourKey,
  normalizeSource,
  parsePeriod,
  periodMs,
  realtimeSnapshot,
  rehydrateTrafficEvents,
  siteTrend,
  split6hWindows,
  windowedArticleCounts,
  MANAGUA_TZ,
  type TrafficLogEvent,
} from '@/lib/analytics/traffic-insights';

const NOW = new Date('2026-10-01T18:00:00Z'); // 12:00 Managua (UTC-6)

function ev(slug: string, isoOffsetHours: number, extra: Partial<TrafficLogEvent> = {}): TrafficLogEvent {
  return {
    slug,
    titulo: `Nota ${slug}`,
    source: 'directo',
    timestamp: new Date(NOW.getTime() + isoOffsetHours * 3600 * 1000),
    ...extra,
  };
}

describe('traffic-insights — timezone Managua', () => {
  it('bucketiza en hora America/Managua (UTC-6)', () => {
    // 2026-10-01T05:30:00Z = 23:30 Managua del 30-sep → bucket '2026-09-30T23'
    expect(managuaHourKey(new Date('2026-10-01T05:30:00Z'))).toBe('2026-09-30T23');
    // 2026-10-01T06:30:00Z = 00:30 Managua del 01-oct → bucket '2026-10-01T00'
    expect(managuaHourKey(new Date('2026-10-01T06:30:00Z'))).toBe('2026-10-01T00');
  });

  it('genera exactamente 24 buckets terminando en la hora actual', () => {
    const buckets = bucketViewsByHour([], NOW);
    expect(buckets.length).toBe(24);
    expect(buckets[buckets.length - 1].label).toBe('12:00'); // 18:00Z = 12:00 Managua
  });

  it('cuenta eventos en el bucket correcto y deja 0 en vacíos', () => {
    const events = [
      ev('a', -0.5),  // 30min atrás → hora actual
      ev('a', -2),    // 2h atrás
      ev('b', -2),
    ];
    const buckets = bucketViewsByHour(events, NOW);
    const total = buckets.reduce((s, b) => s + b.views, 0);
    expect(total).toBe(3);
    // NOW=18:00Z=12:00 Managua en punto → -0.5h cae en el bucket 11:00 (previo)
    expect(buckets[buckets.length - 2].views).toBe(1);
    expect(buckets[buckets.length - 3].views).toBe(2); // hace 2 horas (10:00)
  });
});

describe('traffic-insights — ventanas de artículos', () => {
  it('cuenta h1/h6/h24 correctamente', () => {
    const events = [
      ev('a', -0.5),           // dentro de 1h
      ev('a', -3),             // dentro de 6h
      ev('a', -20),            // dentro de 24h
      ev('a', -30),            // fuera de 24h — no cuenta
      ev('b', -0.2),
    ];
    const w = windowedArticleCounts(events, NOW);
    expect(w.get('a')).toMatchObject({ h1: 1, h6: 2, h24: 3 });
    expect(w.get('b')).toMatchObject({ h1: 1, h6: 1, h24: 1 });
  });

  it('eventos sin slug se ignoran', () => {
    const w = windowedArticleCounts([{ slug: '', timestamp: NOW }], NOW);
    expect(w.size).toBe(0);
  });
});

describe('traffic-insights — tendencias deterministas', () => {
  it('nuevo: actividad sin base previa', () => {
    expect(classifyTrend(5, 0)).toEqual({ trend: 'nuevo', deltaPct: null });
  });
  it('acelerando: +30% o más', () => {
    expect(classifyTrend(13, 10)).toEqual({ trend: 'acelerando', deltaPct: 30 });
    expect(classifyTrend(20, 10).trend).toBe('acelerando');
  });
  it('perdiendo: -30% o menos', () => {
    expect(classifyTrend(7, 10)).toEqual({ trend: 'perdiendo', deltaPct: -30 });
  });
  it('estable: dentro de ±30%', () => {
    expect(classifyTrend(11, 10)).toEqual({ trend: 'estable', deltaPct: 10 });
    expect(classifyTrend(0, 0)).toEqual({ trend: 'estable', deltaPct: null });
  });
  it('split6hWindows separa últimas 6h de las 6h previas', () => {
    const events = [ev('a', -1), ev('a', -1.5), ev('a', -8), ev('b', -30)];
    const { last6, prev6 } = split6hWindows(events, NOW);
    expect(last6.get('a')).toBe(2);
    expect(prev6.get('a')).toBe(1);
    expect(last6.get('b')).toBeUndefined();
  });
});

describe('traffic-insights — fuentes', () => {
  it('normaliza variantes a canales canónicos', () => {
    expect(normalizeSource('facebook')).toBe('facebook');
    expect(normalizeSource('fb')).toBe('facebook');
    expect(normalizeSource('google')).toBe('google');
    expect(normalizeSource('directo')).toBe('directo');
    expect(normalizeSource('otro')).toBe('otro');
    expect(normalizeSource(undefined)).toBe('directo');
    expect(normalizeSource('')).toBe('directo');
    expect(normalizeSource('algo-raro')).toBe('otro');
  });
  it('agrega conteos por fuente', () => {
    const events = [
      ev('a', -1, { source: 'facebook' }),
      ev('b', -1, { source: 'facebook' }),
      ev('c', -1, { source: 'telegram' }),
      ev('d', -1, { source: '' }),
    ];
    const agg = aggregateSources(events);
    expect(agg.facebook).toBe(2);
    expect(agg.telegram).toBe(1);
    expect(agg.directo).toBe(1);
  });
});

describe('traffic-insights — tiempo real', () => {
  it('cuenta eventos recientes y slugs distintos', () => {
    const events = [
      ev('a', -0.05),   // 3 min — dentro
      ev('b', -0.1),    // 6 min — dentro
      ev('a', -0.1),    // 6 min — dentro (mismo slug)
      ev('c', -1),      // 1h — fuera de 15min
    ];
    const rt = realtimeSnapshot(events, NOW, 15);
    expect(rt.events).toBe(3);
    expect(rt.distinctSlugs).toBe(2);
  });
  it('distinctSessions=null cuando ningún evento tiene sessionId (honesto)', () => {
    const rt = realtimeSnapshot([ev('a', -0.05)], NOW, 15);
    expect(rt.distinctSessions).toBeNull();
  });
  it('cuenta sesiones distintas cuando el campo existe', () => {
    const events = [
      ev('a', -0.05, { sessionId: 's1' }),
      ev('b', -0.05, { sessionId: 's1' }),
      ev('c', -0.05, { sessionId: 's2' }),
    ];
    const rt = realtimeSnapshot(events, NOW, 15);
    expect(rt.distinctSessions).toBe(2);
  });
});

describe('traffic-insights — serie diaria y resumen horario', () => {
  it('dailySeries rellena con 0 los días sin datos (no fabrica)', () => {
    const daily = dailySeries({ '2026-09-30': 10 }, 3, NOW);
    expect(daily.map(d => d.date)).toEqual(['2026-09-29', '2026-09-30', '2026-10-01']);
    expect(daily.map(d => d.views)).toEqual([0, 10, 0]);
  });
  it('hourSummary devuelve pico/valle/promedio con datos', () => {
    const buckets = [
      { key: 'k1', label: '08:00', views: 5 },
      { key: 'k2', label: '09:00', views: 50 },
      { key: 'k3', label: '10:00', views: 2 },
    ];
    const s = hourSummary(buckets);
    expect(s.peakHour).toBe('09:00');
    expect(s.lowHour).toBe('10:00');
    expect(s.avgPerHour).toBe(19);
  });
  it('hourSummary honesto sin tráfico', () => {
    const s = hourSummary([{ key: 'k1', label: '08:00', views: 0 }]);
    expect(s.peakHour).toBeNull();
    expect(s.avgPerHour).toBe(0);
  });
  it('siteTrend detecta crecimiento/descenso/insuficiente', () => {
    const up = dailySeries({ '2026-09-30': 100, '2026-10-01': 100 }, 4, NOW);
    expect(siteTrend(up).direction).toBe('up'); // 200 últimos vs 0 previos
    const flat = dailySeries({ '2026-09-28': 10, '2026-09-29': 10, '2026-09-30': 10, '2026-10-01': 10 }, 4, NOW);
    expect(siteTrend(flat).direction).toBe('flat');
    expect(siteTrend([{ date: 'x', views: 5 }])).toEqual({ direction: 'insufficient', deltaPct: null });
  });
});

describe('traffic-insights — heatmap honesto', () => {
  const dates30 = Array.from({ length: 56 }, (_, i) => {
    const d = new Date(NOW.getTime() - i * 86400000);
    return d.toISOString().split('T')[0];
  }).sort(); // 2026-08-07 → 2026-10-01

  it('distingue día medido con 0 vistas de día sin datos', () => {
    const totals = { '2026-09-30': 1272 }; // solo este día tiene doc con vistas
    const days = buildHeatmapDays(totals, dates30, 5, NOW);
    // últimos 5 días: 27,28,29,30,01 — todos tienen doc en traffic_daily
    expect(days.length).toBe(5);
    expect(days[3]).toEqual({ date: '2026-09-30', views: 1272, hasData: true });
    // 27,28,29,01 tienen doc real con 0 vistas registradas → hasData true, views 0
    expect(days[0].hasData).toBe(true);
    expect(days[0].views).toBe(0);
  });

  it('día fuera de availableDates → hasData=false (nunca 0 fabricado)', () => {
    const days = buildHeatmapDays({}, [], 3, NOW);
    expect(days.every(d => !d.hasData)).toBe(true);
    expect(days.every(d => d.views === 0)).toBe(true);
  });

  it('día en availableDates sin doc en totals → hasData=true con views=0 real', () => {
    const days = buildHeatmapDays({}, ['2026-09-30'], 3, NOW);
    const d30 = days.find(d => d.date === '2026-09-30');
    expect(d30).toEqual({ date: '2026-09-30', views: 0, hasData: true });
    const d29 = days.find(d => d.date === '2026-09-29');
    expect(d29?.hasData).toBe(false); // no hay doc → sin datos, no "0 visitas"
  });

  it('cubre todo el rango disponible, no solo la ventana del gráfico', () => {
    const totals: Record<string, number> = {};
    dates30.forEach(d => { totals[d] = 100; });
    const days = buildHeatmapDays(totals, dates30, 56, NOW);
    expect(days.length).toBe(56);
    expect(days[0].date).toBe('2026-08-07');
    expect(days[55].date).toBe('2026-10-01');
    expect(days.every(d => d.hasData && d.views === 100)).toBe(true);
  });
});

describe('traffic-insights — insights deterministas', () => {
  it('emite insight solo con datos que lo demuestran', () => {
    const arts = [
      { slug: 'a', titulo: 'Accidente en la carretera', categoria: 'Sucesos', h1: 5, h6: 20, h24: 30, total: 100, trend: 'acelerando' as const, deltaPct: 150 },
    ];
    const cats = [{ categoria: 'Sucesos', views: 50 }];
    const out = buildInsights({
      articles: arts,
      categories: cats,
      hours: { peakHour: '20:00', lowHour: '04:00' },
      site: { direction: 'up', deltaPct: 25 },
    });
    expect(out.some(i => i.includes('Accidente en la carretera') && i.includes('20 visitas en 6h'))).toBe(true);
    expect(out.some(i => i.includes('Sucesos') && i.includes('100%'))).toBe(true);
    expect(out.some(i => i.includes('20:00'))).toBe(true);
    expect(out.some(i => i.includes('creció 25%'))).toBe(true);
  });
  it('no emite insights vacíos', () => {
    const out = buildInsights({
      articles: [],
      categories: [],
      hours: { peakHour: null, lowHour: null },
      site: { direction: 'flat', deltaPct: null },
    });
    expect(out).toEqual([]);
  });
});

describe('traffic-insights — períodos y validación', () => {
  it('parsePeriod solo acepta valores válidos', () => {
    expect(parsePeriod('24h')).toBe('24h');
    expect(parsePeriod('7d')).toBe('7d');
    expect(parsePeriod('30d')).toBe('30d');
    expect(parsePeriod('999d')).toBe('24h');
    expect(parsePeriod(null)).toBe('24h');
    expect(parsePeriod('<script>')).toBe('24h');
  });
  it('periodMs devuelve milisegundos correctos', () => {
    expect(periodMs('24h')).toBe(86400000);
    expect(periodMs('7d')).toBe(7 * 86400000);
    expect(periodMs('30d')).toBe(30 * 86400000);
  });
  it('MANAGUA_TZ es la zona documentada', () => {
    expect(MANAGUA_TZ).toBe('America/Managua');
  });
});

describe('rehydrateTrafficEvents — cache-hit JSON (causa "Invalid time value")', () => {
  it('pasa eventos con Date reales sin tocarlos', () => {
    const d = new Date('2026-10-01T15:00:00Z');
    const out = rehydrateTrafficEvents([{ slug: 'a', timestamp: d }]);
    expect(out).toHaveLength(1);
    expect(out[0].timestamp).toBe(d);
    expect(managuaHourKey(out[0].timestamp)).toBe('2026-10-01T09');
  });

  it('convierte strings ISO (serialización de unstable_cache) a Date', () => {
    const out = rehydrateTrafficEvents([{ slug: 'a', timestamp: '2026-10-01T15:00:00.000Z' }]);
    expect(out).toHaveLength(1);
    expect(out[0].timestamp instanceof Date).toBe(true);
    // No debe lanzar RangeError al usarlo con Intl/timezone:
    expect(() => managuaHourKey(out[0].timestamp)).not.toThrow();
    expect(managuaHourKey(out[0].timestamp)).toBe('2026-10-01T09');
  });

  it('acepta epoch (ms) y Firestore-like { seconds, nanoseconds }', () => {
    const ms = Date.parse('2026-10-01T15:00:00Z');
    const out = rehydrateTrafficEvents([
      { slug: 'a', timestamp: ms },
      { slug: 'b', timestamp: { seconds: ms / 1000, nanoseconds: 0 } },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].timestamp.getTime()).toBe(ms);
    expect(out[1].timestamp.getTime()).toBe(ms);
  });

  it('descarta timestamps inválidos, null, undefined y objetos sin seconds', () => {
    const out = rehydrateTrafficEvents([
      { slug: 'a', timestamp: 'no-es-fecha' },
      { slug: 'b', timestamp: null },
      { slug: 'c' },
      { slug: 'd', timestamp: { foo: 1 } },
      { slug: 'e', timestamp: NaN },
      { slug: 'ok', timestamp: '2026-10-01T15:00:00Z' },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].slug).toBe('ok');
  });

  it('maneja entradas no-array y elementos primitivos', () => {
    expect(rehydrateTrafficEvents(null)).toEqual([]);
    expect(rehydrateTrafficEvents(undefined)).toEqual([]);
    expect(rehydrateTrafficEvents('x')).toEqual([]);
    expect(rehydrateTrafficEvents([null, 42, 'str'])).toEqual([]);
  });
});

describe('buildSuggestedActions — solo datos reales, nunca inventados', () => {
  const base = {
    articles: [] as Parameters<typeof buildSuggestedActions>[0]['articles'],
    sources: {} as Record<string, number>,
    hours: { peakHour: null, lowHour: null },
    site: { direction: 'flat' as const, deltaPct: null as number | null },
    realtimeActive: 0,
    totalPeriod: 0,
  };

  it('sin datos → una sola acción honesta SIN_DATOS', () => {
    const out = buildSuggestedActions(base);
    expect(out).toHaveLength(1);
    expect(out[0].code).toBe('SIN_DATOS');
  });

  it('dependencia de fuente ≥60% → acción alta DEPENDENCIA_FUENTE', () => {
    const out = buildSuggestedActions({
      ...base,
      sources: { facebook: 80, google: 10, directo: 10 },
      totalPeriod: 100,
      realtimeActive: 3,
    });
    const dep = out.find(a => a.code === 'DEPENDENCIA_FUENTE');
    expect(dep).toBeDefined();
    expect(dep!.prioridad).toBe('alta');
    expect(dep!.evidencia).toContain('80');
  });

  it('fuentes diversificadas (<60%) → sin alerta de dependencia', () => {
    const out = buildSuggestedActions({
      ...base,
      sources: { facebook: 40, google: 35, directo: 25 },
      totalPeriod: 100,
      realtimeActive: 3,
    });
    expect(out.some(a => a.code === 'DEPENDENCIA_FUENTE')).toBe(false);
  });

  it('artículo acelerando → IMPULSAR_AHORA con evidencia medida', () => {
    const out = buildSuggestedActions({
      ...base,
      articles: [{
        slug: 'a', titulo: 'Nota caliente', categoria: 'Nacionales',
        h1: 5, h6: 30, h24: 50, total: 500,
        trend: 'acelerando' as const, deltaPct: 40,
      }],
      totalPeriod: 50,
      realtimeActive: 2,
    });
    const hot = out.find(a => a.code === 'IMPULSAR_AHORA');
    expect(hot).toBeDefined();
    expect(hot!.accion).toContain('Nota caliente');
    expect(hot!.evidencia).toContain('30');
  });

  it('sin actividad en vivo pero con tráfico en período → SIN_ACTIVIDAD', () => {
    const out = buildSuggestedActions({ ...base, totalPeriod: 100, realtimeActive: 0 });
    expect(out.some(a => a.code === 'SIN_ACTIVIDAD')).toBe(true);
  });

  it('hora pico medida → acción info HORA_PICO', () => {
    const out = buildSuggestedActions({
      ...base,
      hours: { peakHour: '19:00', lowHour: '04:00' },
      totalPeriod: 10,
      realtimeActive: 1,
    });
    const hp = out.find(a => a.code === 'HORA_PICO');
    expect(hp).toBeDefined();
    expect(hp!.accion).toContain('19:00');
  });

  it('tendencia down → acción alta TENDENCIA_CAIDA', () => {
    const out = buildSuggestedActions({
      ...base,
      site: { direction: 'down' as const, deltaPct: -35 },
      totalPeriod: 10,
      realtimeActive: 1,
    });
    const t = out.find(a => a.code === 'TENDENCIA_CAIDA');
    expect(t).toBeDefined();
    expect(t!.prioridad).toBe('alta');
  });

  it('máximo 5 acciones, ordenadas por prioridad', () => {
    const out = buildSuggestedActions({
      articles: [{
        slug: 'a', titulo: 'Hot', categoria: 'Nacionales',
        h1: 5, h6: 30, h24: 50, total: 500,
        trend: 'acelerando' as const, deltaPct: 40,
      }, {
        slug: 'b', titulo: 'Cold', categoria: 'Sucesos',
        h1: 0, h6: 2, h24: 40, total: 300,
        trend: 'perdiendo' as const, deltaPct: -50,
      }],
      sources: { facebook: 90, google: 10 },
      hours: { peakHour: '19:00', lowHour: '04:00' },
      site: { direction: 'down' as const, deltaPct: -35 },
      realtimeActive: 0,
      totalPeriod: 100,
    });
    expect(out.length).toBeLessThanOrEqual(5);
    const rank = { alta: 0, media: 1, info: 2 };
    for (let i = 1; i < out.length; i++) {
      expect(rank[out[i].prioridad]).toBeGreaterThanOrEqual(rank[out[i - 1].prioridad]);
    }
  });
});
