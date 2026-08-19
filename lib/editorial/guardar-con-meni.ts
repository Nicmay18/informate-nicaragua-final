import type { Firestore } from 'firebase-admin/firestore';
import { runMeniAsync } from '@/lib/meni';
import type { NoticiaInput, MeniResult } from '@/lib/meni';
import { stripHtml } from '@/lib/meni/utils/helpers';
import { extractPuntosClave, extractFuente, getAutorFoto } from '@/lib/eeat-helpers';
import { resolvePublicCategory } from './canonical';
import { detectContentProfile } from '@/lib/meni/profile-detector';
import { makeEditorialDecision } from '@/lib/supervisor/editorial-supervisor';
import type { SupervisorDecision } from '@/lib/supervisor/types';

/**
 * Elimina recursivamente valores `undefined` de cualquier estructura
 * antes de escribir en Firestore. Firestore rechaza `undefined` con
 * error: "Cannot use undefined as a Firestore value".
 * Preserva instancias de Date, Timestamp, Buffer y otros tipos no-JSON.
 */
export function sanitizeForFirestore<T = unknown>(value: T): T | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null as unknown as T;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value
      .map(sanitizeForFirestore)
      .filter((v): v is NonNullable<typeof v> => v !== undefined) as unknown as T;
  }
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') return value;
  const obj = value as Record<string, unknown>;
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const sv = sanitizeForFirestore(v);
    if (sv !== undefined) {
      cleaned[k] = sv;
    }
  }
  return cleaned as T;
}

export function mapMeniScoreToNivel(score: number | null, aprobado: boolean): string {
  if (score === null || !Number.isFinite(score)) return 'NO EVALUADA';
  if (!aprobado || score < 85) return 'RECHAZADO';
  return 'FORENSE';
}

export interface GuardarConMeniResult {
  ok: boolean;
  meni: MeniResult;
  /** Decision del Supervisor Editorial — autoridad superior sobre MENI.
   *  NUNCA debe ignorarse. Si supervisorApproved === false, la publicacion
   *  debe bloquearse con 400 SUPERVISOR_BLOCKED. */
  supervisor: SupervisorDecision;
  supervisorApproved: boolean;
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

  const finalContenido = meni.articulo?.contenido || input.contenido || '';
  const palabras = stripHtml(finalContenido).split(/\s+/).filter(Boolean).length;
  const { fuente, fuentesComplementarias } = extractFuente(finalContenido, input.resumen || '');
  const puntosClave = extractPuntosClave(finalContenido);
  const autorFoto = getAutorFoto(input.autor || '');

  // Perfil y categoria publica canonica — una sola fuente de verdad
  const detectedProfile = detectContentProfile(input.titulo, finalContenido, input.resumen || '');
  const canonicalCategoria = resolvePublicCategory({
    titulo: input.titulo,
    contenido: finalContenido,
    resumen: input.resumen,
    categoria: meni.categoria,
    perfil: detectedProfile.profile_detected,
  });

  // Decisión del Agente Supervisor Editorial Permanente (REGLA DE CIERRE)
  // MENI evalúa. El Supervisor decide. El Supervisor puede decir NO aunque MENI diga sí,
  // y puede decir PUBLICAR_CON_CAMBIOS aunque MENI pida revisar, si el valor periodístico
  // justifica una excepción.
  const supervisor = makeEditorialDecision({
    titulo: input.titulo,
    contenido: finalContenido,
    resumen: input.resumen,
    categoria: canonicalCategoria,
    perfil: detectedProfile.profile_detected,
    imagen: input.imagen,
    scoreMeni: meni.scoreFinal ?? undefined,
    aprobadoMeni: meni.aprobado,
    recomendacionMeni: meni.recomendacionEditorial ?? undefined,
    adnNI: meni.editorialDna?.adnNI,
    exclusividad: meni.editorialDna?.exclusividad?.score,
    wow: meni.editorialDna?.wow?.score,
    eeat: meni.eeat?.score,
    aportePropio: meni.valorEditorial?.aportePropio,
    research: input.research,
    story: input.story,
  });

  // ok = MENI approval (meni.aprobado). supervisorApproved remains the Supervisor verdict.
  // Callers should check MENI first and Supervisor second.
  const ok = meni.aprobado;
  const supervisorApproved = supervisor.verdict === 'PUBLICAR';

  // REGLA 14: Una sola decision editorial canonica — el Supervisor.
  // buildEditorialDecision (decision.ts) fue eliminado del flujo porque
  // producia una segunda decision paralela que nadie respetaba.
  // El Supervisor es la unica autoridad. MENI es subordinado.

  const updateData: Record<string, unknown> = {
    // Decisión editorial canónica: el Supervisor es la única fuente de verdad.
    // Toda noticia persistida lleva consigo su decisión, aprobación y estado.
    supervisorDecision: supervisor,
    supervisorApproved,
    editorialState: supervisor.resultingState,
    // Datos de MENI (subordinado al Supervisor)
    scoreMeni: meni.scoreFinal ?? undefined,
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
    fuente: fuente || 'Redaccion Nicaragua Informate',
    fuentesComplementarias,
    autorFoto,
    publicCategory: canonicalCategoria,
    profileInternal: detectedProfile.profile_detected,
    research: input.research,
    story: input.story,
  };

  // Sanitizar para Firestore: nunca enviar `undefined` (ni plano ni anidado).
  // Esto cubre fields como canonicalEditorialDecision.research, supervisorDecision.scoreOverrideReason, etc.
  const cleanUpdateData = sanitizeForFirestore(updateData) as Record<string, unknown>;

  return { ok, meni, supervisor, supervisorApproved, updateData: cleanUpdateData };
}
