import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const { path, categorySlug, articleSlug } = await request.json();

    // Revalidar la página principal
    revalidatePath('/');

    // Revalidar la categoría si se proporciona
    if (categorySlug) {
      revalidatePath(`/categoria/${categorySlug}`);
    }

    // Revalidar página del artículo individual
    if (articleSlug) {
      revalidatePath(`/noticias/${articleSlug}`);
    }

    // Revalidar páginas de listados
    revalidatePath('/noticias');

    return NextResponse.json({ revalidated: true, path: path || '/' });
  } catch (error) {
    console.error('[Revalidate] Error:', error);
    return NextResponse.json({ revalidated: false, error: String(error) }, { status: 500 });
  }
}
