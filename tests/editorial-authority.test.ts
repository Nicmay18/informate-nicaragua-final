import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  classifyFields,
  isApprovalCurrent,
  applyTechnicalMutation,
  applySubstantiveMutation,
  SUBSTANTIVE_FIELDS,
  TECHNICAL_FIELDS,
} from '@/lib/editorial/mutation-policy';
import { computeInputHash } from '@/lib/meni/hash';
import { buildRelatedContentBlock, type RelatedLink } from '@/lib/article-links';
import { sanitizeArticleHtml } from '@/lib/sanitize';

// ─── Mock de guardarConMeni (autoridad canónica) ───
const guardarConMeniMock = vi.fn();
vi.mock('@/lib/editorial/guardar-con-meni', () => ({
  guardarConMeni: (...args: unknown[]) => guardarConMeniMock(...args),
}));

// ─── Firestore fake mínimo ───
function fakeDb(initial: Record<string, unknown> | null) {
  const doc = { ...(initial || {}) };
  const updates: Record<string, unknown>[] = [];
  const ref = {
    get: vi.fn(async () => ({ exists: initial !== null, data: () => doc })),
    update: vi.fn(async (u: Record<string, unknown>) => {
      updates.push(u);
      Object.assign(doc, u);
    }),
  };
  const db = {
    collection: (name: string) => {
      if (name !== 'noticias') throw new Error(`unexpected collection ${name}`);
      return { doc: () => ref };
    },
  } as unknown as import('firebase-admin/firestore').Firestore;
  return { db, doc, ref, updates };
}

const APPROVED_DOC = {
  titulo: 'Título aprobado',
  resumen: 'Resumen aprobado',
  contenido: '<p>Contenido aprobado</p>',
  categoria: 'Nacionales',
  autor: 'Redacción',
  aprobadoMeni: true,
  supervisorApproved: true,
  publicado: true,
};
APPROVED_DOC['contentHash'] = computeInputHash({
  titulo: APPROVED_DOC.titulo,
  resumen: APPROVED_DOC.resumen,
  contenido: APPROVED_DOC.contenido,
  categoria: APPROVED_DOC.categoria,
  autor: APPROVED_DOC.autor,
});

describe('classifyFields', () => {
  it('titulo → SUBSTANTIVE', () => expect(classifyFields(['titulo'])).toBe('SUBSTANTIVE'));
  it('contenido → SUBSTANTIVE', () => expect(classifyFields(['contenido'])).toBe('SUBSTANTIVE'));
  it('resumen → SUBSTANTIVE', () => expect(classifyFields(['resumen'])).toBe('SUBSTANTIVE'));
  it('categoria/autor → SUBSTANTIVE (forman parte del hash)', () => {
    expect(classifyFields(['categoria'])).toBe('SUBSTANTIVE');
    expect(classifyFields(['autor'])).toBe('SUBSTANTIVE');
  });
  it('campos técnicos → TECHNICAL', () => {
    expect(classifyFields(['distribuida', 'fechaDistribucion'])).toBe('TECHNICAL');
    expect(classifyFields(['noindex'])).toBe('TECHNICAL');
    expect(classifyFields(['confianza'])).toBe('TECHNICAL');
    expect(classifyFields(['vistas'])).toBe('TECHNICAL');
  });
  it('campo desconocido → REQUIRES_REVIEW', () => {
    expect(classifyFields(['campoNuevoRaro'])).toBe('REQUIRES_REVIEW');
  });
  it('mezcla con sustantivo → SUBSTANTIVE', () => {
    expect(classifyFields(['distribuida', 'contenido'])).toBe('SUBSTANTIVE');
  });
  it('todo campo sustantivo está clasificado', () => {
    for (const f of ['titulo', 'contenido', 'resumen', 'subtitulo', 'excerpt']) {
      expect(SUBSTANTIVE_FIELDS.has(f)).toBe(true);
    }
  });
});

