/**
 * Background Engine — Detecta antecedentes relevantes y construye línea de tiempo.
 */

import type { IntelligenceEngineInput, BackgroundDecision } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectarAntecedentes(texto: string, categoria: string): { hecho: string; relevancia: string }[] {
  const antecedentes: { hecho: string; relevancia: string }[] = [];
  const t = texto.toLowerCase();

  if (/accidente|choque|carretera|vía/i.test(t)) {
    antecedentes.push({
      hecho: 'Accidentes previos en la misma vía o zona',
      relevancia: 'Permite al lector entender si es un punto crítico de seguridad vial',
    });
  }
  if (/incendio|fuego/i.test(t)) {
    antecedentes.push({
      hecho: 'Incendios recientes en establecimientos similares',
      relevancia: 'Ayuda a identificar patrones de riesgo en locales comerciales',
    });
  }
  if (/dengue|malaria|covid|salud/i.test(t)) {
    antecedentes.push({
      hecho: 'Brotes o casos previos de la misma enfermedad',
      relevancia: 'Contextualiza la situación epidemiológica actual del país',
    });
  }
  if (/precio|inflación|salario|economía/i.test(t)) {
    antecedentes.push({
      hecho: 'Variaciones recientes de precios o salarios',
      relevancia: 'Permite comparar y entender la tendencia económica',
    });
  }
  if (/detención|arresto|captura/i.test(t)) {
    antecedentes.push({
      hecho: 'Operaciones o capturas previas relacionadas',
      relevancia: 'Contextualiza la acción dentro de un patrón más amplio',
    });
  }
  if (/política|reforma|decreto|asamblea/i.test(t)) {
    antecedentes.push({
      hecho: 'Reformas o decisiones legislativas previas sobre el mismo tema',
      relevancia: 'Ayuda al lector a entender el contexto político completo',
    });
  }
  if (categoria === 'Internacionales') {
    antecedentes.push({
      hecho: 'Eventos previos en el país o región mencionada',
      relevancia: 'Explica por qué este hecho internacional es relevante ahora',
    });
  }

  return antecedentes;
}

function detectarLineaTiempo(texto: string): { fecha: string; evento: string }[] {
  const linea: { fecha: string; evento: string }[] = [];
  const patternFecha = /(\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4})/gi;
  const patternRelativa = /\b(hoy|ayer|anteayer|esta semana|este mes)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = patternFecha.exec(texto)) !== null) {
    linea.push({ fecha: m[1], evento: 'Evento mencionado en la nota' });
  }
  while ((m = patternRelativa.exec(texto)) !== null) {
    linea.push({ fecha: m[1], evento: 'Referencia temporal relativa' });
  }
  return linea.slice(0, 5);
}

function detectarContextoHistorico(texto: string, categoria: string): string | null {
  const t = texto.toLowerCase();
  if (/guerra civil|revolución|sandinista|somocista/i.test(t)) {
    return 'Referencia a la historia política reciente de Nicaragua (1979-1990)';
  }
  if (/terremoto|managua.*1972/i.test(t)) {
    return 'Referencia al terremoto de Managua de 1972';
  }
  if (/huracán|mitch|juan|félix|iota|eta/i.test(t)) {
    return 'Referencia a huracanes que han afectado a Nicaragua';
  }
  if (/pandemia|covid.*2020/i.test(t)) {
    return 'Referencia a la pandemia de COVID-19 en Nicaragua';
  }
  if (categoria === 'Economía' && /crisis|recesión/i.test(t)) {
    return 'Contexto de crisis económicas previas en Nicaragua';
  }
  return null;
}

function computeScore(
  antecedentes: { hecho: string; relevancia: string }[],
  lineaDeTiempo: { fecha: string; evento: string }[],
  contextoHistorico: string | null,
): number {
  let score = 40;
  if (antecedentes.length > 0) score += 20;
  if (antecedentes.length >= 2) score += 10;
  if (lineaDeTiempo.length > 0) score += 15;
  if (contextoHistorico) score += 15;
  return Math.min(score, 100);
}

export function runBackgroundEngine(input: IntelligenceEngineInput): BackgroundDecision {
  const texto = stripHtml(`${input.titulo} ${input.contenido}`);
  const antecedentes = detectarAntecedentes(texto, input.categoria);
  const lineaDeTiempo = detectarLineaTiempo(texto);
  const contextoHistorico = detectarContextoHistorico(texto, input.categoria);
  const score = computeScore(antecedentes, lineaDeTiempo, contextoHistorico);

  return { antecedentes, lineaDeTiempo, contextoHistorico, score };
}
