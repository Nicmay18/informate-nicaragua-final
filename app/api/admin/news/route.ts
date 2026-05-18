import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-key');
  const expected = process.env.ADMIN_API_KEY;
  return !!expected && key === expected;
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const db = getAdminDb();
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();
    const news = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        slug: data.slug || d.id,
        titulo: data.titulo || '',
        resumen: data.resumen || '',
        contenido: data.contenido || '',
        categoria: data.categoria || 'General',
        imagen: data.imagen || '',
        fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || new Date().toISOString(),
        autor: data.autor || 'Nicaragua Informate',
        destacada: !!data.destacada,
        vistas: data.vistas || 0,
        publicado: data.publicado !== false,
      };
    });
    return NextResponse.json({ success: true, news });
  } catch (err) {
    console.error('[admin/news GET]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { titulo, resumen, contenido, categoria, imagen, autor, destacada } = body;

    if (!titulo || !resumen || !contenido || !categoria) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const slug = slugify(titulo) + '-' + Date.now();
    const db = getAdminDb();
    const docRef = await db.collection('noticias').add({
      titulo,
      resumen,
      contenido,
      categoria,
      imagen: imagen || '',
      slug,
      autor: autor || 'Nicaragua Informate',
      destacada: !!destacada,
      vistas: 0,
      fecha: Timestamp.now(),
      publicado: true,
    });

    return NextResponse.json({ success: true, id: docRef.id, slug });
  } catch (err) {
    console.error('[admin/news POST]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
