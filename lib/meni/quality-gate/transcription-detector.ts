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
  veredicto: 'OK' | 'REESCRIBIR';
}

export interface TranscriptionReport {
  parrafos: ParagraphTranscription[];
  parrafosParaReescribir: number;
  similitudPromedio: number;
  similitudMaxima: number;
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
 * Similitud por n-gramas de palabras: % de n-gramas del párrafo que
 * aparecen literalmente en la fuente.
 */
export function similitudParrafo(parrafo: string, fuenteNormalizada: string): number {
  const palabras = normalizar(parrafo).split(' ').filter(Boolean);
  if (palabras.length < NGRAM_SIZE) {
    // Párrafos muy cortos: comparar completo
    const p = palabras.join(' ');
    return p.length > 0 && fuenteNormalizada.includes(p) ? 100 : 0;
  }
  let coincidencias = 0;
  const total = palabras.length - NGRAM_SIZE + 1;
  for (let i = 0; i < total; i++) {
    const ngrama = palabras.slice(i, i + NGRAM_SIZE).join(' ');
    if (fuenteNormalizada.includes(ngrama)) coincidencias++;
  }
  return Math.round((coincidencias / total) * 100);
}

/**
 * Analiza el contenido párrafo por párrafo contra la fuente original.
 */
export function analyzeTranscriptionByParagraph(
  contenidoHtml: string,
  fuenteOriginal: string,
): TranscriptionReport {
  const fuenteNormalizada = normalizar(stripHtml(fuenteOriginal));
  const parrafosRaw = contenidoHtml
    .split(/<\/p>/i)
    .map((p) => stripHtml(p))
    .filter((p) => p.split(/\s+/).filter(Boolean).length >= 8);

  const parrafos: ParagraphTranscription[] = parrafosRaw.map((p, i) => {
    const similitud = similitudParrafo(p, fuenteNormalizada);
    return {
      indice: i + 1,
      extracto: p.length > 120 ? `${p.slice(0, 117)}...` : p,
      similitud,
      veredicto: similitud > PARAGRAPH_SIMILARITY_THRESHOLD ? 'REESCRIBIR' : 'OK',
    };
  });

  const similitudes = parrafos.map((p) => p.similitud);
  return {
    parrafos,
    parrafosParaReescribir: parrafos.filter((p) => p.veredicto === 'REESCRIBIR').length,
    similitudPromedio: similitudes.length
      ? Math.round(similitudes.reduce((a, b) => a + b, 0) / similitudes.length)
      : 0,
    similitudMaxima: similitudes.length ? Math.max(...similitudes) : 0,
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
    .filter((p) => p.veredicto === 'REESCRIBIR')
    .map((p) => ({
      categoria: 'originalidad' as const,
      severidad: 'blocking' as const,
      mensaje: `Párrafo ${p.indice} es ${p.similitud}% igual a la fuente (máximo ${PARAGRAPH_SIMILARITY_THRESHOLD}%). REESCRIBIR con explicación y contexto propio.`,
      evidencia: p.extracto,
      corregible: false,
    }));

  return { issues, report };
}
