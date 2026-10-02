/**
 * Registro de Falsos Positivos — MENI Learning 4.0 (FASE 7)
 * =========================================================
 * Memoria explícita de errores de MENI: defectos que el propio pipeline
 * fabricó (SELF_INDUCED_DEFECT) o que un operador confirmó como falso
 * positivo (FALSE_POSITIVE).
 *
 * Reglas de seguridad:
 *   - El Quality Gate NUNCA se debilita por este registro: un defecto
 *     auto-inducido sigue bloqueando (el texto corregido realmente está
 *     corrupto). El registro sirve para diagnosticar y corregir el
 *     proceso previo (autofix), no para ignorar el gate.
 *   - Toda entrada es trazable: código del defecto, contexto, origen,
 *     ocurrencias y estado.
 */
import type { Firestore } from 'firebase-admin/firestore';
import { createHash } from 'crypto';
import { findGenerationDefects } from '@/lib/editorial/content-integrity';
import { logger } from '@/lib/logger';
import type { FalsoPositivoAviso } from '@/lib/meni/editorial-brain/types';

const COLLECTION = 'meni_false_positives';
const MAX_ARTICLE_REFS = 10;

export type FalsePositiveKind = 'SELF_INDUCED_DEFECT' | 'FALSE_POSITIVE';
export type FalsePositiveStatus = 'REGISTERED' | 'CONFIRMED' | 'FIXED' | 'IGNORED';

export interface FalsePositiveRecord {
  code: string;
  kind: FalsePositiveKind;
  /** Contexto textual donde apareció el defecto (máx. 160 chars). */
  contexto: string;
  /** Origen: 'quality-gate:auto', 'admin:report', 'audit:seed'… */
  origen: string;
  articleIds: string[];
  ocurrencias: number;
  firstSeen: string;
  lastSeen: string;
  status: FalsePositiveStatus;
  nota?: string;
}

/** ID determinista por código + contexto normalizado → dedup natural. */
function recordId(code: string, contexto: string): string {
  const norm = contexto.toLowerCase().replace(/\s+/g, ' ').slice(0, 80);
  const h = createHash('sha1').update(`${code}|${norm}`).digest('hex').slice(0, 16);
  return `fp_${h}`;
}

/**
 * Detecta defectos AUTO-INDUCIDOS: códigos presentes en el texto posterior
 * al autofix pero ausentes en el texto original. Es la firma exacta del
 * incidente CONCAT_MOTOCICLETA (el autofix creó 'motocicletacicleta' y el
 * detector —correcto— bloqueó su propia corrupción).
 */
export function detectSelfInducedDefects(preText: string, postText: string): string[] {
  if (preText === postText) return [];
  const pre = new Set(findGenerationDefects(preText).map((d) => d.code));
  return findGenerationDefects(postText)
    .filter((d) => !pre.has(d.code))
    .map((d) => d.code);
}

/**
 * Registra un evento de falso positivo / defecto auto-inducido.
 * Dedup por (code, contexto): repeticiones incrementan `ocurrencias`.
 * Fire-and-forget: los errores se loguean y nunca rompen el flujo.
 */
export async function registerFalsePositiveEvent(
  db: Firestore,
  event: {
    code: string;
    kind: FalsePositiveKind;
    contexto: string;
    origen: string;
    articleId?: string;
    nota?: string;
    status?: FalsePositiveStatus;
  },
): Promise<void> {
  try {
    const id = recordId(event.code, event.contexto);
    const ref = db.collection(COLLECTION).doc(id);
    const snap = await ref.get();
    const now = new Date().toISOString();

    if (snap.exists) {
      const prev = snap.data() as FalsePositiveRecord;
      const articleIds = new Set(prev.articleIds || []);
      if (event.articleId) articleIds.add(event.articleId);
      await ref.update({
        ocurrencias: (prev.ocurrencias || 1) + 1,
        lastSeen: now,
        articleIds: [...articleIds].slice(-MAX_ARTICLE_REFS),
        // Un evento humano (FALSE_POSITIVE) o un status explícito pisa el anterior.
        ...(event.status ? { status: event.status } : {}),
        ...(event.nota ? { nota: event.nota.slice(0, 300) } : {}),
      });
    } else {
      const record: FalsePositiveRecord = {
        code: event.code,
        kind: event.kind,
        contexto: event.contexto.slice(0, 160),
        origen: event.origen,
        articleIds: event.articleId ? [event.articleId] : [],
        ocurrencias: 1,
        firstSeen: now,
        lastSeen: now,
        status: event.status ?? 'REGISTERED',
        ...(event.nota ? { nota: event.nota.slice(0, 300) } : {}),
      };
      await ref.set(record as unknown as Record<string, unknown>);
    }
  } catch (err) {
    logger.warn('[fp-registry] No se pudo registrar evento (no bloqueante):', err);
  }
}

let cache: { byCode: Map<string, FalsePositiveRecord>; loadedAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Carga el registro para consulta en evaluaciones (cache 10 min).
 * Se usa SOLO para anotar contexto ("este defecto ya fue registrado como
 * auto-inducido N veces") — nunca para silenciar el Quality Gate.
 */
export async function loadFalsePositiveContext(
  db: Firestore,
  defectCodes?: string[],
): Promise<FalsoPositivoAviso[]> {
  try {
    if (!cache || Date.now() - cache.loadedAt > CACHE_TTL_MS) {
      const snap = await db.collection(COLLECTION).limit(200).get();
      const byCode = new Map<string, FalsePositiveRecord>();
      for (const d of snap.docs) {
        const r = d.data() as FalsePositiveRecord;
        if (r.status === 'IGNORED') continue;
        const prev = byCode.get(r.code);
        if (!prev || (r.ocurrencias || 0) > (prev.ocurrencias || 0)) byCode.set(r.code, r);
      }
      cache = { byCode, loadedAt: Date.now() };
    }
    const codes = defectCodes?.length ? defectCodes : [...cache.byCode.keys()];
    return codes
      .map((code) => cache!.byCode.get(code))
      .filter((r): r is FalsePositiveRecord => !!r)
      .map((r) => ({
        code: r.code,
        kind: r.kind,
        ocurrencias: r.ocurrencias,
        nota: r.nota || `Registrado ${r.ocurrencias} vez(ces) desde ${r.firstSeen.slice(0, 10)}`,
      }));
  } catch {
    return [];
  }
}

export function invalidateFalsePositiveCache(): void {
  cache = null;
}
