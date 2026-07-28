/**
 * MENI Editorial Reason — Razón editorial
 * =========================================
 * Cuando MENI aprueba o rechaza una nota, no solo da un número.
 * Explica por qué en lenguaje natural, auditable y útil para entrenar redactores.
 */

import type { EditorialTier, TierThresholds } from './editorial-tiers';
import type { EditorialDnaResult } from './editorial-dna/types';
import type { QualityGateResult } from './quality-gate/types';

export interface EditorialReason {
  aprobado: boolean;
  tier: EditorialTier;
  resumen: string;
  puntosPositivos: string[];
  puntosMejora: string[];
  bloqueadores: string[];
}

export function buildEditorialReason(opts: {
  aprobado: boolean;
  tier: EditorialTier;
  thresholds: TierThresholds;
  editorialDna: EditorialDnaResult;
  qualityGate: QualityGateResult;
  palabras: number;
  categoria: string;
}): EditorialReason {
  const { aprobado, tier, thresholds, editorialDna, qualityGate, palabras, categoria } = opts;
  const puntosPositivos: string[] = [];
  const puntosMejora: string[] = [];
  const bloqueadores: string[] = [];

  // ─── Análisis de dimensiones ADN NI ───
  if (editorialDna.exclusividad.score >= thresholds.minExclusividad) {
    puntosPositivos.push(
      `aporta valor diferencial que otros medios no incluyen (exclusividad: ${editorialDna.exclusividad.score}%)`
    );
  } else {
    puntosMejora.push(
      `valor diferencial bajo (${editorialDna.exclusividad.score}%, mínimo para ${tier}: ${thresholds.minExclusividad}%)`
    );
    if (editorialDna.exclusividad.bloquear && !aprobado) {
      bloqueadores.push(editorialDna.exclusividad.razon || 'Exclusividad insuficiente.');
    }
  }

  if (editorialDna.wow.score >= thresholds.minWow) {
    puntosPositivos.push(
      `el lector aprende algo nuevo (WOW index: ${editorialDna.wow.score}%)`
    );
  } else {
    puntosMejora.push(
      `WOW index bajo (${editorialDna.wow.score}%, mínimo para ${tier}: ${thresholds.minWow}%)`
    );
    if (editorialDna.wow.bloquear && !aprobado) {
      bloqueadores.push(editorialDna.wow.razon || 'WOW index insuficiente.');
    }
  }

  // ─── Transcripción / originalidad ───
  const transcripcionPct = qualityGate.explanationIndex?.porcentajeTranscripcion ?? 0;
  if (transcripcionPct <= thresholds.maxTranscripcion) {
    puntosPositivos.push(
      `mantiene baja similitud con la fuente (${transcripcionPct}% transcripción, máximo ${thresholds.maxTranscripcion}%)`
    );
  } else {
    puntosMejora.push(
      `alta similitud con la fuente (${transcripcionPct}%, máximo ${thresholds.maxTranscripcion}%)`
    );
    if (!aprobado) {
      bloqueadores.push('El texto se parece demasiado a la fuente original. Reescribir párrafos.');
    }
  }

  // ─── Contexto ───
  const tieneContexto = editorialDna.selloNI.contextualiza >= 50;
  if (thresholds.exigeContexto) {
    if (tieneContexto) {
      puntosPositivos.push('incorpora antecedentes y contexto relacionado');
    } else {
      puntosMejora.push('faltan antecedentes y contexto sobre el tema');
    }
  }

  // ─── Service value ───
  const tieneServicio = editorialDna.selloNI.servicio >= 50;
  if (thresholds.exigeServiceValue) {
    if (tieneServicio) {
      puntosPositivos.push('responde qué significa o qué hacer para el lector');
    } else {
      puntosMejora.push('no responde qué significa, qué cambia o qué hacer');
    }
  }

  // ─── Story completeness ───
  const selloPromedio = Math.round(
    Object.values(editorialDna.selloNI).reduce((a, b) => a + b, 0) / Object.keys(editorialDna.selloNI).length
  );
  if (selloPromedio >= 70) {
    puntosPositivos.push(`sello editorial Nicaragua Informate sólido (${selloPromedio}%)`);
  } else if (selloPromedio < 50) {
    puntosMejora.push(`sello editorial débil (${selloPromedio}%)`);
  }

  // ─── Quality gate issues ───
  const blockingIssues = qualityGate.issues.filter((i) => i.severidad === 'blocking');
  const warnings = qualityGate.issues.filter((i) => i.severidad === 'warning');
  if (blockingIssues.length > 0) {
    for (const issue of blockingIssues) {
      bloqueadores.push(issue.mensaje);
    }
  }
  if (warnings.length > 0) {
    puntosMejora.push(`${warnings.length} advertencia(s) menor(es) detectada(s)`);
  }

  // ─── Palabras ───
  if (palabras >= thresholds.minPalabras) {
    puntosPositivos.push(`extensión adecuada (${palabras} palabras, mínimo ${thresholds.minPalabras})`);
  } else {
    puntosMejora.push(`extensión corta (${palabras} palabras, mínimo ${thresholds.minPalabras} para ${tier})`);
  }

  // ─── Resumen ───
  let resumen: string;
  if (aprobado) {
    const razones = puntosPositivos.slice(0, 5);
    resumen = `Esta nota fue aprobada como ${tier} (${categoria}) porque ${razones.join('; ')}.`;
    if (puntosMejora.length > 0) {
      resumen += ` Puntos de mejora: ${puntosMejora.join('; ')}.`;
    }
  } else {
    resumen = `Esta nota fue rechazada como ${tier} (${categoria}). `;
    if (bloqueadores.length > 0) {
      resumen += `Bloqueadores: ${bloqueadores.join('; ')}.`;
    }
    if (puntosMejora.length > 0) {
      resumen += ` Puntos de mejora: ${puntosMejora.join('; ')}.`;
    }
  }

  return {
    aprobado,
    tier,
    resumen,
    puntosPositivos,
    puntosMejora,
    bloqueadores,
  };
}
