/**
 * Intelligence Engine — Orquestador
 * =================================
 * Ejecuta los 9 motores y devuelve un IntelligenceResult con todas las decisiones.
 * El LLM solo ejecuta; las decisiones vienen del código.
 */

import type { IntelligenceEngineInput, IntelligenceResult } from './types';
import { runContextEngine } from './context-engine';
import { runReaderValueEngine } from './reader-value-engine';
import { runOriginalityEngine } from './originality-engine';
import { runStructureEngine } from './structure-engine';
import { runClarityEngine } from './clarity-engine';
import { runAngleEngine } from './angle-engine';
import { runBackgroundEngine } from './background-engine';
import { runFacebookEngine } from './facebook-engine';
import { runGoogleEngine } from './google-engine';

export function runIntelligenceEngine(input: IntelligenceEngineInput): IntelligenceResult {
  const context = runContextEngine(input);
  const readerValue = runReaderValueEngine(input);
  const originality = runOriginalityEngine(input);
  const structure = runStructureEngine(input);
  const clarity = runClarityEngine(input);
  const angle = runAngleEngine(input);
  const background = runBackgroundEngine(input);
  const facebook = runFacebookEngine(input);
  const google = runGoogleEngine(input);

  const scores = [
    context.score,
    readerValue.score,
    originality.score,
    structure.score,
    clarity.score,
    angle.score,
    background.score,
    facebook.score,
    google.score,
  ];
  const scoreIntelligence = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const bloquear = readerValue.bloquear || originality.veredicto === 'solo_cambia_palabras';
  const motivoBloqueo = readerValue.motivoBloqueo
    || (originality.veredicto === 'solo_cambia_palabras' ? originality.razon : null);

  return {
    context,
    readerValue,
    originality,
    structure,
    clarity,
    angle,
    background,
    facebook,
    google,
    scoreIntelligence,
    bloquear,
    motivoBloqueo,
  };
}

export type { IntelligenceResult, IntelligenceEngineInput } from './types';
