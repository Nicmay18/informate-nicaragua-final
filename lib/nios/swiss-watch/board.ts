/**
 * NIOS Swiss Watch — Agregador del tablero.
 *
 * Construye el estado de cada experto a partir de EVIDENCIA REAL y
 * agrega el estado global del sistema.
 *
 * Prohibiciones estructurales:
 *   - No convierte UNKNOWN en GREEN.
 *   - No marca una tarea DONE sin evidencia.
 *   - No declara datos reales de Google sin respuesta verificada.
 */

import { getNews } from '@/lib/data';
import { logger } from '@/lib/logger';
import type { Noticia } from '@/lib/types';

import { EXPERTS } from './experts';
import {
  evidence,
  probeEnvPresence,
  probeFirebase,
  probeFirestoreOperational,
  probeHeartbeat,
  probeIncidents,
  probeNiosSnapshot,
  probeAdsenseArtifacts,
  probeGoogleGsc,
  probeGoogleGa4,
  probePublicRuntimeSignals,
  worstStatus,
} from './probes';
import { evaluateAdSenseReadiness, REQUIRED_LEGAL_PAGES } from './adsense-readiness';
import type {
  AdSenseReadinessVerdict,
  ExpertId,
  ExpertReport,
  ExternalBlocker,
  SwissEvidence,
  SwissStatus,
  SwissTask,
  SwissWatchBoard,
} from './types';

/** Crons declarados en `vercel.json`. Fuente unica de verdad del schedule. */
export const DECLARED_CRONS = [
  { path: '/api/cron/nios-collect', schedule: '0 8 * * *' },
  { path: '/api/cron/resumen-diario', schedule: '0 12 * * *' },
  { path: '/api/cron/departamento-central', schedule: '0 0 * * *' },
  { path: '/api/cron/departamento-daily', schedule: '0 6 * * *' },
  { path: '/api/cron/departamento-watchdog', schedule: '0 1 * * *' },
  { path: '/api/cron/nios-ceo-loop', schedule: '0 2 * * *' },
  { path: '/api/cron/supervisor-watch', schedule: '0 4 * * *' },
  { path: '/api/cron/traffic-cleanup', schedule: '0 3 * * *' },
];

/**
 * Rutas legales que existen en el repositorio.
 * Verificado contra el arbol de `app/`.
 */
export const EXISTING_LEGAL_PAGES = [
  '/privacidad',
  '/terminos',
  '/contacto',
  '/nosotros',
  '/cookies',
  '/politica-editorial',
  '/correcciones',
  '/metodologia-editorial',
];

/**
 * Bloqueos externos conocidos, declarados de forma explicita.
 * Cada uno especifica que falta, quien lo aporta, donde y como se verifica.
 */
const EXTERNAL_BLOCKER_CATALOG: Record<string, ExternalBlocker> = {
  ADSENSE_CLIENT_ID: {
    missing: 'GOOGLE_ADSENSE_CLIENT_ID (publisher id de AdSense)',
    owner: 'Propietario de la cuenta de Google AdSense',
    where: 'Vercel > Project informate-nicaragua-nextjs > Settings > Environment Variables > Production',
    howToVerify:
      'Tras el redeploy, GET /api/nios/swiss-watch debe mostrar el check publisher-config en passed:true.',
    verificationCommand: 'curl -s https://nicaraguainformate.com/api/nios/swiss-watch',
  },
  ADSENSE_APPROVAL: {
    missing: 'Aprobacion de la cuenta de AdSense por parte de Google',
    owner: 'Google (decision externa) tras solicitud del propietario',
    where: 'Panel de AdSense > Sitios > Solicitar revision',
    howToVerify:
      'Solo debe solicitarse cuando el motor declare verdict READY_FOR_REVIEW con internalBlockers = 0.',
    verificationCommand: 'curl -s https://nicaraguainformate.com/api/nios/swiss-watch',
  },
  SOCIAL_TOKENS: {
    missing:
      'Tokens de distribucion social: FB_PAGE_ACCESS_TOKEN, FB_PAGE_ID, TWITTER_BEARER_TOKEN, WHATSAPP_BUSINESS_TOKEN, WHATSAPP_PHONE_ID, ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY',
    owner: 'Propietario de las cuentas de Facebook, X, WhatsApp Business y OneSignal',
    where: 'Vercel > Project informate-nicaragua-nextjs > Settings > Environment Variables > Production',
    howToVerify:
      'El experto DISTRIBUTION pasa de BLOCKED_EXTERNAL a GREEN cuando cada canal reporta un envio confirmado.',
    verificationCommand: 'curl -s https://nicaraguainformate.com/api/nios/swiss-watch',
  },
};

