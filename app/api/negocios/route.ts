import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { listarNegociosPublicos } from '@/lib/negocios/datos';

export const dynamic = 'force-dynamic';

/**
 * Directorio público: solo perfiles aprobados y vigentes.
 * Filtros: ?categoria=, ?departamento=, ?q= (nombre/descripción).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const categoria = (searchParams.get('categoria') || '').slice(0, 80);
  const departamento = (searchParams.get('departamento') || '').slice(0, 40);
  const q = (searchParams.get('q') || '').trim().toLowerCase().slice(0, 80);

  try {
    let items = await listarNegociosPublicos();
    if (categoria) items = items.filter((n) => n.categoria === categoria);
    if (departamento) items = items.filter((n) => n.departamento === departamento);
    if (q) {
      items = items.filter((n) =>
        `${n.nombre} ${n.descripcion} ${n.municipio}`.toLowerCase().includes(q),
      );
    }
    const res = NextResponse.json({ ok: true, items, total: items.length });
    res.headers.set('Cache-Control', 'private, no-store');
    return res;
  } catch (err) {
    logger.error('[api/negocios] list failed:', err);
    return NextResponse.json({ ok: false, error: 'No se pudo listar' }, { status: 500 });
  }
}
