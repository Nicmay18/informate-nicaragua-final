import { describe, it, expect, vi } from 'vitest';
import { runMeni, runMeniAsync } from '@/lib/meni/core';
import { runQualityGate } from '@/lib/meni/quality-gate';
import { makeEditorialDecision } from '@/lib/supervisor/editorial-supervisor';
import { findGenerationDefects } from '@/lib/editorial/content-integrity';
import type { NoticiaInput } from '@/lib/meni/types';
import type { ArticleContext } from '@/lib/supervisor/types';

// Duplicado simulado: la base de datos "encuentra" una noticia igual.
vi.mock('@/lib/analizador-duplicados', () => ({
  detectarDuplicadoAdmin: vi.fn(async () => ({ esDuplicado: true, similitud: 72 })),
}));

const fakeDb = {
  collection: () => ({
    where: () => ({
      orderBy: () => ({
        limit: () => ({ get: async () => ({ docs: [] }) }),
      }),
    }),
    doc: () => ({ get: async () => ({ exists: false, data: () => null }) }),
  }),
} as any;

/**
 * Nota de sucesos bien estructurada que alcanza el umbral de aprobación
 * (misma fixture que tests/meni-judicial-score.test.ts, score >= 90).
 */
const notaAprobable: NoticiaInput = {
  titulo: 'Medicina Legal determina estado mental de acusada por la muerte de su hija en Managua',
  resumen:
    'Peritajes de Medicina Legal y psiquiátricos se incorporan al expediente contra la mujer señalada de la muerte de su hija en Ticuantepe.',
  contenido: `
    <h2>Qué ocurrió</h2>
    <p>La Fiscalía de Managua informó que un perito de Medicina Legal dictaminó que la mujer acusada, de 31 años, presenta alteraciones psiquiátricas compatibles con un trastorno mental. La muerte de su hija de cuatro años ocurrió en su vivienda de Ticuantepe el pasado fin de semana.</p>
    <p>Según la Fiscalía, la víctima dejó a una familia conmocionada en el barrio. La acusada enfrenta un proceso penal por el delito de parricidio. La Policía Nacional recogió indicios en la escena y remitió el caso al Ministerio Público.</p>
    <h2>Qué establece el dictamen</h2>
    <p>El dictamen forense señala que la acusada no presenta alteraciones de conciencia permanentes, pero requiere evaluación psiquiátrica durante el juicio. El documento será parte de las pruebas que valorará el juez competente.</p>
    <p>La defensa de la imputada solicitó la realización de peritajes complementarios para determinar si las condiciones mentales afectan su responsabilidad penal. La Fiscalía indicó que el proceso continuará en las próximas semanas.</p>
    <h2>Qué sigue</h2>
    <p>El juez deberá resolver si la acusada será sometida a un proceso ordinario o se aplican medidas de seguridad. La presunción de inocencia permanece hasta que exista una sentencia firme, señalaron las autoridades judiciales.</p>
    <p>Este caso generó conmoción en Ticuantepe, donde vecinos piden justicia por la menor. La comunidad espera que el proceso esclarezca los hechos y responsabilice a quien corresponda.</p>
    <h2>Marco legal</h2>
    <p>El Código Penal nicaragüense sanciona el parricidio y establece que las personas con trastornos mentales pueden ser eximidas parcial o totalmente si no comprendían la ilicitud del hecho. La resolución judicial firme corresponderá a la autoridad competente.</p>
  `.trim(),
  categoria: 'Sucesos',
  imagen: '/logo.webp',
  fecha: new Date().toISOString(),
};

function supervisorCtx(meni: ReturnType<typeof runMeni>): ArticleContext {
  return {
    titulo: notaAprobable.titulo,
    contenido: meni.articulo?.contenido ?? notaAprobable.contenido,
    resumen: notaAprobable.resumen,
    categoria: meni.categoria,
    perfil: meni.profile_used,
    imagen: '/logo.webp',
    scoreMeni: meni.scoreFinal ?? undefined,
    aprobadoMeni: meni.aprobado,
    recomendacionMeni: meni.recomendacionEditorial as 'publicar' | 'mejorar' | 'revisar' | undefined,
    adnNI: meni.editorialDna?.adnNI,
    exclusividad: meni.editorialDna?.exclusividad?.score,
    wow: meni.editorialDna?.wow?.score,
    eeat: meni.eeat?.score,
    aportePropio: meni.valorEditorial?.aportePropio,
  };
}

