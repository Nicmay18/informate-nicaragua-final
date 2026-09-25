/**
 * Editorial Mutation Policy — única puerta para mutaciones post-decisión.
 *
 * INVARIANTE EDITORIAL (EDITORIAL_MUTATION_AUDIT.md §4):
 *   Una noticia está APROBADA si y solo si:
 *     aprobadoMeni === true AND supervisorApproved === true
 *     AND contentHash === computeInputHash(campos actuales)
 *
 *   - Mutación TÉCNICA (campos allowlist): permitida sin reevaluación.
 *   - Mutación SUSTANTIVA: debe pasar por guardarConMeni (MENI + Supervisor).
 *     Si la autoridad bloquea, la mutación se RECHAZA (no se persiste) o el
 *     artículo se marca REVIEW_REQUIRED — nunca queda "publicado + aprobado"
 *     con contenido distinto al evaluado.
 *   - REQUIRES_REVIEW (campo no clasificado): tratado como sustantivo.
 *   - Ninguna vía técnica puede publicar (publicado/estado) sin aprobación vigente.
 *
 * Provenance mínima: `mutationLog` (array acotado a 20 entradas en el doc).
 */
import type { Firestore, DocumentReference } from 'firebase-admin/firestore';
import { computeInputHash } from '@/lib/meni/hash';
import { guardarConMeni } from '@/lib/editorial/guardar-con-meni';
import type { NoticiaInput } from '@/lib/meni';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { findBlockingDefects } from '@/lib/editorial/content-integrity';

/** Campos cubiertos por computeInputHash + campos que renderizan contenido editorial. */
export const SUBSTANTIVE_FIELDS = new Set([
  'titulo', 'subtitulo', 'resumen', 'excerpt', 'contenido',
  'categoria', 'autor', 'related_links', 'blockquote',
]);

/** Campos operativos/de presentación que NO alteran afirmaciones editoriales. */
export const TECHNICAL_FIELDS = new Set([
  'distribuida', 'fechaDistribucion', 'noindex', 'vistas', 'premium', 'destacada',
  'imagen', 'confianza', 'fechaActualizacion', 'dateModified',
  'ultimaRevisionEditorial', 'ultimaActualizacionAutomatica',
  'fecha', 'publishedAt', 'scoreCalidad',
  '_mejorada', '_fechaMejora',
  'requiresReevaluation', 'mutationLog', 'editorialReviewReason',
  // Lifecycle (controlado por policy: publicar requiere aprobación vigente)
  'publicado', 'estado', 'archived', 'editorialState',
  'deletedAt', 'deletedBy', 'deleteReason', 'deleteSnapshot',
  // Campos escritos por la propia decisión editorial
  'aprobadoMeni', 'scoreMeni', 'calificacionMeni', 'nivel', 'nivelScore',
  'nivelFecha', 'diagnosticoMeni', 'recomendacionesMeni', 'supervisorDecision',
  'supervisorApproved', 'contentHash', 'meniVersion', 'evaluationTimestamp',
  'editorialTier', 'editorialReason', 'perfil', 'profile_confidence',
  'palabras', 'puntosClave', 'fuente', 'fuentesComplementarias', 'autorFoto',
  'publicCategory', 'profileInternal', 'research', 'story', 'id', 'slug',
]);

export type MutationClass = 'SUBSTANTIVE' | 'TECHNICAL' | 'REQUIRES_REVIEW';
export type MutationResult = 'APPLIED' | 'REJECTED' | 'REVIEW_REQUIRED';

export interface MutationLogEntry {
  at: string;
  actor: string;
  reason: string;
  fields: string[];
  classification: MutationClass;
  result: MutationResult;
  hashBefore: string | null;
  hashAfter: string | null;
  reeval?: {
    required: boolean;
    meniScore?: number | null;
    supervisorVerdict?: string;
    decisionId?: string;
  };
}

