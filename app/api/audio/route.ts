import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 5;

/** Control de métodos HTTP: solo POST permitido para generación */
export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  );
}

export async function POST() {
  // Desactivado temporalmente: endpoint tenía 100% error rate y quemaba
  // CPU de Vercel + llamadas a ElevenLabs. Re-activar solo cuando esté
  // completamente corregido y con rate limiting robusto.
  return NextResponse.json(
    {
      error: 'Audio generation temporarily disabled for maintenance',
      disabledAt: '2026-07-03',
    },
    {
      status: 503,
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}
