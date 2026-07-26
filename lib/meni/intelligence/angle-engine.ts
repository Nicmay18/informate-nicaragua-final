/**
 * Angle Engine — Detecta el ángulo diferencial para Nicaragua Informate.
 * Responde: ¿Por qué merece existir esta nota?
 */

import type { IntelligenceEngineInput, AngleDecision } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectarAngulo(texto: string, categoria: string, departamento?: string): string {
  const t = texto.toLowerCase();
  if (/accidente|choque|vía|carretera/i.test(t)) {
    return `Seguridad vial en ${departamento || 'Nicaragua'}: por qué esta ruta es peligrosa y qué dicen los datos`;
  }
  if (/incendio|fuego/i.test(t)) {
    return 'Seguridad de establecimientos comerciales: protocolos y prevención';
  }
  if (/precio|inflación|salario|economía/i.test(t)) {
    return 'Impacto en el bolsillo del nicaragüense: cómo afecta este hecho a las familias';
  }
  if (/salud|dengue|covid|hospital/i.test(t)) {
    return 'Situación de salud pública: qué significa para las familias nicaragüenses';
  }
  if (/deporte|fútbol|beisbol/i.test(t)) {
    return 'El deporte nicaragüense y su impacto en la identidad nacional';
  }
  if (/política|gobierno|asamblea|reforma/i.test(t)) {
    return 'Cómo esta decisión afecta directamente al ciudadano nicaragüense';
  }
  if (/internacional/i.test(categoria.toLowerCase())) {
    return 'Por qué este hecho internacional importa para Nicaragua';
  }
  return `Contexto y explicación para el lector nicaragüense sobre ${categoria.toLowerCase()}`;
}

function detectarPorQueMerece(texto: string): string {
  const t = texto.toLowerCase();
  if (/porque|debido a|causa|motivo/i.test(t)) {
    return 'Explica las causas del hecho, no solo lo que ocurrió';
  }
  if (/consecuencia|impacto|afectación/i.test(t)) {
    return 'Analiza las consecuencias e impacto para el lector';
  }
  if (/contexto|antecedente|historia/i.test(t)) {
    return 'Aporta contexto que otros medios no incluyen';
  }
  if (/qué es|cómo funciona|qué significa/i.test(t)) {
    return 'Explica conceptos que otros medios dan por sabidos';
  }
  return 'Organiza y explica mejor la información para que el lector comprenda';
}

function detectarConexionNicaragua(texto: string, departamento?: string): string {
  if (departamento && departamento.trim()) {
    return `Impacto directo en los habitantes de ${departamento} y la región`;
  }
  const t = texto.toLowerCase();
  if (/nicaragua|nicaragüense|managua/i.test(t)) {
    return 'Conexión directa con la realidad nicaragüense';
  }
  return 'Relevancia para el lector nicaragüense: cómo este hecho le afecta o le interesa';
}

function computeScore(angulo: string, porQue: string, conexion: string): number {
  let score = 60;
  if (angulo.length > 20) score += 15;
  if (porQue.length > 20) score += 15;
  if (conexion.length > 20) score += 10;
  return Math.min(score, 100);
}

export function runAngleEngine(input: IntelligenceEngineInput): AngleDecision {
  const texto = stripHtml(`${input.titulo} ${input.contenido}`);
  const anguloDiferencial = detectarAngulo(texto, input.categoria, input.departamento);
  const porQueMereceExistir = detectarPorQueMerece(texto);
  const conexionNicaragua = detectarConexionNicaragua(texto, input.departamento);
  const score = computeScore(anguloDiferencial, porQueMereceExistir, conexionNicaragua);

  return { anguloDiferencial, porQueMereceExistir, conexionNicaragua, score };
}
