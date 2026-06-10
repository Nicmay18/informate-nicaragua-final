import { NextResponse } from 'next/server';
import { incrementViewsBySlug } from '@/lib/db/homepage';

/**
 * Route Handler: incrementa vistas de una noticia de forma atómica.
 * POST /api/views/[slug]
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere un slug válido' },
        { status: 400 }
      );
    }

    const newViews = await incrementViewsBySlug(slug);

    if (newViews === null) {
      return NextResponse.json(
        { error: 'Noticia no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, slug, vistas: newViews });
  } catch (error) {
    console.error('[views/[slug]] Error:', error);
    return NextResponse.json(
      { error: 'Error interno', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
