/**
 * Reader Questions Engine
 * =======================
 * Detecta automáticamente las preguntas que tendrá el lector
 * según el tipo de hecho. No analiza texto generado.
 * Analiza el HECHO y genera preguntas obligatorias.
 *
 * Para Deportes la selección pasa por la capa de clasificación semántica:
 * disciplina → tipo de evento → etapa temporal → estructura competitiva →
 * preguntas aplicables. Las preguntas NO APLICABLES se registran para
 * transparencia pero no se exigen ni penalizan.
 */

import type { EditorialBrainInput, ReaderQuestionsDecision, ReaderQuestion } from './types';
import { getCategoryProfile } from './profiles';
import { deportesProfile } from './profiles/deportes';
import { classifySports, selectSportsQuestions } from '../sports-classifier';

function esDeportes(categoria: string, perfil: string): boolean {
  return /deporte/i.test(categoria) || /deporte/i.test(perfil);
}

export function runReaderQuestionsEngine(input: EditorialBrainInput): ReaderQuestionsDecision {
  const categoria = input.categoriaSugerida || input.categoria || 'General';
  const perfil = input.perfil || categoria;
  const profile = getCategoryProfile(perfil);

  // REGLA DE RECALIBRACION 2.1.1:
  // Las evidencias requeridas son exclusivas del perfil detectado.
  // No se mezclan preguntas de otros perfiles (clima, economia, etc.)
  // salvo que la categoria no tenga un perfil especifico.
  if (esDeportes(categoria, perfil)) {
    const texto = [input.titulo, input.resumen, input.contenido].filter(Boolean).join(' ');
    const clasificacion = classifySports(input.titulo || '', input.contenido || '', input.resumen || '');
    const sel = selectSportsQuestions(clasificacion, deportesProfile.preguntasEditor);
    void texto;

    const preguntas: ReaderQuestion[] = [
      ...sel.aplicables.map(p => ({ pregunta: p, obligatoria: true, respondida: false, aplicabilidad: 'aplicable' as const })),
      ...sel.noAplicables.map(p => ({ pregunta: p, obligatoria: false, respondida: false, aplicabilidad: 'no_aplicable' as const })),
    ];

    return {
      preguntas,
      preguntasObligatorias: sel.aplicables,
      preguntasOpcionales: [],
      preguntasNoAplicables: sel.noAplicables,
      clasificacionDeporte: clasificacion,
      score: Math.min(60 + sel.aplicables.length * 5, 100),
    };
  }

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