describe('isApprovalCurrent', () => {
  it('true cuando aprobadoMeni + supervisorApproved + hash coincide', () => {
    expect(isApprovalCurrent(APPROVED_DOC)).toBe(true);
  });
  it('false cuando el contenido cambió (hash stale)', () => {
    expect(isApprovalCurrent({ ...APPROVED_DOC, contenido: '<p>Contenido distinto</p>' })).toBe(false);
  });
  it('false cuando el título cambió', () => {
    expect(isApprovalCurrent({ ...APPROVED_DOC, titulo: 'Otro título' })).toBe(false);
  });
  it('false sin aprobadoMeni', () => {
    expect(isApprovalCurrent({ ...APPROVED_DOC, aprobadoMeni: false })).toBe(false);
  });
  it('false sin supervisorApproved', () => {
    expect(isApprovalCurrent({ ...APPROVED_DOC, supervisorApproved: false })).toBe(false);
  });
  it('false sin contentHash', () => {
    const d = { ...APPROVED_DOC };
    delete (d as Record<string, unknown>).contentHash;
    expect(isApprovalCurrent(d)).toBe(false);
  });
});

describe('applyTechnicalMutation', () => {
  it('nota aprobada + cambio técnico → permitido', async () => {
    const { db, doc } = fakeDb(APPROVED_DOC);
    const r = await applyTechnicalMutation(
      db, 'a1', { distribuida: true, fechaDistribucion: 'x' },
      { actor: 'test', reason: 'distribución' },
    );
    expect(r.applied).toBe(true);
    expect(doc.distribuida).toBe(true);
    // aprobación intacta
    expect(doc.aprobadoMeni).toBe(true);
  });

  it('registra provenance en mutationLog', async () => {
    const { db, doc } = fakeDb(APPROVED_DOC);
    await applyTechnicalMutation(db, 'a1', { noindex: false }, { actor: 'tester', reason: 'qa' });
    const log = doc.mutationLog as Array<Record<string, unknown>>;
    expect(log).toHaveLength(1);
    expect(log[0].actor).toBe('tester');
    expect(log[0].classification).toBe('TECHNICAL');
    expect(log[0].result).toBe('APPLIED');
    expect(log[0].fields).toContain('noindex');
  });

  it('rechaza campos sustantivos por la vía técnica', async () => {
    const { db } = fakeDb(APPROVED_DOC);
    await expect(
      applyTechnicalMutation(db, 'a1', { contenido: '<p>x</p>' }, { actor: 'x', reason: 'x' }),
    ).rejects.toThrow(/no técnicos/);
  });

  it('publicado=true sin aprobación vigente → rechazado', async () => {
    const { db } = fakeDb({ ...APPROVED_DOC, aprobadoMeni: false, publicado: false });
    const r = await applyTechnicalMutation(db, 'a1', { publicado: true }, { actor: 'x', reason: 'x' });
    expect(r.applied).toBe(false);
    expect(r.rejected).toBe('PUBLISH_REQUIRES_CURRENT_APPROVAL');
  });

  it('publicado=true con aprobación vigente → permitido', async () => {
    const { db, doc } = fakeDb({ ...APPROVED_DOC, publicado: false });
    const r = await applyTechnicalMutation(db, 'a1', { publicado: true }, { actor: 'x', reason: 'x' });
    expect(r.applied).toBe(true);
    expect(doc.publicado).toBe(true);
  });

  it('publicado=true con aprobación stale (hash viejo) → rechazado', async () => {
    const { db } = fakeDb({
      ...APPROVED_DOC,
      publicado: false,
      contenido: '<p>Contenido mutado sin reevaluar</p>',
    });
    const r = await applyTechnicalMutation(db, 'a1', { publicado: true }, { actor: 'x', reason: 'x' });
    expect(r.applied).toBe(false);
    expect(r.rejected).toBe('PUBLISH_REQUIRES_CURRENT_APPROVAL');
  });
});

