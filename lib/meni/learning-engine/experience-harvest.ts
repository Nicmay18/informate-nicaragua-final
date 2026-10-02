/**
 * Experience Harvest — MENI Learning 4.0 (FASE 4)
 * ================================================
 * Ciclo controlado de aprendizaje de experiencias. Corre bajo demanda
 * (admin) o por cron semanal — NUNCA en cada publicación y NUNCA dentro
 * del flujo de evaluación.
 *
 * Qué hace:
 *   1. Recoge las `editor_corrections` recientes y re-ejecuta la detección
 *      de patrones por (campo, categoría) — la promoción sigue gobernada:
 *      OBSERVED → CANDIDATE → VALIDATING → APPROVED → ACTIVE, con la
 *      aprobación humana en el medio (admin/meni-learning).
 *   2. Escanea `meni_decision_log` buscando códigos de rechazo repetidos:
 *      un bloqueo recurrente del mismo defecto es candidato a falso
 *      positivo → se registra como observación en `meni_false_positives`
 *      (status REGISTERED, nunca silencia el gate).
 *   3. Persiste el resumen del ciclo en `learning_cycles` para auditoría.
 *
 * Qué NO hace:
 *   - No toca scores, umbrales, Quality Gates, Forense ni Supervisor.
 *   - No activa patrones (eso requiere aprobación humana).
 *   - No activa ajustes de pesos del Learning Engine (gobernado aparte).
 */
import type { Firestore } from 'firebase-admin/firestore';
import type { CampoCorreccion } from '@/lib/meni/editorial-brain/types';
import { detectAndPersistPattern } from '@/lib/meni/editor-jefe/correction-tracker';
import { registerFalsePositiveEvent } from './false-positive-registry';
import { logger } from '@/lib/logger';

const CORRECTION_SCAN_LIMIT = 500;
const DECISION_LOG_SCAN_LIMIT = 200;
const MIN_REJECTIONS_FOR_FP_CANDIDATE = 3;

export interface ExperienceHarvestResult {
  runAt: string;
  corrections: { scanned: number; byKind: Record<string, number> };
  patternPairsEvaluated: number;
  patternsDetected: number;
  decisionLog: { scanned: number; rejectedByCode: Record<string, number> };
  falsePositiveCandidates: number;
  patternsByState: Record<string, number>;
  durationMs: number;
}

export async function runExperienceHarvest(db: Firestore): Promise<ExperienceHarvestResult> {
  const t0 = Date.now();
  const runAt = new Date().toISOString();

  // ── 1. Correcciones recientes → pares (campo, categoría) → patrones ──
  const corrSnap = await db.collection('editor_corrections')
    .orderBy('fecha', 'desc')
    .limit(CORRECTION_SCAN_LIMIT)
    .get()
    .catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] }));

  const byKind: Record<string, number> = {};
  const pairs = new Set<string>();
  for (const d of corrSnap.docs) {
    const c = d.data() as { campo?: string; categoria?: string; kind?: string };
    const kind = c.kind || 'DECISION_HUMANA';
    byKind[kind] = (byKind[kind] || 0) + 1;
    if (c.campo && c.categoria) pairs.add(`${c.campo}|${c.categoria}`);
  }

  let patternsDetected = 0;
  for (const pair of pairs) {
    const [campo, categoria] = pair.split('|') as [CampoCorreccion, string];
    try {
      const p = await detectAndPersistPattern(db, campo, categoria);
      if (p) patternsDetected++;
    } catch (err) {
      logger.warn('[experience-harvest] detectAndPersistPattern falló', { pair, err: String(err) });
    }
  }

  // ── 2. Decision log → rechazos repetidos → candidatos a falso positivo ──
  // Shape real (verificado en producción): el timestamp es `at`, el
  // resultado es `result` (SAVED|EVALUATED|REJECTED) y los motivos de
  // rechazo del Supervisor viven en `factuality[].code` + `blockingReason`
  // — no en `blockingIssues`.
  const dlSnap = await db.collection('meni_decision_log')
    .orderBy('at', 'desc')
    .limit(DECISION_LOG_SCAN_LIMIT)
    .get()
    .catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] }));

  const rejectedByCode: Record<string, { count: number; articleIds: Set<string> }> = {};
  const mark = (code: string, articleId?: string) => {
    if (!rejectedByCode[code]) rejectedByCode[code] = { count: 0, articleIds: new Set() };
    rejectedByCode[code].count++;
    if (articleId) rejectedByCode[code].articleIds.add(articleId);
  };
  for (const d of dlSnap.docs) {
    const data = d.data() as {
      result?: string;
      blockingStage?: string;
      blockingReason?: string;
      factuality?: { code?: string; severity?: string }[];
      savedArticleId?: string;
      articleId?: string;
    };
    if (data.result !== 'REJECTED') continue;
    const articleId = data.savedArticleId || data.articleId;
    const factCodes = (data.factuality || [])
      .filter((f) => f?.code && f.severity !== 'INFO')
      .map((f) => String(f.code));
    if (factCodes.length > 0) {
      for (const code of factCodes) mark(code, articleId);
    } else if (data.blockingReason) {
      // Motivo sin código estructurado: agrupar por su prefijo semántico.
      mark(`SUPERVISOR:${String(data.blockingReason).replace(/"[^"]*"/g, '…').slice(0, 60)}`, articleId);
    }
  }

  let falsePositiveCandidates = 0;
  for (const [code, info] of Object.entries(rejectedByCode)) {
    if (info.count < MIN_REJECTIONS_FOR_FP_CANDIDATE) continue;
    falsePositiveCandidates++;
    await registerFalsePositiveEvent(db, {
      code,
      kind: 'FALSE_POSITIVE',
      contexto: `decision_log:${code}`,
      origen: 'experience-harvest',
      articleId: [...info.articleIds][0],
      nota: `${info.count} rechazos repetidos por ${code} en el decision log — revisar si es falso positivo o defecto legítimo recurrente.`,
    });
  }

  // ── 3. Estado de patrones (para el resumen del ciclo) ──
  const patSnap = await db.collection('editor_patterns').get().catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] }));
  const patternsByState: Record<string, number> = {};
  for (const d of patSnap.docs) {
    const s = (d.data() as { learningState?: string }).learningState || 'OBSERVED';
    patternsByState[s] = (patternsByState[s] || 0) + 1;
  }

  const result: ExperienceHarvestResult = {
    runAt,
    corrections: { scanned: corrSnap.docs.length, byKind },
    patternPairsEvaluated: pairs.size,
    patternsDetected,
    decisionLog: {
      scanned: dlSnap.docs.length,
      rejectedByCode: Object.fromEntries(
        Object.entries(rejectedByCode).map(([k, v]) => [k, v.count]),
      ),
    },
    falsePositiveCandidates,
    patternsByState,
    durationMs: Date.now() - t0,
  };

  // Auditoría del ciclo: el resumen queda en learning_cycles.
  await db.collection('learning_cycles').add({
    kind: 'experience_cycle',
    ...result,
    createdAt: new Date().toISOString(),
  });

  return result;
}
