import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest } from 'next/server';

// ─── Firestore mock ───
const setCalls: Array<{ id: string; data: Record<string, unknown>; merge?: unknown }> = [];
const mockDb = {
  collection: (name: string) => ({
    doc: (id?: string) => ({
      set: async (data: Record<string, unknown>, opts?: unknown) => {
        setCalls.push({ id: id || 'auto', data, merge: opts });
      },
      update: async () => {},
    }),
  }),
} as any;

const { writeDecisionLog, updateDecisionLog, newAttemptId } =
  await import('@/lib/editorial/decision-log');
const { sanitizeForFirestore } = await import('@/lib/editorial/guardar-con-meni');

function meniStub(over: Partial<any> = {}) {
  return {
    scoreFinal: 93, aprobado: true, calificacion: 'PUBLICABLE',
    recomendacionEditorial: 'PUBLICAR', meniVersion: '2.1.1-prod',
    articleHash: 'meni-abc', editorialDna: { adnNI: 70 },
    qualityGate: {
      bloqueado: false, motivosBloqueo: [],
      issues: [{ categoria: 'coherencia', severidad: 'warning', mensaje: 'x', corregible: true }],
      explanationIndex: { porcentajeTranscripcion: 5, porcentajeContexto: 40, porcentajeExplicacion: 30, porcentajeServicio: 25 },
    },
    ...over,
  } as any;
}
const supStub = (verdict: string) => ({
  decisionId: 'sup_x', verdict, resultingState: verdict === 'PUBLICAR' ? 'READY' : 'BLOCKED',
  reason: 'motivo', confidence: 0.5, issues: [], actions: [],
}) as any;

describe('P1-1: bitácora persistente de decisiones (meni_decision_log)', () => {
  beforeEach(() => setCalls.length = 0);

  it('persiste la evaluación aunque la nota vaya a ser rechazada', async () => {
    const attemptId = newAttemptId();
    await writeDecisionLog(mockDb, {
      attemptId,
      input: { titulo: 'Nota sucesos', categoria: 'Sucesos', contenido: '<p>x</p>'.repeat(50) },
      meni: meniStub({ aprobado: false, scoreFinal: 93 }),
      supervisor: supStub('BLOQUEAR'),
      factualitySignals: [{ code: 'NO_ATTRIBUTION', severity: 'IMPORTANT', evidence: 'e', desc: 'd' }],
      aiArtifactsRemoved: false,
    });
    expect(setCalls).toHaveLength(1);
    const doc = setCalls[0].data as any;
    expect(doc.result).toBe('EVALUATED');
    expect(doc.meni.aprobado).toBe(false);
    expect(doc.supervisor.verdict).toBe('BLOQUEAR');
    expect(doc.factuality[0].code).toBe('NO_ATTRIBUTION');
    // no contenido completo, solo metadatos
    expect(doc.input.contenido).toBeUndefined();
    expect(doc.input.contenidoLen).toBeGreaterThan(0);
  });

  it('updateDecisionLog marca REJECTED con etapa y motivo', async () => {
    await updateDecisionLog(mockDb, 'att_x', {
      result: 'REJECTED', blockingStage: 'SUPERVISOR', blockingReason: 'veredicto BLOQUEAR',
    });
    const d = setCalls.at(-1)!.data as any;
    expect(d.result).toBe('REJECTED');
    expect(d.blockingStage).toBe('SUPERVISOR');
    expect(setCalls.at(-1)!.merge).toBeTruthy();
  });

  it('updateDecisionLog marca SAVED con articleId', async () => {
    await updateDecisionLog(mockDb, 'att_y', { result: 'SAVED', savedArticleId: 'doc1' });
    expect((setCalls.at(-1)!.data as any).savedArticleId).toBe('doc1');
  });
});

describe('sanitizeForFirestore — regresión FieldValue', () => {
  it('preserva sentinelas FieldValue (serverTimestamp) en lugar de destruirlos', () => {
    const out = sanitizeForFirestore({ at: FieldValue.serverTimestamp(), a: 1 });
    expect((out as any).at).toBeInstanceOf(FieldValue);
  });
  it('sigue eliminando undefined anidados', () => {
    const out = sanitizeForFirestore({ a: { b: undefined, c: 1 }, d: [1, undefined] }) as any;
    expect('b' in out.a).toBe(false);
    expect(out.d).toEqual([1]);
  });
});

describe('P1-2: /api/support/track — hardening', () => {
  let POST: (req: any) => Promise<Response>;
  beforeEach(async () => {
    vi.resetModules();
    vi.doMock('@/lib/firebase-admin', () => ({ getAdminDb: () => mockDb }));
    setCalls.length = 0;
    POST = (await import('@/app/api/support/track/route')).POST;
  });
  const req = (body: unknown, ip = `10.0.0.${Math.floor(Math.random() * 250)}`) => {
    const headers: Record<string, string> = { 'content-type': 'application/json', 'x-forwarded-for': ip };
    const json = typeof body === 'string' ? body : JSON.stringify(body);
    headers['content-length'] = String(json.length);
    return new NextRequest('https://x/api/support/track', { method: 'POST', headers, body: json });
  };

  it('request legítimo → 200 y escribe evento', async () => {
    const res = await POST(req({ event: 'impression', slug: 'nota-x' }));
    expect(res.status).toBe(200);
    expect(setCalls.at(-1)!.data.event).toBe('impression');
  });
  it('payload inválido → 400 sin escritura', async () => {
    const res = await POST(req({ event: 'hack', slug: 'x' }));
    expect(res.status).toBe(400);
    expect(setCalls.filter(c => c.data.event === 'hack')).toHaveLength(0);
  });
  it('payload gigante → 413', async () => {
    const r = req({ event: 'click' });
    r.headers.set('content-length', '99999');
    expect((await POST(r)).status).toBe(413);
  });
  it('rate limit → 429 tras 20 requests por IP', async () => {
    const ip = '9.9.9.9';
    for (let i = 0; i < 20; i++) await POST(req({ event: 'impression' }, ip));
    expect((await POST(req({ event: 'impression' }, ip))).status).toBe(429);
  });
  it('slug malicioso se sanitiza y campos extra no se persisten', async () => {
    const res = await POST(req({ event: 'click', slug: 'x<script>alert(1)</script>', admin: true }));
    expect(res.status).toBe(200);
    const d = setCalls.at(-1)!.data as any;
    expect(d.admin).toBeUndefined();
    expect(d.slug).not.toContain('<script>');
  });
});