describe('applySubstantiveMutation', () => {
  beforeEach(() => guardarConMeniMock.mockReset());

  it('nota aprobada + cambio editorial aprobado → persiste con nueva aprobación', async () => {
    guardarConMeniMock.mockResolvedValue({
      ok: true,
      meni: { scoreFinal: 92, aprobado: true, articleHash: 'meni-newhash' },
      supervisor: { verdict: 'PUBLICAR', decisionId: 'd1' },
      supervisorApproved: true,
      updateData: { aprobadoMeni: true, supervisorApproved: true, contentHash: 'meni-newhash' },
    });
    const { db, doc } = fakeDb(APPROVED_DOC);
    const r = await applySubstantiveMutation(
      db, 'a1', { contenido: '<p>Contenido corregido</p>' },
      { actor: 'test', reason: 'corrección' },
    );
    expect(guardarConMeniMock).toHaveBeenCalledTimes(1);
    expect(r.applied).toBe(true);
    expect(doc.contenido).toBe('<p>Contenido corregido</p>');
    expect(doc.contentHash).toBe('meni-newhash');
    const log = doc.mutationLog as Array<Record<string, unknown>>;
    expect(log[0].result).toBe('APPLIED');
    expect((log[0].reeval as Record<string, unknown>).required).toBe(true);
    expect((log[0].reeval as Record<string, unknown>).supervisorVerdict).toBe('PUBLICAR');
  });

  it('Supervisor BLOCKED → mutación rechazada, doc intacto', async () => {
    guardarConMeniMock.mockResolvedValue({
      ok: true,
      meni: { scoreFinal: 92, aprobado: true },
      supervisor: { verdict: 'NO_PUBLICAR', decisionId: 'd2', reason: 'riesgo' },
      supervisorApproved: false,
      updateData: {},
    });
    const { db, doc } = fakeDb(APPROVED_DOC);
    const r = await applySubstantiveMutation(
      db, 'a1', { contenido: '<p>Mutación peligrosa</p>' },
      { actor: 'test', reason: 'x' },
    );
    expect(r.applied).toBe(false);
    expect(r.blocked).toBe(true);
    expect(r.code).toBe('SUPERVISOR_BLOCKED');
    expect(doc.contenido).toBe('<p>Contenido aprobado</p>');
    expect(doc.aprobadoMeni).toBe(true);
    const log = doc.mutationLog as Array<Record<string, unknown>>;
    expect(log[0].result).toBe('REJECTED');
  });

  it('MENI BLOCKED → mutación rechazada', async () => {
    guardarConMeniMock.mockResolvedValue({
      ok: false,
      meni: { scoreFinal: 40, aprobado: false },
      supervisor: { verdict: 'NO_PUBLICAR', reason: 'baja calidad' },
      supervisorApproved: false,
      updateData: {},
    });
    const { db, doc } = fakeDb(APPROVED_DOC);
    const r = await applySubstantiveMutation(
      db, 'a1', { titulo: 'Título bloqueado' },
      { actor: 'test', reason: 'x' },
    );
    expect(r.applied).toBe(false);
    expect(r.blocked).toBe(true);
    expect(doc.titulo).toBe('Título aprobado');
  });

  it('onBlocked=review → persiste pero marca REVIEW_REQUIRED sin aprobación', async () => {
    guardarConMeniMock.mockResolvedValue({
      ok: false,
      meni: { scoreFinal: 50, aprobado: false },
      supervisor: { verdict: 'NO_PUBLICAR', reason: 'x' },
      supervisorApproved: false,
      updateData: {},
    });
    const { db, doc } = fakeDb(APPROVED_DOC);
    const r = await applySubstantiveMutation(
      db, 'a1', { contenido: '<p>Cambio marcado</p>' },
      { actor: 'test', reason: 'x', onBlocked: 'review' },
    );
    expect(r.applied).toBe(true);
    expect(r.reviewRequired).toBe(true);
    expect(doc.aprobadoMeni).toBe(false);
    expect(doc.editorialState).toBe('REVIEW_REQUIRED');
    expect(doc.requiresReevaluation).toBe(true);
    // No queda "aparentemente aprobada"
    expect(isApprovalCurrent(doc)).toBe(false);
  });

  it('defecto de generación (motocicletacicletas) → rechazado sin llamar a MENI', async () => {
    const { db, doc } = fakeDb(APPROVED_DOC);
    const r = await applySubstantiveMutation(
      db, 'a1', { contenido: '<p>Las motocicletacicletas invadieron</p>' },
      { actor: 'test', reason: 'x' },
    );
    expect(r.applied).toBe(false);
    expect(r.code).toBe('CONTENT_INTEGRITY_VIOLATION');
    expect(guardarConMeniMock).not.toHaveBeenCalled();
    expect(doc.contenido).toBe('<p>Contenido aprobado</p>');
  });

  it('sin cambios reales → NO_CHANGES sin escribir', async () => {
    const { db } = fakeDb(APPROVED_DOC);
    const r = await applySubstantiveMutation(
      db, 'a1', { titulo: 'Título aprobado' },
      { actor: 'test', reason: 'x' },
    );
    expect(r.applied).toBe(false);
    expect(r.error).toBe('NO_CHANGES');
    expect(guardarConMeniMock).not.toHaveBeenCalled();
  });
});

