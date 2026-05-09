import type { Noticia } from './types';

const DEFAULT_NEWS_COUNT = 30;
const DEFAULT_MAS_LEIDAS_COUNT = 5;
const MAX_COUNT = 100;

// =============================================================================
// FORZADO FIREBASE ADMIN SDK - Sin fallback mock data
// =============================================================================
// El sistema ahora solo funciona con noticias reales de Firebase
// Si Firebase falla, el sitio mostrará estado vacío con logs de error

function validateCount(count: number, defaultCount: number): number {
  if (typeof count !== 'number' || isNaN(count)) return defaultCount;
  if (count < 0) return defaultCount;
  if (count > MAX_COUNT) return MAX_COUNT;
  return count || defaultCount;
}

// =============================================================================
// Firebase Admin SDK - OBLIGATORIO para noticias reales
// =============================================================================
async function tryFirebaseAdmin(count: number): Promise<Noticia[] | null> {
  try {
    const { adminDb } = await import('./firebase-admin');
    const snap = await adminDb
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(count)
      .get();
    
    return snap.docs.map((d: any) => {
      const data = d.data();
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
    });
  } catch (err) {
    console.error('[data.ts] ERROR CRÍTICO: Firebase Admin SDK falló:', err instanceof Error ? err.message : String(err));
    console.error('[data.ts] VERIFICAR: Variables de entorno FIREBASE_* en Vercel');
    return null;
  }
}

export async function getNews(count: number = DEFAULT_NEWS_COUNT): Promise<Noticia[]> {
  const validatedCount = validateCount(count, DEFAULT_NEWS_COUNT);
  
  // FORZAR Firebase Admin SDK - sin fallback
  const firebaseNews = await tryFirebaseAdmin(validatedCount);
  if (!firebaseNews || firebaseNews.length === 0) {
    console.error('[data.ts] ERROR: No se pudieron obtener noticias de Firebase - checkear configuración');
    return [];
  }
  
  console.log(`[data.ts] Obtenidas ${firebaseNews.length} noticias reales de Firebase`);
  return firebaseNews;
}

export async function getMasLeidas(count: number = DEFAULT_MAS_LEIDAS_COUNT): Promise<Noticia[]> {
  const validatedCount = validateCount(count, DEFAULT_MAS_LEIDAS_COUNT);
  
  // FORZAR Firebase Admin SDK - sin fallback
  try {
    const { adminDb } = await import('./firebase-admin');
    const snap = await adminDb
      .collection('noticias')
      .orderBy('vistas', 'desc')
      .limit(validatedCount)
      .get();
    
    if (!snap.empty) {
      const masLeidas = snap.docs.map((d: any) => {
        const data = d.data();
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
      });
      
      console.log(`[data.ts] Obtenidas ${masLeidas.length} noticias más leídas de Firebase`);
      return masLeidas;
    }
  } catch (err) {
    console.error('[data.ts] ERROR: No se pudieron obtener más leídas de Firebase:', err instanceof Error ? err.message : String(err));
  }
  
  // Sin fallback - retornar vacío si Firebase falla
  console.error('[data.ts] ERROR: No hay noticias más leídas disponibles - checkear Firebase');
  return [];
}

export async function getNewsBySlug(slug: string): Promise<Noticia | null> {
  // Verificar que el slug no llegue vacío
  if (!slug || typeof slug !== 'string') {
    return null;
  }
  
  try {
    const { adminDb } = await import('./firebase-admin');
    const snap = await adminDb
      .collection('noticias')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (!snap.empty) {
      const doc = snap.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        slug: data.slug || doc.id,
        titulo: data.titulo || '',
        resumen: data.resumen || '',
        contenido: data.contenido || '',
        categoria: data.categoria || 'General',
        imagen: data.imagen || '',
        fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || '',
        autor: data.autor,
        destacada: data.destacada,
        vistas: data.vistas,
        palabras: data.palabras,
      };
    }
  } catch (err) {
    console.error('[data.ts] ERROR: No se pudo obtener noticia por slug:', err instanceof Error ? err.message : String(err));
  }
  
  return null;
}
