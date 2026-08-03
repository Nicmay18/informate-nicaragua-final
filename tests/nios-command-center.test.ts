import { describe, it, expect } from 'vitest';
import {
  buildCommandCenter,
  buildEditorialBalance,
  buildGoogleTrust,
  buildRevenueEngine,
  buildHomeQuality,
  buildDistributionCommand,
  buildOpportunityHunter,
  buildContentWarRoom,
} from '@/lib/nios/command-center';
import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';

const NOW = new Date('2026-08-02T12:00:00.000Z');

function noticia(i: number, overrides: Partial<Noticia> = {}): Noticia {
  return {
    id: `id-${i}`,
    slug: `nota-${i}`,
    titulo: `Titular de prueba número ${i}`,
    resumen: `Resumen suficientemente largo de la nota ${i} para superar el umbral mínimo de meta description recomendado.`,
    contenido: '<p>Contenido de prueba con información verificada.</p>',
    categoria: 'Nacionales',
    imagen: '/images/nota.webp',
    fecha: '2026-08-01T10:00:00.000Z',
    autor: 'Redacción Nicaragua Informate',
    estado: 'publicado',
    vistas: 20,
    palabras: 500,
    ...overrides,
  } as Noticia;
}

function guide(slug: string, category: string): EvergreenArticle {
  return {
    slug,
    title: `Guía de ${category} Nicaragua 2026`,
    description: `Todo sobre ${category} en Nicaragua.`,
    category,
    author: 'Keyling Rivera',
    authorSlug: 'keyling-rivera',
    publishedDate: '2026-01-01',
    updatedDate: '2026-07-01',
    content: '<p>Contenido</p>',
    faqs: [{ question: '¿Cómo?', answer: 'Así.' }],
  };
}

/** 10 Nacionales + 10 Sucesos: Sucesos al 50%, muy por encima del techo de 20%. */
function sucesosDominadoDataset(): Noticia[] {
  return [
    ...Array.from({ length: 10 }, (_, i) => noticia(i, { categoria: 'Nacionales' })),
    ...Array.from({ length: 10 }, (_, i) => noticia(100 + i, { categoria: 'Sucesos' })),
  ];
}

describe('Editorial Balance Engine', () => {
  it('detecta que Sucesos supera su techo editorial', () => {
    const balance = buildEditorialBalance(sucesosDominadoDataset());
    const sucesos = balance.categories.find((c) => c.category === 'Sucesos');

    expect(sucesos?.share).toBe(50);
    expect(sucesos?.status).toBe('excedido');
    expect(balance.alerts.some((a) => a.includes('domina demasiado la identidad editorial'))).toBe(true);
  });

  it('marca como deficitarias las categorías sin cobertura', () => {
    const balance = buildEditorialBalance(sucesosDominadoDataset());
    const deportes = balance.categories.find((c) => c.category === 'Deportes');

    expect(deportes?.share).toBe(0);
    expect(deportes?.status).toBe('deficitario');
  });

  it('el identityScore siempre queda entre 0 y 100', () => {
    for (const dataset of [[], sucesosDominadoDataset(), [noticia(1)]]) {
      const balance = buildEditorialBalance(dataset);
      expect(balance.identityScore).toBeGreaterThanOrEqual(0);
      expect(balance.identityScore).toBeLessThanOrEqual(100);
    }
  });

  it('los porcentajes de categorías rastreadas no superan el total', () => {
    const balance = buildEditorialBalance(sucesosDominadoDataset());
    const sum = balance.categories.reduce((s, c) => s + c.share, 0);
    expect(sum).toBeLessThanOrEqual(100.1);
  });
});

describe('Google Trust Score', () => {
  it('devuelve un score entre 0 y 100 con los 7 pilares', () => {
    const trust = buildGoogleTrust(sucesosDominadoDataset(), [guide('g1', 'Turismo')], NOW.getTime());
    expect(trust.pillars).toHaveLength(7);
    expect(trust.score).toBeGreaterThanOrEqual(0);
    expect(trust.score).toBeLessThanOrEqual(100);
  });

  it('siempre entrega fortaleza, debilidad y próxima acción', () => {
    const trust = buildGoogleTrust(sucesosDominadoDataset(), [], NOW.getTime());
    expect(trust.googleSees.strengths.length).toBeGreaterThan(0);
    expect(trust.googleSees.weaknesses.length).toBeGreaterThan(0);
    expect(trust.googleSees.nextActions.length).toBeGreaterThan(0);
  });

  it('un archivo con más autores y guías puntúa mejor', () => {
    const pobre = buildGoogleTrust([noticia(1)], [], NOW.getTime());
    const rico = buildGoogleTrust(
      Array.from({ length: 20 }, (_, i) =>
        noticia(i, {
          autor: `Autor ${i % 4}`,
          autorFoto: '/autor.webp',
          categoria: ['Nacionales', 'Economía', 'Deportes', 'Tecnología'][i % 4],
          puntosClave: ['a', 'b'],
        })
      ),
      [guide('g1', 'Turismo'), guide('g2', 'Economía'), guide('g3', 'Salud')],
      NOW.getTime()
    );
    expect(rico.score).toBeGreaterThan(pobre.score);
  });
});

