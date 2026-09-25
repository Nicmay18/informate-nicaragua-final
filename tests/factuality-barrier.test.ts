import { describe, it, expect, vi } from 'vitest';
import { detectFactualitySignals } from '@/lib/editorial/factuality-signals';
import {
  findGenerationDefects,
  findBlockingDefects,
} from '@/lib/editorial/content-integrity';
import { stripAICitationMarkers } from '@/lib/sanitize';
import { makeEditorialDecision } from '@/lib/supervisor/editorial-supervisor';
import { guardarConMeni } from '@/lib/editorial/guardar-con-meni';

// ─── Mock de runMeniAsync: el pipeline MENI es externo a esta fase ───
// Simula el contrato real: articulo.contenido = qualityGate.textoCorregido.
const runMeniAsyncMock = vi.fn();
vi.mock('@/lib/meni', () => ({
  runMeniAsync: (...args: unknown[]) => runMeniAsyncMock(...args),
}));

function meniResult(contenido: string, resumen?: string) {
  return {
    aprobado: true,
    scoreFinal: 95,
    calificacion: 'PUBLICABLE',
    recomendacionEditorial: 'publicar',
    recomendaciones: [],
    blockingIssues: [],
    warnings: [],
    articulo: { titulo: 'SEO', resumen: resumen ?? 'resumen seo', contenido, slug: 'slug-seo' },
    seo: { tituloSEO: 'SEO', metaDescripcion: 'meta desc' },
    qualityGate: { score: 95, corregidos: [] },
    editorialDna: { adnNI: 90, exclusividad: { score: 90 }, wow: { score: 90 } },
    eeat: { score: 90 },
    valorEditorial: { aportePropio: true },
    editorialTier: 'REPORTAJE',
    editorialReason: 'test',
    articleHash: 'hash-x',
    meniVersion: 'test',
    evaluationTimestamp: new Date().toISOString(),
    profile_used: 'nacionales',
    profile_confidence: 0.5,
  };
}

const db = {} as import('firebase-admin/firestore').Firestore;

const CLEAN_INPUT = {
  titulo: 'Bomberos atienden incendio en mercado de Managua',
  resumen: 'Según informaron los bomberos, el incendio fue controlado.',
  contenido:
    '<p>Según informó la Benemérita del Cuerpo de Bomberos, un incendio afectó tres tramos ' +
    'del mercado oriental de Managua la mañana de este martes. Las autoridades confirmaron ' +
    'que no hubo personas lesionadas y que las pérdidas materiales están siendo cuantificadas ' +
    'por el personal técnico de la institución.</p>',
  categoria: 'Sucesos',
  autor: 'Redacción',
};

// ─── OBJ3: artefactos de IA ───

describe('artefactos de IA — clasificación', () => {
  it('detecta :contentReference[oaicite] como AUTO_REMOVE (no BLOCK)', () => {
    const d = findGenerationDefects('Texto:contentReference[oaicite:1]{index=1} limpio');
    expect(d.some(x => x.code === 'AI_CITATION_MARKER' && x.action === 'AUTO_REMOVE')).toBe(true);
    expect(findBlockingDefects('Texto:contentReference[oaicite:1]{index=1}')).toHaveLength(0);
  });

  it('detecta variantes reales: 【†】, [oaicite], cite_turn, utm_source=chatgpt', () => {
    for (const s of ['【4:0†source】', '[oaicite:2]', 'cite_turn3search', '?utm_source=chatgpt.com']) {
      const d = findGenerationDefects(s);
      expect(d.length, s).toBeGreaterThan(0);
      expect(d.every(x => x.action === 'AUTO_REMOVE'), s).toBe(true);
    }
  });

  it('stripAICitationMarkers elimina el artefacto sin tocar contenido editorial', () => {
    const out = stripAICitationMarkers('Apple presentó el modelo:contentReference[oaicite:1]{index=1} en evento.');
    expect(out).not.toContain('contentReference');
    expect(out).toContain('Apple presentó el modelo');
    expect(out).toContain('en evento.');
  });

  it('los defectos BLOCK existentes conservan su clasificación', () => {
    const d = findGenerationDefects('personas personas en la escena');
    expect(d.some(x => x.code === 'DUP_PERSONAS' && x.action === 'BLOCK')).toBe(true);
    expect(findBlockingDefects('personas personas en la escena').length).toBeGreaterThan(0);
  });
});

// ─── OBJ2: barrera factual mínima ───

