import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { revalidateTag, revalidatePath } from 'next/cache';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { ensureUniqueSlug } from '@/lib/slug';
import { guardarConMeni } from '@/lib/editorial/guardar-con-meni';
import type { NoticiaInput } from '@/lib/meni';
import { sanitizeArticleHtml } from '@/lib/sanitize';

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getAdminDb();
    const ref = db.collection('noticias').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Noticia no encontrada' }, { status: 404 });
    }

    // ── Provenance gate: si se cambia contenido o título, requerir MENI ──
    const contentChanged = body.contenido !== undefined || body.titulo !== undefined;
    const tryingToPublish = body.publicado === true;
    const alreadyApproved = snap.data()?.aprobadoMeni === true;

    if (contentChanged) {
      // Re-evaluar con MENI canónico
      const existingData = snap.data()!;
      const noticiaInput: NoticiaInput = {
        id,
        titulo: body.titulo ? body.titulo.trim() : existingData.titulo || '',
        contenido: body.contenido ? sanitizeArticleHtml(body.contenido.trim()) : existingData.contenido || '',
        resumen: body.resumen ? body.resumen.trim() : existingData.resumen || '',
        categoria: body.categoria || existingData.categoria || 'General',
        autor: body.autor || existingData.autor || '',
        fecha: existingData.fecha?.toDate ? existingData.fecha.toDate().toISOString() : new Date().toISOString(),
        imagen: body.imagen || existingData.imagen || undefined,
        slug: existingData.slug || '',
      };

      const { ok: meniOk, meni, updateData: meniUpdateData } = await guardarConMeni(noticiaInput, db);

      if (!meniOk) {
        const first = meni.blockingIssues?.[0];
        return NextResponse.json({
          success: false,
          error: first ? `[${first.code}] ${first.title}: ${first.description}` : 'Noticia no aprobada por MENI tras edición',
          code: first?.code || 'MENI_NOT_APPROVED',
          blockingIssues: meni.blockingIssues || [],
          scoreFinal: meni.scoreFinal,
        }, { status: 400 });
      }

      // Merge MENI update data with metadata-only fields
      const metadataAllowed = ['imagen', 'autor', 'destacada', 'publicado', 'categoria', 'resumen'];
      const updateData: Record<string, unknown> = { ...meniUpdateData };
      for (const key of metadataAllowed) {
        if (body[key] !== undefined) {
          if (key === 'destacada' || key === 'publicado') {
            updateData[key] = !!body[key];
          } else {
            updateData[key] = body[key];
          }
        }
      }
      if (body.titulo) updateData.titulo = body.titulo;
      if (body.contenido) updateData.contenido = sanitizeArticleHtml(body.contenido);

      // Helper: verifica si un slug ya existe en OTRA noticia (excluye la actual)
      const slugExists = async (candidate: string): Promise<boolean> => {
        const q = await db.collection('noticias').where('slug', '==', candidate).limit(1).get();
        return !q.empty && q.docs[0].id !== id;
      };

      if (body.titulo && body.regenerateSlug === true && !body.slug) {
        updateData.slug = await ensureUniqueSlug(body.titulo, slugExists);
      }
      if (!snap.data()?.slug && body.titulo) {
        updateData.slug = await ensureUniqueSlug(body.titulo, slugExists);
      }
      updateData.fechaActualizacion = Timestamp.now();

      await ref.update(updateData);
    } else {
      // Solo metadata cambios — permitir sin MENI, pero bloquear publicar si no aprobado
      if (tryingToPublish && !alreadyApproved) {
        return NextResponse.json({
          success: false,
          error: 'No se puede publicar una noticia que no ha sido aprobada por MENI',
          code: 'MENI_NOT_APPROVED',
        }, { status: 400 });
      }

      const updateData: Record<string, unknown> = {};
      const allowed = ['categoria', 'imagen', 'autor', 'destacada', 'publicado'];
      for (const key of allowed) {
        if (body[key] !== undefined) {
          if (key === 'destacada' || key === 'publicado') {
            updateData[key] = !!body[key];
          } else {
            updateData[key] = body[key];
          }
        }
      }
      updateData.fechaActualizacion = Timestamp.now();

      await ref.update(updateData);
    }

    revalidateTag('noticias');
    revalidateTag('latest-news');
    revalidateTag('trending-news');
    revalidateTag('news-sitemap');
    revalidateTag('sitemap-news');

    // Revalidar pagina del articulo individual (ISR cache)
    const slug = snap.data()?.slug || id;
    revalidatePath('/');
    revalidatePath('/noticias');
    revalidatePath(`/noticias/${slug}`);
    revalidatePath('/news-sitemap.xml');
    revalidatePath('/sitemap.xml');

    // Invalidar cache en memoria de Firestore
    try {
      const { invalidateFirestoreCache } = await import('@/lib/data');
      invalidateFirestoreCache();
    } catch (e) { /* noop */ }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/news PUT]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const db = getAdminDb();
    const ref = db.collection('noticias').doc(id);
    const before = await ref.get();
    const existedBefore = before.exists;
    const slugBefore = before.data()?.slug || null;

    await ref.delete();

    const after = await ref.get();
    const existsAfter = after.exists;

    // Invalidar cache en memoria de Firestore
    try {
      const { invalidateFirestoreCache } = await import('@/lib/data');
      invalidateFirestoreCache();
    } catch (e) { /* noop */ }

    revalidateTag('latest-news');
    revalidateTag('trending-news');
    revalidateTag('news-sitemap');
    revalidateTag('sitemap-news');
    revalidatePath('/');
    revalidatePath('/noticias');
    if (slugBefore) revalidatePath(`/noticias/${slugBefore}`);

    return NextResponse.json({
      success: !existsAfter,
      existedBefore,
      existsAfter,
      slug: slugBefore,
      id,
    });
  } catch (err) {
    console.error('[admin/news DELETE]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
