import type { NoticiaInput } from '../../analizador-noticias';
import type { EvidenciaPuntuada, ResultadoEditorJefeV2, SugerenciasV2 } from '../engine';
import {
  type EvaluacionVertical,
  fabricarSugerencia,
  textoCompleto,
  textoPlano,
  detectoresValorAgregado,
  detectoresContextoRico,
  evaluarDiferenciadorNI,
  calcularOriginalidadPorEstructura,
  prioridadDesdeDecision,
} from './base';

function detectarOpinionExplicita(n: NoticiaInput): boolean {
  return /\b(editorial|columna|opini[oó]n|an[áa]lisis|punto de vista|punto de vista|cr[ií]tica|ensayo|reflexi[oó]n|comentario)\b/i.test(textoCompleto(n));
}

function detectarArgumentacion(n: NoticiaInput): boolean {
  const t = textoPlano(n);
  return /\b(porque|pues|ya que|dado que|en primer lugar|en segundo lugar|por un lado|por otro lado|en conclusi[oó]n|por lo tanto|en resumen|mi argumento|sostengo|considero)\b/i.test(t);
}

function detectarFuentesOpinion(n: NoticiaInput): boolean {
  return /\b(seg[úu]n|de acuerdo con|como señala|como indica|seg[uú]n datos|estudio|cifra de|reporte de|encuesta|experto|analista)\b/i.test(textoCompleto(n));
}

function detectarContextoOpinion(n: NoticiaInput): boolean {
  return detectoresContextoRico.antecedentes(n) || detectoresContextoRico.historia(n) || detectoresValorAgregado.contexto(n);
}

function sugerenciasOpinion(n: NoticiaInput, _ev: EvidenciaPuntuada): SugerenciasV2 {
  const argumentacion = detectarArgumentacion(n);
  const fuentes = detectarFuentesOpinion(n);
  const contexto = detectarContextoOpinion(n);

  const oportunidades = [];

  if (!detectarOpinionExplicita(n)) {
    oportunidades.push(fabricarSugerencia(
      'Marcar claramente la nota como opinión, editorial, columna o análisis para el lector.',
      'Transparencia.',
      '5 min',
      'Baja',
      'Evita confusión con noticia informativa.'
    ));
  }

  if (!argumentacion) {
    oportunidades.push(fabricarSugerencia(
      'Fortalecer la argumentación: conectores lógicos, razones y una tesis clara.',
      'Rigor de opinión.',
      '20-40 min',
      'Media',
      'Persuade y respeta al lector.'
    ));
  }

  if (!fuentes) {
    oportunidades.push(fabricarSugerencia(
      'Sostener la opinión con fuentes, datos o referencias concretas.',
      'Autoridad.',
      '15-30 min',
      'Media',
      'Distingue opinión de conjetura.'
    ));
  }

  if (!contexto) {
    oportunidades.push(fabricarSugerencia(
      'Incluir contexto histórico, antecedentes o datos que justifiquen el análisis.',
      'Fondo.',
      '20-40 min',
      'Media',
      'Situ al lector.'
    ));
  }

  return {
    oportunidadesEditoriales: oportunidades.slice(0, 5),
    comoConvertirReferencia: [
      fabricarSugerencia(
        'Transformar el análisis en pieza con múltiples fuentes y contraste de posturas.',
        'Profundidad.',
        '1-2 días',
        'Media',
        'Autoridad.'
      ),
      fabricarSugerencia(
        'Actualizar la columna cuando cambien los hechos o surjan nuevos datos.',
        'Vigencia.',
        '10-20 min',
        'Baja',
        'Mantiene relevancia.'
      ),
    ],
    nivel10: [
      fabricarSugerencia(
        'Perfil analítico del tema con cronología y datos verificables.',
        'Evergreen.',
        '2-3 días',
        'Alta',
        'Tráfico sostenido.'
      ),
    ],
  };
}

function calcularUtilidadOpinion(n: NoticiaInput, ev: EvidenciaPuntuada): number {
  let puntos = 45;
  if (detectarOpinionExplicita(n)) puntos += 10;
  if (detectarArgumentacion(n)) puntos += 25;
  if (detectarFuentesOpinion(n)) puntos += 15;
  if (detectarContextoOpinion(n)) puntos += 15;
  return Math.max(ev.utilidad, Math.min(100, puntos));
}

function consistenciaOpinion(n: NoticiaInput): string[] {
  const faltantes: string[] = [];
  if (!detectarArgumentacion(n)) faltantes.push('faltó argumentación');
  if (!detectarFuentesOpinion(n)) faltantes.push('faltó fuentes o datos');
  if (!detectarContextoOpinion(n)) faltantes.push('faltó contexto');
  return faltantes;
}

export function evaluarOpinion(n: NoticiaInput, v2: ResultadoEditorJefeV2): EvaluacionVertical {
  const ev = v2.fase1_evidencia;
  const sugerencias = sugerenciasOpinion(n, ev);
  const utilidad = calcularUtilidadOpinion(n, ev);
  const originalidad = Math.max(ev.originalidad, calcularOriginalidadPorEstructura(n, ev));
  const diferenciador = evaluarDiferenciadorNI(n);

  return {
    vertical: 'Opinión',
    sugerencias,
    utilidad,
    originalidad,
    consistencia: { aprobado: true, contradicciones: consistenciaOpinion(n) },
    diferenciadorNI: { ...diferenciador, puntuacion: Math.max(diferenciador.puntuacion, originalidad >= 50 ? 50 : 0) },
    prioridadEditorial: prioridadDesdeDecision(v2, utilidad, originalidad),
    valorAgregado: diferenciador.elementosDetectados.length > 0
      ? diferenciador.elementosDetectados
      : ['La nota cumple los criterios básicos de su vertical; no se detectaron diferenciadores adicionales.'],
  };
}
