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

/**
 * MENI 2.1.1 §6 — Llamado, anuncio y decisión no son lo mismo.
 * "GRUN llama a padres a supervisar Internet de menores" es un llamado
 * institucional: no existe cambio normativo y exigir "¿Qué cambia?" /
 * "¿A quién afecta?" obligaría a inventar consecuencias. Solo se exigen
 * preguntas de cambio cuando la fuente describe realmente un cambio.
 */
const SENALES_LLAMADO = /\b(?:llama(?:n)?\s+a|hace\s+un\s+llamado|exhorta(?:n)?|insta(?:n|r|r[aá]n?|ron)?\s+a|urge\s+a|recomienda(?:n)?|invita(?:n)?\s+a|conmina(?:n)?|pide(?:n)?|solicita(?:n)?|orienta(?:n)?|exhortaci[oó]n)\b/i;
const SENALES_CAMBIO = /\b(?:aprueba(?:n)?|aprob[oó]|decreta(?:n)?|decret[oó]|entr(?:a|ar[aá]|aron)\s+en\s+vigencia|en\s+vigencia|vigente|regulaci[oó]n|regula(?:n|r)|nueva\s+(?:ley|norma|medida)|reforma|sanci[oó]n|proh[ií]be(?:n)?|obliga(?:n|r[aá])|establece(?:n|r)|decisi[oó]n|suspende(?:n)?|aumenta(?:n)?|reduce(?:n)?|eleva(?:n)?|modifica(?:n)?|inaugura(?:n)?|implementa(?:n)?|lanza(?:n)?\s+(?:un\s+)?(?:plan|programa|proyecto|campaña)|crea(?:n)?\s+(?:el|la|un|una))\b/i;

export function detectarActoComunicativo(texto: string): 'llamado' | 'cambio' | 'hecho' {
  const esLlamado = SENALES_LLAMADO.test(texto);
  const hayCambio = SENALES_CAMBIO.test(texto);
  if (esLlamado && !hayCambio) return 'llamado';
  if (hayCambio) return 'cambio';
  return 'hecho';
}

/** Preguntas que solo aplican cuando la fuente describe un cambio real. */
function esPreguntaDeCambio(pregunta: string): boolean {
  const p = pregunta.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  return /que cambia|a quien beneficia|a quien afecta|que sigue|implementacion|vigencia|como afecta|afectados/.test(p);
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

  // MENI 2.1.1 §6 — si el acto comunicativo es un llamado/instancia sin
  // cambio normativo real, las preguntas de consecuencia ("¿Qué cambia?",
  // "¿A quién afecta?", "¿Qué sigue?") se registran como NO APLICABLES:
  // exigirlas obligaría a inventar consecuencias que la fuente no da.
  const textoCompleto = [input.titulo, input.resumen, input.contenido].filter(Boolean).join(' ');
  const acto = detectarActoComunicativo(textoCompleto);

  const preguntas: ReaderQuestion[] = profile.preguntasEditor.map(p => {
    const aplicable = acto !== 'llamado' || !esPreguntaDeCambio(p);
    return {
      pregunta: p,
      obligatoria: aplicable,
      respondida: false,
      aplicabilidad: (aplicable ? 'aplicable' : 'no_aplicable') as ReaderQuestion['aplicabilidad'],
    };
  });

  const preguntasObligatorias = preguntas.filter(p => p.obligatoria).map(p => p.pregunta);
  const preguntasNoAplicables = preguntas.filter(p => !p.obligatoria).map(p => p.pregunta);
  const preguntasOpcionales: string[] = [];

  const score = Math.min(60 + preguntasObligatorias.length * 5, 100);

  return { preguntas, preguntasObligatorias, preguntasOpcionales, preguntasNoAplicables, score };
}
