import { NextResponse } from 'next/server';
import { getLatestNews, getTrendingNews } from '@/lib/db/homepage';

export async function GET() {
  try {
    const noticias = await getLatestNews(30);
    const trending = await getTrendingNews(5);

    const hero = noticias.slice(0, 5);
    const heroIds = new Set(hero.map(n => n.id));
    const resto = noticias.filter(n => !heroIds.has(n.id));
    const ultimas = resto.slice(0, 6);

    return NextResponse.json({
      ok: true,
      totalNoticias: noticias.length,
      heroCount: hero.length,
      ultimasCount: ultimas.length,
      trendingCount: trending.length,
      hero: hero.map(n => ({ id: n.id, titulo: n.titulo, categoria: n.categoria, fecha: n.fecha })),
      ultimas: ultimas.map(n => ({ id: n.id, titulo: n.titulo, categoria: n.categoria, fecha: n.fecha })),
      trending: trending.map(n => ({ id: n.id, titulo: n.titulo, categoria: n.categoria, vistas: n.vistas })),
      todas: noticias.map(n => ({ id: n.id, titulo: n.titulo, categoria: n.categoria, fecha: n.fecha })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
