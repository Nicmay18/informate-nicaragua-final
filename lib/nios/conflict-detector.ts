/**
 * Conflict Detector — Detecta desacuerdos reales entre subsistemas de NIOS.
 *
 * Regla de oro: NO_DATA / ACCESS_BLOCKED / INVALID_CONFIGURATION no son DATA_CONFLICT
 * mientras no existan señales incompatibles. Cada situación se etiqueta con su causa real.
 *
 * Categorías:
 * - traffic-source: GSC/GA4 no coinciden o una fuente no entrega datos.
 * - repair: reparaciones automáticas fallidas.
 * - human-approval: decisiones que requieren aprobación humana explícita.
 * - data-integrity: observaciones con estado NO_DATA, DATA_CONFLICT, ACCESS_BLOCKED, etc.
 */

import type { NiosDataStatus } from './intelligence/types';
import type { GSCSnapshot, GA4Snapshot } from './intelligence/types';
import type { CEOLoopRecord } from './ceo-memory';
import type { NiosExecutiveData } from './executive-center';
import type { NoticiaInput } from '@/lib/meni';
import { detectMeniForenseConflicts } from './meni-forense-judge';

export type ConflictStatus =
  | 'NO_DATA'
  | 'ACCESS_BLOCKED'
  | 'INVALID_CONFIGURATION'
  | 'STALE_DATA'
  | 'SOURCE_FAILURE'
  | 'DATA_CONFLICT'
  | 'REPAIR_FAILURE'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'MENI_FORENSE';

