/**
 * Homepage Audit — Auditoría editorial del index
 * ================================================
 * Vigila la homepage NO solo para comprobar si carga.
 * Evalúa jerarquía editorial, actualidad, equilibrio, repetición,
 * títulos débiles, imágenes, densidad móvil, y huecos editoriales.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { HomepageAudit, SupervisorIssue } from './types';
import { logger } from '@/lib/logger';

const VALID_CATEGORIES = ['Sucesos', 'Nacionales', 'Internacionales', 'Deportes', 'Tecnología', 'Espectáculos'];

/**
 * Carga las noticias que la homepage realmente muestra.
 * Usa el mismo ordenamiento que lib/data.ts: publishedAt desc.
 */
async function loadHomepageArticles(db: Firestore, limit = 30): Promise<Array<{
  id: string;
  titulo: string;
  categoria: string;
  imagen?: string;
  publishedAt?: any;
  fecha?: any;
  fechaPublicacion?: any;
  perfil?: string;
  views?: number;
}>> {
  try {
    const snap = await db.collection('noticias')
      .where('publicado', '==', true)
      .where('estado', '==', 'publicado')
      .limit(limit * 2)
      .get();

    const now = Date.now();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(a => {
        // Solo noticias publicadas (no archivadas, no noindex en portada)
        if (a.archived) return false;
        if (a.noindex) return false;
        return true;
      })
      .sort((a, b) => {
        const pa = a.publishedAt?.toDate ? a.publishedAt.toDate().getTime() :
                   a.fechaPublicacion ? new Date(a.fechaPublicacion).getTime() :
                   a.fecha?.toDate ? a.fecha.toDate().getTime() : 0;
        const pb = b.publishedAt?.toDate ? b.publishedAt.toDate().getTime() :
                   b.fechaPublicacion ? new Date(b.fechaPublicacion).getTime() :
                   b.fecha?.toDate ? b.fecha.toDate().getTime() : 0;
        return pb - pa;
      })
      .slice(0, limit);
  } catch (e) {
    logger.warn('[homepage-audit] Error cargando artículos:', e);
    return [];
  }
}

/**
 * Detecta títulos débiles.
 * Un título es débil si: muy corto, muy genérico, o parece clickbait.
 */
function isWeakTitle(titulo: string): boolean {
  const wordCount = titulo.trim().split(/\s+/).length;
  if (wordCount < 4) return true;
  if (titulo.length < 25) return true;
  // Patrones genéricos
  const generic = /^(hallan|encuentran|se\s+reporta|sucede|ocurre|noticia|evento)\s/i;
  if (generic.test(titulo.trim())) return true;
  // Clickbait
  const clickbait = /(no\s+creerás|no\s+vas\s+a\s+creer|te\s+va\s+a|increíble|impresionante|shock|you\s+won't\s+believe)/i;
  if (clickbait.test(titulo)) return true;
  return false;
}

/**
 * Detecta títulos duplicados o demasiado similares.
 */
function findDuplicateTitles(titulos: string[]): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const t of titulos) {
    const normalized = t.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    const key = normalized.split(/\s+/).slice(0, 5).join(' '); // primeras 5 palabras
    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
    }
  }
  return duplicates;
}

/**
 * Ejecuta la auditoría completa de la homepage.
 */
