import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// Mapea nombre de categoria (display) a su slug de URL
const CATEGORIA_SLUG: Record<string, string> = {
  'Sucesos': 'sucesos',
  'Nacionales': 'nacionales',
  'Economía': 'economia',
  'Cultura': 'cultura',
  'Espectáculos': 'espectaculos',
  'Deportes': 'deportes',
  'Tecnología': 'tecnologia',
  'Internacionales': 'internacionales',
  'Salud': 'salud',
};

function slugificarCategoria(cat?: string): string | null {
  if (!cat) return null;
  if (CATEGORIA_SLUG[cat]) return CATEGORIA_SLUG[cat];
  // Fallback: normalizar acentos y espacios
  return cat
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Aceptar tanto los nombres nuevos (panel) como los antiguos (compat)
    const articleSlug: string | undefined = body.slug || body.articleSlug;
    const categoryRaw: string | undefined = body.category || body.categorySlug;
    const path: string | undefined = body.path;

    const revalidados: string[] = [];

    // Pagina principal
    revalidatePath('/');
    revalidados.push('/');

    // Listados de noticias
    revalidatePath('/noticias');
    revalidados.push('/noticias');

    // Pagina individual de la noticia (CRITICO: lo que faltaba)
    if (articleSlug) {
      revalidatePath(`/noticias/${articleSlug}`);
      revalidados.push(`/noticias/${articleSlug}`);
    }

    // Categoria
    const catSlug = slugificarCategoria(categoryRaw);
    if (catSlug) {
      revalidatePath(`/categoria/${catSlug}`);
      revalidados.push(`/categoria/${catSlug}`);
    }

    // Path arbitrario opcional
    if (path && path !== '/') {
      revalidatePath(path);
      revalidados.push(path);
    }

    // Invalidar caches por tag (homepage usa estos tags)
    // 'all-noticias' es el cache compartido de lectura de Firestore: invalidarlo
    // fuerza UNA relectura fresca que las 3 funciones de portada reusan.
    revalidateTag('all-noticias');
    revalidateTag('latest-news');
    revalidateTag('trending-news');
    revalidateTag('popular-news');
    revalidateTag('news-by-slug');
    revalidateTag('related-news');

    // CRITICO para indexacion rapida: invalidar sitemaps al instante
    // para que Google News vea la noticia nueva sin esperar 1h de revalidate.
    revalidateTag('news-sitemap');
    revalidatePath('/news-sitemap.xml');
    revalidatePath('/sitemap.xml');
    revalidados.push('/news-sitemap.xml', '/sitemap.xml');

    return NextResponse.json({ revalidated: true, paths: revalidados });
  } catch (error) {
    console.error('[Revalidate] Error:', error);
    return NextResponse.json({ revalidated: false, error: String(error) }, { status: 500 });
  }
}
