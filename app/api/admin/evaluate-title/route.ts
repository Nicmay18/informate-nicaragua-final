import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { evaluateRawTitle } from '@/lib/supervisor';

export const maxDuration = 30;

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

/**
 * POST /api/admin/evaluate-title
 *
 * Punto de control del Supervisor CRUDO — se invoca ANTES de redactar.
 * El periodista envia solo un titulo tentativo. El Supervisor decide si:
 *  - Es lo suficientemente especifico para investigar.
 *  - Es generico/clickbait y necesita datos concretos.
 *  - Faltan elementos obligatorios (quien, que, donde, cuando).
 *
 * Esto evita gastar tokens del Research Agent y del Story Editor en ideas
 * de baja calidad. Es el primer guardian del flujo editorial.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { titulo } = body;

    if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
      return NextResponse.json(
        { error: 'Falta el campo "titulo"' },
        { status: 400 }
      );
    }

    const result = evaluateRawTitle(titulo.trim());

    return NextResponse.json({
      success: true,
      evaluation: {
        ...result,
        title: titulo.trim(),
        canProceed: result.verdict !== 'NO_PUBLICAR' && result.verdict !== 'BLOQUEAR',
        nextStep: result.verdict === 'NO_PUBLICAR' || result.verdict === 'BLOQUEAR'
          ? 'REJECTED: El titulo es demasiado generico o clickbait. Reescribalo con datos concretos (quien, que, donde, cuando, por que).'
          : result.needsInvestigation
            ? 'NEEDS_RESEARCH: El Supervisor detecto que faltan datos. Invocar Research Agent antes de redactar.'
            : 'READY: El titulo parece suficientemente especifico. Puede redactar o invocar Research si lo desea.',
      },
    });
  } catch (error) {
    console.error('[evaluate-title] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