export function classifyFields(fields: string[]): MutationClass {
  let hasUnknown = false;
  for (const f of fields) {
    if (SUBSTANTIVE_FIELDS.has(f)) return 'SUBSTANTIVE';
    if (!TECHNICAL_FIELDS.has(f)) hasUnknown = true;
  }
  return hasUnknown ? 'REQUIRES_REVIEW' : 'TECHNICAL';
}

/** True si la aprobación almacenada corresponde al contenido actual del doc. */
export function isApprovalCurrent(doc: Record<string, unknown>): boolean {
  if (doc.aprobadoMeni !== true || doc.supervisorApproved !== true) return false;
  if (typeof doc.contentHash !== 'string' || doc.contentHash.length === 0) return false;
  return doc.contentHash === computeInputHash({
    titulo: String(doc.titulo || ''),
    resumen: String(doc.resumen || ''),
    contenido: String(doc.contenido || ''),
    categoria: String(doc.categoria || ''),
    autor: String(doc.autor || ''),
  });
}

function hashOf(data: Record<string, unknown>): string {
  return computeInputHash({
    titulo: String(data.titulo || ''),
    resumen: String(data.resumen || ''),
    contenido: String(data.contenido || ''),
    categoria: String(data.categoria || ''),
    autor: String(data.autor || ''),
  });
}

function appendLog(existing: unknown, entry: MutationLogEntry): MutationLogEntry[] {
  const prev = Array.isArray(existing) ? (existing as MutationLogEntry[]) : [];
  return [...prev, entry].slice(-20);
}

export interface MutationActor {
  actor: string;
  reason: string;
}

/**
 * Mutación técnica: solo campos TECHNICAL_FIELDS.
 * Lanza si algún campo es sustantivo o desconocido.
 * publicado/estado solo pueden activar publicación si la aprobación está vigente.
 */
export async function applyTechnicalMutation(
  db: Firestore,
  articleId: string,
  fields: Record<string, unknown>,
  meta: MutationActor,
): Promise<{ applied: boolean; rejected?: string }> {
  const keys = Object.keys(fields);
  const classification = classifyFields(keys);
  if (classification !== 'TECHNICAL') {
    throw new Error(
      `[mutation-policy] applyTechnicalMutation rechazó campos no técnicos: ${keys.join(', ')} (actor=${meta.actor})`,
    );
  }

  const ref = db.collection('noticias').doc(articleId);
  const snap = await ref.get();
  if (!snap.exists) return { applied: false, rejected: 'NOT_FOUND' };
  const before = snap.data()!;

  // Monotonía: ninguna vía técnica puede publicar sin aprobación vigente.
  const activatesPublication =
    fields.publicado === true || fields.estado === 'publicado';
  if (activatesPublication && !isApprovalCurrent(before)) {
    return { applied: false, rejected: 'PUBLISH_REQUIRES_CURRENT_APPROVAL' };
  }

  const entry: MutationLogEntry = {
    at: new Date().toISOString(),
    actor: meta.actor,
    reason: meta.reason,
    fields: keys,
    classification: 'TECHNICAL',
    result: 'APPLIED',
    hashBefore: typeof before.contentHash === 'string' ? before.contentHash : null,
    hashAfter: typeof before.contentHash === 'string' ? before.contentHash : null,
    reeval: { required: false },
  };

  await ref.update({ ...fields, mutationLog: appendLog(before.mutationLog, entry) });
  return { applied: true };
}

export interface SubstantiveMutationInput {
  titulo?: string;
  resumen?: string;
  contenido?: string;
  categoria?: string;
  autor?: string;
}

export interface SubstantiveMutationResult {
  applied: boolean;
  blocked?: boolean;
  reviewRequired?: boolean;
  error?: string;
  code?: string;
  meniScore?: number | null;
  supervisorVerdict?: string;
}

/**
 * Mutación sustantiva: merge de campos editoriales sobre el doc existente
 * y reevaluación completa (content-integrity → MENI → Supervisor).
 * La mutación solo persiste si la autoridad aprueba el NUEVO contenido.
 * opts.onBlocked: 'reject' (default, no persiste) | 'review' (persiste y marca REVIEW_REQUIRED).
 */
