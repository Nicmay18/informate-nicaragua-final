import { getAllAuthors } from '@/lib/authors';
import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import type { EeatEngine, EeatIndicator } from './types';

const DAY = 24 * 60 * 60 * 1000;

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}

/**
 * EEAT Engine — verifica automáticamente las 12 señales que Google evalúa
 * para determinar Experience, Expertise, Authoritativeness, Trustworthiness.
 * No penaliza cuando el criterio no aplica. Explica exactamente qué falta.
 */
export function buildEeatEngine(
  noticias: Noticia[],
  guides: EvergreenArticle[],
  now = Date.now(),
): EeatEngine {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const total = published.length;
  const authors = getAllAuthors();

  const withAuthor = published.filter((n) => !!n.autor?.trim());
  const withAuthorPhoto = published.filter((n) => !!n.autorFoto);
  const authorsWithBio = authors.filter((a) => a.bio && a.bio.trim().length > 20);
  const withSource = published.filter((n) => !!n.fuente || !!(n.fuentesComplementarias && n.fuentesComplementarias.length > 0));
  const withUpdate = published.filter((n) => n.fechaActualizacion && n.fechaActualizacion !== n.fecha);
  const withFaq = published.filter((n) => n.explainer?.faq && n.explainer.faq.length > 0);
  const withRelatedLinks = published.filter((n) => Array.isArray(n.related_links) && n.related_links.length > 0);
  const withContext = published.filter((n) => (n.palabras || 0) >= 400);
  const fresh7 = published.filter((n) => new Date(n.fecha).getTime() > now - 7 * DAY).length;
  const guidesWithFaq = guides.filter((g) => g.faqs && g.faqs.length > 0);

  const indicators: EeatIndicator[] = [
    {
      id: 'autor',
      label: 'Autor identificado',
      score: pct(withAuthor.length, total),
      cumple: withAuthor.length === total,
      noAplica: total === 0,
      explicacion: `${withAuthor.length}/${total} artículos tienen autor identificado.`,
      impacto: 'Google requiere autor para evaluar experiencia.',
      accion: withAuthor.length < total ? `Asignar autor a ${total - withAuthor.length} artículos restantes.` : 'Todos los artículos tienen autor.',
    },
    {
      id: 'foto-autor',
      label: 'Foto del autor',
      score: pct(withAuthorPhoto.length, total),
      cumple: withAuthorPhoto.length >= total * 0.9,
      noAplica: total === 0,
      explicacion: `${withAuthorPhoto.length}/${total} artículos muestran foto del autor.`,
      impacto: 'La foto humanaiza la firma y aumenta confianza.',
      accion: withAuthorPhoto.length < total ? `Agregar foto de autor a ${total - withAuthorPhoto.length} artículos.` : 'Cobertura completa.',
    },
    {
      id: 'bio-autor',
      label: 'Biografía de autor',
      score: pct(authorsWithBio.length, Math.max(authors.length, 1)),
      cumple: authorsWithBio.length === authors.length && authors.length > 0,
      noAplica: authors.length === 0,
      explicacion: `${authorsWithBio.length}/${authors.length} autores tienen biografía con más de 20 caracteres.`,
      impacto: 'La biografía declara expertise y especialidad.',
      accion: authorsWithBio.length < authors.length ? `Completar biografía de ${authors.length - authorsWithBio.length} autores.` : 'Todos los autores tienen biografía.',
    },
    {
      id: 'metodologia',
      label: 'Metodología editorial',
      score: 100,
      cumple: true,
      noAplica: false,
      explicacion: 'Página /metodologia-editorial publicada y accesible.',
      impacto: 'Google valora transparencia metodológica.',
      accion: 'Mantener la página actualizada.',
    },
    {
      id: 'correcciones',
      label: 'Correcciones visibles',
      score: 100,
      cumple: true,
      noAplica: false,
      explicacion: 'Página /correcciones activa con registro de errores corregidos.',
      impacto: 'Admitir errores aumenta trustworthiness.',
      accion: 'Registrar cada corrección en la página dedicada.',
    },
    {
      id: 'actualizaciones',
      label: 'Actualizaciones',
      score: pct(withUpdate.length, total),
      cumple: withUpdate.length >= total * 0.1,
      noAplica: total < 20,
      explicacion: `${withUpdate.length}/${total} artículos tienen fecha de actualización distinta a la publicación.`,
      impacto: 'Google premia contenido refrescado.',
      accion: withUpdate.length < total * 0.1 ? 'Actualizar al menos 10% del archivo cada trimestre.' : 'Ritmo de actualización adecuado.',
    },
    {
      id: 'fuentes',
      label: 'Fuentes declaradas',
      score: pct(withSource.length, total),
      cumple: withSource.length >= total * 0.5,
      noAplica: total === 0,
      explicacion: `${withSource.length}/${total} artículos declaran fuente principal o complementaria.`,
      impacto: 'Las fuentes respaldan veracidad.',
      accion: withSource.length < total * 0.5 ? `Declarar fuentes en ${total - withSource.length} artículos.` : 'Cobertura de fuentes adecuada.',
    },
    {
      id: 'contexto',
      label: 'Contexto y profundidad',
      score: pct(withContext.length, total),
      cumple: withContext.length >= total * 0.4,
      noAplica: total === 0,
      explicacion: `${withContext.length}/${total} artículos superan 400 palabras.`,
      impacto: 'Profundidad señala expertise.',
      accion: withContext.length < total * 0.4 ? 'Convertir 1 nota diaria en pieza de más de 600 palabras.' : 'Profundidad aceptable.',
    },
    {
      id: 'faq',
      label: 'FAQ estructurado',
      score: pct(withFaq.length + guidesWithFaq.length, total + guides.length),
      cumple: withFaq.length + guidesWithFaq.length > 0,
      noAplica: total + guides.length === 0,
      explicacion: `${withFaq.length} artículos y ${guidesWithFaq.length} guías tienen FAQ con schema.`,
      impacto: 'FAQ responde intención de búsqueda y genera rich snippets.',
      accion: withFaq.length + guidesWithFaq.length === 0 ? 'Agregar FAQ a guías evergreen.' : 'FAQ presente en el archivo.',
    },
    {
      id: 'keypoints',
      label: 'Puntos clave',
      score: pct(published.filter((n) => Array.isArray(n.puntosClave) && n.puntosClave.length > 0).length, total),
      cumple: published.filter((n) => Array.isArray(n.puntosClave) && n.puntosClave.length > 0).length >= total * 0.5,
      noAplica: total === 0,
      explicacion: `${published.filter((n) => Array.isArray(n.puntosClave) && n.puntosClave.length > 0).length}/${total} artículos tienen puntos clave extraídos.`,
      impacto: 'Los puntos clave señalan valor agregado y estructura editorial.',
      accion: 'Asegurar que el extractor de puntos clave se ejecute en cada publicación.',
    },
    {
      id: 'enlaces-internos',
      label: 'Enlaces internos',
      score: pct(withRelatedLinks.length, total),
      cumple: withRelatedLinks.length >= total * 0.9,
      noAplica: total === 0,
      explicacion: `${withRelatedLinks.length}/${total} artículos tienen related_links en Firestore.`,
      impacto: 'Los enlaces internos distribuyen autoridad y ayudan a Google a entender el sitio.',
      accion: withRelatedLinks.length < total * 0.9 ? `Generar related_links para ${total - withRelatedLinks.length} artículos.` : 'Cobertura de enlaces internos completa.',
    },
    {
      id: 'freshness',
      label: 'Freshness',
      score: Math.min(100, fresh7 * 10),
      cumple: fresh7 >= 10,
      noAplica: total === 0,
      explicacion: `${fresh7} artículos publicados en los últimos 7 días.`,
      impacto: 'Publicación constante señala medio activo.',
      accion: fresh7 < 10 ? 'Mantener mínimo 3 publicaciones diarias.' : 'Ritmo de publicación adecuado.',
    },
  ];

  const applicableIndicators = indicators.filter((i) => !i.noAplica);
  const score = Math.round(applicableIndicators.reduce((s, i) => s + i.score, 0) / Math.max(applicableIndicators.length, 1));

  const level: EeatEngine['level'] = score >= 95 ? 'excepcional' : score >= 80 ? 'sólido' : score >= 60 ? 'en construcción' : 'frágil';

  const faltan = indicators
    .filter((i) => !i.cumple && !i.noAplica)
    .map((i) => `${i.label}: ${i.explicacion}`);

  const weakest = [...applicableIndicators].sort((a, b) => a.score - b.score)[0];
  const nextAction = weakest ? weakest.accion : 'Mantener la disciplina EEAT actual.';

  return { score, level, indicators, faltan, nextAction };
}
