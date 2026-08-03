/**
 * Business Value — Detecta temas con suficiente contenido para convertirse en
 * especiales editoriales, guías premium, series o micrositios.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { KnowledgeEntity } from './types';

export interface BusinessOpportunity {
  tema: string;
  totalNoticias: number;
  entidadesRelacionadas: number;
  ultimaActualizacion: string;
  sugerencia: 'especial' | 'guia' | 'serie' | 'micrositio' | 'cobertura';
  prioridad: 'alta' | 'media' | 'baja';
  razon: string;
}

export async function detectBusinessOpportunities(
  db: Firestore,
): Promise<BusinessOpportunity[]> {
  const entitiesSnap = await db.collection('kb_entities').get();
  const entities: KnowledgeEntity[] = entitiesSnap.docs.map(
    (d) => d.data() as unknown as KnowledgeEntity,
  );

  const temas = entities.filter((e) => e.type === 'tema');
  const opportunities: BusinessOpportunity[] = [];

  for (const tema of temas) {
    if (tema.articleCount < 5) continue;

    const relatedSnap = await db
      .collection('kb_relations')
      .where('sourceId', '==', tema.id)
      .get();

    const entidadesRelacionadas = relatedSnap.size;

    let sugerencia: BusinessOpportunity['sugerencia'] = 'cobertura';
    let prioridad: BusinessOpportunity['prioridad'] = 'baja';
    let razon = '';

    if (tema.articleCount >= 20) {
      sugerencia = 'micrositio';
      prioridad = 'alta';
      razon = `${tema.articleCount} noticias y ${entidadesRelacionadas} entidades relacionadas. Suficiente para un micrositio dedicado.`;
    } else if (tema.articleCount >= 15) {
      sugerencia = 'especial';
      prioridad = 'alta';
      razon = `${tema.articleCount} noticias. Ideal para un especial editorial con cronología y análisis.`;
    } else if (tema.articleCount >= 10) {
      sugerencia = 'serie';
      prioridad = 'media';
      razon = `${tema.articleCount} noticias. Suficiente para una serie editorial de varios capítulos.`;
    } else if (tema.articleCount >= 7) {
      sugerencia = 'guia';
      prioridad = 'media';
      razon = `${tema.articleCount} noticias. Buen momento para una guía premium explicativa.`;
    } else {
      sugerencia = 'cobertura';
      prioridad = 'baja';
      razon = `${tema.articleCount} noticias. Mantener cobertura permanente.`;
    }

    opportunities.push({
      tema: tema.name,
      totalNoticias: tema.articleCount,
      entidadesRelacionadas,
      ultimaActualizacion: tema.lastSeen,
      sugerencia,
      prioridad,
      razon,
    });
  }

  opportunities.sort((a, b) => {
    if (a.prioridad !== b.prioridad) {
      const order = { alta: 0, media: 1, baja: 2 };
      return order[a.prioridad] - order[b.prioridad];
    }
    return b.totalNoticias - a.totalNoticias;
  });

  return opportunities;
}