describe('enrich-links block (regresión <li> roto)', () => {
  const links: RelatedLink[] = [
    { url: '/noticias/noticia-uno', anchor: 'Noticia uno', type: 'related' },
    { url: '/noticias/noticia-dos', anchor: 'Noticia "dos" <especial>', type: 'related' },
  ];

  it('genera HTML bien formado tras sanitizar', () => {
    const html = sanitizeArticleHtml(buildRelatedContentBlock(links));
    // Sin el defecto histórico <li>slug">
    expect(html).not.toMatch(/<li>[^<]*">/);
    // Estructura íntegra
    expect(html).toContain('<ul');
    expect(html).toContain('href="/noticias/noticia-uno"');
    expect(html).toContain('También te puede interesar');
    // aside preservado en whitelist
    expect(html).toContain('<aside');
    // `<especial>` nunca reaparece como markup literal tras sanitizar
    expect(html).not.toContain('<especial>');
    expect(html).toContain('&lt;especial&gt;');
  });

  it('contenido normal + bloque → válido', () => {
    const base = '<p>Párrafo uno.</p><p>Párrafo dos.</p>';
    const html = sanitizeArticleHtml(base + buildRelatedContentBlock(links));
    expect(html).toContain('<p>Párrafo uno.</p>');
    expect(html.match(/<li[\s>]/g)?.length).toBe(2);
    expect(html).not.toMatch(/<li>[^<]*">/);
  });

  it('contenido con listas propias + bloque → válido', () => {
    const base = '<p>Intro.</p><ul><li>Item propio</li></ul>';
    const html = sanitizeArticleHtml(base + buildRelatedContentBlock(links));
    expect(html).toContain('<li>Item propio</li>');
    expect(html).not.toMatch(/<li>[^<]*">/);
  });

  it('bloque vacío no inserta estructura rota', () => {
    const html = sanitizeArticleHtml(buildRelatedContentBlock([]));
    expect(html).not.toMatch(/<li>[^<]*">/);
  });
});

describe('cobertura de campos', () => {
  it('los campos del hash son todos sustantivos', () => {
    for (const f of ['titulo', 'resumen', 'contenido', 'categoria', 'autor']) {
      expect(SUBSTANTIVE_FIELDS.has(f)).toBe(true);
    }
  });
  it('mutationLog y requiresReevaluation son técnicos (escritos por la política)', () => {
    expect(TECHNICAL_FIELDS.has('mutationLog')).toBe(true);
    expect(TECHNICAL_FIELDS.has('requiresReevaluation')).toBe(true);
  });
});
