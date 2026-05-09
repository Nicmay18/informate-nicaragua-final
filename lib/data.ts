import { adminDb } from './firebase-admin';
import type { Noticia } from './types';

/**
 * Límites por defecto para queries
 */
const DEFAULT_NEWS_COUNT = 30;
const DEFAULT_MAS_LEIDAS_COUNT = 5;
const MAX_COUNT = 100;

/**
 * Valida el parámetro count para queries
 * @param count Cantidad solicitada
 * @param defaultCount Valor por defecto
 * @returns Count validado
 */
function validateCount(count: number, defaultCount: number): number {
  if (typeof count !== 'number' || isNaN(count)) {
    return defaultCount;
  }
  if (count < 0) {
    return defaultCount;
  }
  if (count > MAX_COUNT) {
    return MAX_COUNT;
  }
  return count || defaultCount;
}

/**
 * Convierte un documento de Firestore a tipo Noticia
 * @param d Documento de Firestore
 * @returns Objeto Noticia
 * @throws Error si el documento no tiene datos
 */
function docToNoticia(d: FirebaseFirestore.QueryDocumentSnapshot): Noticia {
  const data = d.data();
  
  if (!data) {
    throw new Error(`Document ${d.id} has no data`);
  }

  return {
    id: d.id,
    slug: data.slug || d.id,
    titulo: data.titulo || '',
    resumen: data.resumen || '',
    contenido: data.contenido,
    categoria: data.categoria || 'General',
    imagen: data.imagen || '',
    fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || '',
    autor: data.autor,
    destacada: data.destacada,
    vistas: data.vistas,
    palabras: data.palabras,
  };
}

/**
 * Obtiene noticias ordenadas por fecha (más recientes primero)
 * @param count Cantidad de noticias a obtener (default: 30, max: 100)
 * @returns Array de noticias
 */
export async function getNews(count: number = DEFAULT_NEWS_COUNT): Promise<Noticia[]> {
  try {
    const validatedCount = validateCount(count, DEFAULT_NEWS_COUNT);
    const snap = await adminDb
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(validatedCount)
      .get();
    return snap.docs.map(docToNoticia);
  } catch (err) {
    console.error('[getNews]', err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Obtiene las noticias más leídas ordenadas por vistas
 * @param count Cantidad de noticias a obtener (default: 5, max: 100)
 * @returns Array de noticias
 */
export async function getMasLeidas(count: number = DEFAULT_MAS_LEIDAS_COUNT): Promise<Noticia[]> {
  try {
    const validatedCount = validateCount(count, DEFAULT_MAS_LEIDAS_COUNT);
    const snap = await adminDb
      .collection('noticias')
      .orderBy('vistas', 'desc')
      .limit(validatedCount)
      .get();
    return snap.docs.map(docToNoticia);
  } catch (err) {
    console.error('[getMasLeidas]', err instanceof Error ? err.message : String(err));
    return [];
  }
}
