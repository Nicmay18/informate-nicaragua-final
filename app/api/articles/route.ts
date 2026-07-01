import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { generateSlug } from '@/lib/slug';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, contenido, resumen, categoria, imagen, autor, premium } = body;

    if (!titulo || !contenido) {
      return NextResponse.json(
        { error: 'Título y contenido son obligatorios' },
        { status: 400 }
      );
    }

    const wordCount = countWords(contenido);
    if (wordCount < 500) {
      return NextResponse.json(
        {
          error: `El artículo debe tener mínimo 500 palabras. Actualmente tiene ${wordCount}.`,
          wordCount,
        },
        { status: 400 }
      );
    }

    const slug = generateSlug(titulo);

    const existing = await adminDb
      .collection('noticias')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    // ANTI-DUPLICADOS: si ya existe una noticia con este slug, NO crear un
    // duplicado con sufijo aleatorio (eso canibalizaba el SEO en Google).
    // Devolvemos la noticia existente para que la automatizacion no duplique.
    if (!existing.empty) {
      const doc = existing.docs[0];
      return NextResponse.json({
        success: true,
        duplicate: true,
        id: doc.id,
        slug,
        message: 'Ya existe una noticia con este titulo/slug. No se creo duplicado.',
        url: `https://nicaraguainformate.com/noticias/${slug}`,
      });
    }

    const finalSlug = slug;

    const articleRef = adminDb.collection('noticias').doc();
    const now = new Date();
    await articleRef.set({
      titulo,
      slug: finalSlug,
      contenido,
      resumen: resumen || '',
      categoria: categoria || 'General',
      imagen: imagen || '',
      autor: autor || 'Redacción Nicaragua Informate',
      autorRol: categoria === 'Deportes' ? 'Redacción Deportiva' : 'Nicaragua Informate',
      fecha: now,
      fechaActualizacion: now,
      vistas: 0,
      publicado: true,
      premium: premium === true,
    });

    // Ping IndexNow en background (no bloquea la respuesta)
    fetch(`${request.nextUrl.origin}/api/indexnow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: finalSlug }),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      id: articleRef.id,
      slug: finalSlug,
      wordCount,
      url: `https://nicaraguainformate.com/noticias/${finalSlug}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
