import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const maxDuration = 30;

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  const validToken = process.env.ADMIN_API_KEY || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  if (!validToken) return false;
  return token === validToken;
}

export async function GET(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const db = getAdminDb();
  const dias = parseInt(request.nextUrl.searchParams.get('dias') || '30');
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - dias);
  const fechaLimiteStr = fechaLimite.toISOString();

  try {
    // ── 1. Stats de notas analizadas ──────────────────────────
    const noticiasSnap = await db.collection('noticias')
      .where('fecha', '>=', fechaLimiteStr)
      .get();

    let publicadas = 0;
    let rechazadas = 0;
    const categoriasDistribucion: Record<string, number> = {};

    for (const doc of noticiasSnap.docs) {
      const data = doc.data();
      if (data.publicado !== false) {
        publicadas++;
      } else {
        rechazadas++;
      }
      const cat = data.categoria || 'General';
      categoriasDistribucion[cat] = (categoriasDistribucion[cat] || 0) + 1;
    }

    const totalNotas = noticiasSnap.size;

    // ── 2. Correcciones automáticas ────────────────────────────
    let correccionesAuto = 0;
    try {
      const autoSnap = await db.collection('meni_quality_history')
        .where('timestamp', '>=', fechaLimiteStr)
        .get();
      for (const doc of autoSnap.docs) {
        const data = doc.data();
        correccionesAuto += (data.corregido?.length || 0);
      }
    } catch { /* noop */ }

    // ── 3. Correcciones humanas + patrones ─────────────────────
    let correccionesHumanas = 0;
    let correccionesRepetidas = 0;
    let patronesAprendidos = 0;
    try {
      const corrSnap = await db.collection('editor_corrections')
        .where('fecha', '>=', fechaLimiteStr)
        .get();
      correccionesHumanas = corrSnap.size;

      // Detectar repetidas: mismo campo + mismo tipo
      const tipoCount: Record<string, number> = {};
      for (const doc of corrSnap.docs) {
        const data = doc.data();
        const key = `${data.campo}:${data.diferenciaTipo}`;
        tipoCount[key] = (tipoCount[key] || 0) + 1;
      }
      correccionesRepetidas = Object.values(tipoCount).filter(c => c >= 3).reduce((a, b) => a + b, 0);
    } catch { /* noop */ }

    try {
      const patternsSnap = await db.collection('editor_patterns').get();
      patronesAprendidos = patternsSnap.size;
    } catch { /* noop */ }

    // ── 4. Predicciones vs resultados ──────────────────────────
    // Comparar predicción de Facebook/Discover/Portada con métricas reales
    const prediccionesFacebook = { total: 0, acertadas: 0 };
    const prediccionesDiscover = { total: 0, acertadas: 0 };
    const prediccionesPortada = { total: 0, acertadas: 0 };

    try {
      const predSnap = await db.collection('meni_predictions')
        .where('fecha', '>=', fechaLimiteStr)
        .get();

      for (const doc of predSnap.docs) {
        const data = doc.data();
        // Facebook
        if (data.predFacebook && data.realFacebook) {
          prediccionesFacebook.total++;
          if (
            (data.predFacebook === 'Alta' && data.realFacebook >= 100) ||
            (data.predFacebook === 'Media' && data.realFacebook >= 30 && data.realFacebook < 100) ||
            (data.predFacebook === 'Baja' && data.realFacebook < 30)
          ) {
            prediccionesFacebook.acertadas++;
          }
        }
        // Discover
        if (data.predDiscover && data.realDiscover !== undefined) {
          prediccionesDiscover.total++;
          if (
            (data.predDiscover === 'Alta' && data.realDiscover) ||
            (data.predDiscover === 'Media' && data.realDiscover) ||
            (data.predDiscover === 'Baja' && !data.realDiscover)
          ) {
            prediccionesDiscover.acertadas++;
          }
        }
        // Portada
        if (data.predPortada && data.realPortada) {
          prediccionesPortada.total++;
          if (data.predPortada === data.realPortada) {
            prediccionesPortada.acertadas++;
          }
        }
      }
    } catch { /* noop */ }

    // ── 5. Errores frecuentes ─────────────────────────────────
    // Agregar desde correcciones humanas: qué campos se corrigen más
    const erroresFrecuentes: { campo: string; count: number }[] = [];
    try {
      const errSnap = await db.collection('editor_corrections')
        .where('fecha', '>=', fechaLimiteStr)
        .get();
      const campoCount: Record<string, number> = {};
      for (const doc of errSnap.docs) {
        const data = doc.data();
        const campo = data.campo || 'otro';
        campoCount[campo] = (campoCount[campo] || 0) + 1;
      }
      for (const [campo, count] of Object.entries(campoCount)) {
        erroresFrecuentes.push({ campo, count });
      }
      erroresFrecuentes.sort((a, b) => b.count - a.count);
    } catch { /* noop */ }

    // ── 6. Calificación de MENI por periodistas ────────────────
    let calificacionPromedio = 0;
    let totalCalificaciones = 0;
    const razonesCount: Record<string, number> = {};

    try {
      const ratingSnap = await db.collection('meni_ratings')
        .where('fecha', '>=', fechaLimiteStr)
        .get();

      for (const doc of ratingSnap.docs) {
        const data = doc.data();
        calificacionPromedio += (data.estrellas || 0);
        totalCalificaciones++;
        if (data.razones && Array.isArray(data.razones)) {
          for (const r of data.razones) {
            razonesCount[r] = (razonesCount[r] || 0) + 1;
          }
        }
      }
      if (totalCalificaciones > 0) {
        calificacionPromedio = calificacionPromedio / totalCalificaciones;
      }
    } catch { /* noop */ }

    // ── 7. Score semanal de MENI (evolución) ───────────────────
    const scoreSemanal: { semana: string; score: number }[] = [];
    try {
      const scoreSnap = await db.collection('meni_daily_score')
        .where('fecha', '>=', fechaLimiteStr)
        .orderBy('fecha', 'asc')
        .get();
      // Agrupar por semana
      const semanaMap: Record<string, { sum: number; count: number }> = {};
      for (const doc of scoreSnap.docs) {
        const data = doc.data();
        const d = new Date(data.fecha);
        const semana = `${d.getFullYear()}-W${Math.ceil(((d.getDate() + 1) / 7))}`;
        if (!semanaMap[semana]) semanaMap[semana] = { sum: 0, count: 0 };
        semanaMap[semana].sum += (data.score || 0);
        semanaMap[semana].count++;
      }
      for (const [semana, { sum, count }] of Object.entries(semanaMap)) {
        scoreSemanal.push({ semana, score: Math.round(sum / count) });
      }
    } catch { /* noop */ }

    return NextResponse.json({
      periodo: { dias, desde: fechaLimiteStr },
      notas: {
        analizadas: totalNotas,
        publicadas,
        rechazadas,
      },
      correcciones: {
        automaticas: correccionesAuto,
        humanas: correccionesHumanas,
        repetidas: correccionesRepetidas,
        patronesAprendidos,
      },
      predicciones: {
        facebook: {
          total: prediccionesFacebook.total,
          acertadas: prediccionesFacebook.acertadas,
          precision: prediccionesFacebook.total > 0
            ? Math.round((prediccionesFacebook.acertadas / prediccionesFacebook.total) * 100)
            : 0,
        },
        discover: {
          total: prediccionesDiscover.total,
          acertadas: prediccionesDiscover.acertadas,
          precision: prediccionesDiscover.total > 0
            ? Math.round((prediccionesDiscover.acertadas / prediccionesDiscover.total) * 100)
            : 0,
        },
        portada: {
          total: prediccionesPortada.total,
          acertadas: prediccionesPortada.acertadas,
          precision: prediccionesPortada.total > 0
            ? Math.round((prediccionesPortada.acertadas / prediccionesPortada.total) * 100)
            : 0,
        },
      },
      erroresFrecuentes: erroresFrecuentes.slice(0, 10),
      calificacionPeriodistas: {
        promedio: Math.round(calificacionPromedio * 10) / 10,
        total: totalCalificaciones,
        razones: Object.entries(razonesCount)
          .map(([razon, count]) => ({ razon, count }))
          .sort((a, b) => b.count - a.count),
      },
      scoreSemanal,
      categoriasDistribucion,
    });
  } catch (error) {
    console.error('[meni-dashboard] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
