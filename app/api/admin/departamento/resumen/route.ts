import { NextResponse } from 'next/server';
import { getLatestDepartamentoReport } from '@/lib/departamento-central/store';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const report = await getLatestDepartamentoReport();

    if (!report) {
      return NextResponse.json({
        found: false,
        message: 'Todavía no existe un informe del Departamento Central. Se generará en el próximo ciclo programado.',
      }, { status: 200 });
    }

    return NextResponse.json({ found: true, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[admin/departamento/resumen] Error:', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
