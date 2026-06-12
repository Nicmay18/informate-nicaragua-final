import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

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

    const db = getAdminDb();

    // Contar palabras reales (sin HTML)
    const palabras = contenido
      .replace(/<[^>]*>/g, ' ')
      .split(/\s+/)
      .filter(Boolean).length;

    // Datos a actualizar
    const updateData: Record<string, unknown> = {
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      fechaActualizacion: new Date(),
      palabras,
    };

    if (resumen !== undefined) updateData.resumen = resumen.trim();
    if (categoria !== undefined) updateData.categoria = categoria;
    if (departamento !== undefined) updateData.departamento = departamento;
    if (imagen !== undefined) updateData.imagen = imagen;
    if (publicado !== undefined) updateData.publicado = publicado;

    // Actualizar directamente con Admin SDK (ignora security rules)
    await db.collection('noticias').doc(id).update(updateData);

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
