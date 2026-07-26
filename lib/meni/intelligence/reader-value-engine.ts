/**
 * Reader Value Engine — Responde: ¿Qué gana el lector leyendo esta nota?
 * Si la respuesta es "nada nuevo", bloquea publicación.
 */

import type { IntelligenceEngineInput, ReaderValueDecision } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const PATRONES_SIN_VALOR = [
  /\bsegún informaciones\b/i,
  /\bse comenta que\b/i,
  /\bfuentes cercanas\b/i,
  /\bse espera más información\b/i,
  /\bcontinúan las investigaciones\b/i,
  /\bno se descarta\b/i,
];


function detectarQueGanaElLector(texto: string, titulo: string): string[] {
  const valores: string[] = [];
  const textoCompleto = `${titulo} ${texto}`;

  if (/\bpor qué\b/i.test(textoCompleto) || /\bporque\b/i.test(textoCompleto)) {
    valores.push('Explica por qué ocurrió el hecho');
  }
  if (/\bcontexto\b|\bantecedente\b|\bhistoria\b/i.test(textoCompleto)) {
    valores.push('Aporta contexto histórico o antecedentes');
  }
  if (/\bconsecuencia\b|\bimpacto\b|\bafectación\b|\bimplicación\b/i.test(textoCompleto)) {
    valores.push('Analiza consecuencias e impacto');
  }
  if (/\bqué es\b|\bcómo funciona\b|\bqué significa\b/i.test(textoCompleto)) {
    valores.push('Explica conceptos o términos técnicos');
  }
  if (/\bcronología\b|\bprimero\b|\bdespués\b|\bluego\b|\bfinalmente\b/i.test(textoCompleto)) {
    valores.push('Organiza la información cronológicamente');
  }
  if (/\bpara los\b|\blos habitantes\b|\blos ciudadanos\b|\blos lectores\b/i.test(textoCompleto)) {
    valores.push('Conecta el hecho con el lector nicaragüense');
  }
  const cifras = textoCompleto.match(/\b\d+(?:\.\d{3})*(?:,\d+)?\s*(?:córdobas?|dólares?|personas?|familias?|kilos?|metros?|km|hectáreas?|millones?|mil|%)\b/gi);
  if (cifras && cifras.length >= 2) {
    valores.push('Incluye datos cuantificables verificables');
  }
  if (/\bsegún(?:n)?\s+(?:el|la|los|las)\s+/i.test(textoCompleto)) {
    valores.push('Atribuye información a fuentes identificadas');
  }

  return valores;
}

function detectarQueFaltaExplicar(texto: string, titulo: string): string[] {
  const faltan: string[] = [];
  const textoCompleto = `${titulo} ${texto}`;

  if (titulo.length > 0 && !/\bpor qué\b|\bcausa\b|\bmotivo\b/i.test(textoCompleto)) {
    faltan.push('Explicar la causa o motivo del hecho');
  }
  if (!/\bconsecuencia\b|\bimpacto\b|\bqué\s+significa\b|\bcómo\s+afecta\b/i.test(textoCompleto)) {
    faltan.push('Explicar qué significa o cómo afecta al lector');
  }
  if (!/\bsegún(?:n)?\s+/i.test(textoCompleto)) {
    faltan.push('Atribuir la información a una fuente identificada');
  }
  const palabras = textoCompleto.split(/\s+/).filter(Boolean).length;
  if (palabras < 200) {
    faltan.push('Ampliar el contenido: falta desarrollo y contexto');
  }
  if (!/\b\d{1,2}\s+de\s+/i.test(textoCompleto) && !/\bhoy|ayer\b/i.test(textoCompleto)) {
    faltan.push('Incluir fecha del hecho');
  }

  return faltan;
}

function detectarPreguntasSinResponder(texto: string, titulo: string): string[] {
  const preguntas: string[] = [];
  const textoCompleto = `${titulo} ${texto}`;

  if (/accidente|choque|colisión/i.test(textoCompleto) && !/\bheridos?\b|\bfallecidos?\b|\bvíctimas?\b/i.test(textoCompleto)) {
    preguntas.push('¿Hubo heridos o fallecidos?');
  }
  if (/incendio/i.test(textoCompleto) && !/\bcausa\b|\borigen\b/i.test(textoCompleto)) {
    preguntas.push('¿Cuál fue la causa del incendio?');
  }
  if (/detención|arresto|captura/i.test(textoCompleto) && !/\bcargos?\b|\bdelito\b|\bimputación\b/i.test(textoCompleto)) {
    preguntas.push('¿Qué cargos se le imputan?');
  }
  if (/economía|precio|inflación|salario/i.test(textoCompleto) && !/\bcórdobas?|\bdólares?|\bcifra\b/i.test(textoCompleto)) {
    preguntas.push('¿Cuál es la cifra exacta?');
  }
  if (!/\bqué\s+pasa\s+después\b|\bpróximos?\s+pasos?\b|\bqué\s+se\s+espera\b/i.test(textoCompleto)) {
    preguntas.push('¿Qué pasa después?');
  }

  return preguntas;
}

function detectarValorDiferencial(
  queGana: string[],
): string | null {
  if (queGana.length === 0) return null;
  if (queGana.length >= 3) {
    return `El lector obtiene: ${queGana.slice(0, 3).join(', ')}`;
  }
  return `El lector obtiene: ${queGana[0]}`;
}

function debeBloquear(queGana: string[], queFalta: string[]): { bloquear: boolean; motivo: string | null } {
  if (queGana.length === 0) {
    return {
      bloquear: true,
      motivo: 'La nota no aporta valor diferencial al lector. No explica, no contextualiza, no analiza. Solo transcribe el hecho.',
    };
  }
  let patronesSinValor = 0;
  for (const p of PATRONES_SIN_VALOR) {
    if (p.test(queFalta.join(' '))) patronesSinValor++;
  }
  if (queFalta.length >= 4) {
    return {
      bloquear: true,
      motivo: 'Faltan demasiados elementos editoriales: ' + queFalta.slice(0, 3).join(', '),
    };
  }
  return { bloquear: false, motivo: null };
}

function computeScore(queGana: string[], queFalta: string[], bloquear: boolean): number {
  if (bloquear) return Math.max(20, 40 - queFalta.length * 5);
  let score = 50;
  score += queGana.length * 10;
  score -= queFalta.length * 5;
  return Math.max(0, Math.min(score, 100));
}

export function runReaderValueEngine(input: IntelligenceEngineInput): ReaderValueDecision {
  const texto = stripHtml(input.contenido);
  const titulo = input.titulo;
  const queGanaElLector = detectarQueGanaElLector(texto, titulo);
  const queFaltaExplicar = detectarQueFaltaExplicar(texto, titulo);
  const preguntasSinResponder = detectarPreguntasSinResponder(texto, titulo);
  const valorDiferencial = detectarValorDiferencial(queGanaElLector);
  const { bloquear, motivo } = debeBloquear(queGanaElLector, queFaltaExplicar);
  const score = computeScore(queGanaElLector, queFaltaExplicar, bloquear);

  return {
    queGanaElLector,
    queFaltaExplicar,
    preguntasSinResponder,
    valorDiferencial,
    bloquear,
    motivoBloqueo: motivo,
    score,
  };
}
