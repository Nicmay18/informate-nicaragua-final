import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
import {
  processOperationalConflicts,
  executeOperationalRepair,
  transitionIncident,
  isValidTransition,
  approveOperationalApproval,
  rejectOperationalApproval,
  detectRepeatedPatterns,
  type OperationalIncident,
} from '@/lib/nios/operational-loop';
import type { NiosConflict } from '@/lib/nios/conflict-detector';
import { runRepairEngine } from '@/lib/nios/repair-engine';
import { detectConflicts } from '@/lib/nios/conflict-detector';

vi.mock('@/lib/nios/repair-engine', () => ({
  runRepairEngine: vi.fn(),
}));

vi.mock('@/lib/nios/conflict-detector', () => ({
  detectConflicts: vi.fn(),
}));

vi.mock('@/lib/nios/meni-forense-judge', () => ({
  detectMeniForenseConflicts: vi.fn(),
}));

const mockedRunRepairEngine = vi.mocked(runRepairEngine);
const mockedDetectConflicts = vi.mocked(detectConflicts);

function createFakeDb() {
  const docs: Record<string, Record<string, unknown>> = {};
  let idCounter = 0;

  function makeDoc(id?: string) {
    const docId = id || `doc-${Date.now()}-${++idCounter}`;
    const self = {
      id: docId,
      set: vi.fn(async (payload: unknown) => {
        docs[docId] = { ...(payload as Record<string, unknown>) };
      }),
      update: vi.fn(async (payload: unknown) => {
        docs[docId] = { ...docs[docId], ...(payload as Record<string, unknown>) };
      }),
      get: vi.fn(async () => ({
        exists: docId in docs,
        id: docId,
        data: () => docs[docId],
        ref: self,
      })),
    };
    return self;
  }

  function buildQuery(filters: Array<{ field: string; op: string; value: unknown }> = []) {
    return {
      where: vi.fn((field: string, op: string, value: unknown) => buildQuery([...filters, { field, op, value }])),
      orderBy: vi.fn((_field: string, _dir: 'asc' | 'desc' = 'asc') => buildQuery(filters)),
      limit: vi.fn((_n: number) => buildQuery(filters)),
      get: vi.fn(async () => {
        const result = Object.values(docs).filter((d) =>
          filters.every((f) => {
            const v = d[f.field];
            if (f.op === '==') return v === f.value;
            if (f.op === 'not-in') return Array.isArray(f.value) && !(f.value as unknown[]).includes(v);
            if (f.op === '>=') return typeof v === 'string' && typeof f.value === 'string' && v >= f.value;
            if (f.op === '<=') return typeof v === 'string' && typeof f.value === 'string' && v <= f.value;
            return true;
          }),
        );
        const mapped = result.map((d) => ({
          id: d.id as string,
          exists: true,
          data: () => d,
          ref: { id: d.id, update: vi.fn() },
        }));
        return {
          empty: mapped.length === 0,
          size: mapped.length,
          docs: mapped,
        };
      }),
    };
  }

  const db = {
    collection: vi.fn(() => ({
      doc: makeDoc,
      ...buildQuery([]),
    })),
    __docs: docs,
  } as unknown as Firestore & { __docs: typeof docs };

  return db;
}

function snapshotConflict(): NiosConflict {
  return {
    id: 'nios-snapshot-inconsistent',
    severity: 'critical',
    category: 'data-integrity',
    status: 'DATA_CONFLICT',
    sources: ['NIOS'],
    title: 'Snapshot inconsistente',
    description: 'El snapshot no refleja el conteo real de artículos.',
    evidence: { source: 'NIOS', note: 'snapshot no refleja el conteo' },
    detectedAt: new Date().toISOString(),
  } as unknown as NiosConflict;
}

function trafficMissingConflict(): NiosConflict {
  return {
    id: 'ga4-gsc-missing',
    severity: 'warning',
    category: 'traffic-source',
    status: 'NO_DATA',
    sources: ['ga4', 'gsc'],
    title: 'GA4 no entrega datos',
    description: 'GA4 reporta NO_DATA.',
    evidence: { ga4Users: null, gscClicks: 50 },
    detectedAt: new Date().toISOString(),
  } as unknown as NiosConflict;
}

function meniForenseConflict(): NiosConflict {
  return {
    id: 'meni-forense-abc',
    severity: 'critical',
    category: 'meni-forense',
    status: 'MENI_FORENSE',
    sources: ['MENI', 'Forense'],
    title: 'Discrepancia MENI/Forense',
    description: 'MENI y evidencia forense difieren.',
    evidence: { slug: 'noticia-abc' },
    detectedAt: new Date().toISOString(),
  } as unknown as NiosConflict;
}

