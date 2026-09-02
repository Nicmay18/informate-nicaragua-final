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

type StoryType =
  | 'comercial'
  | 'accidente'
  | 'muerte'
  | 'delito'
  | 'precios'
  | 'salud'
  | 'desastre'
  | 'general';

function detectarTipoNoticia(texto: string): StoryType {
  const t = texto.toLowerCase();
  // Comercial / apertura de empresa: sucursal, franquicia, restaurante, marca, menú, promociones
  if (/\b(apertura|inaugura|abre su|abrió su|nueva sucursal|tercera sucursal|franquicia|restaurante|comida rápida|menú|promociones?|descuentos?|marca|cadena)\b/i.test(t)) return 'comercial';
  if (/\b(accidente|choque|colisión|volcadura|atropello)\b/i.test(t)) return 'accidente';
  if (/(\bfallecido\b|\bmuerte\b|\bmuerto\b|\bmurió\b)/i.test(t)) return 'muerte';
  if (/\b(detención|captura|detenido|imputado|procesado)\b/i.test(t)) return 'delito';
  if (/\b(precio|precios|inflación|salario|dólar|córdoba)\b/i.test(t)) return 'precios';
  if (/(\bsalud\b|\bdengue\b|\bcovid\b|\bminsa\b)/i.test(t)) return 'salud';
  if (/(\binundación\b|\bdeslave\b|\btormenta\b|\bhuracán\b)/i.test(t)) return 'desastre';
  return 'general';
}

function preguntaAplicaATipo(pregunta: string, tipo: StoryType): boolean {
  const p = pregunta.toLowerCase();
  // La pregunta de institución solo aplica cuando el hecho involucra autoridades
  if (p.includes('institucion') && p.includes('interviene')) {
    return tipo !== 'comercial';
  }
  return true;
}

function detectarRespuestasFaltantes(texto: string, preguntas: ReaderQuestionsDecision, tipo: StoryType): string[] {
  const t = texto.toLowerCase();
  const faltantes: string[] = [];
  for (const p of preguntas.preguntasObligatorias) {
    if (!preguntaAplicaATipo(p, tipo)) continue;
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

function contextoAplicaATipo(contexto: string, tipo: StoryType): boolean {
  const c = contexto.toLowerCase();
  // Notas comerciales no requieren cifras de cambio económico ni presupuesto familiar
  if (tipo === 'comercial' && (c.includes('cambio económico') || c.includes('presupuesto'))) return false;
  return true;
}

function detectarContextoFaltante(texto: string, tipo: StoryType, categoria?: string): string[] {
  const t = texto.toLowerCase();
  const faltantes: string[] = [];
  const esTurismoOcio = perfilEs(categoria, new Set(['turismo', 'cultura', 'espectaculos', 'espectáculos', 'deportes']));

  if (tipo === 'accidente' && /accidente|choque/i.test(t) && !/velocidad|causa|imprudencia|vía/i.test(t)) {
    faltantes.push('Causa probable del accidente');
  }
  if (tipo === 'muerte' && /muerte|fallecido/i.test(t) && !/causa|investigaci[oó]n|autopsia|peritaje|dictamen|proceso/i.test(t)) {
    faltantes.push('Causa de muerte e investigación');
  }
  if (tipo === 'delito' && /detención|captura/i.test(t) && !/cargo|delito|proceso|judicial/i.test(t)) {
    faltantes.push('Cargos y proceso legal');
  }
  // REGLA 2.1.1: no exigir cifras de variación a notas que no son de economia
  if (tipo === 'precios' && !esTurismoOcio && /precio|inflación|salario/i.test(t) && !/porcentaje|cantidad|córdoba|dólar/i.test(t)) {
    faltantes.push('Cifras concretas del cambio económico');
  }
  if (tipo === 'salud' && /salud|dengue|covid/i.test(t) && !/síntoma|prevención|contagio/i.test(t)) {
    faltantes.push('Síntomas y prevención');
  }
  if (tipo === 'desastre' && /inundación|deslave/i.test(t) && !/familia|afectados|albergue|evacuar/i.test(t)) {
    faltantes.push('Número de afectados y medidas de emergencia');
  }
  return faltantes.filter(c => contextoAplicaATipo(c, tipo));
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
  const tipo = detectarTipoNoticia(texto);

  const respuestasFaltantes = readerQuestions
    ? detectarRespuestasFaltantes(texto, readerQuestions, tipo)
    : [];
  const contextoFaltante = detectarContextoFaltante(texto, tipo, input.perfil || input.categoria);
  const dudasPendientes = detectarDudasPendientes(texto);

  const totalFaltantes = respuestasFaltantes.length + contextoFaltante.length + dudasPendientes.length;
  const cerrada = totalFaltantes === 0;

  let score = 100;
  score -= respuestasFaltantes.length * 5;
  score -= contextoFaltante.length * 4;
  score -= dudasPendientes.length * 3;
  score = Math.max(0, Math.min(score, 100));

  return { cerrada, respuestasFaltantes, contextoFaltante, dudasPendientes, score };
}
