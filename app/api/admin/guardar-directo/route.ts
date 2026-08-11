import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { revalidateTag, revalidatePath } from 'next/cache';
import { getAdminDb } from '@/lib/firebase-admin';
import type { NoticiaInput } from '@/lib/meni';
import { normalizeEditorialTitle } from '@/lib/formateo';
import { guardarConMeni } from '@/lib/editorial/guardar-con-meni';
import { sanitizeArticleHtml } from '@/lib/sanitize';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const CATEGORIA_SLUG_FALLBACK: Record<string, string> = {
  'Sucesos': 'sucesos', 'Nacionales': 'nacionales', 'Deportes': 'deportes',
  'Internacionales': 'internacionales', 'Tecnología': 'tecnologia', 'Espectáculos': 'espectaculos',
  'Cultura': 'cultura', 'Economía': 'economia', 'Salud': 'salud',
  'Judicial': 'judicial', 'Infraestructura': 'infraestructura', 'General': 'nacionales',
};

async function getRelatedLinks(db: any, categoriaLinks: string, excludeId: string) {
  const catSlug = CATEGORIA_SLUG_FALLBACK[categoriaLinks] || 'nacionales';
  const links: Array<{ url: string; anchor: string; type: string }> = [
    { url: `/categoria/${catSlug}`, anchor: `Noticias de ${catSlug}`, type: 'categoria' },
  ];
  try {
    const snap = await db.collection('noticias').where('categoria', '==', categoriaLinks).orderBy('fecha', 'desc').limit(4).get();
    const related = snap.docs.filter((d: any) => d.id !== excludeId).slice(0, 2).map((d: any) => {
      const data = d.data();
      return { url: `/noticias/${data.slug || d.id}`, anchor: (data.titulo || 'Leer mas').substring(0, 70), type: 'relacionada' };
    });
    links.push(...related);
  } catch (e) {
    console.warn('[guardar-directo] getRelatedLinks error:', e);
  }
  return links;
}

function verificarAuth(request: NextRequest): boolean {
  return verifyAdminOrCleanupToken(request.headers.get('x-admin-token'));
}

