import type { Firestore } from 'firebase-admin/firestore';
import { runMeniAsync } from '@/lib/meni';
import type { NoticiaInput, MeniResult } from '@/lib/meni';
import { stripHtml } from '@/lib/meni/utils/helpers';
import { extractPuntosClave, extractFuente, getAutorFoto } from '@/lib/eeat-helpers';
import { resolvePublicCategory } from './canonical';
import { detectContentProfile } from '@/lib/meni/profile-detector';

export function mapMeniScoreToNivel(score: number | null, aprobado: boolean): string {
  if (score === null || !Number.isFinite(score)) return 'NO EVALUADA';
  if (!aprobado || score < 85) return 'RECHAZADO';
  return 'FORENSE';
}

export interface GuardarConMeniResult {
  ok: boolean;
  meni: MeniResult;
  updateData: Record<string, unknown>;
}

export async function guardarConMeni(
  input: NoticiaInput,
  db: Firestore,
  options?: { skipEditorBrain?: boolean }
): Promise<GuardarConMeniResult> {
  const meni = await runMeniAsync(input, {
    db,
    skipEditorBrain: options?.skipEditorBrain ?? true,
  });

  if (!meni.aprobado) {
    return { ok: false, meni, updateData: {} };
  }

  const finalContenido = meni.articulo?.contenido || input.contenido || '';
  const palabras = stripHtml(finalContenido).split(/\s+/).filter(Boolean).length;
  const { fuente, fuentesComplementarias } = extractFuente(finalContenido, input.resumen || '');
  const puntosClave = extractPuntosClave(finalContenido, 4);
  const autorFoto = getAutorFoto(input.autor || '');

  // Perfil y categoría pública canónica — una sola fuente de verdad
  const detectedProfile = detectContentProfile(input.titulo, finalContenido, input.resumen || '');
  const canonicalCategoria = resolvePublicCategory({
    titulo: input.titulo,
    contenido: finalContenido,
    resumen: input.resumen,
    categoria: meni.categoria,
    perfil: detectedProfile.profile_detected,
  });

  const updateData: Record<string, unknown> = {
    scoreMeni: meni.scoreFinal,
    aprobadoMeni: meni.aprobado,
    calificacionMeni: meni.calificacion,
    nivel: mapMeniScoreToNivel(meni.scoreFinal, meni.aprobado),
    recomendacionesMeni: meni.recomendaciones.map((r: any) => `${r.area}: ${r.mensaje}`),
    nivelScore: meni.scoreFinal,
    nivelFecha: new Date().toISOString(),
    diagnosticoMeni: meni.diagnostico,
    editorialTier: meni.editorialTier,
    editorialReason: meni.editorialReason,
    perfil: detectedProfile.profile_detected,
    profile_confidence: detectedProfile.profile_confidence,
    categoria: canonicalCategoria,
    palabras,
    puntosClave,
    fuente: fuente || 'Redacción Nicaragua Informate',
    fuentesComplementarias,
    autorFoto,
  };

  return { ok: true, meni, updateData };
}
