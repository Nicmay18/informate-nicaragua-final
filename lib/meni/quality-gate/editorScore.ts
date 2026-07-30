/**
 * MENI Quality Gate — Editor Score
 * ================================
 * Calcula el score final del Quality Gate y decide si bloquea.
 */

import type { ExplanationIndex, QualityGateIssue } from './types';
import { MAX_TRANSCRIPTION_PERCENT, MIN_ORIGINALITY_PERCENT } from './rules';
import { getPerfilEditorial } from '../editorial-profiles';

function getPatronesCategoria(categoria: string, textoPlano: string) {
  return getPerfilEditorial(categoria, textoPlano);
}

function calcularPorcentajePatrones(lower: string, patrones: RegExp[]): number {
  let porcentaje = 0;
  const paso = Math.floor(100 / patrones.length);
  for (const p of patrones) {
    if (p.test(lower)) porcentaje += paso;
  }
  return Math.min(porcentaje, 100);
}

export function computeExplanationIndex(textoPlano: string, fuenteOriginal?: string, categoria?: string): ExplanationIndex {
  const lower = textoPlano.toLowerCase();
  const patrones = getPatronesCategoria(categoria || '', textoPlano);

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

  const porcentajeContexto = calcularPorcentajePatrones(lower, patrones.contexto);
  const porcentajeExplicacion = calcularPorcentajePatrones(lower, patrones.explicacion);
  const porcentajeServicio = calcularPorcentajePatrones(lower, patrones.servicio);

  return { porcentajeTranscripcion, porcentajeContexto, porcentajeExplicacion, porcentajeServicio };
}

export function computeOriginalityPercent(explanationIndex: ExplanationIndex, textoHtml?: string): number {
  const { porcentajeTranscripcion, porcentajeContexto, porcentajeExplicacion, porcentajeServicio } = explanationIndex;

  const reescritura = 100 - porcentajeTranscripcion;

  let organizacion = 0;
  if (textoHtml) {
    if (/<h2/i.test(textoHtml)) organizacion += 50;
    if (/<h3/i.test(textoHtml)) organizacion += 25;
    const parrafos = textoHtml.split(/<\/p>/i).filter(p => p.replace(/<[^>]+>/g, '').trim().length > 30);
    if (parrafos.length >= 4) organizacion += 25;
  } else {
    organizacion = 50;
  }
  organizacion = Math.min(organizacion, 100);

  const diferenciacion = Math.min(
    Math.round((porcentajeContexto + porcentajeExplicacion + porcentajeServicio) / 3),
    100
  );

  const originalidad = Math.round(
    porcentajeExplicacion * 0.25 +
    porcentajeContexto * 0.20 +
    porcentajeServicio * 0.20 +
    diferenciacion * 0.15 +
    organizacion * 0.10 +
    reescritura * 0.10
  );

  let resultado = Math.max(0, Math.min(originalidad, 100));
  if (porcentajeTranscripcion < 20) resultado = Math.max(resultado, 70);

  return resultado;
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
