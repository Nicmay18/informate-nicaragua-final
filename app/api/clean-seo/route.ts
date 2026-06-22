import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { defaultRateLimiter } from '@/lib/rate-limit';

function cleanContent(content: string): string {
  let cleaned = content;

  // 1. Remove blocks: <h2>Información Recabada</h2> followed by <ul>...</ul>
  cleaned = cleaned.replace(/<h2>\s*Informaci[oó]n\s+Recabada\s*<\/h2>\s*<ul>[\s\S]*?<\/ul>/gi, '');

  // 2. Remove blocks: ## Información Recabada followed by list items
  cleaned = cleaned.replace(/##\s*Informaci[oó]n\s+Recabada\s*\n(?:\*\s*.*\n)*/gi, '');

  // 3. Remove lines with Slug sugerido / Meta descripción / Datos de Publicación
  cleaned = cleaned.split('\n').filter(line =>
    !/Slug sugerido:/i.test(line) &&
    !/Meta descripci[oó]n:/i.test(line) &&
    !/Datos de Publicaci[oó]n/i.test(line)
  ).join('\n');

  // 4. Clean up consecutive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

function getClientIP(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rate = defaultRateLimiter.check(ip);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Demasiadas peticiones. Espere 1 minuto.' }, { status: 429 });
  }

  try {
    const db = getAdminDb();
    // limit(200) evita escanear colecciones enormes accidentalmente
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();
    let count = 0;
    const cleaned: string[] = [];

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const content = data.contenido || '';
      const cleanedContent = cleanContent(content);

      if (cleanedContent !== content) {
        await db.doc(`noticias/${docSnap.id}`).update({ contenido: cleanedContent });
        count++;
        cleaned.push(data.titulo?.substring(0, 60) || docSnap.id);
      }
    }

    return NextResponse.json({
      success: true,
      total: snap.docs.length,
      cleaned: count,
      articles: cleaned,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
