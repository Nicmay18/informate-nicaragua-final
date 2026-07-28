/**
 * Editor Jefe — Fase 2: Ranking Editorial + Saturación de Portada
 * ================================================================
 * - computeRanking: deriva estrellas (1-5) y valores de portada/discover/facebook/servicio
 *   desde el EditorialDecision existente. No inventa scores nuevos.
 * - analyzeSaturation: analiza la portada actual y detecta saturación por categoría.
 */

import type { EditorialRanking, SaturacionPortada } from '@/lib/meni/editorial-brain/types';
import type { EditorialDecision } from '@/lib/meni/editorial-brain/types';

/**
 * Computa el ranking editorial desde los campos planos del EditorialDecision.
 * No usa scores paralelos: deriva todo del ADN NI y los campos existentes.
 */
export function computeRanking(decision: EditorialDecision): EditorialRanking {
  const score = decision.score;
  const adn = decision.editorialDna;
  const newsValue = decision.newsValue;
  const publicValue = decision.publicValue;

  // Estrellas basadas en ADN NI + valor noticioso + servicio
  const serviceScore = publicValue.ayudaAlLector ? 20 : 0;
  const combinedScore = score * 0.6 + newsValue.score * 0.2 + serviceScore * 0.2;

  let estrellas: 1 | 2 | 3 | 4 | 5;
  let etiqueta: EditorialRanking['etiqueta'];
  let valorPortada: EditorialRanking['valorPortada'];

  if (combinedScore >= 90 && adn.exclusividad.score >= 70) {
    estrellas = 5;
    etiqueta = 'Portada Principal';
    valorPortada = 'principal';
  } else if (combinedScore >= 80) {
    estrellas = 4;
    etiqueta = 'Portada';
    valorPortada = 'portada';
  } else if (combinedScore >= 65) {
    estrellas = 3;
    etiqueta = 'Destacada';
    valorPortada = 'destacada';
  } else if (combinedScore >= 45) {
    estrellas = 2;
    etiqueta = 'Secundaria';
    valorPortada = 'secundaria';
  } else {
    estrellas = 1;
    etiqueta = 'No vale portada';
    valorPortada = 'no_portada';
  }

  // Discover: basado en WOW + anti-clickbait + titulo
  const discoverScore = adn.wow.score * 0.5 + (decision.antiClickbait.veredicto === 'aprobado' ? 25 : 0) + (decision.intelligence.google.tituloSEO.length <= 60 ? 25 : 10);
  const valorDiscover: EditorialRanking['valorDiscover'] = discoverScore >= 70 ? 'Alta' : discoverScore >= 45 ? 'Media' : 'Baja';

  // Facebook: basado en cercanía + impacto + copy
  const facebookScore = newsValue.cercania * 0.4 + newsValue.impacto * 0.3 + (decision.intelligence.facebook.copy.length > 0 ? 30 : 0);
  const valorFacebook: EditorialRanking['valorFacebook'] = facebookScore >= 65 ? 'Alta' : facebookScore >= 40 ? 'Media' : 'Baja';

  // Servicio: basado en publicValue + utilityGate
  const servicioScore = publicValue.score * 0.5 + decision.utilityGate.score * 0.5;
  const valorServicio: EditorialRanking['valorServicio'] =
    servicioScore >= 80 ? 'Muy alto' : servicioScore >= 60 ? 'Alto' : servicioScore >= 40 ? 'Medio' : 'Bajo';

  const razon = `${etiqueta} — ADN NI ${score}%, exclusividad ${adn.exclusividad.score}%, servicio ${valorServicio.toLowerCase()}`;

  return {
    estrellas,
    etiqueta,
    valorPortada,
    valorDiscover,
    valorFacebook,
    valorServicio,
    razon,
  };
}

/**
 * Analiza la saturación de la portada actual.
 * Recibe las categorías de las últimas noticias publicadas.
 */
export function analyzeSaturation(
  portadaData: { categoria: string; fecha: string }[],
): SaturacionPortada {
  const total = portadaData.length;
  if (total === 0) {
    return {
      distribucion: [],
      categoriasSaturadas: [],
      categoriasFaltantes: [],
      recomendacion: 'No hay datos de portada disponibles.',
      nivelSaturacion: 'verde',
    };
  }

  // Contar por categoría
  const counts = new Map<string, number>();
  for (const item of portadaData) {
    const cat = item.categoria || 'General';
    counts.set(cat, (counts.get(cat) || 0) + 1);
  }

  const distribucion = Array.from(counts.entries())
    .map(([categoria, cantidad]) => ({
      categoria,
      cantidad,
      porcentaje: Math.round((cantidad / total) * 100),
    }))
    .sort((a, b) => b.cantidad - a.cantidad);

  // Detectar saturación: una categoría con >40% del total es saturación
  const categoriasSaturadas = distribucion
    .filter(d => d.porcentaje >= 40)
    .map(d => d.categoria);

  // Categorías que deberían estar pero no están
  const categoriasEsperadas = ['Nacionales', 'Sucesos', 'Deportes', 'Tecnología', 'Economía', 'Salud', 'Espectáculos', 'Internacionales'];
  const categoriasPresentes = new Set(distribucion.map(d => d.categoria));
  const categoriasFaltantes = categoriasEsperadas.filter(c => !categoriasPresentes.has(c));

  // Detectar si hay exceso de policiales/sucesos
  const sucesosCount = counts.get('Sucesos') || 0;
  const sucesosPct = total > 0 ? sucesosCount / total : 0;

  // Horas sin noticia positiva (deportes, tecnología, espectáculos)
  const positivas = ['Deportes', 'Tecnología', 'Espectáculos', 'Economía'];
  const ultimaPositiva = portadaData
    .filter(d => positivas.includes(d.categoria))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  const horasSinNoticiaPositiva = ultimaPositiva
    ? Math.floor((Date.now() - new Date(ultimaPositiva.fecha).getTime()) / (1000 * 60 * 60))
    : undefined;

  // Nivel de saturación
  const nivelSaturacion: SaturacionPortada['nivelSaturacion'] =
    categoriasSaturadas.length > 0 || sucesosPct > 0.5
      ? 'rojo'
      : sucesosPct > 0.35 || categoriasFaltantes.length > 4
      ? 'amarillo'
      : 'verde';

  // Generar recomendación
  let recomendacion = '';
  if (categoriasSaturadas.length > 0) {
    recomendacion = `Saturación detectada: ${categoriasSaturadas.join(', ')} representa más del 40% de la portada. `;
  }
  if (sucesosPct > 0.5) {
    recomendacion += `Exceso de notas policiales (${Math.round(sucesosPct * 100)}% de la portada). Considera publicar otra categoría. `;
  }
  if (horasSinNoticiaPositiva && horasSinNoticiaPositiva > 5) {
    recomendacion += `Hace ${horasSinNoticiaPositiva} horas no publicas una noticia positiva. `;
  }
  if (categoriasFaltantes.length > 0) {
    recomendacion += `Categorías ausentes en portada: ${categoriasFaltantes.slice(0, 3).join(', ')}. `;
  }
  if (!recomendacion) {
    recomendacion = 'Portada equilibrada. No hay saturación detectada.';
  }

  return {
    distribucion,
    categoriasSaturadas,
    categoriasFaltantes,
    recomendacion,
    nivelSaturacion,
    horasSinNoticiaPositiva,
  };
}
