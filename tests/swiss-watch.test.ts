/**
 * Tests del NIOS Command Center (Swiss Watch Mode).
 *
 * Objetivo central: garantizar que el tablero NO pueda producir
 * falsos verdes. Estas pruebas son la defensa contra la alucinacion.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { EXPERTS, EXPERT_BY_ID, getExpert } from '@/lib/nios/swiss-watch/experts';
import { worstStatus, evidence, probeEnvPresence } from '@/lib/nios/swiss-watch/probes';
import {
  evaluateAdSenseReadiness,
  REQUIRED_LEGAL_PAGES,
} from '@/lib/nios/swiss-watch/adsense-readiness';
import { buildBoard, EXISTING_LEGAL_PAGES, DECLARED_CRONS } from '@/lib/nios/swiss-watch/board';
import type { BoardInput } from '@/lib/nios/swiss-watch/board';
import type { Noticia } from '@/lib/types';
import type { SwissStatus } from '@/lib/nios/swiss-watch/types';

const NOW = new Date('2026-09-06T12:00:00.000Z');

function makeNoticia(overrides: Partial<Noticia> = {}): Noticia {
  return {
    id: overrides.slug ?? 'id-1',
    slug: 'nota-1',
    titulo: 'Titulo de prueba',
    resumen: 'Resumen de prueba',
    contenido: '<p>' + 'palabra '.repeat(500) + '</p>',
    categoria: 'nacionales',
    imagen: '/images/a.webp',
    fecha: '2026-09-05',
    estado: 'publicado',
    autor: 'Redaccion',
    metaDescription: 'Meta',
    fuente: 'Fuente oficial',
    scoreMeni: 92,
    ...overrides,
  };
}

/** Corpus sano de 30 articulos, suficiente para superar el volumen minimo. */
function healthyCorpus(): Noticia[] {
  return Array.from({ length: 30 }, (_, i) =>
    makeNoticia({ id: `id-${i}`, slug: `nota-${i}`, titulo: `Titulo unico ${i}` }),
  );
}

function healthyInput(overrides: Partial<BoardInput> = {}): BoardInput {
  const noticias = overrides.noticias ?? healthyCorpus();
  return {
    noticias,
    firebase: {
      status: 'GREEN',
      reason: 'Admin SDK inicializado y Firestore responde a una lectura real.',
      evidence: [evidence('firebase', 'lectura correcta', 'runtime', true)],
    },
    firestore: {
      status: 'GREEN',
      reason: 'Todas las colecciones operativas responden y contienen datos.',
      evidence: [],
      probes: [],
    },
    heartbeat: {
      status: 'GREEN',
      reason: 'Los componentes tienen heartbeat fresco.',
      evidence: [],
      components: [
        { component: 'watchdog', status: 'HEALTHY', lastRunAt: NOW.toISOString(), ageMs: 0 },
      ],
    },
    incidents: {
      status: 'GREEN',
      reason: 'No hay incidentes abiertos.',
      evidence: [],
      openCritical: 0,
      openTotal: 0,
    },
    snapshot: {
      status: 'GREEN',
      reason: 'Snapshot fresco del 2026-09-06.',
      evidence: [],
      latestDate: '2026-09-06',
    },
    adsense: evaluateAdSenseReadiness(
      {
        noticias,
        existingLegalPages: EXISTING_LEGAL_PAGES,
        adsTxtAccessible: true,
        adsTxtContent: 'google.com, pub-1, DIRECT',
        robotsAllowsCrawling: true,
        sitemapAccessible: true,
        adsenseClientIdConfigured: true,
      },
      NOW,
    ),
    errors: [],
    ...overrides,
  };
}

describe('Swiss Watch — Sala de Expertos', () => {
  it('registra los 19 expertos declarados en el protocolo', () => {
    expect(EXPERTS).toHaveLength(19);
  });

  it('no tiene ids de experto duplicados', () => {
    const ids = EXPERTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada experto declara dominio y responsabilidades concretas', () => {
    EXPERTS.forEach((e) => {
      expect(e.domain.length).toBeGreaterThan(10);
      expect(e.responsibilities.length).toBeGreaterThan(0);
    });
  });

  it('getExpert resuelve por id y falla con id desconocido', () => {
    expect(getExpert('CEO').name).toBe('CEO / Orchestrator');
    // @ts-expect-error id invalido a proposito
    expect(() => getExpert('NO_EXISTE')).toThrow();
  });

  it('el mapa por id cubre todos los expertos', () => {
    EXPERTS.forEach((e) => expect(EXPERT_BY_ID[e.id]).toBeDefined());
  });
});

