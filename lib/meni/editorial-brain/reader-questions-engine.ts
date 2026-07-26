/**
 * Reader Questions Engine
 * =======================
 * Detecta automáticamente las preguntas que tendrá el lector
 * según el tipo de hecho. No analiza texto generado.
 * Analiza el HECHO y genera preguntas obligatorias.
 */

import type { EditorialBrainInput, ReaderQuestionsDecision, ReaderQuestion } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

type TipoHecho = 'accidente' | 'muerte' | 'delito' | 'siniestro' | 'economia' | 'salud' | 'politica' | 'deporte' | 'desastre' | 'internacional' | 'educacion' | 'general';

function detectarTipo(texto: string): TipoHecho {
  const t = texto.toLowerCase();
  if (/muerte|fallecido|muerto|asesinato|homicidio/i.test(t)) return 'muerte';
  if (/accidente|choque|colisión|volcadura|atropello/i.test(t)) return 'accidente';
  if (/detención|captura|allanamiento|operativo/i.test(t)) return 'delito';
  if (/incendio|siniestro|conato/i.test(t)) return 'siniestro';
  if (/precio|inflación|salario|economía|dólar/i.test(t)) return 'economia';
  if (/salud|dengue|covid|virus|epidemia/i.test(t)) return 'salud';
  if (/política|gobierno|asamblea|reforma/i.test(t)) return 'politica';
  if (/deporte|fútbol|baseball|selección/i.test(t)) return 'deporte';
  if (/inundación|deslave|lluvia|tormenta|terremoto/i.test(t)) return 'desastre';
  if (/internacional|estados unidos|onu|ue/i.test(t)) return 'internacional';
  if (/educación|colegio|universidad/i.test(t)) return 'educacion';
  return 'general';
}

