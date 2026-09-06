/**
 * NIOS Swiss Watch — Probes de runtime.
 *
 * Cada probe devuelve EVIDENCIA REAL o UNKNOWN.
 *
 * Reglas:
 *   - Nunca se inventa un valor.
 *   - Si una lectura falla, el probe devuelve `passed: false` con el error real.
 *   - Si algo no es medible, se devuelve UNKNOWN en lugar de asumir GREEN.
 */

import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { collectGscData } from '@/lib/nios/collectors/gsc';
import { collectGa4Data } from '@/lib/nios/collectors/ga4';
import type { SwissEvidence, SwissStatus } from './types';

/** Construye una evidencia con timestamp coherente. */
export function evidence(
  check: string,
  observed: string,
  source: SwissEvidence['source'],
  passed: boolean,
  observedAt = new Date().toISOString(),
): SwissEvidence {
  return { check, observed, source, passed, observedAt };
}

/**
 * Comprueba la presencia de variables de entorno en el runtime actual.
 *
 * IMPORTANTE: solo se comprueba PRESENCIA y longitud. Nunca se registra,
 * imprime ni devuelve el valor de un secreto.
 *
 * Nota forense: `vercel env pull` devuelve cadena vacia para variables
 * marcadas como "Sensitive/Encrypted". Por eso la presencia debe medirse
 * dentro del runtime desplegado, no desde el CLI.
 */
export function probeEnvPresence(keys: string[]): {
  present: string[];
  missing: string[];
  evidence: SwissEvidence[];
} {
  const present: string[] = [];
  const missing: string[] = [];

  for (const key of keys) {
    const raw = process.env[key];
    if (typeof raw === 'string' && raw.trim().length > 0) {
      present.push(key);
    } else {
      missing.push(key);
    }
  }

  const ev = [
    evidence(
      `Presencia de ${keys.length} variables de entorno`,
      `${present.length} presentes, ${missing.length} ausentes${
        missing.length ? ` (ausentes: ${missing.join(', ')})` : ''
      }`,
      'runtime',
      missing.length === 0,
    ),
  ];

  return { present, missing, evidence: ev };
}

/** Resultado de una lectura de Firestore. */
export interface CollectionProbe {
  collection: string;
  /** Numero de documentos leidos, o null si la lectura fallo. */
  count: number | null;
  /** Timestamp mas reciente encontrado, si el campo existe. */
  latestAt: string | null;
  error: string | null;
}

/**
 * Lee un conteo acotado de una coleccion.
 * Usa `limit` para no generar coste innecesario de lecturas.
 */
export async function probeCollection(
  collection: string,
  options: { limit?: number; orderByField?: string } = {},
): Promise<CollectionProbe> {
  const limit = options.limit ?? 5;
  try {
    const db = getAdminDb();
    let query = db.collection(collection).limit(limit);
    if (options.orderByField) {
      query = db.collection(collection).orderBy(options.orderByField, 'desc').limit(limit);
    }
    const snap = await query.get();

    let latestAt: string | null = null;
    if (options.orderByField && !snap.empty) {
      const value = snap.docs[0].get(options.orderByField);
      latestAt = typeof value === 'string' ? value : null;
    }

    return { collection, count: snap.size, latestAt, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[swiss-watch] Error leyendo coleccion', { collection, error: message });
    return { collection, count: null, latestAt: null, error: message };
  }
}

/**
 * Comprueba que el Admin SDK de Firebase se inicializa y que Firestore responde.
 * Realiza una lectura minima real; no asume disponibilidad.
 */
export async function probeFirebase(): Promise<{
  status: SwissStatus;
  reason: string;
  evidence: SwissEvidence[];
}> {
  const ev: SwissEvidence[] = [];

  const envProbe = probeEnvPresence(['FIREBASE_PROJECT_ID']);
  const hasServiceAccount =
    Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim()) ||
    (Boolean(process.env.FIREBASE_CLIENT_EMAIL?.trim()) &&
      Boolean(process.env.FIREBASE_PRIVATE_KEY?.trim()));

  ev.push(
    evidence(
      'Credencial de servicio Firebase disponible en runtime',
      hasServiceAccount
        ? 'FIREBASE_SERVICE_ACCOUNT_BASE64 o el trio PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY esta presente'
        : 'No hay credencial de servicio en el runtime actual',
      'runtime',
      hasServiceAccount,
    ),
  );

  if (!hasServiceAccount) {
    return {
      status: 'BLOCKED_EXTERNAL',
      reason:
        'No hay credencial de servicio de Firebase en este runtime. Sin ella el Admin SDK no puede inicializarse.',
      evidence: [...ev, ...envProbe.evidence],
    };
  }

  const probe = await probeCollection('noticias', { limit: 1 });
  if (probe.error) {
    ev.push(
      evidence(
        'Lectura real de Firestore (coleccion noticias)',
        `Fallo: ${probe.error}`,
        'firestore',
        false,
      ),
    );
    return {
      status: 'RED',
      reason: `El Admin SDK esta configurado pero Firestore no responde: ${probe.error}`,
      evidence: ev,
    };
  }

  ev.push(
    evidence(
      'Lectura real de Firestore (coleccion noticias)',
      `Lectura correcta, ${probe.count} documento(s) devuelto(s)`,
      'firestore',
      true,
    ),
  );

  return {
    status: 'GREEN',
    reason: 'Admin SDK inicializado y Firestore responde a una lectura real.',
    evidence: ev,
  };
}

