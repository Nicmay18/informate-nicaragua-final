/**
 * MENI 4 Final — Veredicto Editorial Unificado
 * =============================================
 * UNA sola fuente de verdad para la sala de redacción:
 *
 *   hallazgo → severidad → razón → ubicación → cómo corregir → ¿bloquea?
 *
 * Reglas de decisión (inequívocas):
 *   BLOQUEAR            → existe ≥1 hallazgo BLOCKER (defecto factual,
 *                         mecánico, duplicado, integridad o evidencia).
 *   REVISAR             → existe ≥1 WARNING (riesgo factual/editorial que
 *                         requiere revisión humana) o MENI no aprobó sin
 *                         bloqueo duro (score < umbral).
 *   PUBLICAR_CON_CAMBIOS → solo hay RECOMMENDATIONs/INFO (o MENI aprobó
 *                         con observaciones). Nunca requieren reescritura.
 *   PUBLICAR            → sin hallazgos que requieran acción.
 *
 * Una RECOMMENDATION jamás puede impedir publicación.
 * Un WARNING solo puede impedir publicar si existe una regla explícita
 * que lo convierta en bloqueo — hoy ninguna lo hace; los WARNING exigen
 * revisión humana, no reescritura automática.
 */

import type { RevisionEditorJefe } from './types';
import type { AntiClickbaitResult } from './anti-clickbait/types';
import type { QualityGateIssue } from './quality-gate/types';
import type { FactualitySignal } from '@/lib/editorial/factuality-signals';
import type { SupervisorDecision } from '@/lib/supervisor/types';
import type { ExplainabilityItem } from '@/lib/editorial/core/types';

export type FindingSeverity = 'BLOCKER' | 'WARNING' | 'RECOMMENDATION' | 'INFO';
export type EditorJefeDecision = 'PUBLICAR' | 'PUBLICAR_CON_CAMBIOS' | 'REVISAR' | 'BLOQUEAR';

export interface FindingLocation {
  /** Párrafo (1-based) donde aparece la evidencia, si fue localizable. */
  parrafo?: number;
  /** Fragmento textual exacto que disparó el hallazgo. */
  cita?: string;
}

export interface EditorialFinding {
  code: string;
  severity: FindingSeverity;
  /** Módulo que originó el hallazgo (quality-gate, factualidad, duplicados…). */
  module: string;
  title: string;
  description: string;
  /** Qué hacer para corregir; si no hay corrección segura, dice "VERIFICAR". */
  howToFix: string;
  /** true SOLO si este hallazgo por sí mismo impide publicar. */
  bloquea: boolean;
  field?: RevisionEditorJefe['field'];
  location?: FindingLocation;
}

