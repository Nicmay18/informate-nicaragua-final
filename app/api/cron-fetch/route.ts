/**
 * MÓDULO 1: Pipeline Editorial con IA — Nicaragua Informate
 * Route Handler protegido por token secreto para automatización de contenido.
 *
 * REGLA 18: simulateExternalFeed fue eliminado. Publicar contenido ficticio
 * hardcodeado viola la integridad editorial. Este endpoint ahora requiere
 * un feed real (RSS/API) proporcionado via body.articles o via una fuente
 * configurada. Si no hay articles reales, retorna 400.
 *
 * Funcionalidad:
 *   1. Recibe petición con x-cron-secret válido
 *   2. Requiere articles reales en el body (feed externo real) o via NIOS
 *   3. Usa Gemini API para traducir y dar tono periodístico profesional
 *   4. Extrae entidades y keywords vía meta.ts
 *   5. Pasa por guardarConMeni + Supervisor Editorial
 *   6. Guarda en Firestore como 'borrador' o 'publicado'
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { extractEntities } from '@/utils/meta';
import type { Noticia } from '@/lib/types';
import { guardarConMeni } from '@/lib/editorial/guardar-con-meni';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import type { NoticiaInput } from '@/lib/meni';
import { canCallLLM, recordCall } from '@/lib/supervisor/cost-guard';
import { verifyAdminOrCronToken } from '@/lib/auth';

export const maxDuration = 30;

// ─── Configuración ───
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// ─── Tipos ───
interface ExternalArticle {
  titulo: string;
  resumen: string;
  contenido: string;
  categoria: string;
  imagen?: string;
  autor?: string;
  tags?: string[];
  fuente?: string;
  url?: string;
}

// ─── Gemini: reescritura periodística ───
async function rewriteWithGemini(raw: ExternalArticle): Promise<ExternalArticle> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada');
  }

  // Cost guard: registrar la llamada antes de ejecutarla
  await recordCall(adminDb);

  const { GoogleGenAI } = await import(/* webpackIgnore: true */ '@google/genai');
  const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const prompt = `
Actúa como un redactor jefe de un periódico digital nicaragüense de alto prestigio.
Reescribe el siguiente artículo manteniendo los hechos, pero dándole un tono periodístico profesional, objetivo y directo al estilo BBC/Reuters.

ESTRUCTURA OBLIGATORIA:
- Título SEO: máximo 60 caracteres, atractivo y sin sensacionalismo.
- Lead: 35-50 palabras en máximo 2 oraciones. Debe incluir: qué ocurrió, dónde ocurrió y por qué es relevante.
- Cuerpo: párrafos cortos de 2-3 oraciones. Mínimo 350 palabras.
- Contexto: 50-75 palabras de antecedentes al final.
- No uses emojis. No incluyas opiniones subjetivas.

DATOS DEL ARTÍCULO ORIGINAL:
Título: ${raw.titulo}
Resumen: ${raw.resumen}
Contenido: ${raw.contenido}
Categoría: ${raw.categoria}

Responde ÚNICAMENTE en formato JSON válido con estas claves:
{
  "titulo": "...",
  "resumen": "...",
  "contenido": "<p>...</p><p>...</p>..."
}
`;

  const response = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  const text = response.text?.trim() || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Gemini no retornó JSON válido');
  }

  const parsed = JSON.parse(jsonMatch[0]) as { titulo: string; resumen: string; contenido: string };

  return {
    ...raw,
    titulo: parsed.titulo || raw.titulo,
    resumen: parsed.resumen || raw.resumen,
    contenido: parsed.contenido || raw.contenido,
  };
}

// ─── Generar slug SEO ───
function generateSlugFromTitle(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 60);
}

// ─── Guardar en Firestore ───
async function saveToFirestore(
  article: ExternalArticle,
  estado: 'publicado' | 'borrador'
): Promise<{ id: string; slug: string; meniBlocked?: boolean; meniScore?: number | null }> {
  const slug = generateSlugFromTitle(article.titulo);
  const sanitizedContenido = sanitizeArticleHtml(article.contenido);

  const entities = extractEntities(article.titulo, sanitizedContenido);
  const keywords = [article.categoria, ...entities].slice(0, 12);

  // MENI canónico — toda nota nueva debe pasar por la cadena editorial
  const noticiaInput: NoticiaInput = {
    titulo: article.titulo,
    contenido: sanitizedContenido,
    resumen: article.resumen || '',
    categoria: article.categoria || 'General',
    autor: article.autor || 'Redacción Nicaragua Informate',
    fecha: new Date().toISOString(),
    slug,
  };

  const { ok: meniOk, meni, supervisor, supervisorApproved, updateData: meniUpdateData } = await guardarConMeni(noticiaInput, adminDb);

  if (!meniOk) {
    // Si MENI rechaza, guardar como borrador con diagnóstico pero sin scoreMeni
    const now = new Date().toISOString();
    const noticiaData: Omit<Noticia, 'id'> = {
      slug,
      titulo: article.titulo,
      resumen: article.resumen,
      contenido: sanitizedContenido,
      categoria: article.categoria,
      imagen: article.imagen || '/logo.webp',
      fecha: now,
      fechaActualizacion: now,
      autor: article.autor || 'Redacción Nicaragua Informate',
      estado: 'borrador',
      tags: article.tags || [article.categoria],
      keywords: keywords.join(', '),
      palabras: sanitizedContenido.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter((w) => w.length > 0).length,
      vistas: 0,
      destacada: false,
      diagnosticoMeni: meni.diagnostico,
    };
    await adminDb.collection('noticias').doc(slug).set({ ...noticiaData, id: slug });
    return { id: slug, slug, meniBlocked: true, meniScore: meni.scoreFinal };
  }

  // BLOQUEO del Supervisor Editorial — MENI no es el jefe
  if (!supervisorApproved) {
    const criticalIssues = supervisor.issues.filter(i => i.severity === 'CRITICAL');
    const first = criticalIssues[0];
    throw new Error(
      first ? `[SUPERVISOR][${first.domain}] ${first.problem}` : 'Supervisor Editorial bloqueo la publicacion'
    );
  }

  // Guardar con datos MENI auténticos
  const now = new Date().toISOString();
  const noticiaData: Record<string, unknown> = {
    ...meniUpdateData,
    id: slug,
    slug,
    titulo: article.titulo,
    resumen: article.resumen,
    contenido: sanitizedContenido,
    categoria: article.categoria,
    imagen: article.imagen || '/logo.webp',
    fecha: now,
    fechaActualizacion: now,
    autor: article.autor || 'Redacción Nicaragua Informate',
    estado,
    tags: article.tags || [article.categoria],
    keywords: keywords.join(', '),
    vistas: 0,
    destacada: false,
    fuente: article.fuente || 'cron-fetch',
    fuenteUrl: article.url || null,
  };

  await adminDb.collection('noticias').doc(slug).set(noticiaData);

  return { id: slug, slug, meniScore: meni.scoreFinal };
}

