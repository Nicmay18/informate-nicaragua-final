/**
 * Reader Journey Engine
 * =====================
 * MENI v7: El sello de Nicaragua Informate — "aquí sí explican la noticia".
 *
 * No es lo mismo informar que enseñar.
 *
 * El engine mapea 4 estados del lector:
 * 1. ¿Qué sabe? — conocimiento previo asumido del lector nicaragüense promedio
 * 2. ¿Qué necesita saber? — brechas de conocimiento para entender el hecho
 * 3. ¿Qué entenderá? — lo que el artículo debe lograr que comprenda
 * 4. ¿Qué recordará? — el takeaway que se queda después de leer
 *
 * Esto transforma el artículo de "relato de hechos" a "experiencia de aprendizaje".
 */

import type { ReaderJourneyInput, ReaderJourneyResult } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

type TipoHecho = 'operativo' | 'accidente' | 'homicidio' | 'incendio' | 'salud' | 'economia' | 'politica' | 'internacional' | 'deporte' | 'desastre' | 'educacion' | 'general';

function detectarTipo(texto: string): TipoHecho {
  const t = texto.toLowerCase();
  if (/coca[ií]na|droga|narcot|decomiso|kilos?.*(ocup|decom|incaut)/i.test(t)) return 'operativo';
  if (/accidente|choque|colisi[oó]n|volcadura|atropello/i.test(t)) return 'accidente';
  if (/homicidio|asesinato|muerte violenta|balacera/i.test(t)) return 'homicidio';
  if (/incendio|fuego|siniestro/i.test(t)) return 'incendio';
  if (/dengue|malaria|covid|salud|epidemia|brote|intoxicaci[oó]n/i.test(t)) return 'salud';
  if (/precio|inflaci[oó]n|salario|econom[ií]a|d[oó]lar/i.test(t)) return 'economia';
  if (/pol[ií]tica|gobierno|asamblea|reforma|decreto/i.test(t)) return 'politica';
  if (/internacional|onu|ue|estados unidos|russia|china/i.test(t)) return 'internacional';
  if (/deporte|f[uú]tbol|b[eé]isbol|campeonato/i.test(t)) return 'deporte';
  if (/inundaci[oó]n|deslave|tormenta|terremoto|hurac[aá]n/i.test(t)) return 'desastre';
  if (/educaci[oó]n|colegio|universidad/i.test(t)) return 'educacion';
  return 'general';
}

