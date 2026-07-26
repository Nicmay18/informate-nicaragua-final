import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const MIN_WORDS = 150;
const MIN_RESUMEN_CHARS = 60;

interface AuditResult {
  total: number;
  thinContent: Array<{
    id: string;
    slug: string;
    titulo: string;
    categoria: string;
    wordCount: number;
    resumenLength: number;
    hasImage: boolean;
    reasons: string[];
  }>;
  noResumen: number;
  noImage: number;
  tooShort: number;
  duplicatedTitles: Array<{ titulo: string; count: number; slugs: string[] }>;
  orphanEconomia: number;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('x-admin-token');
  if (authHeader !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(500).get();

    const articles = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        slug: data.slug || doc.id,
        titulo: data.titulo || '',
        resumen: data.resumen || data.metaDescription || data.metaDescripcion || '',
        contenido: data.contenido || '',
        imagen: data.imagen || '',
        categoria: data.categoria || '',
        fecha: data.fecha || null,
        palabras: data.palabras || 0,
        noindex: data.noindex || false,
        estado: data.estado || 'publicado',
      };
    });

    const result: AuditResult = {
      total: articles.length,
      thinContent: [],
      noResumen: 0,
      noImage: 0,
      tooShort: 0,
      duplicatedTitles: [],
      orphanEconomia: 0,
    };

    // Detect thin content
    const titleMap: Record<string, string[]> = {};

    for (const a of articles) {
      if (a.estado === 'archivado' || a.noindex) continue;

      const plainText = a.contenido
        ? a.contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        : '';
      const wordCount = a.palabras || (plainText ? plainText.split(' ').filter((w: string) => w.length > 0).length : 0);
      const resumenLength = a.resumen ? a.resumen.trim().length : 0;
      const hasImage = a.imagen && a.imagen !== '/logo.webp' && a.imagen !== '/logo.png' && !a.imagen.includes('picsum.photos');

      const reasons: string[] = [];

      if (wordCount < MIN_WORDS) {
        reasons.push(`Solo ${wordCount} palabras (mínimo ${MIN_WORDS})`);
        result.tooShort++;
      }
      if (resumenLength < MIN_RESUMEN_CHARS) {
        reasons.push(`Resumen muy corto (${resumenLength} chars)`);
        result.noResumen++;
      }
      if (!hasImage) {
        reasons.push('Sin imagen propia');
        result.noImage++;
      }
      if (a.categoria === 'Economía') {
        reasons.push('Categoría Economía (ya no se cubre)');
        result.orphanEconomia++;
      }

      if (reasons.length > 0) {
        result.thinContent.push({
          id: a.id,
          slug: a.slug,
          titulo: a.titulo,
          categoria: a.categoria,
          wordCount,
          resumenLength,
          hasImage: !!hasImage,
          reasons,
        });
      }

      // Track duplicate titles
      const titleKey = a.titulo.trim().toLowerCase();
      if (titleKey) {
        if (!titleMap[titleKey]) titleMap[titleKey] = [];
        titleMap[titleKey].push(a.slug);
      }
    }

    // Find actual duplicates
    result.duplicatedTitles = Object.entries(titleMap)
      .filter(([_, slugs]) => slugs.length > 1)
      .map(([titulo, slugs]) => ({ titulo, count: slugs.length, slugs }));

    // Sort thin content by wordCount ascending (worst first)
    result.thinContent.sort((a, b) => a.wordCount - b.wordCount);

    logger.info(`[AuditarContenido] Audit complete: ${result.total} articles, ${result.thinContent.length} flagged`);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('[AuditarContenido] Error:', error);
    return NextResponse.json({ error: 'Error al auditar contenido' }, { status: 500 });
  }
}
