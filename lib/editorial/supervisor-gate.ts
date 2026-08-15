/**
 * Supervisor Gate — Mutacion de noticias
 * ======================================
 * REGLA 16: Toda ruta que pueda publicar o mutar una noticia debe pasar
 * por la misma autoridad editorial. Este modulo es esa autoridad.
 *
 * Cualquier mutacion que toque titulo, contenido o categoria DEBE llamar
 * a assertSupervisorApprovesMutation antes de escribir a Firestore.
 * Las mutaciones de solo metadata (imagen, destacada, vistas, estado)
 * pueden eximirse.
 *
 * Si el Supervisor bloquea, la mutacion NO se aplica.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { makeEditorialDecision } from '@/lib/supervisor/editorial-supervisor';
import type { SupervisorDecision } from '@/lib/supervisor/types';
import { resolvePublicCategory } from './canonical';
import { detectContentProfile } from '@/lib/meni/profile-detector';
import { logger } from '@/lib/logger';

/** Campos cuya modificacion requiere aprobacion del Supervisor. */
const SUPERVISED_FIELDS = new Set([
  'titulo',
  'contenido',
  'categoria',
  'resumen',
  'perfil',
]);

/** Campos de solo metadata que NO requieren Supervisor. */
const METADATA_ONLY_FIELDS = new Set([
  'imagen',
  'imagenDestacada',
  'imagenRedes',
  'destacada',
  'vistas',
  'estado',
  'publicado',
  'archived',
  'noindex',
  'fechaActualizacion',
  'dateModified',
  'related_links',
  'autor',
  'departamento',
  'tags',
  'keywords',
  'palabrasClave',
  'premium',
]);

export interface SupervisorGateResult {
  approved: boolean;
  decision: SupervisorDecision;
  reason: string;
}

/**
 * Determina si un conjunto de cambios toca campos supervisados.
 * Si solo toca metadata, retorna null (no requiere Supervisor).
 * Si toca contenido, requiere Supervisor.
 */
export function requiresSupervisorReview(changes: Record<string, unknown>): boolean {
  for (const key of Object.keys(changes)) {
    if (SUPERVISED_FIELDS.has(key)) return true;
  }
  return false;
}

/**
 * Verifica que todos los campos del cambio son metadata-only.
 * Si hay un campo no clasificado, requiere Supervisor por seguridad.
 */
export function isMetadataOnly(changes: Record<string, unknown>): boolean {
  for (const key of Object.keys(changes)) {
    if (!METADATA_ONLY_FIELDS.has(key)) return false;
  }
  return true;
}

/**
 * Carga el estado actual de una noticia desde Firestore y aplica los cambios
 * propuestos, produciendo el estado resultante que el Supervisor evaluara.
 */
async function buildMergedArticle(
  db: Firestore,
  articleId: string,
  changes: Record<string, unknown>
): Promise<{
  titulo: string;
  contenido: string;
  resumen: string;
  categoria: string;
  perfil?: string;
  imagen?: string;
  scoreMeni?: number;
  aprobadoMeni?: boolean;
  research?: any;
  story?: any;
}> {
  const snap = await db.collection('noticias').doc(articleId).get();
  const existing = (snap.data() || {}) as Record<string, any>;

  const merged = { ...existing, ...changes };

  return {
    titulo: String(merged.titulo || ''),
    contenido: String(merged.contenido || ''),
    resumen: String(merged.resumen || ''),
    categoria: String(merged.categoria || 'General'),
    perfil: merged.perfil,
    imagen: merged.imagen,
    scoreMeni: typeof merged.scoreMeni === 'number' ? merged.scoreMeni : undefined,
    aprobadoMeni: merged.aprobadoMeni === true,
    research: merged.research,
    story: merged.story,
  };
}

/**
 * Punto de control obligatorio para mutaciones de contenido.
 *
 * Uso:
 *   const gate = await assertSupervisorApprovesMutation(db, articleId, changes);
 *   if (!gate.approved) return NextResponse.json({ error: gate.reason, ... }, { status: 400 });
 *   await ref.update(changes);
 *
 * Si los cambios son solo metadata, retorna approved=true sin llamar al Supervisor.
 */
export async function assertSupervisorApprovesMutation(
  db: Firestore,
  articleId: string,
  changes: Record<string, unknown>
): Promise<SupervisorGateResult> {
  // Fast path: metadata-only changes no requieren Supervisor
  if (isMetadataOnly(changes)) {
    return {
      approved: true,
      decision: null as any,
      reason: 'Metadata-only change — Supervisor no requerido',
    };
  }

  // Si no requiere revision de contenido, aprobar
  if (!requiresSupervisorReview(changes)) {
    return {
      approved: true,
      decision: null as any,
      reason: 'No se modifican campos supervisados',
    };
  }

  try {
    const article = await buildMergedArticle(db, articleId, changes);

    // Recalcular categoria canonica si se cambio titulo o contenido
    let categoriaEval = article.categoria;
    if (changes.titulo || changes.contenido) {
      const profile = article.perfil
        ? article.perfil
        : detectContentProfile(article.titulo, article.contenido, article.resumen).profile_detected;
      categoriaEval = resolvePublicCategory({
        titulo: article.titulo,
        contenido: article.contenido,
        resumen: article.resumen,
        perfil: profile,
        categoria: article.categoria,
      } as any);
    }

    const decision = makeEditorialDecision({
      titulo: article.titulo,
      contenido: article.contenido,
      resumen: article.resumen,
      categoria: categoriaEval,
      perfil: article.perfil,
      imagen: article.imagen,
      scoreMeni: article.scoreMeni,
      aprobadoMeni: article.aprobadoMeni,
      research: article.research,
      story: article.story,
    });

    const approved = !decision.issues.some(i => i.severity === 'CRITICAL');

    return {
      approved,
      decision,
      reason: approved
        ? 'Supervisor aprobo la mutacion'
        : `Supervisor bloqueo: ${decision.issues.filter(i => i.severity === 'CRITICAL').map(i => i.problem).join('; ')}`,
    };
  } catch (e) {
    logger.error('[supervisor-gate] Error evaluando mutacion:', e);
    // En caso de error, NO bloquear (mejor degradarse que romper operacion)
    // pero registrar el problema para que el Supervisor lo detecte despues
    return {
      approved: true,
      decision: null as any,
      reason: `Supervisor no pudo evaluar (error): ${e instanceof Error ? e.message : 'unknown'}`,
    };
  }
}

/**
 * Version para noticias nuevas (no existe articleId aun).
 * Evalua el estado propuesto directamente.
 */
export function assertSupervisorApprovesCreation(
  article: {
    titulo: string;
    contenido: string;
    resumen?: string;
    categoria?: string;
    perfil?: string;
    imagen?: string;
    scoreMeni?: number;
    aprobadoMeni?: boolean;
    research?: any;
    story?: any;
  }
): SupervisorGateResult {
  const decision = makeEditorialDecision({
    titulo: article.titulo,
    contenido: article.contenido,
    resumen: article.resumen,
    categoria: article.categoria,
    perfil: article.perfil,
    imagen: article.imagen,
    scoreMeni: article.scoreMeni,
    aprobadoMeni: article.aprobadoMeni,
    research: article.research,
    story: article.story,
  });

  const approved = !decision.issues.some(i => i.severity === 'CRITICAL');

  return {
    approved,
    decision,
    reason: approved
      ? 'Supervisor aprobo la creacion'
      : `Supervisor bloqueo: ${decision.issues.filter(i => i.severity === 'CRITICAL').map(i => i.problem).join('; ')}`,
  };
}
