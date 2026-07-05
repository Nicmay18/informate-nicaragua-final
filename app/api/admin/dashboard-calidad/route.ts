import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { unstable_cache } from 'next/cache';

export const revalidate = 0;
export const maxDuration = 30;

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token') || request.headers.get('x-admin-key') || '';
  const validTokens = [process.env.ADMIN_API_KEY, process.env.CRON_SECRET].filter(Boolean) as string[];
  return validTokens.length > 0 && validTokens.includes(token);
}

interface MetricasCalidad {
  totalNoticias: number;
  promedioPalabras: number;
  thinContent: {
    count: number;
    porcentaje: number;
    ids: string[];
    detalles?: Array<{id: string; titulo: string; palabrasCampo: any; palabrasConteo: number; palabrasUsadas: number}>;
  };
  conNoindex: number;
  sinImagen: number;
  sinAutor: number;
  sinFechaActualizacion: number;
  promedioStrong: number;
  promedioBlockquotes: number;
  distribucionCategorias: Record<string, number>;
  scoreDominio: number;
  alertas: string[];
  // Nuevas métricas SEO internacionales
  titulosOptimizados: { count: number; porcentaje: number; };
  metaOptimizadas: { count: number; porcentaje: number; };
  conInternalLinks: { count: number; porcentaje: number; };
  noticiasFrescas: { count: number; porcentaje: number; };
  scoreEeat: number;
  frecuenciaPublicacion: { noticiasUltimaSemana: number; noticiasUltimoMes: number; };
  diversidadCategorias: number;
  // Score maestro unificado
  scoreMaestro: number;
  estadoSalud: 'SALUDABLE' | 'ADVERTENCIA' | 'CRITICO';
  problemasCriticos: string[];
  problemasAdvertencia: string[];
  recomendaciones: string[];
  // Métricas de contenido de valor y monetización
  tiempoLecturaPromedio: number;
  estructuraRica: { count: number; porcentaje: number; };
  conDatosEstadisticos: { count: number; porcentaje: number; };
  conRecursosUtiles: { count: number; porcentaje: number; };
  conCTA: { count: number; porcentaje: number; };
  scoreRetencion: number;
  scoreMonetizacion: number;
  contenidoEvergreen: { count: number; porcentaje: number; };
  densidadValor: number;
}

