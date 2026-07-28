/**
 * Story Planner — Types
 * =====================
 * MENI v7: El módulo más importante.
 * Antes de que el LLM escriba, el Story Planner decide:
 * - Tipo de historia
 * - Enfoque para Nicaragua
 * - Orden narrativo exacto
 * - Qué explicar (servicio)
 * - Qué NO usar (frases prohibidas)
 * - Ángulo Nicaragua Informate
 *
 * El LLM no piensa. Solo redacta siguiendo este plan.
 */

export type StoryType =
  | 'operativo_antidrogas'
  | 'operativo_policial'
  | 'accidente_transito'
  | 'homicidio'
  | 'incendio'
  | 'salud_publica'
  | 'economia'
  | 'politica_nacional'
  | 'hecho_internacional'
  | 'deporte'
  | 'desastre_natural'
  | 'educacion'
  | 'cultura'
  | 'general';

export interface NarrativeBlock {
  orden: number;
  tipo: string;
  descripcion: string;
  queIncluir: string[];
}

export interface StoryPlan {
  tipo: StoryType;
  tipoLabel: string;
  enfoque: string;
  ordenNarrativo: NarrativeBlock[];
  explicacionesServicio: string[];
  frasesProhibidas: string[];
  anguloNI: string;
  proposito: string;
  queNoHacer: string[];
  score: number;
}

export interface StoryPlannerInput {
  titulo: string;
  contenido: string;
  fuente?: string;
  categoria?: string;
}