export async function applySubstantiveMutation(
  db: Firestore,
  articleId: string,
  mutation: SubstantiveMutationInput,
  meta: MutationActor & { onBlocked?: 'reject' | 'review' },
): Promise<SubstantiveMutationResult> {
  const ref: DocumentReference = db.collection('noticias').doc(articleId);
  const snap = await ref.get();
  if (!snap.exists) return { applied: false, error: 'NOT_FOUND' };
  const before = snap.data()!;
  const hashBefore = typeof before.contentHash === 'string' ? before.contentHash : null;

  const merged: NoticiaInput = {
    id: articleId,
    titulo: mutation.titulo !== undefined ? mutation.titulo : String(before.titulo || ''),
    resumen: mutation.resumen !== undefined ? mutation.resumen : String(before.resumen || ''),
    contenido:
      mutation.contenido !== undefined
        ? sanitizeArticleHtml(mutation.contenido)
        : String(before.contenido || ''),
    categoria: mutation.categoria !== undefined ? mutation.categoria : String(before.categoria || 'General'),
    autor: mutation.autor !== undefined ? mutation.autor : String(before.autor || ''),
    fecha: before.fecha?.toDate ? before.fecha.toDate().toISOString() : new Date().toISOString(),
    slug: String(before.slug || ''),
    imagen: before.imagen ? String(before.imagen) : undefined,
  };

  const changed = (Object.keys(mutation) as (keyof SubstantiveMutationInput)[]).filter(
    (k) => mutation[k] !== undefined && String(mutation[k] ?? '') !== String(before[k] ?? ''),
  );
  if (changed.length === 0) return { applied: false, error: 'NO_CHANGES' };

  // Content-integrity: defectos mecánicos/fabricados conocidos (solo BLOCK).
  const defects = findBlockingDefects(
    [merged.titulo, merged.resumen, merged.contenido].filter(Boolean).join('\n'),
  );
  if (defects.length > 0) {
    await writeLogEntry(ref, before, meta, changed, 'REJECTED', hashBefore, hashBefore, {
      required: true,
    });
    return {
      applied: false,
      blocked: true,
      code: 'CONTENT_INTEGRITY_VIOLATION',
      error: defects.map((d) => d.code).join(', '),
    };
  }

  const { ok: meniOk, meni, supervisor, supervisorApproved, updateData, canonical } =
    await guardarConMeni(merged, db);

  const reevalInfo = {
    required: true,
    meniScore: meni.scoreFinal ?? null,
    supervisorVerdict: supervisor.verdict,
    decisionId: supervisor.decisionId,
  };

  if (meniOk && supervisorApproved) {
    await ref.update({
      ...updateData,
      // Versión canónica evaluada (textoCorregido) — nunca el merged crudo.
      titulo: canonical?.titulo || merged.titulo,
      contenido: canonical?.contenido || merged.contenido,
      resumen: canonical?.resumen || merged.resumen,
      requiresReevaluation: false,
      fechaActualizacion: new Date(),
      mutationLog: appendLog(before.mutationLog, {
        at: new Date().toISOString(),
        actor: meta.actor,
        reason: meta.reason,
        fields: changed,
        classification: 'SUBSTANTIVE',
        result: 'APPLIED',
        hashBefore,
        hashAfter: meni.articleHash,
        reeval: reevalInfo,
      }),
    });
    return {
      applied: true,
      meniScore: meni.scoreFinal ?? null,
      supervisorVerdict: supervisor.verdict,
    };
  }

  // Autoridad bloqueó la mutación.
  if (meta.onBlocked === 'review') {
    // Persiste el cambio pero marca la nota para revisión controlada:
    // la aprobación anterior NO es válida para el nuevo contenido.
    await ref.update({
      ...mutation,
      aprobadoMeni: false,
      scoreMeni: null,
      supervisorApproved: false,
      editorialState: 'REVIEW_REQUIRED',
      requiresReevaluation: true,
      editorialReviewReason: `${meta.actor}: reevaluación bloqueada (${supervisor.verdict})`,
      fechaActualizacion: new Date(),
      mutationLog: appendLog(before.mutationLog, {
        at: new Date().toISOString(),
        actor: meta.actor,
        reason: meta.reason,
        fields: changed,
        classification: 'SUBSTANTIVE',
        result: 'REVIEW_REQUIRED',
        hashBefore,
        hashAfter: hashOf({ ...before, ...mutation }),
        reeval: reevalInfo,
      }),
    });
    return {
      applied: true,
      reviewRequired: true,
      meniScore: meni.scoreFinal ?? null,
      supervisorVerdict: supervisor.verdict,
    };
  }

  await writeLogEntry(ref, before, meta, changed, 'REJECTED', hashBefore, hashBefore, reevalInfo);
  return {
    applied: false,
    blocked: true,
    code: supervisorApproved ? 'MENI_NOT_APPROVED' : 'SUPERVISOR_BLOCKED',
    error: supervisor.reason || `Veredicto ${supervisor.verdict}`,
    meniScore: meni.scoreFinal ?? null,
    supervisorVerdict: supervisor.verdict,
  };
}

