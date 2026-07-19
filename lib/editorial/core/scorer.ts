import type {
  ArticleEvidence,
  EditorialProfile,
  CalidadModules,
  ModuleScore,
} from './types';
import { ScoreTracer } from './score-tracer';

type Evaluator = (ev: ArticleEvidence, profile: EditorialProfile) => ModuleScore;

const evaluarSEO: Evaluator = (ev) => {
  const signals: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const tracer = new ScoreTracer('SEO');
  tracer.start(100, 'Score base del módulo SEO');

  if (ev.seo.tituloOptimizado) {
    signals.push('Título con longitud óptima (40-70 caracteres)');
  } else {
    warnings.push(`Título con longitud ${ev.seo.tituloLength} caracteres (óptimo: 40-70)`);
    tracer.sub(10, warnings[warnings.length - 1], 'TITULO_LONGITUD');
    recommendations.push('Ajustar longitud del título entre 40 y 70 caracteres');
  }

  if (ev.seo.resumenLength >= 120 && ev.seo.resumenLength <= 160) {
    signals.push('Meta descripción con longitud óptima');
  } else if (ev.seo.resumenLength < 120) {
    warnings.push(`Meta descripción muy corta (${ev.seo.resumenLength} caracteres)`);
    tracer.sub(8, warnings[warnings.length - 1], 'META_CORTA');
    recommendations.push('Ampliar la meta descripción a 120-160 caracteres');
  } else {
    warnings.push(`Meta descripción demasiado larga (${ev.seo.resumenLength} caracteres)`);
    tracer.sub(5, warnings[warnings.length - 1], 'META_LARGA');
    recommendations.push('Recortar la meta descripción a máximo 160 caracteres');
  }

  if (ev.seo.h2Count >= 2) {
    signals.push(`${ev.seo.h2Count} subtítulos H2 detectados`);
  } else {
    warnings.push('Faltan subtítulos H2 en el contenido');
    tracer.sub(8, warnings[warnings.length - 1], 'FALTAN_H2');
    recommendations.push('Agregar al menos 2 subtítulos H2 para estructurar el contenido');
  }

  if (ev.seo.strongCount >= 3) {
    signals.push(`${ev.seo.strongCount} elementos strong detectados`);
  } else {
    warnings.push('Pocos elementos de énfasis (strong)');
    tracer.sub(5, warnings[warnings.length - 1], 'FALTAN_STRONG');
    recommendations.push('Usar negritas en datos clave para mejorar escaneabilidad');
  }

  if (ev.seo.keywords.length > 0) {
    signals.push(`${ev.seo.keywords.length} keywords definidas`);
  } else {
    warnings.push('No se definieron keywords');
    tracer.sub(5, warnings[warnings.length - 1], 'FALTAN_KEYWORDS');
    recommendations.push('Definir palabras clave relevantes para la nota');
  }

  return {
    modulo: 'SEO',
    score: Math.max(0, Math.min(100, tracer.getScore())),
    trace: tracer.getTrace(),
    signals,
    warnings,
    errors: [],
    evidence: {
      tituloLength: ev.seo.tituloLength,
      resumenLength: ev.seo.resumenLength,
      h2Count: ev.seo.h2Count,
      strongCount: ev.seo.strongCount,
    },
    recommendations,
  };
};

