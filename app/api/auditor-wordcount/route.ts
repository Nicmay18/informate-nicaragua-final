import { NextResponse, NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { evaluate, mapV4ToV3, type NoticiaInput } from '@/lib/editorial';
import { isAdminRequest, unauthorized } from '@/lib/auth';

/**
 * Auditoría integrada con el motor editorial V4 ("jefe IA").
 *
 * CRITERIO ANTI-FALSOS-POSITIVOS:
 * - Un artículo con <350 palabras NO se marca como "necesita expansión"
 *   si el jefe IA lo evalúa como ORO o FORENSE.
 * - Solo se marcan artículos que CUMPLEN AMBAS condiciones:
 *   1. < 350 palabras
 *   2. Nivel inferior a ORO (PLATA, BRONCE, RECHAZADO)
 * - Esto respeta el criterio del motor editorial de que artículos FLASH
 *   o NOTICIA de actualidad pueden ser excelentes incluso siendo cortos.
 */

function stripHtml(html: string): string {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text: string): number {
  return (text.match(/\b[a-záéíóúñA-ZÁÉÍÓÚÑ]+\b/g) || []).length;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();

    const resultados = snapshot.docs.map((doc) => {
      const data = doc.data();
      const contenidoHtml = typeof data.contenido === 'string' ? data.contenido : String(data.contenido || '');
      const textoPlano = stripHtml(contenidoHtml);
      const palabras = countWords(textoPlano);

      const noticia: NoticiaInput = {
        titulo: data.titulo || '(sin título)',
        contenido: contenidoHtml,
        resumen: data.resumen || '',
        categoria: data.categoria || 'Sin categoría',
        autor: data.autor || 'Redacción NI',
        fecha: data.fecha?.toDate
          ? data.fecha.toDate().toISOString()
          : data.fecha || new Date().toISOString(),
        imagenDestacada: data.imagenDestacada || data.imagen,
        slug: data.slug || '',
        keywords: data.keywords || [],
        palabrasClave: data.palabrasClave || [],
      };

      let analisis;
      let evaluacionV4 = null;
      try {
        evaluacionV4 = evaluate(noticia);
        analisis = mapV4ToV3(evaluacionV4);
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        analisis = {
          aprobado: false,
          nivel: 'ERROR',
          puntuacion: 0,
          filtros: {},
          accionesRequeridas: [`Error motor editorial: ${errMsg}`],
          metadataSugerida: {},
        };
      }

      const nivel = analisis.nivel;
      const esOroOForense = nivel === 'ORO' || nivel === 'FORENSE';
      const necesitaExpander = palabras < 350 && !esOroOForense;

      const issues: string[] = [];
      if (evaluacionV4) {
        if (evaluacionV4.adsense.score < 70) {
          issues.push(`AdSense: ${evaluacionV4.adsense.score}/100`);
        }
        if (evaluacionV4.eeat.score < 70) {
          issues.push(`EEAT: ${evaluacionV4.eeat.score}/100`);
        }
        if (evaluacionV4.forense.score < 70) {
          issues.push(`Forense: ${evaluacionV4.forense.score}/100`);
        }
        if (evaluacionV4.seo.score < 70) {
          issues.push(`SEO: ${evaluacionV4.seo.score}/100`);
        }
        if (evaluacionV4.valorEditorial.score < 70) {
          issues.push(`Valor Editorial: ${evaluacionV4.valorEditorial.score}/100`);
        }
        if (evaluacionV4.riesgo && !evaluacionV4.riesgo.seguro) {
          issues.push(`No seguro AdSense: ${evaluacionV4.riesgo.advertencias.join('; ')}`);
        }
      }

      return {
        id: doc.id,
        slug: data.slug || '',
        titulo: noticia.titulo,
        categoria: noticia.categoria,
        autor: noticia.autor,
        palabras,
        nivel,
        score: analisis.puntuacion,
        aprobado: analisis.aprobado,
        necesitaExpander,
        esOroOForense,
        issues: issues.length > 0 ? issues : undefined,
        accionesRequeridas: analisis.accionesRequeridas?.slice(0, 5),
        fecha: data.fecha?.toDate
          ? data.fecha.toDate().toISOString()
          : data.fecha || null,
      };
    });

    const stats = {
      total: resultados.length,
      oro: resultados.filter((r) => r.nivel === 'ORO').length,
      forense: resultados.filter((r) => r.nivel === 'FORENSE').length,
      plata: resultados.filter((r) => r.nivel === 'PLATA').length,
      bronce: resultados.filter((r) => r.nivel === 'BRONCE').length,
      rechazado: resultados.filter((r) => r.nivel === 'RECHAZADO').length,
      error: resultados.filter((r) => r.nivel === 'ERROR').length,
      menos350palabras: resultados.filter((r) => r.palabras < 350).length,
      menos350yNoOro: resultados.filter((r) => r.necesitaExpander).length,
      menos350peroOro: resultados.filter(
        (r) => r.palabras < 350 && r.esOroOForense
      ).length,
      promedioPalabras: resultados.length
        ? Math.round(
            resultados.reduce((a, r) => a + r.palabras, 0) / resultados.length
          )
        : 0,
      promedioScore: resultados.length
        ? Math.round(
            (resultados.reduce((a, r) => a + r.score, 0) / resultados.length) *
              10
          ) / 10
        : 0,
    };

    const prioritarios = resultados
      .filter((r) => r.necesitaExpander)
      .sort((a, b) => a.palabras - b.palabras);

    return NextResponse.json({
      success: true,
      stats,
      prioritarios,
      todos: resultados,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
