import { adminDb } from '@/lib/firebase-admin';
import { normalizeEditorialTitle } from '@/lib/formateo';

export interface FeedArticle {
  title: string;
  slug: string;
  description: string;
  contenido: string;
  pubDate: string;
  category: string;
  imagen: string;
  autor: string;
}

function toCanonicalDate(v: unknown): number {
  if (!v) return 0;
  if (typeof v === 'object' && v !== null) {
    const o = v as { toDate?: () => Date; _seconds?: number; seconds?: number };
    if (typeof o.toDate === 'function') return o.toDate().getTime();
    const s = o._seconds ?? o.seconds;
    if (typeof s === 'number') return s * 1000;
    return 0;
  }
  const t = new Date(v as string).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Fetch public articles for RSS/JSON feeds.
 *
 * 'fecha' es de tipo mixto en Firestore (Timestamp y string ISO), por lo que
 * orderBy('fecha') descarta uno de los dos grupos. Se lee la coleccion y se
 * ordena en memoria por fecha canonica, igual que el listado del Admin.
 * Solo incluye noticias publicadas (nunca borradores ni archivadas).
 */
export async function fetchFeedArticles(limit = 50): Promise<FeedArticle[]> {
  const snapshot = await adminDb.collection('noticias').get();

  const publicDocs = snapshot.docs
    .map((doc) => ({ doc, d: doc.data() }))
    .filter(({ d }) => d.publicado === true && d.estado === 'publicado' && d.archived !== true)
    .map((x) => ({
      ...x,
      ts:
        toCanonicalDate(x.d.publishedAt) ||
        toCanonicalDate(x.d.fechaPublicacion) ||
        toCanonicalDate(x.d.fecha),
    }))
    .sort((a, b) => b.ts - a.ts || a.doc.id.localeCompare(b.doc.id))
    .slice(0, limit);

  return publicDocs.map(({ d, ts }) => {
    const fecha = ts > 0 ? new Date(ts).toUTCString() : new Date().toUTCString();
    const imgRaw = (d.imagen || '') as string;
    const imgUrl = imgRaw.startsWith('http') ? imgRaw : imgRaw ? `https://nicaraguainformate.com${imgRaw}` : '';
    return {
      title: normalizeEditorialTitle(d.titulo as string),
      slug: d.slug as string,
      description: (d.resumen || d.titulo) as string,
      contenido: (d.contenido || '') as string,
      pubDate: fecha,
      category: (d.categoria || 'General') as string,
      imagen: imgUrl,
      autor: (d.autor || 'Redacción Nicaragua Informate') as string,
    };
  });
}
