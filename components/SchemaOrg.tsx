import { Article } from '@/lib/types';
import { buildNewsArticleJsonLd, buildWebSiteJsonLd } from '@/lib/schema';

/**
 * Props para ArticleJsonLd
 */
interface ArticleJsonLdProps {
  article: Article;
  url?: string;
}

/**
 * Componente para JSON-LD de artículo de noticias
 * @param props Props del componente
 * @returns Script tag con JSON-LD
 */
export function ArticleJsonLd({ article, url }: ArticleJsonLdProps) {
  if (!article || !article.titulo) {
    return null;
  }

  try {
    const jsonLd = buildNewsArticleJsonLd(
      {
        titulo: article.titulo,
        resumen: article.resumen,
        imagen: article.imagen,
        fecha: article.fecha,
        autor: article.autor,
        categoria: article.categoria,
        contenido: article.contenido,
      },
      url || `https://nicaraguainformate.com/noticias/${article.slug}/`
    );

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    );
  } catch (error) {
    console.error('[ArticleJsonLd]', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Componente para JSON-LD del sitio web
 * @returns Script tag con JSON-LD
 */
export function WebSiteJsonLd() {
  try {
    const jsonLd = buildWebSiteJsonLd();

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    );
  } catch (error) {
    console.error('[WebSiteJsonLd]', error instanceof Error ? error.message : String(error));
    return null;
  }
}
