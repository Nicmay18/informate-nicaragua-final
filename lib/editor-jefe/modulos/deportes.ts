import type { NoticiaInput } from '../../analizador-noticias';
import type { EvidenciaPuntuada, ResultadoEditorJefeV2, SugerenciasV2 } from '../engine';
import {
  type EvaluacionVertical,
  fabricarSugerencia,
  textoCompleto,
  textoPlano,
  detectoresValorAgregado,
  evaluarDiferenciadorNI,
  calcularOriginalidadPorEstructura,
  prioridadDesdeDecision,
} from './base';

// ═══════════════════════════════════════════════════════════════════════════════
// DETECTORES ESPECIALIZADOS PARA DEPORTES
// ═══════════════════════════════════════════════════════════════════════════════

const FUENTES_OFICIALES_DEPORTES = /\b(?:fifa|uefa|conmebol|concacaf|coi|comit[eé] ol[ií]mpico|ifab|federaci[oó]n(?:\s+(?:de\s+f[uú]tbol|nicarag[uü]ense|centroamericana|internacional))?|federacion(?:\s+(?:de\s+futbol|nicaraguense|centroamericana|internacional))?|fena?fut|fenafuth|federaci[oó]n\s+nacional\s+de\s+f[uú]tbol)\b/i;
const LIGAS_EQUIPOS_RECONOCIDOS = /\b(?:liga\s+nacional|liga\s+primera|primera\s+(?:divisi[oó]n|liga|categor[ií]a)|segunda\s+divisi[oó]n|liga\s+de\s+naciones|champions\s+league|premier\s+league|la\s+liga|bundesliga|serie\s+a|ligue\s+1|mls|nba|nfl|mlb|nhl|f[oó]rmula\s+1|f1|atp|wta|real\s+estel[ií]|diriang[eé]n|walter\s+ferretti|ferretti)\b/i;

const EVENTOS_INTERES_PUBLICO = /\b(?:mundial\s+(?:de\s+f[uú]tbol|fifa)|juegos\s+ol[ií]mpicos|olimpiadas|eliminatoria|eliminatorias|campeonato(?:\s+(?:mundial|continental|nacional|internacional))?|copa\s+(?:am[eé]rica|del\s+mundo|oro|concacaf|libertadores|sudamericana|mx)|selecci[oó]n\s+nacional|la\s+selecci[oó]n|final|semifinal|cuartos\s+de\s+final|octavos\s+de\s+final|gran\s+premio|cl[aá]sico|super\s+bowl|torneo|liga|goleador|goleadora|l[ií]der)\b/i;

const EVIDENCIA_DEPORTIVA = /\b(?:marcador|resultado|goles?|puntos?|posici[oó]n|tabla|clasificaci[oó]n|estad[ií]sticas?|anotaciones?|tarjetas?|tiros|parciales?|sets?|innings?|vuelta|cronometraje|fixture|calendario|jornada|fecha|formato|reglamento|reglas?|premios?|trofeos?|r[eé]cord|racha|rendimiento|victorias?|derrotas?|empates?)\b/i;

const DATOS_CONCRETOS_DEPORTIVOS = /\b(?:\d{1,2}:\d{2}|\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|estadio\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+|sede\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+|\d+\s*(?:-\s*\d+|a\s+\d+)|grupo\s+[A-H]|ronda\s+\d+|fase\s+(?:de\s+)?grupos)\b/i;

const UTILIDAD_DEPORTIVA = /\b(?:fecha|hora|sede|estadio|ciudad|formato|clasificaci[oó]n|calendario|fixture|jornada|premios?|reglas?|reglamento|consecuencias?|impacto|c[oó]mo\s+ver|c[oó]mo\s+seguir|d[oó]nde\s+ver|transmisi[oó]n|entrada|boletos?|canales?|horario|quiniela|apuestas?|pr[oó]ximo\s+(?:partido|encuentro|jornada|compromiso))\b/i;

const FIGURAS_DEPORTIVAS = /\b(?:jugador|entrenador|director\s+t[eé]cnico|dt|capit[aá]n|goleador(?:a)?|figura|delantero|portero|arquero|mediocampista|defensa|pivot|base|alero)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+(?:de\s+(?:la|el|los|las)\s+)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2}|\b(?:goles?|anotaciones?|puntos?|victorias?|derrotas?)\s+de\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+|\bel\s+(?:jugador|delantero|goleador(?:a)?|figura|entrenador|capit[aá]n|portero)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/i;

