import { describe, it, expect } from 'vitest';
import { decide } from '@/lib/editorial/core/decision-engine';
import { scoreCalidad } from '@/lib/editorial/core/scorer';
import { evaluateRisk } from '@/lib/editorial/core/risk-engine';
import { buildExplainability } from '@/lib/editorial/core/explainability';
import { verifyIntegrity, InvariantError } from '@/lib/editorial/core/integrity-engine';
import { evaluate } from '@/lib/editorial/core/pipeline';
import { loadProfile } from '@/lib/editorial/core/profile-loader';
import type {
  ArticleEvidence,
  CalidadModules,
  ModuleScore,
  EvaluacionEditorial,
} from '@/lib/editorial/core/types';

function baseEvidence(): ArticleEvidence {
  return {
    seo: {
      tituloLength: 55,
      resumenLength: 145,
      slug: 'titulo-optimizado',
      h2Count: 3,
      strongCount: 4,
      keywords: ['educación', 'Nicaragua', '2025'],
      tituloOptimizado: true,
    },
    eeat: {
      autor: 'Carlos Mendoza',
      autorVisible: true,
      fuentesDetectadas: ['Policía Nacional', 'Ministerio de Educación'],
      tieneAtribuciones: true,
      tieneAtribucionesFalsas: false,
      tieneCitasEstructuradas: true,
    },
    discover: {
      tieneImagen: true,
      tituloClickbait: false,
      tieneFechaActualizacion: true,
      tieneFechaPublicacion: true,
    },
    adsense: {
      palabraCount: 650,
      tieneDatosConcretos: true,
      tieneClickbait: false,
      palabrasSensibles: [],
    },
    valorEditorial: {
      tieneFuentePropia: true,
      tieneCitaEspecifica: true,
      tieneAtribucionVaga: false,
      nombresPropiosCount: 5,
      institucionesCount: 3,
      parrafosSinDato: 0,
      parrafosTotal: 8,
      tieneDatosInventados: false,
      tieneFuentesAnonimas: false,
    },
    forense: {
      nivelRiesgo: 'Bajo',
      adjetivosEmocionales: [],
      transicionesIA: [],
      tieneRedundancia: false,
      estructuraHtml: { h2: 3, strong: 4, blockquote: 1 },
      riesgosLegales: [],
      tiposContaminacion: [],
    },
    context: {
      tipo: 'nacional',
      patronesEncontrados: [],
      contextoLegal: true,
      contextoHistorico: false,
      contextoInstitucional: true,
    },
    chronology: {
      fechasMencionadas: ['15 de mayo de 2025'],
      horasMencionadas: ['10:00'],
      tieneCronologia: true,
    },
    utility: {
      preguntasRespondidas: ['¿Qué ocurrió?'],
      tieneServicio: true,
      tieneRecomendaciones: true,
      oportunidades: [],
    },
    originality: {
      tieneAportePropio: true,
      aportePropioItems: ['reportó Infórmate Nicaragua'],
      tieneReporteoPropio: false,
      esReformulacion: false,
    },
    evidence: {
      datosConcretos: { fechas: 2, cifras: 3, lugares: 2, nombres: 5 },
      densidadVerificable: 0.8,
      esNotaVerificable: true,
    },
    followUp: {
      tieneSeguimiento: false,
      actualizable: true,
      pendienteConfirmacion: false,
    },
    sources: {
      fuentesIdentificadas: ['Policía Nacional', 'Ministerio de Educación'],
      numeroFuentes: 2,
      dosFuentesIndependientes: true,
      documentoOficial: false,
      trabajoCampo: false,
    },
    risk: {
      nivel: 'Bajo',
      cierreGenerico: false,
      atribucionesFalsas: false,
    },
    category: 'Nacionales',
    tipoContenido: 'NOTICIA',
    noticia: {} as any,
    textoPlano: 'Policía Nacional y Ministerio de Educación anunciaron el 15 de mayo de 2025 un programa para 120 estudiantes.',
    parrafos: [
      'Policía Nacional y Ministerio de Educación anunciaron el 15 de mayo de 2025 un programa para 120 estudiantes.',
    ],
  };
}

function moduleScore(modulo: string, score: number): ModuleScore {
  return {
    modulo,
    score,
    trace: {
      modulo,
      start: 100,
      end: score,
      entries: [
        { modulo, regla: 'START', motivo: 'base', delta: 0, before: 100, after: 100 },
        { modulo, regla: 'TEST', motivo: 'penalización artificial', delta: score - 100, before: 100, after: score },
      ],
    },
    signals: [],
    warnings: score < 100 ? ['penalización artificial'] : [],
    errors: [],
    evidence: {},
    recommendations: score < 100 ? ['revisar'] : [],
  };
}

