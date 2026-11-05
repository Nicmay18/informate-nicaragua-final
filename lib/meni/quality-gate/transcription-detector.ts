/**
 * MENI Quality Gate — Detector de Transcripción Párrafo a Párrafo
 * ================================================================
 * Compara CADA párrafo del artículo contra la fuente original.
 * Si un párrafo supera el umbral de similitud → REESCRIBIR.
 * Así el sistema nunca vuelve a copiar bloques completos.
 */

import type { QualityGateIssue } from './types';

export interface ParagraphTranscription {
  indice: number;
  extracto: string;
  similitud: number;
  /** Similitud solo expresiva: n-gramas compartidos que NO son hechos
   *  (cifras, fechas, nombres propios). La coincidencia factual con la
   *  fuente es esperable en periodismo basado en fuentes oficiales. */
  similitudExpresiva: number;
  /** % de n-gramas expresivos que forman rachas de ≥2 coincidencias
   *  consecutivas (≥6 palabras seguidas calcadas). Es la métrica de
   *  "copia sustancial": las coincidencias aisladas de 5 palabras son
   *  normalmente terminología oficial o fórmulas de la fuente, no plagio. */
  similitudSustancial: number;
  veredicto: 'OK' | 'REVISAR' | 'REESCRIBIR';
}

export interface TranscriptionReport {
  parrafos: ParagraphTranscription[];
  parrafosParaReescribir: number;
  parrafosParaRevisar: number;
  similitudPromedio: number;
  similitudMaxima: number;
  similitudExpresivaPromedio: number;
  similitudExpresivaMaxima: number;
  similitudSustancialPromedio: number;
  similitudSustancialMaxima: number;
}

const PARAGRAPH_SIMILARITY_THRESHOLD = Number(process.env.MENI_MAX_PARAGRAPH_SIMILARITY || '60');
const NGRAM_SIZE = 5;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * MENI 4.0 — Tokens factuales de la fuente.
 *
 * Hechos objetivos cuya coincidencia con el artículo es inevitable y
 * legítima: cifras, fechas, horas, porcentajes y nombres propios
 * (personas, lugares, instituciones). Un n-grama que contiene un token
 * factual compartido es "coincidencia factual", no copia expresiva.
 *
 * La extracción usa el texto ORIGINAL (con mayúsculas) para captar
 * nombres propios, y la forma normalizada para comparar tokens.
 */
export function extraerTokensFactuales(fuenteOriginal: string): Set<string> {
  const tokens = new Set<string>();
  const normalizada = normalizar(stripHtml(fuenteOriginal));
  // Cifras, fechas, horas y porcentajes
  for (const m of normalizada.matchAll(/\b\d[\d.,:%]*/g)) {
    tokens.add(m[0]);
  }
  // Nombres propios: secuencias capitalizadas del texto original.
  // Se excluye la primera palabra de cada oración (posición tras '. ').
  const plain = stripHtml(fuenteOriginal);
  for (const m of plain.matchAll(/[A-ZÁÉÍÓÚÑ][a-záéíóúñü]{2,}(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñü]{2,})*/g)) {
    const idx = m.index ?? 0;
    const esInicioDeOracion = idx === 0 || /[.!?]\s*$/.test(plain.slice(0, idx));
    const palabras = m[0].split(/\s+/);
    // La primera palabra de una oración va capitalizada aunque sea común;
    // solo se toma como nombre propio si el match tiene ≥2 capitalizadas.
    if (esInicioDeOracion && palabras.length === 1) continue;
    for (const w of palabras) tokens.add(normalizar(w));
  }
  return tokens;
}

/** ¿Un n-grama contiene algún token factual de la fuente? */
function ngramaEsFactual(ngrama: string, factuales: Set<string>): boolean {
  if (factuales.size === 0) return false;
  for (const w of ngrama.split(' ')) {
    if (factuales.has(w)) return true;
  }
  return false;
}

/**
 * Similitud por n-gramas de palabras: % de n-gramas del párrafo que
 * aparecen literalmente en la fuente.
 * Devuelve total (incluye hechos) y expresiva (solo prosa compartida).
 */
function medirSimilitud(
  parrafo: string,
  fuenteNormalizada: string,
  factuales?: Set<string>,
): { total: number; expresiva: number; sustancial: number } {
  const palabras = normalizar(parrafo).split(' ').filter(Boolean);
  if (palabras.length < NGRAM_SIZE) {
    const p = palabras.join(' ');
    const found = p.length > 0 && fuenteNormalizada.includes(p);
    if (!found) return { total: 0, expresiva: 0, sustancial: 0 };
    const factual = factuales ? ngramaEsFactual(p, factuales) : false;
    const expresiva = factual ? 0 : 100;
    return { total: 100, expresiva, sustancial: expresiva };
  }
  const cantidad = palabras.length - NGRAM_SIZE + 1;
  const matched: boolean[] = [];
  const expresivo: boolean[] = [];
  for (let i = 0; i < cantidad; i++) {
    const ngrama = palabras.slice(i, i + NGRAM_SIZE).join(' ');
    const ok = fuenteNormalizada.includes(ngrama);
    matched.push(ok);
    expresivo.push(ok && (!factuales || !ngramaEsFactual(ngrama, factuales)));
  }
  // Copia sustancial = racha de n-gramas consecutivos coincidentes que
  // contiene al menos un n-grama no factual. Las rachas cuentan aunque
  // algunos de sus n-gramas sean hechos (cifras/nombres): una frase
  // calcada que incluye una cifra sigue siendo copia. Una racha hecha
  // SOLO de hechos (fecha+lugar+cifra) no es copia expresiva.
  const enRachaSustancial = new Array<boolean>(cantidad).fill(false);
  let i = 0;
  while (i < cantidad) {
    if (!matched[i]) { i++; continue; }
    let j = i;
    while (j + 1 < cantidad && matched[j + 1]) j++;
    // Racha mínima: ≥2 n-gramas consecutivos (≥6 palabras calcadas).
    // Un 5-grama aislado es terminología/fórmula, no copia sustancial.
    if (j > i && expresivo.slice(i, j + 1).some(Boolean)) {
      for (let k = i; k <= j; k++) enRachaSustancial[k] = true;
    }
    i = j + 1;
  }
  const total = matched.filter(Boolean).length;
  const expresiva = expresivo.filter(Boolean).length;
  return {
    total: Math.round((total / cantidad) * 100),
    expresiva: Math.round((expresiva / cantidad) * 100),
    sustancial: Math.round((enRachaSustancial.filter(Boolean).length / cantidad) * 100),
  };
}