/**
 * Comprueba las colecciones operativas de NIOS.
 * Devuelve YELLOW cuando una coleccion existe pero esta vacia,
 * porque una coleccion vacia no es un fallo pero tampoco es evidencia de operacion.
 */
export async function probeFirestoreOperational(): Promise<{
  status: SwissStatus;
  reason: string;
  evidence: SwissEvidence[];
  probes: CollectionProbe[];
}> {
  const targets: { name: string; orderByField?: string }[] = [
    { name: 'noticias' },
    { name: 'depto_heartbeat', orderByField: 'lastRunAt' },
    { name: 'depto_incidents' },
    { name: 'nios_daily_snapshots' },
    { name: 'nios_telemetry' },
  ];

  const probes = await Promise.all(
    targets.map((t) => probeCollection(t.name, { limit: 3, orderByField: t.orderByField })),
  );

  const failed = probes.filter((p) => p.error);
  const empty = probes.filter((p) => !p.error && p.count === 0);

  const ev = probes.map((p) =>
    evidence(
      `Coleccion ${p.collection}`,
      p.error
        ? `Error de lectura: ${p.error}`
        : `${p.count} documento(s)${p.latestAt ? `, mas reciente ${p.latestAt}` : ''}`,
      'firestore',
      !p.error && (p.count ?? 0) > 0,
    ),
  );

  if (failed.length > 0) {
    return {
      status: 'RED',
      reason: `Fallo la lectura de ${failed.length} coleccion(es): ${failed
        .map((f) => f.collection)
        .join(', ')}.`,
      evidence: ev,
      probes,
    };
  }

  if (empty.length > 0) {
    return {
      status: 'YELLOW',
      reason: `Firestore responde, pero ${empty.length} coleccion(es) estan vacias: ${empty
        .map((e) => e.collection)
        .join(', ')}. Una coleccion vacia no prueba operacion.`,
      evidence: ev,
      probes,
    };
  }

  return {
    status: 'GREEN',
    reason: 'Todas las colecciones operativas responden y contienen datos.',
    evidence: ev,
    probes,
  };
}

/** Frescura de un heartbeat respecto a su intervalo esperado. */
export interface HeartbeatProbe {
  component: string;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  lastRunAt: string | null;
  ageMs: number | null;
}

/**
 * Lee la coleccion `depto_heartbeat` y clasifica la frescura real.
 * No usa registros historicos como prueba de estado actual.
 */
