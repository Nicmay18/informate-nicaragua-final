import type { NoticiaInput } from '../../analizador-noticias';
import type { EvidenciaPuntuada, ResultadoEditorJefeV2, SugerenciasV2 } from '../engine';
import {
  type EvaluacionVertical,
  fabricarSugerencia,
  textoCompleto,
  detectoresValorAgregado,
  evaluarDiferenciadorNI,
  calcularOriginalidadPorEstructura,
  prioridadDesdeDecision,
} from './base';

const fuentesInternacionales = /\b(onu|reuters|associated press|ap|afp|bbc|deutsche welle|dw|cnn|al jazeera|europa press|efe|agencia|gobierno de|secretar[ií]a de|canciller[ií]a|embajada|organismo internacional)\b/i;

function detectarContextoRegional(n: NoticiaInput): boolean {
  return /\b(regi[oó]n|latinoam[eé]rica|centroam[eé]rica|am[eé]rica latina|pa[ií]ses vecinos|escenario internacional|geopol[ií]tica|relaciones bilaterales)\b/i.test(textoCompleto(n));
}

function detectarImpactoNicaragua(n: NoticiaInput): boolean {
  return /\b(impacto en nicaragua|para nicaragua|nicaragua|efecto en el pa[ií]s|consecuencias para nicaragua|relaci[oó]n con nicaragua|migraci[oó]n nicarag[uü]ense|remesas|comercio con nicaragua)\b/i.test(textoCompleto(n));
}

function detectarOrganismosOficiales(n: NoticiaInput): boolean {
  return /\b(onu|oea|ops|oms|bce|fed|bm|fmi|banco mundial|unicef|acnur|ops|oms|corte internacional|tribunal)\b/i.test(textoCompleto(n));
}

function sugerenciasInternacionales(n: NoticiaInput, _ev: EvidenciaPuntuada): SugerenciasV2 {
  const regional = detectarContextoRegional(n);
  const impactoNI = detectarImpactoNicaragua(n);
  const organismos = detectarOrganismosOficiales(n);

  const oportunidades = [];

  if (!regional) {
    oportunidades.push(fabricarSugerencia(
      'Situar la noticia en su contexto regional o internacional con fuentes reconocidas.',
      'Contexto geopolítico.',
      '15-30 min',
      'Media',
      'Evita lectura aislada.'
    ));
  }

  if (!impactoNI) {
    oportunidades.push(fabricarSugerencia(
      'Explicitar por qu[é] importa para Nicaragua o cómo puede afectar al lector nicarag[üu]ense.',
      'Relevancia local.',
      '15-30 min',
      'Media',
      'Diferenciador para la audiencia.'
    ));
  }

  if (!organismos && !fuentesInternacionales.test(textoCompleto(n))) {
    oportunidades.push(fabricarSugerencia(
      'Citar agencia o medio internacional reconocido que respalde el dato central.',
      'Credibilidad.',
      '10-20 min',
      'Baja',
      'Reduce rumores.'
    ));
  }

  if (!detectoresValorAgregado.antecedentes(n)) {
    oportunidades.push(fabricarSugerencia(
      'Agregar antecedentes del conflicto, política o hecho internacional para explicar el porqu[é].',
      'Profundidad.',
      '20-40 min',
      'Media',
      'Mejora comprensión.'
    ));
  }

  return {
    oportunidadesEditoriales: oportunidades.slice(0, 5),
    comoConvertirReferencia: [
      fabricarSugerencia(
        'Construir una línea de tiempo de los hechos con fechas verificables.',
        'Organiza información.',
        '30-60 min',
        'Media',
        'Comprensión.'
      ),
      fabricarSugerencia(
        'Comparar con hechos similares previos en la misma región o país.',
        'Contexto histórico.',
        '1-2 días',
        'Media',
        'Relevancia.'
      ),
      fabricarSugerencia(
        'Actualizar cuando organismos internacionales publiquen nuevas posiciones o datos.',
        'Vigencia.',
        '10-20 min',
        'Baja',
        'Autoridad.'
      ),
    ],
    nivel10: [
      fabricarSugerencia(
        'An[áa]lisis del impacto regional y consecuencias para Centroam[eé]rica.',
        'An[áa]lisis de fondo.',
        '2-4 días',
        'Alta',
        'Autoridad editorial.'
      ),
      fabricarSugerencia(
        'Guía: cómo afecta el tema a migración, economía o comercio de Nicaragua.',
        'Evergreen.',
        '1 día',
        'Baja',
        'Tr[áa]fico sostenido.'
      ),
    ],
  };
}

function calcularUtilidadInternacionales(n: NoticiaInput, ev: EvidenciaPuntuada): number {
  const impacto = detectarImpactoNicaragua(n) ? 60 : 0;
  const explica = detectoresValorAgregado.explicacionImpacto(n) ? 30 : 0;
  return Math.max(ev.utilidad, Math.min(100, 30 + impacto + explica));
}

function consistenciaInternacionales(n: NoticiaInput, ev: EvidenciaPuntuada): string[] {
  const faltantes: string[] = [];
  if (!detectarContextoRegional(n)) faltantes.push('faltó contexto regional');
  if (!detectarImpactoNicaragua(n)) faltantes.push('faltó impacto para Nicaragua');
  if (!detectoresValorAgregado.antecedentes(n)) faltantes.push('faltó antecedentes');
  if (!fuentesInternacionales.test(textoCompleto(n)) && ev.fuenteIdentificada < 60) faltantes.push('faltó fuente internacional reconocida');
  return faltantes;
}

export function evaluarInternacionales(n: NoticiaInput, v2: ResultadoEditorJefeV2): EvaluacionVertical {
  const ev = v2.fase1_evidencia;
  const sugerencias = sugerenciasInternacionales(n, ev);
  const utilidad = calcularUtilidadInternacionales(n, ev);
  const originalidad = Math.max(ev.originalidad, calcularOriginalidadPorEstructura(n, ev));
  const diferenciador = evaluarDiferenciadorNI(n);

  return {
    vertical: 'Internacionales',
    sugerencias,
    utilidad,
    originalidad,
    consistencia: { aprobado: true, contradicciones: consistenciaInternacionales(n, ev) },
    diferenciadorNI: { ...diferenciador, puntuacion: Math.max(diferenciador.puntuacion, originalidad >= 50 ? 50 : 0) },
    prioridadEditorial: prioridadDesdeDecision(v2, utilidad, originalidad),
    valorAgregado: diferenciador.elementosDetectados.length > 0 ? diferenciador.elementosDetectados : ['Sin aporte propio detectado'],
  };
}

