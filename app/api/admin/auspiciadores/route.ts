import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest, unauthorized } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  AUSPICIADORES_COLLECTION,
  auspiciadorSchema,
  estadoAuspiciador,
  ctr,
  diasParaVencer,
  type Auspiciador,
} from '@/lib/ads/auspiciadores';

export const dynamic = 'force-dynamic';

function privateJson(body: unknown, status = 200): NextResponse {
  const res = NextResponse.json(body, { status });
  res.headers.set('Cache-Control', 'private, no-store');
  return res;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const snap = await getAdminDb().collection(AUSPICIADORES_COLLECTION).get();
    const now = new Date();
    const items = snap.docs.map((d) => {
      const a = d.data() as Auspiciador;
      return {
        id: d.id,
        ...a,
        estado: estadoAuspiciador(a, now),
        ctr: ctr(a.impresiones || 0, a.clics || 0),
        diasParaVencer: diasParaVencer(a.fechaVencimiento, now),
      };
    });
    items.sort((a, b) => (a.estado === 'activo' ? -1 : b.estado === 'activo' ? 1 : String(a.nombre).localeCompare(String(b.nombre))));
    return privateJson({ ok: true, items });
  } catch (err) {
    logger.error('[admin/auspiciadores] list failed:', err);
    return privateJson({ ok: false, error: 'No se pudo listar auspiciadores' }, 500);
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

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
    const ref = await getAdminDb().collection(AUSPICIADORES_COLLECTION).add({
      ...a,
      bannerUrl: a.bannerUrl || null,
      notas: a.notas || '',
      impresiones: 0,
      clics: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return privateJson({ ok: true, id: ref.id }, 201);
  } catch (err) {
    logger.error('[admin/auspiciadores] create failed:', err);
    return privateJson({ ok: false, error: 'No se pudo crear el auspiciador' }, 500);
  }
}
