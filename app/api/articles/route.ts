import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { generateSlug } from '@/lib/slug';
import { guardarConMeni } from '@/lib/editorial/guardar-con-meni';
import type { NoticiaInput } from '@/lib/meni';
import { logger } from '@/lib/logger';

export const maxDuration = 30;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, contenido, resumen, categoria, imagen, autor, premium } = body;

    if (!titulo || !contenido) {
      return NextResponse.json(
        { error: 'Título y contenido son obligatorios' },
        { status: 400 }
      );
    }

    const wordCount = countWords(contenido);
    if (wordCount < 500) {
      return NextResponse.json(
        {
          error: `El artículo debe tener mínimo 500 palabras. Actualmente tiene ${wordCount}.`,
          wordCount,
        },
        { status: 400 }
      );
    }

    const slug = generateSlug(titulo);

    const existing = await adminDb
      .collection('noticias')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    // ANTI-DUPLICADOS: si ya existe una noticia con este slug, NO crear un
    // duplicado con sufijo aleatorio (eso canibalizaba el SEO en Google).
    // Devolvemos la noticia existente para que la automatizacion no duplique.
    if (!existing.empty) {
      const doc = existing.docs[0];
      return NextResponse.json({
        success: true,
        duplicate: true,
        id: doc.id,
        slug,
        message: 'Ya existe una noticia con este titulo/slug. No se creo duplicado.',
        url: `https://nicaraguainformate.com/noticias/${slug}`,
      });
    }

    const finalSlug = slug;
    const now = new Date();

    // MENI canonico — toda nota nueva debe pasar por la cadena editorial
    const noticiaInput: NoticiaInput = {
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      resumen: resumen?.trim() || '',
      categoria: categoria || 'General',
      autor: autor || 'Redacción Nicaragua Informate',
      fecha: now.toISOString(),
      slug: finalSlug,
    };

    const { ok: meniOk, meni, supervisor, supervisorApproved, updateData: meniUpdateData } = await guardarConMeni(noticiaInput, adminDb);

    if (!meniOk) {
      const first = meni.blockingIssues?.[0];
      return NextResponse.json({
        error: first ? `[${first.code}] ${first.title}: ${first.description}` : 'Noticia no aprobada por MENI',
        code: first?.code || 'MENI_NOT_APPROVED',
        blockingIssues: meni.blockingIssues || [],
        scoreFinal: meni.scoreFinal,
      }, { status: 400 });
    }

    // BLOQUEO del Supervisor Editorial — MENI no es el jefe
    if (!supervisorApproved) {
      const criticalIssues = supervisor.issues.filter(i => i.severity === 'CRITICAL');
      const first = criticalIssues[0];
      return NextResponse.json({
        error: first ? `[${first.domain}] ${first.problem}` : 'Noticia bloqueada por el Supervisor Editorial',
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
        warnings: supervisor.issues.filter(i => i.severity === 'WARNING' || i.severity === 'IMPORTANT'),
      }, { status: 400 });
    }

    const articleRef = adminDb.collection('noticias').doc();
    const finalCategoria = (meniUpdateData.categoria as string) || categoria || 'General';
    await articleRef.set({
      ...meniUpdateData,
      titulo,
      slug: finalSlug,
      contenido,
      resumen: resumen || '',
      categoria: finalCategoria,
      imagen: imagen || '',
      autor: autor || 'Redacción Nicaragua Informate',
      autorRol: finalCategoria === 'Deportes' ? 'Redacción Deportiva' : 'Nicaragua Informate',
      fecha: now,
      fechaActualizacion: now,
      publishedAt: now,
      dateModified: now,
      vistas: 0,
      publicado: true,
      estado: 'publicado',
      premium: premium === true,
    });

    const articleId = articleRef.id;

    // REGLA: Usar el publication-pipeline canonico en lugar de fetch sueltos.
    // El pipeline ejecuta Telegram + Facebook + IndexNow + Push + social copy.
    try {
      const { runPublicationPipeline } = await import('@/lib/meni/publication-pipeline');
      // No bloquea la respuesta: corre en background
      runPublicationPipeline({
        db: adminDb,
        articleId,
        slug: finalSlug,
        titulo,
        resumen: resumen || '',
        contenido,
        categoria: finalCategoria,
        imagen: imagen || undefined,
        autor: autor || 'Redacción Nicaragua Informate',
        story: body.story,
      }).catch((e) => logger.warn('[articles] publication-pipeline error (non-blocking):', e));
    } catch (e) {
      logger.warn('[articles] No se pudo importar publication-pipeline:', e);
    }

    // REGLA: Toda noticia publicada entra en WATCH automaticamente.
    try {
      const { runWatchCycle, persistWatchResult } = await import('@/lib/news-watch');
      runWatchCycle(
        {
          id: articleId,
          titulo,
          contenido,
          resumen: resumen || '',
          categoria: finalCategoria,
          fecha: now.toISOString(),
        },
        { db: adminDb }
      )
        .then((watchResult) => persistWatchResult(adminDb, articleId, watchResult))
        .catch((e) => logger.warn('[articles] WATCH init error (non-blocking):', e));
    } catch (e) {
      logger.warn('[articles] No se pudo importar news-watch:', e);
    }

    // Invalidar cache en memoria para que lecturas futuras vean la nueva noticia
    try {
      const { invalidateFirestoreCache } = await import('@/lib/data');
      invalidateFirestoreCache();
    } catch (e) { /* noop */ }

    // Notificar a Google Indexing API (no bloquea la respuesta)
    const articleUrl = `https://nicaraguainformate.com/noticias/${finalSlug}`;
    import('@/lib/google-indexing').then(({ notifyGoogleIndexing }) => {
      notifyGoogleIndexing(articleUrl).catch(() => {});
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      id: articleId,
      slug: finalSlug,
      wordCount,
      url: `https://nicaraguainformate.com/noticias/${finalSlug}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
