/**
 * Story Completeness Engine
 * =========================
 * ¿La historia quedó cerrada?
 * ¿Falta una respuesta? ¿Quedó una duda? ¿Falta contexto?
 */

import type { EditorialBrainInput, StoryCompletenessDecision } from './types';
import type { ReaderQuestionsDecision } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectarRespuestasFaltantes(texto: string, preguntas: ReaderQuestionsDecision): string[] {
  const t = texto.toLowerCase();
  const faltantes: string[] = [];
  for (const p of preguntas.preguntasObligatorias) {
    const palabrasClave = p.toLowerCase()
      .replace(/[¿?]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4);
    const encontradas = palabrasClave.filter(w => t.includes(w)).length;
    if (encontradas < Math.ceil(palabrasClave.length * 0.3)) {
      faltantes.push(p);
    }
  }
  return faltantes;
}

function perfilEs(contexto: string | undefined, perfiles: Set<string>): boolean {
  const c = (contexto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return perfiles.has(c);
}

function detectarContextoFaltante(texto: string, categoria?: string): string[] {
  const t = texto.toLowerCase();
  const faltantes: string[] = [];
  const esTurismoOcio = perfilEs(categoria, new Set(['turismo', 'cultura', 'espectaculos', 'espectáculos', 'deportes']));

  if (/accidente|choque/i.test(t) && !/velocidad|causa|imprudencia|vía/i.test(t)) {
    faltantes.push('Causa probable del accidente');
  }
  if (/muerte|fallecido/i.test(t) && !/causa|investigación|autopsia/i.test(t)) {
    faltantes.push('Causa de muerte e investigación');
  }
  if (/detención|captura/i.test(t) && !/cargo|delito|proceso|judicial/i.test(t)) {
    faltantes.push('Cargos y proceso legal');
  }
  // REGLA 2.1.1: no exigir cifras de variación a notas que no son de economia
  if (!esTurismoOcio && /precio|inflación|salario/i.test(t) && !/porcentaje|cantidad|córdoba|dólar/i.test(t)) {
    faltantes.push('Cifras concretas del cambio económico');
  }
  if (/salud|dengue|covid/i.test(t) && !/síntoma|prevención|contagio/i.test(t)) {
    faltantes.push('Síntomas y prevención');
  }
  if (/inundación|deslave/i.test(t) && !/familia|afectados|albergue|evacuar/i.test(t)) {
    faltantes.push('Número de afectados y medidas de emergencia');
  }
  return faltantes;
}

function detectarDudasPendientes(texto: string): string[] {
  const t = texto.toLowerCase();
  const dudas: string[] = [];
  if (/se investiga|investigación en curso|no se descarta/i.test(t)) {
    dudas.push('La investigación sigue abierta: ¿qué se espera resolver?');
  }
  if (/autoridades no|no proporcionaron|no se han pronunciado/i.test(t)) {
    dudas.push('Falta pronunciamiento de autoridades');
  }
  if (/no se sabe|se desconoce|es incierto/i.test(t)) {
    dudas.push('Hay información que se desconoce: ¿se buscará?');
  }
  return dudas;
}

export function runStoryCompletenessEngine(
  input: EditorialBrainInput,
  readerQuestions?: ReaderQuestionsDecision,
): StoryCompletenessDecision {
  const texto = stripHtml(`${input.titulo} ${input.contenido}`);

  const respuestasFaltantes = readerQuestions
    ? detectarRespuestasFaltantes(texto, readerQuestions)
    : [];
  const contextoFaltante = detectarContextoFaltante(texto, input.perfil || input.categoria);
  const dudasPendientes = detectarDudasPendientes(texto);

  const totalFaltantes = respuestasFaltantes.length + contextoFaltante.length + dudasPendientes.length;
  const cerrada = totalFaltantes === 0;

  let score = 100;
  score -= respuestasFaltantes.length * 10;
  score -= contextoFaltante.length * 8;
  score -= dudasPendientes.length * 5;
  score = Math.max(0, Math.min(score, 100));

  return { cerrada, respuestasFaltantes, contextoFaltante, dudasPendientes, score };
}
