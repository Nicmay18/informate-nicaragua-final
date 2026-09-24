import { NextResponse } from 'next/server';
import { getCategoryPaginated, getNewsPaginated } from '@/lib/data';
import { CATEGORY_MAP } from '@/lib/constants';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCategoria = searchParams.get('categoria')?.trim() || '';
    const limitParam = Number.parseInt(searchParams.get('limit') || '200', 10);
    const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 5, 1), 200);

    // This endpoint is consumed by the public Header. Reuse the canonical
    // publication-aware data layer instead of querying Firestore directly.
    // The previous direct query ordered by `fecha` without the `estado`
    // constraint, which could require an index that did not match the
    // canonical public-news query.
    if (rawCategoria) {
      const category = CATEGORY_MAP[rawCategoria.toLowerCase()];
      if (!category) {
        return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 });
      }

      const articles = await getCategoryPaginated(category.name, 1, limit);
      return NextResponse.json({
        total: articles.length,
        articles: articles.map((article) => ({
          id: article.id,
          slug: article.slug,
          titulo: article.titulo || '(sin título)',
          contenidoLength: article.contenido?.length || 0,
          resumenLength: article.resumen?.length || 0,
          fecha: article.fecha,
        })),
      });
    }

    const articles = await getNewsPaginated(1, limit);
    return NextResponse.json({
      total: articles.length,
      articles: articles.map((article) => ({
        id: article.id,
        slug: article.slug,
        titulo: article.titulo || '(sin título)',
        contenidoLength: article.contenido?.length || 0,
        resumenLength: article.resumen?.length || 0,
        fecha: article.fecha,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