export interface NiosConflict {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category:
    | 'traffic-source'
    | 'repair'
    | 'approval'
    | 'data-integrity'
    | 'human-approval'
    | 'source-failure'
    | 'meni-forense';
  status: ConflictStatus;
  sources: string[];
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  detectedAt: string;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function statusFromDataStatus(status: string | undefined): ConflictStatus {
  switch (status) {
    case 'REAL':
      return 'STALE_DATA';
    case 'NO_DATA':
    case 'CONNECTED_NO_DATA':
    case 'ZERO':
      return 'NO_DATA';
    case 'ACCESS_BLOCKED':
      return 'ACCESS_BLOCKED';
    case 'INVALID_CONFIGURATION':
    case 'CONFIG_REQUIRED':
    case 'NOT_CONFIGURED':
    case 'NOT_VERIFIED':
      return 'INVALID_CONFIGURATION';
    case 'DATA_CONFLICT':
      return 'DATA_CONFLICT';
    case 'TIMEOUT':
    case 'NETWORK_ERROR':
      return 'SOURCE_FAILURE';
    default:
      return 'NO_DATA';
  }
}

function isMissingStatus(status: string): boolean {
  return ['NO_DATA', 'CONNECTED_NO_DATA', 'ZERO', 'NOT_CONFIGURED', 'NOT_VERIFIED'].includes(status);
}

function isBlockedStatus(status: string): boolean {
  return ['ACCESS_BLOCKED', 'INVALID_CONFIGURATION', 'CONFIG_REQUIRED', 'TIMEOUT', 'NETWORK_ERROR'].includes(status);
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

  // GSC con datos, GA4 ausente/bloqueada: esto es un problema de la fuente GA4, no un conflicto.
  if (gscStat === 'REAL' && (isMissingStatus(ga4Stat) || isBlockedStatus(ga4Stat))) {
    const status = isBlockedStatus(ga4Stat) ? 'ACCESS_BLOCKED' : 'NO_DATA';
    const isConfig = ['INVALID_CONFIGURATION', 'CONFIG_REQUIRED', 'NOT_CONFIGURED', 'NOT_VERIFIED'].includes(ga4Stat);
    conflicts.push({
      id: uid('gsc-ga4-missing'),
      severity: isConfig || ga4Stat === 'ACCESS_BLOCKED' ? 'critical' : 'warning',
      category: 'traffic-source',
      status: isConfig ? 'INVALID_CONFIGURATION' : status,
      sources: ['gsc', 'ga4'],
      title: `GA4 no entrega datos (${ga4Stat})`,
      description: `GSC mide ${gsc?.totalClicks ?? 0} clics reales, pero GA4 reporta "${ga4Stat}". NIOS no puede reconciliar tráfico hasta que GA4 esté configurado o desbloqueado.`,
      evidence: {
        gscClicks: gsc?.totalClicks ?? null,
        ga4Users: ga4?.totalUsers ?? null,
        gscStatus: gscStat,
        ga4Status: ga4Stat,
        ga4Property: process.env.NIOS_GA4_PROPERTY_ID || null,
      },
      detectedAt: new Date().toISOString(),
    });
  }

  // GA4 con datos, GSC ausente/bloqueada: tráfico directo/referidos, no conflicto.
  if (ga4Stat === 'REAL' && (isMissingStatus(gscStat) || isBlockedStatus(gscStat))) {
    const status = isBlockedStatus(gscStat) ? 'ACCESS_BLOCKED' : 'NO_DATA';
    const isConfig = ['INVALID_CONFIGURATION', 'CONFIG_REQUIRED', 'NOT_CONFIGURED', 'NOT_VERIFIED'].includes(gscStat);
    conflicts.push({
      id: uid('ga4-gsc-missing'),
      severity: isConfig || gscStat === 'ACCESS_BLOCKED' ? 'warning' : 'info',
      category: 'traffic-source',
      status: isConfig ? 'INVALID_CONFIGURATION' : status,
      sources: ['ga4', 'gsc'],
      title: `GSC no entrega datos (${gscStat})`,
      description: `GA4 mide ${ga4?.totalUsers ?? 0} usuarios, pero GSC reporta "${gscStat}". El tráfico puede provenir de canales directos, redes o referidos, o requiere configurar credenciales GSC.`,
      evidence: {
        ga4Users: ga4?.totalUsers ?? null,
        gscClicks: gsc?.totalClicks ?? null,
        gscStatus: gscStat,
        ga4Status: ga4Stat,
        gscSiteUrl: gsc?.siteUrl || process.env.NIOS_GSC_SITE_URL || null,
      },
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
      status: 'REPAIR_FAILURE',
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
      category: 'human-approval',
      status: 'HUMAN_APPROVAL_REQUIRED',
      sources: ['nios-ceo-loop', 'nios-action-engine'],
      title: 'Decisiones pendientes de aprobación humana',
      description: `Hay ${loop.pendingHuman} decisión(es) del CEO que requieren validación humana antes de ejecutarse. NIOS no actuará autónomamente sobre ellas.`,
      evidence: { pendingHuman: loop.pendingHuman, decisions: loop.decisions },
      detectedAt: loop.timestamp || new Date().toISOString(),
    });
  }

  for (const obs of loop.observations) {
    const status = statusFromDataStatus(obs.status as NiosDataStatus);
    const isDataConflict = obs.status === 'DATA_CONFLICT';
    const isStale =
      obs.status === 'REAL' &&
      obs.dataAgeHours !== null &&
      obs.dataAgeHours > 24;

    if (isDataConflict || isStale || status !== 'STALE_DATA') {
      const finalStatus = isDataConflict ? 'DATA_CONFLICT' : isStale ? 'STALE_DATA' : status;
      const finalSeverity = isDataConflict ? 'critical' : isStale ? 'warning' : finalStatus === 'INVALID_CONFIGURATION' ? 'warning' : 'info';
      const finalCategory = finalStatus === 'DATA_CONFLICT' ? 'data-integrity' : finalStatus === 'STALE_DATA' ? 'data-integrity' : 'source-failure';

      conflicts.push({
        id: uid(`obs-${obs.source}-${obs.status}`),
        severity: finalSeverity as 'critical' | 'warning' | 'info',
        category: finalCategory as NiosConflict['category'],
        status: finalStatus,
        sources: [obs.source],
        title: isStale
          ? `Fuente "${obs.source}" con datos estancados (${obs.dataAgeHours}h)`
          : `Fuente "${obs.source}" reporta estado ${obs.status}`,
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
  noticias?: NoticiaInput[];
}

export function detectConflicts({ nios, loop, noticias }: DetectConflictsInput): NiosConflict[] {
  return [
    ...detectTrafficConflicts(nios),
    ...detectLoopConflicts(loop),
    ...detectMeniForenseConflicts(noticias ?? []),
  ];
}
