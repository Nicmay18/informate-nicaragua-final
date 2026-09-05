import { describe, it, expect } from 'vitest';
import { detectConflicts } from '@/lib/nios/conflict-detector';

describe('NIOS conflict-detector — estados reales', () => {
  it('NO_DATA no se confunde con DATA_CONFLICT cuando GSC mide y GA4 no', () => {
    const nios = {
      gsc: { status: 'REAL', totalClicks: 120 },
      ga4: { status: 'NO_DATA', totalUsers: 0 },
    } as any;

    const conflicts = detectConflicts({ nios, loop: null });
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].status).toBe('NO_DATA');
    expect(conflicts[0].category).toBe('traffic-source');
  });

  it('etiqueta ACCESS_BLOCKED como acceso bloqueado, no como DATA_CONFLICT', () => {
    const nios = {
      gsc: { status: 'REAL', totalClicks: 80 },
      ga4: { status: 'ACCESS_BLOCKED', totalUsers: 0 },
    } as any;

    const conflicts = detectConflicts({ nios, loop: null });
    expect(conflicts.some((c) => c.status === 'ACCESS_BLOCKED')).toBe(true);
    expect(conflicts.some((c) => c.status === 'DATA_CONFLICT')).toBe(false);
  });

  it('detecta REPAIR_FAILURE y HUMAN_APPROVAL_REQUIRED desde el CEO Loop', () => {
    const loop = {
      failedRepairs: 2,
      pendingHuman: 1,
      observations: [],
      repaired: [],
      decisions: [],
      timestamp: new Date().toISOString(),
    } as any;

    const conflicts = detectConflicts({ nios: null, loop });
    expect(conflicts.some((c) => c.status === 'REPAIR_FAILURE')).toBe(true);
    expect(conflicts.some((c) => c.status === 'HUMAN_APPROVAL_REQUIRED')).toBe(true);
  });

  it('DATA_CONFLICT solo cuando la observación reporta dicho estado', () => {
    const loop = {
      failedRepairs: 0,
      pendingHuman: 0,
      observations: [
        { source: 'GSC', status: 'DATA_CONFLICT', note: 'Clics vs impresiones inconsistentes', dataAgeHours: 0 },
        { source: 'GA4', status: 'INVALID_CONFIGURATION', note: 'Falta property', dataAgeHours: 0 },
      ],
      repaired: [],
      decisions: [],
      timestamp: new Date().toISOString(),
    } as any;

    const conflicts = detectConflicts({ nios: null, loop });
    expect(conflicts.some((c) => c.status === 'DATA_CONFLICT')).toBe(true);
    expect(conflicts.some((c) => c.status === 'INVALID_CONFIGURATION')).toBe(true);
    expect(conflicts.some((c) => c.category === 'data-integrity')).toBe(true);
  });
});
