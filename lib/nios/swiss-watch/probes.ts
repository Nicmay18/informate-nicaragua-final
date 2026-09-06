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
