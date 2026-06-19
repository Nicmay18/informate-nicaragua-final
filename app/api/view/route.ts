import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { adminDb } from '@/lib/firebase-admin';
import { categoryToSlug } from '@/lib/types';
import { incrementView } from '@/lib/view-counter';
import { RateLimiter } from '@/lib/rate-limit';
import { getClientIp, isValidSlug } from '@/lib/ip';

/** Rate limiter: máximo 10 vistas por IP por minuto */
const viewLimiter = new RateLimiter({ intervalMs: 60_000, maxRequests: 10 });

/** Cooldown de revalidación: 1 HORA para evitar regenerar la homepage con cada visita */
let lastRevalidate = 0;
const REVALIDATE_COOLDOWN_MS = 3_600_000;

function maybeRevalidate(slug: string, categoriaSlug: string | null) {
  const now = Date.now();
  if (now - lastRevalidate < REVALIDATE_COOLDOWN_MS) return;
  lastRevalidate = now;
  try {
    revalidateTag('news');
    revalidatePath('/');
    revalidatePath('/noticias');
    revalidatePath(`/noticias/${slug}`);
    if (categoriaSlug) revalidatePath(`/categoria/${categoriaSlug}`);
  } catch (err) {
    console.warn('[api/view] Falló la revalidación:', err);
  }
}

/** Control de métodos HTTP: solo POST permitido */
export async function GET() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting por IP
    const ip = getClientIp(request);
    const rateCheck = viewLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones. Intenta más tarde.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // 2. Parseo seguro del body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
    }

    // 3. Validación estricta de slug
    const slug = body.slug;
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'slug requerido' }, { status: 400 });
    }
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'slug inválido' }, { status: 400 });
    }

    // 4. Consulta a Firestore
    const snap = await adminDb
      .collection('noticias')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: 'noticia no encontrada' }, { status: 404 });
    }

    const docRef = snap.docs[0].ref;
    const data = snap.docs[0].data();
    const currentVistas = data.vistas || 0;

    // 5. Acumular en batch (ahorro ~90% en costos Firestore)
    incrementView(docRef.id, docRef);

    // 6. Revalidación de caché con cooldown global (evita DoS por revalidatePath spam)
    const categoriaSlug = data.categoria ? categoryToSlug(data.categoria) : null;
    maybeRevalidate(slug, categoriaSlug);

    // 7. Respuesta exitosa
    return NextResponse.json({
      ok: true,
      vistas: currentVistas + 1,
      batched: true,
      remaining: rateCheck.remaining,
    });
  } catch (e) {
    console.error('[api/view] Error:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

