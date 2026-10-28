import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest, unauthorized } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { AUSPICIADORES_COLLECTION, auspiciadorSchema } from '@/lib/ads/auspiciadores';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  activo: z.boolean(),
});

function privateJson(body: unknown, status = 200): NextResponse {
  const res = NextResponse.json(body, { status });
  res.headers.set('Cache-Control', 'private, no-store');
  return res;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return unauthorized();
  const { id } = await params;
  if (!id || id.length > 128) return privateJson({ ok: false, error: 'ID inválido' }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ ok: false, error: 'JSON inválido' }, 400);
  }

  const parsed = auspiciadorSchema.safeParse(body);
  if (!parsed.success) {
    return privateJson({ ok: false, error: 'Datos inválidos', issues: parsed.error.issues }, 400);
  }

  const a = parsed.data;
  if (new Date(a.fechaVencimiento) < new Date(a.fechaInicio)) {
    return privateJson({ ok: false, error: 'La fecha de vencimiento debe ser posterior al inicio' }, 400);
  }

  try {
    const ref = getAdminDb().collection(AUSPICIADORES_COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return privateJson({ ok: false, error: 'Auspiciador no encontrado' }, 404);
    await ref.update({
      ...a,
      bannerUrl: a.bannerUrl || null,
      notas: a.notas || '',
      updatedAt: new Date().toISOString(),
    });
    return privateJson({ ok: true, id });
  } catch (err) {
    logger.error('[admin/auspiciadores/:id] update failed:', err);
    return privateJson({ ok: false, error: 'No se pudo actualizar el auspiciador' }, 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return unauthorized();
  const { id } = await params;
  if (!id || id.length > 128) return privateJson({ ok: false, error: 'ID inválido' }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ ok: false, error: 'JSON inválido' }, 400);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return privateJson({ ok: false, error: 'Datos inválidos', issues: parsed.error.issues }, 400);
  }

  try {
    const ref = getAdminDb().collection(AUSPICIADORES_COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return privateJson({ ok: false, error: 'Auspiciador no encontrado' }, 404);
    await ref.update({ activo: parsed.data.activo, updatedAt: new Date().toISOString() });
    return privateJson({ ok: true, id, activo: parsed.data.activo });
  } catch (err) {
    logger.error('[admin/auspiciadores/:id] patch failed:', err);
    return privateJson({ ok: false, error: 'No se pudo actualizar el auspiciador' }, 500);
  }
}