/** API 2.1.1: porcentaje literal, sin interpretación de plagio. */
export function similitudParrafo(parrafo: string, fuenteNormalizada: string): number {
  return medirSimilitud(parrafo, fuenteNormalizada).total;
}

/**
 * Analiza el contenido párrafo por párrafo contra la fuente original.
 */
export function analyzeTranscriptionByParagraph(
  contenidoHtml: string,
  fuenteOriginal: string,
): TranscriptionReport {
  const fuenteNormalizada = normalizar(stripHtml(fuenteOriginal));
  const factuales = extraerTokensFactuales(fuenteOriginal);
  const parrafosRaw = contenidoHtml
    .split(/<\/p>|\n\s*\n/i)
    .map((p) => stripHtml(p))
    .filter((p) => p.split(/\s+/).filter(Boolean).length >= 8);

  const parrafos: ParagraphTranscription[] = parrafosRaw.map((p, i) => {
    const { total, expresiva, sustancial } = medirSimilitud(p, fuenteNormalizada, factuales);
    // REESCRIBIR solo cuando hay copia EXPRESIVA SUSTANCIAL: rachas de
    // prosa calcada de la fuente. Coincidencias aisladas de 5 palabras
    // son terminología oficial/fórmulas, no plagio → nunca BLOQUEAR;
    // coincidencia factual alta → REVISAR para que el editor confirme.
    const veredicto: ParagraphTranscription['veredicto'] =
      sustancial > PARAGRAPH_SIMILARITY_THRESHOLD || (total >= 90 && p.split(/\s+/).length >= 40 && sustancial > 20)
        ? 'REESCRIBIR'
        : total > PARAGRAPH_SIMILARITY_THRESHOLD && (expresiva > 30 || sustancial > 10)
        ? 'REVISAR'
        : 'OK';
    return {
      indice: i + 1,
      extracto: p.length > 120 ? `${p.slice(0, 117)}...` : p,
      similitud: total,
      similitudExpresiva: expresiva,
      similitudSustancial: sustancial,
      veredicto,
    };
  });

  const similitudes = parrafos.map((p) => p.similitud);
  const expresivas = parrafos.map((p) => p.similitudExpresiva);
  const sustanciales = parrafos.map((p) => p.similitudSustancial);
  return {
    parrafos,
    parrafosParaReescribir: parrafos.filter((p) => p.veredicto === 'REESCRIBIR').length,
    parrafosParaRevisar: parrafos.filter((p) => p.veredicto === 'REVISAR').length,
    similitudPromedio: similitudes.length
      ? Math.round(similitudes.reduce((a, b) => a + b, 0) / similitudes.length)
      : 0,
    similitudMaxima: similitudes.length ? Math.max(...similitudes) : 0,
    similitudExpresivaPromedio: expresivas.length
      ? Math.round(expresivas.reduce((a, b) => a + b, 0) / expresivas.length)
      : 0,
    similitudExpresivaMaxima: expresivas.length ? Math.max(...expresivas) : 0,
    similitudSustancialPromedio: sustanciales.length
      ? Math.round(sustanciales.reduce((a, b) => a + b, 0) / sustanciales.length)
      : 0,
    similitudSustancialMaxima: sustanciales.length ? Math.max(...sustanciales) : 0,
  };
}

/**
 * Convierte el reporte en issues del Quality Gate (uno por párrafo copiado).
 */
export function detectParagraphTranscription(
  contenidoHtml: string,
  fuenteOriginal?: string,
): { issues: QualityGateIssue[]; report: TranscriptionReport | null } {
  if (!fuenteOriginal || !fuenteOriginal.trim()) {
    return { issues: [], report: null };
  }

  const report = analyzeTranscriptionByParagraph(contenidoHtml, fuenteOriginal);
  const issues: QualityGateIssue[] = report.parrafos
    .filter((p) => p.veredicto !== 'OK')
    .map((p) =>
      p.veredicto === 'REESCRIBIR'
        ? {
            categoria: 'originalidad' as const,
            severidad: 'warning' as const,
            mensaje: `REVISAR similitud sustancial en el párrafo ${p.indice}: ${p.similitud}% literal, ${p.similitudExpresiva}% fuera de tokens identificados como nombres o cifras. Comparar atribución, citas y extensión con la fuente. La coincidencia no demuestra plagio ni falsedad.`,
            evidencia: p.extracto,
            corregible: false,
          }
        : {
            categoria: 'originalidad' as const,
            severidad: 'warning' as const,
            mensaje: `REVISAR el párrafo ${p.indice}: coincidencia literal ${p.similitud}% y coincidencia fuera de nombres/cifras ${p.similitudExpresiva}%. Verificar si son fórmulas factuales, cita atribuida o reproducción extensa. No es una verificación de originalidad.`,
            evidencia: p.extracto,
            corregible: false,
          },
    );

  return { issues, report };
}