// ─── Route Handler Principal ───
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar token secreto
    const secretHeader = request.headers.get('x-cron-secret');
    const authHeader = request.headers.get('authorization') || '';
    const bearer = authHeader.replace(/^Bearer\s+/i, '');
    if (!verifyAdminOrCronToken(secretHeader) && !verifyAdminOrCronToken(bearer)) {
      return NextResponse.json(
        { error: 'Unauthorized: token inválido o no configurado' },
        { status: 401 }
      );
    }

    // 2. Parsear configuración del body
    const body = await request.json().catch(() => ({}));
    const {
      estado = 'borrador',
      usarGemini = true,
      articles,
    } = body as { estado?: 'publicado' | 'borrador'; usarGemini?: boolean; articles?: ExternalArticle[] };

    if (!['publicado', 'borrador'].includes(estado)) {
      return NextResponse.json({ error: "estado debe ser 'publicado' o 'borrador'" }, { status: 400 });
    }

    // REGLA 18: No más simulateExternalFeed. Se requieren articles reales.
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'No se proporcionaron articles reales. simulateExternalFeed fue eliminado (REGLA 18).',
        hint: 'Envia { "articles": [{ "titulo": "...", "contenido": "...", "categoria": "..." }] } en el body, o conecta un feed RSS real.',
      }, { status: 400 });
    }

    // Validar que cada article tiene los campos mínimos
    for (const a of articles) {
      if (!a.titulo || !a.contenido) {
        return NextResponse.json({
          ok: false,
          error: 'Cada article debe tener al menos titulo y contenido.',
          invalidArticle: a,
        }, { status: 400 });
      }
    }

    // 3. Cost guard: verificar limite antes de procesar con IA
    if (usarGemini && GEMINI_API_KEY) {
      const guard = await canCallLLM(adminDb);
      if (!guard.allowed) {
        return NextResponse.json({
          ok: false,
          error: `Cost guard activo: ${guard.reason}`,
          hint: 'Se puede reintentar mas tarde o desactivar usarGemini para usar el contenido original sin reescritura.',
        }, { status: 429 });
      }
    }

    // 4. Procesar con Gemini si está habilitado
    const processedArticles: ExternalArticle[] = [];
    for (const raw of articles) {
      try {
        const processed = usarGemini && GEMINI_API_KEY ? await rewriteWithGemini(raw) : raw;
        processedArticles.push(processed);
      } catch (geminiError) {
        logger.warn('[cron-fetch] Falló reescritura Gemini, usando original:', geminiError);
        processedArticles.push(raw);
      }
    }

    // 5. Guardar en Firestore
    const created: { id: string; slug: string; titulo: string; estado: string; meniBlocked?: boolean; meniScore?: number | null }[] = [];
    const published: typeof created = [];
    for (const article of processedArticles) {
      const result = await saveToFirestore(article, estado);
      const entry = { ...result, titulo: article.titulo, estado: result.meniBlocked ? 'borrador' : estado };
      created.push(entry);
      if (!result.meniBlocked) published.push(entry);
    }

    // 6. Revalidar caché si se publicó
    const revalidateList = estado === 'publicado' ? published : [];
    if (revalidateList.length > 0) {
      try {
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/');
        revalidatePath('/noticias');
      } catch (revErr) {
        logger.warn('[cron-fetch] No se pudo revalidar caché:', revErr);
      }
      try {
        const { invalidateFirestoreCache } = await import('@/lib/data');
        invalidateFirestoreCache();
      } catch (e) { /* noop */ }

      import('@/lib/google-indexing').then(({ notifyGoogleBulk }) => {
        const urls = revalidateList.map(c => `https://nicaraguainformate.com/noticias/${c.slug}`);
        notifyGoogleBulk(urls).catch(() => {});
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      message: `${created.length} artículo(s) procesado(s)`,
      created,
    });
  } catch (error) {
    logger.error('[cron-fetch] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
