/**
 * MENI OS v6.0 — Knowledge Graph Types
 * =====================================
 * Tipos para el grafo de conocimiento de Nicaragua Informate.
 * No es un índice de artículos: es un grafo de entidades y relaciones.
 */

export type EntityType =
  | 'persona'
  | 'lugar'
  | 'institucion'
  | 'evento'
  | 'tema'
  | 'categoria';

export type RelationType =
  | 'aparece_en'        // entidad aparece en artículo
  | 'ocurrio_en'        // evento ocurrió en lugar
  | 'pertenece_a'       // persona pertenece a institución
  | 'relacionado_con'   // entidad relacionada con otra
  | 'categorizado_como' // artículo categorizado como tema
  | 'mencionado_junto'  // entidades co-ocurren en artículos
  | 'antecedente_de';   // evento es antecedente de otro

export interface KnowledgeEntity {
  id: string;            // slug normalizado: tipo:nombre
  name: string;          // nombre legible: "Volcán Telica"
  type: EntityType;
  normalizedName: string; // para matching: "volcantelica"
  description?: string;   // descripción automática
  articleCount: number;   // cuántas noticias lo mencionan
  firstSeen: string;      // ISO date de primera mención
  lastSeen: string;       // ISO date de última mención
  metadata: Record<string, unknown>; // datos extra (municipios, sigla, etc.)
}

export interface KnowledgeRelation {
  id: string;            // sourceId_targetId_type
  sourceId: string;      // entidad origen
  targetId: string;      // entidad destino
  type: RelationType;
  strength: number;      // cuántas co-ocurrencias
  articleIds: string[];  // artículos donde aparecen juntos
  lastSeen: string;
}

export interface KnowledgeTimelineEntry {
  id: string;            // entityId_articleId
  entityId: string;
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  date: string;          // ISO date del artículo
  category: string;
  summary: string;       // resumen de qué pasó en este evento
}

export interface KnowledgeArticleRef {
  articleId: string;
  title: string;
  slug: string;
  date: string;
  category: string;
}

export interface KnowledgeQueryResult {
  entities: Array<{
    entity: KnowledgeEntity;
    timeline: KnowledgeTimelineEntry[];
    relatedEntities: Array<{
      entity: KnowledgeEntity;
      relation: RelationType;
      strength: number;
    }>;
  }>;
  totalArticles: number;
  timeline: KnowledgeTimelineEntry[];   // timeline combinado de todas las entidades
  antecedentes: string[];                // descripciones de antecedentes para el lector
  contexto: string[];                    // contexto que el lector necesita
  temasFrecuentes: string[];             // temas que aparecen con frecuencia
  institucionesRelevantes: string[];     // instituciones que suelen intervenir
  lugaresRelacionados: string[];         // lugares relacionados
  preguntasFrecuentes: string[];         // preguntas que el lector tendría según historial
}

export interface IngestArticleInput {
  articleId: string;
  title: string;
  content: string;
  slug: string;
  category: string;
  departamento?: string;
  date: string;           // ISO date
  author?: string;
}

export interface IngestResult {
  entitiesCreated: number;
  entitiesUpdated: number;
  relationsCreated: number;
  relationsUpdated: number;
  timelineEntries: number;
  entityIds: string[];
}