export async function auditHomepage(db: Firestore): Promise<HomepageAudit> {
  const issues: SupervisorIssue[] = [];
  const checkedAt = new Date().toISOString();
  const recommendations: string[] = [];

  const articles = await loadHomepageArticles(db, 30);

  if (articles.length === 0) {
    issues.push({
      severity: 'CRITICAL',
      domain: 'HOMEPAGE',
      problem: 'La homepage no tiene noticias para mostrar',
      impact: 'El medio se ve vacío — impacto directo en tráfico y credibilidad',
      cause: 'No hay noticias publicadas o Firestore no responde',
      action: 'Publicar noticias inmediatamente o verificar conexión a Firestore',
      autoFixable: false,
    });
    return {
      checkedAt,
      issues,
      metrics: {
        totalArticles: 0,
        categoryBalance: {},
        oldestArticleAgeHours: 0,
        titlesWeak: 0,
        imagesMissing: 0,
        duplicateTitles: 0,
      },
      recommendations: ['Publicar contenido urgente'],
    };
  }

  // ── Métricas ─────────────────────────────────────────────────
  const categoryBalance: Record<string, number> = {};
  let titlesWeak = 0;
  let imagesMissing = 0;
  let oldestAgeHours = 0;

  const now = Date.now();
  const titulos: string[] = [];

  for (const a of articles) {
    // Balance de categorías
    const cat = a.categoria || 'Nacionales';
    categoryBalance[cat] = (categoryBalance[cat] || 0) + 1;

    // Categoría inválida en portada
    if (!VALID_CATEGORIES.includes(cat)) {
      issues.push({
        severity: 'WARNING',
        domain: 'HOMEPAGE',
        problem: `Artículo en portada con categoría inválida: "${cat}" — "${a.titulo?.substring(0, 40)}"`,
        impact: 'Categoría fantasma visible en la web pública',
        cause: 'Categoría no canónica no fue corregida al publicar',
        action: 'Reclasificar a categoría canónica',
        autoFixable: true,
      });
    }

    // Título débil
    if (isWeakTitle(a.titulo || '')) {
      titlesWeak++;
    }

    // Imagen faltante
    if (!a.imagen || a.imagen.trim() === '') {
      imagesMissing++;
    }

    // Antigüedad
    const pa = a.publishedAt?.toDate ? a.publishedAt.toDate().getTime() :
               a.fechaPublicacion ? new Date(a.fechaPublicacion).getTime() :
               a.fecha?.toDate ? a.fecha.toDate().getTime() : 0;
    if (pa > 0) {
      const ageH = (now - pa) / 3600000;
      if (ageH > oldestAgeHours) oldestAgeHours = ageH;
    }

    titulos.push(a.titulo || '');
  }

  // ── Detección de problemas editoriales ───────────────────────

  // 1. Noticias demasiado antiguas en portada
  if (oldestAgeHours > 72) {
    issues.push({
      severity: 'WARNING',
      domain: 'HOMEPAGE',
      problem: `La noticia más antigua en portada tiene ${Math.floor(oldestAgeHours)} horas`,
      impact: 'La portada se ve desactualizada — afecta CTR y retorno de lectores',
      cause: 'No hay flujo constante de publicación',
      action: 'Publicar contenido fresco o mover noticias antiguas fuera de portada',
      autoFixable: false,
    });
    recommendations.push('Publicar al menos 1 noticia fresca cada 24h');
  }

  // 2. Desequilibrio de categorías
  const totalArticles = articles.length;
  for (const [cat, count] of Object.entries(categoryBalance)) {
    const pct = count / totalArticles;
    if (pct > 0.6 && totalArticles > 5) {
      issues.push({
        severity: 'OPTIMIZATION',
        domain: 'HOMEPAGE',
        problem: `Saturación de categoría "${cat}": ${count}/${totalArticles} (${Math.round(pct * 100)}%)`,
        impact: 'Portada monótona — lectores interesados en otras categorías no encuentran variedad',
        cause: 'Publicación concentrada en una sola categoría',
        action: 'Diversificar publicación o promover noticias de otras categorías',
        autoFixable: false,
      });
      recommendations.push(`Reducir densidad de ${cat} en portada`);
    }
  }

  // 3. Títulos débiles
  if (titlesWeak > 0) {
    issues.push({
      severity: titlesWeak > totalArticles * 0.3 ? 'IMPORTANT' : 'WARNING',
      domain: 'TITULO',
      problem: `${titlesWeak} noticia(s) en portada con título débil o genérico`,
      impact: 'CTR bajo en homepage y Google Discover',
      cause: 'Títulos demasiado cortos, genéricos o clickbait',
      action: 'Reescribir títulos con elementos periodísticos concretos',
      autoFixable: false,
    });
    recommendations.push('Reescribir títulos débiles antes de la próxima publicación');
  }

  // 4. Imágenes faltantes en portada
  if (imagesMissing > 0) {
    issues.push({
      severity: imagesMissing > totalArticles * 0.3 ? 'IMPORTANT' : 'WARNING',
      domain: 'IMAGEN',
      problem: `${imagesMissing} noticia(s) en portada sin imagen`,
      impact: 'Portada visualmente pobre — afecta CTR, Discover y experiencia móvil',
      cause: 'No se proporcionó imagen al publicar',
      action: 'Agregar imagen destacada a todas las noticias en portada',
      autoFixable: false,
    });
  }

  // 5. Títulos duplicados
  const duplicates = findDuplicateTitles(titulos);
  if (duplicates > 0) {
    issues.push({
      severity: 'WARNING',
      domain: 'HOMEPAGE',
      problem: `${duplicates} par(es) de títulos demasiado similares en portada`,
      impact: 'Confusión del lector y canibalización SEO',
      cause: 'Mismo evento cubierto múltiples veces sin diferenciación',
      action: 'Diferenciar títulos o consolidar coberturas',
      autoFixable: false,
    });
  }

  // 6. Huecos editoriales — categorías sin representación
  for (const validCat of VALID_CATEGORIES) {
    if (!categoryBalance[validCat] && totalArticles > 10) {
      issues.push({
        severity: 'OPTIMIZATION',
        domain: 'HOMEPAGE',
        problem: `Categoría "${validCat}" sin representación en portada`,
        impact: 'Lectores de esa categoría no encuentran contenido — hueco editorial',
        cause: 'No se ha publicado contenido de esta categoría recientemente',
        action: `Considerar publicar contenido de ${validCat}`,
        autoFixable: false,
      });
      recommendations.push(`Cubrir hueco editorial en ${validCat}`);
    }
  }

  // 7. Noticia enterrada con potencial (views altas pero posición baja)
  const sortedByViews = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0));
  const topViewed = sortedByViews[0];
  if (topViewed && (topViewed.views || 0) > 100) {
    const position = articles.findIndex(a => a.id === topViewed.id);
    if (position > 10) {
      issues.push({
        severity: 'OPTIMIZATION',
        domain: 'HOMEPAGE',
        problem: `Noticia con ${topViewed.views} vistas está enterrada en posición ${position + 1}`,
        impact: 'Se está perdiendo tráfico — la noticia con mayor tracción no está visible',
        cause: 'Ordenamiento por fecha sin considerar tracción real',
        action: `Considerar promover "${topViewed.titulo?.substring(0, 40)}" a posición superior`,
        autoFixable: false,
      });
      recommendations.push(`Promover "${topViewed.titulo?.substring(0, 30)}..." — alta tracción pero enterrada`);
    }
  }

  return {
    checkedAt,
    issues,
    metrics: {
      totalArticles,
      categoryBalance,
      oldestArticleAgeHours: Math.floor(oldestAgeHours),
      titlesWeak,
      imagesMissing,
      duplicateTitles: duplicates,
    },
    recommendations,
  };
}
