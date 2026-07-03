import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const maxDuration = 10;

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

    // Paralelizar writes principales para reducir CPU time
    const promises: Promise<unknown>[] = [
      docRef.set(
        {
          count: FieldValue.increment(1),
          slug,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      ),
    ];

    // Actualizar vistas en noticia (no bloquea respuesta si falla)
    promises.push(
      db.collection('noticias').where('slug', '==', slug).limit(1).get()
        .then(snap => {
          if (!snap.empty) {
            return snap.docs[0].ref.update({
              vistas: FieldValue.increment(1),
              actualizadoEn: FieldValue.serverTimestamp(),
            });
          }
          return undefined;
        })
        .catch(() => { /* no bloquear */ })
    );

    // Traffic log con sampling 10% (reduce writes drásticamente)
    if (Math.random() < 0.1) {
      promises.push(
        db.collection('traffic_log').doc().set({
          slug,
          referrer,
          utmSource,
          userAgent: request.headers.get('user-agent') || '',
          ip: request.headers.get('x-forwarded-for') || '',
          timestamp: FieldValue.serverTimestamp(),
        }).catch(() => { /* no bloquear */ })
      );
    }

    await Promise.all(promises);

    // Leer contador actualizado
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

    return NextResponse.json(
      { ok: true, slug, vistas: count },
      {
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=300',
        },
      }
    );
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