const JOURNEYS: Record<TipoHecho, {
  queSabe: string[];
  queNecesitaSaber: string[];
  queEntendera: string[];
  queRecordara: string[];
  objetivoPedagogico: string;
}> = {
  operativo: {
    queSabe: [
      'Nicaragua es país de tránsito de drogas en Centroamérica',
      'La Policía Nacional realiza operativos antidrogas',
    ],
    queNecesitaSaber: [
      'Qué cantidad fue decomisada y qué representa',
      'Dónde y cómo ocurrió el operativo',
      'Si hay detenidos y su situación legal',
      'Cómo se compara con decomisos anteriores',
      'Por qué este operativo importa para la seguridad',
    ],
    queEntendera: [
      'La magnitud del decomiso en contexto nacional',
      'El rol de Nicaragua en la ruta del narcotráfico',
      'El proceso legal que sigue a un decomiso',
      'El impacto en la seguridad ciudadana',
    ],
    queRecordara: [
      'La cantidad específica decomisada',
      'Que Nicaragua es ruta de tránsito de drogas',
      'Que el decomiso refleja actividad del narcotráfico, no solo éxito policial',
    ],
    objetivoPedagogico: 'Que el lector entienda qué representa el decomiso en el contexto del narcotráfico regional, no que celebre un "golpe" policial.',
  },
  accidente: {
    queSabe: [
      'Los accidentes de tránsito son frecuentes en Nicaragua',
      'Las carreteras nicaragüenses tienen puntos peligrosos',
    ],
    queNecesitaSaber: [
      'Qué ocurrió exactamente y dónde',
      'Estado de las víctimas',
      'Causas probables del accidente',
      'Antecedentes de accidentes en ese punto',
      'Qué dice la Ley 431 sobre seguridad vial',
    ],
    queEntendera: [
      'Por qué ese punto de la vía es peligroso',
      'Qué factores contribuyen a los accidentes en Nicaragua',
      'Cómo prevenir accidentes similares',
    ],
    queRecordara: [
      'El lugar del accidente como punto peligroso',
      'Las causas más comunes de accidentes',
      'Medidas de prevención vial',
    ],
    objetivoPedagogico: 'Que el lector aprenda sobre seguridad vial y prevención, no solo que se entere del accidente.',
  },
  homicidio: {
    queSabe: [
      'Existe violencia en ciertas zonas del país',
      'La Policía investiga los homicidios',
    ],
    queNecesitaSaber: [
      'Qué ocurrió, sin detalles morbosos',
      'Si hay detenidos o investigación abierta',
      'Contexto de seguridad en la zona',
      'Qué protections legales existen para víctimas',
    ],
    queEntendera: [
      'El contexto de seguridad sin alarma innecesaria',
      'El proceso de investigación penal',
      'El impacto en la comunidad',
    ],
    queRecordara: [
      'El hecho sin morbo',
      'El estado de la investigación',
      'El contexto de seguridad de la zona',
    ],
    objetivoPedagogico: 'Que el lector entienda el hecho en contexto, sin alarmarse ni consumir morbo.',
  },
  incendio: {
    queSabe: [
      'Los incendios pueden ocurrir por diversas causas',
      'Los bomberos responden a emergencias',
    ],
    queNecesitaSaber: [
      'Qué ardió y dónde',
      'Si hay víctimas o pérdidas',
      'Cómo fue controlado',
      'Cómo prevenir este tipo de siniestros',
    ],
    queEntendera: [
      'Las causas más comunes de incendios',
      'Cómo funciona la respuesta de emergencia',
      'Medidas de prevención',
    ],
    queRecordara: [
      'El hecho principal',
      'Medidas de prevención de incendios',
      'Qué hacer en caso de emergencia similar',
    ],
    objetivoPedagogico: 'Que el lector aprenda prevención y respuesta ante incendios.',
  },
  salud: {
    queSabe: [
      'Las enfermedades son parte de la vida cotidiana',
      'MINSA es la autoridad de salud',
    ],
    queNecesitaSaber: [
      'Qué enfermedad o problema es',
      'Cuántos casos hay y dónde',
      'Cómo se transmite',
      'Cuáles son los síntomas',
      'Cómo prevenir',
      'Dónde atenderse',
    ],
    queEntendera: [
      'Cómo se transmite la enfermedad',
      'Cómo protegerse y a su familia',
      'El contexto epidemiológico nacional',
    ],
    queRecordara: [
      'Cómo prevenir la enfermedad',
      'Dónde acudir si tiene síntomas',
      'Los síntomas principales',
    ],
    objetivoPedagogico: 'Que el lector aprenda a protegerse, no que se alarme.',
  },
  economia: {
    queSabe: [
      'Los precios de productos cambian',
      'El dólar y el córdoba son las monedas principales',
    ],
    queNecesitaSaber: [
      'Qué cambió y cuánto',
      'Por qué cambió',
      'Cómo afecta su presupuesto familiar',
      'Qué productos se ven afectados',
      'Contexto económico nacional',
    ],
    queEntendera: [
      'El impacto real en su bolsillo',
      'Los factores que influyen en precios',
      'El contexto económico del país',
    ],
    queRecordara: [
      'El cambio específico que le afecta',
      'Cómo ajustar su presupuesto',
      'El contexto económico',
    ],
    objetivoPedagogico: 'Que el lector entienda cómo el cambio económico le afecta directamente.',
  },
  politica: {
    queSabe: [
      'El gobierno toma decisiones que afectan al país',
      'La Asamblea Nacional aprueba leyes',
    ],
    queNecesitaSaber: [
      'Qué decisión se tomó',
      'Quién la tomó y por qué',
      'Cómo le afecta directamente',
      'Desde cuándo aplica',
      'Qué cambia con esta decisión',
    ],
    queEntendera: [
      'El impacto concreto en su vida',
      'El marco legal o institucional',
      'El contexto político',
    ],
    queRecordara: [
      'La decisión y su impacto directo',
      'Desde cuándo aplica',
      'Qué cambia para él',
    ],
    objetivoPedagogico: 'Que el lector entienda cómo la decisión política le afecta, sin tomar partido.',
  },
  internacional: {
    queSabe: [
      'Hay eventos en otros países que pueden afectar a Nicaragua',
      'Nicaragua tiene relaciones con otros países',
    ],
    queNecesitaSaber: [
      'Qué ocurrió en el exterior',
      'Por qué importa para Nicaragua',
      'Si hay nicaragüenses afectados',
      'Contexto internacional necesario',
    ],
    queEntendera: [
      'La conexión entre el hecho internacional y Nicaragua',
      'El contexto internacional',
      'Posibles efectos indirectos',
    ],
    queRecordara: [
      'El hecho internacional principal',
      'Su conexión con Nicaragua',
      'Por qué le importa',
    ],
    objetivoPedagogico: 'Que el lector entienda por qué un hecho internacional le afecta o le interesa.',
  },
  deporte: {
    queSabe: [
      'Nicaragua tiene equipos y selecciones en various deportes',
      'El béisbol y el fútbol son los deportes más seguidos',
    ],
    queNecesitaSaber: [
      'El resultado',
      'Quiénes jugaron',
      'Qué significa para el equipo o selección',
      'Contexto del torneo',
    ],
    queEntendera: [
      'El contexto deportivo del resultado',
      'La posición del equipo',
      'Qué viene para el equipo',
    ],
    queRecordara: [
      'El resultado',
      'La figura del partido',
      'Qué viene para el equipo',
    ],
    objetivoPedagogico: 'Que el lector entienda el contexto deportivo, no solo el resultado.',
  },
  desastre: {
    queSabe: [
      'Nicaragua es vulnerable a desastres naturales',
      'SINAPRED coordina la respuesta a emergencias',
    ],
    queNecesitaSaber: [
      'Qué ocurrió y qué zonas afectó',
      'Cuántas personas/familias afectadas',
      'Qué deben hacer los habitantes',
      'Dónde están los albergues o puntos de evacuación',
      'Qué dijeron las autoridades',
    ],
    queEntendera: [
      'La vulnerabilidad de Nicaragua a desastres',
      'Qué medidas tomar para protegerse',
      'El rol de SINAPRED y autoridades',
    ],
    queRecordara: [
      'Qué hacer en caso de desastre',
      'Dónde están los puntos de evacuación',
      'La vulnerabilidad de Nicaragua',
    ],
    objetivoPedagogico: 'Que el lector aprenda a protegerse ante desastres naturales.',
  },
  educacion: {
    queSabe: [
      'La educación es un tema importante para las familias',
      'MINED es la autoridad educativa',
    ],
    queNecesitaSaber: [
      'Qué ocurrió en educación',
      'A quiénes afecta',
      'Desde cuándo aplica',
      'Qué dijo MINED',
    ],
    queEntendera: [
      'El impacto en estudiantes y familias',
      'El contexto del sistema educativo',
    ],
    queRecordara: [
      'El cambio educativo',
      'Cómo afecta a su familia',
    ],
    objetivoPedagogico: 'Que el lector entienda el impacto educativo en la comunidad escolar.',
  },
  general: {
    queSabe: [
      'El lector conoce su entorno cotidiano',
    ],
    queNecesitaSaber: [
      'Qué ocurrió',
      'Por qué es importante',
      'Qué contexto necesita',
      'Cómo le afecta',
    ],
    queEntendera: [
      'El hecho y su contexto',
      'El impacto para el lector',
    ],
    queRecordara: [
      'El hecho principal',
      'Por qué importa',
    ],
    objetivoPedagogico: 'Que el lector entienda el hecho y por qué le importa.',
  },
};

