/**
 * Normalizador V4 — REGLA 3
 * =========================
 * Convierte todos los outputs de los módulos a EvaluationResult uniforme.
 * Elimina duplicaciones: una causa = una penalización (REGLA 9).
 */

import type {
  ArticleEvidence,
  EvaluationResult,
  NormalizedResults,
  PenalizacionDeduplicada,
} from './types';
import { ScoreTracer } from './score-tracer';

type ModuleEvaluator = (evidence: ArticleEvidence) => EvaluationResult;

// ───────────────────────────────────────────────
// Evaluadores de cada módulo — leen ArticleEvidence, NO el artículo
// ───────────────────────────────────────────────

const evaluarSEO: ModuleEvaluator = (ev): EvaluationResult => {
  const signals: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  const tracer = new ScoreTracer('normalizador.ts', 'SEO');
  tracer.start(score, 'Score base del módulo SEO');

  if (ev.seo.tituloOptimizado) {
    signals.push('Título con longitud óptima (40-70 caracteres)');
  } else {
    warnings.push(`Título con longitud ${ev.seo.tituloLength} caracteres (óptimo: 40-70)`);
    score -= 10;
    tracer.sub(10, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Ajustar longitud del título entre 40 y 70 caracteres');
  }

  if (ev.seo.resumenLength >= 120 && ev.seo.resumenLength <= 160) {
    signals.push('Meta descripción con longitud óptima');
  } else if (ev.seo.resumenLength < 120) {
    warnings.push(`Meta descripción muy corta (${ev.seo.resumenLength} caracteres)`);
    score -= 8;
    tracer.sub(8, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Ampliar la meta descripción a 120-160 caracteres');
  } else {
    warnings.push(`Meta descripción demasiado larga (${ev.seo.resumenLength} caracteres)`);
    score -= 5;
    tracer.sub(5, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Recortar la meta descripción a máximo 160 caracteres');
  }

  if (ev.seo.h2Count >= 2) {
    signals.push(`${ev.seo.h2Count} subtítulos H2 detectados`);
  } else {
    warnings.push('Faltan subtítulos H2 en el contenido');
    score -= 8;
    tracer.sub(8, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Agregar al menos 2 subtítulos H2 para estructurar el contenido');
  }

  if (ev.seo.strongCount >= 3) {
    signals.push(`${ev.seo.strongCount} elementos strong detectados`);
  } else {
    warnings.push('Pocos elementos de énfasis (strong)');
    score -= 5;
    tracer.sub(5, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Usar negritas en datos clave para mejorar escaneabilidad');
  }

  if (ev.seo.keywords.length > 0) {
    signals.push(`${ev.seo.keywords.length} keywords definidas`);
  } else {
    warnings.push('No se definieron keywords');
    score -= 5;
    tracer.sub(5, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Definir palabras clave relevantes para la nota');
  }

  return {
    modulo: 'SEO',
    score: Math.max(0, Math.min(100, score)),
    trace: tracer.getTrace(),
    signals,
    warnings,
    errors: [],
    evidence: { tituloLength: ev.seo.tituloLength, resumenLength: ev.seo.resumenLength, h2Count: ev.seo.h2Count, strongCount: ev.seo.strongCount },
    recommendations,
  };
};

const evaluarEEAT: ModuleEvaluator = (ev): EvaluationResult => {
  const signals: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  const tracer = new ScoreTracer('normalizador.ts', 'EEAT');
  tracer.start(score, 'Score base del módulo EEAT');

  if (ev.eeat.autorVisible) {
    signals.push(`Autor identificado: ${ev.eeat.autor}`);
  } else {
    warnings.push('Autor no visible o genérico (Redacción)');
    score -= 10;
    tracer.sub(10, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Identificar al autor con nombre completo');
  }

  if (ev.eeat.fuentesDetectadas.length >= 2) {
    signals.push(`${ev.eeat.fuentesDetectadas.length} fuentes oficiales detectadas`);
  } else if (ev.eeat.fuentesDetectadas.length === 1) {
    signals.push('1 fuente oficial detectada');
    warnings.push('Solo una fuente oficial. Idealmente 2+ fuentes independientes');
    score -= 5;
    tracer.sub(5, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Agregar al menos una fuente oficial adicional');
  } else {
    warnings.push('No se detectaron fuentes oficiales');
    score -= 15;
    tracer.sub(15, errors[errors.length - 1] || warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Citar al menos una fuente oficial identificable');
  }

  if (ev.eeat.tieneAtribucionesFalsas) {
    errors.push('Se detectaron atribuciones falsas o anónimas');
    score -= 20;
    tracer.sub(20, errors[errors.length - 1], 'PENALTY');
    recommendations.push('Reemplazar atribuciones vagas con fuentes identificables');
  }

  if (ev.eeat.tieneCitasEstructuradas) {
    signals.push('Citas estructuradas (blockquote) detectadas');
  }

  return {
    modulo: 'EEAT',
    score: Math.max(0, Math.min(100, score)),
    trace: tracer.getTrace(),
    signals,
    warnings,
    errors,
    evidence: { autor: ev.eeat.autor, fuentes: ev.eeat.fuentesDetectadas, atribucionesFalsas: ev.eeat.tieneAtribucionesFalsas },
    recommendations,
  };
};

const evaluarForense: ModuleEvaluator = (ev): EvaluationResult => {
  const signals: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  const tracer = new ScoreTracer('normalizador.ts', 'FORENSE');
  tracer.start(score, 'Score base del módulo FORENSE');

  if (ev.forense.adjetivosEmocionales.length > 3) {
    warnings.push(`${ev.forense.adjetivosEmocionales.length} adjetivos emocionales detectados`);
    score -= 10;
    tracer.sub(10, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Reducir adjetivos emocionales y usar lenguaje neutral');
  } else {
    signals.push('Lenguaje neutral sin exceso de adjetivos');
  }

  if (ev.forense.transicionesIA.length > 2) {
    warnings.push(`${ev.forense.transicionesIA.length} transiciones típicas de IA detectadas`);
    score -= 8;
    tracer.sub(8, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Reescribir transiciones para sonar más natural');
  } else {
    signals.push('Sin transiciones típicas de IA');
  }

  if (ev.forense.tieneRedundancia) {
    warnings.push('Se detectó redundancia entre párrafos');
    score -= 5;
    tracer.sub(5, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Eliminar contenido redundante entre párrafos');
  }

  if (ev.forense.riesgosLegales.length > 0) {
    warnings.push(`${ev.forense.riesgosLegales.length} palabras de riesgo legal detectadas`);
    score -= ev.forense.riesgosLegales.length * 3;
    tracer.sub(ev.forense.riesgosLegales.length * 3, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Revisar uso de palabras sensibles desde el punto de vista legal');
  }

  if (ev.forense.nivelRiesgo === 'Crítico') {
    errors.push('Nivel de riesgo crítico');
    score -= 15;
    tracer.sub(15, errors[errors.length - 1] || warnings[warnings.length - 1], 'PENALTY');
  } else if (ev.forense.nivelRiesgo === 'Alto') {
    warnings.push('Nivel de riesgo alto');
    score -= 8;
    tracer.sub(8, warnings[warnings.length - 1], 'PENALTY');
  }

  if (ev.forense.estructuraHtml.h2 >= 2) {
    signals.push('Estructura HTML con subtítulos adecuados');
  }

  return {
    modulo: 'FORENSE',
    score: Math.max(0, Math.min(100, score)),
    trace: tracer.getTrace(),
    signals,
    warnings,
    errors,
    evidence: { nivelRiesgo: ev.forense.nivelRiesgo, adjetivos: ev.forense.adjetivosEmocionales.length, transicionesIA: ev.forense.transicionesIA.length },
    recommendations,
  };
};

const evaluarAdSense: ModuleEvaluator = (ev): EvaluationResult => {
  const signals: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  const tracer = new ScoreTracer('normalizador.ts', 'ADSENSE');
  tracer.start(score, 'Score base del módulo ADSENSE');

  if (ev.adsense.palabraCount < 300) {
    warnings.push(`Contenido con solo ${ev.adsense.palabraCount} palabras (mínimo recomendado: 300)`);
    score -= 15;
    tracer.sub(15, errors[errors.length - 1] || warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Ampliar el contenido a al menos 300 palabras');
  } else {
    signals.push(`Contenido con ${ev.adsense.palabraCount} palabras`);
  }

  if (ev.adsense.tieneClickbait) {
    errors.push('Se detectaron patrones de clickbait');
    score -= 20;
    tracer.sub(20, errors[errors.length - 1], 'PENALTY');
    recommendations.push('Eliminar títulos o frases sensacionalistas');
  } else {
    signals.push('Sin patrones de clickbait');
  }

  if (ev.adsense.tieneDatosConcretos) {
    signals.push('Contiene datos concretos (cifras, fechas, nombres)');
  } else {
    warnings.push('No se detectaron datos concretos');
    score -= 10;
    tracer.sub(10, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Incluir cifras, fechas o nombres específicos');
  }

  if (ev.adsense.palabrasSensibles.length > 3) {
    warnings.push(`${ev.adsense.palabrasSensibles.length} palabras sensibles para AdSense`);
    score -= 8;
    tracer.sub(8, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Revisar palabras que pueden afectar monetización');
  }

  return {
    modulo: 'ADSENSE',
    score: Math.max(0, Math.min(100, score)),
    trace: tracer.getTrace(),
    signals,
    warnings,
    errors,
    evidence: { palabraCount: ev.adsense.palabraCount, clickbait: ev.adsense.tieneClickbait, palabrasSensibles: ev.adsense.palabrasSensibles },
    recommendations,
  };
};

const evaluarDiscover: ModuleEvaluator = (ev): EvaluationResult => {
  const signals: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  const tracer = new ScoreTracer('normalizador.ts', 'DISCOVER');
  tracer.start(score, 'Score base del módulo DISCOVER');

  if (ev.discover.tieneImagen) {
    signals.push('Imagen destacada presente');
  } else {
    warnings.push('No se detectó imagen destacada');
    score -= 15;
    tracer.sub(15, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Agregar una imagen destacada de calidad');
  }

  if (ev.discover.tituloClickbait) {
    warnings.push('Título con patrón clickbait para Discover');
    score -= 10;
    tracer.sub(10, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Usar título descriptivo sin sensacionalismo');
  } else {
    signals.push('Título sin clickbait');
  }

  if (ev.discover.tieneFechaPublicacion) {
    signals.push('Fecha de publicación presente');
  } else {
    warnings.push('Falta fecha de publicación');
    score -= 5;
    tracer.sub(5, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Incluir fecha de publicación visible');
  }

  if (ev.discover.tieneFechaActualizacion) {
    signals.push('Fecha de actualización presente');
  }

  return {
    modulo: 'DISCOVER',
    score: Math.max(0, Math.min(100, score)),
    trace: tracer.getTrace(),
    signals,
    warnings,
    errors: [],
    evidence: { tieneImagen: ev.discover.tieneImagen, tituloClickbait: ev.discover.tituloClickbait },
    recommendations,
  };
};

const evaluarValorEditorial: ModuleEvaluator = (ev): EvaluationResult => {
  const signals: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  const tracer = new ScoreTracer('normalizador.ts', 'VALOR_EDITORIAL');
  tracer.start(score, 'Score base del módulo VALOR_EDITORIAL');

  if (ev.valorEditorial.tieneFuentePropia) {
    signals.push('Aporte propio del medio detectado');
  } else {
    warnings.push('No se detectó aporte propio del medio');
    score -= 10;
    tracer.sub(10, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Agregar contexto o verificación propia del medio');
  }

  if (ev.valorEditorial.tieneCitaEspecifica) {
    signals.push('Citas específicas detectadas');
  } else {
    warnings.push('No se detectaron citas específicas');
    score -= 8;
    tracer.sub(8, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Incluir citas directas de fuentes');
  }

  if (ev.valorEditorial.tieneAtribucionVaga) {
    errors.push('Atribuciones vagas detectadas');
    score -= 15;
    tracer.sub(15, errors[errors.length - 1] || warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Reemplazar atribuciones vagas con fuentes identificadas');
  }

  if (ev.valorEditorial.nombresPropiosCount >= 3) {
    signals.push(`${ev.valorEditorial.nombresPropiosCount} nombres propios detectados`);
  } else {
    warnings.push(`Solo ${ev.valorEditorial.nombresPropiosCount} nombres propios`);
    score -= 5;
    tracer.sub(5, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Incluir más nombres propios de personas o instituciones');
  }

  if (ev.valorEditorial.institucionesCount >= 2) {
    signals.push(`${ev.valorEditorial.institucionesCount} instituciones mencionadas`);
  } else {
    warnings.push(`Solo ${ev.valorEditorial.institucionesCount} instituciones mencionadas`);
    score -= 5;
    tracer.sub(5, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Mencionar instituciones relevantes');
  }

  const ratioSinDato = ev.valorEditorial.parrafosTotal > 0
    ? ev.valorEditorial.parrafosSinDato / ev.valorEditorial.parrafosTotal
    : 0;

  if (ratioSinDato > 0.5) {
    warnings.push(`${ev.valorEditorial.parrafosSinDato} de ${ev.valorEditorial.parrafosTotal} párrafos sin datos concretos`);
    score -= 10;
    tracer.sub(10, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Cada párrafo debe contener al menos un dato verificable');
  }

  if (ev.valorEditorial.tieneDatosInventados) {
    errors.push('Posibles datos inventados (atribuciones falsas sin fuentes)');
    score -= 20;
    tracer.sub(20, errors[errors.length - 1], 'PENALTY');
    recommendations.push('Verificar todas las atribuciones con fuentes identificables');
  }

  if (ev.valorEditorial.tieneFuentesAnonimas) {
    warnings.push('Fuentes anónimas detectadas');
    score -= 8;
    tracer.sub(8, warnings[warnings.length - 1], 'PENALTY');
    recommendations.push('Identificar fuentes o eliminar referencias anónimas');
  }

  return {
    modulo: 'VALOR_EDITORIAL',
    score: Math.max(0, Math.min(100, score)),
    trace: tracer.getTrace(),
    signals,
    warnings,
    errors,
    evidence: { nombresPropios: ev.valorEditorial.nombresPropiosCount, instituciones: ev.valorEditorial.institucionesCount, ratioSinDato },
    recommendations,
  };
};

// ───────────────────────────────────────────────
// Deduplicación de penalizaciones (REGLA 9)
// ───────────────────────────────────────────────

function deduplicarPenalizaciones(results: EvaluationResult[]): PenalizacionDeduplicada[] {
  const penalizaciones: PenalizacionDeduplicada[] = [];
  const causasVistas = new Set<string>();

  for (const result of results) {
    for (const warning of result.warnings) {
      const causa = warning.slice(0, 60);
      if (!causasVistas.has(causa)) {
        causasVistas.add(causa);
        penalizaciones.push({
          causa,
          modulosAfectados: [result.modulo],
          puntosPerdidos: 0,
          parrafo: 'N/A',
          motivo: warning,
          solucion: result.recommendations[0] || 'N/A',
        });
      } else {
        const existing = penalizaciones.find(p => p.causa === causa);
        if (existing && !existing.modulosAfectados.includes(result.modulo)) {
          existing.modulosAfectados.push(result.modulo);
        }
      }
    }
    for (const error of result.errors) {
      const causa = error.slice(0, 60);
      if (!causasVistas.has(causa)) {
        causasVistas.add(causa);
        penalizaciones.push({
          causa,
          modulosAfectados: [result.modulo],
          puntosPerdidos: 0,
          parrafo: 'N/A',
          motivo: error,
          solucion: result.recommendations[0] || 'N/A',
        });
      }
    }
  }

  return penalizaciones;
}

// ───────────────────────────────────────────────
// Normalizador principal
// ───────────────────────────────────────────────

export function normalize(evidence: ArticleEvidence): NormalizedResults {
  const seo = evaluarSEO(evidence);
  const eeat = evaluarEEAT(evidence);
  const forense = evaluarForense(evidence);
  const adsense = evaluarAdSense(evidence);
  const discover = evaluarDiscover(evidence);
  const valorEditorial = evaluarValorEditorial(evidence);

  const allResults = [seo, eeat, forense, adsense, discover, valorEditorial];
  const penalizacionesDeduplicadas = deduplicarPenalizaciones(allResults);

  return {
    seo,
    eeat,
    forense,
    adsense,
    discover,
    valorEditorial,
    penalizacionesDeduplicadas,
  };
}
