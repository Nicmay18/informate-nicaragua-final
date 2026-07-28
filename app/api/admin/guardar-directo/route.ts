import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { getAdminDb } from '@/lib/firebase-admin';
import { runMeniAsync } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';
import { stripHtml } from '@/lib/meni/utils/helpers';

export const maxDuration = 30;

function mapMeniScoreToNivel(score: number, aprobado: boolean): string {
  if (!aprobado || score < 70) return 'RECHAZADO';
  if (score >= 98) return 'FORENSE';
  if (score >= 95) return 'ORO';
  if (score >= 90) return 'PLATA';
  if (score >= 85) return 'BRONCE';
  return 'SIN NIVEL';
}

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  const validToken = process.env.ADMIN_API_KEY || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  if (!validToken) {
    console.warn('[guardar-directo] Ni ADMIN_API_KEY ni TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR configurados');
    return false;
  }
  return token === validToken;
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
      contenido: contenido.trim(),
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

    // MENI + analizador de duplicados trabajando juntos
    // skipEditorBrain: el Editor Brain es para evaluación/contexto previo al LLM,
    // no para el guardado. Evita timeouts innecesarios al publicar.
    const meni = await runMeniAsync(noticiaInput, { db, skipEditorBrain: true });

    // Generar metadata si falta
    const finalTitulo = meni.articulo?.titulo || titulo.trim();
    const finalContenido = meni.articulo?.contenido || contenido.trim();
    const finalResumen = meni.articulo?.resumen || resumen?.trim() || meni.seo.metaDescripcion;
    const finalSlug = body.slug || meni.articulo?.slug || '';
    const autoKeywordsDespues = meni.autoCorrections?.find((c: any) => c.campo === 'keywords')?.despues;
    const finalPalabrasClave = autoKeywordsDespues
      ? String(autoKeywordsDespues).split(',').map((k: string) => k.trim()).filter(Boolean)
      : (body.palabrasClave || []);
    const metaGenerada = finalResumen.length >= 120 ? finalResumen : meni.seo.metaDescripcion;

    // BLOQUEO si no pasa filtros criticos
    if (!meni.aprobado) {
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

    // Contar palabras usando el contenido corregido por MENI
    const palabras = stripHtml(finalContenido).split(/\s+/).filter(Boolean).length;

    // Datos a actualizar
    const updateData: Record<string, unknown> = {
      titulo: finalTitulo,
      contenido: finalContenido,
      fechaActualizacion: new Date(),
      palabras,
      publicado,
      estado: publicado ? 'publicado' : 'borrador',
      scoreMeni: meni.scoreFinal,
      aprobadoMeni: meni.aprobado,
      calificacionMeni: meni.calificacion,
      nivel: mapMeniScoreToNivel(meni.scoreFinal, meni.aprobado),
      recomendacionesMeni: meni.recomendaciones.map((r: any) => `${r.area}: ${r.mensaje}`),
      diagnosticoMeni: meni.diagnostico,
      editorialTier: meni.editorialTier,
      editorialReason: meni.editorialReason,
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
    if (body.scoreMeni !== undefined) updateData.scoreMeni = body.scoreMeni;
    if (body.aprobadoMeni !== undefined) updateData.aprobadoMeni = body.aprobadoMeni;

    // Actualizar o crear directamente con Admin SDK (ignora security rules)
    let articleDocId = id;
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
    }

    return NextResponse.json({
      success: true,
      id: articleDocId,
      palabras,
      mensaje: `Noticia actualizada directamente. ${palabras} palabras.`,
      meni: {
        scoreFinal: meni.scoreFinal,
        aprobado: meni.aprobado,
        calificacion: meni.calificacion,
        diagnostico: meni.diagnostico,
        recomendaciones: meni.recomendaciones.slice(0, 5),
        editorialDna: meni.editorialDna,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('[guardar-directo] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
