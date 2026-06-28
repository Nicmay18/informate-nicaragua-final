import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const SLUG_RE = /^[a-zA-Z0-9_-]+$/;
const SLUG_MAX_LEN = 200;

function validateSlug(slug: string): { valid: boolean; reason?: string } {
  if (!slug || typeof slug !== 'string') return { valid: false, reason: 'Slug requerido' };
  if (slug.length > SLUG_MAX_LEN) return { valid: false, reason: 'Slug excede 200 caracteres' };
  if (!SLUG_RE.test(slug)) return { valid: false, reason: 'Slug contiene caracteres inválidos' };
  return { valid: true };
}

/**
 * POST /api/views/[slug]
 * Registra una vista en Firestore. Incluye referrer y utm_source para
 * análisis de tráfico. Usa Vercel Functions + Firebase Admin SDK.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const v = validateSlug(slug);
    if (!v.valid) {
      return NextResponse.json({ error: v.reason }, { status: 400 });
    }

    // Parsear body (referrer, utm_source)
    let body: any = {};
    try { body = await request.json(); } catch { /* ignore */ }

    const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 500) : '';
    const utmSource = typeof body.utmSource === 'string' ? body.utmSource.slice(0, 100) : '';

    const db = getAdminDb();
    const docRef = db.collection('views').doc(slug);

    // Incrementar contador de vistas
    await docRef.set(
      {
        count: FieldValue.increment(1),
        slug,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // También incrementar vistas en la noticia (panel lee de aquí)
    const noticiaSnap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
    if (!noticiaSnap.empty) {
      const noticiaRef = noticiaSnap.docs[0].ref;
      await noticiaRef.update({
        vistas: FieldValue.increment(1),
        actualizadoEn: FieldValue.serverTimestamp(),
      });
    }

    // Guardar log de tráfico con referrer/utm (separado para no sobreescribir)
    const logRef = db.collection('traffic_log').doc();
    await logRef.set({
      slug,
      referrer,
      utmSource,
      userAgent: request.headers.get('user-agent') || '',
      ip: request.headers.get('x-forwarded-for') || '',
      timestamp: FieldValue.serverTimestamp(),
    });

    // Leer el contador actualizado
    const snap = await docRef.get();
    const count = snap.exists ? (snap.data()?.count as number) || 0 : 0;

    return NextResponse.json({ ok: true, slug, vistas: count });
  } catch (error) {
    console.error('[views API] error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const v = validateSlug(slug);
    if (!v.valid) {
      return NextResponse.json({ error: v.reason }, { status: 400 });
    }

    const db = getAdminDb();
    const snap = await db.collection('views').doc(slug).get();
    const count = snap.exists ? (snap.data()?.count as number) || 0 : 0;

    return NextResponse.json({ ok: true, slug, vistas: count });
  } catch (error) {
    console.error('[views API GET] error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT() {
  return NextResponse.json({ error: 'Método no permitido. Use POST.' }, { status: 405, headers: { Allow: 'POST' } });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Método no permitido. Use POST.' }, { status: 405, headers: { Allow: 'POST' } });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Método no permitido. Use POST.' }, { status: 405, headers: { Allow: 'POST' } });
}