describe('Revenue Engine', () => {
  it('propone abrir verticales comerciales sin inventario', () => {
    const revenue = buildRevenueEngine([noticia(1)], []);
    const seeds = revenue.opportunities.filter((o) => o.potential === 'exploratorio');
    expect(seeds.length).toBeGreaterThan(0);
    expect(seeds[0].nextStep).toContain('3 notas base');
  });

  it('detecta patrocinio vendible cuando existe guía ancla con inventario', () => {
    const noticias = Array.from({ length: 6 }, (_, i) => noticia(i, { categoria: 'Turismo', vistas: 120 }));
    const revenue = buildRevenueEngine(noticias, [guide('turismo-2026', 'Turismo')]);
    const turismo = revenue.opportunities.find((o) => o.category === 'Turismo');

    expect(turismo?.effort).toBe('bajo');
    expect(turismo?.title).toContain('puede vender patrocinio');
  });

  it('la preparación comercial nunca sale del rango 0-100', () => {
    const noticias = Array.from({ length: 80 }, (_, i) => noticia(i, { categoria: 'Economía', vistas: 5000 }));
    const revenue = buildRevenueEngine(noticias, [guide('eco', 'Economía')]);
    revenue.opportunities.forEach((o) => {
      expect(o.readiness).toBeGreaterThanOrEqual(0);
      expect(o.readiness).toBeLessThanOrEqual(100);
    });
  });
});

describe('Home Quality Control', () => {
  it('penaliza una portada dominada por una sola categoría', () => {
    const dominada = Array.from({ length: 20 }, (_, i) => noticia(i, { categoria: 'Sucesos' }));
    const equilibrada = Array.from({ length: 20 }, (_, i) =>
      noticia(i, { categoria: ['Nacionales', 'Economía', 'Tecnología', 'Deportes'][i % 4] })
    );

    const malo = buildHomeQuality(dominada);
    const bueno = buildHomeQuality(equilibrada);

    expect(malo.score).toBeLessThan(bueno.score);
    expect(malo.violations.length).toBeGreaterThan(0);
  });

  it('identifica posiciones fuera de la vitrina de marca', () => {
    const home = buildHomeQuality(Array.from({ length: 12 }, (_, i) => noticia(i, { categoria: 'Sucesos' })));
    expect(home.brandSlots.every((s) => !s.onBrand)).toBe(true);
  });

  it('maneja un archivo vacío sin romperse', () => {
    const home = buildHomeQuality([]);
    expect(home.score).toBe(0);
    expect(home.analyzed).toBe(0);
  });
});

describe('Distribution Command', () => {
  it('genera un texto distinto para cada uno de los 5 canales', () => {
    const dist = buildDistributionCommand(sucesosDominadoDataset(), NOW.getTime());
    const plan = dist.plans[0];

    expect(plan.copies).toHaveLength(5);
    const textos = new Set(plan.copies.map((c) => c.text));
    expect(textos.size).toBe(5);
  });

  it('cada copy declara su canal y su ángulo', () => {
    const dist = buildDistributionCommand(sucesosDominadoDataset(), NOW.getTime());
    dist.plans[0].copies.forEach((c) => {
      expect(c.channel).toBeTruthy();
      expect(c.angle).toContain('Ventana:');
      expect(c.charCount).toBe(c.text.length);
    });
  });

  it('prioriza categorías de marca sobre Sucesos', () => {
    const dist = buildDistributionCommand(sucesosDominadoDataset(), NOW.getTime());
    expect(dist.plans[0].category).toBe('Nacionales');
  });
});

describe('Content Opportunity Hunter', () => {
  it('marca como no cubierta la demanda sin contenido', () => {
    const hunter = buildOpportunityHunter([noticia(1)], []);
    expect(hunter.uncovered).toBeGreaterThan(0);
    expect(hunter.items.every((i) => i.action.length > 0)).toBe(true);
  });

  it('ordena primero lo no cubierto y de mayor valor comercial', () => {
    const hunter = buildOpportunityHunter([noticia(1)], []);
    const firstCoveredIndex = hunter.items.findIndex((i) => i.covered);
    if (firstCoveredIndex !== -1) {
      expect(hunter.items.slice(firstCoveredIndex).every((i) => i.covered)).toBe(true);
    }
    expect(hunter.items[0].commercialValue).toBe('alto');
  });

  it('reconoce cobertura cuando existe una guía del tema', () => {
    const conGuia = buildOpportunityHunter([noticia(1)], [guide('turismo-nicaragua-2026', 'Turismo')]);
    const turismo = conGuia.items.find((i) => i.topic === 'Turismo y destinos');
    expect(turismo?.covered).toBe(true);
  });
});