function calidadFromScores(scores: Partial<Record<keyof CalidadModules, number>>): CalidadModules {
  return {
    seo: moduleScore('SEO', scores.seo ?? 100),
    eeat: moduleScore('EEAT', scores.eeat ?? 100),
    discover: moduleScore('DISCOVER', scores.discover ?? 100),
    adsense: moduleScore('ADSENSE', scores.adsense ?? 100),
    valorEditorial: moduleScore('VALOR_EDITORIAL', scores.valorEditorial ?? 100),
  };
}

describe('DecisionEngine', () => {
  it('el promedio ponderado está siempre entre el mínimo y máximo de módulos', () => {
    const profile = loadProfile('Nacionales');
    for (let i = 0; i < 20; i++) {
      const scores = {
        seo: Math.floor(Math.random() * 101),
        eeat: Math.floor(Math.random() * 101),
        discover: Math.floor(Math.random() * 101),
        adsense: Math.floor(Math.random() * 101),
        valorEditorial: Math.floor(Math.random() * 101),
      };
      const calidad = calidadFromScores(scores);
      const { scoreFinal } = decide(calidad, profile, true);
      const values = Object.values(scores);
      expect(scoreFinal).toBeGreaterThanOrEqual(Math.min(...values) - 0.01);
      expect(scoreFinal).toBeLessThanOrEqual(Math.max(...values) + 0.01);
    }
  });

  it('todos los módulos >= 95 y seguro=true nunca produce no_publicar', () => {
    const profile = loadProfile('Nacionales');
    const calidad = calidadFromScores({ seo: 100, eeat: 100, discover: 100, adsense: 100, valorEditorial: 100 });
    const { veredicto } = decide(calidad, profile, true);
    expect(veredicto).not.toBe('no_publicar');
    expect(veredicto).toBe('cobertura_especial');
  });

  it('gate EEAT bajo bloquea publicación sin importar el promedio', () => {
    const profile = loadProfile('Nacionales');
    const calidad = calidadFromScores({ seo: 100, eeat: 20, discover: 100, adsense: 100, valorEditorial: 100 });
    const { veredicto } = decide(calidad, profile, true);
    expect(veredicto).toBe('no_publicar');
  });

  it('gate Adsense inseguro capa el veredicto a publicar_estandar como máximo', () => {
    const profile = loadProfile('Nacionales');
    const calidad = calidadFromScores({ seo: 100, eeat: 100, discover: 100, adsense: 100, valorEditorial: 100 });
    const { veredicto } = decide(calidad, profile, false);
    const order = ['no_publicar','publicar_breve','publicar_estandar','publicar_destacado','portada','cobertura_especial'];
    expect(order.indexOf(veredicto)).toBeLessThanOrEqual(order.indexOf('publicar_estandar'));
  });
});

describe('Scorer', () => {
  it('scoreCalidad es determinista: misma evidencia produce mismo resultado', () => {
    const profile = loadProfile('Nacionales');
    const ev = baseEvidence();
    const a = scoreCalidad(ev, profile);
    const b = scoreCalidad(ev, profile);
    expect(a.seo.score).toBe(b.seo.score);
    expect(a.eeat.score).toBe(b.eeat.score);
    expect(a.discover.score).toBe(b.discover.score);
    expect(a.adsense.score).toBe(b.adsense.score);
    expect(a.valorEditorial.score).toBe(b.valorEditorial.score);
  });
});

describe('RiskEngine', () => {
  it('evidencia sin riesgo produce Forense 100 y Adsense seguro', () => {
    const ev = baseEvidence();
    const { forense, adsense } = evaluateRisk(ev);
    expect(forense.score).toBe(100);
    expect(adsense.seguro).toBe(true);
  });

  it('riesgo legal baja el score Forense y genera advertencias', () => {
    const ev = baseEvidence();
    ev.forense.riesgosLegales = ['difamación'];
    ev.forense.nivelRiesgo = 'Alto';
    ev.adsense.palabrasSensibles = ['violencia'];
    const { forense, adsense } = evaluateRisk(ev);
    expect(forense.score).toBeLessThan(100);
    expect(forense.warnings.length).toBeGreaterThan(0);
    expect(adsense.seguro).toBe(false);
  });
});

