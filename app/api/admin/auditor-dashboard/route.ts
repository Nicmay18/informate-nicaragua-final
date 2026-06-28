import { getAdminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Auditor Dashboard — El "Periodista Senior" que valora todo el trabajo */
export async function GET() {
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
      if (n.distribuida) {
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
    const trafficSnap = await db
      .collection('traffic_log')
      .where('timestamp', '>=', hace24h)
      .orderBy('timestamp', 'desc')
      .limit(500)
      .get();

    const fuentes: Record<string, { visits: number; articulos: Set<string> }> = {};
    for (const doc of trafficSnap.docs) {
      const d = doc.data();
      const source = detectarFuente(d.referrer, d.utmSource);
      if (!fuentes[source]) fuentes[source] = { visits: 0, articulos: new Set() };
      fuentes[source].visits++;
      if (d.slug) fuentes[source].articulos.add(d.slug);
    }

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

    // ─── 5. TOP ARTÍCULOS (vistas) ───
    const topNoticias = noticias
      .sort((a: any, b: any) => (b.vistas || 0) - (a.vistas || 0))
      .slice(0, 10)
      .map((n: any) => ({
        titulo: n.titulo,
        slug: n.slug,
        vistas: n.vistas || 0,
        categoria: n.categoria,
        distribuida: n.distribuida || false,
      }));

    // ─── 6. CALIDAD DEL ARCHIVO ───
    const noticiasRecientes = noticias
      .filter((n: any) => n.fecha && new Date(n.fecha) >= hace30d)
      .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    let scoreCalidad = 0;
    let problemasCriticos = 0;
    const alertas: string[] = [];
    const consejos: string[] = [];

    // Análisis del archivo reciente
    const conImagen = noticiasRecientes.filter((n: any) => n.imagen && n.imagen.startsWith('http')).length;
    const conResumen = noticiasRecientes.filter((n: any) => n.resumen && n.resumen.length > 50).length;
    const conContenido = noticiasRecientes.filter((n: any) => {
      const texto = (n.contenido || '').replace(/<[^>]*>/g, ' ').trim();
      return texto.split(/\s+/).length >= 200;
    }).length;
    const distribuidasRecientes = noticiasRecientes.filter((n: any) => n.distribuida).length;

    const totalRecientes = noticiasRecientes.length || 1;

    // Score basado en métricas
    const pctImagen = Math.round((conImagen / totalRecientes) * 100);
    const pctResumen = Math.round((conResumen / totalRecientes) * 100);
    const pctContenido = Math.round((conContenido / totalRecientes) * 100);
    const pctDistribuidas = Math.round((distribuidasRecientes / totalRecientes) * 100);

    // Veredicto del Periodista Senior
    if (pctImagen < 70) {
      alertas.push(`${100 - pctImagen}% de notas recientes sin imagen destacada. Cada nota necesita foto para Google Discover.`);
      problemasCriticos++;
    } else { scoreCalidad += 15; }

    if (pctResumen < 70) {
      alertas.push('Resumen/meta descripción insuficiente. Afecta SEO y CTR en Google.');
      problemasCriticos++;
    } else { scoreCalidad += 15; }

    if (pctContenido < 60) {
      alertas.push('Notas demasiado cortas (<200 palabras). Riesgo de thin content para AdSense.');
      problemasCriticos++;
    } else { scoreCalidad += 20; }

    if (pctDistribuidas < 50) {
      alertas.push('Menos del 50% de notas recientes distribuidas. Se pierde alcance orgánico.');
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
      consejos.push(`${noticiasSinDistribuir} notas sin distribuir. Ejecutar Agente para maximizar alcance.`);
    }

    // Impacto de distribuciones
    const impactoDistribucion = distribuciones24h.length > 0
      ? `Hoy se distribuyeron ${distribuciones24h.length} notas. Esto genera tráfico directo.`
      : 'Sin distribuciones en 24h. El Agente debería ejecutarse.';

    // Fuentes principales de tráfico
    const fuentesOrdenadas = Object.entries(fuentes)
      .sort((a, b) => b[1].visits - a[1].visits)
      .map(([nombre, data]) => ({
        nombre,
        visitas: data.visits,
        articulosUnicos: data.articulos.size,
      }));

    // Veredicto final
    const nivelVeredicto = scoreCalidad >= 80 ? 'EXCELENTE' : scoreCalidad >= 60 ? 'BUENO' : scoreCalidad >= 40 ? 'REGULAR' : 'NECESITA ACCIÓN';
    const colorVeredicto = scoreCalidad >= 80 ? '#22c55e' : scoreCalidad >= 60 ? '#3b82f6' : scoreCalidad >= 40 ? '#f59e0b' : '#ef4444';

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
      visitas24h: trafficSnap.size,

      // Top
      topNoticias,

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
    });
  } catch (err: any) {
    console.error('[admin/auditor-dashboard]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function detectarFuente(referrer?: string, utmSource?: string): string {
  if (utmSource) return utmSource.toLowerCase().trim();
  if (!referrer) return 'directo';
  const r = referrer.toLowerCase();
  if (r.includes('facebook') || r.includes('fb.')) return 'facebook';
  if (r.includes('t.me') || r.includes('telegram')) return 'telegram';
  if (r.includes('whatsapp')) return 'whatsapp';
  if (r.includes('twitter') || r.includes('x.com') || r.includes('t.co')) return 'twitter';
  if (r.includes('google')) return 'google';
  return 'otro';
}
