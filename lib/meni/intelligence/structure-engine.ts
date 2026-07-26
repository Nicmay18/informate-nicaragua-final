/**
 * Structure Engine — Decide el orden de la noticia según su tipo.
 * No usa plantillas. Decide dinámicamente qué va primero.
 */

import type { IntelligenceEngineInput, StructureDecision, StructureBlock } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

type TipoHecho = 'accidente' | 'incendio' | 'homicidio' | 'detencion' | 'economia' | 'salud' | 'politica' | 'deporte' | 'general';

function detectarTipoHecho(texto: string): TipoHecho {
  const t = texto.toLowerCase();
  if (/accidente|choque|colisión|volcadura|atropello|fallecido.*vía|vía.*fallecido/i.test(t)) return 'accidente';
  if (/incendio|fuego|siniestro|conflagración/i.test(t)) return 'incendio';
  if (/homicidio|asesinato|muerte violenta|ejecutado|balacera/i.test(t)) return 'homicidio';
  if (/detención|arresto|captura|aprehensión|imputación/i.test(t)) return 'detencion';
  if (/precio|inflación|salario|economía|exportación|importación|córdoba|dólar/i.test(t)) return 'economia';
  if (/dengue|malaria|covid|salud|hospital|clínica|vacuna|epidemia/i.test(t)) return 'salud';
  if (/política|gobierno|asamblea|partido|elección|reforma|decreto/i.test(t)) return 'politica';
  if (/deporte|fútbol|beisbol|boxeo|campeonato|selección|liga/i.test(t)) return 'deporte';
  return 'general';
}

const ESTRUCTURAS: Record<TipoHecho, { tipo: string; prioridad: number }[]> = {
  accidente: [
    { tipo: 'hecho', prioridad: 1 },
    { tipo: 'víctimas', prioridad: 2 },
    { tipo: 'autoridades', prioridad: 3 },
    { tipo: 'contexto_vial', prioridad: 4 },
    { tipo: 'investigación', prioridad: 5 },
  ],
  incendio: [
    { tipo: 'hecho', prioridad: 1 },
    { tipo: 'afectación', prioridad: 2 },
    { tipo: 'respuesta_bomberos', prioridad: 3 },
    { tipo: 'causa_probable', prioridad: 4 },
    { tipo: 'estado_actual', prioridad: 5 },
  ],
  homicidio: [
    { tipo: 'hecho', prioridad: 1 },
    { tipo: 'víctima', prioridad: 2 },
    { tipo: 'circunstancias', prioridad: 3 },
    { tipo: 'investigación', prioridad: 4 },
    { tipo: 'contexto_seguridad', prioridad: 5 },
  ],
  detencion: [
    { tipo: 'hecho', prioridad: 1 },
    { tipo: 'cargos', prioridad: 2 },
    { tipo: 'autoridades', prioridad: 3 },
    { tipo: 'contexto_legal', prioridad: 4 },
  ],
  economia: [
    { tipo: 'hecho', prioridad: 1 },
    { tipo: 'cifras', prioridad: 2 },
    { tipo: 'impacto_consumidor', prioridad: 3 },
    { tipo: 'contexto_económico', prioridad: 4 },
  ],
  salud: [
    { tipo: 'hecho', prioridad: 1 },
    { tipo: 'datos_epidemiológicos', prioridad: 2 },
    { tipo: 'recomendaciones', prioridad: 3 },
    { tipo: 'contexto_salud', prioridad: 4 },
  ],
  politica: [
    { tipo: 'hecho', prioridad: 1 },
    { tipo: 'actor_principal', prioridad: 2 },
    { tipo: 'implicaciones', prioridad: 3 },
    { tipo: 'contexto_político', prioridad: 4 },
  ],
  deporte: [
    { tipo: 'resultado', prioridad: 1 },
    { tipo: 'protagonista', prioridad: 2 },
    { tipo: 'contexto_deportivo', prioridad: 3 },
    { tipo: 'próxima_fecha', prioridad: 4 },
  ],
  general: [
    { tipo: 'hecho', prioridad: 1 },
    { tipo: 'contexto', prioridad: 2 },
    { tipo: 'impacto', prioridad: 3 },
    { tipo: 'antecedentes', prioridad: 4 },
  ],
};