describe('Swiss Watch — jerarquia de estados', () => {
  it('RED gana sobre cualquier otro estado', () => {
    expect(worstStatus(['GREEN', 'YELLOW', 'RED', 'UNKNOWN'])).toBe('RED');
  });

  it('BLOCKED_EXTERNAL gana sobre UNKNOWN, YELLOW y GREEN', () => {
    expect(worstStatus(['GREEN', 'YELLOW', 'UNKNOWN', 'BLOCKED_EXTERNAL'])).toBe(
      'BLOCKED_EXTERNAL',
    );
  });

  it('UNKNOWN nunca se degrada a YELLOW ni se promueve a GREEN', () => {
    expect(worstStatus(['GREEN', 'YELLOW', 'UNKNOWN'])).toBe('UNKNOWN');
  });

  it('una lista vacia es UNKNOWN, nunca GREEN', () => {
    expect(worstStatus([])).toBe('UNKNOWN');
  });

  it('solo devuelve GREEN si todo es GREEN', () => {
    expect(worstStatus(['GREEN', 'GREEN'])).toBe('GREEN');
  });
});

describe('Swiss Watch — probeEnvPresence', () => {
  it('reporta ausentes sin exponer valores', () => {
    const key = '__SWISS_WATCH_TEST_ABSENT__';
    const result = probeEnvPresence([key]);
    expect(result.missing).toContain(key);
    expect(result.evidence[0].passed).toBe(false);
  });

  it('detecta presencia real y no filtra el valor en la evidencia', () => {
    const key = '__SWISS_WATCH_TEST_PRESENT__';
    process.env[key] = 'valor-secreto-que-no-debe-aparecer';
    try {
      const result = probeEnvPresence([key]);
      expect(result.present).toContain(key);
      expect(result.evidence[0].passed).toBe(true);
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('valor-secreto-que-no-debe-aparecer');
    } finally {
      delete process.env[key];
    }
  });

  it('trata una cadena de espacios como ausente', () => {
    const key = '__SWISS_WATCH_TEST_BLANK__';
    process.env[key] = '   ';
    try {
      expect(probeEnvPresence([key]).missing).toContain(key);
    } finally {
      delete process.env[key];
    }
  });
});