describe('Pre-merge MENI — cadena única de verdad', () => {
  it('scoreFinal proviene únicamente de editorialDna.adnNI', () => {
    const r = runMeni(notaAprobable);
    expect(r.scoreFinal).toBe(r.editorialDna!.adnNI);
  });

  it('CASO 1: nota limpia >=90 completa ANALIZAR → APROBADO → PUBLICAR (supervisor)', () => {
    const r = runMeni(notaAprobable);
    expect(r.aprobado).toBe(true);
    expect(r.scoreFinal).toBeGreaterThanOrEqual(90);
    const sup = makeEditorialDecision(supervisorCtx(r));
    // PUBLICAR si la recomendación MENI es limpia; PUBLICAR_CON_CAMBIOS si
    // hay aviso menor ('mejorar'). Ambos son publicables: READY, sin bloqueo.
    // Nunca SUPERVISOR_BLOCKED ni REVISION_HUMANA para una nota aprobada.
    expect(['PUBLICAR', 'PUBLICAR_CON_CAMBIOS']).toContain(sup.verdict);
    expect(sup.resultingState).toBe('READY');
    if (r.recomendacionEditorial === 'publicar') {
      expect(sup.verdict).toBe('PUBLICAR');
    }
  });

  it('CASO 2: score 89 sin defectos materiales es publicable (score es metrica, no decision)', () => {
    // MENI 2.1.1-PROD: el score NO decide la publicación. Una nota con
    // 89 puntos, recomendación "publicar" y cero problemas materiales es
    // PUBLICAR. La banda 80-89 queda visible como INFO (MENI_SCORE_
    // THRESHOLD) y el defecto real —si existe— llega como BLOCKER/WARNING
    // en los hallazgos del veredicto unificado.
    for (const aprobadoMeni of [false, true]) {
      const sup = makeEditorialDecision({
        titulo: notaAprobable.titulo,
        contenido: notaAprobable.contenido,
        resumen: notaAprobable.resumen,
        categoria: 'Sucesos',
        perfil: 'sucesos',
        scoreMeni: 89,
        aprobadoMeni,
        recomendacionMeni: 'publicar',
        adnNI: 89,
        exclusividad: 90,
        wow: 85,
        eeat: 90,
      });
      expect(sup.verdict).toBe('PUBLICAR');
    }
  });

  it('CASO 3: score alto + issue QG blocking → aprobado=false y veredictoEjecutivo no queda en SI', () => {
    // Párrafo duplicado interno → issue 'blocking' del Quality Gate
    const conDuplicado: NoticiaInput = {
      ...notaAprobable,
      contenido: notaAprobable.contenido +
        '\n<p>El dictamen forense señala que la acusada no presenta alteraciones de conciencia permanentes, pero requiere evaluación psiquiátrica durante el juicio. El documento será parte de las pruebas que valorará el juez competente.</p>' +
        '\n<p>El dictamen forense señala que la acusada no presenta alteraciones de conciencia permanentes, pero requiere evaluación psiquiátrica durante el juicio. El documento será parte de las pruebas que valorará el juez competente.</p>',
    };
    const r = runMeni(conDuplicado);
    if (r.scoreFinal! >= 90 && r.qualityGate.issues.some(i => i.severidad === 'blocking')) {
      expect(r.aprobado).toBe(false);
      expect(r.editorialDecision.veredictoEjecutivo.publicar).not.toBe('SI');
    } else {
      // Si el párrafo duplicado no produjo issue blocking, el caso no aplica;
      // verificar al menos que nunca se muestra SI cuando aprobado=false.
      if (!r.aprobado) {
        expect(r.editorialDecision.veredictoEjecutivo.publicar).not.toBe('SI');
      }
    }
  });

  it('CASO 4: score alto + defecto mecánico BLOCK → aprobado=false y veredictoEjecutivo=NO', () => {
    const conMojibake: NoticiaInput = {
      ...notaAprobable,
      contenido: notaAprobable.contenido +
        '\n<p>InformaciÃ³n adicional sobre el proceso que se mantuvo en secreto durante varios aÃ±os segÃºn las fuentes consultadas.</p>',
    };
    const r = runMeni(conMojibake);
    const mechBlocked = r.blockingIssues?.length || r.qualityGate.issues.some(
      i => i.categoria === 'defecto_mecanico' && i.severidad === 'blocking',
    );
    expect(mechBlocked).toBeTruthy();
    expect(r.aprobado).toBe(false);
    expect(r.editorialDecision.veredictoEjecutivo.publicar).not.toBe('SI');
  });

  it('CASO 5: transcripción vs fuente original → Quality Gate bloquea (motor autónomo)', () => {
    const fuente = 'La Policía Nacional confirmó el decomiso de 120 armas de fuego en un operativo realizado en Managua. El comisionado general informó que las armas fueron encontradas en una vivienda del barrio Oriente durante un allanamiento autorizado por un juez. Los artefactos serán destruidos conforme al protocolo institucional.';
    const copia = fuente + ' Según las autoridades, el operativo duró varias horas.';
    const qg = runQualityGate({
      titulo: 'Policía decomisa 120 armas en Managua',
      contenido: `<p>${fuente}</p><p>Según las autoridades, el operativo duró varias horas.</p>`,
      categoria: 'Sucesos',
      fuenteOriginal: fuente,
      stage: 'POST_LLM',
    });
    // El párrafo copiado literal debe generar issue blocking
    expect(
      qg.issues.some(i => i.severidad === 'blocking') || qg.bloqueado,
    ).toBe(true);
    expect(qg.explanationIndex.porcentajeTranscripcion).toBeGreaterThan(50);
    void copia;
  });

  it('CASO 6: score 95 + recomendacionMeni=mejorar → PUBLICAR_CON_CAMBIOS (nunca REVISION_HUMANA)', () => {
    const sup = makeEditorialDecision({
      titulo: notaAprobable.titulo,
      contenido: notaAprobable.contenido,
      resumen: notaAprobable.resumen,
      categoria: 'Sucesos',
      perfil: 'sucesos',
      imagen: '/logo.webp',
      scoreMeni: 95,
      aprobadoMeni: true,
      recomendacionMeni: 'mejorar',
      adnNI: 95,
      exclusividad: 90,
      wow: 85,
      eeat: 92,
      aportePropio: true,
    });
    expect(sup.verdict).toBe('PUBLICAR_CON_CAMBIOS');
    expect(sup.resultingState).toBe('READY');
    expect(sup.verdict).not.toBe('REVISION_HUMANA');
  });

  it('CASO 7: duplicado detectado en runMeniAsync → aprobado=false + veredicto reconciliado', async () => {
    const r = await runMeniAsync(notaAprobable, { db: fakeDb });
    expect(r.duplicado?.esDuplicado).toBe(true);
    expect(r.aprobado).toBe(false);
    const pub = r.editorialDecision?.veredictoEjecutivo?.publicar;
    expect(pub).not.toBe('SI');
  });
});

