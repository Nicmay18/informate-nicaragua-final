import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { calcularScoreEditorial } from '@/utils/scoring';

// =============================================================================
// DICCIONARIO DE SANITIZACION EDITORIAL (Tono institucional/seguro AdSense)
// =============================================================================
const DICCIONARIO_SEGURO: Record<string, string> = {
  'trágico accidente': 'incidente vial fatal',
  'tragico accidente': 'incidente vial fatal',
  'trágica muerte': 'pérdida fatal',
  'tragica muerte': 'pérdida fatal',
  'murió de forma': 'perdió la vida de forma',
  'murio de forma': 'perdió la vida de forma',
  ' sangrienta': ' de alto impacto',
  'horrendo homicidio': 'hecho delictivo bajo investigación',
  'muere': 'fallece',
  'muerto': 'persona fallecida',
  'muerta': 'persona fallecida',
  'víctima mortal': 'deceso confirmado',
  'victima mortal': 'deceso confirmado',
  'asesinado': 'víctima de homicidio',
  'asesinada': 'víctima de homicidio',
  'crimen': 'delito',
  'criminal': 'delincuente',
  'homicidio': 'muerte violenta',
  'suicidio': 'muerte autoinfligida',
  'masacre': 'ataque múltiple',
  'tragedia': 'incidente grave',
  'trágico': 'grave',
  'tragicos': 'graves',
  'trágicos': 'graves',
  'sepelio': 'ceremonia fúnebre',
  'funeral': 'ceremonia fúnebre',
  'luto': 'duelo',
};

function sanitizarTexto(texto: string): string {
  if (!texto) return '';
  let limpio = texto;
  Object.keys(DICCIONARIO_SEGURO).forEach((clave) => {
    const regex = new RegExp(clave, 'gi');
    limpio = limpio.replace(regex, DICCIONARIO_SEGURO[clave]);
  });
  return limpio;
}

// =============================================================================
// SLICING DE PARRAFOS DENSOS (UX Movil: >90 palabras se dividen)
// =============================================================================
function segmentarParrafosDensos(htmlContenido: string): string {
  if (!htmlContenido) return '';

  const parrafos = htmlContenido.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  if (!parrafos) return htmlContenido;

  let htmlProcesado = htmlContenido;

  parrafos.forEach((parrafoOriginal) => {
    const textoInterno = parrafoOriginal.replace(/<[^>]+>/g, '').trim();
    const palabras = textoInterno.split(/\s+/).filter(Boolean);

    if (palabras.length > 90) {
      const oraciones = textoInterno.match(/[^.!?]+[.!?]+(\s|$)/g);
      if (oraciones && oraciones.length > 1) {
        const mitad = Math.ceil(oraciones.length / 2);
        const primeraMitad = oraciones.slice(0, mitad).join('').trim();
        const segundaMitad = oraciones.slice(mitad).join('').trim();

        const nuevoBloqueHtml = `<p>${primeraMitad}</p><p>${segundaMitad}</p>`;
        htmlProcesado = htmlProcesado.replace(parrafoOriginal, nuevoBloqueHtml);
      }
    }
  });

  return htmlProcesado;
}

// =============================================================================
// AUTH BASICA: Header X-Admin-Token
// =============================================================================
function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  const validToken = process.env.ADMIN_CLEAN_TOKEN;
  if (!validToken) {
    console.warn('[clean-backlog] ADMIN_CLEAN_TOKEN no configurado. Endpoint bloqueado.');
    return false;
  }
  return token === validToken;
}

// =============================================================================
// POST /api/admin/clean-backlog
// Query param: ?dryRun=true (solo loguea, no modifica Firestore)
// =============================================================================
export async function POST(request: NextRequest) {
  // ─── 1. AUTENTICACION ───
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get('dryRun') === 'true';

  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(200)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ mensaje: 'No se encontraron noticias' }, { status: 404 });
    }

    const cambios: Array<{
      id: string;
      titulo: string;
      camposModificados: string[];
      tituloCambio: string;
      scoreAntes: number;
      scoreDespues: number;
    }> = [];

    let modificadasCount = 0;
    let batchOps = 0;
    const batch = db.batch();

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // [Paso 1] Sanitizar
      const tituloSanitizado = sanitizarTexto(data.titulo || '');
      const resumenSanitizado = sanitizarTexto(data.resumen || '');

      // [Paso 2] Slicing de parrafos
      const contenidoOptimizado = segmentarParrafosDensos(data.contenido || '');

      // [Paso 3] Recalcular score
      const nuevoScore = calcularScoreEditorial({
        titulo: tituloSanitizado,
        resumen: resumenSanitizado,
        contenido: contenidoOptimizado,
        imagen: data.imagen || '',
      });

      // Detectar cambios reales (evitar rewrites innecesarios)
      const camposModificados: string[] = [];
      if (tituloSanitizado !== (data.titulo || '')) camposModificados.push('titulo');
      if (resumenSanitizado !== (data.resumen || '')) camposModificados.push('resumen');
      if (contenidoOptimizado !== (data.contenido || '')) camposModificados.push('contenido');
      const scoreActual = data.scoreCalidad ?? -1;
      if (nuevoScore !== scoreActual) camposModificados.push('scoreCalidad');

      if (camposModificados.length > 0) {
        cambios.push({
          id: doc.id,
          titulo: data.titulo || '(sin titulo)',
          camposModificados,
          tituloCambio: tituloSanitizado !== data.titulo ? `${data.titulo} -> ${tituloSanitizado}` : '(sin cambio)',
          scoreAntes: scoreActual,
          scoreDespues: nuevoScore,
        });

        if (!dryRun) {
          const docRef = db.collection('noticias').doc(doc.id);
          batch.update(docRef, {
            titulo: tituloSanitizado,
            resumen: resumenSanitizado,
            contenido: contenidoOptimizado,
            scoreCalidad: nuevoScore,
            ultimaActualizacionAutomatica: new Date(),
          });
          batchOps++;

          // Firebase limita batch a 500 operaciones por commit
          if (batchOps >= 450) {
            await batch.commit();
            batchOps = 0;
          }
        }

        modificadasCount++;
      }
    }

    if (!dryRun && batchOps > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      estado: dryRun ? 'DRY-RUN (sin cambios)' : 'Exito',
      totalRevisadas: snapshot.docs.length,
      totalModificadas: modificadasCount,
      detalleCambios: cambios.slice(0, 50), // Limitar respuesta
      modo: dryRun ? 'dry-run' : 'live',
    });

  } catch (error: any) {
    console.error('[clean-backlog] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
