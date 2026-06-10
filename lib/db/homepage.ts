import { getAdminDb } from '@/lib/firebase-admin';
import type { Noticia } from '@/lib/types';
import { FALLBACK_IMAGE } from '@/lib/types';
import { QueryDocumentSnapshot, DocumentData, FieldValue } from 'firebase-admin/firestore';
import { capitalizeFirst } from '@/lib/formateo';

// ============================================================================
// NORMALIZAR IMÁGENES (autocontenido para evitar dependencias circulares)
// ============================================================================
function normalizeImage(imagen: string): string {
  if (!imagen || imagen === 'null' || imagen === 'undefined' || imagen === 'NaN') return FALLBACK_IMAGE;
  if (imagen.startsWith('/images/')) return imagen;
  if (imagen.startsWith('data:')) return imagen;
  if (imagen.includes('firebasestorage.googleapis.com') || imagen.includes('storage.googleapis.com')) {
    try {
      const url = new URL(imagen);
      const pathMatch = url.pathname.match(/\/(?:v0\/b\/[^/]+\/o\/)?(?:images%2F)?(.+)$/);
      if (pathMatch) {
        const decoded = decodeURIComponent(pathMatch[1]);
        const filename = decoded.split('/').pop()?.trim();
        if (filename && filename.length > 1) return `/images/${filename}`;
      }
      const segments = url.pathname.split('/').filter(Boolean);
      const last = segments.pop();
      if (last && last.length > 1) return `/images/${last}`;
    } catch { /* fallback */ }
    const raw = imagen.split('/').pop()?.split('?')[0]?.trim();
    if (raw && raw.length > 1) return `/images/${raw}`;
    return FALLBACK_IMAGE;
  }
  if (imagen.includes('cdn.jsdelivr.net')) return imagen.split('?')[0];
  if (imagen.includes('githubusercontent.com')) {
    const clean = imagen.split('?')[0];
    const match = clean.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.*)/);
    if (match) {
      const [, user, repo, branch, path] = match;
      return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
    }
    return clean;
  }
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) return imagen.split('?')[0];
  if (imagen.startsWith('images/')) return `/${imagen}`;
  if (imagen.startsWith('/')) return imagen;
  const fn = imagen.split('/').pop()?.trim();
  if (!fn || fn.length < 2) return FALLBACK_IMAGE;
  return `/images/${fn}`;
}

/**
 * Sanitiza cualquier representación de fecha de Firestore a ISO string
 */
function safeDateString(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
    try {
      const d = (value as any).toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : '';
    } catch { return ''; }
  }
  if (typeof value === 'object' && value !== null && '_seconds' in value) {
    try {
      const sec = Number((value as any)._seconds);
      const ns = Number((value as any)._nanoseconds || 0);
      const d = new Date(sec * 1000 + ns / 1_000_000);
      return !isNaN(d.getTime()) ? d.toISOString() : '';
    } catch { return ''; }
  }
  if (typeof value === 'string') return value;
  if (value instanceof Date) return isNaN(value.getTime()) ? '' : value.toISOString();
  return '';
}

/**
 * Mapea un documento Firestore a la interfaz Noticia
 */
function mapNoticia(d: QueryDocumentSnapshot<DocumentData>): Noticia {
  const data = d.data();
  return {
    id: d.id,
    slug: data.slug || d.id,
    titulo: capitalizeFirst(data.titulo || ''),
    resumen: data.resumen || '',
    contenido: data.contenido || '',
    categoria: data.categoria || 'Actualidad',
    imagen: normalizeImage(data.imagen || ''),
    fecha: safeDateString(data.fecha),
    fechaActualizacion: safeDateString(data.fechaActualizacion),
    autor: data.autor || 'Keyling Elieth Rivera Muñoz',
    autorFoto: data.autorFoto,
    destacada: data.destacada || false,
    vistas: data.vistas || 0,
    palabras: data.palabras || 0,
    tags: data.tags || [],
    pieFoto: data.pieFoto || '',
    metaDescription: data.metaDescription || data.metaDescripcion || '',
    keywords: data.keywords || '',
  };
}

// ============================================================================
// CATEGORÍAS SEGURAS PARA ADSENSE (excluye Sucesos por cumplimiento)
// ============================================================================
const CATEGORIAS_ADSENSE_SEGURAS = new Set([
  'Nacionales', 'Internacionales', 'Tecnología', 'Economía', 'Deportes', 'Espectáculos'
]);

function esCategoriaSegura(categoria: string): boolean {
  return CATEGORIAS_ADSENSE_SEGURAS.has(categoria);
}

/**
 * Obtiene las noticias más recientes para la portada (Carrusel y listados).
 * Ordena estrictamente por fecha descendente.
 * EXCLUYE 'Sucesos' para cumplir con políticas de AdSense.
 *
 * Estrategia: traemos limit*5 documentos y filtramos en servidor.
 * Esto evita índices compuestos complejos en Firestore.
 */
export async function getLatestNews(limitCount: number = 30): Promise<Noticia[]> {
  try {
    const db = getAdminDb();
    const fetchLimit = Math.min(limitCount * 5, 200);

    const snap = await db
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(fetchLimit)
      .get();

    const noticias = snap.docs
      .map(mapNoticia)
      .filter(n => esCategoriaSegura(n.categoria || ''))
      .slice(0, limitCount);

    console.log(`[homepage.ts] getLatestNews: ${snap.docs.length} docs fetched, ${noticias.length} safe news returned`);
    return noticias;
  } catch (err) {
    console.error('[homepage.ts] ERROR: Fallo al obtener noticias recientes:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Obtiene las noticias más leídas de los últimos 7 días.
 * Ordena por vistas descendente, excluye 'Sucesos', fallback a recientes limpias.
 */
export async function getTrendingNews(limitCount: number = 5): Promise<Noticia[]> {
  try {
    const db = getAdminDb();
    const { Timestamp } = await import('firebase-admin/firestore');

    // Últimos 7 días — traemos más para filtrar Sucesos
    const cutoff7 = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const snap7 = await db
      .collection('noticias')
      .where('fecha', '>=', cutoff7)
      .orderBy('fecha', 'desc')
      .limit(60)
      .get();

    if (!snap7.empty) {
      const withViews = snap7.docs
        .map(mapNoticia)
        .filter(n => esCategoriaSegura(n.categoria || '') && (n.vistas ?? 0) >= 1)
        .sort((a, b) => (b.vistas ?? 0) - (a.vistas ?? 0));

      if (withViews.length >= limitCount) {
        return withViews.slice(0, limitCount);
      }
    }

    // Fallback: noticias más recientes limpias
    const snapAll = await db
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(limitCount * 5)
      .get();

    if (!snapAll.empty) {
      return snapAll.docs
        .map(mapNoticia)
        .filter(n => esCategoriaSegura(n.categoria || ''))
        .slice(0, limitCount);
    }

    return [];
  } catch (err) {
    console.error('[homepage.ts] ERROR: Fallo al obtener trending:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Incrementa vistas de una noticia de forma atómica por slug.
 * Usado por el route handler /api/views/[slug]
 */
export async function incrementViewsBySlug(slug: string): Promise<number | null> {
  try {
    const db = getAdminDb();

    const snap = await db
      .collection('noticias')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snap.empty) return null;

    const docRef = snap.docs[0].ref;
    const currentViews = snap.docs[0].data().vistas || 0;

    await docRef.update({
      vistas: FieldValue.increment(1),
    });

    return currentViews + 1;
  } catch (err) {
    console.error('[homepage.ts] ERROR: Fallo al incrementar vistas:', err instanceof Error ? err.message : String(err));
    return null;
  }
}