const NOTA_EXPLICATIVA_O_HISTORICA = /\b(?:qu[eé]\s+(?:es|son)|c[oó]mo\s+(?:funciona|se\s+juega|se\s+disputa)|historia|cronolog[ií]a|origen|evoluci[oó]n|reglamento|reglas?|formato|sistema\s+de\s+competencia|todo\s+lo\s+que\s+debes\s+saber|gu[ií]a|explicamos)\b/i;

export function detectarFuenteOficialDeportes(n: NoticiaInput): boolean {
  const t = textoCompleto(n);
  return FUENTES_OFICIALES_DEPORTES.test(t) || LIGAS_EQUIPOS_RECONOCIDOS.test(t);
}

function detectarEventoDeInteresPublico(n: NoticiaInput): boolean {
  return EVENTOS_INTERES_PUBLICO.test(textoCompleto(n));
}

function detectarEvidenciaDeportiva(n: NoticiaInput): boolean {
  const t = textoCompleto(n);
  return EVIDENCIA_DEPORTIVA.test(t) && (/\d/.test(t) || DATOS_CONCRETOS_DEPORTIVOS.test(t));
}

function detectarUtilidadDeportiva(n: NoticiaInput): boolean {
  return UTILIDAD_DEPORTIVA.test(textoCompleto(n));
}

function detectarFigurasDeportivas(n: NoticiaInput): boolean {
  return FIGURAS_DEPORTIVAS.test(textoPlano(n));
}

function detectarCronologiaDeportiva(n: NoticiaInput): boolean {
  return detectoresValorAgregado.cronologia(n) || /\b(?:primera\s+jornada|segunda\s+jornada|primera\s+fecha|segunda\s+fecha|fecha\s+inaugural|fecha\s+final|inicialmente|posteriormente|luego|despu[eé]s|finalmente)\b/i.test(textoPlano(n));
}

