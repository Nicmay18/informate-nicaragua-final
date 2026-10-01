import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getAdminDb } from '@/lib/firebase-admin';

async function fetchListAll(categoria: string | null, limit: number) {
  const db = getAdminDb();
  // Solo publicadas — este endpoint es público (lo consume Header.tsx);
  // sin el filtro exponía borradores y archivadas.
  let query: FirebaseFirestore.Query = db.collection('noticias')
    .where('estado', '==', 'publicado')
    .orderBy('fecha', 'desc');
  if (categoria) {
    query = query.where('categoria', '==', categoria);
  }
  const snap = await query
    .limit(limit)
    .select('slug', 'titulo', 'contenido', 'resumen', 'fecha')
    .get();
  return snap.docs.map(d => {
    const data = d.data() as any;
    return {
      id: d.id,
      slug: data.slug || d.id,
      titulo: data.titulo || '(sin título)',
      contenidoLength: (data.contenido || '').length,
      resumenLength: (data.resumen || '').length,
      fecha: data.fecha?.toDate?.() || data.fecha,
    };
  });
}

const cachedListAll = (categoria: string | null, limit: number) =>
  unstable_cache(() => fetchListAll(categoria, limit), ['list-all', categoria || 'all', String(limit)], {
    revalidate: 300,
    tags: ['noticias'],
  });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const limitParam = parseInt(searchParams.get('limit') || '200', 10);
    const limit = Math.min(Math.max(limitParam, 1), 200);

    const articles = await cachedListAll(categoria, limit)();
    return NextResponse.json({ total: articles.length, articles });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