/**
 * Mutación sustantiva diferida: aplica el cambio pero marca la nota para
 * revisión controlada (aprobadoMeni:false + REVIEW_REQUIRED + provenance).
 * Para correcciones masivas donde la reevaluación inline no es viable
 * (p.ej. autofix del Supervisor en cron). La aprobación anterior queda
 * explícitamente invalidada para el nuevo contenido — nunca "aparentemente
 * aprobada".
 */
export async function flagSubstantiveMutation(
  db: Firestore,
  articleId: string,
  fields: SubstantiveMutationInput,
  meta: MutationActor,
): Promise<{ applied: boolean }> {
  const ref = db.collection('noticias').doc(articleId);
  const snap = await ref.get();
  if (!snap.exists) return { applied: false };
  const before = snap.data()!;
  const hashBefore = typeof before.contentHash === 'string' ? before.contentHash : null;

  const changed = (Object.keys(fields) as (keyof SubstantiveMutationInput)[]).filter(
    (k) => fields[k] !== undefined && String(fields[k] ?? '') !== String(before[k] ?? ''),
  );
  if (changed.length === 0) return { applied: false };

  const sanitized: Record<string, unknown> = { ...fields };
  if (typeof sanitized.contenido === 'string') {
    sanitized.contenido = sanitizeArticleHtml(sanitized.contenido);
  }

  await ref.update({
    ...sanitized,
    aprobadoMeni: false,
    scoreMeni: null,
    supervisorApproved: false,
    editorialState: 'REVIEW_REQUIRED',
    requiresReevaluation: true,
    editorialReviewReason: `${meta.actor}: ${meta.reason}`,
    fechaActualizacion: new Date(),
    mutationLog: appendLog(before.mutationLog, {
      at: new Date().toISOString(),
      actor: meta.actor,
      reason: meta.reason,
      fields: changed,
      classification: 'SUBSTANTIVE',
      result: 'REVIEW_REQUIRED',
      hashBefore,
      hashAfter: hashOf({ ...before, ...sanitized }),
      reeval: { required: true },
    }),
  });
  return { applied: true };
}

async function writeLogEntry(
  ref: DocumentReference,
  before: Record<string, unknown>,
  meta: MutationActor,
  fields: string[],
  result: MutationResult,
  hashBefore: string | null,
  hashAfter: string | null,
  reeval?: MutationLogEntry['reeval'],
): Promise<void> {
  try {
    await ref.update({
      mutationLog: appendLog(before.mutationLog, {
        at: new Date().toISOString(),
        actor: meta.actor,
        reason: meta.reason,
        fields,
        classification: 'SUBSTANTIVE',
        result,
        hashBefore,
        hashAfter,
        reeval,
      }),
    });
  } catch {
    // Provenance nunca debe tumbar la operación principal.
  }
}