/** Variables de entorno requeridas por cada dominio. */
const REQUIRED_ENV: Partial<Record<ExpertId, string[]>> = {
  FIREBASE: ['FIREBASE_PROJECT_ID'],
  GOOGLE_INTELLIGENCE: ['GSC_PROPERTY', 'NIOS_GA4_PROPERTY_ID'],
  CRONS: ['CRON_SECRET'],
  SECURITY: ['ADMIN_API_KEY', 'CRON_SECRET', 'REVALIDATE_SECRET'],
  DISTRIBUTION: ['TG_TOKEN', 'TG_CHAT_ID', 'INDEXNOW_KEY'],
};

/** Genera un id de tarea determinista para permitir deduplicacion. */
function taskId(owner: ExpertId, slug: string): string {
  return `${owner.toLowerCase()}-${slug}`.replace(/[^a-z0-9-]/g, '-');
}

/** Crea una tarea abierta para un experto. */
function makeTask(
  owner: ExpertId,
  slug: string,
  title: string,
  priority: SwissTask['priority'],
  status: SwissTask['status'],
  nextAction: string,
  createdAt: string,
): SwissTask {
  return {
    id: taskId(owner, slug),
    owner,
    title,
    priority,
    status,
    createdAt,
    evidence: [],
    nextAction,
  };
}

export interface BoardInput {
  noticias: Noticia[];
  firebase: Awaited<ReturnType<typeof probeFirebase>>;
  firestore: Awaited<ReturnType<typeof probeFirestoreOperational>>;
  heartbeat: Awaited<ReturnType<typeof probeHeartbeat>>;
  incidents: Awaited<ReturnType<typeof probeIncidents>>;
  snapshot: Awaited<ReturnType<typeof probeNiosSnapshot>>;
  adsense: AdSenseReadinessVerdict;
  adsenseArtifacts?: Awaited<ReturnType<typeof probeAdsenseArtifacts>>;
  googleGsc?: Awaited<ReturnType<typeof probeGoogleGsc>>;
  googleGa4?: Awaited<ReturnType<typeof probeGoogleGa4>>;
  publicSignals?: Awaited<ReturnType<typeof probePublicRuntimeSignals>>;
  errors: string[];
}

/**
 * Construye el tablero completo a partir de resultados de probes ya obtenidos.
 * Funcion pura: sin I/O, determinista y testeable.
 */
