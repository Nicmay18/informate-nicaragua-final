import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { revalidateTag, revalidatePath } from 'next/cache';

export const maxDuration = 30;
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { ensureUniqueSlug } from '@/lib/slug';
import { categoryToSlug } from '@/lib/types';
import { guardarConMeni } from '@/lib/editorial/guardar-con-meni';
import type { NoticiaInput } from '@/lib/meni';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { findGenerationDefects } from '@/lib/editorial/content-integrity';
import { applyTechnicalMutation, isApprovalCurrent } from '@/lib/editorial/mutation-policy';
import { logger } from '@/lib/logger';

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

    // Provenance gate: si se cambia contenido, titulo o resumen, requerir MENI + Supervisor.
    // `resumen` antes caía en el camino metadata-only donde NO estaba permitido y
    // se descartaba silenciosamente (Admin guardaba pero el cambio nunca llegaba a Firestore).
    const contentChanged =
      body.contenido !== undefined ||
      body.titulo !== undefined ||
      body.resumen !== undefined ||
      // `autor` forma parte del contentHash — un cambio real requiere reevaluación
      (body.autor !== undefined && body.autor !== snap.data()?.autor);
    const tryingToPublish = body.publicado === true;
    // Aprobación vigente = aprobadoMeni AND supervisorApproved AND contentHash
    // coincide con el contenido actual (no basta el flag suelto).
    const alreadyApproved = isApprovalCurrent(snap.data() || {});

    if (contentChanged) {
      // VALIDATE→REJECT→LOG: defectos mecánicos/fabricados conocidos del pipeline
      const contentDefects = findGenerationDefects([body.titulo, body.resumen, body.contenido].filter(Boolean).join('\n'));
      if (contentDefects.length > 0) {
        logger.error('[admin/news PUT] Contenido rechazado por defectos de generación:', { id, defects: contentDefects.map(d => d.code) });
        return NextResponse.json({
          success: false,
          error: 'Contenido rechazado: defectos mecánicos de generación detectados',
          code: 'CONTENT_INTEGRITY_VIOLATION',
          defects: contentDefects,
        }, { status: 400 });
      }

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

      // Editor Jefe — Fase 1: la edición humana de una nota existente ES la
      // corrección del editor. Se captura del diff real (antes en Firestore vs
      // después enviado) en vez de depender de que el panel envíe `correcciones`,
      // que nadie enviaba: la cadena editor_corrections → editor_patterns
      // quedaba vacía y el aprendizaje del Editor Jefe nunca se alimentaba.
      try {
        const { registerCorrection } = await import('@/lib/meni/editor-jefe/correction-tracker');
        const campos: { campo: 'titulo' | 'cuerpo' | 'entrada'; antes: string; despues: string }[] = [];
        if (body.titulo !== undefined && body.titulo !== existingData.titulo) {
          campos.push({ campo: 'titulo', antes: String(existingData.titulo || ''), despues: String(body.titulo) });
        }
        if (body.resumen !== undefined && body.resumen !== existingData.resumen) {
          campos.push({ campo: 'entrada', antes: String(existingData.resumen || ''), despues: String(body.resumen) });
        }
        if (body.contenido !== undefined && body.contenido !== existingData.contenido) {
          campos.push({ campo: 'cuerpo', antes: String(existingData.contenido || ''), despues: String(body.contenido) });
        }
        for (const c of campos) {
          await registerCorrection(db, {
            articleId: id,
            campo: c.campo,
            antes: c.antes,
            despues: c.despues,
            categoria: String(updateData.categoria || existingData.categoria || 'General'),
          });
        }
        if (campos.length > 0) {
          logger.info('[admin/news PUT] Editor Jefe: correcciones registradas', { id, campos: campos.map((c) => c.campo) });
        }
      } catch (corrErr) {
        logger.warn('[admin/news PUT] Correction tracking falló (no bloqueante):', corrErr);
      }

      // Trust layer: la edición puede cambiar la evidencia de confianza.
      try {
        const { analyzeTrust } = await import('@/lib/editorial/trust');
        const trust = analyzeTrust({
          titulo: String(updateData.titulo ?? existingData.titulo ?? ''),
          cuerpo: String(updateData.contenido ?? existingData.contenido ?? ''),
          categoria: String(updateData.categoria ?? existingData.categoria ?? 'General'),
        });
        await applyTechnicalMutation(
          db,
          id,
          {
            confianza: {
              nivel: trust.nivel,
              resumen: trust.resumen,
              requiereRevisionHumana: trust.requiereRevisionHumana,
              riesgos: trust.riesgos.map(r => r.detail ?? r.text).slice(0, 10),
              noDisponible: trust.noDisponible.length,
              fuentes: trust.fuentes,
              at: new Date().toISOString(),
            },
          },
          { actor: 'admin/news PUT', reason: 'Trust layer post-edición' },
        );
      } catch (trustErr) {
        logger.warn('[admin/news PUT] Trust layer falló (no bloqueante):', trustErr);
      }
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
      // Solo metadata que no altera la categoria canonica ni el contenido.
      // `autor` NO está permitido aquí: forma parte del contentHash — cambiarlo
      // invalidaría la aprobación vigente sin reevaluación.
      const allowed = ['imagen', 'destacada', 'publicado'];
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

      // Política técnica: provenance + guard de publicación (publicado=true
      // exige aprobación vigente, verificado arriba y re-verificado aquí).
      const tech = await applyTechnicalMutation(db, id, updateData, {
        actor: 'admin/news PUT',
        reason: 'Metadata-only update',
      });
      if (!tech.applied) {
        return NextResponse.json({
          success: false,
          error: 'No se puede publicar una noticia sin aprobación editorial vigente',
          code: tech.rejected || 'MENI_NOT_APPROVED',
        }, { status: 400 });
      }
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
    // Categoría: revalidar la anterior y la actual (puede haber cambiado)
    const catBefore = snap.data()?.categoria;
    const after = await ref.get();
    const catAfter = after.data()?.categoria;
    for (const cat of new Set([catBefore, catAfter].filter(Boolean))) {
      revalidatePath(`/categoria/${categoryToSlug(String(cat))}`);
    }
    revalidatePath('/news-sitemap.xml');
    revalidatePath('/sitemap.xml');

    // Invalidar cache en memoria de Firestore
    try {
      const { invalidateFirestoreCache } = await import('@/lib/data');
      invalidateFirestoreCache();
    } catch (e) { /* noop */ }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[admin/news PUT]', err);
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

      await applyTechnicalMutation(
        db,
        id,
        {
          estado: 'archivado',
          archived: true,
          publicado: false,
          noindex: true,
          deletedAt: new Date(),
          deletedBy: request.headers.get('x-admin-token') ? 'admin' : 'system',
          deleteReason: 'soft-delete por DELETE admin/news/[id]',
          deleteSnapshot: snapshot,
          dateModified: new Date(),
        },
        { actor: 'admin/news DELETE', reason: 'Soft-delete de nota publicada' },
      );

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
        logger.warn('[admin/news DELETE] No se pudo escribir auditoria:', e);
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
      if (beforeData.categoria) revalidatePath(`/categoria/${categoryToSlug(String(beforeData.categoria))}`);

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
      logger.warn('[admin/news DELETE] No se pudo escribir auditoria:', e);
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
    if (beforeData.categoria) revalidatePath(`/categoria/${categoryToSlug(String(beforeData.categoria))}`);

    return NextResponse.json({
      success: !existsAfter,
      action: 'HARD_DELETE',
      existedBefore,
      existsAfter,
      slug: slugBefore,
      id,
    });
  } catch (err) {
    logger.error('[admin/news DELETE]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