const PREGUNTAS_POR_TIPO: Record<TipoHecho, { pregunta: string; obligatoria: boolean }[]> = {
  accidente: [
    { pregunta: '¿Quién o quiénes resultaron afectados?', obligatoria: true },
    { pregunta: '¿Dónde ocurrió exactamente el accidente?', obligatoria: true },
    { pregunta: '¿Cómo ocurrió el accidente?', obligatoria: true },
    { pregunta: '¿Por qué ocurrió? ¿Cuál fue la causa?', obligatoria: true },
    { pregunta: '¿Cuál es el estado de las víctimas?', obligatoria: true },
    { pregunta: '¿Qué dijeron las autoridades (Policía, bomberos)?', obligatoria: true },
    { pregunta: '¿Hay afectaciones en el tráfico o la vía?', obligatoria: false },
    { pregunta: '¿Hay investigación abierta?', obligatoria: false },
    { pregunta: '¿Hay antecedentes de accidentes en este punto?', obligatoria: false },
    { pregunta: '¿Cómo se puede prevenir este tipo de accidentes?', obligatoria: false },
  ],
  muerte: [
    { pregunta: '¿Quién falleció?', obligatoria: true },
    { pregunta: '¿Dónde y cuándo ocurrió?', obligatoria: true },
    { pregunta: '¿Cuál fue la causa de muerte?', obligatoria: true },
    { pregunta: '¿Hay responsables o detenidos?', obligatoria: true },
    { pregunta: '¿Qué dicen las autoridades?', obligatoria: true },
    { pregunta: '¿Hay antecedentes o contexto relevante?', obligatoria: false },
    { pregunta: '¿Qué pasa ahora con la investigación?', obligatoria: false },
    { pregunta: '¿Cómo protege la ley a las víctimas?', obligatoria: false },
  ],
  delito: [
    { pregunta: '¿Qué delito se cometió?', obligatoria: true },
    { pregunta: '¿Quién fue detenido?', obligatoria: true },
    { pregunta: '¿Dónde ocurrió?', obligatoria: true },
    { pregunta: '¿Cuáles son los cargos?', obligatoria: true },
    { pregunta: '¿Qué sigue en el proceso legal?', obligatoria: true },
    { pregunta: '¿Hay antecedentes del detenido?', obligatoria: false },
    { pregunta: '¿Qué derechos tiene el detenido?', obligatoria: false },
    { pregunta: '¿Cómo está la seguridad en la zona?', obligatoria: false },
  ],
  siniestro: [
    { pregunta: '¿Qué ocurrió exactamente?', obligatoria: true },
    { pregunta: '¿Dónde fue el siniestro?', obligatoria: true },
    { pregunta: '¿Hay víctimas o heridos?', obligatoria: true },
    { pregunta: '¿Cómo fue controlado?', obligatoria: true },
    { pregunta: '¿Qué dijeron los bomberos?', obligatoria: true },
    { pregunta: '¿Cuál fue la causa probable?', obligatoria: false },
    { pregunta: '¿Hay pérdidas materiales?', obligatoria: false },
    { pregunta: '¿Cómo prevenir este tipo de siniestros?', obligatoria: false },
  ],
  economia: [
    { pregunta: '¿Qué cambió en los precios o la economía?', obligatoria: true },
    { pregunta: '¿Cuánto subió o bajó?', obligatoria: true },
    { pregunta: '¿Cómo afecta al bolsillo del nicaragüense?', obligatoria: true },
    { pregunta: '¿Desde cuándo aplica?', obligatoria: true },
    { pregunta: '¿Qué productos o servicios se ven afectados?', obligatoria: true },
    { pregunta: '¿Hay comparación con meses o años anteriores?', obligatoria: false },
    { pregunta: '¿Qué pueden hacer los ciudadanos?', obligatoria: false },
    { pregunta: '¿Qué dijeron expertos o autoridades?', obligatoria: false },
  ],
  salud: [
    { pregunta: '¿Qué enfermedad o problema de salud es?', obligatoria: true },
    { pregunta: '¿Cuántos casos hay?', obligatoria: true },
    { pregunta: '¿Dónde se están reportando los casos?', obligatoria: true },
    { pregunta: '¿Cómo se contagia o transmite?', obligatoria: true },
    { pregunta: '¿Cuáles son los síntomas?', obligatoria: true },
    { pregunta: '¿Cómo se puede prevenir?', obligatoria: true },
    { pregunta: '¿Dónde pueden atenderse los afectados?', obligatoria: true },
    { pregunta: '¿Qué dijo MINSA o las autoridades de salud?', obligatoria: true },
    { pregunta: '¿Hay antecedentes de brotes similares?', obligatoria: false },
    { pregunta: '¿Hay alguna alerta o recomendación oficial?', obligatoria: false },
  ],
  politica: [
    { pregunta: '¿Qué decisión o hecho político ocurrió?', obligatoria: true },
    { pregunta: '¿Quién lo tomó o anunció?', obligatoria: true },
    { pregunta: '¿Cómo afecta directamente al ciudadano?', obligatoria: true },
    { pregunta: '¿Qué cambia con esta decisión?', obligatoria: true },
    { pregunta: '¿Desde cuándo aplica?', obligatoria: true },
    { pregunta: '¿Qué dijeron sectores afectados u oposición?', obligatoria: false },
    { pregunta: '¿Hay antecedentes de decisiones similares?', obligatoria: false },
    { pregunta: '¿Qué podría pasar después?', obligatoria: false },
  ],
  deporte: [
    { pregunta: '¿Cuál fue el resultado?', obligatoria: true },
    { pregunta: '¿Quiénes jugaron?', obligatoria: true },
    { pregunta: '¿Dónde y cuándo fue el partido o evento?', obligatoria: true },
    { pregunta: '¿Qué significa este resultado para el equipo?', obligatoria: true },
    { pregunta: '¿Qué viene ahora para el equipo o selección?', obligatoria: true },
    { pregunta: '¿Hubo figuras destacadas?', obligatoria: false },
    { pregunta: '¿Cómo va el equipo en la tabla o torneo?', obligatoria: false },
    { pregunta: '¿Hay antecedentes entre estos equipos?', obligatoria: false },
  ],
  desastre: [
    { pregunta: '¿Qué ocurrió?', obligatoria: true },
    { pregunta: '¿Qué zonas fueron afectadas?', obligatoria: true },
    { pregunta: '¿Cuántas personas o familias afectadas?', obligatoria: true },
    { pregunta: '¿Qué dijeron las autoridades (SINAPRED, MARENA)?', obligatoria: true },
    { pregunta: '¿Qué deben hacer los habitantes?', obligatoria: true },
    { pregunta: '¿Hay albergues o puntos de evacuación?', obligatoria: true },
    { pregunta: '¿Hay antecedentes de desastres similares?', obligatoria: false },
    { pregunta: '¿Cómo prevenir o prepararse?', obligatoria: false },
  ],
  internacional: [
    { pregunta: '¿Qué ocurrió en el exterior?', obligatoria: true },
    { pregunta: '¿Dónde y cuándo?', obligatoria: true },
    { pregunta: '¿Por qué importa para Nicaragua o los nicaragüenses?', obligatoria: true },
    { pregunta: '¿Cómo nos afecta directa o indirectamente?', obligatoria: true },
    { pregunta: '¿Qué dijeron autoridades locales o internacionales?', obligatoria: false },
    { pregunta: '¿Hay nicaragüenses afectados?', obligatoria: false },
    { pregunta: '¿Qué podría pasar después?', obligatoria: false },
  ],
  educacion: [
    { pregunta: '¿Qué ocurrió en educación?', obligatoria: true },
    { pregunta: '¿A quiénes afecta (estudiantes, maestros, padres)?', obligatoria: true },
    { pregunta: '¿Desde cuándo aplica?', obligatoria: true },
    { pregunta: '¿Qué dijeron las autoridades del MINED?', obligatoria: true },
    { pregunta: '¿Cómo afecta a los estudiantes?', obligatoria: true },
    { pregunta: '¿Qué pueden hacer los padres?', obligatoria: false },
    { pregunta: '¿Hay antecedentes?', obligatoria: false },
  ],
  general: [
    { pregunta: '¿Qué ocurrió?', obligatoria: true },
    { pregunta: '¿Dónde y cuándo?', obligatoria: true },
    { pregunta: '¿Quién está involucrado?', obligatoria: true },
    { pregunta: '¿Por qué es importante para el lector?', obligatoria: true },
    { pregunta: '¿Qué contexto necesita el lector?', obligatoria: false },
    { pregunta: '¿Qué sigue ahora?', obligatoria: false },
  ],
};

export function runReaderQuestionsEngine(input: EditorialBrainInput): ReaderQuestionsDecision {
  const texto = stripHtml(`${input.titulo} ${input.contenido}`);
  const tipo = detectarTipo(texto);
  const plantilla = PREGUNTAS_POR_TIPO[tipo] ?? PREGUNTAS_POR_TIPO.general;

  const preguntas: ReaderQuestion[] = plantilla.map(p => ({
    pregunta: p.pregunta,
    obligatoria: p.obligatoria,
    respondida: false,
  }));

  const preguntasObligatorias = preguntas.filter(p => p.obligatoria).map(p => p.pregunta);
  const preguntasOpcionales = preguntas.filter(p => !p.obligatoria).map(p => p.pregunta);

  const score = Math.min(60 + preguntasObligatorias.length * 5, 100);

  return { preguntas, preguntasObligatorias, preguntasOpcionales, score };
}