export function buildBoard(input: BoardInput, now = new Date()): SwissWatchBoard {
  const at = now.toISOString();
  const reports: ExpertReport[] = [];
  const allTasks: SwissTask[] = [];

  /** Registra el estado de un experto y acumula sus tareas. */
  const push = (
    id: ExpertId,
    status: SwissStatus,
    reason: string,
    ev: SwissEvidence[],
    options: {
      currentAction?: string | null;
      tasks?: SwissTask[];
      externalBlockers?: ExternalBlocker[];
    } = {},
  ) => {
    const def = EXPERTS.find((e) => e.id === id);
    if (!def) throw new Error(`Experto no registrado: ${id}`);
    const tasks = options.tasks ?? [];
    allTasks.push(...tasks);
    reports.push({
      id,
      name: def.name,
      domain: def.domain,
      status,
      reason,
      evidence: ev,
      currentAction: options.currentAction ?? null,
      tasks,
      externalBlockers: options.externalBlockers ?? [],
      lastCheckedAt: at,
    });
  };

  // ── FIREBASE ──────────────────────────────────────────────────────────
  push('FIREBASE', input.firebase.status, input.firebase.reason, input.firebase.evidence, {
    externalBlockers: input.firebase.status === 'BLOCKED_EXTERNAL' ? [] : [],
  });

  // ── FIRESTORE ─────────────────────────────────────────────────────────
  push('FIRESTORE', input.firestore.status, input.firestore.reason, input.firestore.evidence, {
    tasks:
      input.firestore.status === 'GREEN'
        ? []
        : [
            makeTask(
              'FIRESTORE',
              'empty-collections',
              'Poblar o justificar las colecciones operativas vacias',
              'P1',
              input.firestore.status === 'RED' ? 'RUNNING' : 'QUEUED',
              'Ejecutar el ciclo del Departamento Central para generar heartbeat, incidentes y snapshots reales.',
              at,
            ),
          ],
  });

  // ── RELIABILITY ───────────────────────────────────────────────────────
  push('RELIABILITY', input.heartbeat.status, input.heartbeat.reason, input.heartbeat.evidence, {
    tasks:
      input.heartbeat.status === 'GREEN'
        ? []
        : [
            makeTask(
              'RELIABILITY',
              'heartbeat-freshness',
              'Restaurar frescura del heartbeat por componente',
              'P0',
              input.heartbeat.status === 'UNKNOWN' ? 'QUEUED' : 'RUNNING',
              'Ejecutar /api/cron/departamento-central para escribir heartbeat de scheduler, health-check y growth.',
              at,
            ),
          ],
  });

  // ── WATCHDOG ──────────────────────────────────────────────────────────
  const watchdogComponent = input.heartbeat.components.find((c) => c.component === 'watchdog');
  const watchdogStatus: SwissStatus = watchdogComponent
    ? watchdogComponent.status === 'HEALTHY'
      ? 'GREEN'
      : watchdogComponent.status === 'DEGRADED'
        ? 'YELLOW'
        : watchdogComponent.status === 'CRITICAL'
          ? 'RED'
          : 'UNKNOWN'
    : 'UNKNOWN';
  push(
    'WATCHDOG',
    watchdogStatus,
    watchdogComponent
      ? `Heartbeat del watchdog en estado ${watchdogComponent.status}.`
      : 'No existe heartbeat del componente watchdog. No se puede declarar vigilancia activa.',
    [
      evidence(
        'Heartbeat del componente watchdog',
        watchdogComponent
          ? `${watchdogComponent.status}, ultima ejecucion ${watchdogComponent.lastRunAt ?? 'desconocida'}`
          : 'No hay documento de heartbeat para watchdog',
        'firestore',
        watchdogStatus === 'GREEN',
      ),
    ],
    {
      tasks:
        watchdogStatus === 'GREEN'
          ? []
          : [
              makeTask(
                'WATCHDOG',
                'activate-watchdog',
                'Activar y verificar el ciclo del watchdog',
                'P0',
                'QUEUED',
                'Ejecutar /api/cron/departamento-watchdog y confirmar escritura de heartbeat watchdog.',
                at,
              ),
            ],
    },
  );

  // ── CRONS ─────────────────────────────────────────────────────────────
  const cronSecret = probeEnvPresence(REQUIRED_ENV.CRONS ?? []);
  const cronEvidence: SwissEvidence[] = [
    evidence(
      'Crons declarados en vercel.json',
      `${DECLARED_CRONS.length} cron(s) declarados con expresiones diarias`,
      'config',
      DECLARED_CRONS.length === 8,
    ),
    ...cronSecret.evidence,
  ];
  // Un cron declarado no es un cron ejecutado. La ejecucion se prueba con
  // heartbeat fresco, que es lo que escriben los propios crons.
  const cronExecuted = input.heartbeat.status === 'GREEN' || input.heartbeat.status === 'YELLOW';
  cronEvidence.push(
    evidence(
      'Evidencia de ejecucion real de crons',
      cronExecuted
        ? 'Existe heartbeat escrito por los crons del Departamento Central'
        : 'No hay heartbeat escrito por crons: no se puede probar ejecucion',
      'firestore',
      cronExecuted,
    ),
  );
  const cronStatus: SwissStatus =
    cronSecret.missing.length > 0 ? 'BLOCKED_EXTERNAL' : cronExecuted ? 'GREEN' : 'UNKNOWN';
  push(
    'CRONS',
    cronStatus,
    cronSecret.missing.length > 0
      ? 'CRON_SECRET no esta presente en este runtime: los crons no pueden autenticarse.'
      : cronExecuted
        ? `Los ${DECLARED_CRONS.length} crons estan declarados y hay evidencia de escritura de heartbeat.`
        : `Los ${DECLARED_CRONS.length} crons estan declarados pero no hay evidencia de ejecucion real.`,
    cronEvidence,
    {
      tasks:
        cronStatus === 'GREEN'
          ? []
          : [
              makeTask(
                'CRONS',
                'prove-execution',
                'Obtener evidencia de ejecucion real de cada cron',
                'P0',
                'QUEUED',
                'Revisar los logs de cron de Vercel y confirmar el registro de resultado por cada ruta.',
                at,
              ),
            ],
    },
  );

  // ── SECURITY ──────────────────────────────────────────────────────────
  const secEnv = probeEnvPresence(REQUIRED_ENV.SECURITY ?? []);
  const securityStatus: SwissStatus = secEnv.missing.length > 0 ? 'BLOCKED_EXTERNAL' : 'GREEN';
  push(
    'SECURITY',
    securityStatus,
    secEnv.missing.length > 0
      ? `Faltan secretos de proteccion en runtime: ${secEnv.missing.join(', ')}.`
      : 'Los secretos de administracion, cron y revalidacion estan presentes en el runtime.',
    secEnv.evidence,
  );

  // ── GOOGLE INTELLIGENCE ───────────────────────────────────────────────
  const googleGsc = input.googleGsc ?? {
    status: 'UNKNOWN' as SwissStatus,
    reason: 'Probe GSC no ejecutado en esta construccion de tablero.',
    evidence: [evidence('GSC probe', 'Sin dato', 'runtime', false)],
    dataStatus: 'UNKNOWN',
  };
  const googleGa4 = input.googleGa4 ?? {
    status: 'UNKNOWN' as SwissStatus,
    reason: 'Probe GA4 no ejecutado en esta construccion de tablero.',
    evidence: [evidence('GA4 probe', 'Sin dato', 'runtime', false)],
    dataStatus: 'UNKNOWN',
  };
  const googleStatus = worstStatus([googleGsc.status, googleGa4.status]);
  const googleReason = `${googleGsc.reason} | ${googleGa4.reason}`;
  push(
    'GOOGLE_INTELLIGENCE',
    googleStatus,
    googleReason,
    [...googleGsc.evidence, ...googleGa4.evidence],
    {
      tasks:
        googleStatus === 'GREEN'
          ? []
          : [
              makeTask(
                'GOOGLE_INTELLIGENCE',
                'collect-real-metrics',
                'Ejecutar la recoleccion real de GSC y GA4',
                'P1',
                'QUEUED',
                'Ejecutar /api/cron/nios-collect y verificar que el snapshot registre status REAL.',
                at,
              ),
            ],
    },
  );

  // ── ADSENSE READINESS ─────────────────────────────────────────────────
  const adsenseBlockers: ExternalBlocker[] = [];
  if (input.adsense.internalBlockers.some((b) => b.id === 'publisher-config')) {
    adsenseBlockers.push(EXTERNAL_BLOCKER_CATALOG.ADSENSE_CLIENT_ID);
  }
  if (input.adsense.verdict === 'READY_FOR_REVIEW') {
    adsenseBlockers.push(EXTERNAL_BLOCKER_CATALOG.ADSENSE_APPROVAL);
  }
  push(
    'ADSENSE_READINESS',
    input.adsense.status,
    `${input.adsense.verdict} con score interno ${input.adsense.score}/100 y ${input.adsense.internalBlockers.length} bloqueador(es) interno(s). ${input.adsense.disclaimer}`,
    input.adsense.checks.map((c) =>
      evidence(c.label, c.detail, 'runtime', c.passed),
    ),
    {
      externalBlockers: adsenseBlockers,
      tasks: input.adsense.internalBlockers
        .filter((b) => b.fixableInternally)
        .map((b) =>
          makeTask(
            'ADSENSE_READINESS',
            b.id,
            b.problem,
            b.severity === 'critical' ? 'P1' : 'P2',
            'QUEUED',
            b.correctiveAction,
            at,
          ),
        ),
    },
  );

  // ── DISTRIBUTION ──────────────────────────────────────────────────────
  const distEnv = probeEnvPresence(REQUIRED_ENV.DISTRIBUTION ?? []);
  const distStatus: SwissStatus = distEnv.missing.length > 0 ? 'BLOCKED_EXTERNAL' : 'YELLOW';
  push(
    'DISTRIBUTION',
    distStatus,
    distEnv.missing.length > 0
      ? `Faltan credenciales de distribucion en runtime: ${distEnv.missing.join(', ')}.`
      : 'Telegram e IndexNow estan configurados. Las redes sociales adicionales siguen sin credenciales, por lo que la cobertura es parcial.',
    distEnv.evidence,
    {
      externalBlockers: [EXTERNAL_BLOCKER_CATALOG.SOCIAL_TOKENS],
      tasks: [
        makeTask(
          'DISTRIBUTION',
          'confirm-delivery',
          'Confirmar entrega real en cada canal configurado',
          'P1',
          'QUEUED',
          'Registrar confirmacion de envio por canal y activar retry ante fallo.',
          at,
        ),
      ],
    },
  );

  // ── MENI ──────────────────────────────────────────────────────────────
  const published = input.noticias.filter((n) => n.estado === 'publicado');
  const scored = published.filter((n) => typeof n.scoreMeni === 'number');
  const meniCoverage = published.length ? scored.length / published.length : 0;
  const meniStatus: SwissStatus =
    published.length === 0 ? 'UNKNOWN' : meniCoverage >= 0.95 ? 'GREEN' : 'YELLOW';
  push(
    'MENI',
    meniStatus,
    published.length === 0
      ? 'No hay articulos publicados disponibles para evaluar la cobertura de MENI.'
      : `MENI ha puntuado ${scored.length}/${published.length} articulos publicados (${(meniCoverage * 100).toFixed(1)}%).`,
    [
      evidence(
        'Cobertura de scoring MENI sobre articulos publicados',
        `${scored.length}/${published.length} con scoreMeni numerico`,
        'firestore',
        meniCoverage >= 0.95,
      ),
    ],
    {
      tasks:
        meniStatus === 'GREEN'
          ? []
          : [
              makeTask(
                'MENI',
                'score-coverage',
                'Puntuar los articulos publicados sin scoreMeni',
                'P1',
                'QUEUED',
                'Reprocesar el corpus con el motor MENI y persistir scoreMeni por articulo.',
                at,
              ),
            ],
    },
  );

  // ── EDITORIAL ─────────────────────────────────────────────────────────
  const withoutSource = published.filter(
    (n) => !n.fuente?.trim() && !(n.fuentesComplementarias?.length ?? 0),
  );
  const editorialStatus: SwissStatus =
    published.length === 0 ? 'UNKNOWN' : withoutSource.length === 0 ? 'GREEN' : 'YELLOW';
  push(
    'EDITORIAL',
    editorialStatus,
    published.length === 0
      ? 'No hay articulos publicados para auditar atribucion.'
      : `${withoutSource.length}/${published.length} articulos publicados no declaran ninguna fuente.`,
    [
      evidence(
        'Atribucion de fuentes en articulos publicados',
        `${published.length - withoutSource.length}/${published.length} con fuente declarada`,
        'firestore',
        withoutSource.length === 0,
      ),
    ],
    {
      tasks:
        editorialStatus === 'GREEN'
          ? []
          : [
              makeTask(
                'EDITORIAL',
                'declare-sources',
                'Declarar fuente en los articulos que no la tienen',
                'P2',
                'QUEUED',
                'Revisar cada articulo sin fuente y declarar la atribucion real. No inventar fuentes.',
                at,
              ),
            ],
    },
  );

  // ── SEO ───────────────────────────────────────────────────────────────
  const withoutMeta = published.filter((n) => !n.metaDescription?.trim());
  const seoStatus: SwissStatus =
    published.length === 0 ? 'UNKNOWN' : withoutMeta.length === 0 ? 'GREEN' : 'YELLOW';
  push(
    'SEO',
    seoStatus,
    published.length === 0
      ? 'No hay articulos publicados para auditar metadata.'
      : `${withoutMeta.length}/${published.length} articulos publicados sin metaDescription.`,
    [
      evidence(
        'metaDescription en articulos publicados',
        `${published.length - withoutMeta.length}/${published.length} con metaDescription`,
        'firestore',
        withoutMeta.length === 0,
      ),
      evidence(
        'Paginas legales e institucionales presentes',
        `${EXISTING_LEGAL_PAGES.length} rutas institucionales en el arbol de app/`,
        'filesystem',
        REQUIRED_LEGAL_PAGES.every((p) => EXISTING_LEGAL_PAGES.includes(p)),
      ),
    ],
    {
      tasks:
        seoStatus === 'GREEN'
          ? []
          : [
              makeTask(
                'SEO',
                'meta-description',
                'Generar metaDescription para los articulos que no la tienen',
                'P2',
                'QUEUED',
                'Derivar metaDescription del resumen real del articulo, sin inventar contenido.',
                at,
              ),
            ],
    },
  );

  // ── CEO ───────────────────────────────────────────────────────────────
  // El CEO refleja el peor estado de los expertos que ya se han evaluado.
  const evaluated = reports.map((r) => r.status);
  const ceoStatus = worstStatus(evaluated);
  push(
    'CEO',
    ceoStatus,
    `El CEO refleja el peor estado de los ${reports.length} expertos evaluados: ${ceoStatus}.`,
    [
      evidence(
        'Agregacion de estados de expertos',
        `${reports.filter((r) => r.status === 'GREEN').length} GREEN, ${
          reports.filter((r) => r.status === 'YELLOW').length
        } YELLOW, ${reports.filter((r) => r.status === 'RED').length} RED, ${
          reports.filter((r) => r.status === 'BLOCKED_EXTERNAL').length
        } BLOCKED_EXTERNAL, ${reports.filter((r) => r.status === 'UNKNOWN').length} UNKNOWN`,
        'runtime',
        ceoStatus === 'GREEN',
      ),
    ],
    { currentAction: 'Priorizando tareas abiertas por P0 > P1 > P2 > P3.' },
  );

  // ── Expertos medidos desde runtime publico ────────────────────────────
  const unknownSignal = (id: ExpertId, detail: string) => ({
    status: 'UNKNOWN' as SwissStatus,
    reason: `Probe de ${id} no ejecutado: ${detail}`,
    evidence: [evidence(`Señal publica para ${id}`, detail, 'runtime', false)],
  });

  const signals = input.publicSignals ?? {
    adsenseArtifacts: {
      adsTxtAccessible: false,
      adsTxtContent: null,
      adsTxtHasPublisherId: false,
      robotsAllowsCrawling: false,
      sitemapAccessible: false,
    },
    performance: unknownSignal('PERFORMANCE', 'TTFB de la home no medido'),
    ux: unknownSignal('UX', 'Estructura HTML de la home no evaluada'),
    design: unknownSignal('DESIGN', 'Tokens visuales de la home no evaluados'),
    monetization: unknownSignal('MONETIZATION', 'Artefactos de monetizacion no verificados'),
    codebase: unknownSignal('CODEBASE', 'Configuracion del runtime no leida'),
    development: unknownSignal('DEVELOPMENT', 'Scripts de desarrollo no verificados'),
  };

  const pushPublic = (id: ExpertId, signal: typeof signals.performance) => {
    push(
      id,
      signal.status,
      signal.reason,
      signal.evidence,
      {
        tasks:
          signal.status === 'GREEN'
            ? []
            : [
                makeTask(
                  id,
                  'improve-signal',
                  `Mejorar evidencia medible para ${id}`,
                  id === 'PERFORMANCE' ? 'P1' : 'P2',
                  'QUEUED',
                  signal.reason,
                  at,
                ),
              ],
      },
    );
  };

  pushPublic('PERFORMANCE', signals.performance);
  pushPublic('UX', signals.ux);
  pushPublic('DESIGN', signals.design);
  pushPublic('MONETIZATION', signals.monetization);
  pushPublic('CODEBASE', signals.codebase);
  pushPublic('DEVELOPMENT', signals.development);

  // ── Agregacion global ─────────────────────────────────────────────────
  const counters: Record<SwissStatus, number> = {
    GREEN: 0,
    YELLOW: 0,
    RED: 0,
    BLOCKED_EXTERNAL: 0,
    UNKNOWN: 0,
  };
  reports.forEach((r) => {
    counters[r.status] += 1;
  });

  // El estado global excluye al CEO para no contar dos veces el mismo peor caso.
  const globalStatus = worstStatus(
    reports.filter((r) => r.id !== 'CEO').map((r) => r.status),
  );

  const externalBlockers = reports.flatMap((r) =>
    r.externalBlockers.map((b) => ({ ...b, expert: r.id })),
  );

  const priorityRank: Record<SwissTask['priority'], number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  const openTasks = allTasks
    .filter((t) => t.status !== 'DONE')
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  const summary =
    globalStatus === 'GREEN'
      ? `Los ${reports.length - 1} expertos operativos estan en GREEN con evidencia verificada.`
      : `Estado global ${globalStatus}. ${counters.GREEN} GREEN, ${counters.YELLOW} YELLOW, ${counters.RED} RED, ${counters.BLOCKED_EXTERNAL} BLOCKED_EXTERNAL, ${counters.UNKNOWN} UNKNOWN. ${openTasks.length} tarea(s) abierta(s).`;

  return {
    generatedAt: at,
    status: globalStatus,
    summary,
    mode: 'SWISS_WATCH',
    counters,
    experts: reports.sort((a, b) => {
      const oa = EXPERTS.find((e) => e.id === a.id)?.executionOrder ?? 99;
      const ob = EXPERTS.find((e) => e.id === b.id)?.executionOrder ?? 99;
      return oa - ob;
    }),
    openTasks,
    externalBlockers,
    adsense: input.adsense,
    errors: input.errors,
  };
}

