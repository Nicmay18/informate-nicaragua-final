import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { unstable_cache } from 'next/cache';

export const revalidate = 0;

interface MetricasCalidad {
  totalNoticias: number;
  promedioPalabras: number;
  thinContent: {
    count: number;
    porcentaje: number;
    ids: string[];
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
    let totalAutoresUnicos = new Set<string>();
    let totalFuentes = 0;

    const thinIds: string[] = [];
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
      const palabras = contenido.split(/\s+/).filter((p: string) => p.length > 0).length;
      const titulo = (data.titulo || '').trim();
      const resumen = (data.resumen || '').trim();

      totalPalabras += palabras;
      totalStrong += (contenidoRaw.match(/<strong>/gi) || []).length;
      totalBlockquotes += (contenidoRaw.match(/<blockquote>/gi) || []).length;

      if (palabras < 350) { thinCount++; thinIds.push(doc.id); }
      if (data.noindex === true) conNoindex++;
      if (!data.imagenDestacada && !data.imagen) sinImagen++;
      if (!data.autor) sinAutor++;
      else totalAutoresUnicos.add(data.autor);
      if (!data.fechaActualizacion) sinFechaActualizacion++;

      // Títulos optimizados (30-70 chars ideal)
      if (titulo.length >= 30 && titulo.length <= 70) titulosOpt++;

      // Meta descriptions optimizadas (120-160 chars)
      if (resumen.length >= 120 && resumen.length <= 160) metaOpt++;

      // Internal links (links a otras noticias del sitio)
      const linksInternos = (contenidoRaw.match(/href="\/noticias\//gi) || []).length;
      if (linksInternos >= 1) conLinks++;

      // Noticias frescas (< 7 días)
      const fecha = data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha);
      if (fecha && (ahora - fecha.getTime()) < sieteDias) frescas++;

      // Fuentes/citas (blockquote o links externos)
      const linksExternos = (contenidoRaw.match(/href="https?:\/\//gi) || []).length;
      if (linksExternos >= 1 || (contenidoRaw.match(/<blockquote>/gi) || []).length >= 1) totalFuentes++;

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
    const scoreEeat = Math.round(
      (totalAutoresUnicos.size >= 3 ? 30 : totalAutoresUnicos.size * 10) +
      (totalFuentes / total) * 40 +
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

    // Score Maestro: promedio ponderado con SEO internacional
    const scoreMaestro = Math.round(
      scoreDominio * 0.35 +
      scoreEeat * 0.20 +
      scoreFrescas * 0.15 +
      scoreTitulos * 0.10 +
      scoreMeta * 0.10 +
      scoreLinks * 0.10
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
      thinContent: { count: thinCount, porcentaje: Math.round((thinCount / total) * 100), ids: thinIds.slice(0, 20) },
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
    };

    return metricas;
}

const cachedDashboard = unstable_cache(computeDashboardMetrics, ['dashboard-calidad'], {
  revalidate: 3600,
  tags: ['dashboard-calidad'],
});

export async function GET() {
  try {
    const metricas = await cachedDashboard();
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
