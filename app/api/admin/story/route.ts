import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { runStoryEditor } from '@/lib/editorial/story-editor';
import type { ResearchResult } from '@/lib/research/types';

export const maxDuration = 30;

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { research, rawInput } = body;

    if (!research || !rawInput) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: research, rawInput' },
        { status: 400 }
      );
    }

    const proposal = await runStoryEditor({
      research: research as ResearchResult,
      rawInput,
    });

    return NextResponse.json({ success: true, proposal });
  } catch (error) {
    console.error('[story] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