export interface EditorialVerdict {
  decision: EditorJefeDecision;
  /** Frase ejecutiva inequívoca para el periodista. */
  resumen: string;
  counts: { blockers: number; warnings: number; recommendations: number; info: number };
  /** Ordenados por severidad: BLOCKER → WARNING → RECOMMENDATION → INFO. */
  hallazgos: EditorialFinding[];
  /** Lo que está bien — el sistema también dice qué validó. */
  aciertos: string[];
  scoreFinal: number | null;
  /** Veredicto del Supervisor si la cadena completa corrió. */
  supervisorVerdict?: string;
  evaluatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Localización de evidencia en el texto (mejor esfuerzo)
// ─────────────────────────────────────────────────────────────

function splitParagraphs(contenido: string): string[] {
  const plain = contenido
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return plain
    .split(/\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0);
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intenta ubicar `evidence` dentro del contenido.
 * Devuelve el índice de párrafo y una cita corta; undefined si no se ubica.
 */
export function locateEvidence(contenido: string, evidence?: string): FindingLocation | undefined {
  if (!contenido || !evidence) return undefined;
  const paragraphs = splitParagraphs(contenido);
  if (paragraphs.length === 0) return undefined;

  // La evidencia puede traer varios fragmentos ("a; b; c" o "x vs y") —
  // probar cada uno, del más largo al más corto.
  const fragments = evidence
    .split(/;| vs | \|| \| /)
    .map((f) => f.trim())
    .filter((f) => f.length >= 4)
    .sort((a, b) => b.length - a.length);

  for (const frag of fragments) {
    const needle = normalizeText(frag.replace(/^\w+:\s*/, ''));
    if (needle.length < 4) continue;
    // Búsqueda por fragmento completo, luego por sus tokens más raros.
    for (let i = 0; i < paragraphs.length; i++) {
      if (normalizeText(paragraphs[i]).includes(needle)) {
        return { parrafo: i + 1, cita: frag.slice(0, 120) };
      }
    }
    const tokens = needle.split(' ').filter((t) => t.length >= 5);
    for (const tok of tokens.slice(0, 3)) {
      for (let i = 0; i < paragraphs.length; i++) {
        if (normalizeText(paragraphs[i]).includes(tok)) {
          return { parrafo: i + 1, cita: frag.slice(0, 120) };
        }
      }
    }
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────
// Mappers — cada subsistema → EditorialFinding
// ─────────────────────────────────────────────────────────────

const QG_SEVERITY: Record<string, FindingSeverity> = {
  blocking: 'BLOCKER',
  warning: 'WARNING',
  info: 'INFO',
};

function fromRevision(issue: RevisionEditorJefe, contenido: string): EditorialFinding {
  const severity: FindingSeverity =
    issue.severity === 'BLOCKER' ? 'BLOCKER'
    : issue.severity === 'ERROR' ? 'WARNING'
    : issue.severity === 'WARNING' ? 'WARNING'
    : 'INFO';
  return {
    code: issue.code,
    severity,
    module: issue.module,
    title: issue.title,
    description: issue.description,
    howToFix: issue.howToFix || 'VERIFICAR: revisar el fragmento detectado antes de publicar.',
    bloquea: severity === 'BLOCKER',
    field: issue.field,
    location: locateEvidence(contenido, issue.evidence),
  };
}

function fromQualityGate(issue: QualityGateIssue, contenido: string): EditorialFinding {
  const severity = QG_SEVERITY[issue.severidad] || 'INFO';
  return {
    code: `QG_${issue.categoria.toUpperCase()}`,
    severity,
    module: 'quality-gate',
    title: issue.mensaje,
    description: issue.mensaje,
    howToFix: issue.corregible
      ? 'El sistema intentó corregirlo automáticamente; verificar el resultado.'
      : 'VERIFICAR: revisar el fragmento detectado antes de publicar.',
    bloquea: severity === 'BLOCKER',
    field: 'contenido',
    location: locateEvidence(contenido, issue.evidencia),
  };
}

const FACTUAL_FIX: Record<string, string> = {
  UNSOURCED_MATERIAL_FIGURES: 'Indicar quién proporciona cada cifra material.',
  NO_ATTRIBUTION: 'Agregar atribución identificable (institución, agencia o persona con nombre).',
  VAGUE_ATTRIBUTION: 'Sustituir "medios"/"autoridades" por la fuente concreta identificable.',
  FIELD_REPORT: 'VERIFICAR: confirmar el dato con fuente institucional o persona identificable.',
  UNEVIDENCED_ENTITY: 'Indicar la fuente que respalda la afirmación central sobre la entidad.',
  INTERNAL_CONTRADICTION: 'Corregir la contradicción interna antes de publicar.',
  EXTRAORDINARY_UNSOURCED_CLAIM: 'La afirmación extraordinaria requiere fuente explícita antes de publicar.',
  AI_PROVENANCE_ARTIFACT: 'VERIFICAR el texto completo: proviene de salida de IA con marcadores residuales.',
};

function fromFactuality(signal: FactualitySignal, contenido: string): EditorialFinding {
  const severity: FindingSeverity = signal.severity === 'CRITICAL' ? 'BLOCKER' : 'WARNING';
  return {
    code: `FACTUALIDAD_${signal.code}`,
    severity,
    module: 'factualidad',
    title: signal.desc,
    description: `Evidencia: ${signal.evidence}`,
    howToFix: FACTUAL_FIX[signal.code] ?? 'VERIFICAR la afirmación contra fuentes antes de publicar.',
    bloquea: severity === 'BLOCKER',
    field: 'contenido',
    location: locateEvidence(contenido, signal.evidence),
  };
}

const SUPERVISOR_SEVERITY: Record<string, FindingSeverity> = {
  CRITICAL: 'WARNING', // CRITICAL de Supervisor → revisión humana, no bloqueo técnico
  IMPORTANT: 'WARNING',
  WARNING: 'RECOMMENDATION',
  OPTIMIZATION: 'INFO',
};

// Las señales de factualidad ya se reportan como findings propios; los issues
// de Supervisor cuyo dominio es FACTUALIDAD duplican esa causa — se omiten.
function fromSupervisor(decision: SupervisorDecision, contenido: string): EditorialFinding[] {
  const out: EditorialFinding[] = [];
  for (const i of decision.issues || []) {
    if (i.domain === 'FACTUALIDAD') continue;
    const severity = SUPERVISOR_SEVERITY[i.severity] || 'INFO';
    out.push({
      code: `SUPERVISOR_${i.domain}`,
      severity,
      module: 'supervisor',
      title: i.problem,
      description: i.impact || i.cause || '',
      howToFix: i.action || 'VERIFICAR antes de publicar.',
      bloquea: false,
      field: i.domain === 'TITULO' ? 'titulo' : i.domain === 'IMAGEN' ? 'imagen' : i.domain === 'CATEGORIA' ? 'categoria' : 'contenido',
      location: i.domain === 'TITULO' ? undefined : locateEvidence(contenido, i.cause),
    });
  }
  return out;
}

/**
 * Deducciones del scorer editorial (EVIDENCIA_REQUERIDA, SIN_CITAS,
 * CONTEXTO_REQUERIDO, POCOS_NOMBRES, UTILIDAD_REQUERIDA…).
 * Restan puntos dentro de su módulo, pero NUNCA bloquean publicación:
 * se clasifican como RECOMMENDATION con etiqueta explícita.
 */
function fromExplainability(items: ExplainabilityItem[], contenido: string): EditorialFinding[] {
  return items
    .filter((it) => it.puntosPerdidos > 0)
    .map((it): EditorialFinding => ({
      code: String(it.regla || 'SCORE_DEDUCTION'),
      severity: 'RECOMMENDATION',
      module: `score:${it.modulo}`,
      title: it.motivo,
      description: `Resta ${it.puntosPerdidos} pts en ${it.modulo}. Recomendación editorial — no impide publicar.`,
      howToFix: it.solucion || 'VERIFICAR si aplica mejorar este punto.',
      bloquea: false,
      field: 'contenido',
      location: locateEvidence(contenido, it.parrafo),
    }));
}

function fromRecommendations(recs: { area: string; mensaje: string }[]): EditorialFinding[] {
  return recs.map((r): EditorialFinding => ({
    code: `RECOMENDACION_${String(r.area || 'editorial').toUpperCase()}`,
    severity: 'RECOMMENDATION',
    module: 'editorial',
    title: r.mensaje,
    description: 'Recomendación editorial — no impide publicar.',
    howToFix: r.mensaje,
    bloquea: false,
    field: 'general',
  }));
}

/**
 * Anti Clickbait → hallazgo de TÍTULO. Semántica honesta:
 *  - 'bloqueado'   → WARNING: defecto editorial real que exige revisión
 *    humana (la decisión global ya cae a REVISAR por `aprobado=false`),
 *    pero el hallazgo hace visible DÓNDE está el problema y propone un
 *    título corregido que el editor puede aceptar y re-evaluar.
 *  - 'advertencia' → RECOMMENDATION: señal media, nunca bloquea.
 *  - 'aprobado'    → sin hallazgo.
 * Nunca es BLOCKER: un título clickbait es corregible editando el campo,
 * no un defecto factual/mecánico del contenido.
 */
function fromAntiClickbait(res: AntiClickbaitResult): EditorialFinding | null {
  if (res.veredicto === 'aprobado') return null;
  const sugerencia = res.tituloSugerido ? ` Sugerencia: «${res.tituloSugerido}».` : '';
  const severity: FindingSeverity = res.veredicto === 'bloqueado' ? 'WARNING' : 'RECOMMENDATION';
  return {
    code: 'ANTI_CLICKBAIT_TITULO',
    severity,
    module: 'anti-clickbait',
    title: res.veredicto === 'bloqueado'
      ? 'El título genera curiosidad artificial en lugar de informar'
      : 'El título tiene señales de clickbait',
    description: `${res.razon}${sugerencia}`,
    howToFix: res.tituloSugerido
      ? `Aceptar el título sugerido («${res.tituloSugerido}») o reescribir el título informando el hecho directamente, luego re-analizar.`
      : 'Reescribir el título informando el hecho directamente (qué, quién, dónde), luego re-analizar.',
    bloquea: false,
    field: 'titulo',
  };
}

function fromDuplicate(similitud: number, titulo?: string): EditorialFinding {
  return {
    code: 'DUPLICATE_CONTENT',
    severity: 'BLOCKER',
    module: 'duplicados',
    title: `Posible duplicado (${similitud}% de similitud)`,
    description: titulo ? `Coincide con: ${titulo}` : `Similitud ${similitud}% con noticia publicada.`,
    howToFix: 'Cambiar el enfoque, añadir información nueva o verificar si es una actualización de la nota existente.',
    bloquea: true,
    field: 'contenido',
  };
}

// ─────────────────────────────────────────────────────────────
// Recolección de hallazgos por capa
// ─────────────────────────────────────────────────────────────

/** Hallazgos de la capa MENI (quality gate + diagnósticos + explicabilidad + recomendaciones). */
export function collectMeniFindings(input: {
  contenido: string;
  blockingIssues?: RevisionEditorJefe[];
  warnings?: RevisionEditorJefe[];
  qualityGateIssues?: QualityGateIssue[];
  explainability?: ExplainabilityItem[];
  recomendaciones?: { area: string; mensaje: string }[];
  antiClickbait?: AntiClickbaitResult;
}): EditorialFinding[] {
  const contenido = input.contenido || '';
  const hallazgos: EditorialFinding[] = [];
  const seen = new Set<string>();
  const push = (f: EditorialFinding) => {
    const key = `${f.code}:${f.title}`;
    if (seen.has(key)) return;
    seen.add(key);
    hallazgos.push(f);
  };

  for (const i of input.blockingIssues || []) push(fromRevision(i, contenido));
  for (const i of input.warnings || []) push(fromRevision(i, contenido));
  for (const i of input.qualityGateIssues || []) {
    // Los issues de QG ya llegan vía blockingIssues/warnings (buildMeniDiagnostics);
    // solo se agregan los que no fueron mapeados (ej. severidad 'info').
    if (QG_SEVERITY[i.severidad] === 'INFO') push(fromQualityGate(i, contenido));
  }
  for (const f of fromExplainability(input.explainability || [], contenido)) push(f);
  for (const f of fromRecommendations(input.recomendaciones || [])) push(f);
  const acb = input.antiClickbait ? fromAntiClickbait(input.antiClickbait) : null;
  if (acb) push(acb);
  return hallazgos;
}

/** Hallazgos de la capa de cierre (factualidad + duplicado + Supervisor). */
export function collectGateFindings(input: {
  contenido: string;
  factualitySignals?: FactualitySignal[];
  duplicado?: { esDuplicado: boolean; similitud: number; tituloCoincidencia?: string };
  supervisor?: SupervisorDecision;
}): EditorialFinding[] {
  const contenido = input.contenido || '';
  const hallazgos: EditorialFinding[] = [];
  for (const s of input.factualitySignals || []) hallazgos.push(fromFactuality(s, contenido));
  if (input.duplicado?.esDuplicado) {
    hallazgos.push(fromDuplicate(input.duplicado.similitud, input.duplicado.tituloCoincidencia));
  }
  if (input.supervisor) {
    hallazgos.push(...fromSupervisor(input.supervisor, contenido));
  }
  return hallazgos;
}

// ─────────────────────────────────────────────────────────────
// Decisión final — reglas inequívocas
// ─────────────────────────────────────────────────────────────

const ORDER: FindingSeverity[] = ['BLOCKER', 'WARNING', 'RECOMMENDATION', 'INFO'];

/**
 * Decide el veredicto final a partir de hallazgos ya construidos.
 * Única fuente de la regla de oro: solo BLOCKER bloquea.
 */
export function decideFromFindings(
  hallazgos: EditorialFinding[],
  opts: {
    scoreFinal: number | null;
    aprobado: boolean;
    supervisorVerdict?: string;
    aciertos?: string[];
  },
): EditorialVerdict {
  const seen = new Set<string>();
  const merged = [...hallazgos]
    .filter((h) => {
      const key = `${h.code}:${h.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));

  const counts = {
    blockers: merged.filter((h) => h.severity === 'BLOCKER').length,
    warnings: merged.filter((h) => h.severity === 'WARNING').length,
    recommendations: merged.filter((h) => h.severity === 'RECOMMENDATION').length,
    info: merged.filter((h) => h.severity === 'INFO').length,
  };

  // Regla de oro: solo BLOCKER bloquea. El Supervisor tiene veto de autoridad:
  // BLOQUEAR/NO_PUBLICAR de Supervisor siempre implica decisión BLOQUEAR.
  const sv = opts.supervisorVerdict;
  const supervisorHardBlock = sv === 'BLOQUEAR' || sv === 'NO_PUBLICAR' || sv === 'ARCHIVAR';

  let decision: EditorJefeDecision;
  let resumen: string;
  if (counts.blockers > 0 || supervisorHardBlock) {
    decision = 'BLOQUEAR';
    resumen = `BLOQUEAR — ${counts.blockers} defecto(s) crítico(s)${supervisorHardBlock ? `; Supervisor: ${sv}` : ''}. Corregir antes de publicar.`;
  } else if (counts.warnings > 0 || !opts.aprobado || sv === 'REVISION_HUMANA' || sv === 'INVESTIGAR_MAS' || sv === 'ACTUALIZAR') {
    decision = 'REVISAR';
    resumen = counts.warnings > 0
      ? `REVISAR — ${counts.warnings} problema(s) que requieren revisión humana antes de publicar.`
      : `REVISAR — la nota no alcanzó el umbral de aprobación automática (${opts.scoreFinal ?? '—'}/100)${sv ? `; Supervisor: ${sv}` : ''}.`;
  } else if (counts.recommendations > 0) {
    decision = 'PUBLICAR_CON_CAMBIOS';
    resumen = `PUBLICAR CON CAMBIOS — ${counts.recommendations} recomendación(es) editorial(es) que NO impiden publicar.`;
  } else {
    decision = 'PUBLICAR';
    resumen = 'LISTA PARA PUBLICAR — no se detectaron errores bloqueantes.';
  }

  return {
    decision,
    resumen,
    counts,
    hallazgos: merged,
    aciertos: opts.aciertos || [],
    scoreFinal: opts.scoreFinal,
    supervisorVerdict: sv,
    evaluatedAt: new Date().toISOString(),
  };
}

export function buildEditorialVerdict(input: {
  contenido: string;
  scoreFinal: number | null;
  aprobado: boolean;
  blockingIssues?: RevisionEditorJefe[];
  warnings?: RevisionEditorJefe[];
  qualityGateIssues?: QualityGateIssue[];
  explainability?: ExplainabilityItem[];
  recomendaciones?: { area: string; mensaje: string }[];
  duplicado?: { esDuplicado: boolean; similitud: number; tituloCoincidencia?: string };
  factualitySignals?: FactualitySignal[];
  supervisor?: SupervisorDecision;
  aciertos?: string[];
  antiClickbait?: AntiClickbaitResult;
}): EditorialVerdict {
  const hallazgos = [
    ...collectMeniFindings(input),
    ...collectGateFindings(input),
  ];
  return decideFromFindings(hallazgos, {
    scoreFinal: input.scoreFinal,
    aprobado: input.aprobado,
    supervisorVerdict: input.supervisor?.verdict,
    aciertos: input.aciertos,
  });
}
