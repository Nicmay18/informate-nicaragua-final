import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { runContentIntelligence } from '../content-intelligence';
import { runBusinessV3 } from '../business';
import { buildEditorialMemory } from '../editorial-memory';
import { runSmartLinks } from '../smart-links';
import { calculateEditorialScore } from '../editorial-score';
import { runCategoryHealth } from '../category-health';

export interface CopilotRecommendation {
  question: string;
  answer: string;
  slug?: string;
  title?: string;
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export function runCopilot(noticias: Noticia[], guides: EvergreenArticle[] = []): CopilotRecommendation[] {
  const ci = runContentIntelligence(noticias, guides);
  const business = runBusinessV3(noticias, guides);
  const memory = buildEditorialMemory(noticias, guides);
  const links = runSmartLinks(noticias, guides);
  const score = calculateEditorialScore(noticias, guides);
  const { health } = runCategoryHealth(noticias);

  const recs: CopilotRecommendation[] = [];

  // portada
  const hero = ci.featuredCandidates[0];
  if (hero) {
    recs.push({
      question: '¿Qué noticia merece portada?',
      answer: hero.title,
      slug: hero.slug,
      title: hero.title,
      action: 'Fijar en portada',
      priority: 'high',
    });
  }

  // impulsar
  const boost = ci.growing[0] || ci.viral[0];
  if (boost) {
    recs.push({
      question: '¿Qué noticia debe impulsarse nuevamente?',
      answer: boost.title,
      slug: boost.slug,
      title: boost.title,
      action: 'Volver a distribuir',
      priority: 'high',
    });
  }

  // seguimiento
  const follow = memory.memories[0];
  if (follow) {
    recs.push({
      question: '¿Qué noticia necesita seguimiento?',
      answer: follow.entity,
      title: follow.chronology[follow.chronology.length - 1].title,
      slug: follow.chronology[follow.chronology.length - 1].slug,
      action: 'Publicar seguimiento',
      priority: 'medium',
    });
  }

  // convertir a guía
  const guide = ci.evergreenCandidates[0];
  if (guide) {
    recs.push({
      question: '¿Qué noticia debe convertirse en guía?',
      answer: guide.title,
      slug: guide.slug,
      title: guide.title,
      action: 'Crear guía evergreen',
      priority: 'medium',
    });
  }

  // categoría débil
  const weak = Object.entries(health).filter(([, h]) => h.level === 'bajo').sort((a, b) => a[1].count7 - b[1].count7)[0];
  if (weak) {
    recs.push({
      question: '¿Qué categoría está debilitándose?',
      answer: weak[0],
      title: weak[0],
      action: 'Planificar contenido',
      priority: 'critical',
    });
  }

  // tema creciendo
  const theme = business.recurrentThemes[0];
  if (theme) {
    recs.push({
      question: '¿Qué tema está creciendo?',
      answer: theme.name,
      title: theme.name,
      action: 'Cubrir con profundidad',
      priority: 'medium',
    });
  }

  // autor con mejores resultados
  const author = business.topAuthors[0];
  if (author) {
    recs.push({
      question: '¿Qué autor obtiene mejores resultados?',
      answer: author.name,
      title: author.name,
      action: 'Asignar contenido clave',
      priority: 'low',
    });
  }

  // actualizar
  const update = ci.updateCandidates[0];
  if (update) {
    recs.push({
      question: '¿Qué contenido conviene actualizar?',
      answer: update.title,
      slug: update.slug,
      title: update.title,
      action: 'Actualizar noticia',
      priority: 'medium',
    });
  }

  // enlaces
  const link = links[0];
  if (link) {
    recs.push({
      question: '¿Qué noticias deben enlazarse entre sí?',
      answer: `${link.sourceTitle} → ${link.targetTitle}`,
      title: `${link.sourceTitle} → ${link.targetTitle}`,
      action: 'Agregar enlace interno',
      priority: 'low',
    });
  }

  // publicar hoy
  const mix: string[] = [];
  if (health['Nacionales']?.level === 'bajo') mix.push('1 Nacional');
  if (health['Tecnología']?.level === 'bajo') mix.push('1 Tecnología');
  if (health['Internacionales']?.level === 'bajo') mix.push('1 Internacional');
  if (mix.length === 0) mix.push('1 contenido de alto interés comercial');
  recs.push({
    question: '¿Qué contenido debería publicarse hoy?',
    answer: mix.join(', '),
    title: 'Plan diario',
    action: 'Crear notas recomendadas',
    priority: 'high',
  });

  // salud
  recs.push({
    question: '¿Cuál es el Editorial Score general?',
    answer: `${score.total}/100 — ${score.verdict}`,
    title: 'Editorial Score',
    action: 'Ver detalle',
    priority: score.total < 60 ? 'critical' : 'low',
  });

  return recs;
}
