import type { EditorialDecision } from '@/lib/meni/editorial-brain/types';
import type { EvaluacionEditorial } from '@/lib/editorial';
import type { QualityGateResult } from '@/lib/meni/quality-gate/types';
import type { EditorialDnaResult, EditorialDnaDimension, SelloNIDimensions } from './types';
import type { AdnNiWeights, SelloNiWeights, BloqueoThresholds } from '@/lib/meni/editorial-brain/profiles/types';

const MIN_DNA_SCORE = Number(process.env.MENI_MIN_DNA_SCORE || '70');

const DEFAULT_ADN_WEIGHTS: AdnNiWeights = {
  exclusividad: 0.25,
  wow: 0.25,
  selloNI: 0.30,
  transcripcion: 0.15,
  memoria: 0.05,
};

const DEFAULT_SELLO_WEIGHTS: SelloNiWeights = {
  explica: 0.20,
  contextualiza: 0.20,
  servicio: 0.15,
  originalidad: 0.15,
  competencia: 0.10,
  utilidad: 0.10,
  valor: 0.10,
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function makeDimension(score: number, threshold: number, razonBloqueo: string): EditorialDnaDimension {
  return {
    score,
    bloquear: score < threshold,
    razon: score < threshold ? razonBloqueo : null,
  };
}

interface ComputeDnaOptions {
  decision?: Omit<EditorialDecision, 'editorialDna' | 'estadoEditorial' | 'valeLaPenaPublicar' | 'motivoPrincipal' | 'aportaAlLector' | 'diferenciaCompetencia' | 'utilidadReal' | 'explicacion' | 'contexto' | 'servicio' | 'riesgoEditorial' | 'acciones' | 'patronesAplicados' | 'correccionesSugeridas' | 'ranking' | 'saturacion' | 'memoriaEditorial' | 'veredictoEjecutivo'>;
  evaluacion?: EvaluacionEditorial;
  qualityGate?: QualityGateResult;
  memory?: { totalArticles: number };
  minDnaScore?: number;
  minExclusividad?: number;
  minWow?: number;
  pesosAdnNI?: AdnNiWeights;
  pesosSelloNI?: SelloNiWeights;
  umbralesBloqueo?: BloqueoThresholds;
}

export function computeEditorialDNA(opts: ComputeDnaOptions): EditorialDnaResult {
  // Prefer EditorialDecision when available; otherwise fall back to EvaluacionEditorial + QualityGate
  const decision = opts.decision;
  const evaluacion = opts.evaluacion;
  const qualityGate = opts.qualityGate;

  // Umbrales y pesos dinamicos por categoria
  const minExcl = opts.umbralesBloqueo?.exclusividad ?? opts.minExclusividad ?? MIN_DNA_SCORE;
  const minWow = opts.umbralesBloqueo?.wow ?? opts.minWow ?? MIN_DNA_SCORE;
  const minTranscripcion = opts.umbralesBloqueo?.transcripcion ?? MIN_DNA_SCORE;
  const minMemoria = opts.umbralesBloqueo?.memoria ?? 30;
  const pesosAdn = opts.pesosAdnNI ?? DEFAULT_ADN_WEIGHTS;
  const pesosSello = opts.pesosSelloNI ?? DEFAULT_SELLO_WEIGHTS;

  // ═══════════════════════════════════════════════════════════════
  // EXCLUSIVIDAD: ¿hay razón para leer esta nota en NI y no en TN8?
  // ═══════════════════════════════════════════════════════════════
  let exclusividadScore = 50;
  if (decision) {
    const nic = decision.nicaraguaInformate.score;
    const diff = decision.editorialDifference.score;
    const pub = decision.publicValue.score;
    exclusividadScore = clamp((nic * 0.4 + diff * 0.4 + pub * 0.2));
  } else if (evaluacion) {
    exclusividadScore = clamp((evaluacion.valorEditorial?.score ?? 0) * 0.6 + (evaluacion.eeat?.score ?? 0) * 0.4);
  }

  const exclusividad = makeDimension(
    exclusividadScore,
    minExcl,
    'Valor diferencial insuficiente: la nota no da una razón clara para leerla en Nicaragua Informate en lugar de TN8, Canal 4 o La Prensa. Agregá contexto, explicación o utilidad que otros no aportan.'
  );

  // ═══════════════════════════════════════════════════════════════
  // WOW: ¿aprendió algo nuevo el lector?
  // ═══════════════════════════════════════════════════════════════
  let wowScore = 50;
  if (decision) {
    wowScore = clamp((decision.explanation.score * 0.5 + decision.storyCompleteness.score * 0.3 + decision.readerQuestions.score * 0.2));
  } else if (evaluacion) {
    wowScore = clamp((evaluacion.scoreFinal ?? 0) * 0.6 + (evaluacion.discover?.score ?? 0) * 0.2 + (evaluacion.eeat?.score ?? 0) * 0.2);
  }

  const wow = makeDimension(
    wowScore,
    minWow,
    'WOW index bajo: el lector no aprende nada nuevo. La nota solo informa o transcribe. Agregá por qué ocurrió, qué significa, consecuencias y contexto que el lector no sabía.'
  );

  // ═══════════════════════════════════════════════════════════════
  // SELLO NICARAGUA INFORMATE (sub-dimensiones)
  // ═══════════════════════════════════════════════════════════════
  const selloNI: SelloNIDimensions = {
    explica: decision ? decision.explanation.score : (evaluacion?.valorEditorial?.score ?? 50),
    contextualiza: decision ? decision.storyCompleteness.score : (evaluacion?.discover?.score ?? 50),
    servicio: decision ? decision.publicValue.score : (evaluacion?.adsense?.score ?? 50),
    originalidad: decision ? decision.editorialDifference.score : (qualityGate?.originalidadPorcentaje ?? 50),
    competencia: decision ? decision.competition.score : (evaluacion?.valorEditorial?.score ?? 50),
    utilidad: decision ? decision.newsValue.utilidad * 10 : (evaluacion?.eeat?.score ?? 50),
    valor: decision ? decision.newsValue.score : (evaluacion?.scoreFinal ?? 50),
  };

  // Asegurar rango 0-100
  for (const k of Object.keys(selloNI) as (keyof SelloNIDimensions)[]) {
    selloNI[k] = clamp(selloNI[k]);
  }

  // ═══════════════════════════════════════════════════════════════
  // TRANSCRIPCIÓN: qué tanto copia la fuente
  // ═══════════════════════════════════════════════════════════════
  let transcripcionScore = 100;
  if (qualityGate) {
    const originality = qualityGate.originalidadPorcentaje;
    const transcription = qualityGate.explanationIndex?.porcentajeTranscripcion ?? 0;
    // Menos transcripción y más originalidad = mejor
    transcripcionScore = clamp(Math.round(originality * 0.6 + (100 - transcription) * 0.4));
  } else if (decision) {
    // Sin quality gate, asumir moderado basado en diferencia editorial
    transcripcionScore = clamp(decision.editorialDifference.score);
  }

  const transcripcion = makeDimension(
    transcripcionScore,
    minTranscripcion,
    'Alto riesgo de transcripción: el texto se parece demasiado a la fuente original. Reescribí párrafo por párrafo aportando análisis propio.'
  );

  // ═══════════════════════════════════════════════════════════════
  // MEMORIA: ¿tiene contexto de publicaciones anteriores?
  // ═══════════════════════════════════════════════════════════════
  const total = opts.memory?.totalArticles ?? 0;
  const memoriaScore = clamp(60 + total * 10); // Sin artículos = 60 (no penaliza), 1 = 70, 3 = 90, 4+ = 100
  const memoria: EditorialDnaDimension & { totalArticulosRelacionados: number } = {
    ...makeDimension(
      memoriaScore,
      minMemoria,
      'Sin memoria editorial: no se encontraron noticias previas relacionadas. Si este tema ya se ha cubierto, enlazá o referenciá el historial.'
    ),
    totalArticulosRelacionados: total,
  };

  // ═══════════════════════════════════════════════════════════════
  // ADN NI: promedio ponderado con pesos dinamicos por categoria
  // ═══════════════════════════════════════════════════════════════
  const selloNIPromedio = Math.round(
    selloNI.explica * pesosSello.explica +
    selloNI.contextualiza * pesosSello.contextualiza +
    selloNI.servicio * pesosSello.servicio +
    selloNI.originalidad * pesosSello.originalidad +
    selloNI.competencia * pesosSello.competencia +
    selloNI.utilidad * pesosSello.utilidad +
    selloNI.valor * pesosSello.valor
  );
  const adnNI = Math.round(
    exclusividad.score * pesosAdn.exclusividad +
    wow.score * pesosAdn.wow +
    selloNIPromedio * pesosAdn.selloNI +
    transcripcion.score * pesosAdn.transcripcion +
    memoria.score * pesosAdn.memoria
  );

  const bloqueadores: string[] = [];
  if (exclusividad.bloquear && exclusividad.razon) bloqueadores.push(exclusividad.razon);
  if (wow.bloquear && wow.razon) bloqueadores.push(wow.razon);
  if (transcripcion.bloquear && transcripcion.razon) bloqueadores.push(transcripcion.razon);

  const bloquear = exclusividad.bloquear || wow.bloquear || transcripcion.bloquear;
  const motivoBloqueo = bloqueadores.length > 0 ? bloqueadores.join(' | ') : null;

  return {
    exclusividad,
    wow,
    selloNI,
    transcripcion,
    memoria,
    adnNI,
    bloquear,
    motivoBloqueo,
    detalle: `ADN Nicaragua Informate: ${adnNI}% | Exclusividad: ${exclusividad.score}% | WOW: ${wow.score}% | Sello NI: ${selloNIPromedio}% | Transcripción: ${transcripcion.score}% | Memoria: ${memoria.score}%`,
  };
}