const evaluarEEAT: Evaluator = (ev) => {
  const signals: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];
  const tracer = new ScoreTracer('EEAT');
  tracer.start(100, 'Score base del módulo EEAT');

  const esCorta = ev.tipoContenido === 'FLASH' || ev.tipoContenido === 'NOTICIA';

  if (ev.eeat.autorVisible) {
    signals.push(`Autor identificado: ${ev.eeat.autor}`);
  } else if (!esCorta) {
    warnings.push('Autor no visible o genérico (Redacción)');
    tracer.sub(10, warnings[warnings.length - 1], 'AUTOR_GENERICO');
    recommendations.push('Identificar al autor con nombre completo');
  } else {
    signals.push('Autor genérico aceptado para nota de actualidad');
  }

  if (ev.eeat.fuentesDetectadas.length >= 2) {
    signals.push(`${ev.eeat.fuentesDetectadas.length} fuentes oficiales detectadas`);
  } else if (ev.eeat.fuentesDetectadas.length === 1) {
    signals.push('1 fuente oficial detectada');
    if (!esCorta) {
      warnings.push('Solo una fuente oficial. Idealmente 2+ fuentes independientes');
      tracer.sub(5, warnings[warnings.length - 1], 'UNA_FUENTE');
      recommendations.push('Agregar al menos una fuente oficial adicional');
    }
  } else {
    const atribucionGenerica = ev.valorEditorial.tieneCitaEspecifica || ev.valorEditorial.nombresPropiosCount >= 1;
    if (esCorta && atribucionGenerica) {
      signals.push('Atribución o referencia identificable detectada (suficiente para nota de actualidad)');
    } else {
      warnings.push('No se detectaron fuentes oficiales');
      tracer.sub(15, warnings[warnings.length - 1], 'SIN_FUENTES');
      recommendations.push('Citar al menos una fuente oficial identificable');
    }
  }

  if (ev.eeat.tieneAtribucionesFalsas) {
    errors.push('Se detectaron atribuciones falsas o anónimas');
    tracer.sub(20, errors[errors.length - 1], 'ATRIBUCIONES_FALSAS');
    recommendations.push('Reemplazar atribuciones vagas con fuentes identificables');
  }

  if (ev.eeat.tieneCitasEstructuradas) {
    signals.push('Citas estructuradas (blockquote) detectadas');
  }

  return {
    modulo: 'EEAT',
    score: Math.max(0, Math.min(100, tracer.getScore())),
    trace: tracer.getTrace(),
    signals,
    warnings,
    errors,
    evidence: {
      autor: ev.eeat.autor,
      fuentes: ev.eeat.fuentesDetectadas,
      atribucionesFalsas: ev.eeat.tieneAtribucionesFalsas,
    },
    recommendations,
  };
};

const evaluarDiscover: Evaluator = (ev) => {
  const signals: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const tracer = new ScoreTracer('DISCOVER');
  tracer.start(100, 'Score base del módulo DISCOVER');

  if (ev.discover.tieneImagen) {
    signals.push('Imagen destacada presente');
  } else {
    warnings.push('No se detectó imagen destacada');
    tracer.sub(15, warnings[warnings.length - 1], 'SIN_IMAGEN');
    recommendations.push('Agregar una imagen destacada de calidad');
  }

  if (ev.discover.tituloClickbait) {
    warnings.push('Título con patrón clickbait para Discover');
    tracer.sub(10, warnings[warnings.length - 1], 'CLICKBAIT_DISCOVER');
    recommendations.push('Usar título descriptivo sin sensacionalismo');
  } else {
    signals.push('Título sin clickbait');
  }

  if (ev.discover.tieneFechaPublicacion) {
    signals.push('Fecha de publicación presente');
  } else {
    warnings.push('Falta fecha de publicación');
    tracer.sub(5, warnings[warnings.length - 1], 'SIN_FECHA_PUBLICACION');
    recommendations.push('Incluir fecha de publicación visible');
  }

  if (ev.discover.tieneFechaActualizacion) {
    signals.push('Fecha de actualización presente');
  }

  return {
    modulo: 'DISCOVER',
    score: Math.max(0, Math.min(100, tracer.getScore())),
    trace: tracer.getTrace(),
    signals,
    warnings,
    errors: [],
    evidence: {
      tieneImagen: ev.discover.tieneImagen,
      tituloClickbait: ev.discover.tituloClickbait,
    },
    recommendations,
  };
};

