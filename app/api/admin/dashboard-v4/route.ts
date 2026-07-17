import { NextResponse } from 'next/server';
import { getShadowHistory } from '@/lib/editor-jefe-v4/shadow-logger';
import { calcularMetricas } from '@/lib/editor-jefe-v4/metrics';

export async function GET() {
  try {
    const logs = await getShadowHistory(500);
    const metricas = calcularMetricas(logs);

    return NextResponse.json({
      metricas,
      logsRecientes: logs.slice(0, 20),
    });
  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    return NextResponse.json(
      { error: 'Error al obtener métricas del dashboard' },
      { status: 500 }
    );
  }
}