function computeScore(queSabe: string[], queNecesitaSaber: string[], queEntendera: string[], queRecordara: string[]): number {
  let score = 40;
  if (queSabe.length >= 2) score += 10;
  if (queNecesitaSaber.length >= 4) score += 20;
  if (queEntendera.length >= 3) score += 15;
  if (queRecordara.length >= 2) score += 15;
  return Math.min(score, 100);
}

export function runReaderJourney(input: ReaderJourneyInput): ReaderJourneyResult {
  const textoPlano = stripHtml(`${input.titulo} ${input.contenido}`);
  const tipo = detectarTipo(textoPlano);
  const journey = JOURNEYS[tipo];

  const queSabe = journey.queSabe;
  const queNecesitaSaber = journey.queNecesitaSaber;
  const queEntendera = journey.queEntendera;
  const queRecordara = journey.queRecordara;

  const brechaDeConocimiento = queNecesitaSaber.filter(
    (n) => !queSabe.some((s) => n.toLowerCase().includes(s.toLowerCase().split(' ')[0])),
  );

  const score = computeScore(queSabe, queNecesitaSaber, queEntendera, queRecordara);

  return {
    queSabe,
    queNecesitaSaber,
    queEntendera,
    queRecordara,
    brechaDeConocimiento,
    objetivoPedagogico: journey.objetivoPedagogico,
    score,
  };
}
