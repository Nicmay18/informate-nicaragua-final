import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { guardarConMeni } from '@/lib/editorial/guardar-con-meni';
import { verifyAdminToken } from '@/lib/auth';
import type { NoticiaInput } from '@/lib/meni';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const AUTO_FIX_IDS = [
  'CMo0EIdKF9E5CYTJj8H9',
  'FLbXd6XRrTl5TCdTkNYT',
  'lzsto5T2q85IgrVkqlA2',
];

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function cleanHtmlArtifacts(html: string): string {
  let cleaned = html;
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/<p>\s*<p>/gi, '<p>');
  cleaned = cleaned.replace(/<\/p>\s*<\/p>/gi, '</p>');
  cleaned = cleaned.replace(/<div>\s*<\/div>/gi, '');
  cleaned = cleaned.replace(/<span>\s*<\/span>/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

function fixDoubleColons(titulo: string): string {
  return titulo.replace(/:\s*[^:]+:\s*/, ': ');
}

export async function GET(request: NextRequest) {
  if (!verifyAdminToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getAdminDb();
  const results: any[] = [];

  for (const id of AUTO_FIX_IDS) {
    const docRef = db.collection('noticias').doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      results.push({ id, error: 'NOT_FOUND' });
      continue;
    }

    const data = snap.data()!;
    const contenidoOriginal = data.contenido || '';
    const tituloOriginal = data.titulo || '';

    const fixes: string[] = [];
    let tituloNuevo = tituloOriginal;
    let contenidoNuevo = contenidoOriginal;

    if (id === 'CMo0EIdKF9E5CYTJj8H9') {
      // Fix 1: titulo_doble_dospuntos
      tituloNuevo = fixDoubleColons(tituloOriginal);
      if (tituloNuevo !== tituloOriginal) {
        fixes.push(`titulo: "${tituloOriginal}" → "${tituloNuevo}"`);
      }
      // Fix 2: entidades_html (clean HTML entities from content)
      contenidoNuevo = contenidoOriginal
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      if (contenidoNuevo !== contenidoOriginal) {
        fixes.push('entidades_html: limpiadas');
      }
    }

    if (id === 'FLbXd6XRrTl5TCdTkNYT' || id === 'lzsto5T2q85IgrVkqlA2') {
      // Fix: p_vacios_anidados, wrappers_tecnicos
      contenidoNuevo = cleanHtmlArtifacts(contenidoOriginal);
      if (contenidoNuevo !== contenidoOriginal) {
        fixes.push('p_vacios_anidados: eliminados');
        fixes.push('wrappers_tecnicos: limpiados');
      }
    }

    // Sanitize HTML
    contenidoNuevo = sanitizeArticleHtml(contenidoNuevo);

    const palBefore = countWords(stripHtml(contenidoOriginal));
    const palAfter = countWords(stripHtml(contenidoNuevo));

    // Run guardarConMeni with fixed content
    const noticiaInput: NoticiaInput = {
      id,
      titulo: tituloNuevo,
      resumen: data.resumen || '',
      contenido: contenidoNuevo,
      categoria: data.categoria || 'Nacionales',
      autor: data.autor || 'Redacción Nicaragua Informate',
      keywords: data.keywords || '',
      imagen: data.imagen || '',
      fecha: data.fecha || new Date().toISOString(),
      slug: data.slug || '',
      palabrasClave: data.tags || [],
    };

    let meniResult: any = null;
    let saved = false;
    let saveError: string | null = null;

    try {
      const { ok: meniOk, meni, updateData } = await guardarConMeni(noticiaInput, db);

      meniResult = {
        ok: meniOk,
        scoreFinal: meni.scoreFinal,
        aprobado: meni.aprobado,
        calificacion: meni.calificacion,
        diagnostico: meni.diagnostico,
        editorialTier: meni.editorialTier,
        blockingIssues: meni.blockingIssues?.map((b: any) => b.mensaje || b.area || String(b)) || [],
        warnings: meni.warnings?.map((w: any) => w.mensaje || w.area || String(w)) || [],
      };

      if (meniOk) {
        // Write to Firestore with provenance
        const updatePayload: Record<string, unknown> = {
          ...updateData,
          titulo: tituloNuevo,
          contenido: contenidoNuevo,
          cambiosRealizados: [
            ...(data.cambiosRealizados || []),
            {
              fase: '15.1',
              tipo: 'auto_fix',
              fixes,
              scoreAnterior: data.scoreMeni ?? null,
              scoreNuevo: meni.scoreFinal,
              aprobadoAnterior: data.aprobadoMeni ?? null,
              aprobadoNuevo: meni.aprobado,
              fecha: new Date().toISOString(),
              motivo: 'AUTO_FIX: corrección técnica objetiva identificada en FASE 15 DRY RUN',
            },
          ],
        };

        await docRef.update(updatePayload);
        saved = true;
      } else {
        // Even if not approved, save the fixed content with provenance
        const updatePayload: Record<string, unknown> = {
          titulo: tituloNuevo,
          contenido: contenidoNuevo,
          scoreMeni: meni.scoreFinal,
          aprobadoMeni: meni.aprobado,
          calificacionMeni: meni.calificacion,
          diagnosticoMeni: meni.diagnostico,
          editorialTier: meni.editorialTier,
          nivel: meni.aprobado ? 'FORENSE' : 'RECHAZADO',
          nivelScore: meni.scoreFinal,
          nivelFecha: new Date().toISOString(),
          cambiosRealizados: [
            ...(data.cambiosRealizados || []),
            {
              fase: '15.1',
              tipo: 'auto_fix',
              fixes,
              scoreAnterior: data.scoreMeni ?? null,
              scoreNuevo: meni.scoreFinal,
              aprobadoAnterior: data.aprobadoMeni ?? null,
              aprobadoNuevo: meni.aprobado,
              fecha: new Date().toISOString(),
              motivo: 'AUTO_FIX: corrección técnica objetiva, re-evaluado por MENI (no aprobado)',
            },
          ],
        };

        await docRef.update(updatePayload);
        saved = true;
      }
    } catch (err) {
      saveError = err instanceof Error ? err.message : String(err);
    }

    results.push({
      id,
      tituloBefore: tituloOriginal,
      tituloAfter: tituloNuevo,
      tituloChanged: tituloNuevo !== tituloOriginal,
      palabrasBefore: palBefore,
      palabrasAfter: palAfter,
      palabrasChanged: palAfter - palBefore,
      fixes,
      scoreBefore: data.scoreMeni ?? null,
      scoreAfter: meniResult?.scoreFinal ?? null,
      aprobadoBefore: data.aprobadoMeni ?? null,
      aprobadoAfter: meniResult?.aprobado ?? null,
      calificacionAfter: meniResult?.calificacion ?? null,
      diagnosticoAfter: meniResult?.diagnostico ?? null,
      blockingIssues: meniResult?.blockingIssues ?? [],
      saved,
      saveError,
    });
  }

  const summary = {
    total: results.length,
    executed: results.filter(r => r.saved).length,
    failed: results.filter(r => !r.saved).length,
    approved: results.filter(r => r.aprobadoAfter === true).length,
    rejected: results.filter(r => r.aprobadoAfter === false).length,
    scoreImproved: results.filter(r => r.scoreAfter !== null && r.scoreBefore !== null && r.scoreAfter > r.scoreBefore).length,
    scoreSame: results.filter(r => r.scoreAfter !== null && r.scoreBefore !== null && r.scoreAfter === r.scoreBefore).length,
    scoreDecreased: results.filter(r => r.scoreAfter !== null && r.scoreBefore !== null && r.scoreAfter < r.scoreBefore).length,
  };

  return NextResponse.json({ summary, results });
}
