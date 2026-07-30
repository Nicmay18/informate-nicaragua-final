import type { MeniBlockingIssue } from './types';
import type { QualityGateIssue, QualityGateResult } from './quality-gate/types';
import type { EditorialDnaResult } from './editorial-dna/types';
import { MIN_APPROVED_SCORE } from './scoring';
import {
  MIN_ORIGINALITY_PERCENT,
  MIN_EXPLANATION_SCORE,
} from './quality-gate/rules';

const DEBUG = process.env.MENI_DEBUG === 'true';

export function logMeni(...args: unknown[]): void {
  if (DEBUG) {
    console.log('[MENI-DEBUG]', ...args);
  }
}

function logTime(label: string, t0: number): void {
  if (DEBUG) {
    console.log(`[MENI-DEBUG] ⏱ ${label}: ${Date.now() - t0}ms`);
  }
}

const SEVERITY_MAP: Record<string, MeniBlockingIssue['severity']> = {
  blocking: 'BLOCKER',
  warning: 'WARNING',
  info: 'INFO',
};

interface IssueMeta {
  code: string;
  title: string;
  field: MeniBlockingIssue['field'];
  howToFix: string;
  expected: string;
}

const CODE_META: Record<string, IssueMeta> = {
  contradiccion: {
    code: 'QUALITY_GATE_FACT_CONTRADICTION',
    title: 'Contradicción factual',
    field: 'contenido',
    howToFix: 'Revisa si el mismo nombre aparece con edades, cantidades o datos distintos. Si son personas diferentes, no unifiques.',
    expected: 'Sin contradicciones',
  },
  cronologia: {
    code: 'QUALITY_GATE_CHRONOLOGY',
    title: 'Cronología incoherente',
    field: 'contenido',
    howToFix: 'La cronología parece revisar un desenlace antes de antecedentes. Verifique que las fechas y eventos sean compatibles antes de bloquear.',
    expected: 'Contradicciones temporales reales',
  },
  coherencia: {
    code: 'QUALITY_GATE_DUPLICATE_PARAGRAPHS',
    title: 'Párrafos duplicados',
    field: 'contenido',
    howToFix: 'Elimina repeticiones y reescribe con información nueva.',
    expected: 'Sin párrafos repetidos',
  },
  terminologia: {
    code: 'QUALITY_GATE_TERMINOLOGY',
    title: 'Terminología inconsistente',
    field: 'contenido',
    howToFix: 'Usa un solo término canónico (ej. "pitbull", "motocicleta").',
    expected: 'Término canónico único',
  },
  precision: {
    code: 'QUALITY_GATE_UNSUPPORTED_CLAIM',
    title: 'Afirmación no respaldada',
    field: 'contenido',
    howToFix: 'Sustituye afirmaciones absolutas por datos verificables o atribuidos.',
    expected: 'Sin afirmaciones absolutas',
  },
  lenguaje: {
    code: 'QUALITY_GATE_FILLER_LANGUAGE',
    title: 'Lenguaje de relleno',
    field: 'contenido',
    howToFix: 'Elimina adjetivos emocionales y palabras vacías.',
    expected: 'Sin palabras de relleno',
  },
  sensacionalismo: {
    code: 'QUALITY_GATE_SENSATIONALISM',
    title: 'Lenguaje sensacionalista',
    field: 'contenido',
    howToFix: 'Reemplaza frases alarmistas por hechos objetivos.',
    expected: 'Sin sensacionalismo',
  },
  servicio: {
    code: 'QUALITY_GATE_SERVICE_VALUE',
    title: 'Valor de servicio insuficiente',
    field: 'contenido',
    howToFix: 'Agrega qué hacer, qué significa, consecuencias o declaración de autoridades.',
    expected: 'Contexto/utilidad presente',
  },
  valor_diferencial: {
    code: 'QUALITY_GATE_EDITORIAL_DIFFERENCE',
    title: 'Diferencial editorial insuficiente',
    field: 'contenido',
    howToFix: 'Explica por qué leer esta nota en Nicaragua Informate y no en la competencia.',
    expected: 'Justificación diferencial',
  },
  explicacion: {
    code: 'QUALITY_GATE_EXPLANATION',
    title: 'Explicación insuficiente',
    field: 'contenido',
    howToFix: 'Añade por qué ocurrió, qué significa y consecuencias.',
    expected: `≥ ${MIN_EXPLANATION_SCORE}%`,
  },
  originalidad: {
    code: 'QUALITY_GATE_ORIGINALITY',
    title: 'Originalidad baja',
    field: 'contenido',
    howToFix: 'Reducí transcripción textual, agregá contexto y explicación propia.',
    expected: `≥ ${MIN_ORIGINALITY_PERCENT}%`,
  },
};