export async function probeHeartbeat(
  now = Date.now(),
): Promise<{ status: SwissStatus; reason: string; evidence: SwissEvidence[]; components: HeartbeatProbe[] }> {
  try {
    const db = getAdminDb();
    const snap = await db.collection('depto_heartbeat').get();

    if (snap.empty) {
      return {
        status: 'UNKNOWN',
        reason:
          'La coleccion depto_heartbeat existe pero no tiene registros. No se puede declarar salud sin heartbeat.',
        evidence: [
          evidence('Registros de heartbeat', '0 documentos en depto_heartbeat', 'firestore', false),
        ],
        components: [],
      };
    }

    const components: HeartbeatProbe[] = snap.docs.map((doc) => {
      const data = doc.data() as {
        component?: string;
        status?: string;
        lastRunAt?: string;
        nextExpectedAt?: string;
      };
      const lastRunAt = data.lastRunAt ?? null;
      const ageMs = lastRunAt ? now - new Date(lastRunAt).getTime() : null;
      const expected = data.nextExpectedAt ? new Date(data.nextExpectedAt).getTime() : null;

      let status: HeartbeatProbe['status'] = 'UNKNOWN';
      if (data.status === 'down') {
        status = 'CRITICAL';
      } else if (expected !== null && now > expected + 5 * 60 * 1000) {
        status = 'CRITICAL';
      } else if (expected !== null && now > expected) {
        status = 'DEGRADED';
      } else if (data.status === 'degraded') {
        status = 'DEGRADED';
      } else if (data.status === 'healthy') {
        status = 'HEALTHY';
      }

      return { component: data.component ?? doc.id, status, lastRunAt, ageMs };
    });

    const critical = components.filter((c) => c.status === 'CRITICAL');
    const degraded = components.filter((c) => c.status === 'DEGRADED');

    const ev = components.map((c) =>
      evidence(
        `Heartbeat ${c.component}`,
        `${c.status}${c.lastRunAt ? `, ultima ejecucion ${c.lastRunAt}` : ', sin lastRunAt'}`,
        'firestore',
        c.status === 'HEALTHY',
      ),
    );

    if (critical.length > 0) {
      return {
        status: 'RED',
        reason: `${critical.length} componente(s) en CRITICAL: ${critical
          .map((c) => c.component)
          .join(', ')}.`,
        evidence: ev,
        components,
      };
    }

    if (degraded.length > 0) {
      return {
        status: 'YELLOW',
        reason: `${degraded.length} componente(s) en DEGRADED: ${degraded
          .map((c) => c.component)
          .join(', ')}.`,
        evidence: ev,
        components,
      };
    }

    return {
      status: 'GREEN',
      reason: `Los ${components.length} componentes tienen heartbeat fresco.`,
      evidence: ev,
      components,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      status: 'UNKNOWN',
      reason: `No se pudo leer depto_heartbeat: ${message}`,
      evidence: [evidence('Lectura de depto_heartbeat', `Error: ${message}`, 'firestore', false)],
      components: [],
    };
  }
}

/**
 * Lee incidentes abiertos de `depto_incidents`.
 * Un incidente critico abierto impide declarar GREEN global.
 */
export async function probeIncidents(): Promise<{
  status: SwissStatus;
  reason: string;
  evidence: SwissEvidence[];
  openCritical: number;
  openTotal: number;
}> {
  try {
    const db = getAdminDb();
    const snap = await db.collection('depto_incidents').limit(200).get();

    const open = snap.docs
      .map((d) => d.data() as { status?: string; severity?: string; title?: string })
      .filter((i) => i.status !== 'resolved' && i.status !== 'closed');

    const openCritical = open.filter(
      (i) => i.severity === 'critical' || i.severity === 'CRITICAL',
    ).length;

    const ev = [
      evidence(
        'Incidentes abiertos en depto_incidents',
        `${open.length} abierto(s), ${openCritical} critico(s)`,
        'firestore',
        openCritical === 0,
      ),
    ];

    if (openCritical > 0) {
      return {
        status: 'RED',
        reason: `${openCritical} incidente(s) critico(s) abierto(s). No se puede cerrar produccion con incidentes criticos.`,
        evidence: ev,
        openCritical,
        openTotal: open.length,
      };
    }

    if (open.length > 0) {
      return {
        status: 'YELLOW',
        reason: `${open.length} incidente(s) abierto(s) no criticos pendientes de resolucion.`,
        evidence: ev,
        openCritical,
        openTotal: open.length,
      };
    }

    return {
      status: 'GREEN',
      reason: 'No hay incidentes abiertos.',
      evidence: ev,
      openCritical: 0,
      openTotal: 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      status: 'UNKNOWN',
      reason: `No se pudo leer depto_incidents: ${message}`,
      evidence: [evidence('Lectura de depto_incidents', `Error: ${message}`, 'firestore', false)],
      openCritical: 0,
      openTotal: 0,
    };
  }
}

