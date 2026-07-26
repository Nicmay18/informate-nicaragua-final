import { pipelineV4 } from '@/lib/editorial';
import type { EvaluacionEditorial, NoticiaInput as EditorialNoticiaInput } from '@/lib/editorial';
import { generarMetaDescription } from '@/lib/editorial/meta';
import type { NoticiaInput, MeniResult } from './types';
import { analyzeForensic } from './forensic';
import { analyzeRisk } from './risk';
import { analyzeEEAT } from './eeat';
import { analyzeSEO } from './seo';
import { analyzeDiscover } from './discover';
import { analyzeAdSense } from './adsense';
import { computePriority, scoreToGrade, approved, normalizeCategory } from './scoring';
import { audit, buildRecomendaciones } from './auditor';
import { buildValorEditorial, buildDiagnostico } from './editor-chief';
import { getModule } from './modules';

export function runMeni(input: NoticiaInput): MeniResult {
  const evaluacion: EvaluacionEditorial = pipelineV4(input as EditorialNoticiaInput);
  const rawCategory = evaluacion.evidence.category || input.categoria || 'general';
  const categoria = normalizeCategory(rawCategory);
  const modulo = getModule(rawCategory);

  const seo = analyzeSEO(evaluacion, input);
  const forense = analyzeForensic(evaluacion);
  const riesgo = analyzeRisk(evaluacion);
  const eeat = analyzeEEAT(evaluacion);
  const discover = analyzeDiscover(evaluacion);
  const adsense = analyzeAdSense(evaluacion);
  const valorEditorial = buildValorEditorial(evaluacion);
  const auditoria = audit(evaluacion);
  const recomendaciones = [
    ...buildRecomendaciones(evaluacion),
    ...modulo.recomendaciones(evaluacion),
  ];

  const scoreFinal = Math.round(evaluacion.scoreFinal);
  const aprobado = approved(evaluacion.veredicto, scoreFinal);
  const calificacion = scoreToGrade(scoreFinal);
  const prioridad = computePriority(evaluacion.veredicto);
  const diagnostico = buildDiagnostico(evaluacion);

  const textoPlano = evaluacion.evidence.textoPlano ?? (input.contenido || '');
  const resumenOptimizado = generarMetaDescription(textoPlano, input.resumen);

  return {
    version: '2.0',
    estado: 'Activo',
    categoria,
    modulo: modulo.nombre,
    prioridad,
    riesgo,
    seo,
    eeat,
    discover,
    adsense,
    forense,
    valorEditorial,
    auditoria,
    diagnostico,
    scoreFinal,
    aprobado,
    calificacion,
    recomendaciones,
    articulo: {
      titulo: seo.tituloSEO,
      resumen: resumenOptimizado,
      contenido: input.contenido,
      slug: seo.slug,
    },
  };
}
