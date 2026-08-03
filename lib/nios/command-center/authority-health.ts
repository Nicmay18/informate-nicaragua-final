import { getAllAuthors } from '@/lib/authors';
import type { Noticia } from '@/lib/types';

export interface AuthorityPillar {
  id: string;
  label: string;
  score: number;
  weight: number;
  note: string;
}

export interface AuthorityHealth {
  score: number;
  pillars: AuthorityPillar[];
  verdict: string;
  nextMilestone: string;
}

/**
 * Mide la autoridad editorial del medio basándose en señales EEAT:
 * autores verificados, fuentes declaradas, actualizaciones y páginas de confianza.
 */
export function buildAuthorityHealth(noticias: Noticia[]): AuthorityHealth {
  const published = noticias.filter((n) => n.estado === 'publicado');
  const total = published.length || 1;

  const authors = getAllAuthors();
  const withAuthor = published.filter(
    (n) => n.autor && authors.some((a) => a.name === n.autor?.trim())
  );
  const authorsWithPhoto = authors.filter((a) => a.photo).length;

  const withSource = published.filter(
    (n) => !!n.fuente || !!(n.fuentesComplementarias && n.fuentesComplementarias.length > 0)
  );

  const updated = published.filter(
    (n) => n.fechaActualizacion && n.fechaActualizacion !== n.fecha
  );

  const authorScore = Math.round(
    ((withAuthor.length / total) * 0.7 + (authorsWithPhoto / Math.max(authors.length, 1)) * 0.3) * 100
  );
  const sourceScore = Math.round((withSource.length / total) * 100);
  const updateScore = Math.round((updated.length / total) * 100);

  const pillars: AuthorityPillar[] = [
    {
      id: 'authors',
      label: 'Autores completos',
      score: authorScore,
      weight: 0.25,
      note: `${withAuthor.length} noticias con autor verificado; ${authorsWithPhoto}/${authors.length} autores con foto`,
    },
    {
      id: 'sources',
      label: 'Noticias con fuentes',
      score: sourceScore,
      weight: 0.25,
      note: `${withSource.length} noticias declaran fuente principal o complementaria`,
    },
    {
      id: 'updated',
      label: 'Artículos actualizados',
      score: updateScore,
      weight: 0.2,
      note: `${updated.length} noticias tienen fecha de actualización distinta a la publicación`,
    },
    {
      id: 'pages',
      label: 'Páginas confianza',
      score: 100,
      weight: 0.15,
      note: '/autoridad, /correcciones y /politica-editorial disponibles',
    },
    {
      id: 'transparency',
      label: 'Transparencia',
      score: 100,
      weight: 0.15,
      note: 'Metodología, uso de IA y política de fuentes publicadas',
    },
  ];

  const score = Math.round(pillars.reduce((acc, p) => acc + p.score * p.weight, 0));

  let stage = 'crítica';
  if (score >= 80) stage = 'sólida';
  else if (score >= 60) stage = 'en crecimiento';
  else if (score >= 40) stage = 'incipiente';

  return {
    score,
    pillars,
    verdict: `Autoridad editorial ${stage} (${score}/100).`,
    nextMilestone: 'Aumentar noticias con fuente declarada y autor verificado.',
  };
}