const DESCRIPCIONES_BLOQUE: Record<string, string> = {
  hecho: 'Qué ocurrió, cuándo y dónde (lead)',
  víctimas: 'Estado de víctimas, heridos o fallecidos',
  autoridades: 'Declaración o acción de autoridades competentes',
  contexto_vial: 'Estado de la vía, antecedentes de accidentes en la zona',
  investigación: 'Estado de la investigación, diligencias en curso',
  afectación: 'Daños materiales, locales afectados, personas impactadas',
  respuesta_bomberos: 'Tiempo de respuesta, unidades desplegadas, control del siniestro',
  causa_probable: 'Hipótesis sobre el origen, investigaciones en curso',
  estado_actual: 'Situación del lugar tras el evento',
  circunstancias: 'Cómo ocurrieron los hechos sin exponer detalles sensibles',
  contexto_seguridad: 'Antecedentes de seguridad en la zona',
  cargos: 'Imputaciones, delitos, proceso legal',
  contexto_legal: 'Marco legal aplicable, próximos pasos judiciales',
  cifras: 'Datos cuantificables: montos, porcentajes, variaciones',
  impacto_consumidor: 'Cómo afecta al bolsillo o vida del ciudadano',
  contexto_económico: 'Situación económica nacional relevante',
  datos_epidemiológicos: 'Cifras de casos, tasa de incidencia, tendencia',
  recomendaciones: 'Medidas preventivas o recomendaciones de salud',
  contexto_salud: 'Situación del sistema de salud o brotes previos',
  actor_principal: 'Quién tomó la decisión o emitió la declaración',
  implicaciones: 'Qué significa para el ciudadano o el país',
  contexto_político: 'Antecedentes políticos relevantes',
  resultado: 'Marcador, clasificación o outcome deportivo',
  protagonista: 'Jugador, atleta o equipo destacado',
  contexto_deportivo: 'Posición en tabla, racha, antecedentes del enfrentamiento',
  próxima_fecha: 'Próximo compromiso o calendario',
  contexto: 'Información que ayuda a entender el hecho',
  impacto: 'Cómo afecta al lector o a la comunidad',
  antecedentes: 'Hechos previos relacionados',
};

function buildBloques(tipo: TipoHecho): StructureBlock[] {
  const estructura = ESTRUCTURAS[tipo];
  return estructura.map((e) => ({
    tipo: e.tipo,
    contenido: DESCRIPCIONES_BLOQUE[e.tipo] || e.tipo,
    prioridad: e.prioridad,
  }));
}

function computeScore(bloques: StructureBlock[], texto: string): number {
  let score = 50;
  const parrafos = stripHtml(texto).split(/\.\s+/).filter((s) => s.trim().length > 30);
  if (parrafos.length >= bloques.length) score += 20;
  if (/<h2/i.test(texto)) score += 15;
  if (/<strong/i.test(texto)) score += 10;
  if (bloques.length >= 4) score += 5;
  return Math.min(score, 100);
}

export function runStructureEngine(input: IntelligenceEngineInput): StructureDecision {
  const textoPlano = stripHtml(`${input.titulo} ${input.contenido}`);
  const tipo = detectarTipoHecho(textoPlano);
  const bloques = buildBloques(tipo);
  const orden = bloques.map((b) => b.tipo);
  const razonOrden = `Estructura para tipo "${tipo}": ${orden.join(' → ')}`;
  const score = computeScore(bloques, input.contenido);

  return { bloques, orden, razonOrden, score };
}
