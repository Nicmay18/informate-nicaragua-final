import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getAdminDb } from '@/lib/firebase-admin';

async function fetchListAll(categoria: string | null, limit: number) {
  const db = getAdminDb();
  // Solo publicadas — este endpoint es público (lo consume Header.tsx);
  // sin el filtro exponía borradores y archivadas.
  const fields = ['slug', 'titulo', 'contenido', 'resumen', 'fecha', 'publishedAt', 'fechaPublicacion'];
  const base = () => {
    let q: FirebaseFirestore.Query = db.collection('noticias').where('estado', '==', 'publicado');
    if (categoria) q = q.where('categoria', '==', categoria);
    return q;
  };
  const { Timestamp } = await import('firebase-admin/firestore');
  const tsBoundary = Timestamp.fromDate(new Date('2100-01-01T00:00:00Z'));
  const [tsSnap, strSnap] = await Promise.all([
    base().where('fecha', '<', tsBoundary).orderBy('fecha', 'desc').select(...fields).limit(limit).get(),
    base().where('fecha', '>=', ' ').orderBy('fecha', 'desc').select(...fields).limit(limit).get(),
  ]);
  // publishedAt rescata docs sin `fecha` o con fecha inválida; si falta el
  // índice compuesto, el fallback single-field filtra en memoria.
  let pubDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  try {
    pubDocs = (await base().orderBy('publishedAt', 'desc').select(...fields).limit(limit).get()).docs;
  } catch {
    const fb = await db.collection('noticias').orderBy('publishedAt', 'desc').select(...fields).limit(limit * 2).get();
    pubDocs = fb.docs.filter((d) => {
      const data = d.data() as any;
      return data.estado === 'publicado' && (!categoria || data.categoria === categoria);
    });
  }
  const pubSnap = { docs: pubDocs };
  const merged = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
  for (const d of [...tsSnap.docs, ...strSnap.docs, ...pubSnap.docs]) merged.set(d.id, d);
  const canonTs = (data: any): number => {
    const v = data.publishedAt || data.fechaPublicacion || data.fecha;
    const t = new Date(v?.toDate?.() || v).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  const snap = { docs: [...merged.values()].sort((a, b) => canonTs(b.data()) - canonTs(a.data())).slice(0, limit) };
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