function esNotaExplicativaOHistorica(n: NoticiaInput): boolean {
  return NOTA_EXPLICATIVA_O_HISTORICA.test(textoCompleto(n));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUGERENCIAS EDITORIALES ESPECÍFICAS PARA DEPORTES
// ═══════════════════════════════════════════════════════════════════════════════

function sugerenciasDeportes(n: NoticiaInput, _ev: EvidenciaPuntuada): SugerenciasV2 {
  const fuenteOficial = detectarFuenteOficialDeportes(n);
  const evidencia = detectarEvidenciaDeportiva(n);
  const utilidad = detectarUtilidadDeportiva(n);
  const cronologia = detectarCronologiaDeportiva(n);
  const figuras = detectarFigurasDeportivas(n);
  const explicativaOHistorica = esNotaExplicativaOHistorica(n);

  const oportunidades = [];

  if (!fuenteOficial) {
    oportunidades.push(fabricarSugerencia(
      'Citar la fuente oficial del dato: FIFA, UEFA, CONMEBOL, CONCACAF, COI, IFAB o la federación correspondiente.',
      'Credibilidad deportiva.',
      '10-20 min',
      'Baja',
      'Reduce rumores y refuerza autoridad.'
    ));
  } else {
    oportunidades.push(fabricarSugerencia(
      'Fuente deportiva oficial reconocida. Mantener la atribución clara y enlazar al comunicado o reglamento cuando sea posible.',
      'Autoridad.',
      '5-10 min',
      'Baja',
      'Refuerza EEAT de la pieza.'
    ));
  }

  if (!evidencia && !explicativaOHistorica) {
    oportunidades.push(fabricarSugerencia(
      'Incluir evidencia numérica: marcador, goles, puntos, posición en tabla, estadísticas o formato del torneo.',
      'Factualidad deportiva.',
      '10-20 min',
      'Baja',
      'Distingue la nota de rumores.'
    ));
  }

  if (!utilidad && !explicativaOHistorica) {
    oportunidades.push(fabricarSugerencia(
      'Explicitar la utilidad para el aficionado: fecha, hora, sede, clasificación, calendario o cómo seguir el evento.',
      'Servicio al lector.',
      '10-20 min',
      'Baja',
      'Fideliza al aficionado.'
    ));
  }

  if (!cronologia && !explicativaOHistorica) {
    oportunidades.push(fabricarSugerencia(
      'Ordenar cronológicamente la secuencia del evento: jornadas, fechas, rondas o momentos clave.',
      'Claridad narrativa.',
      '10-20 min',
      'Baja',
      'Mejora comprensión.'
    ));
  }

  if (!figuras && !explicativaOHistorica) {
    oportunidades.push(fabricarSugerencia(
      'Mencionar figuras relevantes: jugadores, entrenador, goleador o capitán con nombre y rol.',
      'Humaniza la crónica.',
      '5-15 min',
      'Baja',
      'Atracción del lector.'
    ));
  }

  return {
    oportunidadesEditoriales: oportunidades.slice(0, 5),
    comoConvertirReferencia: [
      fabricarSugerencia(
        'Comparar el dato con estadísticas históricas del mismo torneo, equipo o selección.',
        'Contexto histórico.',
        '30-60 min',
        'Media',
        'Diferenciación.'
      ),
      fabricarSugerencia(
        'Construir cronología del torneo o de la campaña de la selección nacional.',
        'Línea de tiempo.',
        '30-60 min',
        'Baja',
        'Comprensión.'
      ),
      fabricarSugerencia(
        'Actualizar resultados, clasificación o declaraciones oficiales posteriores.',
        'Vigencia.',
        '10-20 min',
        'Baja',
        'Mantiene la pieza útil.'
      ),
      fabricarSugerencia(
        'Agregar análisis táctico o de impacto en la clasificación de Nicaragua.',
        'Profundidad.',
        '30-60 min',
        'Media',
        'Autoridad editorial.'
      ),
    ],
    nivel10: [
      fabricarSugerencia(
        'Perfil estadístico del torneo o de la selección con datos oficiales de FIFA/CONCACAF.',
        'Análisis de fondo.',
        '2-4 días',
        'Alta',
        'Tráfico recurrente.'
      ),
      fabricarSugerencia(
        'Guía de calendario, horarios y canales para seguir la competencia en Nicaragua.',
        'Evergreen deportivo.',
        '1 día',
        'Baja',
        'Valor práctico.'
      ),
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CÁLCULO DE UTILIDAD Y CONSISTENCIA PARA DEPORTES
// ═══════════════════════════════════════════════════════════════════════════════

function calcularUtilidadDeportes(n: NoticiaInput, ev: EvidenciaPuntuada): number {
  let puntos = 30; // base por interés deportivo
  if (detectarEventoDeInteresPublico(n)) puntos += 25;
  if (detectarFuenteOficialDeportes(n)) puntos += 20;
  if (detectarEvidenciaDeportiva(n)) puntos += 15;
  if (detectarUtilidadDeportiva(n)) puntos += 15;
  if (detectarFigurasDeportivas(n)) puntos += 10;
  if (detectarCronologiaDeportiva(n)) puntos += 10;
  if (esNotaExplicativaOHistorica(n)) puntos += 10;
  return Math.max(ev.utilidad, Math.min(100, puntos));
}

function consistenciaDeportes(n: NoticiaInput, ev: EvidenciaPuntuada): string[] {
  const faltantes: string[] = [];
  const explicativaOHistorica = esNotaExplicativaOHistorica(n);

  if (!detectarFuenteOficialDeportes(n) && ev.fuenteIdentificada < 60) {
    faltantes.push('faltó fuente oficial deportiva');
  }

  if (!explicativaOHistorica) {
    if (!detectarEvidenciaDeportiva(n)) faltantes.push('faltó evidencia deportiva numérica');
    if (!detectarCronologiaDeportiva(n)) faltantes.push('faltó cronología o secuencia del evento');
    if (!detectarUtilidadDeportiva(n) && !detectarEventoDeInteresPublico(n)) {
      faltantes.push('faltó utilidad para el aficionado');
    }
  }

  if (faltantes.length === 0 && detectarEventoDeInteresPublico(n) && detectarFuenteOficialDeportes(n)) {
    return [];
  }

  return faltantes;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIÓN PÚBLICA DE EVALUACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

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

