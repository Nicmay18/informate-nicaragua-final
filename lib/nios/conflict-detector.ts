/**
 * Conflict Detector — Detecta desacuerdos entre subsistemas de NIOS.
 *
 * Reglas iniciales:
 * 1. GSC vs GA4: si una fuente reporta datos reales y la otra no.
 * 2. Reparaciones fallidas: el motor de reparación no pudo corregir un problema.
 * 3. Aprobación humana pendiente: decisiones del CEO que requieren validación.
 * 4. Integridad de datos: observaciones con estado NO_DATA / DATA_CONFLICT / ACCESS_BLOCKED.
 *
 * A futuro se agregará MENI vs Forense cuando el módulo Forense esté listo.
 */

import type { GSCSnapshot, GA4Snapshot } from './intelligence/types';
import type { CEOLoopRecord } from './ceo-memory';
import type { NiosExecutiveData } from './executive-center';

export interface NiosConflict {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'traffic-source' | 'repair' | 'approval' | 'data-integrity' | 'meni-forense';
  sources: string[];
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  detectedAt: string;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function gscStatus(gsc: GSCSnapshot | null | undefined): string {
  if (!gsc) return 'NO_DATA';
  return gsc.status || 'NO_DATA';
}

function ga4Status(ga4: GA4Snapshot | null | undefined): string {
  if (!ga4) return 'NO_DATA';
  return ga4.status || 'NO_DATA';
}

function detectTrafficConflicts(nios: NiosExecutiveData | null): NiosConflict[] {
  const conflicts: NiosConflict[] = [];
  if (!nios) return conflicts;

  const gsc = nios.gsc;
  const ga4 = nios.ga4;
  const gscStat = gscStatus(gsc);
  const ga4Stat = ga4Status(ga4);

  if (gscStat === 'REAL' && (ga4Stat === 'NO_DATA' || ga4Stat === 'ACCESS_BLOCKED' || ga4Stat === 'ZERO')) {
    conflicts.push({
      id: uid('gsc-ga4-missing'),
      severity: ga4Stat === 'ACCESS_BLOCKED' ? 'critical' : 'warning',
      category: 'traffic-source',
      sources: ['gsc', 'ga4'],
      title: 'GSC reporta clics pero GA4 no mide usuarios',
      description: `GSC tiene datos reales (${gsc?.totalClicks ?? 0} clics), pero GA4 está en estado "${ga4Stat}". Esto suele indicar configuración rota, permisos perdidos o bloqueo de scripts en GA4.`,
      evidence: { gscClicks: gsc?.totalClicks ?? null, ga4Users: ga4?.totalUsers ?? null, gscStatus: gscStat, ga4Status: ga4Stat },
      detectedAt: new Date().toISOString(),
    });
  }

  if (ga4Stat === 'REAL' && (gscStat === 'NO_DATA' || gscStat === 'ACCESS_BLOCKED' || gscStat === 'ZERO')) {
    conflicts.push({
      id: uid('ga4-gsc-missing'),
      severity: 'info',
      category: 'traffic-source',
      sources: ['ga4', 'gsc'],
      title: 'GA4 reporta usuarios pero GSC no reporta clics',
      description: `GA4 mide ${ga4?.totalUsers ?? 0} usuarios, pero GSC está en estado "${gscStat}". El tráfico puede provenir de canales directos, redes sociales o referidos que no pasan por búsqueda orgánica.`,
      evidence: { ga4Users: ga4?.totalUsers ?? null, gscClicks: gsc?.totalClicks ?? null, gscStatus: gscStat, ga4Status: ga4Stat },
      detectedAt: new Date().toISOString(),
    });
  }

  return conflicts;
}

function detectLoopConflicts(loop: CEOLoopRecord | null): NiosConflict[] {
  const conflicts: NiosConflict[] = [];
  if (!loop) return conflicts;

  if (loop.failedRepairs > 0) {
    conflicts.push({
      id: uid('repair-failed'),
      severity: 'critical',
      category: 'repair',
      sources: ['nios-repair-engine'],
      title: 'Reparaciones automáticas fallidas',
      description: `El motor de reparación falló en ${loop.failedRepairs} intento(s). NIOS no pudo corregir automáticamente uno o más problemas detectados. Se requiere revisión humana o ajuste de permisos.`,
      evidence: { failedRepairs: loop.failedRepairs, repairs: loop.repaired },
      detectedAt: loop.timestamp || new Date().toISOString(),
    });
  }

  if (loop.pendingHuman > 0) {
    conflicts.push({
      id: uid('approval-pending'),
      severity: 'warning',
      category: 'approval',
      sources: ['nios-ceo-loop', 'nios-action-engine'],
      title: 'Decisiones pendientes de aprobación humana',
      description: `Hay ${loop.pendingHuman} decisión(es) del CEO que requieren validación humana antes de ejecutarse. NIOS no actuará autónomamente sobre ellas.`,
      evidence: { pendingHuman: loop.pendingHuman, decisions: loop.decisions },
      detectedAt: loop.timestamp || new Date().toISOString(),
    });
  }

  const badStatuses = new Set(['NO_DATA', 'DATA_CONFLICT', 'ACCESS_BLOCKED', 'INVALID_CONFIGURATION']);
  for (const obs of loop.observations) {
    if (badStatuses.has(obs.status)) {
      conflicts.push({
        id: uid('data-integrity'),
        severity: obs.status === 'DATA_CONFLICT' ? 'critical' : 'warning',
        category: 'data-integrity',
        sources: [obs.source],
        title: `Fuente "${obs.source}" reporta estado ${obs.status}`,
        description: obs.note || `La fuente ${obs.source} entregó datos con estado ${obs.status}. NIOS no puede confiar ciegamente en esta observación.`,
        evidence: { source: obs.source, status: obs.status, note: obs.note, dataAgeHours: obs.dataAgeHours },
        detectedAt: loop.timestamp || new Date().toISOString(),
      });
    }
  }

  return conflicts;
}

export interface DetectConflictsInput {
  nios: NiosExecutiveData | null;
  loop: CEOLoopRecord | null;
}

export function detectConflicts({ nios, loop }: DetectConflictsInput): NiosConflict[] {
  return [...detectTrafficConflicts(nios), ...detectLoopConflicts(loop)];
}
