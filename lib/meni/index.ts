export { runMeni, runMeniAsync } from './core';
export type { MeniRunOptions } from './core';
export type {
  NoticiaInput,
  MeniResult,
  MeniSEO,
  MeniEEAT,
  MeniDiscover,
  MeniAdSense,
  MeniForense,
  MeniRiesgoEditorial,
  MeniValorEditorial,
  MeniAuditoria,
  MeniRecomendacion,
  MeniReport,
  EditorialDecisionFlat,
} from './types';
export type {
  EditorPattern,
  CorreccionRegistrada,
  EditorialRanking,
  SaturacionPortada,
  MemoriaEditorial,
} from './editorial-brain/types';
export { registerCorrection, loadEditorPatterns } from './editor-jefe/correction-tracker';
export { computeRanking, analyzeSaturation } from './editor-jefe/ranking';
export { buildMemoriaEditorial } from './editor-jefe/editorial-memory';