const evaluarAdSense: Evaluator = (ev) => {
  const signals: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];
  const tracer = new ScoreTracer('ADSENSE');
  tracer.start(100, 'Score base del módulo ADSENSE');

  if (ev.adsense.palabraCount < 300) {
    warnings.push(`Contenido con solo ${ev.adsense.palabraCount} palabras (mínimo recomendado: 300)`);
    tracer.sub(15, warnings[warnings.length - 1], 'CONTENIDO_CORTO');
    recommendations.push('Ampliar el contenido a al menos 300 palabras');
  } else {
    signals.push(`Contenido con ${ev.adsense.palabraCount} palabras`);
  }

  if (ev.adsense.tieneClickbait) {
    errors.push('Se detectaron patrones de clickbait');
    tracer.sub(20, errors[errors.length - 1], 'ADSENSE_CLICKBAIT');
    recommendations.push('Eliminar títulos o frases sensacionalistas');
  } else {
    signals.push('Sin patrones de clickbait');
  }

  if (ev.adsense.tieneDatosConcretos) {
    signals.push('Contiene datos concretos (cifras, fechas, nombres)');
  } else {
    warnings.push('No se detectaron datos concretos');
    tracer.sub(10, warnings[warnings.length - 1], 'SIN_DATOS_CONCRETOS');
    recommendations.push('Incluir cifras, fechas o nombres específicos');
  }

  return {
    modulo: 'ADSENSE',
    score: Math.max(0, Math.min(100, tracer.getScore())),
    trace: tracer.getTrace(),
    signals,
    warnings,
    errors,
    evidence: {
      palabraCount: ev.adsense.palabraCount,
      clickbait: ev.adsense.tieneClickbait,
      palabrasSensibles: ev.adsense.palabrasSensibles,
    },
    recommendations,
  };
};