describe('detectFactualitySignals', () => {
  it('texto atribuido con cifras NO genera señales', () => {
    const s = detectFactualitySignals({
      titulo: 'Controles viales dejan 94 detenidos',
      contenido:
        'Según informó la Policía Nacional en comunicado, los controles viales del fin de semana ' +
        'dejaron 94 detenidos por ebriedad y 12 licencias retenidas en todo el país.',
    });
    expect(s).toHaveLength(0);
  });

  it('cifras materiales sin atribución → UNSOURCED_MATERIAL_FIGURES (IMPORTANT)', () => {
    const s = detectFactualitySignals({
      titulo: 'Operativo deja detenidos',
      contenido:
        'Un operativo nacional dejó 94 detenidos y 3 vehículos incautados durante el fin de semana. ' +
        'Las acciones se extendieron a 15 departamentos del país con retenes móviles instalados.',
    });
    expect(s.some(x => x.code === 'UNSOURCED_MATERIAL_FIGURES')).toBe(true);
  });

  it('afirmación extraordinaria sin evidencia → EXTRAORDINARY_UNSOURCED_CLAIM (CRITICAL)', () => {
    const s = detectFactualitySignals({
      titulo: 'Apple presenta el iPhone Duo, su primer modelo plegable',
      contenido:
        'Apple presentó el iPhone Duo, su primer modelo plegable, con pantalla flexible ' +
        'y un precio de 999 dólares. El dispositivo llegará al mercado en diciembre.',
    });
    expect(s.some(x => x.code === 'EXTRAORDINARY_UNSOURCED_CLAIM' && x.severity === 'CRITICAL')).toBe(true);
  });

  it('afirmación extraordinaria CON atribución no genera señal crítica', () => {
    const s = detectFactualitySignals({
      titulo: 'Empresa X anuncia su primer modelo plegable',
      contenido:
        'La empresa X presentó su primer modelo plegable, según informó la compañía en un ' +
        'comunicado de prensa publicado en su sitio oficial. El dispositivo costará 999 dólares.',
    });
    expect(s.some(x => x.code === 'EXTRAORDINARY_UNSOURCED_CLAIM')).toBe(false);
  });

  it('contradicción interna de cifras → INTERNAL_CONTRADICTION (CRITICAL)', () => {
    const s = detectFactualitySignals({
      titulo: 'Accidente en carretera',
      contenido:
        'El accidente dejó 10 lesionados según el parte inicial. Más tarde se reportaron ' +
        '14 lesionados trasladados al hospital. Las autoridades investigan.',
    });
    // "10 lesionados" vs "14 lesionados" — misma métrica, valores distintos.
    // La atribución existe, pero la contradicción es independiente.
    expect(s.some(x => x.code === 'INTERNAL_CONTRADICTION' && x.severity === 'CRITICAL')).toBe(true);
  });

  it('entidad central con verbo de lanzamiento sin evidencia → UNEVIDENCED_ENTITY', () => {
    const s = detectFactualitySignals({
      titulo: 'Apple presenta el iPhone Duo plegable',
      contenido:
        'El iPhone Duo llegará con pantalla flexible de 7 pulgadas y 4800 mAh de batería. ' +
        'El precio estimado es de 999 dólares y saldrá a la venta en diciembre próximo.',
    });
    expect(s.some(x => x.code === 'UNEVIDENCED_ENTITY')).toBe(true);
  });

  it('research disponible = evidencia → suprime señales de falta de fuente', () => {
    const s = detectFactualitySignals({
      titulo: 'Controles dejan 94 detenidos',
      contenido: 'Los controles dejaron 94 detenidos y 3 vehículos incautados en 15 departamentos.',
      research: { sources: ['policia.gob.ni'], conflictsFound: [] },
    });
    expect(s.every(x => x.code !== 'UNSOURCED_MATERIAL_FIGURES' && x.code !== 'NO_ATTRIBUTION')).toBe(true);
  });

  it('input con artefactos IA removidos → AI_PROVENANCE_ARTIFACT (CRITICAL)', () => {
    const s = detectFactualitySignals({
      titulo: 'Nota',
      contenido: 'Texto suficientemente largo para evaluar, con datos y afirmaciones.',
      aiArtifactsRemoved: true,
    });
    expect(s.some(x => x.code === 'AI_PROVENANCE_ARTIFACT' && x.severity === 'CRITICAL')).toBe(true);
  });
});

// ─── OBJ4: la señal alimenta al Supervisor (detección ≠ decisión) ───

describe('Supervisor consume factualitySignals', () => {
  const baseCtx = {
    titulo: 'Noticia con datos suficientes en el título',
    contenido: '<p>' + 'Contenido con extensión suficiente para no ser pre-draft. '.repeat(10) + '</p>',
    scoreMeni: 95,
    aprobadoMeni: true,
    recomendacionMeni: 'publicar' as const,
    adnNI: 90,
    exclusividad: 90,
    wow: 90,
    eeat: 90,
    aportePropio: true,
  };

  it('señal CRITICAL → REVISION_HUMANA (no publica)', () => {
    const d = makeEditorialDecision({
      ...baseCtx,
      factualitySignals: [
        { code: 'EXTRAORDINARY_UNSOURCED_CLAIM', severity: 'CRITICAL', evidence: 'primer modelo plegable', desc: 'afirmación extraordinaria sin fuente' },
      ],
    });
    expect(d.verdict).toBe('REVISION_HUMANA');
    expect(['PUBLICAR', 'PUBLICAR_CON_CAMBIOS']).not.toContain(d.verdict);
    expect(d.issues.some(i => i.domain === 'FACTUALIDAD')).toBe(true);
  });

  it('señal IMPORTANT → INVESTIGAR_MAS (no publica)', () => {
    const d = makeEditorialDecision({
      ...baseCtx,
      factualitySignals: [
        { code: 'UNSOURCED_MATERIAL_FIGURES', severity: 'IMPORTANT', evidence: '94 detenidos; 3 vehículos', desc: 'cifras sin atribución' },
      ],
    });
    expect(d.verdict).toBe('INVESTIGAR_MAS');
    expect(['PUBLICAR', 'PUBLICAR_CON_CAMBIOS']).not.toContain(d.verdict);
  });

  it('sin señales + MENI aprobado → PUBLICAR (la barrera no bloquea texto sano)', () => {
    const d = makeEditorialDecision({ ...baseCtx, factualitySignals: [] });
    expect(d.verdict).toBe('PUBLICAR');
  });
});

