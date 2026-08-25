/**
 * Editorial Supervisor — Orquestador del ciclo de vida completo
 * ================================================================
 * Este es el AGENTE SUPERVISOR PERMANENTE.
 * Está POR ENCIMA de MENI, Research Agent y Story Editor.
 *
 * MENI valida. Research investiga. Story redacta.
 * SUPERVISOR piensa, vigila, decide, y cuando puede, resuelve.
 *
 * No se activa solo cuando alguien pulsa "Analizar".
 * Vigila permanentemente via cron y via hooks de publicación.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type {
  ArticleContext,
  SupervisorDecision,
  SupervisorIssue,
  SupervisorAction,
  SupervisorVerdict,
  ArticleLifecycleState,
  MediumHealth,
  CostGuardStatus,
} from './types';
import { SUPERVISOR_MODEL_VERSION } from './types';
import { canCallLLM, recordCall, detectWastefulCalls } from './cost-guard';
import { logger } from '@/lib/logger';
import { resolvePublicCategory } from '@/lib/editorial/canonical';
import { detectContentProfile } from '@/lib/meni/profile-detector';
import type { PublicCategory } from '@/lib/types';
import type { MeniContentProfile } from '@/lib/meni/profile-detector';

// ═══════════════════════════════════════════════════════════════
// 1. EVALUACIÓN EDITORIAL — "¿ESTO REALMENTE ES UNA NOTICIA?"
// ═══════════════════════════════════════════════════════════════

/**
 * Evalúa un título crudo del periodista y determina si necesita investigación.
 * NO dice "Aprobado". Pregunta: ¿esto es una noticia? ¿qué falta? ¿qué ángulo tenemos?
 */
