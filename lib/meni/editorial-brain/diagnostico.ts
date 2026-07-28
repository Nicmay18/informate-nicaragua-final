/**
 * Diagnóstico Editorial Nicaragua Informate
 * ==========================================
 * MENI v9: El editor responde 5 preguntas con argumentos.
 * No da un score. Da una opinión editorial fundamentada.
 *
 * Las 5 preguntas obligatorias:
 * 1. ¿Vale la pena publicar?
 * 2. ¿Qué aprenderá el lector que no encontraría en otro medio?
 * 3. ¿Qué aporta Nicaragua Informate?
 * 4. ¿Qué le falta para ser una nota de referencia?
 * 5. ¿Debe ir en portada?
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

  // ═══════════════════════════════════════════════════════════
  // Pregunta 1: ¿Vale la pena publicar?
  // ═══════════════════════════════════════════════════════════
  const valeLaPena = newsValue.veredicto !== 'baja' || newsValue.score >= 30;
  const razonValeLaPena = valeLaPena
    ? `${newsValue.razon} El valor noticioso es ${newsValue.veredicto} (${newsValue.score}/100).`
    : `El valor noticioso es bajo (${newsValue.score}/100). ${newsValue.razon} Considera si hay un ángulo que eleve el interés público.`;

  // ═══════════════════════════════════════════════════════════
  // Pregunta 2: ¿Qué aprenderá el lector que no encontraría en otro medio?
  // ═══════════════════════════════════════════════════════════
  const elementosDiferenciales = editorialDifference.elementosDiferenciales;
  const queAprendeUnico = utilityGate.queAprendeElLector;
  const respuestaAprende = elementosDiferenciales.length > 0
    ? elementosDiferenciales.slice(0, 3).join('. ')
    : queAprendeUnico.length > 0
    ? queAprendeUnico.slice(0, 3).join('. ')
    : 'No se identificó un aporte diferencial claro frente a otros medios.';
  const razonAprende = editorialDifference.porcentajeDiferencia >= 30
    ? `La diferencia frente a la competencia es del ${editorialDifference.porcentajeDiferencia}%, lo que indica cobertura diferenciada.`
    : `La diferencia es del ${editorialDifference.porcentajeDiferencia}%. TN8 y La Prensa probablemente cubrirán lo mismo; necesitamos un ángulo más propio.`;

  // ═══════════════════════════════════════════════════════════
  // Pregunta 3: ¿Qué aporta Nicaragua Informate?
  // ═══════════════════════════════════════════════════════════
  const respuestaAporta = nicaraguaInformate.selloEditorial
    ? nicaraguaInformate.selloEditorial
    : storyPlan.anguloNI
    ? storyPlan.anguloNI
    : 'No se identificó un sello editorial claro para esta nota.';
  const razonAporta = publicValue.ayudaAlLector
    ? 'La nota ayuda al lector: aporta explicación, contexto o servicio práctico.'
    : publicValue.soloInforma
    ? 'La nota solo informa datos. Necesita transformarse para servir al lector, no solo reportar.'
    : 'La nota tiene potencial de servicio pero requiere desarrollo.';

  // ═══════════════════════════════════════════════════════════
  // Pregunta 4: ¿Qué le falta para ser una nota de referencia?
  // ═══════════════════════════════════════════════════════════
  const queLeFalta: string[] = [];
  if (storyCompleteness.respuestasFaltantes.length > 0) {
    queLeFalta.push(`Responder: ${storyCompleteness.respuestasFaltantes.join('; ')}`);
  }
  if (storyCompleteness.contextoFaltante.length > 0) {
    queLeFalta.push(`Contexto: ${storyCompleteness.contextoFaltante.join('; ')}`);
  }
  if (readerJourney.brechaDeConocimiento.length > 0) {
    queLeFalta.push(`Explicar: ${readerJourney.brechaDeConocimiento.slice(0, 3).join('; ')}`);
  }
  if (storyPlan.explicacionesServicio.length === 0) {
    queLeFalta.push('Agregar explicaciones de servicio para el lector');
  }
  if (utilityGate.recomendacionesEditoriales.length > 0) {
    queLeFalta.push(...utilityGate.recomendacionesEditoriales);
  }

  // ═══════════════════════════════════════════════════════════
  // Pregunta 5: ¿Debe ir en portada?
  // ═══════════════════════════════════════════════════════════
  const portada = newsValue.veredicto === 'alta' && utilityGate.aportaNuevo && editorialDifference.porcentajeDiferencia >= 30;
  const razonPortada = portada
    ? 'Tiene alto valor noticioso, aporta conocimiento nuevo y se diferencia de la competencia. Merece portada.'
    : newsValue.veredicto === 'media'
    ? 'Tiene valor noticioso medio. Puede ir en portada si se mejora el ángulo diferencial.'
    : 'El valor noticioso o diferenciación no justifica portada. Considera una sección específica.';

  // ═══════════════════════════════════════════════════════════
  // Razonamiento del editor (pros y contras)
  // ═══════════════════════════════════════════════════════════
  const razonamiento: { punto: string; positivo: boolean }[] = [];

  if (newsValue.veredicto === 'alta') razonamiento.push({ punto: `Alto valor noticioso (${newsValue.score}/100)`, positivo: true });
  else if (newsValue.veredicto === 'media') razonamiento.push({ punto: `Valor noticioso medio (${newsValue.score}/100)`, positivo: true });
  else razonamiento.push({ punto: `Valor noticioso bajo (${newsValue.score}/100)`, positivo: false });

  if (utilityGate.aportaNuevo) razonamiento.push({ punto: 'El lector aprenderá algo nuevo', positivo: true });
  else razonamiento.push({ punto: 'No se identificó aporte nuevo claro al lector', positivo: false });

  if (editorialDifference.porcentajeDiferencia >= 30) razonamiento.push({ punto: `Diferenciación del ${editorialDifference.porcentajeDiferencia}% frente a competencia`, positivo: true });
  else razonamiento.push({ punto: `Diferenciación baja (${editorialDifference.porcentajeDiferencia}%)`, positivo: false });

  if (publicValue.ayudaAlLector) razonamiento.push({ punto: 'La nota ayuda al lector', positivo: true });
  if (publicValue.soloInforma) razonamiento.push({ punto: 'Solo informa, no explica ni sirve', positivo: false });

  if (storyCompleteness.cerrada) razonamiento.push({ punto: 'La historia está cerrada', positivo: true });
  else razonamiento.push({ punto: `Faltan ${storyCompleteness.respuestasFaltantes.length} respuestas`, positivo: false });

  if (storyPlan.explicacionesServicio.length > 0) razonamiento.push({ punto: `${storyPlan.explicacionesServicio.length} explicaciones de servicio`, positivo: true });
  if (readerJourney.queEntendera.length > 0) razonamiento.push({ punto: `Reader Journey con ${readerJourney.queEntendera.length} puntos de aprendizaje`, positivo: true });

  if (utilityGate.recomendacionesEditoriales.length > 0) {
    razonamiento.push({ punto: `${utilityGate.recomendacionesEditoriales.length} recomendaciones editoriales`, positivo: false });
  }

  // ═══════════════════════════════════════════════════════════
  // Mensaje del editor — síntesis narrativa
  // ═══════════════════════════════════════════════════════════
  const pros = razonamiento.filter(r => r.positivo).length;
  const contras = razonamiento.filter(r => !r.positivo).length;
  const mensajeEditor = contras === 0
    ? 'Esta nota está lista para publicar. Tiene valor noticioso, aporta conocimiento nuevo y se diferencia de la competencia.'
    : pros > contras
    ? `Esta nota tiene potencial (${pros} puntos a favor, ${contras} en contra). Con ${queLeFalta.length} mejora(s) puede ser una nota sólida de Nicaragua Informate.`
    : `Esta nota necesita trabajo antes de publicar (${pros} a favor, ${contras} en contra). Prioridad: ${queLeFalta[0] || 'revisar ángulo editorial'}.`;

  // ═══════════════════════════════════════════════════════════
  // Backward compat fields
  // ═══════════════════════════════════════════════════════════
  const razonValorPeriodistico = razonValeLaPena;
  const queAportaAlLector = utilityGate.aportaNuevo
    ? utilityGate.queAprendeElLector.slice(0, 3).join('; ')
    : publicValue.queAporta || 'No se identificó aporte claro al lector.';
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
  const queAprenderaElLector = utilityGate.queAprendeElLector;
  const explicacionFalta = [
    ...storyCompleteness.respuestasFaltantes,
    ...storyCompleteness.dudasPendientes,
    ...readerJourney.brechaDeConocimiento.filter((b: string) => !readerJourney.queEntendera.includes(b)),
  ];
  const contextoFalta = [
    ...storyCompleteness.contextoFaltante,
    ...(knowledgeContext?.antecedentes.length === 0 && storyPlan.explicacionesServicio.length > 0
      ? ['No hay antecedentes históricos disponibles en la base de conocimiento.']
      : []),
  ];
  const servicioFalta = storyPlan.explicacionesServicio.length === 0
    ? ['No se identificaron explicaciones de servicio para esta categoría.']
    : [];
  const pareceBoletin = publicValue.soloInforma && storyPlan.explicacionesServicio.length === 0 && readerJourney.queEntendera.length === 0;
  const parrafosTranscritos: string[] = [];
  const parrafos = contenido.split(/\n+/).filter(p => p.trim().length > 50);
  for (const p of parrafos) {
    const tieneEstiloInstitucional = /según (un )?(comunicado|boletín|informe)|fuente oficial|se informó que/i.test(p);
    const sinExplicacion = !/(porque|debido a|esto significa|como resultado|en consecuencia|es decir)/i.test(p);
    if (tieneEstiloInstitucional && sinExplicacion) {
      parrafosTranscritos.push(p.slice(0, 100) + '...');
    }
  }
  const partesConAdnNI = [
    ...(nicaraguaInformate.selloEditorial ? [nicaraguaInformate.selloEditorial] : []),
    ...(editorialDifference.elementosDiferenciales.length > 0 ? editorialDifference.elementosDiferenciales.slice(0, 2) : []),
    ...(storyPlan.anguloNI ? [storyPlan.anguloNI] : []),
    ...(readerJourney.objetivoPedagogico ? [readerJourney.objetivoPedagogico] : []),
  ];

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
    // 5 preguntas narrativas
    valeLaPenaPublicar: { respuesta: valeLaPena, razon: razonValeLaPena },
    queAprenderaQueNoEnOtroMedio: { respuesta: respuestaAprende, razon: razonAprende },
    queAportaNicaraguaInformate: { respuesta: respuestaAporta, razon: razonAporta },
    queLeFaltaParaReferencia: queLeFalta,
    publicarEnPortada: { respuesta: portada, razon: razonPortada },
    // Síntesis narrativa
    mensajeEditor,
    razonamiento,
    // Backward compat
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
