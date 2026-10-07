import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const fetchCounts = async () => {
  const { getAdminDb } = await import('@/lib/firebase-admin');
  const db = getAdminDb();

  const { publishedArticlesQuery } = await import('@/lib/nios/intelligence/metric-truth');

  // count() NO lee documentos — solo cuenta, ~20x más barato que .get()
  // "publicadas" = universo canónico PUBLICADO (metric-truth.ts).
  const [allAgg, pubAgg] = await Promise.all([
    db.collection('noticias').count().get(),
    publishedArticlesQuery(db.collection('noticias')).count().get(),
  ]);

  const total = allAgg.data().count;
  const publicadas = pubAgg.data().count;

  return { total, publicadas };
};

const cachedCounts = unstable_cache(fetchCounts, ['news-counts'], {
  revalidate: 86400,
  tags: ['news-counts'],
});

export async function GET() {
  try {
    const { total, publicadas } = await cachedCounts();
    return NextResponse.json({ total, publicadas });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
