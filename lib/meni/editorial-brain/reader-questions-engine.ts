/**
 * Reader Questions Engine
 * =======================
 * Detecta automáticamente las preguntas que tendrá el lector
 * según el tipo de hecho. No analiza texto generado.
 * Analiza el HECHO y genera preguntas obligatorias.
 */

import type { EditorialBrainInput, ReaderQuestionsDecision, ReaderQuestion } from './types';
import { getCategoryProfile } from './profiles';

// PREGUNTAS_POR_TIPO legado eliminado: ahora las evidencias requerdas salen
// exclusivamente del perfil editorial detectado (recalibracion 2.1.1).
export function runReaderQuestionsEngine(input: EditorialBrainInput): ReaderQuestionsDecision {
  const categoria = input.categoriaSugerida || input.categoria || 'General';
  const profile = getCategoryProfile(categoria);

  // REGLA DE RECALIBRACION 2.1.1:
  // Las evidencias requeridas son exclusivas del perfil detectado.
  // No se mezclan preguntas de otros perfiles (clima, economia, etc.)
  // salvo que la categoria no tenga un perfil especifico.
  const preguntas: ReaderQuestion[] = profile.preguntasEditor.map(p => ({
    pregunta: p,
    obligatoria: true,
    respondida: false,
  }));

  const preguntasObligatorias = preguntas.map(p => p.pregunta);
  const preguntasOpcionales: string[] = [];

  const score = Math.min(60 + preguntasObligatorias.length * 5, 100);

  return { preguntas, preguntasObligatorias, preguntasOpcionales, score };
}
