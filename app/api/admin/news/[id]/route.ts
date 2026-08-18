import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { revalidateTag, revalidatePath } from 'next/cache';

export const maxDuration = 30;
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

    // Provenance gate: si se cambia contenido o titulo, requerir MENI + Supervisor
    const contentChanged = body.contenido !== undefined || body.titulo !== undefined;
    const tryingToPublish = body.publicado === true;
    const alreadyApproved = snap.data()?.aprobadoMeni === true;

    if (contentChanged) {
      // Re-evaluar con MENI canonico
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

      const { ok: meniOk, meni, supervisor, supervisorApproved, updateData: meniUpdateData } = await guardarConMeni(noticiaInput, db);

      if (!meniOk) {
        const first = meni.blockingIssues?.[0];
        return NextResponse.json({
          success: false,
          error: first ? `[${first.code}] ${first.title}: ${first.description}` : 'Noticia no aprobada por MENI tras edicion',
          code: first?.code || 'MENI_NOT_APPROVED',
          blockingIssues: meni.blockingIssues || [],
          scoreFinal: meni.scoreFinal,
        }, { status: 400 });
      }

      // BLOQUEO del Supervisor Editorial — MENI no es el jefe
      if (!supervisorApproved) {
        const issues = supervisor.issues || [];
        const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
        const first = criticalIssues[0] || issues[0];
        const problem = first
          ? `[${first.severity || 'SUPERVISOR'}][${first.domain || 'GENERAL'}] ${first.problem || first.action || 'Bloqueo editorial'}`
          : (supervisor.reason || `Veredicto ${supervisor.verdict}. Confianza: ${supervisor.confidence}%`);
        return NextResponse.json({
          success: false,
          error: problem,
          code: 'SUPERVISOR_BLOCKED',
          supervisor: {
            decisionId: supervisor.decisionId,
            verdict: supervisor.verdict,
            confidence: supervisor.confidence,
            reason: supervisor.reason,
            issues: supervisor.issues,
            actions: supervisor.actions,
          },
          critical: criticalIssues,
          warnings: issues.filter(i => i.severity === 'WARNING' || i.severity === 'IMPORTANT'),
        }, { status: 400 });
      }

      // Merge MENI update data with metadata-only fields
      // La categoria siempre viene del calculo canonico de MENI, no del body
      const metadataAllowed = ['imagen', 'autor', 'destacada', 'publicado', 'resumen'];
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
      // Solo metadata que no altera la categoria canonica
      const allowed = ['imagen', 'autor', 'destacada', 'publicado'];
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
    const beforeData = before.data() || {};
    const slugBefore = beforeData.slug || null;

    // REGLA 17: No borrar noticias publicadas sin control.
    // - DRAFT: puede eliminarse fisicamente
    // - PUBLISHED: soft-delete (archivar + snapshot + auditoria)
    // - ARCHIVED/CORRECTION: conservar trazabilidad
    const estado = beforeData.estado || (beforeData.publicado ? 'publicado' : 'borrador');
    const wasPublished = beforeData.publicado === true || estado === 'publicado';
    const forceHardDelete = request.headers.get('x-force-hard-delete') === 'true';

    if (wasPublished && !forceHardDelete) {
      // Soft-delete: archivar, NO eliminar fisicamente
      const snapshot = {
        titulo: beforeData.titulo || '',
        slug: slugBefore,
        contenido: beforeData.contenido || '',
        resumen: beforeData.resumen || '',
        categoria: beforeData.categoria || '',
        autor: beforeData.autor || '',
        fecha: beforeData.fecha || null,
        publishedAt: beforeData.publishedAt || null,
        scoreMeni: beforeData.scoreMeni ?? null,
        aprobadoMeni: beforeData.aprobadoMeni ?? null,
        supervisorDecision: beforeData.supervisorDecision || null,
      };

      await ref.update({
        estado: 'archivado',
        archived: true,
        publicado: false,
        noindex: true,
        deletedAt: new Date(),
        deletedBy: request.headers.get('x-admin-token') ? 'admin' : 'system',
        deleteReason: 'soft-delete por DELETE admin/news/[id]',
        deleteSnapshot: snapshot,
        dateModified: new Date(),
      });

      // Registrar en auditoria de eliminaciones
      try {
        await db.collection('deletion_audit').add({
          articleId: id,
          action: 'SOFT_DELETE',
          titulo: beforeData.titulo || '',
          slug: slugBefore,
          estadoBefore: estado,
          deletedAt: new Date().toISOString(),
          deletedBy: request.headers.get('x-admin-token') ? 'admin' : 'system',
          reason: 'DELETE admin/news/[id] — noticia publicada archivada',
          snapshot,
        });
      } catch (e) {
        console.warn('[admin/news DELETE] No se pudo escribir auditoria:', e);
      }

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
        success: true,
        action: 'SOFT_DELETE',
        existedBefore,
        estadoBefore: estado,
        slug: slugBefore,
        id,
        message: 'Noticia archivada (soft-delete). URL conservada. Snapshot guardado en deletion_audit.',
      });
    }

    // Hard delete solo para borradores o si se fuerza explicitamente
    await ref.delete();
    const after = await ref.get();
    const existsAfter = after.exists;

    try {
      await db.collection('deletion_audit').add({
        articleId: id,
        action: 'HARD_DELETE',
        titulo: beforeData.titulo || '',
        slug: slugBefore,
        estadoBefore: estado,
        deletedAt: new Date().toISOString(),
        deletedBy: request.headers.get('x-admin-token') ? 'admin' : 'system',
        reason: forceHardDelete ? 'Hard delete forzado por header x-force-hard-delete' : `Estado ${estado} — eliminacion fisica permitida`,
        snapshot: {
          titulo: beforeData.titulo || '',
          slug: slugBefore,
          contenido: beforeData.contenido || '',
          categoria: beforeData.categoria || '',
        },
      });
    } catch (e) {
      console.warn('[admin/news DELETE] No se pudo escribir auditoria:', e);
    }

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
      action: 'HARD_DELETE',
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
