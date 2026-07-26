/**
 * News Value Engine
 * =================
 * Calcula automáticamente el valor noticioso del HECHO.
 * No analiza texto. Analiza el hecho bruto.
 *
 * 7 dimensiones: interés público, cercanía, actualidad,
 * impacto, servicio, rareza, utilidad.
 */

import type { EditorialBrainInput, NewsValueDecision } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectarTipoHecho(texto: string): string {
  const t = texto.toLowerCase();
  if (/muerte|fallecido|muerto|asesinato|homicidio/i.test(t)) return 'muerte';
  if (/accidente|choque|colisión|volcadura|atropello/i.test(t)) return 'accidente';
  if (/detención|captura|allanamiento|operativo/i.test(t)) return 'delito';
  if (/incendio|siniestro|conato/i.test(t)) return 'siniestro';
  if (/precio|inflación|salario|economía|dólar|córdoba/i.test(t)) return 'economia';
  if (/salud|dengue|covid|virus|epidemia|hospital/i.test(t)) return 'salud';
  if (/elección|votación|candidato|partido|política|gobierno/i.test(t)) return 'politica';
  if (/deporte|fútbol|baseball|selección|torneo/i.test(t)) return 'deporte';
  if (/internacional|estados unidos|onu|ue/i.test(t)) return 'internacional';
  if (/educación|colegio|universidad|maestro/i.test(t)) return 'educacion';
  if (/inundación|deslave|lluvia|tormenta|terremoto/i.test(t)) return 'desastre';
  return 'general';
}

function calcularInteresPublico(tipo: string, texto: string): number {
  const base: Record<string, number> = {
    muerte: 95, accidente: 85, delito: 80, siniestro: 75,
    economia: 80, salud: 85, politica: 70, deporte: 50,
    internacional: 55, educacion: 65, desastre: 90, general: 40,
  };
  let score = base[tipo] ?? 40;
  if (/víctima|herido|fallecido/i.test(texto)) score = Math.min(score + 10, 100);
  if (/menor|niño|niña|adolescente/i.test(texto)) score = Math.min(score + 5, 100);
  return score;
}

function calcularCercania(texto: string, departamento: string, categoria: string): number {
  const deptos = ['managua', 'matagalpa', 'león', 'chinandega', 'estelí', 'masaya', 'granada',
    'carazo', 'raas', 'raan', 'rivas', 'jinotega', 'boaco', 'chontales', 'río san juan',
    'nueva segovia', 'madriz', 'tipitapa', 'ciudad sandino'];
  const t = texto.toLowerCase();
  let score = 30;
  if (departamento && deptos.some(d => t.includes(d))) score = 90;
  else if (departamento) score = 75;
  else if (deptos.some(d => t.includes(d))) score = 70;
  if (/nicaragua|nicaragüense|managua/i.test(t)) score = Math.min(score + 10, 100);
  if (categoria === 'Internacionales') score = Math.max(score - 20, 20);
  return score;
}

function calcularActualidad(texto: string, fecha?: string): number {
  const t = texto.toLowerCase();
  let score = 60;
  if (/hoy|ayer|esta mañana|esta tarde|anoche|recién|acaba de/i.test(t)) score = 95;
  else if (/esta semana|el lunes|el martes|el miércoles|el jueves|el viernes/i.test(t)) score = 80;
  else if (/este mes|recientemente/i.test(t)) score = 65;
  if (fecha) {
    const dias = (Date.now() - new Date(fecha).getTime()) / 86400000;
    if (dias < 1) score = Math.max(score, 95);
    else if (dias < 2) score = Math.max(score, 85);
    else if (dias < 7) score = Math.max(score, 70);
    else if (dias > 30) score = Math.min(score, 30);
  }
  return score;
}

function calcularImpacto(tipo: string, texto: string): number {
  const base: Record<string, number> = {
    muerte: 90, accidente: 70, delito: 65, siniestro: 60,
    economia: 85, salud: 80, politica: 75, desastre: 90,
    deporte: 35, internacional: 45, educacion: 55, general: 30,
  };
  let score = base[tipo] ?? 30;
  if (/comunidad|barrio|zona|colonos|habitantes/i.test(texto)) score = Math.min(score + 15, 100);
  if (/familia|familias|víctimas|heridos/i.test(texto)) score = Math.min(score + 10, 100);
  return score;
}

function calcularServicio(tipo: string, texto: string): number {
  const t = texto.toLowerCase();
  const base: Record<string, number> = {
    economia: 90, salud: 90, desastre: 85, educacion: 75,
    accidente: 70, siniestro: 65, general: 30, deporte: 20,
  };
  let score = base[tipo] ?? 35;
  if (/recomendación|precaución|prevención|qué hacer|cómo/i.test(t)) score = Math.min(score + 15, 100);
  if (/precio|tarifa|costo|salario|aumento/i.test(t)) score = Math.min(score + 10, 100);
  return score;
}

function calcularRareza(texto: string): number {
  const t = texto.toLowerCase();
  let score = 30;
  const raros = ['por primera vez', 'histórico', 'nunca antes', 'récord', 'inusual',
    'extraño', 'sorpresa', 'insólito', 'millón', 'récord guinness'];
  for (const r of raros) {
    if (t.includes(r)) { score = 85; break; }
  }
  if (/estudiante|niño|mujer|anciano/i.test(t)) score = Math.min(score + 10, 100);
  return score;
}

function calcularUtilidad(texto: string, categoria: string): number {
  const t = texto.toLowerCase();
  let score = 40;
  if (/cómo|qué hacer|dónde|cuándo|cuánto|paso a paso/i.test(t)) score = Math.min(score + 25, 100);
  if (/teléfono|contacto|número|dirección|horario/i.test(t)) score = Math.min(score + 20, 100);
  if (/consejo|recomendación|precaución/i.test(t)) score = Math.min(score + 15, 100);
  const utilCat: Record<string, number> = {
    Economía: 85, Salud: 85, Educación: 75, Tecnología: 70,
    Sucesos: 55, Nacionales: 60, Deportes: 25, Espectáculos: 20,
  };
  score = Math.max(score, utilCat[categoria] ?? 40);
  return score;
}

export function runNewsValueEngine(input: EditorialBrainInput): NewsValueDecision {
  const texto = stripHtml(`${input.titulo} ${input.contenido}`);
  const tipo = detectarTipoHecho(texto);

  const interesPublico = calcularInteresPublico(tipo, texto);
  const cercania = calcularCercania(texto, input.departamento || '', input.categoria || '');
  const actualidad = calcularActualidad(texto, input.fecha);
  const impacto = calcularImpacto(tipo, texto);
  const servicio = calcularServicio(tipo, texto);
  const rareza = calcularRareza(texto);
  const utilidad = calcularUtilidad(texto, input.categoria || '');

  const dims = [interesPublico, cercania, actualidad, impacto, servicio, rareza, utilidad];
  const score = Math.round(dims.reduce((a, b) => a + b, 0) / dims.length);

  let veredicto: 'alta' | 'media' | 'baja' = 'baja';
  if (score >= 75) veredicto = 'alta';
  else if (score >= 55) veredicto = 'media';

  const razon = `Tipo: ${tipo}. Interés público ${interesPublico}, cercanía ${cercania}, ` +
    `actualidad ${actualidad}, impacto ${impacto}, servicio ${servicio}, ` +
    `rareza ${rareza}, utilidad ${utilidad}.`;

  return { interesPublico, cercania, actualidad, impacto, servicio, rareza, utilidad, score, veredicto, razon };
}
