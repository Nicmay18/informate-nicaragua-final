/**
 * MÓDULO 1: Pipeline Editorial con IA — Nicaragua Informate
 * Route Handler protegido por token secreto para automatización de contenido.
 *
 * Funcionalidad:
 *   1. Recibe petición con x-cron-secret válido
 *   2. Simula consumo de feed externo (Deportes/Tecnología)
 *   3. Usa Gemini API para traducir y dar tono periodístico profesional
 *   4. Extrae entidades y keywords vía meta.ts
 *   5. Guarda en Firestore como 'borrador' o 'publicado'
 *
 * Requiere:
 *   npm install @google/genai
 *   Variables de entorno:
 *     GEMINI_API_KEY=...
 *     CRON_SECRET_TOKEN=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { extractEntities } from '@/utils/meta';
import type { Noticia } from '@/lib/types';

export const maxDuration = 30;

// ─── Configuración ───
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const CRON_SECRET = process.env.CRON_SECRET_TOKEN || '';

// ─── Tipos ───
interface ExternalArticle {
  titulo: string;
  resumen: string;
  contenido: string;
  categoria: string;
  imagen?: string;
  autor?: string;
  tags?: string[];
}

// ─── Simulación de feed externo (reemplazar por fetch real a RSS/API) ───
function simulateExternalFeed(): ExternalArticle[] {
  return [
    {
      titulo: 'Nueva tecnología de inteligencia artificial revoluciona la agricultura en América Central',
      resumen: 'Investigadores de la Universidad Nacional Agraria han desarrollado un sistema basado en IA para optimizar el riego en cultivos de café y maíz en la región del Pacífico Nicaragüense.',
      contenido: '<p>El proyecto piloto, financiado por la cooperación internacional, ha demostrado una reducción del 35% en el consumo de agua durante la primera cosecha de prueba realizada en Jinotega y Matagalpa.</p><p>Los agricultores locales reportan mejores rendimientos con menor inversión en insumos hídricos.</p>',
      categoria: 'Tecnología',
      imagen: '/images/agricultura-ia-nicaragua.webp',
      autor: 'Redacción Tecnología',
      tags: ['inteligencia artificial', 'agricultura', 'innovación'],
    },
  ];
}

// ─── Gemini: reescritura periodística ───
async function rewriteWithGemini(raw: ExternalArticle): Promise<ExternalArticle> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada');
  }

  // webpackIgnore evita que Next.js bundlee este módulo en build time
  // Se resuelve en runtime del servidor cuando la dependencia esté instalada
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

  // Extraer JSON de la respuesta (Gemini a veces envuelve en markdown)
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
): Promise<{ id: string; slug: string }> {
  const slug = generateSlugFromTitle(article.titulo);

  // Extraer entidades para keywords
  const entities = extractEntities(article.titulo, article.contenido);
  const keywords = [article.categoria, ...entities].slice(0, 12);

  // Calcular palabras
  const palabras = article.contenido
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  const now = new Date().toISOString();

  const noticiaData: Omit<Noticia, 'id'> = {
    slug,
    titulo: article.titulo,
    resumen: article.resumen,
    contenido: article.contenido,
    categoria: article.categoria,
    imagen: article.imagen || '/logo.webp',
    fecha: now,
    fechaActualizacion: now,
    autor: article.autor || 'Redacción Nicaragua Informate',
    estado,
    tags: article.tags || [article.categoria],
    keywords: keywords.join(', '),
    palabras,
    vistas: 0,
    destacada: false,
  };

  const docRef = await adminDb.collection('noticias').add(noticiaData);

  return { id: docRef.id, slug };
}

// ─── Route Handler Principal ───
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar token secreto
    const secretHeader = request.headers.get('x-cron-secret');
    if (!CRON_SECRET || secretHeader !== CRON_SECRET) {
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
    } = body as { estado?: 'publicado' | 'borrador'; usarGemini?: boolean };

    if (!['publicado', 'borrador'].includes(estado)) {
      return NextResponse.json({ error: "estado debe ser 'publicado' o 'borrador'" }, { status: 400 });
    }

    // 3. Consumir feed externo (simulado)
    const rawArticles = simulateExternalFeed();

    if (rawArticles.length === 0) {
      return NextResponse.json({ ok: true, message: 'No hay artículos nuevos del feed', created: [] });
    }

    // 4. Procesar con Gemini si está habilitado
    const processedArticles: ExternalArticle[] = [];
    for (const raw of rawArticles) {
      try {
        const processed = usarGemini && GEMINI_API_KEY ? await rewriteWithGemini(raw) : raw;
        processedArticles.push(processed);
      } catch (geminiError) {
        logger.warn('[cron-fetch] Falló reescritura Gemini, usando original:', geminiError);
        processedArticles.push(raw);
      }
    }

    // 5. Guardar en Firestore
    const created: { id: string; slug: string; titulo: string; estado: string }[] = [];
    for (const article of processedArticles) {
      const result = await saveToFirestore(article, estado);
      created.push({ ...result, titulo: article.titulo, estado });
    }

    // 6. Revalidar caché si se publicó
    if (estado === 'publicado' && created.length > 0) {
      try {
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/');
        revalidatePath('/noticias');
      } catch (revErr) {
        logger.warn('[cron-fetch] No se pudo revalidar caché:', revErr);
      }
      // Invalidar cache en memoria de Firestore para que lecturas futuras vean la nueva noticia
      try {
        const { invalidateFirestoreCache } = await import('@/lib/data');
        invalidateFirestoreCache();
      } catch (e) { /* noop */ }

      // Notificar a Google Indexing API para cada noticia publicada (no bloquea)
      import('@/lib/google-indexing').then(({ notifyGoogleBulk }) => {
        const urls = created.map(c => `https://nicaraguainformate.com/noticias/${c.slug}`);
        notifyGoogleBulk(urls).catch(() => {});
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      message: `${created.length} artículo(s) procesado(s)`,
      created,
    });
  } catch (error) {
    logger.error('[cron-fetch] Error crítico:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
