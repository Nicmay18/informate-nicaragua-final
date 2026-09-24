/**
 * Quote Guard — defensa técnica anti citas/atribuciones fabricadas
 * =================================================================
 * Durante el saneamiento aparecieron 17 notas con citas fabricadas por el
 * pipeline ("testigo ocular manifestó", "vecino que presenció", "María López,
 * vecina del barrio..."). Un prompt que dice "no inventar" NO es garantía.
 *
 * Regla: toda cita textual y toda atribución del texto GENERADO debe existir
 * en la FUENTE original. Si no existe → FABRICATED → bloquear.
 *
 * La comparación tolera HTML, espacios, mayúsculas, diacríticos y comillas
 * distintas — pero no permite que pase una cita completamente nueva.
 */

export interface QuoteGuardResult {
  ok: boolean;
  fabricatedQuotes: string[];
  fabricatedAttributions: string[];
  reason: string;
}

/** Normaliza para comparación: minúsculas, sin diacríticos, sin HTML,
 *  espacios y puntuación colapsados, comillas unificadas. */
function normalize(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/[«»"'"'""„]/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extrae segmentos citados textualmente del HTML generado. */
function extractQuotes(html: string): string[] {
  const quotes: string[] = [];
  // <blockquote>…</blockquote>
  for (const m of html.matchAll(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi)) {
    const t = m[1].replace(/<[^>]+>/g, ' ').trim();
    if (t.length >= 20) quotes.push(t);
  }
  // Citas entre comillas de ≥ 4 palabras («…», "…", "…")
  for (const m of html.matchAll(/[«»"'"']([^«»"'"']{20,300})[«»"'"']/g)) {
    const t = m[1].trim();
    if (t.split(/\s+/).filter(Boolean).length >= 4) quotes.push(t);
  }
  return quotes;
}

/** ¿La cita aparece en la fuente? Contención exacta normalizada o
 *  cobertura ≥85% de shingles de 4 palabras (tolera ediciones menores). */
function quoteExistsInSource(quote: string, srcNorm: string): boolean {
  const qNorm = normalize(quote);
  if (qNorm.length < 15) return true; // citas triviales no se evalúan
  if (srcNorm.includes(qNorm)) return true;

  const words = qNorm.split(' ').filter(Boolean);
  if (words.length < 4) return srcNorm.includes(qNorm);
  let covered = 0;
  let total = 0;
  for (let i = 0; i + 4 <= words.length; i++) {
    total++;
    if (srcNorm.includes(words.slice(i, i + 4).join(' '))) covered++;
  }
  return total > 0 && covered / total >= 0.85;
}

// Atribuciones con actor nombrado: "La Policía informó", "Ministerio señaló".
const ATTRIBUTION_VERBS =
  /([A-ZÁÉÍÓÚÑ][\p{L}.'-]+(?:\s+(?:de|del|la|los|las|y|en)?\s*[A-ZÁÉÍÓÚÑa-záéíóúñ][\p{L}.'-]*){0,3})\s+(?:dijo|dijeron|inform[oó]|informaron|confirm[oó]|confirmaron|señal[oó]|señalaron|declar[oó]|declararon|asegur[oó]|aseguraron|expres[oó]|expresaron|relat[oó]|relataron|cont[oó]|contaron|afirm[oó]|afirmaron|indic[oó]|indicaron|precis[oó]|precisaron|explic[oó]|explicaron|anunci[oó]|anunciaron|denunci[oó]|denunciaron|testific[oó]|testificaron|manifest[oó]|manifestaron|admiti[oó]|admitieron|revel[oó]|revelaron|sostuvo|sostuvieron|detall[oó]|detallaron|report[oó]|reportaron|destac[oó]|destacaron|difundi[oó]|difundieron|public[oó]|publicaron|coment[oó]|comentaron)/gu;

// Atribuciones anónimas por rol: "un testigo dijo", "vecinos aseguraron",
// "una vecina del lugar relató" — hasta 3 palabras entre rol y verbo.
const ROLE_WORDS = 'testigos?|vecinos?|vecinas?|residentes?|familiar(?:es)?|expertos?|especialistas?|pobladore?s?|comerciantes?|pasajeros?|conductore?s?|pea[tóo]nes?|ciudadanos?|habitantes?|moradore?s?|transeúntes?|allegados?|conocidos?|amigos?|colegas?|testimonios?|involucrados?|afectados?|presentes?|lugareños?';
const ROLE_VERBS = 'dijo|dijeron|manifest[oó]|manifestaron|asegur[oó]|aseguraron|relat[oó]|relataron|cont[oó]|contaron|coment[oó]|comentaron|expres[oó]|expresaron|señal[oó]|señalaron|confirm[oó]|confirmaron|declar[oó]|declararon|afirm[oó]|afirmaron|indic[oó]|indicaron|revel[oó]|revelaron|denunci[oó]|denunciaron|report[oó]|reportaron|narr[oó]|narraron|explic[oó]|explicaron';
const ROLE_ATTRIBUTION = new RegExp(
  `\\b(?:un|una|unos|unas|varios|varias|algunos|algunas|los|las)?\\s*(${ROLE_WORDS})\\b(?:\\s+\\w+){0,3}?\\s+(?:${ROLE_VERBS})\\b`,
  'gi',
);
// Orden invertido: "dijo una vecina", "manifestaron los vecinos".
const ROLE_AFTER_VERB = new RegExp(
  `\\b(?:${ROLE_VERBS})\\b(?:\\s+(?:un|una|unos|unas|varios|varias|algunos|algunas|los|las|el|la))?\\s*(${ROLE_WORDS})\\b`,
  'gi',
);
// "según el conductor", "de acuerdo con los vecinos" — rol como fuente.
const ROLE_SEGUN = new RegExp(
  `\\b(?:seg[uú]n|de acuerdo con|de acuerdo a)\\s+(?:el|la|los|las|un|una)?\\s*(${ROLE_WORDS})\\b`,
  'gi',
);

// Plantillas históricas fabricadas — siempre bloquear si no están en fuente.
const KNOWN_FABRICATED = [
  'testigo ocular manifesto',
  'vecino que presencio',
  'declaracion de residente local',
  'maria lopez',
];

/** Palabras vacías comunes al inicio de atribuciones capturadas. */
const STOP_PREFIXES = /^(?:el|la|los|las|un|una|de|del|en|y|que|por|para|con|según|tras|durante|ante|al|su|sus|este|esta|estos|estas)\s+/i;

function speakerInSource(speaker: string, srcNorm: string): boolean {
  const sNorm = normalize(speaker).replace(STOP_PREFIXES, '').trim();
  if (sNorm.length < 3) return true;
  // Todos los tokens significativos del hablante deben estar en la fuente.
  const tokens = sNorm.split(' ').filter(w => w.length > 2);
  if (tokens.length === 0) return true;
  return tokens.every(w => srcNorm.includes(w));
}

function roleInSource(role: string, srcNorm: string): boolean {
  // El rol (testigo, vecino, familiar…) debe existir en la fuente.
  const rNorm = normalize(role).replace(/s$/, '');
  const singular = rNorm.endsWith('e') ? rNorm : rNorm.replace(/e?s$/, '');
  return srcNorm.includes(singular) || srcNorm.includes(rNorm);
}

/**
 * Valida que el texto generado no contenga citas ni atribuciones fabricadas.
 * source = fuente original (texto plano o HTML).
 * generatedHtml = artículo generado.
 */
export function validateQuotesAndAttributions(
  source: string,
  generatedHtml: string,
): QuoteGuardResult {
  const srcNorm = normalize(source || '');
  const fabricatedQuotes: string[] = [];
  const fabricatedAttributions: string[] = [];

  if (!srcNorm || srcNorm.length < 30) {
    // Sin fuente verificable: no se puede garantizar nada → cualquier cita
    // directa o atribución es riesgo, pero sin evidencia no bloqueamos por
    // ausencia — el caller decide con esta señal.
  }

  // 1) Citas textuales
  for (const q of extractQuotes(generatedHtml)) {
    if (!quoteExistsInSource(q, srcNorm)) {
      fabricatedQuotes.push(q.slice(0, 120));
    }
  }

  // 2) Atribuciones con actor nombrado
  const genText = generatedHtml.replace(/<[^>]+>/g, ' ');
  for (const m of genText.matchAll(ATTRIBUTION_VERBS)) {
    const speaker = m[1].trim();
    if (speaker.length < 3 || speaker.length > 80) continue;
    if (!speakerInSource(speaker, srcNorm)) {
      fabricatedAttributions.push(`"${speaker} …"`);
    }
  }

  // 3) Atribuciones anónimas por rol (verbo o "según")
  for (const m of genText.matchAll(ROLE_ATTRIBUTION)) {
    const role = m[1];
    if (!roleInSource(role, srcNorm)) {
      fabricatedAttributions.push(`"${role} …" (rol no presente en fuente)`);
    }
  }
  for (const m of genText.matchAll(ROLE_AFTER_VERB)) {
    const role = m[1];
    if (!roleInSource(role, srcNorm)) {
      fabricatedAttributions.push(`"… ${role}" (rol no presente en fuente)`);
    }
  }
  for (const m of genText.matchAll(ROLE_SEGUN)) {
    const role = m[1];
    if (!roleInSource(role, srcNorm)) {
      fabricatedAttributions.push(`"según ${role}" (rol no presente en fuente)`);
    }
  }

  // 4) Plantillas fabricadas conocidas
  const genNorm = normalize(generatedHtml);
  for (const k of KNOWN_FABRICATED) {
    if (genNorm.includes(k) && !srcNorm.includes(k)) {
      fabricatedAttributions.push(`plantilla fabricada: "${k}"`);
    }
  }

  const ok = fabricatedQuotes.length === 0 && fabricatedAttributions.length === 0;
  const reason = ok
    ? 'Citas y atribuciones verificadas contra la fuente.'
    : [
        fabricatedQuotes.length > 0 ? `${fabricatedQuotes.length} cita(s) no presentes en la fuente` : '',
        fabricatedAttributions.length > 0 ? `${fabricatedAttributions.length} atribución(es) sin respaldo en la fuente` : '',
      ].filter(Boolean).join('; ') + '.';

  return { ok, fabricatedQuotes, fabricatedAttributions, reason };
}
