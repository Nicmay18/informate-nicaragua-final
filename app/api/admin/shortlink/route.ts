import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isAdminRequest, unauthorized } from '@/lib/auth';
import crypto from 'crypto';
import { isString } from '@/lib/validators';

function generateShortId(): string {
  // Generar ID corto de 8 caracteres alfanuméricos
  return crypto.randomBytes(6).toString('base64url').slice(0, 8);
}

/**
 * Genera un link corto para tracking forense de tráfico.
 * 
 * POST /api/admin/shortlink
 * Body: { slug: string, titulo: string, categoria: string, source: string }
 * Response: { ok: true, shortId: string, shortUrl: string }
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json();
    const { slug, titulo, categoria, source } = body as Record<string, unknown>;

    if (!isString(slug) || slug.length === 0) {
      return NextResponse.json({ error: 'Slug requerido' }, { status: 400 });
    }

    const db = getAdminDb();
    const shortId = generateShortId();
    const baseUrl = 'https://nicaraguainformate.com';
    const targetUrl = `${baseUrl}/noticias/${slug}`;

    // Guardar el link corto en Firestore
    await db.collection('links_cortos').doc(shortId).set({
      slug,
      titulo: titulo || '',
      categoria: categoria || 'Actualidad',
      source: source || 'directo',
      targetUrl,
      shortUrl: `${baseUrl}/l/${shortId}`,
      clicks: 0,
      creado: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      shortId,
      shortUrl: `${baseUrl}/l/${shortId}`,
    });

  } catch (error) {
    console.error('[shortlink] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Método no permitido. Use POST.' }, { status: 405 });
}