async function computeDashboardMetrics() {
  const db = getAdminDb();
  const snapshot = await db.collection('noticias').get();

  let totalPalabras = 0;
    let totalStrong = 0;
    let totalBlockquotes = 0;
    let thinCount = 0;
    let conNoindex = 0;
    let sinImagen = 0;
    let sinAutor = 0;
    let sinFechaActualizacion = 0;
    let titulosOpt = 0;
    let metaOpt = 0;
    let conLinks = 0;
    let frescas = 0;
    const totalAutoresUnicos = new Set<string>();
    let totalFuentes = 0;
    let totalTiempoLectura = 0;
    let estructuraRicaCount = 0;
    let datosEstadisticosCount = 0;
    let recursosUtilesCount = 0;
    let ctaCount = 0;
    let evergreenCount = 0;
    let totalValorWords = 0;

    const thinIds: string[] = [];
    const thinDetails: Array<{id: string; titulo: string; palabrasCampo: any; palabrasConteo: number; palabrasUsadas: number}> = [];
    const categorias: Record<string, number> = {};
    const alertas: string[] = [];
    const problemasCriticos: string[] = [];
    const problemasAdvertencia: string[] = [];
    const recomendaciones: string[] = [];

    const ahora = Date.now();
    const sieteDias = 7 * 24 * 60 * 60 * 1000;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const contenidoRaw = data.contenido || '';
      const contenido = contenidoRaw.replace(/<[^>]*>/g, ' ');
      // Usar data.palabras si existe y es numérico válido (>0), sino contar del contenido
      const palabrasConteo = contenido.split(/\s+/).filter((p: string) => p.length > 0).length;
      const palabrasCampo = typeof data.palabras === 'number' ? data.palabras : (parseInt(data.palabras, 10) || 0);
      const palabras = palabrasCampo > 0 ? palabrasCampo : palabrasConteo;
      const titulo = (data.titulo || '').trim();
      const resumen = (data.resumen || '').trim();

      totalPalabras += palabras;
      totalStrong += (contenidoRaw.match(/<strong>/gi) || []).length;
      totalBlockquotes += (contenidoRaw.match(/<blockquote>/gi) || []).length;

      if (palabras < 350) {
        thinCount++;
        thinIds.push(doc.id);
        thinDetails.push({
          id: doc.id,
          titulo: titulo || '(sin título)',
          palabrasCampo: data.palabras,
          palabrasConteo,
          palabrasUsadas: palabras,
        });
      }
      if (data.noindex === true) conNoindex++;
      if (!data.imagenDestacada && !data.imagen) sinImagen++;
      if (!data.autor) sinAutor++;
      else totalAutoresUnicos.add(data.autor);
      if (!data.fechaActualizacion) sinFechaActualizacion++;

      // Títulos optimizados (30-65 chars ideal, matches editor panel)
      if (titulo.length >= 30 && titulo.length <= 65) titulosOpt++;

      // Meta descriptions optimizadas (120-160 chars)
      if (resumen.length >= 120 && resumen.length <= 160) metaOpt++;

      // Internal links (links en contenido HTML + related_links en Firestore)
      const linksEnContenido = (contenidoRaw.match(/href="\/noticias\//gi) || []).length;
      const tieneRelatedLinks = data.related_links && Array.isArray(data.related_links) && data.related_links.length > 0;
      if (linksEnContenido >= 1 || tieneRelatedLinks) conLinks++;

      // Noticias frescas (< 7 días)
      const fecha = data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha);
      if (fecha && (ahora - fecha.getTime()) < sieteDias) frescas++;

      // Fuentes/citas (blockquote o links externos)
      const linksExternos = (contenidoRaw.match(/href="https?:\/\//gi) || []).length;
      if (linksExternos >= 1 || (contenidoRaw.match(/<blockquote>/gi) || []).length >= 1) totalFuentes++;

      // Tiempo de lectura estimado (200 palabras/minuto)
      totalTiempoLectura += Math.max(1, Math.ceil(palabras / 200));

      // Estructura rica: listas, tablas, blockquotes, imágenes, videos
      const tieneListas = (contenidoRaw.match(/<(ul|ol|li|table|tr|td)>/gi) || []).length >= 1;
      const tieneCitas = (contenidoRaw.match(/<blockquote>/gi) || []).length >= 1;
      const tieneImagenes = (contenidoRaw.match(/<img/gi) || []).length >= 1 || !!data.imagen;
      const tieneVideos = (contenidoRaw.match(/<(iframe|video)/gi) || []).length >= 1;
      if (tieneListas || tieneCitas || tieneImagenes || tieneVideos) estructuraRicaCount++;

      // Datos/estadísticas: números, porcentajes, fechas específicas, montos
      const tieneDatos = /\b\d{1,3}(\.\d{3})*\b|\b\d+%|\b\d+\.\d+%|\bC\$\s*\d+|USD\s*\d+|\d{4}/i.test(contenido);
      if (tieneDatos) datosEstadisticosCount++;

      // Recursos útiles: teléfonos, emails, links de ayuda, consejos prácticos
      const tieneRecursos = /118|128|115|133|denunciar|emergencia|prevencion|consejo|recomendacion|teléfono|contacto|soporte|ayuda/i.test(contenidoRaw);
      if (tieneRecursos) recursosUtilesCount++;

      // CTAs: llamadas a la acción para engagement
      const tieneCTA = /comparte|síguenos|suscríbete|comenta|compartir|follow|subscribe|comment|dejanos|tu opinion|interactúa/i.test(contenidoRaw + ' ' + titulo);
      if (tieneCTA) ctaCount++;

      // Evergreen: no es suceso efímero, tiene datos/estadísticas + recursos + >400 palabras
      const esSuceso = (data.categoria || '').toLowerCase() === 'sucesos';
      const tieneEvergreenValue = palabras >= 400 && (tieneDatos || tieneRecursos || tieneListas);
      if (!esSuceso || tieneEvergreenValue) evergreenCount++;

      // Densidad de valor: palabras en recursos / total (proxy)
      const valorWords = (contenido.match(/\b(policía|bomberos|hospital|salud|prevención|consejo|recomendación|dato|estadística|estudio|investigación|experto|especialista|fuente|teléfono|contacto|emergencia)\b/gi) || []).length;
      totalValorWords += valorWords;

      const cat = data.categoria || 'Sin categoria';
      categorias[cat] = (categorias[cat] || 0) + 1;
    }

    const total = snapshot.size || 1;

    // Scores individuales (0-100)
    const scoreThin = Math.max(0, 100 - (thinCount / total) * 300);
    const scoreImagen = Math.max(0, 100 - (sinImagen / total) * 100);
    const scoreAutor = Math.max(0, 100 - (sinAutor / total) * 150);
    const scoreFrescura = Math.max(0, 100 - (sinFechaActualizacion / total) * 50);
    const scoreTitulos = Math.round((titulosOpt / total) * 100);
    const scoreMeta = Math.round((metaOpt / total) * 100);
    const scoreLinks = Math.round((conLinks / total) * 100);
    const scoreFrescas = Math.min(100, Math.round((frescas / Math.max(total * 0.1, 1)) * 100));
    // E-E-A-T: autoría + fuentes/citas + estructura editorial (related_links)
    const conRelatedLinks = snapshot.docs.filter(d => {
      const rl = d.data().related_links;
      return rl && Array.isArray(rl) && rl.length > 0;
    }).length;
    const coberturaEeat = ((totalFuentes + conRelatedLinks) / total);
    // Umbral realista: 85% cobertura = puntaje máximo (no requiere 100% para noticias locales)
    const puntosFuentes = Math.min(40, Math.round((coberturaEeat / 0.85) * 40));
    const scoreEeat = Math.round(
      (totalAutoresUnicos.size >= 3 ? 30 : totalAutoresUnicos.size * 10) +
      puntosFuentes +
      (sinAutor === 0 ? 30 : Math.max(0, 30 - (sinAutor / total) * 100))
    );

    const scoreDominio = Math.round(
      scoreThin * 0.25 +
      scoreImagen * 0.15 +
      scoreAutor * 0.15 +
      scoreFrescura * 0.10 +
      scoreTitulos * 0.10 +
      scoreMeta * 0.10 +
      scoreLinks * 0.10 +
      scoreEeat * 0.05
    );

    // Métricas de contenido de valor
    const tiempoLecturaPromedio = Math.round(totalTiempoLectura / total);
    const estructuraRicaPct = Math.round((estructuraRicaCount / total) * 100);
    const datosPct = Math.round((datosEstadisticosCount / total) * 100);
    const recursosPct = Math.round((recursosUtilesCount / total) * 100);
    const ctaPct = Math.round((ctaCount / total) * 100);
    const evergreenPct = Math.round((evergreenCount / total) * 100);
    const densidadValor = Math.round((totalValorWords / totalPalabras) * 1000); // por cada 1000 palabras

    // Score Retención (0-100): estructura rica + tiempo lectura + recursos + datos + CTAs
    const scoreRetencion = Math.min(100, Math.round(
      estructuraRicaPct * 0.30 +
      Math.min(100, tiempoLecturaPromedio * 10) * 0.20 + // 10 min = 100 puntos
      recursosPct * 0.25 +
      datosPct * 0.15 +
      ctaPct * 0.10
    ));

    // Score Monetización AdSense (0-100): sin thin + sin emocional + con autor + con imagen + estructura rica + recursos + evergreen
    const conEmocional = 0; // ya limpiamos, se puede integrar auditoría forense posteriormente
    const scoreMonetizacion = Math.min(100, Math.round(
      (thinCount === 0 ? 25 : Math.max(0, 25 - (thinCount / total) * 100)) +
      (sinAutor === 0 ? 15 : Math.max(0, 15 - (sinAutor / total) * 75)) +
      (sinImagen === 0 ? 15 : Math.max(0, 15 - (sinImagen / total) * 50)) +
      (estructuraRicaPct * 0.15) +
      (recursosPct * 0.15) +
      (evergreenPct * 0.15)
    ));

    // Score Maestro: promedio ponderado con SEO internacional + contenido de valor
    const scoreMaestro = Math.round(
      scoreDominio * 0.30 +
      scoreEeat * 0.15 +
      scoreFrescas * 0.10 +
      scoreTitulos * 0.08 +
      scoreMeta * 0.08 +
      scoreLinks * 0.07 +
      scoreRetencion * 0.12 +
      scoreMonetizacion * 0.10
    );

    // Estado de salud
    let estadoSalud: 'SALUDABLE' | 'ADVERTENCIA' | 'CRITICO' = 'SALUDABLE';
    if (scoreMaestro < 60 || thinCount > total * 0.15 || sinAutor > total * 0.2) {
      estadoSalud = 'CRITICO';
    } else if (scoreMaestro < 80 || thinCount > 0 || sinImagen > total * 0.1 || scoreEeat < 50) {
      estadoSalud = 'ADVERTENCIA';
    }

    // Problemas críticos
    if (thinCount > 0) {
      problemasCriticos.push(`${thinCount} artículos thin content (<350 palabras) — bloquea AdSense y penaliza SEO`);
      recomendaciones.push('Revisa las noticias marcadas como thin content. Expándelas a 350+ palabras con datos, citas y contexto.');
    }
    if (sinAutor > total * 0.1) {
      problemasCriticos.push(`${sinAutor} noticias sin autor — E-E-A-T severamente comprometido`);
      recomendaciones.push('Asigna autores a todas las noticias. Google News y AdSense requieren transparencia de autoría.');
    }
    if (sinImagen > total * 0.3) {
      problemasCriticos.push(`${sinImagen} noticias sin imagen — Discover y Google News requieren imágenes`);
      recomendaciones.push('Toda noticia debe tener imagen destacada. Agrega fotos de archivo, infografías o ilustraciones.');
    }

    // Problemas de advertencia
    if (scoreMaestro < 80) {
      problemasAdvertencia.push(`Score maestro ${scoreMaestro}/100 — por debajo del estándar internacional (85+)`);
    }
    if (titulosOpt < total * 0.7) {
      problemasAdvertencia.push(`${Math.round((1 - titulosOpt/total)*100)}% de títulos no optimizados (meta: 30-70 caracteres)`);
      recomendaciones.push('Revisa los títulos largos o cortos. El óptimo es 50-60 caracteres para Google.');
    }
    if (metaOpt < total * 0.6) {
      problemasAdvertencia.push(`${Math.round((1 - metaOpt/total)*100)}% sin meta description óptima (120-160 chars)`);
      recomendaciones.push('Escribe meta descriptions atractivas de 150-160 caracteres. Aumenta el CTR en Google.');
    }
    if (conLinks < total * 0.3) {
      problemasAdvertencia.push(`${Math.round((1 - conLinks/total)*100)}% de noticias sin links internos — estructura web débil`);
      recomendaciones.push('Agrega links a noticias relacionadas dentro del contenido. Mejora la navegación y SEO on-page.');
    }
    if (frescas < 3) {
      problemasAdvertencia.push('Poca frecuencia de publicación — menos de 3 noticias en los últimos 7 días');
      recomendaciones.push('Publica al menos 3-5 noticias por semana. Google favorece sitios con contenido fresco y frecuente.');
    }
    if (Object.keys(categorias).length < 4) {
      problemasAdvertencia.push(`Solo ${Object.keys(categorias).length} categorías con contenido — diversidad insuficiente`);
      recomendaciones.push('Expande a más categorías (Economía, Turismo, Salud, Ambiente) para captar tráfico de nichos.');
    }
    if (scoreEeat < 60) {
      problemasAdvertencia.push(`Score E-E-A-T ${scoreEeat}/100 — autoridad y confianza debajo del estándar`);
      recomendaciones.push('Agrega páginas de "Quiénes Somos" y "Contacto" con datos reales del equipo editorial. Incluye biografías de autores con foto y credenciales.');
    }
    if (scoreRetencion < 50) {
      problemasAdvertencia.push(`Score Retención ${scoreRetencion}/100 — lectores no se quedan, alto bounce rate`);
      recomendaciones.push('Agrega listas, tablas, datos estadísticos y recursos útiles (teléfonos, consejos). El contenido rico retiene 40% más tiempo.');
    }
    if (scoreMonetizacion < 70) {
      problemasAdvertencia.push(`Score Monetización ${scoreMonetizacion}/100 — AdSense puede rechazar o limitar ads`);
      recomendaciones.push('Aumenta estructura rica (listas, imágenes, citas), agrega recursos útiles y reduce contenido efímero sin valor añadido.');
    }
    if (recursosPct < 30) {
      problemasAdvertencia.push(`Solo ${recursosPct}% de noticias tienen recursos útiles — contenido descartable`);
      recomendaciones.push('Toda noticia debe aportar valor: teléfonos de emergencia, consejos prácticos, links de ayuda, pasos a seguir.');
    }
    if (estructuraRicaPct < 40) {
      problemasAdvertencia.push(`Solo ${estructuraRicaPct}% con estructura rica (listas, tablas, citas) — lectores abandonan muros de texto`);
      recomendaciones.push('Usa listas, tablas comparativas, blockquotes de expertos y subtítulos H2. Mejora scaneabilidad y tiempo en página.');
    }
    if (evergreenPct < 50) {
      problemasAdvertencia.push(`Solo ${evergreenPct}% de contenido evergreen — tráfico orgánico a largo plazo comprometido`);
      recomendaciones.push('Expande noticias de sucesos con contexto, antecedentes y recursos. El contenido evergreen genera tráfico constante por años.');
    }

    // Alertas legacy (mantener compatibilidad)
    if (thinCount > 0) alertas.push(`${thinCount} articulos thin content (<350 palabras). Esto bloquea AdSense.`);
    if (sinImagen > total * 0.2) alertas.push(`${sinImagen} articulos sin imagen. Discover requiere imagenes.`);
    if (sinAutor > total * 0.1) alertas.push(`${sinAutor} articulos sin autor. E-E-A-T comprometido.`);
    if (scoreDominio < 70) alertas.push(`Score de dominio ${scoreDominio}/100. No solicites reconsideracion AdSense aun.`);
    else if (scoreDominio >= 85) alertas.push(`Score de dominio ${scoreDominio}/100. Listo para solicitar reconsideracion AdSense.`);

    const noticiasUltimaSemana = frescas;
    const noticiasUltimoMes = snapshot.docs.filter((d: any) => {
      const f = d.data().fecha?.toDate ? d.data().fecha.toDate() : new Date(d.data().fecha);
      return f && (ahora - f.getTime()) < 30 * 24 * 60 * 60 * 1000;
    }).length;

    const metricas: MetricasCalidad = {
      totalNoticias: total,
      promedioPalabras: Math.round(totalPalabras / total),
      thinContent: { count: thinCount, porcentaje: Math.round((thinCount / total) * 100), ids: thinIds.slice(0, 20), detalles: thinDetails.slice(0, 20) },
      conNoindex,
      sinImagen,
      sinAutor,
      sinFechaActualizacion,
      promedioStrong: Math.round(totalStrong / total),
      promedioBlockquotes: Math.round(totalBlockquotes / total),
      distribucionCategorias: categorias,
      scoreDominio,
      alertas,
      titulosOptimizados: { count: titulosOpt, porcentaje: Math.round((titulosOpt / total) * 100) },
      metaOptimizadas: { count: metaOpt, porcentaje: Math.round((metaOpt / total) * 100) },
      conInternalLinks: { count: conLinks, porcentaje: Math.round((conLinks / total) * 100) },
      noticiasFrescas: { count: frescas, porcentaje: Math.round((frescas / total) * 100) },
      scoreEeat: Math.min(100, scoreEeat),
      frecuenciaPublicacion: { noticiasUltimaSemana, noticiasUltimoMes },
      diversidadCategorias: Object.keys(categorias).length,
      scoreMaestro,
      estadoSalud,
      problemasCriticos,
      problemasAdvertencia,
      recomendaciones: [...new Set(recomendaciones)],
      tiempoLecturaPromedio,
      estructuraRica: { count: estructuraRicaCount, porcentaje: estructuraRicaPct },
      conDatosEstadisticos: { count: datosEstadisticosCount, porcentaje: datosPct },
      conRecursosUtiles: { count: recursosUtilesCount, porcentaje: recursosPct },
      conCTA: { count: ctaCount, porcentaje: ctaPct },
      scoreRetencion,
      scoreMonetizacion,
      contenidoEvergreen: { count: evergreenCount, porcentaje: evergreenPct },
      densidadValor,
    };

    return metricas;
}

const cachedDashboard = unstable_cache(computeDashboardMetrics, ['dashboard-calidad'], {
  revalidate: 300, // 5 minutos en vez de 24h
  tags: ['dashboard-calidad'],
});

export async function GET(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const force = request.nextUrl.searchParams.get('force') === '1';
    const metricas = force ? await computeDashboardMetrics() : await cachedDashboard();
    return NextResponse.json(metricas, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Error al calcular metricas' },
      { status: 500 }
    );
  }
}