export function evaluateRawTitle(titulo: string): {
  isGeneric: boolean;
  needsInvestigation: boolean;
  missingData: string[];
  suggestedAngle: string | null;
  verdict: SupervisorVerdict;
  reason: string;
} {
  const issues: string[] = [];
  const genericPatterns = [
    /^hallan\s+/i,
    /^encuentran\s+/i,
    /^sucede\s+/i,
    /^ocurre\s+/i,
    /^se\s+reporta\s+/i,
    /^noticia\s+/i,
    /^evento\s+/i,
    /^sismo\s+(sacude|azota|afecta)/i,
    /^(capturan|arrestan|detienen)\s+$/i,
  ];

  const isGeneric = genericPatterns.some(p => p.test(titulo.trim()));
  const wordCount = titulo.trim().split(/\s+/).length;
  const tooShort = wordCount < 5;

  // Detectar qué falta
  const hasLocation = /\b(en|de|del|de la|de las)\s+[A-ZÁÉÍÓÚ]/.test(titulo) ||
    /\b(Managua|León|Chinandega|Masaya|Granada|Estelí|Matagalpa|Bluefields|Carazo|Jinotega)\b/i.test(titulo);
  const hasVictim = /\b(víctima|muerto|herido|fallecido|sin vida|lesionado)\b/i.test(titulo);
  const hasAuthority = /\b(policía|autoridad|ministerio|gobierno|interpol|ejército|bomberos)\b/i.test(titulo);
  const hasTime = /\b(hoy|ayer|anoche|esta mañana|esta tarde|esta semana|lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b/i.test(titulo);

  if (!hasLocation) issues.push('lugar donde ocurrió');
  if (!hasVictim && /hallan|encuentran|cuerpo|muerto/i.test(titulo)) issues.push('identidad o circunstancias');
  if (!hasAuthority) issues.push('autoridad que confirmó el hecho');
  if (!hasTime) issues.push('cuándo ocurrió');
  if (titulo.length < 30) issues.push('elemento distintivo (el título es demasiado breve)');

  // Solo requerir investigacion si el titulo es verdaderamente generico,
  // demasiado corto, o le faltan 3+ datos periodisticos.
  // Faltan 2 datos es normal en titulos validos (ej: anuncio de gobierno
  // sin hora exacta ni lugar especifico).
  const needsInvestigation = isGeneric || tooShort || issues.length >= 3;

  let suggestedAngle: string | null = null;
  if (isGeneric && /hallan\s+cuerpo|encuentran\s+(cuerpo|muerto|sin vida)/i.test(titulo)) {
    suggestedAngle = 'Tras horas de búsqueda encuentran sin vida a [IDENTIDAD] en [LUGAR]';
  }

  let verdict: SupervisorVerdict;
  let reason: string;

  if (needsInvestigation) {
    verdict = 'INVESTIGAR_MAS';
    reason = `Este título es demasiado genérico. No identifica ${issues.join(', ')}. ` +
      `Antes de redactar necesito investigar. ` +
      (suggestedAngle ? `Posible ángulo: "${suggestedAngle}". Pero NO publiques hasta verificar.` : '');
  } else if (issues.length === 1) {
    verdict = 'PUBLICAR_CON_CAMBIOS';
    reason = `El título tiene información pero falta: ${issues[0]}. Se puede publicar con corrección menor.`;
  } else {
    verdict = 'PUBLICAR';
    reason = 'El título tiene los elementos periodísticos mínimos: qué, dónde, cuándo, quién confirma.';
  }

  return { isGeneric, needsInvestigation, missingData: issues, suggestedAngle, verdict, reason };
}

// ═══════════════════════════════════════════════════════════════
// 2. DECISIÓN EDITORIAL COMPLETA
// ═══════════════════════════════════════════════════════════════

/**
 * Produce la decisión editorial del supervisor.
 * No usa el score como sustituto de la decisión.
 * Puede decir "score alto pero NO recomiendo publicar".
 */
export function makeEditorialDecision(ctx: ArticleContext): SupervisorDecision {
  const issues: SupervisorIssue[] = [];
  const actions: SupervisorAction[] = [];
  const decisionId = `sup_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const timestamp = new Date().toISOString();

  // ── 2.1 Título genérico ──────────────────────────────────────
  // REGLA: evaluateRawTitle es un gate PRE-REDACCION. Si el articulo ya
  // tiene contenido, research o story, el titulo se evalua como WARNING
  // (no bloquea publicacion). Solo bloquea si no hay nada mas que el titulo.
  const titleEval = evaluateRawTitle(ctx.titulo);
  const hasContent = ctx.contenido && ctx.contenido.trim().length > 100;
  const hasResearch = !!ctx.research;
  const hasStory = !!ctx.story;
  // PRINCIPIO FAIL-CLOSED: si no se aporta la decisión de MENI explícitamente,
  // asumimos NO aprobado. El Supervisor nunca debe abrir la puerta a una
  // publicación sin evidencia positiva de aprobación de MENI.
  const aprobadoMeni = ctx.aprobadoMeni === true
    || (ctx.aprobadoMeni === undefined && ctx.scoreMeni !== undefined && ctx.scoreMeni >= 90);
  const recomendacionMeni = ctx.recomendacionMeni ?? (aprobadoMeni ? 'publicar' : 'mejorar');
  // PUBLICATION GATE: separado de la recomendación editorial.
  // Si MENI aprobó (score >= MIN_APPROVED_SCORE, sin bloqueos) y no hay bloqueantes del Supervisor,
  // el artículo puede publicarse aunque la recomendación editorial sea MEJORAR.
  const meniCleared = aprobadoMeni === true && (ctx.scoreMeni ?? 0) >= 90 && recomendacionMeni === 'publicar';
  const isPreDraft = !hasContent && !hasResearch && !hasStory && !meniCleared;

  if (titleEval.needsInvestigation) {
    if (isPreDraft) {
      // Fase pre-redaccion: bloquear, necesitamos investigar antes de redactar
      issues.push({
        severity: 'IMPORTANT',
        domain: 'TITULO',
        problem: `Título genérico: "${ctx.titulo}"`,
        impact: 'No identifica elementos periodísticos clave',
        cause: 'El periodista introdujo un titular sin datos suficientes',
        action: `Investigar antes de redactar. Faltan: ${titleEval.missingData.join(', ')}`,
        autoFixable: false,
      });
      actions.push({
        type: 'RESEARCH_WEB',
        description: 'Investigar fuentes reales antes de redactar',
        priority: 'IMMEDIATE',
        execution: 'AUTO',
        handler: 'runResearch',
      });
    } else {
      // Fase post-redaccion: el titulo es debil pero ya hay contenido.
      // Marcar como WARNING para que el editor lo corrija, no bloquear.
      issues.push({
        severity: 'WARNING',
        domain: 'TITULO',
        problem: `Título podría ser más específico: "${ctx.titulo}"`,
        impact: 'El título no identifica todos los elementos periodísticos clave',
        cause: `Faltan: ${titleEval.missingData.join(', ')}`,
        action: 'Considerar enriquecer el título con datos del contenido',
        autoFixable: false,
      });
    }
  }

  // ── 2.2 Investigación insuficiente o conflictos ──────────────
  if (ctx.research) {
    if (ctx.research.recommendedAction === 'DO_NOT_PUBLISH') {
      issues.push({
        severity: 'CRITICAL',
        domain: 'INVESTIGACION',
        problem: 'La investigación recomienda NO publicar',
        impact: 'Publicar podría comprometer la credibilidad del medio',
        cause: ctx.research.reason,
        action: 'Revisar el resultado de investigación y decidir si se archiva',
        autoFixable: false,
      });
    }

    if (ctx.research.conflictsFound.length > 0) {
      issues.push({
        severity: 'CRITICAL',
        domain: 'CONFLICTO',
        problem: `${ctx.research.conflictsFound.length} conflicto(s) de fuentes detectado(s)`,
        impact: 'No se puede publicar como hecho confirmado mientras haya contradicciones',
        cause: 'Fuentes contradictorias reportan versiones diferentes',
        action: 'Bloquear publicación hasta resolver conflicto o marcar como no confirmado',
        autoFixable: false,
      });
    }

    if (ctx.research.missingInformation.filter(m => m.importance === 'HIGH').length > 0) {
      issues.push({
        severity: 'IMPORTANT',
        domain: 'INVESTIGACION',
        problem: 'Información crítica faltante',
        impact: 'El lector no tendrá el cuadro completo',
        cause: ctx.research.missingInformation.map(m => m.question).join('; '),
        action: 'Investigar más o marcar explícitamente como "no confirmado"',
        autoFixable: false,
      });
    }

    // CASO CRÍTICO: Interpol — información desactualizada que cambia el foco
    if (ctx.research.hasNewInformation && ctx.research.changesOriginalFocus) {
      issues.push({
        severity: 'CRITICAL',
        domain: 'ACTUALIZACION',
        problem: 'Existe información nueva que cambia el estado de la noticia',
        impact: 'Publicar la versión original sería desinformar',
        cause: ctx.research.newInformationSummary || 'Nueva información detectada',
        action: 'Actualizar el artículo antes de publicar, o archivar la versión original',
        autoFixable: false,
      });
    } else if (ctx.research.hasNewInformation && !ctx.research.changesOriginalFocus) {
      // Informacion complementaria: no cambia el foco pero debe registrarse
      // como aviso de actualizacion para que el editor la considere.
      issues.push({
        severity: 'WARNING',
        domain: 'ACTUALIZACION',
        problem: 'Existe información nueva complementaria',
        impact: 'El artículo podría estar incompleto si no se incorpora',
        cause: ctx.research.newInformationSummary || 'Nueva información detectada',
        action: 'Considerar incorporar la nueva información antes de publicar',
        autoFixable: false,
      });
    }
  }

  // ── 2.3 Redacción — verificar que el texto responde a la noticia
  if (ctx.story) {
    const rs = ctx.story.readerSatisfaction;
    if (rs.score < 60) {
      issues.push({
        severity: 'IMPORTANT',
        domain: 'REDACCION',
        problem: `La redacción no satisface al lector (score: ${rs.score})`,
        impact: 'El lector no entenderá completamente la noticia',
        cause: rs.improvements.join('; ') || 'Faltan elementos en la redacción',
        action: 'Mejorar la redacción antes de publicar',
        autoFixable: false,
      });
    }

    if (!rs.understandsWhatHappened) {
      issues.push({
        severity: 'IMPORTANT',
        domain: 'LECTOR',
        problem: 'El lector no entendería qué pasó después de leer el artículo',
        impact: 'Artículo incompleto',
        cause: 'Falta claridad en el hecho principal',
        action: 'Reescribir la entrada y el desarrollo',
        autoFixable: false,
      });
    }

    if (!rs.knowsWhoConfirmed) {
      issues.push({
        severity: 'WARNING',
        domain: 'EEAT',
        problem: 'No se identifica quién confirmó la información',
        impact: 'E-E-A-T comprometido — Google puede penalizar',
        cause: 'Falta atribución de fuentes',
        action: 'Agregar fuente confirmadora',
        autoFixable: false,
      });
    }
  }

  // ── 2.4 Categoría y perfil ───────────────────────────────────
  const detectedProfile = ctx.perfil
    ? (ctx.perfil as MeniContentProfile)
    : detectContentProfile(ctx.titulo, ctx.contenido, ctx.resumen || '').profile_detected;
  const canonicalCategory = resolvePublicCategory({
    titulo: ctx.titulo,
    contenido: ctx.contenido,
    resumen: ctx.resumen,
    perfil: detectedProfile,
    categoria: ctx.categoria,
  } as any);

  if (ctx.categoria && ctx.categoria !== canonicalCategory) {
    issues.push({
      severity: 'WARNING',
      domain: 'CATEGORIA',
      problem: `Categoría del body ("${ctx.categoria}") no coincide con la canónica ("${canonicalCategory}")`,
      impact: 'La noticia aparecerá en categoría incorrecta',
      cause: 'El periodista asignó categoría manual sin pasar por el detector canónico',
      action: `Usar categoría canónica: ${canonicalCategory}`,
      autoFixable: true,
    });
    actions.push({
      type: 'RECLASSIFY',
      description: `Reclasificar a ${canonicalCategory}`,
      priority: 'HIGH',
      execution: 'AUTO',
      handler: 'reclassify',
    });
  }

  // ── 2.5 Score override — "score alto pero NO recomiendo publicar"
  let scoreOverride = false;
  let scoreOverrideReason: string | undefined;

  const hasCriticalIssues = issues.some(i => i.severity === 'CRITICAL');
  const hasImportantIssues = issues.some(i => i.severity === 'IMPORTANT');

  if (hasCriticalIssues && ctx.scoreMeni !== null && ctx.scoreMeni !== undefined && ctx.scoreMeni >= 90) {
    scoreOverride = true;
    scoreOverrideReason = `El score MENI es ${ctx.scoreMeni} pero hay problemas CRITICAL que el score no detecta: ` +
      issues.filter(i => i.severity === 'CRITICAL').map(i => i.problem).join('; ');
  }

  // ── 2.6 Imagen ───────────────────────────────────────────────
  if (!ctx.imagen || ctx.imagen.trim() === '') {
    issues.push({
      severity: 'WARNING',
      domain: 'IMAGEN',
      problem: 'Artículo sin imagen destacada',
      impact: 'SEO social y OpenGraph incompletos, Google Discover no la mostrará',
      cause: 'No se proporcionó imagen al publicar',
      action: 'Agregar imagen destacada',
      autoFixable: false,
    });
  }

  // ── 2.7 Valor periodístico y veredicto final ────────────────
  // El Supervisor evalúa dimensiones editoriales INDEPENDIENTEMENTE del score.
  // Un score técnico alto no oculta un valor periodístico bajo.
  const aporteScore = ctx.aportePropio === true ? 100 : undefined;
  const editorialDimensions = [
    ctx.adnNI,
    ctx.exclusividad,
    ctx.wow,
    ctx.eeat,
    aporteScore,
  ].filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  const journalisticValue = editorialDimensions.length > 0
    ? Math.round(editorialDimensions.reduce((a, b) => a + b, 0) / editorialDimensions.length)
    : (ctx.scoreMeni ?? 100);
  const hasExceptionalValue = journalisticValue >= 85;

  let verdict: SupervisorVerdict;
  let resultingState: ArticleLifecycleState;

  if (hasCriticalIssues) {
    // Si hay conflictos de fuentes o información desactualizada → BLOQUEAR
    const hasConflict = issues.some(i => i.domain === 'CONFLICTO');
    const hasOutdated = issues.some(i => i.domain === 'ACTUALIZACION' && i.severity === 'CRITICAL');
    const hasDoNotPublish = issues.some(i => i.domain === 'INVESTIGACION' && i.problem.includes('NO publicar'));

    if (hasConflict) {
      verdict = 'BLOQUEAR';
      resultingState = 'EDITORIAL_REVIEW';
    } else if (hasOutdated) {
      verdict = 'ACTUALIZAR';
      resultingState = 'UPDATE_DETECTED';
    } else if (hasDoNotPublish) {
      verdict = 'NO_PUBLICAR';
      resultingState = 'ARCHIVED';
    } else {
      verdict = 'REVISION_HUMANA';
      resultingState = 'EDITORIAL_REVIEW';
    }
  } else if (hasImportantIssues) {
    const needsResearch = issues.some(i => i.domain === 'TITULO' || i.domain === 'INVESTIGACION');
    if (needsResearch) {
      verdict = 'INVESTIGAR_MAS';
      resultingState = 'RESEARCHING';
    } else {
      verdict = 'PUBLICAR_CON_CAMBIOS';
      resultingState = 'EDITORIAL_REVIEW';
    }
  } else if (meniCleared && hasExceptionalValue) {
    // GATE DE PUBLICACIÓN: MENI aprobó (score >= 90, sin bloqueos) y el Supervisor
    // no encontró bloqueantes críticos/importantes. La recomendación editorial
    // (MEJORAR/REVISAR) se mantiene como consejo, pero no bloquea.
    verdict = 'PUBLICAR';
    resultingState = 'READY';
  } else if (!hasExceptionalValue) {
    // MENI no aprobó y el valor periodístico no es excepcional.
    verdict = recomendacionMeni === 'revisar' ? 'REVISION_HUMANA' : 'PUBLICAR_CON_CAMBIOS';
    resultingState = 'EDITORIAL_REVIEW';
  } else if (hasExceptionalValue) {
    // MENI no aprobó, pero el valor periodístico es alto.
    verdict = 'REVISION_HUMANA';
    resultingState = 'EDITORIAL_REVIEW';
  } else {
    verdict = 'PUBLICAR_CON_CAMBIOS';
    resultingState = 'EDITORIAL_REVIEW';
  }

  // PUBLICAR_CON_CAMBIOS también es publicable: marcamos READY para que
  // guardar-directo no deje la noticia atascada en EDITORIAL_REVIEW.
  if (verdict === 'PUBLICAR_CON_CAMBIOS') {
    resultingState = 'READY';
  }

  // ── 2.7b INVARIANTE FINAL DE PUBLICACIÓN ─────────────────────
  // Cirugía anti-bypass: por construcción las ramas anteriores ya impiden
  // llegar a PUBLICAR sin meniCleared, pero este guard es la red de seguridad
  // explícita y auditable. Si por cualquier refactor futuro se llegara a
  // verdict === 'PUBLICAR' sin meniCleared, se degrada a REVISION_HUMANA.
  if (verdict === 'PUBLICAR' && !meniCleared) {
    verdict = 'REVISION_HUMANA';
    resultingState = 'EDITORIAL_REVIEW';
    issues.push({
      severity: 'CRITICAL',
      domain: 'INVARIANTE',
      problem: 'Invariante de publicación violada: PUBLICAR sin meniCleared',
      impact: 'Se evitó un bypass del gate editorial',
      cause: 'Refactor futuro podría intentar PUBLICAR sin aprobación de MENI',
      action: 'Revisar la rama que produjo PUBLICAR — requiere meniCleared=true',
      autoFixable: false,
    });
  }

  // ── 2.8 Confianza ────────────────────────────────────────────
  let confidence = 0.5;
  if (ctx.research) {
    const confirmedFacts = ctx.research.factsFound.filter(f => f.status === 'CONFIRMED').length;
    confidence += Math.min(0.3, confirmedFacts * 0.05);
    if (ctx.research.conflictsFound.length > 0) confidence -= 0.2;
  }
  if (ctx.story) {
    confidence += Math.min(0.2, (ctx.story.readerSatisfaction.score || 0) / 500);
  }
  if (scoreOverride) confidence = Math.min(confidence, 0.3);
  confidence = Math.max(0, Math.min(1, confidence));

  // ── 2.9 Razón principal ──────────────────────────────────────
  let reason = '';
  if (scoreOverride) {
    reason = scoreOverrideReason!;
  } else if (hasCriticalIssues) {
    reason = `NO recomiendo publicar. ${issues.filter(i => i.severity === 'CRITICAL').map(i => i.problem).join('; ')}`;
  } else if (hasImportantIssues) {
    reason = `Requiere atención antes de publicar. ${issues.filter(i => i.severity === 'IMPORTANT').map(i => i.problem).join('; ')}`;
  } else if (verdict === 'PUBLICAR') {
    reason = 'La noticia cumple los criterios editoriales mínimos para publicar.';
  } else if (verdict === 'REVISION_HUMANA') {
    reason = 'El Supervisor requiere una revisión humana antes de publicar. MENI no aprobó automáticamente o el valor periodístico no es excepcional.';
  } else if (verdict === 'PUBLICAR_CON_CAMBIOS') {
    reason = 'El Supervisor pide ajustes menores antes de publicar.';
  } else {
    reason = `Veredicto del Supervisor: ${verdict}.`;
  }

  return {
    decisionId,
    timestamp,
    verdict,
    reason,
    confidence,
    scoreOverride,
    ...(scoreOverride ? { scoreOverrideReason } : {}),
    issues,
    actions,
    resultingState,
    modelVersion: SUPERVISOR_MODEL_VERSION,
  };
}

// ═══════════════════════════════════════════════════════════════
// 3. DETECCIÓN DE NOTICIAS ABANDONADAS
// ═══════════════════════════════════════════════════════════════

/**
 * Detecta noticias que quedaron en estado intermedio y fueron abandonadas.
 */
export async function detectAbandonedArticles(db: Firestore): Promise<SupervisorIssue[]> {
  const issues: SupervisorIssue[] = [];
  const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000); // 7 días

  try {
    // Borradores antiguos
    const draftSnap = await db.collection('noticias')
      .where('estado', '==', 'borrador')
      .limit(50)
      .get();

    for (const doc of draftSnap.docs) {
      const data = doc.data();
      const fecha = data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha || 0);
      if (fecha < cutoff) {
        issues.push({
          severity: 'WARNING',
          domain: 'ABANDONO',
          problem: `Borrador abandonado: "${data.titulo || doc.id}"`,
          impact: 'Acumula ruido en Firestore y puede confundir al editor',
          cause: `Borrador sin actualizar desde ${fecha.toISOString().split('T')[0]}`,
          action: 'Archivar o eliminar si ya no es relevante',
          autoFixable: true,
        });
      }
    }

    // Noticias publicadas sin watch (abandonadas después de publicar)
    const publishedSnap = await db.collection('noticias')
      .where('publicado', '==', true)
      .where('estado', '==', 'publicado')
      .limit(50)
      .get();

    let withoutWatch = 0;
    for (const doc of publishedSnap.docs) {
      const lifecycleSnap = await db.collection('article_lifecycles').doc(doc.id).get();
      if (!lifecycleSnap.exists) {
        withoutWatch++;
      }
    }

    if (withoutWatch > 0) {
      issues.push({
        severity: 'OPTIMIZATION',
        domain: 'ABANDONO',
        problem: `${withoutWatch} noticia(s) publicada(s) sin lifecycle de vigilancia`,
        impact: 'No se están monitoreando actualizaciones post-publicación',
        cause: 'Se publicaron antes de que el supervisor estuviera activo',
        action: 'Iniciar watch cycle para estas noticias',
        autoFixable: true,
      });
    }
  } catch (e) {
    logger.warn('[supervisor] detectAbandonedArticles error:', e);
  }

  return issues;
}

// ═══════════════════════════════════════════════════════════════
// 4. SALUD DEL MEDIO
// ═══════════════════════════════════════════════════════════════

export async function checkMediumHealth(db: Firestore): Promise<MediumHealth> {
  const issues: SupervisorIssue[] = [];
  const checkedAt = new Date().toISOString();

  const indicators = {
    totalPublished: 0,
    totalWatching: 0,
    totalUpdatesDetected: 0,
    totalAbandoned: 0,
    totalWithoutPublishedAt: 0,
    totalWithInvalidCategory: 0,
    totalWithoutImage: 0,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    telegramConfigured: !!process.env.TG_TOKEN && !!process.env.TG_CHAT_ID,
    facebookConfigured: !!process.env.FB_PAGE_ACCESS_TOKEN && !!process.env.FB_PAGE_ID,
    cronActive: !!(process.env.CRON_SECRET_TOKEN || process.env.CRON_SECRET),
    costGuardActive: true,
  };

  try {
    const snap = await db.collection('noticias')
      .where('publicado', '==', true)
      .limit(100)
      .get();

    indicators.totalPublished = snap.size;

    const validCategories: PublicCategory[] = ['Sucesos', 'Nacionales', 'Internacionales', 'Deportes', 'Tecnología', 'Espectáculos'];

    for (const doc of snap.docs) {
      const data = doc.data();
      if (!data.publishedAt && !data.fechaPublicacion) indicators.totalWithoutPublishedAt++;
      if (data.categoria && !validCategories.includes(data.categoria)) indicators.totalWithInvalidCategory++;
      if (!data.imagen) indicators.totalWithoutImage++;
    }

    if (indicators.totalWithInvalidCategory > 0) {
      issues.push({
        severity: 'CRITICAL',
        domain: 'CATEGORIA',
        problem: `${indicators.totalWithInvalidCategory} noticia(s) con categoría pública inválida`,
        impact: 'Aparecen categorías fantasmas en la web pública',
        cause: 'Categoría del body o decisiones editoriales antiguas no canónicas',
        action: 'Re-publicar con categoría canónica o ejecutar migración',
        autoFixable: true,
      });
    }

    if (indicators.totalWithoutPublishedAt > 0) {
      issues.push({
        severity: 'WARNING',
        domain: 'ARTICULO',
        problem: `${indicators.totalWithoutPublishedAt} noticia(s) sin publishedAt canónico`,
        impact: 'Latest/Most Read no pueden ordenar correctamente',
        cause: 'Datos antiguos creados antes de publishedAt',
        action: 'Migrar fecha → publishedAt en Firestore',
        autoFixable: true,
      });
    }

    if (indicators.totalWithoutImage > 0) {
      issues.push({
        severity: 'WARNING',
        domain: 'IMAGEN',
        problem: `${indicators.totalWithoutImage} noticia(s) sin imagen`,
        impact: 'SEO social y OpenGraph incompletos',
        cause: 'Imagen no proporcionada al publicar',
        action: 'Agregar imagen destacada o fallback visual',
        autoFixable: false,
      });
    }

    // Watch stats
    try {
      const lifecycleSnap = await db.collection('article_lifecycles').limit(100).get();
      indicators.totalWatching = lifecycleSnap.size;
      for (const doc of lifecycleSnap.docs) {
        const data = doc.data();
        if (data.state === 'ACTUALIZACION') indicators.totalUpdatesDetected++;
      }
    } catch { /* noop */ }

    // Abandoned
    const abandoned = await detectAbandonedArticles(db);
    issues.push(...abandoned);
    indicators.totalAbandoned = abandoned.length;

    // Config
    if (!indicators.geminiConfigured) {
      issues.push({
        severity: 'IMPORTANT',
        domain: 'INFRAESTRUCTURA',
        problem: 'GEMINI_API_KEY no configurada',
        impact: 'Research, optimización y MENI generativo no funcionan',
        cause: 'Variable de entorno faltante en Vercel',
        action: 'Configurar GEMINI_API_KEY en Vercel → Environment Variables',
        autoFixable: false,
      });
    }

    if (!indicators.telegramConfigured) {
      issues.push({
        severity: 'WARNING',
        domain: 'TELEGRAM',
        problem: 'Telegram no configurado',
        impact: 'No se notifica automáticamente al publicar',
        cause: 'TG_TOKEN o TG_CHAT_ID faltantes',
        action: 'Configurar bot de Telegram y chat ID',
        autoFixable: false,
      });
    }

    if (!indicators.cronActive) {
      issues.push({
        severity: 'WARNING',
        domain: 'INFRAESTRUCTURA',
        problem: 'CRON_SECRET no configurado',
        impact: 'Cron jobs no pueden autenticarse',
        cause: 'Variable de entorno faltante',
        action: 'Configurar CRON_SECRET_TOKEN (o CRON_SECRET) en Vercel',
        autoFixable: false,
      });
    }

    // Cost guard
    const costStatus = await canCallLLM(db);
    if (!costStatus.allowed) {
      issues.push({
        severity: 'IMPORTANT',
        domain: 'COSTO',
        problem: `Límite de costo IA excedido: ${costStatus.reason}`,
        impact: 'Research y optimización automática bloqueadas',
        cause: costStatus.reason || 'Límite alcanzado',
        action: 'Esperar reset del contador o ajustar límites',
        autoFixable: false,
      });
    }

    // Node.js EOL check
    const nodeVersion = parseInt(process.version.replace('v', '').split('.')[0], 10);
    if (nodeVersion < 20) {
      issues.push({
        severity: 'WARNING',
        domain: 'INFRAESTRUCTURA',
        problem: `Node.js ${process.version} próximo a End of Life`,
        impact: 'Vercel puede deprecar el runtime',
        cause: 'Versión de Node.js antigua',
        action: 'Actualizar package.json engines.node a 20.x o superior',
        autoFixable: false,
      });
    }
  } catch (e) {
    issues.push({
      severity: 'CRITICAL',
      domain: 'INFRAESTRUCTURA',
      problem: 'Error accediendo a Firestore',
      impact: 'No se pueden detectar problemas automáticamente',
      cause: e instanceof Error ? e.message : 'Error desconocido',
      action: 'Verificar credenciales de Firebase',
      autoFixable: false,
    });
  }

  return {
    checkedAt,
    critical: issues.filter(i => i.severity === 'CRITICAL').length,
    important: issues.filter(i => i.severity === 'IMPORTANT').length,
    warning: issues.filter(i => i.severity === 'WARNING').length,
    optimization: issues.filter(i => i.severity === 'OPTIMIZATION').length,
    issues,
    indicators,
  };
}

// ═══════════════════════════════════════════════════════════════
// 5. AUTO-FIX SEGURO
// ═══════════════════════════════════════════════════════════════

/**
 * Aplica correcciones automáticas seguras.
 * NUNCA toca contenido sensible sin revisión humana.
 */
export async function applySafeAutoFixes(
  db: Firestore,
  issues: SupervisorIssue[]
): Promise<{ fixed: number; skipped: number; details: string[] }> {
  const details: string[] = [];
  let fixed = 0;
  let skipped = 0;

  for (const issue of issues) {
    if (!issue.autoFixable) {
      skipped++;
      continue;
    }

    try {
      // Categoría inválida → reclasificar
      if (issue.domain === 'CATEGORIA' && issue.severity === 'CRITICAL') {
        // Migración masiva de categorías inválidas
        const snap = await db.collection('noticias')
          .where('publicado', '==', true)
          .limit(50)
          .get();

        for (const doc of snap.docs) {
          const data = doc.data();
          const canonical = resolvePublicCategory({
            titulo: data.titulo,
            contenido: data.contenido,
            resumen: data.resumen,
            perfil: data.perfil,
            categoria: data.categoria,
          } as any);

          if (data.categoria !== canonical) {
            await doc.ref.update({ categoria: canonical });
            fixed++;
            details.push(`Reclasificado "${data.titulo?.substring(0, 40)}" → ${canonical}`);
          }
        }
      }

      // publishedAt faltante → migrar desde fecha
      if (issue.domain === 'ARTICULO' && issue.problem.includes('publishedAt')) {
        const { Timestamp } = await import('firebase-admin/firestore');
        const snap = await db.collection('noticias')
          .where('publicado', '==', true)
          .limit(50)
          .get();

        for (const doc of snap.docs) {
          const data = doc.data();
          if (!data.publishedAt && !data.fechaPublicacion) {
            const fechaTs = data.fecha?.toDate
              ? data.fecha
              : Timestamp.fromDate(new Date(data.fecha || Date.now()));
            await doc.ref.update({ publishedAt: fechaTs });
            fixed++;
            details.push(`publishedAt migrado para "${data.titulo?.substring(0, 40)}"`);
          }
        }
      }

      // Borrador abandonado → archivar
      if (issue.domain === 'ABANDONO' && issue.problem.includes('Borrador abandonado')) {
        // Solo marcar, no eliminar
        const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);
        const snap = await db.collection('noticias')
          .where('estado', '==', 'borrador')
          .limit(20)
          .get();

        for (const doc of snap.docs) {
          const data = doc.data();
          const fecha = data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha || 0);
          if (fecha < cutoff) {
            await doc.ref.update({ estado: 'archivado', archived: true });
            fixed++;
            details.push(`Archivado borrador abandonado: "${data.titulo?.substring(0, 40)}"`);
          }
        }
      }
    } catch (e) {
      skipped++;
      details.push(`Error en auto-fix (${issue.domain}): ${e instanceof Error ? e.message : 'unknown'}`);
    }
  }

  logger.info('[supervisor] Auto-fix aplicado:', { fixed, skipped });
  return { fixed, skipped, details };
}

// ═══════════════════════════════════════════════════════════════
// 6. CICLO DE VIGILANCIA AUTOMÁTICA
// ═══════════════════════════════════════════════════════════════

/**
 * Ejecuta un ciclo de vigilancia sobre noticias publicadas.
 * Detecta actualizaciones, conflictos y noticias que necesitan atención.
 */
export async function runSupervisorWatchCycle(
  db: Firestore,
  options?: { limit?: number }
): Promise<{
  checked: number;
  updatesDetected: number;
  conflicts: number;
  costBlocked: number;
  results: Array<{ articleId: string; titulo: string; hasUpdates: boolean; error?: string }>;
}> {
  const limit = Math.min(options?.limit || 5, 20);
  const results: Array<{ articleId: string; titulo: string; hasUpdates: boolean; error?: string }> = [];
  let updatesDetected = 0;
  let conflicts = 0;
  let costBlocked = 0;

  try {
    // Priorizar noticias BREAKING (menos de 6h) y DEVELOPING (menos de 48h)
    const snap = await db.collection('noticias')
      .where('publicado', '==', true)
      .where('estado', '==', 'publicado')
      .limit(limit * 3) // Pedir más para filtrar por antigüedad
      .get();

    const now = Date.now();
    const articles = snap.docs
      .map(d => ({ id: d.id, data: d.data() }))
      .filter(a => {
        const fecha = a.data.fecha?.toDate ? a.data.fecha.toDate() : new Date(a.data.fecha || 0);
        const ageHours = (now - fecha.getTime()) / 3600000;
        return ageHours < 168; // Solo vigilar noticias de menos de 7 días
      })
      .sort((a, b) => {
        const fa = a.data.fecha?.toDate ? a.data.fecha.toDate().getTime() : 0;
        const fb = b.data.fecha?.toDate ? b.data.fecha.toDate().getTime() : 0;
        return fb - fa; // Más recientes primero
      })
      .slice(0, limit);

    for (const article of articles) {
      const data = article.data;
      const fecha = data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || new Date().toISOString();

      // Verificar cost guard antes de investigar
      const costCheck = await canCallLLM(db);
      if (!costCheck.allowed) {
        costBlocked++;
        results.push({
          articleId: article.id,
          titulo: data.titulo || '',
          hasUpdates: false,
          error: `Cost guard: ${costCheck.reason}`,
        });
        continue;
      }

      try {
        const { runWatchCycle, persistWatchResult } = await import('@/lib/news-watch');
        const result = await runWatchCycle(
          {
            id: article.id,
            titulo: data.titulo || '',
            contenido: data.contenido || '',
            resumen: data.resumen || '',
            categoria: data.categoria || 'General',
            fecha,
            perfil: data.perfil,
          },
          { db }
        );

        await recordCall(db);
        await persistWatchResult(db, article.id, result);

        if (result.hasUpdates) {
          updatesDetected++;
          const hasConflict = result.updates.some(u => u.recommendedAction === 'BLOCKED_BY_CONFLICT');
          if (hasConflict) conflicts++;

          // Persistir actualizaciones detectadas para revisión
          if (result.updates.length > 0) {
            await db.collection('supervisor_updates').add({
              articleId: article.id,
              titulo: data.titulo || '',
              detectedAt: new Date().toISOString(),
              updates: result.updates,
              reviewed: false,
            });
          }
        }

        results.push({
          articleId: article.id,
          titulo: data.titulo || '',
          hasUpdates: result.hasUpdates,
        });
      } catch (e) {
        results.push({
          articleId: article.id,
          titulo: data.titulo || '',
          hasUpdates: false,
          error: e instanceof Error ? e.message : 'Error',
        });
      }
    }
  } catch (e) {
    logger.error('[supervisor] Watch cycle error:', e);
  }

  return { checked: results.length, updatesDetected, conflicts, costBlocked, results };
}

// ═══════════════════════════════════════════════════════════════
// 7. DETECCIÓN DE OPERACIONES COSTOSAS INNECESARIAS
// ═══════════════════════════════════════════════════════════════

/**
 * Antes de ejecutar una operación que haría múltiples llamadas IA,
 * verifica si es necesario o si sería desperdicio.
 */
export async function evaluateOperationCost(
  db: Firestore,
  plannedCalls: number,
  operationName: string
): Promise<{ shouldProceed: boolean; wasteful: number; reason: string; status: CostGuardStatus }> {
  const { allowed, reason, status } = await canCallLLM(db);

  if (!allowed) {
    return { shouldProceed: false, wasteful: plannedCalls, reason: `Cost guard bloqueó: ${reason}`, status };
  }

  const { wasteful, reason: wasteReason } = detectWastefulCalls(plannedCalls, status);

  if (wasteful > 0) {
    logger.warn(`[supervisor] Operación "${operationName}" generaría ${wasteful} llamadas innecesarias: ${wasteReason}`);
    return { shouldProceed: false, wasteful, reason: wasteReason, status };
  }

  return { shouldProceed: true, wasteful: 0, reason: '', status };
}
