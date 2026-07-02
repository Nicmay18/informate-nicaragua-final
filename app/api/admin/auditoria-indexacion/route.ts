import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(500).get();
    const noticias = snap.docs.map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
        slug: data.slug || '(sin slug)',
        titulo: data.titulo || '(sin título)',
        noindex: !!data.noindex,
        publicado: data.publicado !== false,
        estado: data.estado || '(sin estado)',
        fecha: data.fecha?.toDate?.() || data.fecha,
        palabras: data.palabras || 0,
      };
    });

    const conSlug = noticias.filter(n => n.slug && n.slug !== '(sin slug)');
    const sinSlug = noticias.filter(n => !n.slug || n.slug === '(sin slug)');
    const conNoindex = noticias.filter(n => n.noindex);
    const sinPublicar = noticias.filter(n => !n.publicado);
    const conEstadoBorrador = noticias.filter(n => n.estado === 'borrador');

    return NextResponse.json({
      totalFirestore: noticias.length,
      conSlug: conSlug.length,
      sinSlug: sinSlug.length,
      conNoindex: conNoindex.length,
      sinPublicar: sinPublicar.length,
      conEstadoBorrador: conEstadoBorrador.length,
      noticiasActivas: conSlug.filter(n => n.publicado && n.estado !== 'borrador' && !n.noindex).length,
      muestraSlugs: conSlug.slice(0, 20).map(n => n.slug),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
