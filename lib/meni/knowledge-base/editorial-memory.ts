/**
 * Editorial Memory — Panel interno pre-publicación.
 * Responde: ¿Ya escribimos sobre este tema? ¿Qué noticias similares existen?
 * ¿Qué cronología existe? ¿Existe riesgo de canibalización SEO?
 * ¿Qué enlaces conviene agregar?
 */

import type { Firestore } from 'firebase-admin/firestore';
import { extractEntities } from './entity-extractor';
import { generateInternalLinks, type InternalLink } from './internal-linking';

export interface EditorialMemoryResult {
  yaEscribimos: boolean;
  noticiasSimilares: Array<{
    articleId: string;
    title: string;
    slug: string;
    date: string;
    sharedEntities: string[];
  }>;
  cronologiaExiste: boolean;
  cronologiaEntradas: number;
  riesgoCanibalizacion: 'alto' | 'medio' | 'bajo' | 'ninguno';
  enlacesSugeridos: InternalLink[];
  entidadesDetectadas: number;
  temasDetectados: string[];
  mensaje: string;
}

export async function checkEditorialMemory(
  db: Firestore,
  title: string,
  content: string,
  category: string,
): Promise<EditorialMemoryResult> {
  const entities = extractEntities(title, content, category);
  const entityIds = entities.map((e) => e.id);

  const noticiasSimilares: EditorialMemoryResult['noticiasSimilares'] = [];
  const scores = new Map<string, { title: string; slug: string; date: string; shared: string[] }>();

  for (const entityId of entityIds) {
    const timelineSnap = await db
      .collection('kb_timeline')
      .where('entityId', '==', entityId)
      .limit(10)
      .get();

    for (const doc of timelineSnap.docs) {
      const entry = doc.data();
      const aid = entry.articleId as string;
      const existing = scores.get(aid);
      if (existing) {
        existing.shared.push(entityId);
      } else {
        scores.set(aid, {
          title: entry.articleTitle as string,
          slug: entry.articleSlug as string,
          date: entry.date as string,
          shared: [entityId],
        });
      }
    }
  }

  for (const [aid, data] of scores) {
    noticiasSimilares.push({
      articleId: aid,
      title: data.title,
      slug: data.slug,
      date: data.date,
      sharedEntities: data.shared,
    });
  }

  noticiasSimilares.sort((a, b) => b.sharedEntities.length - a.sharedEntities.length);

  const topSimilares = noticiasSimilares.slice(0, 5);
  const yaEscribimos = noticiasSimilares.length > 0;
  const cronologiaEntradas = noticiasSimilares.length;
  const cronologiaExiste = cronologiaEntradas >= 3;

  let riesgoCanibalizacion: EditorialMemoryResult['riesgoCanibalizacion'] = 'ninguno';
  if (noticiasSimilares.length >= 5) {
    const maxShared = noticiasSimilares[0]?.sharedEntities.length || 0;
    if (maxShared >= 4) riesgoCanibalizacion = 'alto';
    else if (maxShared >= 3) riesgoCanibalizacion = 'medio';
    else riesgoCanibalizacion = 'bajo';
  } else if (noticiasSimilares.length >= 2) {
    riesgoCanibalizacion = 'bajo';
  }

  const enlacesSugeridos = generateInternalLinks(title, content, category);
  const temasDetectados = entities
    .filter((e) => e.type === 'tema')
    .map((e) => e.name);

  let mensaje = 'Tema nuevo: no hay cobertura previa.';
  if (yaEscribimos) {
    mensaje = `Se encontraron ${noticiasSimilares.length} noticias relacionadas.`;
    if (riesgoCanibalizacion === 'alto') {
      mensaje += ' RIESGO DE CANIBALIZACIÓN SEO: considera diferenciar el enfoque.';
    } else if (riesgoCanibalizacion === 'medio') {
      mensaje += ' Riesgo moderado: agrega enlaces internos y contexto diferenciado.';
    } else {
      mensaje += ' Agrega enlaces internos para fortalecer el SEO.';
    }
  }

  return {
    yaEscribimos,
    noticiasSimilares: topSimilares,
    cronologiaExiste,
    cronologiaEntradas,
    riesgoCanibalizacion,
    enlacesSugeridos,
    entidadesDetectadas: entities.length,
    temasDetectados,
    mensaje,
  };
}