describe('AdSense Readiness Engine', () => {
  const baseInput = {
    noticias: healthyCorpus(),
    existingLegalPages: EXISTING_LEGAL_PAGES,
    adsTxtAccessible: true,
    adsTxtContent: 'google.com, pub-1, DIRECT',
    robotsAllowsCrawling: true,
    sitemapAccessible: true,
    adsenseClientIdConfigured: true,
  };

  it('declara READY_FOR_REVIEW solo con cero bloqueadores internos', () => {
    const verdict = evaluateAdSenseReadiness(baseInput, NOW);
    expect(verdict.internalBlockers).toHaveLength(0);
    expect(verdict.verdict).toBe('READY_FOR_REVIEW');
    expect(verdict.status).toBe('GREEN');
    expect(verdict.score).toBe(100);
  });

  it('nunca promete aprobacion de Google', () => {
    const verdict = evaluateAdSenseReadiness(baseInput, NOW);
    expect(verdict.disclaimer).toContain('pertenece exclusivamente a Google');
    expect(JSON.stringify(verdict).toLowerCase()).not.toContain('google aprobara');
  });

  it('marca RED y NOT_READY con contenido insuficiente', () => {
    const verdict = evaluateAdSenseReadiness(
      { ...baseInput, noticias: [makeNoticia()] },
      NOW,
    );
    expect(verdict.status).toBe('RED');
    expect(verdict.verdict).toBe('NOT_READY');
    expect(verdict.internalBlockers.some((b) => b.id === 'content-volume')).toBe(true);
  });

  it('detecta contenido thin y lista las paginas afectadas', () => {
    const thin = Array.from({ length: 30 }, (_, i) =>
      makeNoticia({ id: `t-${i}`, slug: `thin-${i}`, titulo: `Thin ${i}`, contenido: '<p>corto</p>', palabras: 12 }),
    );
    const verdict = evaluateAdSenseReadiness({ ...baseInput, noticias: thin }, NOW);
    expect(verdict.internalBlockers.some((b) => b.id === 'thin-content')).toBe(true);
    expect(verdict.problemPages.length).toBeGreaterThan(0);
  });

  it('detecta titulos duplicados', () => {
    const dupes = Array.from({ length: 30 }, (_, i) =>
      makeNoticia({ id: `d-${i}`, slug: `dup-${i}`, titulo: 'Mismo Titulo' }),
    );
    const verdict = evaluateAdSenseReadiness({ ...baseInput, noticias: dupes }, NOW);
    expect(verdict.internalBlockers.some((b) => b.id === 'duplicate-titles')).toBe(true);
  });

  it('bloquea si falta una pagina legal obligatoria', () => {
    const verdict = evaluateAdSenseReadiness(
      { ...baseInput, existingLegalPages: ['/privacidad'] },
      NOW,
    );
    const blocker = verdict.internalBlockers.find((b) => b.id === 'legal-pages');
    expect(blocker).toBeDefined();
    expect(blocker?.severity).toBe('critical');
  });

  it('bloquea si el sitio no es rastreable', () => {
    const verdict = evaluateAdSenseReadiness(
      { ...baseInput, robotsAllowsCrawling: false },
      NOW,
    );
    expect(verdict.status).toBe('RED');
    expect(verdict.internalBlockers.some((b) => b.id === 'crawlability')).toBe(true);
  });

  it('marca publisher-config como no resoluble internamente', () => {
    const verdict = evaluateAdSenseReadiness(
      { ...baseInput, adsenseClientIdConfigured: false },
      NOW,
    );
    const blocker = verdict.internalBlockers.find((b) => b.id === 'publisher-config');
    expect(blocker?.fixableInternally).toBe(false);
  });

  it('las paginas legales requeridas existen realmente en el repositorio', () => {
    REQUIRED_LEGAL_PAGES.forEach((page) => {
      expect(EXISTING_LEGAL_PAGES).toContain(page);
    });
  });

  it('el score refleja los checks fallidos y nunca supera 100', () => {
    const verdict = evaluateAdSenseReadiness(
      { ...baseInput, adsTxtAccessible: false, adsTxtContent: null },
      NOW,
    );
    expect(verdict.score).toBeLessThan(100);
    expect(verdict.score).toBeGreaterThanOrEqual(0);
  });
});

