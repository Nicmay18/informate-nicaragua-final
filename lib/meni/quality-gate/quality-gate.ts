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
  detectTitleRepetition,
} from './validator';
import { applyAutoFix } from './autoFix';
import { findGenerationDefects } from '@/lib/editorial/content-integrity';
import { computeExplanationIndex, computeOriginalityPercent, computeEditorScore } from './editorScore';
import { detectParagraphTranscription } from './transcription-detector';
import { logger } from '@/lib/logger';

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
  const useSource = input.sourceOfTruth != null;
  const perfil = input.perfil || input.categoria;

  const explanationIndexBase = computeExplanationIndex(textoPlano, input.fuenteOriginal, perfil);
  const explanationIndex = useSource && input.sourceOfTruth?.explanationIndex
    ? { ...explanationIndexBase, ...input.sourceOfTruth.explanationIndex }
    : explanationIndexBase;

  let issues: QualityGateIssue[] = [
    ...detectInternalContradictions(entidades, textoPlano),
    ...detectChronologyIssues(textoPlano),
    ...detectDuplicateParagraphs(input.contenido),
    ...detectTerminologyVariants(textoPlano),
    ...detectUnsupportedClaims(textoPlano),
    ...detectFillerLanguage(textoPlano),
    ...detectSensationalism(textoPlano, perfil),
    ...detectTitleRepetition(input.titulo, perfil, input.titulosPrevios),
  ];

  // Detector de transcripción párrafo a párrafo (requiere fuente original)
  const transcription = detectParagraphTranscription(input.contenido, input.fuenteOriginal);

  if (input.stage === 'POST_LLM' && !useSource) {
    // Solo cuando no hay fuente de verdad editorial se evalúan estos criterios aquí.
    issues = [...issues, ...detectServiceValue(perfil, textoPlano)];
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
  let issuesRestantes = issues.filter((i) => !(i.corregible && categoriasCorregidas.has(i.categoria)));

  // Barrera de defectos mecánicos de generación (content-integrity).
  // Corre sobre el texto YA corregido + título: lo que realmente se publicaría.
  // BLOCK → bloquea sin importar la fuente de verdad; REVIEW → issue warning.
  const mechDefects = findGenerationDefects(`${input.titulo}\n${textoCorregido}`);
  // Learning 4.0 (FASE 7): un defecto presente SOLO tras el autofix es
  // auto-inducido — el pipeline corrompió su propio texto (firma del caso
  // CONCAT_MOTOCICLETA). Se reporta en `selfInducedDefects` para memoria de
  // falsos positivos; el bloqueo NO se relaja (el texto corregido sí está
  // defectuoso y es el que se publicaría).
  const preAutofixDefects = new Set(
    findGenerationDefects(`${input.titulo}\n${textoPlano}`).map((d) => d.code),
  );
  const selfInducedDefects = mechDefects
    .filter((d) => !preAutofixDefects.has(d.code))
    .map((d) => d.code);
  const mechBlocking = mechDefects.filter((d) => d.action === 'BLOCK');
  issuesRestantes = [
    ...issuesRestantes,
    ...mechDefects.map((d): QualityGateIssue => ({
      categoria: 'defecto_mecanico',
      severidad: d.action === 'BLOCK' ? 'blocking' : 'warning',
      mensaje: d.desc,
      evidencia: d.code,
      corregible: false,
    })),
  ];

  // Si Editorial Brain ya decidió, usamos su veredicto y no volvemos a calcular originalidad/score.
  let originalidadPorcentaje: number;
  let editorScore: number;
  let bloqueado: boolean;
  let motivosBloqueo: string[];
  const mechMotivos = mechBlocking.map(
    (d) => `Defecto mecánico de generación: ${d.desc} (${d.code})`,
  );
  if (useSource) {
    originalidadPorcentaje = input.sourceOfTruth!.originalidad;
    editorScore = input.sourceOfTruth!.score;
    // La decisión editorial no puede desbloquear un defecto mecánico: si el
    // texto final contiene un defecto BLOCK, la pieza queda bloqueada igual.
    bloqueado = input.sourceOfTruth!.bloqueado || mechBlocking.length > 0;
    motivosBloqueo = mechMotivos;
  } else {
    originalidadPorcentaje = computeOriginalityPercent(explanationIndex, input.contenido);
    const scoreResult = computeEditorScore(issuesRestantes, explanationIndex, originalidadPorcentaje);
    editorScore = scoreResult.score;
    bloqueado = scoreResult.bloqueado || mechBlocking.length > 0;
    motivosBloqueo = [...scoreResult.motivosBloqueo, ...mechMotivos];
  }

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
    editorScore,
    textoCorregido,
    transcriptionReport: transcription.report ?? undefined,
    ...(selfInducedDefects.length > 0 ? { selfInducedDefects } : {}),
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
      logger.warn('[quality-gate] Error escribiendo a Firestore meni_quality_history:', err);
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
