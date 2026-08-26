/**
 * NIOS Alert Engine
 * =================
 * Capa de control sobre las alertas: deduplicación por huella,
 * cooldown por tipo de alerta y agrupación en digest.
 *
 * Módulo puro: recibe alertas candidatas y el historial reciente;
 * decide cuáles se emiten. La persistencia sigue en alerts.ts.
 */

import type { NiosAlert, AlertSeverity } from './alerts';

export interface AlertCandidate extends NiosAlert {
  /** Huella estable del problema (categoría + causa raíz). */
  fingerprint: string;
}

export interface AlertCooldownPolicy {
  /** Horas de silencio tras emitir una alerta con la misma huella. */
  cooldownHours: Record<AlertSeverity, number>;
}

export const DEFAULT_COOLDOWN_POLICY: AlertCooldownPolicy = {
  cooldownHours: {
    critical: 6,
    warning: 24,
    info: 72,
  },
};

export interface AlertDigestGroup {
  category: NiosAlert['category'];
  severity: AlertSeverity;
  count: number;
  messages: string[];
}

export interface AlertEngineResult {
  /** Alertas que deben emitirse ahora (pasaron dedupe + cooldown). */
  toEmit: AlertCandidate[];
  /** Alertas suprimidas por duplicado dentro de la misma corrida. */
  suppressedDuplicates: AlertCandidate[];
  /** Alertas suprimidas por cooldown activo (ya notificadas recientemente). */
  suppressedByCooldown: AlertCandidate[];
  /** Digest agrupado por categoría+severidad de las alertas a emitir. */
  digest: AlertDigestGroup[];
  summary: string;
}

/**
 * Construye una huella estable para una alerta candidata.
 * Usa categoría + severidad + mensaje normalizado (sin números variables).
 */
export function buildFingerprint(alert: NiosAlert): string {
  const normalizedMessage = alert.message
    .toLowerCase()
    .replace(/\d+([.,]\d+)?/g, 'N')
    .replace(/\s+/g, ' ')
    .trim();
  return `${alert.category}:${alert.severity}:${normalizedMessage}`;
}

function hoursSince(iso: string, now: Date): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return (now.getTime() - t) / 36e5;
}

/**
 * Procesa alertas candidatas contra el historial reciente.
 *
 * @param candidates Alertas generadas en esta corrida.
 * @param recentAlerts Alertas ya persistidas (últimos días) para evaluar cooldown.
 * @param policy Política de cooldown por severidad.
 * @param now Fecha de referencia (inyectable para tests).
 */
export function runAlertEngine(
  candidates: NiosAlert[],
  recentAlerts: NiosAlert[],
  policy: AlertCooldownPolicy = DEFAULT_COOLDOWN_POLICY,
  now: Date = new Date(),
): AlertEngineResult {
  const withFingerprint: AlertCandidate[] = candidates.map((a) => ({
    ...a,
    fingerprint: buildFingerprint(a),
  }));

  // Índice de huellas recientes con su emisión más nueva.
  const lastEmitted = new Map<string, string>();
  for (const prev of recentAlerts) {
    const fp = buildFingerprint(prev);
    const existing = lastEmitted.get(fp);
    if (!existing || prev.createdAt > existing) {
      lastEmitted.set(fp, prev.createdAt);
    }
  }

  const seenThisRun = new Set<string>();
  const toEmit: AlertCandidate[] = [];
  const suppressedDuplicates: AlertCandidate[] = [];
  const suppressedByCooldown: AlertCandidate[] = [];

  for (const alert of withFingerprint) {
    // 1. Dedupe dentro de la misma corrida.
    if (seenThisRun.has(alert.fingerprint)) {
      suppressedDuplicates.push(alert);
      continue;
    }
    seenThisRun.add(alert.fingerprint);

    // 2. Cooldown contra el historial.
    const lastIso = lastEmitted.get(alert.fingerprint);
    if (lastIso) {
      const elapsed = hoursSince(lastIso, now);
      const cooldown = policy.cooldownHours[alert.severity];
      if (elapsed !== null && elapsed < cooldown) {
        suppressedByCooldown.push(alert);
        continue;
      }
    }

    toEmit.push(alert);
  }

  // 3. Digest: agrupar por categoría + severidad.
  const groups = new Map<string, AlertDigestGroup>();
  for (const alert of toEmit) {
    const key = `${alert.category}:${alert.severity}`;
    const group = groups.get(key);
    if (group) {
      group.count += 1;
      group.messages.push(alert.message);
    } else {
      groups.set(key, {
        category: alert.category,
        severity: alert.severity,
        count: 1,
        messages: [alert.message],
      });
    }
  }

  const digest = Array.from(groups.values()).sort((a, b) => {
    const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  const summary = `Alertas: ${candidates.length} candidatas, ${toEmit.length} emitidas, ${suppressedDuplicates.length} duplicadas suprimidas, ${suppressedByCooldown.length} en cooldown.`;

  return { toEmit, suppressedDuplicates, suppressedByCooldown, digest, summary };
}
