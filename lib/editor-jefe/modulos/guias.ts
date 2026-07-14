import type { NoticiaInput } from '../../analizador-noticias';
import type { EvidenciaPuntuada, ResultadoEditorJefeV2, SugerenciasV2 } from '../engine';
import {
  type EvaluacionVertical,
  fabricarSugerencia,
  textoCompleto,
  detectoresUtilidad,
  evaluarDiferenciadorNI,
  calcularOriginalidadPorEstructura,
  prioridadDesdeDecision,
} from './base';

function detectarGuia(n: NoticiaInput): boolean {
  return /\b(c[óo]mo|pasos|paso a paso|qu[eé] hacer|gu[íi]a|tutorial|recomendaciones|consejos|tips|checklist|instrucciones)\b/i.test(textoCompleto(n));
}

function detectarServicioCompleto(n: NoticiaInput): boolean {
  const tienePasos = detectoresUtilidad.guia(n) || /\b(paso\s+\d|primero|segundo|tercero|finalmente|a continuaci[oó]n)\b/i.test(textoCompleto(n));
  const tieneContacto = detectoresUtilidad.telefonos(n) || detectoresUtilidad.direcciones(n);
  const tieneAdvertencia = /\b(precauci[oó]n|cuidado|importante|no olvides|recomendaci[oó]n|advertencia|nota)\b/i.test(textoCompleto(n));
  return tienePasos && tieneContacto && tieneAdvertencia;
}

function sugerenciasGuias(n: NoticiaInput, _ev: EvidenciaPuntuada): SugerenciasV2 {
  const guia = detectarGuia(n);
  const pasos = detectoresUtilidad.guia(n) || /\b(paso\s+\d|primero|segundo|tercero|finalmente|a continuaci[oó]n)\b/i.test(textoCompleto(n));
  const contacto = detectoresUtilidad.telefonos(n) || detectoresUtilidad.direcciones(n);
  const advertencia = /\b(precauci[oó]n|cuidado|importante|no olvides|recomendaci[oó]n|advertencia|nota)\b/i.test(textoCompleto(n));

  const oportunidades = [];

  if (!guia) {
    oportunidades.push(fabricarSugerencia(
      'Marcar la nota como guía o tutorial desde el título o introducción.',
      'Claridad.',
      '5 min',
      'Baja',
      'El lector sabe qué esperar.'
    ));
  }

  if (!pasos) {
    oportunidades.push(fabricarSugerencia(
      'Estructurar los pasos de forma numerada o secuencial.',
      'Utilidad.',
      '15-30 min',
      'Media',
      'Facilita seguimiento.'
    ));
  }

  if (!contacto) {
    oportunidades.push(fabricarSugerencia(
      'Agregar teléfono, dirección, enlace o dónde acudir si aplica.',
      'Servicio completo.',
      '10-20 min',
      'Baja',
      'Resuelve al lector.'
    ));
  }

  if (!advertencia) {
    oportunidades.push(fabricarSugerencia(
      'Incluir advertencias, limitaciones o recomendaciones de seguridad si son pertinentes.',
      'Responsabilidad.',
      '10-20 min',
      'Baja',
      'Evita daños por omisión.'
    ));
  }

  return {
    oportunidadesEditoriales: oportunidades.slice(0, 5),
    comoConvertirReferencia: [
      fabricarSugerencia(
        'Agregar tabla de requisitos, tiempos y costos cuando aplique.',
        'Referencia.',
        '30-60 min',
        'Media',
        'Consulta recurrente.'
      ),
      fabricarSugerencia(
        'Actualizar la guía cuando cambien los requisitos o plazos.',
        'Vigencia.',
        '10-20 min',
        'Baja',
        'Mantiene utilidad.'
      ),
    ],
    nivel10: [
      fabricarSugerencia(
        'Video o infografía paso a paso para redes sociales.',
        'Evergreen visual.',
        '1-2 días',
        'Alta',
        'Tráfico sostenido.'
      ),
      fabricarSugerencia(
        'Preguntas frecuentes relacionadas a la guía.',
        'SEO.',
        '30-60 min',
        'Baja',
        'Captura búsquedas.'
      ),
    ],
  };
}

function calcularUtilidadGuias(n: NoticiaInput, ev: EvidenciaPuntuada): number {
  let puntos = 40;
  if (detectarGuia(n)) puntos += 20;
  if (detectoresUtilidad.guia(n)) puntos += 15;
  if (detectoresUtilidad.telefonos(n) || detectoresUtilidad.direcciones(n)) puntos += 15;
  if (detectarServicioCompleto(n)) puntos += 10;
  return Math.max(ev.utilidad, Math.min(100, puntos));
}

function consistenciaGuias(n: NoticiaInput): string[] {
  const faltantes: string[] = [];
  if (!detectarGuia(n)) faltantes.push('faltó marcar como guía o tutorial');
  if (!detectoresUtilidad.guia(n)) faltantes.push('faltó pasos o estructura secuencial');
  if (!detectoresUtilidad.telefonos(n) && !detectoresUtilidad.direcciones(n)) faltantes.push('faltó contacto o dónde acudir');
  return faltantes;
}

export function evaluarGuias(n: NoticiaInput, v2: ResultadoEditorJefeV2): EvaluacionVertical {
  const ev = v2.fase1_evidencia;
  const sugerencias = sugerenciasGuias(n, ev);
  const utilidad = calcularUtilidadGuias(n, ev);
  const originalidad = Math.max(ev.originalidad, calcularOriginalidadPorEstructura(n, ev));
  const diferenciador = evaluarDiferenciadorNI(n);

  return {
    vertical: 'Servicio',
    sugerencias,
    utilidad,
    originalidad,
    consistencia: { aprobado: true, contradicciones: consistenciaGuias(n) },
    diferenciadorNI: { ...diferenciador, puntuacion: Math.max(diferenciador.puntuacion, originalidad >= 50 ? 50 : 0) },
    prioridadEditorial: prioridadDesdeDecision(v2, utilidad, originalidad),
    valorAgregado: diferenciador.elementosDetectados.length > 0
      ? diferenciador.elementosDetectados
      : ['La nota cumple los criterios básicos de su vertical; no se detectaron diferenciadores adicionales.'],
  };
}
