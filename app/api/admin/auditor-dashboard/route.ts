import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAdminOrCronToken } from '@/lib/auth';
import { getTrafficForDate } from '@/lib/analytics/traffic-reader';
import {
  getMetricDefinition,
  type MetricDefinition,
} from '@/lib/nios/intelligence/metric-truth';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function verificarAuth(request: NextRequest): boolean {
  return verifyAdminOrCronToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

/** Auditor Dashboard — El "Periodista Senior" que valora todo el trabajo */
export async function GET(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const db = getAdminDb();
    const ahora = new Date();
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    const hace7d = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const hace30d = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ─── 1. INVENTARIO ───
    const noticiasSnap = await db.collection('noticias').get();
    const totalNoticias = noticiasSnap.size;
    const noticias: any[] = noticiasSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // ─── 2. VISTAS TOTALES ───
    let vistasTotales = 0;
    let noticiasConVistas = 0;
    let noticiasSinVistas = 0;
    let noticiasPublicadas = 0;
    let noticiasSinDistribuir = 0;

    const categoriaStats: Record<string, { count: number; vistas: number }> = {};
    const estadoDistribucion = { conDistribucion: 0, sinDistribucion: 0 };

    for (const n of noticias) {
      const v = n.vistas || 0;
      vistasTotales += v;
      if (v > 0) { noticiasConVistas++; }
      else { noticiasSinVistas++; }
      if (n.estado === 'publicado') noticiasPublicadas++;
      const oficialmenteDistribuida = n.distribuida === true || n.distribuida === 'true' || n.distribuida === 1 || !!n.fechaDistribucion;
      const tieneTraficoReal = (n.vistas || 0) > 0;
      if (oficialmenteDistribuida || tieneTraficoReal) {
        estadoDistribucion.conDistribucion++;
      } else {
        estadoDistribucion.sinDistribucion++;
        noticiasSinDistribuir++;
      }

      const cat = n.categoria || 'Sin categoría';
      if (!categoriaStats[cat]) categoriaStats[cat] = { count: 0, vistas: 0 };
      categoriaStats[cat].count++;
      categoriaStats[cat].vistas += v;
    }

    // ─── 3. TRÁFICO POR FUENTE (últimas 24h) ───
    const today = ahora.toISOString().split('T')[0];
    const trafficRead = await getTrafficForDate(db, today, 500);

    const fuentes: Record<string, { visits: number; articulos: Set<string> }> = {};
    for (const article of trafficRead.articles) {
      for (const [source, views] of Object.entries(article.sources)) {
        if (!fuentes[source]) fuentes[source] = { visits: 0, articulos: new Set() };
        fuentes[source].visits += views;
        fuentes[source].articulos.add(article.slug);
      }
    }

    const visitas24h = trafficRead.views24h;

    // ─── 4. DISTRIBUCIONES RECIENTES ───
    const distSnap = await db
      .collection('distribuciones')
      .orderBy('fecha', 'desc')
      .limit(50)
      .get();

    const distribuciones30d = distSnap.docs
      .map(d => d.data())
      .filter(d => new Date(d.fecha) >= hace30d);

    const distribuciones24h = distribuciones30d.filter(d => new Date(d.fecha) >= hace24h);
    const distribuciones7d = distribuciones30d.filter(d => new Date(d.fecha) >= hace7d);

    // Por canal
    const canalStats: Record<string, { exitosos: number; fallidos: number; total: number }> = {};
    for (const d of distribuciones30d) {
      const res = d.resultados || {};
      for (const [canal, data] of Object.entries(res)) {
        if (!canalStats[canal]) canalStats[canal] = { exitosos: 0, fallidos: 0, total: 0 };
        canalStats[canal].total++;
        if ((data as any).ok) canalStats[canal].exitosos++;
        else canalStats[canal].fallidos++;
      }
    }

    // ─── 5. TOP ARTÍCULOS (vistas canónicas de vida) ───
    const topMetric = getMetricDefinition('article.rank.lifetime.top');
    const topNoticias = noticias
      .sort((a: any, b: any) => (b.vistas || 0) - (a.vistas || 0))
      .slice(0, 10)
      .map((n: any) => ({
        titulo: n.titulo,
        slug: n.slug,
        vistas: n.vistas || 0,
        metric: topMetric,
        categoria: n.categoria,
        distribuida: n.distribuida || false,
      }));

    // ─── 6. CALIDAD DEL ARCHIVO ───
    const noticiasRecientes = noticias
      .filter((n: any) => {
        const fd = parseFirestoreDate(n.fecha);
        return fd && fd >= hace30d;
      })
      .sort((a: any, b: any) => {
        const da = parseFirestoreDate(a.fecha);
        const db = parseFirestoreDate(b.fecha);
        return (db?.getTime() || 0) - (da?.getTime() || 0);
      });

    let scoreCalidad = 0;
    let problemasCriticos = 0;
    const alertas: string[] = [];
    const consejos: string[] = [];

    // Análisis del archivo reciente
    const conImagen = noticiasRecientes.filter((n: any) => {
      const img = n.imagen || n.image || n.imagenUrl || '';
      return img && (img.startsWith('http') || img.startsWith('/images/') || img.startsWith('images/') || img.startsWith('data:image'));
    }).length;
    const conResumen = noticiasRecientes.filter((n: any) => {
      const r = n.resumen || n.metaDescription || n.summary || '';
      const texto = (typeof r === 'string' ? r : '').replace(/<[^>]*>/g, ' ').trim();
      return texto.length > 30; // 30+ chars de texto real
    }).length;
    const conContenido = noticiasRecientes.filter((n: any) => {
      const texto = (n.contenido || n.body || n.texto || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
      const palabras = texto.split(/\s+/).filter((w: string) => w.length > 0);
      return palabras.length >= 150; // 150+ palabras es contenido sólido
    }).length;
    const distribuidasRecientes = noticiasRecientes.filter((n: any) => {
      // Distribuida oficialmente en BD, o con tráfico real (alguien entró = fue compartida)
      const marcaOficial = n.distribuida === true || n.distribuida === 'true' || n.distribuida === 1 || !!n.fechaDistribucion;
      const tieneTrafico = (n.vistas || 0) > 0;
      return marcaOficial || tieneTrafico;
    }).length;

    // Bitácora: noticias con tráfico pero sin marca oficial de distribución
    const bitacoraDistribucion = noticiasRecientes
      .filter((n: any) => (n.vistas || 0) > 0)
      .sort((a: any, b: any) => (b.vistas || 0) - (a.vistas || 0))
      .slice(0, 20)
      .map((n: any) => {
        const marcaOficial = n.distribuida === true || n.distribuida === 'true' || n.distribuida === 1 || !!n.fechaDistribucion;
        const fechaNota = parseFirestoreDate(n.fecha);
        return {
          titulo: n.titulo || 'Sin título',
          slug: n.slug || '',
          categoria: n.categoria || '—',
          vistas: n.vistas || 0,
          detectadoPor: marcaOficial ? 'Agente/Telegram' : 'Tráfico real (manual)',
          fecha: fechaNota ? fechaNota.toISOString() : null,
        };
      });

    const totalRecientes = noticiasRecientes.length || 1;

    // Score basado en métricas
    const pctImagen = Math.round((conImagen / totalRecientes) * 100);
    const pctResumen = Math.round((conResumen / totalRecientes) * 100);
    const pctContenido = Math.round((conContenido / totalRecientes) * 100);
    const pctDistribuidas = Math.round((distribuidasRecientes / totalRecientes) * 100);

    // Veredicto del Periodista Senior
    if (pctImagen < 50) {
      alertas.push(`${100 - pctImagen}% de notas recientes sin imagen destacada. Verificar que las notas tengan foto.`);
      problemasCriticos++;
    } else { scoreCalidad += 15; }

    if (pctResumen < 50) {
      alertas.push('Resumen/meta descripción insuficiente en notas recientes. Afecta SEO y CTR.');
      problemasCriticos++;
    } else { scoreCalidad += 15; }

    if (pctContenido < 50) {
      alertas.push('Algunas notas recientes son cortas. Meta: 200+ palabras para AdSense.');
      problemasCriticos++;
    } else { scoreCalidad += 20; }

    if (pctDistribuidas < 30) {
      alertas.push('Algunas notas recientes no tienen tráfico confirmado. Revisar que estén compartidas en redes.');
      problemasCriticos++;
    } else { scoreCalidad += 15; }

    // Análisis de tráfico
    const tasaVistas = totalNoticias > 0 ? Math.round((noticiasConVistas / totalNoticias) * 100) : 0;
    const promedioVistas = totalNoticias > 0 ? Math.round(vistasTotales / totalNoticias) : 0;

    if (tasaVistas < 30) {
      alertas.push(`Solo ${tasaVistas}% de notas han recibido vistas. Revisar SEO y distribución.`);
      problemasCriticos++;
    } else { scoreCalidad += 15; }

    if (promedioVistas < 5) {
      consejos.push('Promedio de vistas muy bajo. Considerar más distribuciones y títulos más SEO-friendly.');
    } else { scoreCalidad += 10; }

    // Si todo bien, dar consejos positivos
    if (alertas.length === 0) {
      consejos.push('El archivo está en excelente estado. Mantener ritmo de publicación.');
    }

    if (noticiasSinDistribuir > 20) {
      consejos.push(`${noticiasSinDistribuir} notas sin tráfico detectado. Considerar compartirlas en WhatsApp, Facebook o Telegram para generar alcance.`);
    }

    // Impacto de distribuciones
    const impactoDistribucion = distribuciones24h.length > 0
      ? `Hoy se distribuyeron ${distribuciones24h.length} notas. Esto genera tráfico directo.`
      : 'Sin distribuciones en 24h. El Agente debería ejecutarse.';

    // Fuentes principales de tráfico (24h, RAW)
    const trafficSourceMetric = getMetricDefinition('site.traffic.sources');
    const fuentesOrdenadas = Object.entries(fuentes)
      .sort((a, b) => b[1].visits - a[1].visits)
      .map(([nombre, data]) => ({
        nombre,
        visitas: data.visits,
        metric: trafficSourceMetric,
        articulosUnicos: data.articulos.size,
      }));

    // Veredicto final
    const nivelVeredicto = scoreCalidad >= 80 ? 'EXCELENTE' : scoreCalidad >= 60 ? 'BUENO' : scoreCalidad >= 40 ? 'REGULAR' : 'NECESITA ACCIÓN';
    const colorVeredicto = scoreCalidad >= 80 ? '#22c55e' : scoreCalidad >= 60 ? '#3b82f6' : scoreCalidad >= 40 ? '#f59e0b' : '#ef4444';

    const metricDefinitions: Record<string, MetricDefinition | undefined> = {
      vistasTotales: getMetricDefinition('site.articles.totalCanonicalViews'),
      noticiasConVistas: getMetricDefinition('site.articles.withViews'),
      noticiasSinVistas: getMetricDefinition('site.articles.withoutViews'),
      promedioVistas: getMetricDefinition('site.articles.averageViews'),
      topNoticias: getMetricDefinition('article.rank.lifetime.top'),
      visitas24h: getMetricDefinition('site.traffic.recent24h'),
      fuentes: getMetricDefinition('site.traffic.sources'),
      distribuciones24h: getMetricDefinition('site.distribution.recent24h'),
      noticiasPublicadas: getMetricDefinition('site.articles.published'),
      noticiasRecientes: getMetricDefinition('site.articles.recent30d'),
    };

    return NextResponse.json({
      success: true,
      hora: ahora.toISOString(),
      horaNicaragua: new Date(ahora.getTime() - 6 * 60 * 60 * 1000).toISOString(),

      // Inventario
      totalNoticias,
      noticiasPublicadas,
      noticiasSinDistribuir,
      vistasTotales,
      noticiasConVistas,
      noticiasSinVistas,
      promedioVistas,
      tasaVistas,

      // Distribución
      distribuciones24h: distribuciones24h.length,
      distribuciones7d: distribuciones7d.length,
      distribuciones30d: distribuciones30d.length,
      canalStats,
      estadoDistribucion,

      // Tráfico
      fuentes: fuentesOrdenadas,
      visitas24h,

      // Top
      topNoticias,

      // Definiciones canónicas (SOURCE/DEFINITION/PERIOD/SCOPE/CONFIDENCE)
      metricDefinitions,

      // Calidad / Veredicto del Periodista Senior
      scoreCalidad,
      nivelVeredicto,
      colorVeredicto,
      problemasCriticos,
      alertas,
      consejos,
      impactoDistribucion,

      // Detalle calidad
      calidadDetalle: {
        pctImagen,
        pctResumen,
        pctContenido,
        pctDistribuidas,
        totalRecientes,
      },

      // Bitácora de distribución detectada
      bitacoraDistribucion,
    });
  } catch (err: any) {
    logger.error('[admin/auditor-dashboard]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** Convierte fecha de Firestore (Timestamp, string ISO, Date, seconds) a Date JS */
function parseFirestoreDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val.toDate === 'function') return val.toDate(); // Firestore Timestamp
  if (val._seconds) return new Date(val._seconds * 1000); // Serialized timestamp
  if (val.seconds && typeof val.seconds === 'number') return new Date(val.seconds * 1000);
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}
