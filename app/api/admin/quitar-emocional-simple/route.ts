import { getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

const ADJETIVOS_PROHIBIDOS = [
  'tragico', 'terrible', 'impactante', 'conmociono', 'devastador',
  'horrible', 'alarmante', 'desgarrador', 'lamentable', 'dramatico',
  'critico', 'escalofriante', 'espeluznante', 'increible', 'inimaginable',
  'indignante', 'escandaloso', 'vergonzoso', 'aterrador', 'mortifero',
  'sangriento', 'brutal', 'salvaje', 'violento', 'agresivo',
  'tragedia', 'fatal', 'horror', 'desgarrador',
];

function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function quitarAdjetivos(html: string): { limpio: string; reemplazos: string[] } {
  const reemplazos: string[] = [];
  let limpio = html;
  const normalizedHtml = normalize(html);

  for (const adj of ADJETIVOS_PROHIBIDOS) {
    const normAdj = normalize(adj);
    const pattern = new RegExp(`\\b${normAdj}\\b`, 'gi');
    if (pattern.test(normalizedHtml)) {
      reemplazos.push(adj);
      // Reemplazar en el HTML original (case-insensitive, preservando el resto del texto)
      limpio = limpio.replace(pattern, '');
    }
  }

  // Limpiar espacios dobles dejados por eliminaciones
  limpio = limpio.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

  return { limpio, reemplazos };
}

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token') || request.headers.get('x-admin-key') || '';
    if (!adminToken || adminToken !== ADMIN_API_KEY) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const ids: string[] = body.ids || [];
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Falta array ids en body' }, { status: 400 });
    }

    const db = getAdminDb();
    const resultados: Array<{
      id: string;
      titulo: string;
      estado: string;
      reemplazos: string[];
      error?: string;
    }> = [];

    for (const id of ids) {
      const doc = await db.collection('noticias').doc(id).get();
      if (!doc.exists) {
        resultados.push({ id, titulo: '', estado: 'no_encontrada', reemplazos: [], error: 'Documento no existe' });
        continue;
      }

      const data = doc.data()!;
      const titulo = data.titulo || '';
      const contenido = data.contenido || '';

      const { limpio, reemplazos } = quitarAdjetivos(contenido);

      if (reemplazos.length === 0) {
        resultados.push({ id, titulo, estado: 'sin_cambios', reemplazos: [] });
        continue;
      }

      await doc.ref.update({
        contenido: limpio,
        _emocionalLimpio: true,
        _fechaLimpiezaEmocional: new Date().toISOString(),
      });

      resultados.push({ id, titulo, estado: 'limpiada', reemplazos });
    }

    const limpiadas = resultados.filter(r => r.estado === 'limpiada').length;
    const sinCambios = resultados.filter(r => r.estado === 'sin_cambios').length;

    return NextResponse.json({
      success: true,
      procesadas: resultados.length,
      limpiadas,
      sinCambios,
      resultados,
    });
  } catch (err: any) {
    console.error('[admin/quitar-emocional-simple] Error:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