const evaluarValorEditorial: Evaluator = (ev, profile) => {
  const signals: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];
  const tracer = new ScoreTracer('VALOR_EDITORIAL');
  tracer.start(100, 'Score base del módulo VALOR_EDITORIAL');

  const esLargo = ev.tipoContenido === 'REPORTAJE' || ev.tipoContenido === 'INVESTIGACION';

  if (ev.valorEditorial.tieneFuentePropia) {
    signals.push('Aporte propio del medio detectado');
  } else if (esLargo) {
    warnings.push('No se detectó aporte propio del medio');
    tracer.sub(10, warnings[warnings.length - 1], 'SIN_APORTE_PROPIO');
    recommendations.push('Agregar contexto o verificación propia del medio');
  } else {
    signals.push('No se exige aporte propio en nota de actualidad');
  }

  if (ev.valorEditorial.tieneCitaEspecifica) {
    signals.push('Citas específicas detectadas');
  } else if (esLargo) {
    warnings.push('No se detectaron citas específicas');
    tracer.sub(8, warnings[warnings.length - 1], 'SIN_CITAS');
    recommendations.push('Incluir citas directas de fuentes');
  } else {
    signals.push('No se exigen citas directas en nota de actualidad');
  }

  if (ev.valorEditorial.tieneAtribucionVaga) {
    errors.push('Atribuciones vagas detectadas');
    tracer.sub(15, errors[errors.length - 1], 'ATRIBUCION_VAGA');
    recommendations.push('Reemplazar atribuciones vagas con fuentes identificadas');
  }

  if (ev.valorEditorial.nombresPropiosCount >= 3) {
    signals.push(`${ev.valorEditorial.nombresPropiosCount} nombres propios detectados`);
  } else if (esLargo) {
    warnings.push(`Solo ${ev.valorEditorial.nombresPropiosCount} nombres propios`);
    tracer.sub(5, warnings[warnings.length - 1], 'POCOS_NOMBRES');
    recommendations.push('Incluir más nombres propios de personas o instituciones');
  } else if (ev.valorEditorial.nombresPropiosCount >= 1) {
    signals.push(`${ev.valorEditorial.nombresPropiosCount} nombres propios detectados`);
  }

  if (ev.valorEditorial.institucionesCount >= 2) {
    signals.push(`${ev.valorEditorial.institucionesCount} instituciones mencionadas`);
  } else if (esLargo) {
    warnings.push(`Solo ${ev.valorEditorial.institucionesCount} instituciones mencionadas`);
    tracer.sub(5, warnings[warnings.length - 1], 'POCAS_INSTITUCIONES');
    recommendations.push('Mencionar instituciones relevantes');
  } else if (ev.valorEditorial.institucionesCount >= 1) {
    signals.push(`${ev.valorEditorial.institucionesCount} instituciones mencionadas`);
  }

  const ratioSinDato = ev.valorEditorial.parrafosTotal > 0
    ? ev.valorEditorial.parrafosSinDato / ev.valorEditorial.parrafosTotal
    : 0;

  if (ratioSinDato > 0.5 && esLargo) {
    warnings.push(`${ev.valorEditorial.parrafosSinDato} de ${ev.valorEditorial.parrafosTotal} párrafos sin datos concretos`);
    tracer.sub(10, warnings[warnings.length - 1], 'PARRAFOS_SIN_DATO');
    recommendations.push('Cada párrafo debe contener al menos un dato verificable');
  }

  if (ev.valorEditorial.tieneDatosInventados) {
    errors.push('Posibles datos inventados (atribuciones falsas sin fuentes)');
    tracer.sub(20, errors[errors.length - 1], 'DATOS_INVENTADOS');
    recommendations.push('Verificar todas las atribuciones con fuentes identificables');
  }

  if (ev.valorEditorial.tieneFuentesAnonimas) {
    warnings.push('Fuentes anónimas detectadas');
    tracer.sub(8, warnings[warnings.length - 1], 'FUENTES_ANONIMAS');
    recommendations.push('Identificar fuentes o eliminar referencias anónimas');
  }

  // Evidencia requerida por perfil (solo contenido largo)
  if (esLargo) {
    for (const [key, regex] of Object.entries(profile.requiredEvidence)) {
      if (!regex.test(ev.textoPlano)) {
        warnings.push(`No se encontró evidencia requerida: ${key}`);
        tracer.sub(10, warnings[warnings.length - 1], `EVIDENCIA_REQUERIDA:${key}`);
        recommendations.push(`Incluir ${key} según el perfil de ${profile.categoria}`);
      }
    }

    const contextoEncontrado = profile.requiredContext.patrones.some(r => r.test(ev.textoPlano));
    if (!contextoEncontrado) {
      warnings.push(`No se encontró contexto de tipo "${profile.requiredContext.tipo}"`);
      tracer.sub(8, warnings[warnings.length - 1], 'CONTEXTO_REQUERIDO');
      recommendations.push(`Agregar contexto sobre ${profile.requiredContext.tipo}`);
    }

    if (ev.utility.preguntasRespondidas.length === 0) {
      warnings.push('No se respondieron preguntas de utilidad del perfil');
      tracer.sub(8, warnings[warnings.length - 1], 'UTILIDAD_REQUERIDA');
      recommendations.push('Responder al menos una pregunta útil para el lector');
    }
  }

  return {
    modulo: 'VALOR_EDITORIAL',
    score: Math.max(0, Math.min(100, tracer.getScore())),
    trace: tracer.getTrace(),
    signals,
    warnings,
    errors,
    evidence: {
      nombresPropios: ev.valorEditorial.nombresPropiosCount,
      instituciones: ev.valorEditorial.institucionesCount,
      ratioSinDato,
    },
    recommendations,
  };
};

export function scoreCalidad(evidence: ArticleEvidence, profile: EditorialProfile): CalidadModules {
  return {
    seo: evaluarSEO(evidence, profile),
    eeat: evaluarEEAT(evidence, profile),
    discover: evaluarDiscover(evidence, profile),
    adsense: evaluarAdSense(evidence, profile),
    valorEditorial: evaluarValorEditorial(evidence, profile),
  };
}
