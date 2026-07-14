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

const marcasEstadisticas = /\b(marcador|resultado|goles?|puntos?|posici[oó]n|tabla|clasificaci[oó]n|estad[íi]sticas?|anotaciones?|tarjetas?|tiros|parciales?|sets?|entradas?|innings?|fixture|convocatoria|convocados|transferencia|r[eé]cord|rachas?|rendimiento|victorias?|derrotas?|empates?)\b/i;
const figuras = /\b(jugador|figura|delantero|portero|entrenador|director t[ée]cnico|capit[áa]n|goleador|asistencia|mvp|estrella|crack)\b/i;
const proximoPartido = /\b(pr[oó]ximo partido|pr[oó]xima fecha|jornada|calendario|horario|rival|se enfrenta|visita a|fixture|agenda deportiva)\b/i;

function detectarEstadisticas(n: NoticiaInput): boolean {
  return marcasEstadisticas.test(textoCompleto(n)) && /\d/.test(textoCompleto(n));
}

function detectarContextoTorneo(n: NoticiaInput): boolean {
  return /\b(torneo|liga|campeonato|cop[oa]|serie|eliminatoria|clasificatoria|fase|grupo|ronda|final|semifinal|cuartos)\b/i.test(textoCompleto(n));
}

function sugerenciasDeportes(n: NoticiaInput, _ev: EvidenciaPuntuada): SugerenciasV2 {
  const stats = detectarEstadisticas(n);
  const figura = figuras.test(textoCompleto(n));
  const torneo = detectarContextoTorneo(n);
  const proximo = proximoPartido.test(textoCompleto(n));
  const antecedentes = detectoresValorAgregado.antecedentes(n);

  const oportunidades = [];

  if (!stats) {
    oportunidades.push(fabricarSugerencia(
      'Incluir estadísticas clave: marcador, goles, tiros, parciales o posición en tabla.',
      'Precisión deportiva.',
      '10-20 min',
      'Baja',
      'Factualidad.'
    ));
  }

  if (!figura) {
    oportunidades.push(fabricarSugerencia(
      'Mencionar figuras relevantes: jugadores, entrenador o goleador del partido.',
      'Humaniza la crónica.',
      '5-15 min',
      'Baja',
      'Atracción del lector.'
    ));
  }

  if (!torneo) {
    oportunidades.push(fabricarSugerencia(
      'Contextualizar en el torneo, liga o campeonato correspondiente.',
      'Contexto de competencia.',
      '10-20 min',
      'Baja',
      'Comprensión.'
    ));
  }

  if (!proximo) {
    oportunidades.push(fabricarSugerencia(
      'Agregar información del próximo partido, rival o calendario.',
      'Vigencia y servicio.',
      '10-20 min',
      'Baja',
      'Fideliza al aficionado.'
    ));
  }

  if (!antecedentes) {
    oportunidades.push(fabricarSugerencia(
      'Incluir antecedentes del rival o serie histórica reciente.',
      'Contexto.',
      '15-30 min',
      'Media',
      'Diferenciación.'
    ));
  }

  return {
    oportunidadesEditoriales: oportunidades.slice(0, 5),
    comoConvertirReferencia: [
      fabricarSugerencia(
        'Comparar con resultados históricos del equipo o jugador.',
        'Contexto.',
        '30-60 min',
        'Media',
        'Relevancia.'
      ),
      fabricarSugerencia(
        'Construir cronología del torneo o serie.',
        'Línea de tiempo.',
        '30-60 min',
        'Baja',
        'Comprensión.'
      ),
      fabricarSugerencia(
        'Actualizar con resultados o declaraciones oficiales posteriores.',
        'Vigencia.',
        '10-20 min',
        'Baja',
        'Autoridad.'
      ),
      fabricarSugerencia(
        'Agregar estadísticas oficiales del torneo.',
        'Datos.',
        '30-60 min',
        'Baja',
        'Referencia.'
      ),
    ],
    nivel10: [
      fabricarSugerencia(
        'An[áa]lisis de rendimiento del equipo con estadísticas oficiales.',
        'An[áa]lisis.',
        '2-4 días',
        'Alta',
        'Autoridad.'
      ),
      fabricarSugerencia(
        'Guía de calendario y próximos partidos.',
        'Evergreen.',
        '1 día',
        'Baja',
        'Valor pr[áa]ctico.'
      ),
    ],
  };
}

function calcularUtilidadDeportes(n: NoticiaInput, ev: EvidenciaPuntuada): number {
  let puntos = 40; // base de interés para aficionados
  if (detectarEstadisticas(n)) puntos += 30;
  if (figuras.test(textoCompleto(n))) puntos += 10;
  if (proximoPartido.test(textoCompleto(n))) puntos += 20;
  if (detectoresValorAgregado.explicacionImpacto(n)) puntos += 10;
  return Math.max(ev.utilidad, Math.min(100, puntos));
}

function consistenciaDeportes(n: NoticiaInput, ev: EvidenciaPuntuada): string[] {
  const faltantes: string[] = [];
  if (!detectarEstadisticas(n)) faltantes.push('faltó estadística');
  if (!detectarContextoTorneo(n)) faltantes.push('faltó tabla o contexto del torneo');
  if (!proximoPartido.test(textoCompleto(n))) faltantes.push('faltó calendario');
  if (!detectoresValorAgregado.antecedentes(n)) faltantes.push('faltó antecedentes');
  if (!figuras.test(textoCompleto(n)) && ev.datosConcretos < 60) faltantes.push('faltó figuras del partido');
  return faltantes;
}

export function evaluarDeportes(n: NoticiaInput, v2: ResultadoEditorJefeV2): EvaluacionVertical {
  const ev = v2.fase1_evidencia;
  const sugerencias = sugerenciasDeportes(n, ev);
  const utilidad = calcularUtilidadDeportes(n, ev);
  const originalidad = Math.max(ev.originalidad, calcularOriginalidadPorEstructura(n, ev));
  const diferenciador = evaluarDiferenciadorNI(n);

  return {
    vertical: 'Deportes',
    sugerencias,
    utilidad,
    originalidad,
    consistencia: { aprobado: true, contradicciones: consistenciaDeportes(n, ev) },
    diferenciadorNI: { ...diferenciador, puntuacion: Math.max(diferenciador.puntuacion, originalidad >= 50 ? 50 : 0) },
    prioridadEditorial: prioridadDesdeDecision(v2, utilidad, originalidad),
    valorAgregado: diferenciador.elementosDetectados.length > 0
      ? diferenciador.elementosDetectados
      : ['La nota cumple los criterios básicos de su vertical; no se detectaron diferenciadores adicionales.'],
  };
}

