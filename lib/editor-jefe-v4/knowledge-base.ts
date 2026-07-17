/**
 * Knowledge Base V4 — APRENDIZAJE
 * ==============================
 * Almacena el conocimiento acumulado de artículos publicados.
 * No modifica el motor. Solo aprende de la producción.
 */

import { getAdminDb } from '../firebase-admin';

export interface ArticleKnowledge {
  // Identificación
  slug: string;
  titulo: string;
  categoria: string;
  fechaPublicacion: string;
  
  // Decisión editorial
  scoreV4: number;
  veredictoV4: string;
  
  // Estructura
  estructura: {
    h2Count: number;
    strongCount: number;
    blockquoteCount: number;
    palabraCount: number;
  };
  
  // Fuentes
  fuentes: {
    numeroFuentes: number;
    fuentesDetectadas: string[];
    tieneFuentePropia: boolean;
  };
  
  // Seguimiento
  seguimiento: {
    tieneSeguimiento: boolean;
    actualizable: boolean;
  };
  
  // Utilidad
  utilidad: {
    tieneServicio: boolean;
    tieneRecomendaciones: boolean;
  };
  
  // Métricas de rendimiento real (se agregan después de publicación)
  rendimiento?: {
    visitas: number;
    engagement: number;
    tiempoLecturaPromedio: number;
    tasaRebote: number;
  };
  
  // Timestamp
  timestamp: string;
}

/**
 * Guarda el conocimiento de un artículo cuando se publica.
 * Se llama desde el flujo de publicación (no desde el analizador).
 */
export async function saveArticleKnowledge(knowledge: ArticleKnowledge): Promise<void> {
  try {
    const db = getAdminDb();
    await db.collection('article_knowledge').doc(knowledge.slug).set(knowledge);
  } catch (error) {
    console.error('[knowledge-base] Error guardando conocimiento:', error);
  }
}

/**
 * Recupera el conocimiento de un artículo por slug.
 */
export async function getArticleKnowledge(slug: string): Promise<ArticleKnowledge | null> {
  try {
    const db = getAdminDb();
    const doc = await db.collection('article_knowledge').doc(slug).get();
    if (!doc.exists) return null;
    return doc.data() as ArticleKnowledge;
  } catch (error) {
    console.error('[knowledge-base] Error leyendo conocimiento:', error);
    return null;
  }
}

/**
 * Recupera conocimiento por categoría.
 */
export async function getKnowledgeByCategory(categoria: string, limit = 100): Promise<ArticleKnowledge[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('article_knowledge')
      .where('categoria', '==', categoria)
      .orderBy('fechaPublicacion', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map(doc => doc.data() as ArticleKnowledge);
  } catch (error) {
    console.error('[knowledge-base] Error leyendo por categoría:', error);
    return [];
  }
}

/**
 * Recupera conocimiento por veredicto editorial.
 */
export async function getKnowledgeByVeredicto(veredicto: string, limit = 100): Promise<ArticleKnowledge[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('article_knowledge')
      .where('veredictoV4', '==', veredicto)
      .orderBy('fechaPublicacion', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map(doc => doc.data() as ArticleKnowledge);
  } catch (error) {
    console.error('[knowledge-base] Error leyendo por veredicto:', error);
    return [];
  }
}

/**
 * Actualiza métricas de rendimiento real de un artículo.
 * Se llama cuando se tienen datos de analytics.
 */
export async function updatePerformanceMetrics(
  slug: string,
  metrics: ArticleKnowledge['rendimiento'],
): Promise<void> {
  try {
    const db = getAdminDb();
    await db.collection('article_knowledge').doc(slug).update({
      rendimiento: metrics,
    });
  } catch (error) {
    console.error('[knowledge-base] Error actualizando rendimiento:', error);
  }
}

/**
 * Calcula estadísticas agregadas por categoría.
 */
export async function getCategoryStats(categoria: string): Promise<{
  total: number;
  scorePromedio: number;
  scoreMin: number;
  scoreMax: number;
  veredictos: Record<string, number>;
  promedioPalabras: number;
  promedioFuentes: number;
}> {
  const articles = await getKnowledgeByCategory(categoria, 1000);
  if (articles.length === 0) {
    return { total: 0, scorePromedio: 0, scoreMin: 0, scoreMax: 0, veredictos: {}, promedioPalabras: 0, promedioFuentes: 0 };
  }

  const scores = articles.map(a => a.scoreV4);
  const veredictos: Record<string, number> = {};
  for (const a of articles) {
    veredictos[a.veredictoV4] = (veredictos[a.veredictoV4] || 0) + 1;
  }

  return {
    total: articles.length,
    scorePromedio: scores.reduce((a, b) => a + b, 0) / scores.length,
    scoreMin: Math.min(...scores),
    scoreMax: Math.max(...scores),
    veredictos,
    promedioPalabras: articles.reduce((a, b) => a + b.estructura.palabraCount, 0) / articles.length,
    promedioFuentes: articles.reduce((a, b) => a + b.fuentes.numeroFuentes, 0) / articles.length,
  };
}
