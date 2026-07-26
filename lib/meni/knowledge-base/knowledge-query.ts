/**
 * Knowledge Query — Consulta el grafo de conocimiento para obtener contexto
 * de una nueva noticia. Dado el título y contenido de una noticia nueva,
 * extrae sus entidades y busca en el grafo antecedentes, cronología,
 * instituciones, lugares y temas relacionados.
 */

import type {
  KnowledgeEntity,
  KnowledgeRelation,
  KnowledgeTimelineEntry,
  KnowledgeQueryResult,
  RelationType,
} from './types';
import { extractEntities } from './entity-extractor';

export interface KnowledgeGraphData {
  entities: Map<string, KnowledgeEntity>;
  relations: KnowledgeRelation[];
  timelines: Map<string, KnowledgeTimelineEntry[]>;
}

export function queryKnowledge(
  title: string,
  content: string,
  category: string,
  graph: KnowledgeGraphData,
): KnowledgeQueryResult {
  const extracted = extractEntities(title, content, category);

  const matchedEntities: Array<{
    entity: KnowledgeEntity;
    timeline: KnowledgeTimelineEntry[];
    relatedEntities: Array<{
      entity: KnowledgeEntity;
      relation: RelationType;
      strength: number;
    }>;
  }> = [];

  const allTimelineEntries: KnowledgeTimelineEntry[] = [];
  const temasFrecuentes = new Set<string>();
  const institucionesRelevantes = new Set<string>();
  const lugaresRelacionados = new Set<string>();
  const antecedentes: string[] = [];
  const contexto: string[] = [];
  const preguntasFrecuentes: string[] = [];
  const allArticleIds = new Set<string>();

  for (const e of extracted) {
    const graphEntity = graph.entities.get(e.id);
    if (!graphEntity) continue;

    const timeline = graph.timelines.get(e.id) || [];
    const sortedTimeline = [...timeline].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const related: Array<{
      entity: KnowledgeEntity;
      relation: RelationType;
      strength: number;
    }> = [];

    for (const rel of graph.relations) {
      if (rel.sourceId === e.id) {
        const target = graph.entities.get(rel.targetId);
        if (target) {
          related.push({ entity: target, relation: rel.type, strength: rel.strength });
        }
      } else if (rel.targetId === e.id) {
        const source = graph.entities.get(rel.sourceId);
        if (source) {
          related.push({ entity: source, relation: rel.type, strength: rel.strength });
        }
      }
    }

    related.sort((a, b) => b.strength - a.strength);

    matchedEntities.push({
      entity: graphEntity,
      timeline: sortedTimeline.slice(0, 10),
      relatedEntities: related.slice(0, 8),
    });

    allTimelineEntries.push(...sortedTimeline);
    for (const t of timeline) allArticleIds.add(t.articleId);

    if (graphEntity.type === 'tema') {
      temasFrecuentes.add(graphEntity.name);
    }
    if (graphEntity.type === 'institucion') {
      institucionesRelevantes.add(graphEntity.name);
    }
    if (graphEntity.type === 'lugar') {
      lugaresRelacionados.add(graphEntity.name);
    }

    for (const rel of related) {
      if (rel.entity.type === 'tema') temasFrecuentes.add(rel.entity.name);
      if (rel.entity.type === 'institucion') institucionesRelevantes.add(rel.entity.name);
      if (rel.entity.type === 'lugar') lugaresRelacionados.add(rel.entity.name);
    }

    if (graphEntity.articleCount > 1) {
      antecedentes.push(
        `${graphEntity.name}: ${graphEntity.articleCount} noticias anteriores. Última: ${new Date(graphEntity.lastSeen).toLocaleDateString('es-NI')}`,
      );
    }

    if (graphEntity.description) {
      contexto.push(`${graphEntity.name}: ${graphEntity.description}`);
    }
  }

  allTimelineEntries.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  if (allTimelineEntries.length > 0) {
    const oldest = allTimelineEntries[allTimelineEntries.length - 1];
    const newest = allTimelineEntries[0];
    const daysDiff = Math.floor(
      (new Date(newest.date).getTime() - new Date(oldest.date).getTime()) / 86400000,
    );
    if (daysDiff > 0) {
      antecedentes.push(
        `Historial de ${daysDiff} días desde la primera hasta la última noticia sobre este tema.`,
      );
    }
  }

  for (const tema of temasFrecuentes) {
    if (tema.includes('accident')) {
      preguntasFrecuentes.push('¿Cuántos accidentes han ocurrido en esta zona?');
      preguntasFrecuentes.push('¿Cuál es el estado de la vía?');
    }
    if (tema.includes('volc')) {
      preguntasFrecuentes.push('¿Está activo el volcán actualmente?');
      preguntasFrecuentes.push('¿Qué nivel de alerta tiene?');
      preguntasFrecuentes.push('¿Hay riesgo de evacuación?');
    }
    if (tema.includes('homicid') || tema.includes('delincu')) {
      preguntasFrecuentes.push('¿Hay personas detenidas?');
      preguntasFrecuentes.push('¿La Policía se ha pronunciado?');
    }
    if (tema.includes('salud')) {
      preguntasFrecuentes.push('¿Cuántos casos confirmados hay?');
      preguntasFrecuentes.push('¿El MINSA ha emitido alerta?');
    }
  }

  if (institucionesRelevantes.size > 0) {
    contexto.push(
      `Instituciones que suelen intervenir: ${[...institucionesRelevantes].join(', ')}`,
    );
  }

  if (lugaresRelacionados.size > 0) {
    contexto.push(
      `Lugares relacionados: ${[...lugaresRelacionados].join(', ')}`,
    );
  }

  return {
    entities: matchedEntities,
    totalArticles: allArticleIds.size,
    timeline: allTimelineEntries.slice(0, 20),
    antecedentes: [...new Set(antecedentes)].slice(0, 10),
    contexto: [...new Set(contexto)].slice(0, 10),
    temasFrecuentes: [...temasFrecuentes].slice(0, 8),
    institucionesRelevantes: [...institucionesRelevantes].slice(0, 8),
    lugaresRelacionados: [...lugaresRelacionados].slice(0, 8),
    preguntasFrecuentes: [...new Set(preguntasFrecuentes)].slice(0, 8),
  };
}
