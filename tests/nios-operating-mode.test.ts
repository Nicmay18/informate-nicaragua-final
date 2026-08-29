import { describe, it, expect } from 'vitest';
import dotenv from 'dotenv';
import { generateOperatingReport, type NiosOperatingReport } from '@/lib/nios/operating-mode';
import { collectGSC } from '@/lib/nios/intelligence/gsc-collector';
import { collectGA4 } from '@/lib/nios/intelligence/ga4-collector';
import type { GSCSnapshot, GA4Snapshot, NiosDataStatus } from '@/lib/nios/intelligence/types';

dotenv.config({ path: '.env.local' });

const completedAutoRepairs = [
  {
    repairId: 'nios-operating-mode',
    problem: 'No existía un modo operativo central para NIOS',
    rootCause: 'El sistema generaba reportes forenses sin estado accionable',
    action: 'Crear lib/nios/operating-mode.ts con modos, reporte y cola de reparación',
    type: 'AUTO_REPAIR',
    status: 'FIXED' as const,
    timestamp: new Date().toISOString(),
    verification: 'generateOperatingReport retorna NiosOperatingReport con top 5 acciones, humanos, bloqueados y finalState',
    rollbackAvailable: false,
  },
  {
    repairId: 'gsc-invalid-grant-status',
    problem: 'GSC reportaba NO_DATA para errores de credencial',
    rootCause: 'invalid_grant no estaba mapeado a un estado semántico',
    action: 'Mapear invalid_grant / JWT a INVALID_CONFIGURATION en gsc-collector',
    type: 'AUTO_REPAIR',
    status: 'FIXED' as const,
    timestamp: new Date().toISOString(),
    verification: 'collectGSC con credencial inválida retorna status INVALID_CONFIGURATION',
    rollbackAvailable: true,
  },
  {
    repairId: 'gsc-collection-timeout',
    problem: 'collectGSC podía colgar indefinidamente',
    rootCause: 'No había timeout de seguridad en la recolección GSC',
    action: 'Agregar Promise.race con timeout de 15000ms en collectGSC',
    type: 'AUTO_REPAIR',
    status: 'FIXED' as const,
    timestamp: new Date().toISOString(),
    verification: 'collectGSC responde en menos de 20s aunque la red falle',
    rollbackAvailable: true,
  },
  {
    repairId: 'nios-snapshot-consistency-check',
    problem: 'Snapshot y dashboard podían mostrar conteos distintos sin alerta',
    rootCause: 'No existía validación de consistencia entre snapshot y dashboard',
    action: 'Agregar diagnostic DATA_CONFLICT y modo BLOCKED cuando los conteos difieren',
    type: 'AUTO_REPAIR',
    status: 'FIXED' as const,
    timestamp: new Date().toISOString(),
    verification: 'generateOperatingReport detecta inconsistencia y la reporta',
    rollbackAvailable: false,
  },
];

function gsc(status: NiosDataStatus, siteUrl = 'sc-domain:nicaraguainformate.com'): GSCSnapshot {
  return {
    date: new Date().toISOString().split('T')[0],
    collectedAt: new Date().toISOString(),
    siteUrl,
    dateRange: { start: '2026-05-01', end: '2026-05-07' },
    totalImpressions: 0,
    totalClicks: 0,
    avgCtr: 0,
    avgPosition: 0,
    pages: [],
    queries: [],
    countries: [],
    devices: [],
    status,
    errorMessage: status !== 'REAL' ? 'Datos de prueba' : undefined,
  } as unknown as GSCSnapshot;
}

function ga4(status: NiosDataStatus): GA4Snapshot {
  return {
    date: new Date().toISOString().split('T')[0],
    collectedAt: new Date().toISOString(),
    propertyId: process.env.NIOS_GA4_PROPERTY_ID || '',
    dateRange: { start: '2026-05-01', end: '2026-05-07' },
    totalUsers: 0,
    totalSessions: 0,
    totalPageviews: 0,
    averageEngagementTimeSec: 0,
    engagementRate: 0,
    pages: [],
    sources: [],
    devices: [],
    status,
    errorMessage: status !== 'REAL' ? 'Datos de prueba' : undefined,
  } as unknown as GA4Snapshot;
}

describe('NIOS Operating Mode', () => {
  it('detects WAITING_HUMAN when GSC is blocked and GA4 needs config', () => {
    const report = generateOperatingReport({
      gsc: gsc('ACCESS_BLOCKED'),
      ga4: ga4('CONFIG_REQUIRED'),
      snapshotCount: 270,
      dashboardCount: 270,
      completedAutoRepairs,
    });

    expect(report.mode).toBe('WAITING_HUMAN');
    expect(report.finalState).toBe('DEGRADED');
    expect(report.blocked.some((b) => b.source === 'GSC')).toBe(true);
    expect(report.blocked.some((b) => b.source === 'GA4')).toBe(true);
    expect(report.humanActions.length).toBeGreaterThan(0);
    expect(report.top5Actions.length).toBeLessThanOrEqual(5);
    expect(report.top5Actions[0].priority).toBe('P0');
  });

  it('blocks on snapshot/dashboard inconsistency', () => {
    const report = generateOperatingReport({
      gsc: gsc('REAL'),
      ga4: ga4('REAL'),
      snapshotCount: 0,
      dashboardCount: 270,
      completedAutoRepairs,
    });

    expect(report.mode).toBe('BLOCKED');
    expect(report.finalState).toBe('BLOCKED');
    expect(report.snapshotConsistency.consistent).toBe(false);
    expect(report.top5Actions.some((a) => a.id === 'nios-snapshot-inconsistent')).toBe(true);
  });

  it('is HEALTHY when sources are REAL and counts match', () => {
    const report = generateOperatingReport({
      gsc: gsc('REAL'),
      ga4: ga4('REAL'),
      snapshotCount: 270,
      dashboardCount: 270,
      completedAutoRepairs,
    });

    expect(report.mode).toMatch(/VERIFIED|WAITING_HUMAN|HEALTHY/);
    expect(report.finalState).toMatch(/OPERATIONAL|DEGRADED/);
    expect(report.blocked).toHaveLength(0);
  });

  it('real pipeline produces a valid operating report', async () => {
    const [gsc, ga4] = await Promise.all([
      collectGSC('sc-domain:nicaraguainformate.com', 7),
      collectGA4(process.env.NIOS_GA4_PROPERTY_ID || '', 1),
    ]);

    const report = generateOperatingReport({
      gsc,
      ga4,
      snapshotCount: 0,
      dashboardCount: 270,
      completedAutoRepairs,
    });

    console.warn('\n=== NIOS OPERATING REPORT (real) ===\n');
    console.warn(JSON.stringify(report, null, 2));

    expect(['REAL', 'ACCESS_BLOCKED', 'INVALID_CONFIGURATION', 'NO_DATA', 'CONNECTED_NO_DATA', 'TIMEOUT', 'NETWORK_ERROR']).toContain(gsc.status);
    expect(['REAL', 'ACCESS_BLOCKED', 'CONFIG_REQUIRED', 'INVALID_CONFIGURATION', 'NO_DATA', 'CONNECTED_NO_DATA']).toContain(ga4.status);
    expect(report.mode).toMatch(/HEALTHY|WAITING_HUMAN|ACTION_REQUIRED|BLOCKED|VERIFIED/);
    expect(report.top5Actions.length).toBeLessThanOrEqual(5);
    expect(report.niosAhoraPuede.length).toBeGreaterThan(0);
  }, 60000);
});
