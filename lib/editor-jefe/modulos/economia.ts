import type { NoticiaInput } from '../../analizador-noticias';
import type { EvidenciaPuntuada, ResultadoEditorJefeV2, SugerenciasV2 } from '../engine';
import {
  type EvaluacionVertical,
  fabricarSugerencia,
  textoCompleto,
  detectoresContextoRico,
  evaluarDiferenciadorNI,
  calcularOriginalidadPorEstructura,
  prioridadDesdeDecision,
} from './base';

const institucionesEconomicas = /\b(banco central|bcn|banco nacional|superintendencia|ministerio de hacienda|ministerio de econom[ií]a|ministerio de industria|comisi[oó]n econ[oó]mica|fmi|bce|bm|banco mundial|cmf|came|empresa|mercado|banco|cooperativa)\b/i;
const indicadoresEconomicos = /\b(inflaci[oó]n|d[eé]ficit|super[aá]vit|pib|producto interno bruto|desempleo|empleo|salario|m[ií]nimo|ipc|tipo de cambio|d[oó]lar|euro|moneda|remesa|remesas|exportaci[oó]n|importaci[oó]n|tarifa|impuesto|iva|renta|combustible|gasolina|di[eé]sel|precio|precios)\b/i;

function detectarCifrasEconomicas(n: NoticiaInput): boolean {
  return /\b\d+[\d.,]*\s*(?:%|por ciento|millones?|miles de millones|d[oó]lares|c[oó]rdobas|c$|\$)\b|\bC?\$\s*\d+/i.test(textoCompleto(n));
}

function detectarImpactoEconomico(n: NoticiaInput): boolean {
  return /\b(impacto econ[oó]mico|impacto en el bolsillo|afecta a|beneficia a|perjudica a|gana|pierde|sector|pymes|empresas|familias|hogares|consumidor|contribuyente|inversionista)\b/i.test(textoCompleto(n));
}

function detectarContextoEconomico(n: NoticiaInput): boolean {
  return detectoresContextoRico.estadisticas(n) || detectoresContextoRico.leyes(n) || indicadoresEconomicos.test(textoCompleto(n));
}

function sugerenciasEconomia(n: NoticiaInput, _ev: EvidenciaPuntuada): SugerenciasV2 {
  const cifras = detectarCifrasEconomicas(n);
  const impacto = detectarImpactoEconomico(n);
  const contexto = detectarContextoEconomico(n);
  const institucion = institucionesEconomicas.test(textoCompleto(n));

  const oportunidades = [];

  if (!cifras) {
    oportunidades.push(fabricarSugerencia(
      'Incluir cifras concretas: porcentajes, montos, tasas, precios o variaciones del indicador.',
      'Precisión económica.',
      '10-20 min',
      'Baja',
      'Factualidad.'
    ));
  }

  if (!impacto) {
    oportunidades.push(fabricarSugerencia(
      'Explicar el impacto económico: quién gana, quién pierde y cómo afecta al lector.',
      'Utilidad pública.',
      '15-30 min',
      'Media',
      'Conecta con el ciudadano.'
    ));
  }

  if (!contexto) {
    oportunidades.push(fabricarSugerencia(
      'Agregar contexto del indicador: tendencia, comparación con períodos anteriores o marco legal.',
      'Contexto de mercado.',
      '20-40 min',
      'Media',
      'Profundidad.'
    ));
  }

  if (!institucion) {
    oportunidades.push(fabricarSugerencia(
      'Citar la institución, banco, empresa o fuente que publicó o confirmó el dato.',
      'Credibilidad.',
      '10-20 min',
      'Baja',
      'Reduce desmentidos.'
    ));
  }

  return {
    oportunidadesEditoriales: oportunidades.slice(0, 5),
    comoConvertirReferencia: [
      fabricarSugerencia(
        'Comparar con datos históricos del mismo indicador o sector.',
        'Tendencia.',
        '1-2 días',
        'Media',
        'Relevancia.'
      ),
      fabricarSugerencia(
        'Construir gráfica o tabla explicativa con datos públicos.',
        'Visual.',
        '1-2 días',
        'Media',
        'Mejora comprensión.'
      ),
      fabricarSugerencia(
        'Actualizar cuando se publiquen nuevos datos oficiales.',
        'Vigencia.',
        '10-20 min',
        'Baja',
        'Mantiene utilidad.'
      ),
    ],
    nivel10: [
      fabricarSugerencia(
        'An[áa]lisis de tendencia del indicador con datos oficiales.',
        'An[áa]lisis.',
        '2-4 días',
        'Alta',
        'Autoridad.'
      ),
      fabricarSugerencia(
        'Guía pr[áa]ctica: c[óo]mo afecta el cambio a la economía familiar.',
        'Evergreen.',
        '1 día',
        'Baja',
        'Tr[áa]fico sostenido.'
      ),
    ],
  };
}

function calcularUtilidadEconomia(n: NoticiaInput, ev: EvidenciaPuntuada): number {
  let puntos = 35;
  if (detectarCifrasEconomicas(n)) puntos += 25;
  if (detectarImpactoEconomico(n)) puntos += 30;
  if (detectarContextoEconomico(n)) puntos += 10;
  if (institucionesEconomicas.test(textoCompleto(n))) puntos += 10;
  return Math.max(ev.utilidad, Math.min(100, puntos));
}

function consistenciaEconomia(n: NoticiaInput, ev: EvidenciaPuntuada): string[] {
  const faltantes: string[] = [];
  if (!detectarCifrasEconomicas(n)) faltantes.push('faltó cifras o datos concretos');
  if (!detectarImpactoEconomico(n)) faltantes.push('faltó impacto económico');
  if (!detectarContextoEconomico(n)) faltantes.push('faltó contexto de mercado o indicador');
  if (!institucionesEconomicas.test(textoCompleto(n)) && ev.fuenteIdentificada < 60) faltantes.push('faltó institución o fuente del dato');
  return faltantes;
}

export function evaluarEconomia(n: NoticiaInput, v2: ResultadoEditorJefeV2): EvaluacionVertical {
  const ev = v2.fase1_evidencia;
  const sugerencias = sugerenciasEconomia(n, ev);
  const utilidad = calcularUtilidadEconomia(n, ev);
  const originalidad = Math.max(ev.originalidad, calcularOriginalidadPorEstructura(n, ev));
  const diferenciador = evaluarDiferenciadorNI(n);

  return {
    vertical: 'Economía',
    sugerencias,
    utilidad,
    originalidad,
    consistencia: { aprobado: true, contradicciones: consistenciaEconomia(n, ev) },
    diferenciadorNI: { ...diferenciador, puntuacion: Math.max(diferenciador.puntuacion, originalidad >= 50 ? 50 : 0) },
    prioridadEditorial: prioridadDesdeDecision(v2, utilidad, originalidad),
    valorAgregado: diferenciador.elementosDetectados.length > 0
      ? diferenciador.elementosDetectados
      : ['La nota cumple los criterios básicos de su vertical; no se detectaron diferenciadores adicionales.'],
  };
}