function mapQualityGateIssue(issue: QualityGateIssue): MeniBlockingIssue {
  const meta = CODE_META[issue.categoria] || {
    code: `QUALITY_GATE_${issue.categoria.toUpperCase()}`,
    title: `Quality Gate: ${issue.categoria}`,
    field: 'contenido',
    howToFix: 'Revisar el texto del artículo.',
    expected: 'Cumplir con los criterios editoriales',
  };

  return {
    code: meta.code,
    module: 'quality-gate',
    severity: SEVERITY_MAP[issue.severidad] || 'INFO',
    title: meta.title,
    description: issue.mensaje,
    currentValue: issue.evidencia || 'Detectado',
    expectedValue: meta.expected,
    howToFix: meta.howToFix,
    field: meta.field,
    evidence: issue.evidencia,
  };
}

// ─────────────────────────────────────────────────────────────
// Builder principal
// ─────────────────────────────────────────────────────────────

export function buildMeniDiagnostics(opts: {
  qualityGate?: QualityGateResult;
  scoreFinal: number;
  aprobado: boolean;
  editorialDna?: EditorialDnaResult;
}): { blockingIssues: MeniBlockingIssue[]; warnings: MeniBlockingIssue[] } {
  const blockingIssues: MeniBlockingIssue[] = [];
  const warnings: MeniBlockingIssue[] = [];

  if (opts.qualityGate) {
    const qg = opts.qualityGate;
    for (const issue of qg.issues || []) {
      const mapped = mapQualityGateIssue(issue);
      if (mapped.severity === 'BLOCKER') {
        blockingIssues.push(mapped);
      } else {
        warnings.push(mapped);
      }
    }

    // Originalidad y transcripción ya se deciden desde Editorial DNA / Editorial Brain.
    // No duplicar blockers aquí para evitar mostrar valores contradictorios.
  }

  if (opts.editorialDna) {
    const dna = opts.editorialDna;
    if (dna.exclusividad.bloquear && dna.exclusividad.razon) {
      blockingIssues.push({
        code: 'EDITORIAL_DNA_EXCLUSIVIDAD',
        module: 'editorial-dna',
        severity: 'BLOCKER',
        title: 'Valor diferencial insuficiente',
        description: dna.exclusividad.razon,
        currentValue: `${dna.exclusividad.score}%`,
        expectedValue: `≥ ${MIN_APPROVED_SCORE}%`,
        howToFix: 'Incluí contexto, explicación, antecedentes o utilidad que otros medios no aportan.',
        field: 'contenido',
      });
    }
    if (dna.wow.bloquear && dna.wow.razon) {
      blockingIssues.push({
        code: 'EDITORIAL_DNA_WOW',
        module: 'editorial-dna',
        severity: 'BLOCKER',
        title: 'El lector no aprende nada nuevo',
        description: dna.wow.razon,
        currentValue: `${dna.wow.score}%`,
        expectedValue: `≥ ${MIN_APPROVED_SCORE}%`,
        howToFix: 'Respondé qué ocurrió, por qué, qué significa, qué cambia y cómo afecta al lector.',
        field: 'contenido',
      });
    }
    if (dna.transcripcion.bloquear && dna.transcripcion.razon) {
      blockingIssues.push({
        code: 'EDITORIAL_DNA_TRANSCRIPCION',
        module: 'editorial-dna',
        severity: 'BLOCKER',
        title: 'Riesgo de transcripción de la fuente',
        description: dna.transcripcion.razon,
        currentValue: `${dna.transcripcion.score}%`,
        expectedValue: `≥ ${MIN_APPROVED_SCORE}%`,
        howToFix: 'Parafraseá la fuente. Sumá análisis propio, contexto y explicación.',
        field: 'contenido',
      });
    }
  }

  if (!opts.aprobado && opts.scoreFinal < MIN_APPROVED_SCORE && blockingIssues.length === 0) {
    blockingIssues.push({
      code: 'MENI_SCORE_THRESHOLD',
      module: 'meni-core',
      severity: 'BLOCKER',
      title: 'Score final por debajo del umbral',
      description: `La nota obtuvo ${opts.scoreFinal} puntos, insuficiente para aprobar.`,
      currentValue: opts.scoreFinal,
      expectedValue: `≥ ${MIN_APPROVED_SCORE}`,
      howToFix: 'Mejorar SEO, EEAT, redacción forense y evitar sensacionalismo. Ver recomendaciones.',
      field: 'general',
    });
  }

  return { blockingIssues, warnings };
}

export function buildDuplicateBlockingIssue(similitud: number): MeniBlockingIssue {
  return {
    code: 'DUPLICATE_CONTENT',
    module: 'duplicados',
    severity: 'BLOCKER',
    title: 'Contenido duplicado con otra noticia',
    description: `El artículo coincide en un ${similitud}% con una noticia ya publicada.`,
    currentValue: `${similitud}%`,
    expectedValue: '< 35%',
    howToFix: 'Cambiar el enfoque, añadir información nueva, modificar el título y lead.',
    field: 'contenido',
  };
}

export { logTime };