/**
 * Comprueba el snapshot diario mas reciente de NIOS.
 * No acepta snapshots fabricados: solo lee lo que exista realmente.
 */
export async function probeNiosSnapshot(
  now = Date.now(),
): Promise<{ status: SwissStatus; reason: string; evidence: SwissEvidence[]; latestDate: string | null }> {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection('nios_daily_snapshots')
      .orderBy('date', 'desc')
      .limit(1)
      .get();

    if (snap.empty) {
      return {
        status: 'UNKNOWN',
        reason: 'No existe ningun snapshot en nios_daily_snapshots. El pipeline NIOS aun no ha producido datos.',
        evidence: [
          evidence('Snapshot NIOS mas reciente', 'La coleccion esta vacia', 'firestore', false),
        ],
        latestDate: null,
      };
    }

    const doc = snap.docs[0];
    const date = (doc.get('date') as string) ?? doc.id;
    const ageMs = now - new Date(date).getTime();
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    const fresh = ageDays <= 2;

    const ev = [
      evidence(
        'Snapshot NIOS mas reciente',
        `Fecha ${date}, antiguedad ${ageDays.toFixed(1)} dia(s)`,
        'firestore',
        fresh,
      ),
    ];

    return {
      status: fresh ? 'GREEN' : 'YELLOW',
      reason: fresh
        ? `Snapshot fresco del ${date}.`
        : `El snapshot mas reciente es del ${date} (${ageDays.toFixed(1)} dias). El pipeline no esta corriendo a diario.`,
      evidence: ev,
      latestDate: date,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      status: 'UNKNOWN',
      reason: `No se pudo leer nios_daily_snapshots: ${message}`,
      evidence: [
        evidence('Lectura de nios_daily_snapshots', `Error: ${message}`, 'firestore', false),
      ],
      latestDate: null,
    };
  }
}

/** Resultado de un probe de Google (GSC o GA4). */
export interface GoogleProbe {
  status: SwissStatus;
  reason: string;
  evidence: SwissEvidence[];
  dataStatus: string;
}

