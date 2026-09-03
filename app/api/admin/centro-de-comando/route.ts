import { NextResponse } from 'next/server';
import { getCentroDeComandoData } from '@/lib/admin/centro-de-comando';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getCentroDeComandoData();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[api/admin/centro-de-comando] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