export async function POST(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, titulo, contenido, resumen, categoria, departamento, imagen, publicado = true } = body;

    if (!titulo || !contenido) {
      return NextResponse.json({ error: 'Faltan campos obligatorios: titulo, contenido' }, { status: 400 });
    }

    // ═══════════════════════════════════════════════════════════════
    // ANALIZADOR FORENSE — BLOQUEO DE PUBLICACION
    // ═══════════════════════════════════════════════════════════════
    const db = getAdminDb();

    const noticiaInput: NoticiaInput = {
      id: id || undefined,
      titulo: titulo.trim(),
      contenido: sanitizeArticleHtml(contenido.trim()),
      resumen: resumen?.trim() || '',
      categoria: categoria || 'General',
      departamento: departamento || '',
      autor: body.autor || '',
      fecha: body.fecha || new Date().toISOString(),
      fechaActualizacion: body.fechaActualizacion,
      imagen: imagen || body.imagen,
      imagenDestacada: imagen || body.imagenDestacada,
      slug: body.slug || '',
      palabrasClave: body.palabrasClave || [],
    };

    // MENI canónico via guardarConMeni — única autoridad editorial
    const { ok: meniOk, meni, updateData: meniUpdateData } = await guardarConMeni(noticiaInput, db);

    // Generar metadata si falta
    const finalTitulo = normalizeEditorialTitle(titulo.trim());
    const finalContenido = meni.articulo?.contenido || contenido.trim();
    const finalResumen = meni.articulo?.resumen || resumen?.trim() || meni.seo.metaDescripcion;
    const finalSlug = body.slug || meni.articulo?.slug || '';
    const autoKeywordsDespues = meni.autoCorrections?.find((c: any) => c.campo === 'keywords')?.despues;
    const finalPalabrasClave = autoKeywordsDespues
      ? String(autoKeywordsDespues).split(',').map((k: string) => k.trim()).filter(Boolean)
      : (body.palabrasClave || []);
    const metaGenerada = finalResumen.length >= 120 ? finalResumen : meni.seo.metaDescripcion;

    // BLOQUEO si no pasa filtros criticos
    if (!meniOk) {
      const first = meni.blockingIssues?.[0];
      return NextResponse.json({
        error: first ? `[${first.code}] ${first.title}: ${first.description}` : 'Noticia no aprobada por MENI',
        code: first?.code || 'MENI_NOT_APPROVED',
        blockingIssues: meni.blockingIssues || [],
        warnings: meni.warnings || [],
        scoreFinal: meni.scoreFinal,
        calificacion: meni.calificacion,
        diagnostico: meni.diagnostico,
        editorialDna: meni.editorialDna,
        editorialTier: meni.editorialTier,
        editorialReason: meni.editorialReason,
        duplicado: meni.duplicado,
        correcciones: [
          ...(meni.autoCorrections || []),
          ...(meni.qualityGate?.corregidos || []),
        ],
        sugerencias: {
          metaDescription: metaGenerada,
          tituloSEO: meni.seo.tituloSEO,
        },
      }, { status: 400 });
    }

    // Datos a actualizar — merge de campos MENI del wrapper + campos del route
    const updateData: Record<string, unknown> = {
      ...meniUpdateData,
      titulo: finalTitulo,
      contenido: finalContenido,
      fechaActualizacion: new Date(),
      publicado,
      estado: publicado ? 'publicado' : 'borrador',
    };

    // CRÍTICO: Establecer fecha de publicación si no existe
    // Usar fecha del body si se proporciona, o fechaActualizacion
    updateData.fecha = body.fecha || new Date();

    if (finalResumen !== undefined) updateData.resumen = finalResumen;
    if (categoria !== undefined) updateData.categoria = categoria;
    if (departamento !== undefined) updateData.departamento = departamento;
    if (imagen !== undefined) updateData.imagen = imagen;
    if (finalSlug !== undefined) updateData.slug = finalSlug;
    if (body.categoriaSlug !== undefined) updateData.categoriaSlug = body.categoriaSlug;
    if (body.autor !== undefined) updateData.autor = body.autor;
    if (finalPalabrasClave !== undefined) {
      updateData.palabrasClave = finalPalabrasClave;
      updateData.tags = finalPalabrasClave;
      updateData.keywords = Array.isArray(finalPalabrasClave)
        ? finalPalabrasClave.join(', ')
        : String(finalPalabrasClave);
    }
    // Actualizar o crear directamente con Admin SDK (ignora security rules)
    let articleDocId = id;
    // Related Knowledge — relacionados por entidades compartidas, fallback a categoría
    try {
      const { generateRelatedLinks } = await import('@/lib/meni/knowledge-base/related-knowledge');
      const entityLinks = await generateRelatedLinks(db, articleDocId || '', finalTitulo, finalContenido, (categoria as string) || 'General');
      updateData.related_links = entityLinks.length >= 2
        ? entityLinks
        : await getRelatedLinks(db, (categoria as string) || 'General', articleDocId || '');
    } catch {
      updateData.related_links = await getRelatedLinks(db, (categoria as string) || 'General', articleDocId || '');
    }
    if (id) {
      await db.collection('noticias').doc(id).update(updateData);
    } else {
      const docRef = db.collection('noticias').doc();
      articleDocId = docRef.id;
      await docRef.set({
        ...updateData,
        id: docRef.id,
      });
    }

    // Invalidar cachés afectadas
    revalidateTag('noticias');
    revalidateTag('latest-news');
    revalidateTag('trending-news');
    revalidateTag('popular-news');
    revalidateTag('news-sitemap');
    revalidateTag('sitemap-news');
    revalidatePath('/');
    revalidatePath('/noticias');
    revalidatePath('/feed.xml');
    revalidatePath('/sitemap.xml');
    revalidatePath('/news-sitemap.xml');

    // Invalidar cache en memoria de Firestore
    try {
      const { invalidateFirestoreCache } = await import('@/lib/data');
      invalidateFirestoreCache();
    } catch (e) { /* noop */ }

    // Knowledge Base — ingestar artículo publicado al grafo de conocimiento
    let pipelineResult: Awaited<ReturnType<typeof import('@/lib/meni/publication-pipeline').runPublicationPipeline>> | null = null;
    if (publicado) {
      try {
        const { ingestArticle } = await import('@/lib/meni/knowledge-base');
        await ingestArticle(db, {
          articleId: articleDocId!,
          title: finalTitulo,
          content: finalContenido,
          slug: finalSlug,
          category: categoria || 'General',
          departamento: departamento || '',
          date: (body.fecha as string) || new Date().toISOString(),
          author: body.autor || '',
        });
      } catch (kbError) {
        console.warn('[guardar-directo] Knowledge Base ingestion failed (non-blocking):', kbError);
      }

      // Editor Jefe — Fase 1: registrar correcciones del editor
      if (body.correcciones && Array.isArray(body.correcciones) && body.correcciones.length > 0) {
        try {
          const { registerCorrection } = await import('@/lib/meni/editor-jefe/correction-tracker');
          for (const corr of body.correcciones) {
            await registerCorrection(db, {
              articleId: articleDocId!,
              campo: corr.campo,
              antes: corr.antes || '',
              despues: corr.despues || '',
              categoria: categoria || 'General',
            });
          }
          console.log('[guardar-directo] Editor Jefe: correcciones registradas:', body.correcciones.length);
        } catch (corrError) {
          console.warn('[guardar-directo] Correction tracking failed (non-blocking):', corrError);
        }
      }

      // Editor Jefe — Dashboard: registrar predicciones del veredicto ejecutivo
      const veredicto = meni.editorialDecision?.veredictoEjecutivo;
      if (veredicto) {
        try {
          await db.collection('meni_predictions').add({
            articleId: articleDocId!,
            predFacebook: veredicto.probabilidadFacebook || null,
            predDiscover: veredicto.probabilidadDiscover || null,
            predPortada: veredicto.recomendacionPortada || null,
            predPublicar: veredicto.publicar || null,
            confianza: veredicto.confianza || 0,
            fecha: new Date().toISOString(),
            // Campos que se llenarán después con métricas reales:
            realFacebook: null,
            realDiscover: null,
            realPortada: null,
          });
        } catch (predError) {
          console.warn('[guardar-directo] Prediction tracking failed (non-blocking):', predError);
        }
      }

      // Editor Jefe — Dashboard: registrar score diario de MENI
      try {
        await db.collection('meni_daily_score').add({
          fecha: new Date().toISOString(),
          score: meni.scoreFinal || 0,
          aprobado: meni.aprobado,
          categoria: categoria || 'General',
        });
      } catch (scoreError) {
        console.warn('[guardar-directo] Daily score tracking failed (non-blocking):', scoreError);
      }

      // Sistema de Seguimiento — detectar/vincular casos abiertos
      try {
        const { processArticle } = await import('@/lib/meni/seguimiento');
        const result = await processArticle(
          db,
          articleDocId!,
          finalTitulo,
          finalContenido,
          finalSlug,
          categoria || 'General',
          departamento || '',
        );
        if (result.action !== 'none') {
          console.log('[guardar-directo] Seguimiento:', result.action, result.caseId || '', result.reason);
        }
      } catch (segError) {
        console.warn('[guardar-directo] Seguimiento detection failed (non-blocking):', segError);
      }

      // Publication Pipeline — distribución automática sin intervención
      try {
        const { runPublicationPipeline } = await import('@/lib/meni/publication-pipeline');
        pipelineResult = await runPublicationPipeline({
          db,
          articleId: articleDocId!,
          slug: finalSlug,
          titulo: finalTitulo,
          resumen: finalResumen || '',
          contenido: finalContenido,
          categoria: categoria || 'General',
          imagen: body.imagen || undefined,
          imagenRedes: body.imagenRedes || undefined,
          autor: body.autor || undefined,
          departamento: departamento || undefined,
          veredictoEjecutivo: meni.editorialDecision?.veredictoEjecutivo as any,
        });
        console.log('[guardar-directo] Pipeline completado en', pipelineResult.duracionMs, 'ms');
      } catch (pipeError) {
        console.warn('[guardar-directo] Publication pipeline failed (non-blocking):', pipeError);
      }
    }

    return NextResponse.json({
      success: true,
      id: articleDocId,
      palabras: meniUpdateData.palabras,
      mensaje: `Noticia actualizada directamente. ${meniUpdateData.palabras} palabras.`,
      meni: {
        scoreFinal: meni.scoreFinal,
        aprobado: meni.aprobado,
        calificacion: meni.calificacion,
        diagnostico: meni.diagnostico,
        recomendaciones: meni.recomendaciones.slice(0, 5),
        editorialDna: meni.editorialDna,
        editorialDecision: meni.editorialDecision,
      },
      pipeline: pipelineResult ? {
        distribucion: pipelineResult.distribucion,
        socialCopy: pipelineResult.socialCopy,
        duracionMs: pipelineResult.duracionMs,
      } : null,
    }, { status: 200 });

  } catch (error) {
    console.error('[guardar-directo] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
