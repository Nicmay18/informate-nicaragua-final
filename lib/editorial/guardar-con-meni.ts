import type { Firestore } from 'firebase-admin/firestore';
import { runMeniAsync } from '@/lib/meni';
import type { NoticiaInput, MeniResult } from '@/lib/meni';
import { stripHtml } from '@/lib/meni/utils/helpers';
import { extractPuntosClave, extractFuente, getAutorFoto } from '@/lib/eeat-helpers';
import { resolvePublicCategory, PUBLIC_CATEGORY_TO_PROFILE } from './canonical';
import { makeEditorialDecision } from '@/lib/supervisor/editorial-supervisor';
import type { SupervisorDecision } from '@/lib/supervisor/types';
import { stripAICitationMarkers } from '@/lib/sanitize';
import { detectFactualitySignals } from './factuality-signals';
import type { FactualitySignal } from './factuality-signals';

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
  /** Versión editorial canónica — la ÚNICA que puede persistirse. */
  canonical: { titulo: string; resumen: string; contenido: string };
  factualitySignals: FactualitySignal[];
}

export async function guardarConMeni(
  input: NoticiaInput,
  db: Firestore,
  options?: { skipEditorBrain?: boolean }
): Promise<GuardarConMeniResult> {
  // AUTO_REMOVE (content-integrity): los marcadores de cita IA son residuo
  // técnico inequívoco — se eliminan del input ANTES de evaluar, para que la
  // versión evaluada y la persistida sean la misma. Queda constancia en
  // `aiArtifactsRemoved` (provenance → signal de factualidad).
  const cleanedTitulo = stripAICitationMarkers(input.titulo);
  const cleanedResumen = stripAICitationMarkers(input.resumen);
  const cleanedContenido = stripAICitationMarkers(input.contenido);
  const aiArtifactsRemoved =
    cleanedContenido !== (input.contenido || '') ||
    cleanedTitulo !== (input.titulo || '') ||
    cleanedResumen !== (input.resumen || '');
  const cleanInput: NoticiaInput = {
    ...input,
    titulo: cleanedTitulo,
    resumen: cleanedResumen,
    contenido: cleanedContenido,
  };

  const meni = await runMeniAsync(cleanInput, {
    db,
    skipEditorBrain: options?.skipEditorBrain ?? true,
  });

  // AUTO_REMOVE también sobre la salida de MENI: si el pipeline devolviera un
  // artefacto en textoCorregido, la versión canónica nunca lo contiene.
  const finalContenido = stripAICitationMarkers(meni.articulo?.contenido || cleanInput.contenido || '');
  const finalResumen = stripAICitationMarkers(meni.articulo?.resumen || cleanInput.resumen || '');

  const palabras = stripHtml(finalContenido).split(/\s+/).filter(Boolean).length;
  const { fuente, fuentesComplementarias } = extractFuente(finalContenido, input.resumen || '');

  // Barrera factual mínima: el detector produce señales; el Supervisor decide.
  // Las fuentes extraídas del propio texto cuentan como evidencia.
  const factualitySignals = detectFactualitySignals({
    titulo: cleanInput.titulo,
    resumen: finalResumen,
    contenido: finalContenido,
    fuentesComplementarias,
    research: cleanInput.research,
    story: cleanInput.story,
    aiArtifactsRemoved,
  });
  const puntosClave = extractPuntosClave(finalContenido);
  const autorFoto = getAutorFoto(input.autor || '');

  // Perfil y categoria publica canonica — una sola fuente de verdad
  const canonicalCategoria = resolvePublicCategory({
    titulo: input.titulo,
    contenido: finalContenido,
    resumen: input.resumen,
    categoria: input.categoria,
    perfil: meni.profile_used,
  });
  const canonicalPerfil = PUBLIC_CATEGORY_TO_PROFILE[canonicalCategoria] ?? meni.profile_used;

  // Decisión del Agente Supervisor Editorial Permanente (REGLA DE CIERRE)
  // MENI evalúa. El Supervisor decide. El Supervisor puede decir NO aunque MENI diga sí,
  // y puede decir PUBLICAR_CON_CAMBIOS aunque MENI pida revisar, si el valor periodístico
  // justifica una excepción.
  const supervisor = makeEditorialDecision({
    titulo: input.titulo,
    contenido: finalContenido,
    resumen: input.resumen,
    categoria: canonicalCategoria,
    perfil: canonicalPerfil,
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
    factualitySignals,
  });

  // ok = MENI approval (meni.aprobado). supervisorApproved remains the Supervisor verdict.
  // Callers should check MENI first and Supervisor second.
  // PUBLICAR_CON_CAMBIOS también es aprobado: el Supervisor permite publicar
  // mientras se muestren las recomendaciones de ajuste menor.
  const ok = meni.aprobado;
  const supervisorApproved = ['PUBLICAR', 'PUBLICAR_CON_CAMBIOS'].includes(supervisor.verdict);

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
    contentHash: meni.articleHash,
    meniVersion: meni.meniVersion,
    evaluationTimestamp: meni.evaluationTimestamp,
    editorialTier: meni.editorialTier,
    editorialReason: meni.editorialReason,
    perfil: canonicalPerfil,
    profile_confidence: meni.profile_confidence,
    categoria: canonicalCategoria,
    palabras,
    puntosClave,
    fuente: fuente || 'Redaccion Nicaragua Informate',
    fuentesComplementarias,
    autorFoto,
    publicCategory: canonicalCategoria,
    profileInternal: canonicalPerfil,
    research: input.research,
    story: input.story,
    // VERSIÓN EDITORIAL CANÓNICA — la única que puede llegar a publicación.
    // Las rutas no deben persistir el contenido crudo por encima de estos campos.
    contenido: finalContenido,
    resumen: finalResumen,
    // Señales de riesgo factual evaluadas (trazabilidad del gate).
    factuality: {
      signals: factualitySignals,
      evaluatedAt: new Date().toISOString(),
    },
    ...(aiArtifactsRemoved ? { aiArtifactsRemoved: true } : {}),
  };

  // Sanitizar para Firestore: nunca enviar `undefined` (ni plano ni anidado).
  // Esto cubre fields como canonicalEditorialDecision.research, supervisorDecision.scoreOverrideReason, etc.
  const cleanUpdateData = sanitizeForFirestore(updateData) as Record<string, unknown>;

  return {
    ok,
    meni,
    supervisor,
    supervisorApproved,
    updateData: cleanUpdateData,
    canonical: { titulo: cleanedTitulo, resumen: finalResumen, contenido: finalContenido },
    factualitySignals,
  };
}
