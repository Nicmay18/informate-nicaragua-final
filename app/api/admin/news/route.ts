import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { revalidateTag, revalidatePath } from 'next/cache';
import { notifyGoogleIndexingDeduped } from '@/lib/google-indexing';

export const maxDuration = 30;
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { ensureUniqueSlug } from '@/lib/slug';
import { normalizarTitulo } from '@/lib/meni/titulo';
import { guardarConMeni } from '@/lib/editorial/guardar-con-meni';
import type { NoticiaInput } from '@/lib/meni';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
      if (snap.empty) {
        return NextResponse.json({ success: false, error: 'Noticia no encontrada' }, { status: 404 });
      }
      const d = snap.docs[0];
      const data = d.data();
      const news = {
        id: d.id,
        slug: data.slug || d.id,
        titulo: data.titulo || '',
        resumen: data.resumen || '',
        contenido: data.contenido || '',
        categoria: data.categoria || 'General',
        departamento: data.departamento || '',
        autor: data.autor || 'Nicaragua Informate',
        imagen: data.imagen || '',
        imagenDestacada: data.imagenDestacada || '',
        keywords: data.keywords || '',
        fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || new Date().toISOString(),
        fechaActualizacion: data.fechaActualizacion?.toDate ? data.fechaActualizacion.toDate().toISOString() : data.fechaActualizacion || null,
        publicado: data.publicado !== false,
      };
      return NextResponse.json({ success: true, news }, {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(500).get();
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
        puntosClave: data.puntosClave || [],
        palabras: data.palabras || 0,
        nivel: data.nivel || 'SIN NIVEL',
        nivelScore: data.nivelScore || 0,
        departamento: data.departamento || '',
        keywords: data.keywords || '',
      };
    });
    return NextResponse.json({ success: true, news }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    logger.error('[admin/news GET]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

async function getRelatedLinks(db: any, categoriaLinks: string, excludeId: string) {
  try {
    const snap = await db.collection('noticias').where('categoria', '==', categoriaLinks).orderBy('fecha', 'desc').limit(4).get();
    return snap.docs.filter((d: any) => d.id !== excludeId).slice(0, 3).map((d: any) => {
      const data = d.data();
      return { url: `/noticias/${data.slug || d.id}`, anchor: (data.titulo || 'Leer mas').substring(0, 70), type: 'relacionada' };
    });
  } catch (e) {
    logger.warn('[admin/news] getRelatedLinks error:', e);
    return [];
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { titulo, resumen, contenido, categoria, imagen, autor, destacada, publicado } = body;

    if (!titulo || !resumen || !contenido || !categoria) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const tituloLimpio = normalizarTitulo(titulo);

    const db = getAdminDb();
    const slug = await ensureUniqueSlug(tituloLimpio, async (s) => {
      const existing = await db.collection('noticias').where('slug', '==', s).limit(1).get();
      return !existing.empty;
    });
    const docRef = db.collection('noticias').doc();

    // MENI canonico — toda nota nueva debe pasar por la cadena editorial
    const noticiaInput: NoticiaInput = {
      titulo: tituloLimpio,
      contenido: contenido.trim(),
      resumen: resumen?.trim() || '',
      categoria: categoria || 'General',
      autor: autor || 'Nicaragua Informate',
      fecha: new Date().toISOString(),
      imagen: imagen || undefined,
      slug,
    };

    const { ok: meniOk, meni, supervisor, supervisorApproved, updateData: meniUpdateData } = await guardarConMeni(noticiaInput, db);

    if (!meniOk) {
      const first = meni.blockingIssues?.[0];
      return NextResponse.json({
        success: false,
        error: first ? `[${first.code}] ${first.title}: ${first.description}` : 'Noticia no aprobada por MENI',
        code: first?.code || 'MENI_NOT_APPROVED',
        blockingIssues: meni.blockingIssues || [],
        scoreFinal: meni.scoreFinal,
        calificacion: meni.calificacion,
        diagnostico: meni.diagnostico,
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

    const finalCategoria = (meniUpdateData.categoria as string) || 'Nacionales';
    const relatedLinks = await getRelatedLinks(db, finalCategoria, docRef.id);
    await docRef.set({
      ...meniUpdateData,
      id: docRef.id,
      titulo: tituloLimpio,
      resumen,
      contenido,
      imagen: imagen || '',
      slug,
      autor: autor || 'Nicaragua Informate',
      destacada: !!destacada,
      vistas: 0,
      fecha: Timestamp.now(),
      publishedAt: Timestamp.now(),
      dateModified: Timestamp.now(),
      publicado: publicado !== false,
      estado: publicado !== false ? 'publicado' : 'borrador',
      related_links: relatedLinks,
    });

    if (publicado !== false) {
      // REGLA: Usar el publication-pipeline canonico, no notifyTelegram inline.
      // El pipeline ejecuta Telegram + Facebook + IndexNow + Push + social copy.
      try {
        const { runPublicationPipeline } = await import('@/lib/meni/publication-pipeline');
        await runPublicationPipeline({
          db,
          articleId: docRef.id,
          slug,
          titulo: tituloLimpio,
          resumen: resumen || '',
          contenido,
          categoria: finalCategoria,
          imagen: imagen || undefined,
          autor: autor || 'Nicaragua Informate',
          story: body.story,
        });
      } catch (e) {
        logger.warn('[admin/news POST] publication-pipeline error (non-blocking):', e);
      }

      // REGLA: Toda noticia publicada entra en WATCH automaticamente.
      try {
        const { runWatchCycle, persistWatchResult } = await import('@/lib/news-watch');
        const watchResult = await runWatchCycle(
          {
            id: docRef.id,
            titulo: tituloLimpio,
            contenido,
            resumen: resumen || '',
            categoria: finalCategoria,
            fecha: new Date().toISOString(),
          },
          { db }
        );
        await persistWatchResult(db, docRef.id, watchResult);
      } catch (e) {
        logger.warn('[admin/news POST] WATCH init error (non-blocking):', e);
      }
    }

    revalidateTag('noticias');
    revalidateTag('latest-news');
    revalidateTag('trending-news');
    revalidateTag('news-sitemap');
    revalidateTag('sitemap-news');

    // Invalidar cache en memoria de Firestore (CRITICO: evita esperar 5 min)
    try {
      const { invalidateFirestoreCache } = await import('@/lib/data');
      invalidateFirestoreCache();
    } catch (e) { /* noop */ }

    // CEO Agent: decisión editorial automática no bloqueante
    try {
      const { runCEODecisionForArticle } = await import('@/lib/ceo-agent-workflow');
      const ceo = await runCEODecisionForArticle(slug);
      if (!ceo.stored) {
        logger.warn('[admin/news POST] CEO decision not stored:', ceo.error);
      }
    } catch (e) {
      logger.warn('[admin/news POST] CEO analysis error (non-blocking):', e);
    }

    // Revalidar paginas afectadas
    revalidatePath('/');
    revalidatePath('/noticias');
    revalidatePath(`/noticias/${slug}`);
    revalidatePath('/news-sitemap.xml');
    revalidatePath('/sitemap.xml');

    // Notificar a Google Indexing API cuando la noticia se publica
    let googleIndexing: { ok: boolean; status: 'sent' | 'duplicate' | 'error' | 'skipped' } = { ok: false, status: 'skipped' };
    if (publicado !== false) {
      const articleUrl = `https://nicaraguainformate.com/noticias/${slug}`;
      googleIndexing = await notifyGoogleIndexingDeduped(articleUrl);
    }

    return NextResponse.json({ success: true, id: docRef.id, slug, googleIndexing: googleIndexing.status });
  } catch (err) {
    logger.error('[admin/news POST]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
