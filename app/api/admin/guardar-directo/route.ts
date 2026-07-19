import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { getAdminDb } from '@/lib/firebase-admin';
import { evaluate, mapV4ToV3, type NoticiaInput } from '@/lib/editorial';
import { detectarDuplicadoAdmin } from '@/lib/analizador-duplicados';
import { generarMetaDescription, generarTituloSEO } from '@/lib/editorial/meta';

export const maxDuration = 30;

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

    if (!id || !titulo || !contenido) {
      return NextResponse.json({ error: 'Faltan campos obligatorios: id, titulo, contenido' }, { status: 400 });
    }

    // ═══════════════════════════════════════════════════════════════
    // ANALIZADOR FORENSE — BLOQUEO DE PUBLICACION
    // ═══════════════════════════════════════════════════════════════
    const noticiaInput: NoticiaInput = {
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      resumen: resumen?.trim() || '',
      categoria: categoria || 'General',
      autor: body.autor || '',
      fecha: body.fecha || new Date().toISOString(),
      fechaActualizacion: body.fechaActualizacion,
      imagenDestacada: imagen || body.imagenDestacada,
      slug: body.slug || '',
      palabrasClave: body.palabrasClave || [],
    };

    const v4 = evaluate(noticiaInput);
    const analisis = mapV4ToV3(v4);

    // 2. Detector de duplicados
    const db = getAdminDb();
    const duplicado = await detectarDuplicadoAdmin(
      db,
      contenido,
      titulo,
      0.35,
      id
    );

    // 3. Generar metadata si falta
    let metaGenerada = resumen;
    if (!metaGenerada || metaGenerada.length < 150) {
      metaGenerada = generarMetaDescription(v4.evidence.textoPlano, resumen);
    }

    // 4. BLOQUEO si no pasa filtros criticos
    if (!analisis.aprobado || duplicado.esDuplicado) {
      return NextResponse.json({
        error: 'Noticia rechazada por calidad',
        analisis,
        duplicado,
        sugerencias: {
          metaDescription: metaGenerada,
          tituloSEO: generarTituloSEO(titulo, categoria, departamento),
        }
      }, { status: 400 });
    }

    // Contar palabras usando la evidencia extraída una sola vez
    const palabras = v4.evidence.textoPlano.split(/\s+/).filter(Boolean).length;

    // Datos a actualizar
    const updateData: Record<string, unknown> = {
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      fechaActualizacion: new Date(),
      palabras,
    };

    // CRÍTICO: Establecer fecha de publicación si no existe
    // Usar fecha del body si se proporciona, o fechaActualizacion
    updateData.fecha = body.fecha || new Date();

    if (resumen !== undefined) updateData.resumen = resumen.trim();
    if (categoria !== undefined) updateData.categoria = categoria;
    if (departamento !== undefined) updateData.departamento = departamento;
    if (imagen !== undefined) updateData.imagen = imagen;
    if (publicado !== undefined) updateData.publicado = publicado;

    // Actualizar directamente con Admin SDK (ignora security rules)
    await db.collection('noticias').doc(id).update(updateData);

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

    return NextResponse.json({
      success: true,
      id,
      palabras,
      mensaje: `Noticia actualizada directamente. ${palabras} palabras.`,
    }, { status: 200 });

  } catch (error) {
    console.error('[guardar-directo] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