/**
 * Ejecuta todos los probes reales y construye el tablero.
 * Cada fallo se registra en `errors` sin abortar el tablero completo.
 */
export async function getSwissWatchBoard(now = new Date()): Promise<SwissWatchBoard> {
  const errors: string[] = [];

  let noticias: Noticia[] = [];
  try {
    noticias = await getNews(500);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[swiss-watch] Error cargando noticias', { error: message });
    errors.push(`No se pudieron cargar las noticias: ${message}`);
  }

  const [firebase, firestore, heartbeat, incidents, snapshot, publicSignals, googleGsc, googleGa4] =
    await Promise.all([
      probeFirebase(),
      probeFirestoreOperational(),
      probeHeartbeat(now.getTime()),
      probeIncidents(),
      probeNiosSnapshot(now.getTime()),
      probePublicRuntimeSignals(),
      probeGoogleGsc(),
      probeGoogleGa4(),
    ]);

  const adsenseArtifacts = publicSignals.adsenseArtifacts;

  const adsense = evaluateAdSenseReadiness(
    {
      noticias,
      existingLegalPages: EXISTING_LEGAL_PAGES,
      adsTxtAccessible: adsenseArtifacts.adsTxtAccessible,
      adsTxtContent: adsenseArtifacts.adsTxtContent,
      robotsAllowsCrawling: adsenseArtifacts.robotsAllowsCrawling,
      sitemapAccessible: adsenseArtifacts.sitemapAccessible,
      adsenseClientIdConfigured:
        Boolean(process.env.GOOGLE_ADSENSE_CLIENT_ID?.trim()) ||
        adsenseArtifacts.adsTxtHasPublisherId,
    },
    now,
  );

  if (incidents.status === 'RED') {
    errors.push(incidents.reason);
  }

  return buildBoard(
    { noticias, firebase, firestore, heartbeat, incidents, snapshot, adsense, adsenseArtifacts, publicSignals, googleGsc, googleGa4, errors },
    now,
  );
}