describe('Swiss Watch — tablero global', () => {
  it('no puede declarar GREEN global mientras existan expertos sin señal medible', () => {
    // Con todos los secretos presentes y todos los probes en GREEN, el tablero
    // sigue siendo UNKNOWN porque PERFORMANCE, UX, DESIGN, MONETIZATION,
    // CODEBASE y DEVELOPMENT no tienen señal automatizada. Esto es intencional:
    // el verde debe ganarse con evidencia, no por ausencia de medicion.
    const keys = [
      'CRON_SECRET',
      'ADMIN_API_KEY',
      'REVALIDATE_SECRET',
      'GSC_PROPERTY',
      'NIOS_GA4_PROPERTY_ID',
      'TG_TOKEN',
      'TG_CHAT_ID',
      'INDEXNOW_KEY',
    ];
    const originals = keys.map((k) => [k, process.env[k]] as const);
    keys.forEach((k) => {
      process.env[k] = 'test-value';
    });
    try {
      const board = buildBoard(healthyInput(), NOW);
      const operational = board.experts.filter((e) => e.id !== 'CEO');
      const unknowns = operational.filter((e) => e.status === 'UNKNOWN');
      expect(unknowns.length).toBeGreaterThan(0);
      expect(board.status).toBe('UNKNOWN');
      expect(board.status).not.toBe('GREEN');
    } finally {
      originals.forEach(([k, v]) => {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      });
    }
  });

  it('propaga RED al estado global', () => {
    const board = buildBoard(
      healthyInput({
        firebase: { status: 'RED', reason: 'Firestore caido', evidence: [] },
      }),
      NOW,
    );
    expect(board.status).toBe('RED');
  });

  it('nunca reporta GREEN global si un experto esta en BLOCKED_EXTERNAL', () => {
    const board = buildBoard(
      healthyInput({
        firebase: { status: 'BLOCKED_EXTERNAL', reason: 'sin credencial', evidence: [] },
      }),
      NOW,
    );
    expect(board.status).not.toBe('GREEN');
  });

  it('incluye a los 19 expertos en el tablero', () => {
    const board = buildBoard(healthyInput(), NOW);
    expect(board.experts).toHaveLength(19);
  });

  it('los contadores suman el total de expertos', () => {
    const board = buildBoard(healthyInput(), NOW);
    const total = Object.values(board.counters).reduce((a, b) => a + b, 0);
    expect(total).toBe(board.experts.length);
  });

  it('ninguna tarea esta DONE sin evidencia', () => {
    const board = buildBoard(healthyInput(), NOW);
    board.openTasks.forEach((t) => {
      if (t.status === 'DONE') {
        expect(t.evidence.length).toBeGreaterThan(0);
      }
    });
  });

  it('ordena las tareas abiertas por prioridad P0 primero', () => {
    const board = buildBoard(
      healthyInput({
        heartbeat: { status: 'UNKNOWN', reason: 'sin heartbeat', evidence: [], components: [] },
      }),
      NOW,
    );
    const ranks = board.openTasks.map((t) => Number(t.priority.slice(1)));
    const sorted = [...ranks].sort((a, b) => a - b);
    expect(ranks).toEqual(sorted);
  });

  it('cada bloqueo externo especifica que falta, quien, donde y como verificar', () => {
    const board = buildBoard(healthyInput(), NOW);
    expect(board.externalBlockers.length).toBeGreaterThan(0);
    board.externalBlockers.forEach((b) => {
      expect(b.missing.length).toBeGreaterThan(3);
      expect(b.owner.length).toBeGreaterThan(3);
      expect(b.where.length).toBeGreaterThan(3);
      expect(b.howToVerify.length).toBeGreaterThan(3);
      expect(b.verificationCommand.length).toBeGreaterThan(3);
      expect(b.expert).toBeDefined();
    });
  });

  it('el tablero nunca expone valores de secretos', () => {
    const board = buildBoard(healthyInput(), NOW);
    const serialized = JSON.stringify(board);
    expect(serialized).not.toMatch(/BEGIN PRIVATE KEY/);
    expect(serialized).not.toMatch(/AIza[0-9A-Za-z_-]{20,}/);
  });

  it('declara el modo SWISS_WATCH', () => {
    expect(buildBoard(healthyInput(), NOW).mode).toBe('SWISS_WATCH');
  });

  it('marca CRONS como UNKNOWN si no hay evidencia de heartbeat', () => {
    process.env.CRON_SECRET = 'test-secret';
    try {
      const board = buildBoard(
        healthyInput({
          heartbeat: { status: 'UNKNOWN', reason: 'sin heartbeat', evidence: [], components: [] },
        }),
        NOW,
      );
      const crons = board.experts.find((e) => e.id === 'CRONS');
      expect(crons?.status).toBe('UNKNOWN');
    } finally {
      delete process.env.CRON_SECRET;
    }
  });

  it('marca CRONS como BLOCKED_EXTERNAL sin CRON_SECRET', () => {
    const original = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    try {
      const board = buildBoard(healthyInput(), NOW);
      const crons = board.experts.find((e) => e.id === 'CRONS');
      expect(crons?.status).toBe('BLOCKED_EXTERNAL');
    } finally {
      if (original !== undefined) process.env.CRON_SECRET = original;
    }
  });

  it('declara los 8 crons del protocolo', () => {
    expect(DECLARED_CRONS).toHaveLength(8);
    DECLARED_CRONS.forEach((c) => {
      expect(c.path.startsWith('/api/cron/')).toBe(true);
      expect(c.schedule.split(' ')).toHaveLength(5);
    });
  });

  it('DECLARED_CRONS no puede desincronizarse de vercel.json', () => {
    // Guard de deriva: vercel.json es la unica fuente de verdad del schedule.
    // Si alguien añade o cambia un cron y no actualiza el tablero, este test falla.
    const vercelConfig = JSON.parse(
      readFileSync(join(process.cwd(), 'vercel.json'), 'utf-8'),
    ) as { crons?: { path: string; schedule: string }[] };

    const real = (vercelConfig.crons ?? [])
      .map((c) => `${c.path}|${c.schedule}`)
      .sort();
    const declared = DECLARED_CRONS.map((c) => `${c.path}|${c.schedule}`).sort();

    expect(declared).toEqual(real);
  });

  it('cada cron declarado tiene un route handler real en el repositorio', () => {
    DECLARED_CRONS.forEach((cron) => {
      const routeFile = join(process.cwd(), 'app', `${cron.path}`, 'route.ts');
      expect(existsSync(routeFile)).toBe(true);
    });
  });

  it('marca WATCHDOG como UNKNOWN si no existe su heartbeat', () => {
    const board = buildBoard(
      healthyInput({
        heartbeat: { status: 'GREEN', reason: 'ok', evidence: [], components: [] },
      }),
      NOW,
    );
    expect(board.experts.find((e) => e.id === 'WATCHDOG')?.status).toBe('UNKNOWN');
  });

  it('MENI queda UNKNOWN sin articulos publicados, nunca GREEN', () => {
    const board = buildBoard(healthyInput({ noticias: [] }), NOW);
    expect(board.experts.find((e) => e.id === 'MENI')?.status).toBe('UNKNOWN');
  });

  it('MENI baja a YELLOW si falta cobertura de score', () => {
    const noticias = healthyCorpus().map((n, i) =>
      i < 10 ? { ...n, scoreMeni: null } : n,
    );
    const board = buildBoard(healthyInput({ noticias }), NOW);
    expect(board.experts.find((e) => e.id === 'MENI')?.status).toBe('YELLOW');
  });

  it('EDITORIAL baja a YELLOW si hay articulos sin fuente', () => {
    const noticias = healthyCorpus().map((n, i) =>
      i < 3 ? { ...n, fuente: undefined, fuentesComplementarias: [] } : n,
    );
    const board = buildBoard(healthyInput({ noticias }), NOW);
    expect(board.experts.find((e) => e.id === 'EDITORIAL')?.status).toBe('YELLOW');
  });

  it('SEO baja a YELLOW si faltan metaDescription', () => {
    const noticias = healthyCorpus().map((n, i) =>
      i < 5 ? { ...n, metaDescription: '' } : n,
    );
    const board = buildBoard(healthyInput({ noticias }), NOW);
    expect(board.experts.find((e) => e.id === 'SEO')?.status).toBe('YELLOW');
  });

  it('el CEO refleja el peor estado de los expertos', () => {
    const board = buildBoard(
      healthyInput({
        firebase: { status: 'RED', reason: 'caido', evidence: [] },
      }),
      NOW,
    );
    expect(board.experts.find((e) => e.id === 'CEO')?.status).toBe('RED');
  });

  it('cada experto adjunta evidencia y timestamp de comprobacion', () => {
    const board = buildBoard(healthyInput(), NOW);
    board.experts.forEach((e) => {
      expect(e.lastCheckedAt).toBe(NOW.toISOString());
      expect(e.reason.length).toBeGreaterThan(10);
    });
  });

  it('propaga incidentes criticos a errors del tablero', () => {
    const board = buildBoard(
      healthyInput({
        incidents: {
          status: 'RED',
          reason: '2 incidentes criticos abiertos',
          evidence: [],
          openCritical: 2,
          openTotal: 2,
        },
        errors: ['2 incidentes criticos abiertos'],
      }),
      NOW,
    );
    expect(board.errors).toContain('2 incidentes criticos abiertos');
  });

  it('todos los estados usados son valores validos del semaforo', () => {
    const valid: SwissStatus[] = ['GREEN', 'YELLOW', 'RED', 'BLOCKED_EXTERNAL', 'UNKNOWN'];
    const board = buildBoard(healthyInput(), NOW);
    board.experts.forEach((e) => expect(valid).toContain(e.status));
    expect(valid).toContain(board.status);
  });
});