// ─── OBJ1: versión editorial canónica única ───

describe('contenido canónico en guardarConMeni', () => {
  it('updateData.contenido = textoCorregido de MENI, no el input crudo', async () => {
    runMeniAsyncMock.mockResolvedValue(meniResult('<p>Texto CORREGIDO por quality-gate</p>'));
    const { updateData, canonical } = await guardarConMeni(CLEAN_INPUT, db);
    expect(updateData.contenido).toBe('<p>Texto CORREGIDO por quality-gate</p>');
    expect(canonical.contenido).toBe('<p>Texto CORREGIDO por quality-gate</p>');
  });

  it('sin articulo.contenido, canónico = input limpio (nunca crudo con artefactos)', async () => {
    runMeniAsyncMock.mockResolvedValue({ ...meniResult(''), articulo: undefined });
    const input = { ...CLEAN_INPUT, contenido: CLEAN_INPUT.contenido + ':contentReference[oaicite:1]{index=1}' };
    const { updateData, canonical, factualitySignals } = await guardarConMeni(input, db);
    expect(String(updateData.contenido)).not.toContain('contentReference');
    expect(canonical.contenido).not.toContain('contentReference');
    expect(updateData.aiArtifactsRemoved).toBe(true);
    expect(factualitySignals.some(s => s.code === 'AI_PROVENANCE_ARTIFACT')).toBe(true);
  });
});

// ─── OBJ7: regresión iPhone Duo (la CLASE de problema, no el string) ───

describe('regresión: caso iPhone Duo', () => {
  const DUO_INPUT = {
    titulo: 'Apple presenta el iPhone Duo, su primer modelo plegable',
    resumen: 'El iPhone Duo marca la entrada de Apple al segmento plegable.',
    contenido:
      '<p>Apple presentó el iPhone Duo, su primer modelo plegable, durante un evento ' +
      'en Cupertino:contentReference[oaicite:1]{index=1}. El dispositivo cuenta con una ' +
      'pantalla flexible de 7 pulgadas, batería de 4800 mAh y un precio de 999 dólares. ' +
      'Estará disponible en diciembre próximo en tres colores diferentes.</p>',
    categoria: 'Tecnología',
    autor: 'Redacción',
  };

  it('el detector produce señales de riesgo sobre esta clase de contenido', async () => {
    runMeniAsyncMock.mockResolvedValue(meniResult(DUO_INPUT.contenido.replace(/:contentReference\[[^\]]*\]\{[^}]*\}/g, ''), DUO_INPUT.resumen));
    const { factualitySignals } = await guardarConMeni(DUO_INPUT, db);
    const codes = factualitySignals.map(s => s.code);
    // Al menos dos clases de señal: provenance IA + afirmación extraordinaria/entidad sin evidencia.
    expect(codes).toContain('AI_PROVENANCE_ARTIFACT');
    expect(factualitySignals.some(s => s.severity === 'CRITICAL')).toBe(true);
  });

  it('la autoridad editorial NO aprueba la publicación de esta clase', async () => {
    runMeniAsyncMock.mockResolvedValue(meniResult(DUO_INPUT.contenido, DUO_INPUT.resumen));
    const { supervisor, supervisorApproved } = await guardarConMeni(DUO_INPUT, db);
    // Antes de la fase: score 95 + PUBLICABLE ORO → publicado.
    // Después: el Supervisor convierte las señales CRITICAL en REVISION_HUMANA.
    expect(supervisorApproved).toBe(false);
    expect(supervisor.verdict).toBe('REVISION_HUMANA');
  });

  it('el contenido persistido no contiene el artefacto aunque el input lo traiga', async () => {
    runMeniAsyncMock.mockResolvedValue(meniResult(DUO_INPUT.contenido, DUO_INPUT.resumen));
    const { updateData, canonical } = await guardarConMeni(DUO_INPUT, db);
    expect(String(updateData.contenido)).not.toContain('contentReference');
    expect(canonical.contenido).not.toContain('contentReference');
  });
});
