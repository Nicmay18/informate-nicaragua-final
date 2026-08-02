import { getNews } from '@/lib/data';
import { EVERGREEN_ARTICLES } from '@/lib/evergreen';
import type { Noticia } from '@/lib/types';
import type { NiosModuleReport, NiosRecommendation } from './types';
import { daysAgo, rec, sortByPriority, trackError } from './utils';

function classifyLifecycle(n: Noticia): string {
  const age = daysAgo(n.fecha);
  const v = n.vistas || 0;
  const updated = daysAgo(n.fechaActualizacion || n.fecha);

  if (age <= 1) return 'recién_publicada';
  if (age <= 7 && v > 10) return 'creciendo';
  if (age <= 30 && v >= 5) return 'estable';
  if (age > 60 && v < 3) return 'decay';
  if (age > 90 && v >= 10 && updated > 60) return 'candidata_actualizacion';
  if (v >= 30 && age > 30) return 'candidata_guia';
  return 'estable';
}

export async function runContentLifecycle(): Promise<NiosModuleReport> {
  try {
    const noticias = await getNews(300);
    if (noticias.length === 0) {
      return { module: 'contentLifecycle', status: 'ok', summary: 'Sin noticias para ciclo de vida.', metrics: [], recommendations: [] };
    }

    const lifecycle = noticias.reduce<Record<string, Noticia[]>>((acc, n) => {
      const state = classifyLifecycle(n);
      acc[state] = acc[state] || [];
      acc[state].push(n);
      return acc;
    }, {});

    const published = (lifecycle.recién_publicada || []).length;
    const growing = (lifecycle.creciendo || []).length;
    const stable = (lifecycle.estable || []).length;
    const decay = (lifecycle.decay || []).length;
    const updateCandidates = (lifecycle.candidata_actualizacion || []).length;
    const guideCandidates = (lifecycle.candidata_guia || []).length;
    const archivable = noticias.filter((n) => n.estado === 'publicado' && daysAgo(n.fecha) > 365 && (n.vistas || 0) < 5).length;

    const newGuideCandidates = guideCandidates;

    const recommendations: NiosRecommendation[] = [];

    if (published > 0) {
      recommendations.push(rec(`${published} noticias recién publicadas`, 'Revisar distribución y posicionamiento SEO.', 'medium', 'Verificar meta, keywords y distribución en redes.', 'contentLifecycle'));
    }

    if (growing > 0) {
      recommendations.push(rec(`${growing} noticias en crecimiento`, 'Buen momento para potenciarlas.', 'medium', 'Impulsar en newsletter, redes y enlaces internos.', 'contentLifecycle'));
    }

    if (decay > 0) {
      recommendations.push(rec(`${decay} noticias en decay`, 'Tráfico bajo y edad avanzada.', 'medium', 'Actualizar título/meta o redirigir a una guía evergreen.', 'contentLifecycle'));
    }

    if (updateCandidates > 0) {
      recommendations.push(rec(`${updateCandidates} noticias candidatas a actualización`, 'Contenido con tráfico pero desactualizado.', 'high', 'Actualizar datos, fechas y ampliar el cuerpo.', 'contentLifecycle'));
    }

    if (newGuideCandidates > 0) {
      recommendations.push(rec(`${newGuideCandidates} noticias con potencial de guía`, 'Temas recurrentes con alta demanda.', 'high', `Evaluar convertir en guía evergreen. Existentes: ${EVERGREEN_ARTICLES.length}.`, 'contentLifecycle'));
    }

    if (archivable > 0) {
      recommendations.push(rec(`${archivable} noticias archivables`, 'Más de un año y muy pocas vistas.', 'low', 'Archivar o consolidar en contenido evergreen.', 'contentLifecycle'));
    }

    return {
      module: 'contentLifecycle',
      status: recommendations.length ? 'opportunity' : 'ok',
      summary: `Ciclo de contenido: ${published} recientes, ${growing} creciendo, ${stable} estables, ${decay} decay, ${updateCandidates} por actualizar.`,
      metrics: [
        { label: 'Recién publicadas', value: published },
        { label: 'Creciendo', value: growing },
        { label: 'Estables', value: stable },
        { label: 'Decay', value: decay },
        { label: 'Candidatas a actualizar', value: updateCandidates },
        { label: 'Candidatas a guía', value: newGuideCandidates },
        { label: 'Archivables', value: archivable },
      ],
      recommendations: sortByPriority(recommendations),
    };
  } catch (err) {
    return { module: 'contentLifecycle', status: 'requires_attention', summary: 'Módulo de ciclo de vida falló.', metrics: [], recommendations: [rec('Error en Content Lifecycle', trackError('contentLifecycle', err), 'critical', 'Revisar conexión con Firestore.', 'contentLifecycle')], errors: [trackError('contentLifecycle', err)] };
  }
}
