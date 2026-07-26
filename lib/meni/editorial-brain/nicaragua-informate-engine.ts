/**
 * Nicaragua Informate Engine
 * ==========================
 * El motor más importante.
 * Responde: ¿Por qué un lector debería leer esta nota aquí
 * y no en otro medio?
 *
 * Si no encuentra respuesta → BLOCK.
 */

import type { EditorialBrainInput, NicaraguaInformateDecision } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectarQueAporta(texto: string, categoria: string): string {
  const t = texto.toLowerCase();
  const aportes: string[] = [];

  if (/por qué|causa|motivo|razón/i.test(t)) aportes.push('explica por qué ocurrió');
  if (/cómo afecta|impacto|consecuencia/i.test(t)) aportes.push('analiza cómo afecta al lector');
  if (/contexto|antecedente|historia/i.test(t)) aportes.push('aporta contexto que otros no incluyen');
  if (/qué significa|explica|definición/i.test(t)) aportes.push('explica conceptos que otros asumen');
  if (/prevención|precaución|qué hacer/i.test(t)) aportes.push('ofrece guía práctica de prevención');
  if (/precio|costo|salario|economía/i.test(t)) aportes.push('explica el impacto económico para el ciudadano');
  if (/salud|enfermedad|síntoma/i.test(t)) aportes.push('explica cómo protegerse');

  if (aportes.length === 0) {
    if (categoria === 'Sucesos') aportes.push('explica causas y prevención, no solo reporta el hecho');
    else if (categoria === 'Economía') aportes.push('explica cómo afecta al bolsillo del nicaragüense');
    else if (categoria === 'Salud') aportes.push('explica qué es y cómo prevenir');
    else if (categoria === 'Internacionales') aportes.push('explica por qué importa para Nicaragua');
    else if (categoria === 'Política') aportes.push('explica cómo afecta al ciudadano, sin alineación');
    else aportes.push('aporta contexto y explicación para el lector nicaragüense');
  }

  return aportes[0] ?? 'aporta explicación y contexto para el lector nicaragüense';
}

function detectarSelloEditorial(texto: string, categoria: string): string {
  const t = texto.toLowerCase();
  if (/accidente|choque|muerte|fallecido/i.test(t)) {
    return 'Sin morbo, sin fotos del cuerpo. Explicar causas, prevención y estado de víctimas.';
  }
  if (/precio|inflación|salario|economía/i.test(t)) {
    return 'Traducir cifras a impacto real para el ciudadano. "¿Cuánto más voy a pagar?"';
  }
  if (/salud|dengue|covid|enfermedad/i.test(t)) {
    return 'Explicar la enfermedad, cómo se contagia, cómo prevenir, dónde atenderse. No alarmar.';
  }
  if (/política|gobierno|asamblea|reforma/i.test(t)) {
    return 'Sin alineación política. Explicar cómo afecta al ciudadano, qué cambia, qué sigue.';
  }
  if (/internacional/i.test(t) || categoria === 'Internacionales') {
    return 'Explicar por qué este hecho internacional importa para Nicaragua y los nicaragüenses.';
  }
  if (/deporte|fútbol|baseball/i.test(t)) {
    return 'Contar la historia deportiva, no solo el resultado. Contexto del torneo y el equipo.';
  }
  return 'Explicar mejor. Contexto, causas, impacto. Que el lector entienda, no solo se informe.';
}

function debeBloquear(texto: string): { bloquear: boolean; motivo: string | null } {
  const t = texto.toLowerCase();
  if (t.split(/\s+/).filter(Boolean).length < 15) {
    return { bloquear: true, motivo: 'El hecho es demasiado breve. No hay suficiente información para aportar valor diferencial.' };
  }
  if (/según informaciones|se comenta|fuentes cercanas/i.test(t)) {
    return { bloquear: true, motivo: 'La fuente es vaga. No hay datos concretos para construir una nota con valor diferencial.' };
  }
  return { bloquear: false, motivo: null };
}

export function runNicaraguaInformateEngine(input: EditorialBrainInput): NicaraguaInformateDecision {
  const texto = stripHtml(`${input.titulo} ${input.contenido}`);
  const categoria = input.categoria || 'General';

  const queAportaDiferente = detectarQueAporta(texto, categoria);
  const selloEditorial = detectarSelloEditorial(texto, categoria);
  const porQueLeerAqui = `Porque aquí ${queAportaDiferente}, mientras otros medios solo reportan el hecho. ${selloEditorial}`;

  const { bloquear, motivo } = debeBloquear(texto);

  let score = 60;
  if (queAportaDiferente.length > 30) score += 15;
  if (selloEditorial.length > 30) score += 10;
  if (porQueLeerAqui.length > 60) score += 10;
  if (bloquear) score = Math.min(score, 30);
  score = Math.min(score, 100);

  return { porQueLeerAqui, queAportaDiferente, selloEditorial, bloquear, motivoBloqueo: motivo, score };
}
