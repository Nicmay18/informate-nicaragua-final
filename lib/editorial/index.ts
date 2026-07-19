/**
 * Motor editorial determinístico — única entrada pública.
 */

export { evaluate } from './core/pipeline';
export { evaluate as pipelineV4 } from './core/pipeline';
export { mapV4ToV3 } from './core/mapper-v3';
export { verifyIntegrity } from './core/integrity-engine';
export { InvariantError } from './core/integrity-engine';

export type {
  VeredictoEditorial,
  TipoContenido,
  NoticiaInput,
  ArticleEvidence,
  ModuleScore,
  CalidadModules,
  RiesgoModules,
  ExplainabilityItem,
  AdsenseResult,
  EvaluacionEditorial,
  ResultadoEditorial,
  EditorialProfile,
  ResultadoAnalisis,
  FiltroResultado,
  CheckItem,
  NivelAnalisis,
} from './core/types';
