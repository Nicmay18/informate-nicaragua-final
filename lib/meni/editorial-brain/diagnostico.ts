/**
 * Diagnóstico Editorial Nicaragua Informate
 * ==========================================
 * No es un motor. Es la síntesis de todos los motores existentes
 * en una sola evaluación editorial que responde a la pregunta:
 * "¿Esta noticia merece existir en Nicaragua Informate?"
 *
 * Toma los resultados de los 9 motores + Story Planner + Reader Journey
 * y los presenta como un único diagnóstico editorial.
 */

import type {
  DiagnosticoEditorial,
  NewsValueDecision,
  CompetitionDecision,
  NicaraguaInformateDecision,
  PublicValueDecision,
  EditorialDifferenceDecision,
  StoryCompletenessDecision,
  KnowledgeContext,
  UtilityGateResult,
} from './types';
import type { ReaderJourneyResult } from '@/lib/meni/reader-journey/types';
import type { StoryPlan } from '@/lib/meni/story-planner/types';

export function buildDiagnostico(params: {
  newsValue: NewsValueDecision;
  competition: CompetitionDecision;
  nicaraguaInformate: NicaraguaInformateDecision;
  publicValue: PublicValueDecision;
  editorialDifference: EditorialDifferenceDecision;
  storyCompleteness: StoryCompletenessDecision;
  readerJourney: ReaderJourneyResult;
  storyPlan: StoryPlan;
  utilityGate: UtilityGateResult;
  knowledgeContext?: KnowledgeContext;
  contenido: string;
}): DiagnosticoEditorial {
  const {
    newsValue,
    competition,
    nicaraguaInformate,
    publicValue,
    editorialDifference,
    storyCompleteness,
    readerJourney,
    storyPlan,
    utilityGate,
    knowledgeContext,
    contenido,
  } = params;

  // 1. ¿Vale la pena publicar?
  const valeLaPenaPublicar = newsValue.veredicto !== 'baja' && !utilityGate.bloquear && !nicaraguaInformate.bloquear;
  const razonValorPeriodistico = newsValue.razon;

  // 2. ¿Qué aporta al lector?
  const queAportaAlLector = utilityGate.aportaNuevo
    ? utilityGate.queAprendeElLector.slice(0, 3).join('; ')
    : publicValue.queAporta || 'No se identificó aporte claro al lector.';

  // 3. Diferenciación frente a competencia
  const queAportaFrenteTN8 = competition.enfoqueTN8
    ? `TN8: ${competition.enfoqueTN8}. NI: ${competition.enfoqueNicaraguaInformate}`
    : 'Sin análisis de TN8 disponible.';
  const queAportaFrenteLaPrensa = competition.enfoqueLaPrensa
    ? `La Prensa: ${competition.enfoqueLaPrensa}. NI: ${competition.enfoqueNicaraguaInformate}`
    : 'Sin análisis de La Prensa disponible.';
  const queAportaFrenteCanal4 = competition.enfoqueCanal4
    ? `Canal 4: ${competition.enfoqueCanal4}. NI: ${competition.enfoqueNicaraguaInformate}`
    : 'Sin análisis de Canal 4 disponible.';
  const queAportaFrenteInternacionales = editorialDifference.elementosDiferenciales.length > 0
    ? editorialDifference.elementosDiferenciales.slice(0, 3).join('; ')
    : 'Sin diferenciación identificada frente a medios internacionales.';

  // 4. ¿Qué aprenderá el lector?
  const queAprenderaElLector = utilityGate.queAprendeElLector;

  // 5. ¿Qué explicación falta?
  const explicacionFalta = [
    ...storyCompleteness.respuestasFaltantes,
    ...storyCompleteness.dudasPendientes,
    ...readerJourney.brechaDeConocimiento.filter((b: string) => !readerJourney.queEntendera.includes(b)),
  ];

  // 6. ¿Qué contexto falta?
  const contextoFalta = [
    ...storyCompleteness.contextoFaltante,
    ...(knowledgeContext?.antecedentes.length === 0 && storyPlan.explicacionesServicio.length > 0
      ? ['No hay antecedentes históricos disponibles en la base de conocimiento.']
      : []),
  ];

  // 7. ¿Qué servicio falta?
  const servicioFalta = storyPlan.explicacionesServicio.length === 0
    ? ['No se identificaron explicaciones de servicio para esta categoría.']
    : [];

  // 8. ¿Parece boletín?
  const pareceBoletin = publicValue.soloInforma && storyPlan.explicacionesServicio.length === 0 && readerJourney.queEntendera.length === 0;

  // 9. ¿Párrafos transcritos? — heurística simple
  const parrafosTranscritos: string[] = [];
  const parrafos = contenido.split(/\n+/).filter(p => p.trim().length > 50);
  for (const p of parrafos) {
    const tieneEstiloInstitucional = /según (un )?(comunicado|boletín|informe)|fuente oficial|se informó que/i.test(p);
    const sinExplicacion = !/(porque|debido a|esto significa|como resultado|en consecuencia|es decir)/i.test(p);
    if (tieneEstiloInstitucional && sinExplicacion) {
      parrafosTranscritos.push(p.slice(0, 100) + '...');
    }
  }

  // 10. Partes con ADN NI
  const partesConAdnNI = [
    ...(nicaraguaInformate.selloEditorial ? [nicaraguaInformate.selloEditorial] : []),
    ...(editorialDifference.elementosDiferenciales.length > 0 ? editorialDifference.elementosDiferenciales.slice(0, 2) : []),
    ...(storyPlan.anguloNI ? [storyPlan.anguloNI] : []),
    ...(readerJourney.objetivoPedagogico ? [readerJourney.objetivoPedagogico] : []),
  ];

  // Prioridad editorial (no técnica)
  const prioridad: DiagnosticoEditorial['prioridad'] = !utilityGate.aportaNuevo
    ? 'valor_lector'
    : editorialDifference.porcentajeDiferencia < 30
    ? 'diferenciacion'
    : explicacionFalta.length > 0
    ? 'explicacion'
    : contextoFalta.length > 0
    ? 'contexto'
    : servicioFalta.length > 0
    ? 'servicio'
    : pareceBoletin
    ? 'originalidad'
    : 'calidad_tecnica';

  return {
    valeLaPenaPublicar,
    razonValorPeriodistico,
    queAportaAlLector,
    queAportaFrenteTN8,
    queAportaFrenteLaPrensa,
    queAportaFrenteCanal4,
    queAportaFrenteInternacionales,
    queAprenderaElLector,
    explicacionFalta,
    contextoFalta,
    servicioFalta,
    pareceBoletin,
    parrafosTranscritos,
    partesConAdnNI,
    prioridad,
  };
}