describe('Content War Room', () => {
  it('eleva a crítica la categoría deficitaria y degrada la excedida', () => {
    const noticias = sucesosDominadoDataset();
    const balance = buildEditorialBalance(noticias);
    const warRoom = buildContentWarRoom(noticias, balance, NOW);

    const sucesos = warRoom.slots.find((s) => s.category === 'Sucesos');
    const deportes = warRoom.slots.find((s) => s.category === 'Deportes');

    expect(sucesos?.priority).toBe('baja');
    expect(deportes?.priority).toBe('critica');
  });

  it('el plan diario tiene 5 espacios ordenados por prioridad', () => {
    const noticias = sucesosDominadoDataset();
    const warRoom = buildContentWarRoom(noticias, buildEditorialBalance(noticias), NOW);
    const order = { critica: 0, alta: 1, media: 2, baja: 3 } as const;

    expect(warRoom.slots).toHaveLength(5);
    for (let i = 1; i < warRoom.slots.length; i++) {
      expect(order[warRoom.slots[i].priority]).toBeGreaterThanOrEqual(order[warRoom.slots[i - 1].priority]);
    }
  });
});

describe('CEO Daily Decision', () => {
  it('nunca entrega más de 5 decisiones', () => {
    const cc = buildCommandCenter(sucesosDominadoDataset(), [guide('g1', 'Turismo')], [], NOW);
    expect(cc.decisions.length).toBeGreaterThan(0);
    expect(cc.decisions.length).toBeLessThanOrEqual(5);
  });

  it('no repite el mismo eje de decisión dos veces', () => {
    const cc = buildCommandCenter(sucesosDominadoDataset(), [], [], NOW);
    const kinds = cc.decisions.map((d) => d.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it('cada decisión declara acción, justificación y motor de origen', () => {
    const cc = buildCommandCenter(sucesosDominadoDataset(), [], [], NOW);
    cc.decisions.forEach((d) => {
      expect(d.action.length).toBeGreaterThan(0);
      expect(d.why.length).toBeGreaterThan(0);
      expect(d.source.length).toBeGreaterThan(0);
    });
  });

  it('ordena las decisiones por severidad', () => {
    const cc = buildCommandCenter(sucesosDominadoDataset(), [], [], NOW);
    const order = { critica: 0, alta: 1, media: 2, baja: 3 } as const;
    for (let i = 1; i < cc.decisions.length; i++) {
      expect(order[cc.decisions[i].severity]).toBeGreaterThanOrEqual(order[cc.decisions[i - 1].severity]);
    }
  });

  it('con Sucesos dominante emite una decisión de riesgo de saturación', () => {
    const cc = buildCommandCenter(sucesosDominadoDataset(), [], [], NOW);
    const riesgo = cc.decisions.find((d) => d.kind === 'riesgo');
    expect(riesgo?.headline).toContain('Sucesos');
  });
});

describe('Business Health', () => {
  it('un archivo vacío se clasifica como proyecto', () => {
    const cc = buildCommandCenter([], [], [], NOW);
    expect(cc.business.stage).toBe('proyecto');
    expect(cc.business.score).toBeGreaterThanOrEqual(0);
  });

  it('consolida los 5 pilares del negocio', () => {
    const cc = buildCommandCenter(sucesosDominadoDataset(), [], [], NOW);
    expect(cc.business.pillars.map((p) => p.id)).toEqual(['content', 'audience', 'google', 'revenue', 'brand']);
    cc.business.pillars.forEach((p) => {
      expect(p.score).toBeGreaterThanOrEqual(0);
      expect(p.score).toBeLessThanOrEqual(100);
    });
  });
});

describe('Command Center — integración', () => {
  it('construye el reporte completo sin datos', () => {
    const cc = buildCommandCenter([], [], [], NOW);
    expect(cc.status).toBe('ok');
    expect(cc.analyzed).toBe(0);
    expect(cc.balance).toBeDefined();
    expect(cc.trust).toBeDefined();
    expect(cc.revenue).toBeDefined();
    expect(cc.warRoom).toBeDefined();
    expect(cc.home).toBeDefined();
    expect(cc.distribution).toBeDefined();
    expect(cc.hunter).toBeDefined();
    expect(cc.business).toBeDefined();
  });

  it('propaga los errores de carga como estado parcial', () => {
    const cc = buildCommandCenter([], [], ['Firestore caído'], NOW);
    expect(cc.status).toBe('partial');
    expect(cc.errors).toEqual(['Firestore caído']);
  });

  it('es determinista: la misma entrada produce la misma salida', () => {
    const dataset = sucesosDominadoDataset();
    const a = buildCommandCenter(dataset, [guide('g1', 'Turismo')], [], NOW);
    const b = buildCommandCenter(dataset, [guide('g1', 'Turismo')], [], NOW);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('ignora borradores y archivados en el conteo analizado', () => {
    const dataset = [
      noticia(1),
      noticia(2, { estado: 'borrador' }),
      noticia(3, { estado: 'archivado' }),
    ];
    const cc = buildCommandCenter(dataset, [], [], NOW);
    expect(cc.analyzed).toBe(1);
  });
});
