import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const secret = request.headers.get('x-revalidate-secret');
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { type, slug, category } = body;

    const revalidated = [];

    // Revalidar noticia individual
    if (type === 'noticia' && slug) {
      revalidatePath(`/noticias/${slug}`);
      revalidated.push(`/noticias/${slug}`);
      revalidateTag(`noticia-${slug}`);
      revalidateTag('noticias');
    }

    // Revalidar categoría
    if (category) {
      revalidatePath(`/categoria/${category}`);
      revalidated.push(`/categoria/${category}`);
      revalidateTag(`categoria-${category}`);
    }

    // Siempre revalidar home
    revalidatePath('/');
    revalidated.push('/');
    revalidateTag('home');

    return NextResponse.json({
      revalidated: true,
      paths: revalidated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