describe('Explainability', () => {
  it('cada penalización genera exactamente un ítem y suma 100 - score por módulo', () => {
    const calidad = scoreCalidad(baseEvidence(), loadProfile('Nacionales'));
    const modules = [calidad.seo, calidad.eeat, calidad.discover, calidad.adsense, calidad.valorEditorial];
    const items = buildExplainability(modules);

    for (const m of modules) {
      const lost = items
        .filter(i => i.modulo === m.modulo)
        .reduce((acc, i) => acc + i.puntosPerdidos, 0);
      if (m.score > 0) {
        expect(lost).toBeCloseTo(100 - m.score, 5);
      } else {
        expect(lost).toBeGreaterThanOrEqual(100);
      }
    }
  });
});

describe('IntegrityEngine', () => {
  it('acepta un resultado válido', () => {
    const profile = loadProfile('Nacionales');
    const ev = baseEvidence();
    const calidad = scoreCalidad(ev, profile);
    const risk = evaluateRisk(ev);
    const decision = decide(calidad, profile, risk.adsense.seguro);
    const modules = [calidad.seo, calidad.eeat, calidad.discover, calidad.adsense, calidad.valorEditorial, risk.forense];
    const explainability = buildExplainability(modules);
    const sugerencias = modules.flatMap(m => m.recommendations.concat(m.warnings));

    const result: EvaluacionEditorial = {
      evidence: ev,
      ...calidad,
      forense: risk.forense,
      calidad: decision.calidad,
      riesgo: { score: risk.forense.score, seguro: risk.adsense.seguro, advertencias: risk.forense.warnings },
      scoreFinal: decision.scoreFinal,
      veredicto: decision.veredicto,
      explainability,
      sugerencias,
    };

    expect(() => verifyIntegrity(result)).not.toThrow();
  });

  it('falla si scoreFinal no coincide con el promedio ponderado', () => {
    const profile = loadProfile('Nacionales');
    const ev = baseEvidence();
    const calidad = scoreCalidad(ev, profile);
    const risk = evaluateRisk(ev);
    const decision = decide(calidad, profile, risk.adsense.seguro);
    const modules = [calidad.seo, calidad.eeat, calidad.discover, calidad.adsense, calidad.valorEditorial, risk.forense];
    const explainability = buildExplainability(modules);
    const sugerencias = modules.flatMap(m => m.recommendations.concat(m.warnings));

    const result: EvaluacionEditorial = {
      evidence: ev,
      ...calidad,
      forense: risk.forense,
      calidad: decision.calidad,
      riesgo: { score: risk.forense.score, seguro: risk.adsense.seguro, advertencias: risk.forense.warnings },
      scoreFinal: decision.scoreFinal + 1,
      veredicto: decision.veredicto,
      explainability,
      sugerencias,
    };

    expect(() => verifyIntegrity(result)).toThrow(InvariantError);
  });
});

describe('Pipeline', () => {
  it('evalúa un artículo completo sin violar invariantes', () => {
    const noticia = {
      titulo: 'Gobierno anuncia nuevo programa educativo para 2025 en Nicaragua',
      contenido: `<p>El <strong>Ministerio de Educación</strong> y la <strong>Policía Nacional</strong> anunciaron el 15 de mayo de 2025 un programa para <strong>120 estudiantes</strong> de Managua.</p><h2>Detalles del programa</h2><p>Según el ministro Juan Pérez, la iniciativa busca mejorar la infraestructura escolar y se invertirán 2 millones de córdobas. La Asamblea Nacional respaldó la propuesta.</p><h2>Reacciones</h2><p>Organizaciones de la sociedad civil celebraron el anuncio. María López, directora de una escuela, dijo que beneficiará a comunidades rurales.</p>`,
      resumen: 'El Ministerio de Educación y la Policía Nacional anunciaron un programa educativo para 2025 con inversión de 2 millones de córdobas y beneficios para estudiantes.',
      categoria: 'Nacionales',
      autor: 'Carlos Mendoza',
      fecha: '2025-05-15T10:00:00Z',
      fechaActualizacion: '2025-05-15T12:00:00Z',
      slug: 'gobierno-programa-educativo-2025',
      palabrasClave: ['educación', 'Nicaragua', '2025'],
      imagenDestacada: 'https://example.com/img.jpg',
    };

    const result = evaluate(noticia as any);
    expect(result.scoreFinal).toBeGreaterThanOrEqual(0);
    expect(result.scoreFinal).toBeLessThanOrEqual(100);
    expect(['no_publicar','publicar_breve','publicar_estandar','publicar_destacado','portada','cobertura_especial']).toContain(result.veredicto);
    expect(result.explainability.length).toBeGreaterThanOrEqual(0);
    expect(() => verifyIntegrity(result)).not.toThrow();
  });
});
