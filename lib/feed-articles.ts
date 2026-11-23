import { adminDb } from '@/lib/firebase-admin';
import { normalizeEditorialTitle } from '@/lib/formateo';
import { trackRegen } from '@/lib/metrics/daily-counters';

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
// Fase 1 — solo metadatos para ordenar/filtrar (sin `contenido`, ~10KB/doc).
// La query lee una ventana de candidatas; solo las `limit` ganadoras se
// descargan completas en fase 2. Antes se leían hasta 200 docs COMPLETOS
// (~2.4MB) por regeneración de cada uno de los 6 feeds cacheados.
const FEED_META_FIELDS = [
  'slug', 'titulo', 'resumen', 'categoria', 'imagen', 'autor',
  'fecha', 'fechaPublicacion', 'publishedAt',
  'estado', 'publicado', 'archived',
];

export async function fetchFeedArticles(limit = 50): Promise<FeedArticle[]> {
  // Acotado: filtra en Firestore y lee una ventana acotada — el orden
  // canónico se sigue resolviendo en memoria por el tipo mixto de `fecha`.
  const snapshot = await adminDb.collection('noticias')
    .where('publicado', '==', true)
    .where('estado', '==', 'publicado')
    .limit(Math.max(limit * 4, 200))
    .select(...FEED_META_FIELDS)
    .get();

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

  // Fase 2 — solo las `limit` noticias que salen en el feed se leen completas
  // (contenido incluido, necesario para <content:encoded>).
  const fullDocs = await adminDb.getAll(
    ...publicDocs.map(({ doc }) => adminDb.collection('noticias').doc(doc.id))
  );

  await trackRegen('feed', {
    docs: snapshot.size + fullDocs.length,
    bytes: snapshot.docs.reduce((s, d) => s + JSON.stringify(d.data()).length, 0),
  });

  return publicDocs
    .map(({ doc, d, ts }, i) => {
      const full = fullDocs[i];
      if (!full?.exists) return null;
      const fd = full.data() as Record<string, unknown>;
      const fecha = ts > 0 ? new Date(ts).toUTCString() : new Date().toUTCString();
      const imgRaw = String(fd.imagen || d.imagen || '');
      const imgUrl = imgRaw.startsWith('http') ? imgRaw : imgRaw ? `https://nicaraguainformate.com${imgRaw}` : '';
      return {
        title: normalizeEditorialTitle(String(fd.titulo ?? d.titulo ?? '')),
        slug: String(fd.slug ?? d.slug ?? doc.id),
        description: String(fd.resumen ?? d.resumen ?? fd.titulo ?? d.titulo ?? ''),
        contenido: String(fd.contenido ?? ''),
        pubDate: fecha,
        category: String(fd.categoria ?? d.categoria ?? 'General'),
        imagen: imgUrl,
        autor: String(fd.autor ?? d.autor ?? 'Redacción Nicaragua Informate'),
      };
    })
    .filter((x): x is FeedArticle => x !== null);
}
