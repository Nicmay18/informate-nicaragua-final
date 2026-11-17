import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
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
    const db = getAdminDb();
    // Chequeo previo (no atómico) contra docs legacy con id aleatorio:
    // el create() con id determinista es la barrera real contra carreras.
    const dup = await db.collection(AUSPICIADORES_COLLECTION)
      .where('nombre', '==', a.nombre).limit(10).get();
    if (dup.docs.some((d) => (d.data() as Auspiciador).url === a.url)) {
      return privateJson({ ok: false, error: 'Ya existe un auspiciador con ese nombre y destino' }, 409);
    }
    // Anti-duplicados ATÓMICO: el doc id es un hash determinista de
    // nombre+url → create() falla con ALREADY_EXISTS si ya existe, sin
    // ventana de carrera entre consulta y escritura. Las métricas nunca
    // se parten entre documentos.
    const dedupKey = createHash('sha256')
      .update(`${a.nombre.trim().toLowerCase()}|${a.url.trim().toLowerCase()}`)
      .digest('hex')
      .slice(0, 20);
    const ref = db.collection(AUSPICIADORES_COLLECTION).doc(`sp_${dedupKey}`);
    try {
      await ref.create({
        ...a,
        bannerUrl: a.bannerUrl || null,
        notas: a.notas || '',
        impresiones: 0,
        clics: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err?.code === 6 || /already exists/i.test(String(err?.message))) {
        return privateJson({ ok: false, error: 'Ya existe un auspiciador con ese nombre y destino' }, 409);
      }
      throw err;
    }
    return privateJson({ ok: true, id: ref.id }, 201);
  } catch (err) {
    logger.error('[admin/auspiciadores] create failed:', err);
    return privateJson({ ok: false, error: 'No se pudo crear el auspiciador' }, 500);
  }
}
