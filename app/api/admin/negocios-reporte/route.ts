import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/negocios/seguridad';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { NEGOCIOS_COLLECTION, NEGOCIOS_DAILY_COLLECTION, CAMPANAS_COLLECTION, documentId } from '@/lib/negocios/modelo';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/negocios-reporte?negocioId=x&dias=30
 * CSV descargable para el anunciante: fecha, vistas, clics por canal, CTR.
 */
export async function GET(request: NextRequest) {
  const denied = adminGuard(request); if (denied) return denied;

  const negocioId = request.nextUrl.searchParams.get('negocioId') || '';
  if (!documentId.safeParse(negocioId).success) {
    return NextResponse.json({ ok: false, error: 'negocioId requerido' }, { status: 400 });
  }
  const dias = Math.floor(Math.min(90, Math.max(7, Number(request.nextUrl.searchParams.get('dias')) || 30)));
  const campaignId = request.nextUrl.searchParams.get('campanaId') || '';
  if (campaignId && !documentId.safeParse(campaignId).success) return NextResponse.json({ error: 'Campaña inválida' }, { status: 400 });

  try {
    const db = getAdminDb();
    const negocioSnap = await db.collection(NEGOCIOS_COLLECTION).doc(negocioId).get();
    if (!negocioSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Negocio no encontrado' }, { status: 404 });
    }
    const negocio = negocioSnap.data()!;
    if (campaignId) {
      const campaign = await db.collection(CAMPANAS_COLLECTION).doc(campaignId).get();
      if (!campaign.exists || campaign.data()?.negocioId !== negocioId) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
    }

    const keys: string[] = [];
    for (let i = dias - 1; i >= 0; i--) {
      keys.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
    }
    const docs = await Promise.all(
      keys.map((k) => db.collection(NEGOCIOS_DAILY_COLLECTION).doc(`${negocioId}_${k}`).get()),
    );

    let vistas = 0;
    const totals = { whatsapp: 0, telefono: 0, web: 0 };
    const rows = ['fecha,vistas,clics_whatsapp,clics_telefono,clics_web'];
    docs.forEach((d, i) => {
      const v = (campaignId ? d.data()?.campanas?.[campaignId] : d.data()) || {};
      const w = Number(v.clics_whatsapp || 0);
      const t = Number(v.clics_telefono || 0);
      const b = Number(v.clics_web || 0);
      vistas += Number(v.vistas || 0);
      totals.whatsapp += w; totals.telefono += t; totals.web += b;
      rows.push(`${keys[i]},${Number(v.vistas || 0)},${w},${t},${b}`);
    });
    rows.push(`TOTAL,${vistas},${totals.whatsapp},${totals.telefono},${totals.web}`);
    rows.push('NOTA,"Clics registrados; no equivalen a conversaciones, clientes o ventas",,,');

    const slug = String(negocio.slug || negocioId).replace(/[^a-z0-9-]/gi, '');
    return new NextResponse(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reporte-${slug}.csv"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    logger.error('[admin/negocios-reporte] failed:', err);
    return NextResponse.json({ ok: false, error: 'No se pudo generar el reporte' }, { status: 500 });
  }
}
