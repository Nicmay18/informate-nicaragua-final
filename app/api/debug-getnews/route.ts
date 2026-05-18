import { NextResponse } from 'next/server';
import { getNews } from '@/lib/data';

export async function GET() {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const noticias = await getNews(100);
    return NextResponse.json({
      count: noticias.length,
      first5: noticias.slice(0, 5).map(n => ({ titulo: n.titulo, slug: n.slug, imagen: n.imagen })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
