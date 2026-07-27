/**
 * MENI Quality Gate — Orquestador
 * ===============================
 * Único punto de entrada. Se ejecuta antes del LLM (sobre la fuente) y
 * después del LLM (sobre el artículo generado). Intenta corregir
 * automáticamente antes de bloquear.
 *
 * Texto → Analizador MENI → Intelligence Engine → Quality Gate →
 * Correcciones automáticas → LLM redacta → Revisión final MENI → Publicar
 */

import type { QualityGateInput, QualityGateIssue, QualityGateResult } from './types';
import {
  extractEntities,
  stripHtml,
  detectInternalContradictions,
  detectCrossContradictions,
  detectChronologyIssues,
  detectDuplicateParagraphs,
  detectTerminologyVariants,
  detectUnsupportedClaims,
  detectFillerLanguage,
  detectSensationalism,
  detectServiceValue,
  detectDifferentialValue,
} from './validator';
import { applyAutoFix } from './autoFix';
import { computeExplanationIndex, computeOriginalityPercent, computeEditorScore } from './editorScore';
import { detectParagraphTranscription } from './transcription-detector';

export type { EntityMap, QualityGateInput, QualityGateIssue, QualityGateResult } from './types';

function estimarCtrFacebook(titulo: string, textoPlano: string): number {
  let ctr = 40;
  if (titulo.length >= 40 && titulo.length <= 90) ctr += 15;
  if (/\?$/.test(titulo.trim())) ctr += 10;
  if (/\d/.test(titulo)) ctr += 10;
  if (textoPlano.split(/\s+/).filter(Boolean).length >= 300) ctr += 10;
  return Math.min(ctr, 100);
}

function discoverListo(titulo: string, contenidoHtml: string): boolean {
  const tieneH2 = /<h2/i.test(contenidoHtml);
  const tituloOk = titulo.length >= 40 && titulo.length <= 90;
  const parrafos = contenidoHtml.split(/<\/p>/i).filter((p) => stripHtml(p).length > 20);
  return tieneH2 && tituloOk && parrafos.length >= 3;
}

export function runQualityGate(input: QualityGateInput, porQueLeerAqui?: string): QualityGateResult {
  const textoPlano = stripHtml(`${input.titulo} ${input.contenido}`);
  const entidades = extractEntities(textoPlano);

  let issues: QualityGateIssue[] = [
    ...detectInternalContradictions(entidades),
    ...detectChronologyIssues(textoPlano),
    ...detectDuplicateParagraphs(input.contenido),
    ...detectTerminologyVariants(textoPlano),
    ...detectUnsupportedClaims(textoPlano),
    ...detectFillerLanguage(textoPlano),
    ...detectSensationalism(textoPlano),
  ];

  // Detector de transcripción párrafo a párrafo (requiere fuente original)
  const transcription = detectParagraphTranscription(input.contenido, input.fuenteOriginal);

  if (input.stage === 'POST_LLM') {
    issues = [...issues, ...detectServiceValue(textoPlano)];
    issues = [...issues, ...transcription.issues];
    if (porQueLeerAqui !== undefined) {
      issues = [...issues, ...detectDifferentialValue(porQueLeerAqui)];
    }
    if (input.entidadesPrevias) {
      issues = [...issues, ...detectCrossContradictions(input.entidadesPrevias, entidades)];
    }
  }

  // Intentar corregir automáticamente antes de bloquear.
  const { textoCorregido, corregidos } = applyAutoFix(input.contenido, issues);

  // Re-validar sobre el texto corregido (solo lo corregible desaparece).
  const categoriasCorregidas = new Set(corregidos.map((c) => c.categoria));
  const issuesRestantes = issues.filter((i) => !(i.corregible && categoriasCorregidas.has(i.categoria)));

  const explanationIndex = computeExplanationIndex(textoPlano, input.fuenteOriginal);
  const originalidadPorcentaje = computeOriginalityPercent(explanationIndex);
  const { score, bloqueado, motivosBloqueo } = computeEditorScore(
    issuesRestantes,
    explanationIndex,
    originalidadPorcentaje
  );

  return {
    stage: input.stage,
    entidades,
    issues: issuesRestantes,
    corregidos,
    bloqueado,
    motivosBloqueo,
    explanationIndex,
    originalidadPorcentaje,
    ctrEstimadoFacebook: estimarCtrFacebook(input.titulo, textoPlano),
    discoverListo: discoverListo(input.titulo, textoCorregido),
    editorScore: score,
    textoCorregido,
    transcriptionReport: transcription.report ?? undefined,
    timestamp: new Date().toISOString(),
  };
}

export async function appendQualityGateHistory(
  result: QualityGateResult,
  meta: { titulo: string; categoria: string },
  db?: import('firebase-admin/firestore').Firestore
) {
  const entry = {
    titulo: meta.titulo,
    categoria: meta.categoria,
    stage: result.stage,
    detectado: result.issues.map((i) => i.mensaje),
    corregido: result.corregidos.map((c) => c.descripcion),
    bloqueado: result.bloqueado,
    motivosBloqueo: result.motivosBloqueo,
    score: result.editorScore,
    timestamp: result.timestamp,
  };

  // Producción: persistir en Firestore meni_quality_history.
  if (db) {
    try {
      await db.collection('meni_quality_history').add(entry);
      return;
    } catch (err) {
      console.warn('[quality-gate] Error escribiendo a Firestore meni_quality_history:', err);
    }
  }

  // Desarrollo local: fallback a JSON si no hay db o Firestore falla.
  try {
    if (typeof window !== 'undefined') return;
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'meni-history.json');

    let history: unknown[] = [];
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      history = JSON.parse(raw);
      if (!Array.isArray(history)) history = [];
    } catch {
      history = [];
    }

    history.push(entry);
    if (history.length > 500) history = history.slice(history.length - 500);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(history, null, 2), 'utf-8');
  } catch {
    // No bloquear el flujo editorial.
  }
}
