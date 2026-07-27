/**
 * MENI Quality Gate — Editor Score
 * ================================
 * Calcula el score final del Quality Gate y decide si bloquea.
 */

import type { ExplanationIndex, QualityGateIssue } from './types';
import { MAX_TRANSCRIPTION_PERCENT, MIN_ORIGINALITY_PERCENT } from './rules';

export function computeExplanationIndex(textoPlano: string, fuenteOriginal?: string): ExplanationIndex {
  const lower = textoPlano.toLowerCase();

  let porcentajeTranscripcion = 0;
  if (fuenteOriginal) {
    const fuenteLower = fuenteOriginal.toLowerCase();
    const palabras = lower.split(/\s+/).filter(Boolean);
    const ventana = 5;
    let coincidencias = 0;
    for (let i = 0; i <= palabras.length - ventana; i++) {
      const ngrama = palabras.slice(i, i + ventana).join(' ');
      if (fuenteLower.includes(ngrama)) coincidencias++;
    }
    const total = Math.max(palabras.length - ventana, 1);
    porcentajeTranscripcion = Math.round((coincidencias / total) * 100);
  }

  let porcentajeContexto = 0;
  if (/\bantecedente|\bcontexto\b|\bprevio\b|\banterior\b|\bhistoria\b/i.test(lower)) porcentajeContexto += 40;
  if (/\bporque\b|\bdebido a\b|\bcomo resultado\b|\bcausa\b/i.test(lower)) porcentajeContexto += 30;
  if (/\bconsecuencia\b|\bimpacto\b|\bafectación\b/i.test(lower)) porcentajeContexto += 30;
  porcentajeContexto = Math.min(porcentajeContexto, 100);

  let porcentajeExplicacion = 0;
  if (/\bqué\s+significa\b|\bcómo\s+funciona\b|\bqué\s+es\b/i.test(lower)) porcentajeExplicacion += 35;
  if (/\bes decir\b|\bo sea\b|\ben otras palabras\b/i.test(lower)) porcentajeExplicacion += 30;
  if (/\besto significa que\b|\blo que quiere decir\b/i.test(lower)) porcentajeExplicacion += 35;
  porcentajeExplicacion = Math.min(porcentajeExplicacion, 100);

  let porcentajeServicio = 0;
  if (/\bqué\s+hacer\b|\bcómo\s+afecta\b|\bqué\s+cambia\b/i.test(lower)) porcentajeServicio += 40;
  if (/\bprevención\b|\brecomendaci[oó]n/i.test(lower)) porcentajeServicio += 30;
  if (/\bautoridades\s+(informaron|indicaron|explicaron|dijeron)\b/i.test(lower)) porcentajeServicio += 30;
  porcentajeServicio = Math.min(porcentajeServicio, 100);

  return { porcentajeTranscripcion, porcentajeContexto, porcentajeExplicacion, porcentajeServicio };
}

export function computeOriginalityPercent(explanationIndex: ExplanationIndex): number {
  const { porcentajeTranscripcion, porcentajeContexto, porcentajeExplicacion } = explanationIndex;
  let originalidad = 100 - porcentajeTranscripcion;
  originalidad = Math.round((originalidad + porcentajeContexto + porcentajeExplicacion) / 3);
  return Math.max(0, Math.min(originalidad, 100));
}

export function computeEditorScore(
  issues: QualityGateIssue[],
  explanationIndex: ExplanationIndex,
  originalidadPorcentaje: number
): { score: number; bloqueado: boolean; motivosBloqueo: string[] } {
  let score = 100;
  const motivosBloqueo: string[] = [];

  for (const issue of issues) {
    if (issue.severidad === 'blocking') {
      score -= 20;
      motivosBloqueo.push(issue.mensaje);
    } else if (issue.severidad === 'warning') {
      score -= 8;
    } else {
      score -= 2;
    }
  }

  if (explanationIndex.porcentajeTranscripcion > MAX_TRANSCRIPTION_PERCENT) {
    score -= 15;
    motivosBloqueo.push(
      `Transcripción muy alta (${explanationIndex.porcentajeTranscripcion}%, máximo permitido ${MAX_TRANSCRIPTION_PERCENT}%).`
    );
  }

  if (originalidadPorcentaje < MIN_ORIGINALITY_PERCENT) {
    score -= 10;
  }

  score = Math.max(0, Math.min(score, 100));
  const bloqueado = motivosBloqueo.length > 0;

  return { score, bloqueado, motivosBloqueo };
}