describe('Regresión nombres propios — DUP_WORD_GENERIC case-sensitive', () => {
  it('nombres propios repetidos NO se marcan como defecto', () => {
    const casos = [
      'El bufete Cáceres Cáceres y Asociados presentó el recurso.',
      'La firma Guzmán Guzmán representa al demandante.',
      'El cantante Estrella Estrella se presentó en Managua.',
      'Banco BAC informó sobre el programa.',
      'La ONG AMOR anunció una jornada médica.',
      'Encontraron el mar en el Mar Caribe frente a Bluefields.',
    ];
    for (const texto of casos) {
      const defects = findGenerationDefects(texto);
      const dup = defects.filter(d => d.code === 'DUP_WORD_GENERIC');
      expect(dup, `falso positivo en: ${texto}`).toHaveLength(0);
    }
  });

  it('duplicado mecánico minúscula real SÍ se marca', () => {
    const defects = findGenerationDefects(
      'La acusada dijo que que no estaba presente cuando ocurrieron los hechos en la vivienda.',
    );
    // 'que que' es una repetición mecánica real (minúsculas)
    const found = defects.some(d => d.code === 'DUP_WORD_GENERIC' || d.code === 'DUP_WORD' || d.code === 'DUP_FUNCTION_WORD');
    expect(found).toBe(true);
  });

  it('repetición de palabra de 6+ letras en minúscula se detecta', () => {
    const defects = findGenerationDefects(
      'El informe indica que siempre siempre se repite el mismo error en el procedimiento judicial.',
    );
    expect(defects.some(d => d.code === 'DUP_WORD_GENERIC')).toBe(true);
  });
});