function mapGoogleDataStatus(status: string): SwissStatus {
  switch (status) {
    case 'CONNECTED_WITH_DATA':
      return 'GREEN';
    case 'CONNECTED_NO_DATA':
      return 'YELLOW';
    case 'NOT_CONFIGURED':
      return 'BLOCKED_EXTERNAL';
    case 'ACCESS_DENIED':
    case 'API_ERROR':
      return 'RED';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Realiza una llamada real al collector de GSC y devuelve solo estado seguro.
 * Nunca expone credenciales, claves ni tokens.
 */
export async function probeGoogleGsc(timeoutMs = 15000): Promise<GoogleProbe> {
  try {
    const gsc = await Promise.race([
      collectGscData({ days: 7 }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs),
      ),
    ]);

    const raw = gsc as unknown as { dataStatus: string; pages?: unknown[]; queries?: unknown[] };
    const status = mapGoogleDataStatus(raw.dataStatus);
    const pagesCount = raw.pages?.length ?? 0;
    const queriesCount = raw.queries?.length ?? 0;
    const reason =
      status === 'GREEN'
        ? `GSC autenticado y devolvio ${pagesCount} paginas y ${queriesCount} consultas.`
        : status === 'YELLOW'
          ? 'GSC autenticado; no hay datos para el rango consultado (CONNECTED_NO_DATA).'
          : `GSC dataStatus=${raw.dataStatus}`;

    return {
      status,
      reason,
      evidence: [
        evidence(
          'GSC realtime collector',
          `${raw.dataStatus} — ${pagesCount} páginas, ${queriesCount} consultas`,
          'runtime',
          status === 'GREEN',
        ),
      ],
      dataStatus: raw.dataStatus,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message === 'timeout';
    return {
      status: isTimeout ? 'UNKNOWN' : 'RED',
      reason: isTimeout
        ? 'El probe de GSC no completo en el tiempo permitido.'
        : `Error inesperado en probe GSC: ${message}`,
      evidence: [evidence('GSC realtime collector', message, 'runtime', false)],
      dataStatus: 'ERROR',
    };
  }
}

/**
 * Realiza una llamada real al collector de GA4 y devuelve solo estado seguro.
 * Nunca expone credenciales, claves ni tokens.
 */
export async function probeGoogleGa4(timeoutMs = 15000): Promise<GoogleProbe> {
  try {
    const ga4 = await Promise.race([
      collectGa4Data({ days: 7 }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs),
      ),
    ]);

    const raw = ga4 as unknown as { dataStatus: string; pages?: unknown[]; totalUsers?: number };
    const status = mapGoogleDataStatus(raw.dataStatus);
    const pagesCount = raw.pages?.length ?? 0;
    const users = raw.totalUsers ?? 0;
    const reason =
      status === 'GREEN'
        ? `GA4 autenticado y devolvio ${pagesCount} paginas y ${users} usuarios.`
        : status === 'YELLOW'
          ? 'GA4 autenticado; no hay datos para el rango consultado (CONNECTED_NO_DATA).'
          : `GA4 dataStatus=${raw.dataStatus}`;

    return {
      status,
      reason,
      evidence: [
        evidence(
          'GA4 realtime collector',
          `${raw.dataStatus} — ${pagesCount} páginas, ${users} usuarios`,
          'runtime',
          status === 'GREEN',
        ),
      ],
      dataStatus: raw.dataStatus,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message === 'timeout';
    return {
      status: isTimeout ? 'UNKNOWN' : 'RED',
      reason: isTimeout
        ? 'El probe de GA4 no completo en el tiempo permitido.'
        : `Error inesperado en probe GA4: ${message}`,
      evidence: [evidence('GA4 realtime collector', message, 'runtime', false)],
      dataStatus: 'ERROR',
    };
  }
}

/** Resultado de verificar los artefactos publicos de AdSense / SEO. */
export interface AdsenseArtifactProbe {
  adsTxtAccessible: boolean;
  adsTxtContent: string | null;
  adsTxtHasPublisherId: boolean;
  robotsAllowsCrawling: boolean;
  sitemapAccessible: boolean;
}

/**
 * Verifica ads.txt, robots.txt y sitemap.xml publicamente.
 * Usa el dominio configurado en NIOS_SITE_URL o NEXT_PUBLIC_SITE_URL.
 * Nunca confia en asunciones de build: las prueba con HTTP real.
 */
export async function probeAdsenseArtifacts(
  timeoutMs = 2500,
): Promise<AdsenseArtifactProbe> {
  const defaultResult: AdsenseArtifactProbe = {
    adsTxtAccessible: false,
    adsTxtContent: null,
    adsTxtHasPublisherId: false,
    robotsAllowsCrawling: false,
    sitemapAccessible: false,
  };

  const base =
    process.env.NIOS_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    'https://nicaraguainformate.com';

  const fetchText = async (path: string): Promise<{ ok: boolean; text: string }> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${base.replace(/\/$/, '')}${path}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'NIOS-SwissWatch/1.0' },
      });
      const text = await res.text();
      return { ok: res.ok, text };
    } catch (err) {
      logger.warn(`[swiss-watch] Error leyendo artefacto ${path}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      return { ok: false, text: '' };
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    const [ads, robots, sitemap] = await Promise.all([
      fetchText('/ads.txt'),
      fetchText('/robots.txt'),
      fetchText('/sitemap.xml'),
    ]);

    const adsTxtContent = ads.ok ? ads.text : null;
    const adsTxtHasPublisherId = adsTxtContent
      ? /google\.com\s*,\s*pub-\d+/i.test(adsTxtContent)
      : false;

    // robots.txt permite rastreo si responde OK y no bloquea la raiz para todos.
    const robotsBlocksAll = robots.ok
      ? /User-agent:\s*\*\s*Disallow:\s*\/\s*$/im.test(robots.text) ||
        /Disallow:\s*\/\s*$/im.test(robots.text)
      : true;
    const robotsAllowsCrawling = robots.ok && !robotsBlocksAll;

    const sitemapBody = sitemap.text.trim().toLowerCase();
    const sitemapLooksValid =
      sitemapBody.startsWith('<?xml') ||
      sitemapBody.startsWith('<urlset') ||
      sitemapBody.startsWith('<sitemapindex') ||
      sitemapBody.length > 100;
    const sitemapAccessible = sitemap.ok && sitemapLooksValid;

    return {
      adsTxtAccessible: ads.ok,
      adsTxtContent,
      adsTxtHasPublisherId,
      robotsAllowsCrawling,
      sitemapAccessible,
    };
  } catch (err) {
    logger.error('[swiss-watch] Error en probeAdsenseArtifacts', {
      error: err instanceof Error ? err.message : String(err),
    });
    return defaultResult;
  }
}

export interface PublicSignal {
  status: SwissStatus;
  reason: string;
  evidence: SwissEvidence[];
}

export interface PublicRuntimeSignals {
  adsenseArtifacts: AdsenseArtifactProbe;
  performance: PublicSignal;
  ux: PublicSignal;
  design: PublicSignal;
  monetization: PublicSignal;
  codebase: PublicSignal;
  development: PublicSignal;
}

/**
 * Obtiene señales reales desde el runtime publico del sitio:
 * TTFB, estructura UX, tokens de design, artefactos AdSense/SEO y
 * presencia de configuracion de codebase/development.
 * Nunca expone secretos ni inventa metricas.
 */
export async function probePublicRuntimeSignals(
  timeoutMs = 10000,
): Promise<PublicRuntimeSignals> {
  const base =
    process.env.NIOS_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    'https://nicaraguainformate.com';

  const fetchText = async (path: string): Promise<{ ok: boolean; text: string }> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${base.replace(/\/$/, '')}${path}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'NIOS-SwissWatch/1.0' },
      });
      const text = await res.text();
      return { ok: res.ok, text };
    } catch (err) {
      logger.warn(`[swiss-watch] Error leyendo pagina publica ${path}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      return { ok: false, text: '' };
    } finally {
      clearTimeout(timer);
    }
  };

  const homeStart = Date.now();
  const [home, ads, robots, sitemap] = await Promise.all([
    fetchText('/'),
    fetchText('/ads.txt'),
    fetchText('/robots.txt'),
    fetchText('/sitemap.xml'),
  ]);
  const homeMs = home.ok ? Date.now() - homeStart : null;
  const html = home.text;
  const htmlLower = html.toLowerCase();

  const adsTxtContent = ads.ok ? ads.text : null;
  const adsTxtHasPublisherId = adsTxtContent
    ? /google\.com\s*,\s*pub-\d+/i.test(adsTxtContent)
    : false;
  const robotsBlocksAll = robots.ok
    ? /User-agent:\s*\*\s*Disallow:\s*\/\s*$/im.test(robots.text) ||
      /Disallow:\s*\/\s*$/im.test(robots.text)
    : true;
  const robotsAllowsCrawling = robots.ok && !robotsBlocksAll;
  const sitemapBody = sitemap.text.trim().toLowerCase();
  const sitemapLooksValid =
    sitemapBody.startsWith('<?xml') ||
    sitemapBody.startsWith('<urlset') ||
    sitemapBody.startsWith('<sitemapindex') ||
    sitemapBody.length > 100;
  const sitemapAccessible = sitemap.ok && sitemapLooksValid;

  const adsenseArtifacts: AdsenseArtifactProbe = {
    adsTxtAccessible: ads.ok,
    adsTxtContent,
    adsTxtHasPublisherId,
    robotsAllowsCrawling,
    sitemapAccessible,
  };

  // ── PERFORMANCE (TTFB) ───────────────────────────────────────────────────
  let performance: PublicSignal;
  if (!home.ok || homeMs === null) {
    performance = {
      status: 'RED',
      reason: `La home publica no responde (${base}).`,
      evidence: [evidence('TTFB home publica', 'HTTP no OK o timeout', 'runtime', false)],
    };
  } else if (homeMs <= 800) {
    performance = {
      status: 'GREEN',
      reason: `TTFB medido desde el probe: ${homeMs}ms.`,
      evidence: [evidence('TTFB home publica', `${homeMs}ms`, 'runtime', true)],
    };
  } else if (homeMs <= 3000) {
    performance = {
      status: 'YELLOW',
      reason: `TTFB medido desde el probe: ${homeMs}ms (supera 800ms).`,
      evidence: [evidence('TTFB home publica', `${homeMs}ms`, 'runtime', false)],
    };
  } else {
    performance = {
      status: 'RED',
      reason: `TTFB muy alto: ${homeMs}ms.`,
      evidence: [evidence('TTFB home publica', `${homeMs}ms`, 'runtime', false)],
    };
  }

  // ── UX ─────────────────────────────────────────────────────────────────
  const uxChecks = {
    nav: htmlLower.includes('<nav'),
    main: htmlLower.includes('<main') || htmlLower.includes('role="main"'),
    h1: /<h1[>\s]/i.test(html),
    lang: /<html[^>]+lang=/i.test(html),
    viewport: htmlLower.includes('name="viewport"'),
    skip: htmlLower.includes('skip') || htmlLower.includes('href="#main"'),
  };
  const uxScore = Object.values(uxChecks).filter(Boolean).length;
  const uxStatus: SwissStatus =
    uxScore >= 5 ? 'GREEN' : uxScore >= 3 ? 'YELLOW' : 'RED';
  const ux: PublicSignal = {
    status: uxStatus,
    reason: `Estructura UX publica: ${uxScore}/6 checks (${Object.entries(uxChecks)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(', ') || 'ninguno'}).`,
    evidence: [
      evidence(
        'Estructura UX home publica',
        JSON.stringify(uxChecks),
        'runtime',
        uxStatus === 'GREEN',
      ),
    ],
  };

  // ── DESIGN ─────────────────────────────────────────────────────────────
  const designChecks = {
    accent: html.includes('--rd-accent'),
    serif: html.includes('--rd-serif'),
    sans: html.includes('--rd-sans'),
    radius: html.includes('--rd-radius'),
    favicon: htmlLower.includes('rel="icon"') || htmlLower.includes('rel="shortcut icon"'),
    themeColor: htmlLower.includes('name="theme-color"'),
    darkMode:
      htmlLower.includes('prefers-color-scheme') || htmlLower.includes('class="dark"'),
  };
  const designScore = Object.values(designChecks).filter(Boolean).length;
  const designStatus: SwissStatus =
    designScore >= 5 ? 'GREEN' : designScore >= 3 ? 'YELLOW' : 'RED';
  const design: PublicSignal = {
    status: designStatus,
    reason: `Tokens de design publicos: ${designScore}/7 (${Object.entries(designChecks)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(', ') || 'ninguno'}).`,
    evidence: [
      evidence(
        'Tokens de design home publica',
        JSON.stringify(designChecks),
        'runtime',
        designStatus === 'GREEN',
      ),
    ],
  };

  // ── MONETIZATION ───────────────────────────────────────────────────────
  const adsReady =
    adsenseArtifacts.adsTxtAccessible &&
    adsenseArtifacts.adsTxtHasPublisherId &&
    adsenseArtifacts.robotsAllowsCrawling &&
    adsenseArtifacts.sitemapAccessible;
  const monetization: PublicSignal = adsReady
    ? {
        status: 'YELLOW',
        reason:
          'Artefactos AdSense/SEO listos. Sin cuenta activa aprobada no hay RPM/CTR reales.',
        evidence: [
          evidence(
            'Artefactos monetizacion',
            'ads.txt, robots.txt y sitemap accesibles con publisher ID',
            'runtime',
            false,
          ),
        ],
      }
    : {
        status: 'RED',
        reason:
          'Faltan artefactos publicos requeridos para AdSense (ads.txt, robots.txt, sitemap).',
        evidence: [
          evidence(
            'Artefactos monetizacion',
            JSON.stringify({
              adsTxt: adsenseArtifacts.adsTxtAccessible,
              publisherId: adsenseArtifacts.adsTxtHasPublisherId,
              robots: adsenseArtifacts.robotsAllowsCrawling,
              sitemap: adsenseArtifacts.sitemapAccessible,
            }),
            'runtime',
            false,
          ),
        ],
      };

  // ── CODEBASE / DEVELOPMENT (config presente en runtime) ─────────────────
  let codebase: PublicSignal = {
    status: 'UNKNOWN',
    reason: 'No se pudo leer configuracion del runtime.',
    evidence: [evidence('Configuracion codebase', 'No disponible', 'runtime', false)],
  };
  let development: PublicSignal = {
    status: 'UNKNOWN',
    reason: 'No se pudo verificar scripts de desarrollo en runtime.',
    evidence: [evidence('Scripts development', 'No disponible', 'runtime', false)],
  };

  try {
    const fs = await import('node:fs/promises');
    const root = process.cwd();
    const [pkgRaw, tsconfigRaw] = await Promise.allSettled([
      fs.readFile(`${root}/package.json`, 'utf-8'),
      fs.readFile(`${root}/tsconfig.json`, 'utf-8'),
    ]);

    const pkg =
      pkgRaw.status === 'fulfilled' ? (JSON.parse(pkgRaw.value) as Record<string, unknown>) : null;

    codebase = {
      status: 'YELLOW',
      reason: pkg && tsconfigRaw.status === 'fulfilled'
        ? 'package.json y tsconfig.json presentes en el runtime. Dead code/duplicacion requiere CI.'
        : 'Archivos de configuracion no accesibles en el runtime.',
      evidence: [
        evidence(
          'Configuracion codebase',
          `package.json=${pkg ? 'OK' : 'MISS'}, tsconfig.json=${tsconfigRaw.status === 'fulfilled' ? 'OK' : 'MISS'}`,
          'runtime',
          !!(pkg && tsconfigRaw.status === 'fulfilled'),
        ),
      ],
    };

    const scripts = typeof pkg?.scripts === 'object' && pkg?.scripts !== null
      ? (pkg.scripts as Record<string, string>)
      : {};
    const hasBuild = 'build' in scripts;
    const hasTest = 'test' in scripts;
    const hasLint = 'lint' in scripts;
    const hasTypeCheck = 'type-check' in scripts;
    const devScore = [hasBuild, hasTest, hasLint, hasTypeCheck].filter(Boolean).length;
    development = {
      status: devScore >= 2 ? 'YELLOW' : 'RED',
      reason: `Scripts de CI presentes: build=${hasBuild}, test=${hasTest}, lint=${hasLint}, type-check=${hasTypeCheck}. Cobertura real se mide en repo.`,
      evidence: [
        evidence(
          'Scripts development',
          JSON.stringify({ build: hasBuild, test: hasTest, lint: hasLint, 'type-check': hasTypeCheck }),
          'runtime',
          devScore >= 2,
        ),
      ],
    };
  } catch {
    // Si fs no esta disponible (edge/browser) dejar UNKNOWN
  }

  return {
    adsenseArtifacts,
    performance,
    ux,
    design,
    monetization,
    codebase,
    development,
  };
}

/**
 * Agrega varios estados en el peor caso, respetando la jerarquia:
 * RED > BLOCKED_EXTERNAL > UNKNOWN > YELLOW > GREEN.
 *
 * UNKNOWN pesa mas que YELLOW porque no se puede declarar
 * "funciona con pulido pendiente" sobre algo que no se ha medido.
 */
export function worstStatus(statuses: SwissStatus[]): SwissStatus {
  if (statuses.length === 0) return 'UNKNOWN';
  const rank: Record<SwissStatus, number> = {
    RED: 5,
    BLOCKED_EXTERNAL: 4,
    UNKNOWN: 3,
    YELLOW: 2,
    GREEN: 1,
  };
  return statuses.reduce((worst, current) => (rank[current] > rank[worst] ? current : worst));
}