function verifiedRepairResult() {
  return {
    mode: 'VERIFIED',
    repaired: [
      {
        repairId: 'nios-snapshot-inconsistent',
        status: 'VERIFIED',
        verification: 'Snapshot reconstruido y verificado.',
        before: { snapshotCount: 0 },
        after: { snapshotCount: 2 },
      },
    ],
    failedRepairs: [],
    report: {
      snapshotConsistency: {
        consistent: true,
        dashboardCount: 2,
        snapshotCount: 2,
      },
    },
  };
}

function failedRepairResult() {
  return {
    mode: 'WAITING_HUMAN',
    repaired: [],
    failedRepairs: [
      {
        id: 'nios-snapshot-inconsistent',
        diagnostic: { problem: 'No se pudo escribir el snapshot' },
      },
    ],
    report: {
      snapshotConsistency: {
        consistent: false,
        dashboardCount: 2,
        snapshotCount: 0,
      },
    },
  };
}

describe('NIOS Operational Loop', () => {
  let db: Firestore & { __docs: Record<string, Record<string, unknown>> };

  beforeEach(() => {
    db = createFakeDb();
    vi.resetAllMocks();
    mockedRunRepairEngine.mockResolvedValue(verifiedRepairResult() as any);
  });

  it('permite transiciones válidas y rechaza inválidas', () => {
    expect(isValidTransition('DETECTED', 'INVESTIGATING')).toBe(true);
    expect(isValidTransition('INVESTIGATING', 'ACTION_REQUIRED')).toBe(true);
    expect(isValidTransition('ACTION_REQUIRED', 'RUNNING')).toBe(true);
    expect(isValidTransition('RUNNING', 'VERIFICATION')).toBe(true);
    expect(isValidTransition('VERIFICATION', 'RESOLVED')).toBe(true);
    expect(isValidTransition('RESOLVED', 'INVESTIGATING')).toBe(false);
  });

  it('lanza error en transición inválida', async () => {
    mockedDetectConflicts.mockReturnValue([snapshotConflict()]);
    const result = await processOperationalConflicts(
      db,
      { nios: { articlesCount: 2 } as any, loop: null, noticias: undefined },
      { enqueueJob: vi.fn().mockResolvedValue('job-1') },
    );
    const incident = result.incidents[0] as OperationalIncident;
    incident.state = 'RESOLVED';
    await expect(transitionIncident(db, incident, 'RUNNING', 'forzar', 'TEST')).rejects.toThrow(/Transición inválida/);
  });

  it('procesa conflicto auto-reparable: crea incidente, job, verificación y RESOLVED', async () => {
    mockedDetectConflicts.mockReturnValue([snapshotConflict()]);
    const enqueueJob = vi.fn().mockResolvedValue('job-1');

    const result = await processOperationalConflicts(
      db,
      { nios: { articlesCount: 2 } as any, loop: null, noticias: undefined },
      { enqueueJob },
    );

    expect(result.incidents.length).toBe(1);
    expect(result.incidents[0].state).toBe('ACTION_REQUIRED');
    expect(result.incidents[0].diagnosis?.autoRepairable).toBe(true);
    expect(result.jobs).toContain('job-1');
    expect(enqueueJob).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'operational-repair',
        payload: expect.objectContaining({ action: 'rebuild-snapshot' }),
      }),
    );

    const incident = result.incidents[0] as OperationalIncident;
    const repairResult = await executeOperationalRepair(db, {
      jobId: 'job-1',
      type: 'operational-repair',
      payload: { incidentId: incident.id, action: 'rebuild-snapshot', team: 'REPARADOR' },
    });

    expect(repairResult.verified).toBe(true);
    expect(repairResult.state).toBe('RESOLVED');
    expect(db.__docs[incident.id].state).toBe('RESOLVED');
    expect(db.__docs[incident.id].transitions.map((t: any) => t.to)).toContain('VERIFICATION');

    const memory = Object.values(db.__docs).filter((d) => d.kind === 'operational_memory');
    expect(memory.length).toBeGreaterThan(0);
    expect((memory[0] as any).resultado).toBe('RESOLVED');
  });

  it('falla verificación después del máximo de intentos y escala', async () => {
    mockedDetectConflicts.mockReturnValue([snapshotConflict()]);
    mockedRunRepairEngine.mockResolvedValue(failedRepairResult() as any);
    const enqueueJob = vi.fn().mockResolvedValue('job-1');

    const result = await processOperationalConflicts(
      db,
      { nios: { articlesCount: 2 } as any, loop: null, noticias: undefined },
      { enqueueJob },
    );

    const incident = result.incidents[0] as OperationalIncident;
    const repairResult = await executeOperationalRepair(
      db,
      {
        jobId: 'job-1',
        type: 'operational-repair',
        payload: { incidentId: incident.id, action: 'rebuild-snapshot', team: 'REPARADOR' },
      },
      { maxAttempts: 1 },
    );

    expect(repairResult.verified).toBe(false);
    expect(repairResult.state).toBe('ESCALATED');
    expect(db.__docs[incident.id].state).toBe('ESCALATED');
  });

  it('crea aprobación humana para conflictos NO_DATA y MENI_FORENSE', async () => {
    mockedDetectConflicts.mockReturnValue([trafficMissingConflict(), meniForenseConflict()]);

    const result = await processOperationalConflicts(
      db,
      { nios: null, loop: null, noticias: undefined },
      { enqueueJob: vi.fn().mockResolvedValue('job-x') },
    );

    expect(result.approvals.length).toBe(2);
    expect(result.jobs.length).toBe(0);
    expect((result.incidents as OperationalIncident[]).every((i) => i.state === 'ACTION_REQUIRED')).toBe(true);

    const ga4Incident = result.incidents.find((i: any) => i.conflictId === 'ga4-gsc-missing') as OperationalIncident;
    const meniIncident = result.incidents.find((i: any) => i.conflictId === 'meni-forense-abc') as OperationalIncident;

    expect(ga4Incident.team).toBe('GOOGLE');
    expect(meniIncident.team).toBe('FORENSE');
    expect(result.approvals[0].estado).toBe('PENDING');
  });

  it('aprueba una aprobación y pasa el incidente a RUNNING', async () => {
    mockedDetectConflicts.mockReturnValue([trafficMissingConflict()]);

    const result = await processOperationalConflicts(
      db,
      { nios: null, loop: null, noticias: undefined },
      { enqueueJob: vi.fn().mockResolvedValue('job-x') },
    );

    const approval = result.approvals[0];
    const incident = result.incidents[0] as OperationalIncident;

    const approved = await approveOperationalApproval(db, approval.id, 'maycol');
    expect(approved?.estado).toBe('APPROVED');
    expect(db.__docs[incident.id].state).toBe('RUNNING');
  });

  it('rechaza una aprobación y escala el incidente a ESCALATED', async () => {
    mockedDetectConflicts.mockReturnValue([trafficMissingConflict()]);

    const result = await processOperationalConflicts(
      db,
      { nios: null, loop: null, noticias: undefined },
      { enqueueJob: vi.fn().mockResolvedValue('job-x') },
    );

    const approval = result.approvals[0];
    const incident = result.incidents[0] as OperationalIncident;

    const rejected = await rejectOperationalApproval(db, approval.id, 'no aplica');
    expect(rejected?.estado).toBe('REJECTED');
    expect(db.__docs[incident.id].state).toBe('ESCALATED');
  });

  it('detecta patrones repetidos en memoria operativa', async () => {
    const now = new Date().toISOString();
    for (let i = 0; i < 3; i++) {
      const id = `mem-${i}`;
      db.__docs[id] = {
        id,
        kind: 'operational_memory',
        problema: 'GA4 no entrega datos',
        fecha: now,
        incidentId: `inc-${i}`,
        causa: 'GA4 no entrega datos',
        accion: 'configure-source',
        resultado: 'FAILED',
        verificacion: 'Sin verificación',
        equipo: 'GOOGLE',
      };
    }

    const patterns = await detectRepeatedPatterns(db, 7, 2);
    expect(patterns.length).toBeGreaterThan(0);
    expect((patterns[0] as any).key).toBe('GA4 no entrega datos');
    expect((patterns[0] as any).count).toBeGreaterThanOrEqual(3);
    expect((patterns[0] as any).recommendedWatch).toBe(true);
  });

  it('flujo end-to-end controlado: DETECTED → RESOLVED', async () => {
    mockedDetectConflicts.mockReturnValue([snapshotConflict()]);

    const result = await processOperationalConflicts(
      db,
      { nios: { articlesCount: 2 } as any, loop: null, noticias: undefined },
      { enqueueJob: vi.fn().mockResolvedValue('job-e2e') },
    );

    const incident = result.incidents[0] as OperationalIncident;
    expect(incident.state).toBe('ACTION_REQUIRED');

    const repairResult = await executeOperationalRepair(db, {
      jobId: 'job-e2e',
      type: 'operational-repair',
      payload: { incidentId: incident.id, action: 'rebuild-snapshot', team: 'REPARADOR' },
    });

    expect(repairResult.verified).toBe(true);
    expect(db.__docs[incident.id].state).toBe('RESOLVED');

    const memories = Object.values(db.__docs).filter((d) => d.kind === 'operational_memory');
    expect(memories.length).toBeGreaterThan(0);
    expect(memories.some((m) => m.problema === 'Snapshot inconsistente')).toBe(true);
  });
});
