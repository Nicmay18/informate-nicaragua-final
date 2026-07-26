import { generarTituloSEO, generarMetaDescription } from '@/lib/editorial/meta';
import type { EvaluacionEditorial } from '@/lib/editorial';
import type { NoticiaInput, MeniSEO } from './types';
import { slugify } from './utils/helpers';
import { extractKeywords } from './utils/keywords';

export function analyzeSEO(result: EvaluacionEditorial, noticia: NoticiaInput): MeniSEO {
  const seo = result.evidence.seo;
  const score = result.seo.score ?? 0;

  const tituloSEO = generarTituloSEO(noticia.titulo, noticia.categoria, noticia.departamento);
  const tituloDiscover = noticia.titulo;
  const textoPlano = result.evidence.textoPlano ?? noticia.contenido;
  const metaDescripcion = generarMetaDescription(textoPlano, noticia.resumen);
  const slug = noticia.slug || slugify(noticia.titulo);
  const keywords = seo.keywords?.length
    ? seo.keywords.slice(0, 12)
    : extractKeywords(`${noticia.titulo} ${noticia.contenido}`, 12);

  return {
    score: Math.round(score),
    tituloSEO,
    tituloDiscover,
    metaDescripcion,
    slug,
    keywords,
  };
}
