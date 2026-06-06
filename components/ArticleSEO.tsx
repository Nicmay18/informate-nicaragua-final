'use client';

import { useMemo } from 'react';
import Head from 'next/head';
import type { Noticia } from '@/lib/types';

interface ArticleSEOProps {
  article: Noticia;
  url: string;
}

function truncate(str: string, max: number): string {
  if (!str || str.length <= max) return str;
  return str.substring(0, max - 3).trim() + '...';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extrae el primer párrafo limpio para meta description
 */
function extractFirstParagraph(html: string): string {
  const clean = stripHtml(html);
  const sentences = clean.split(/[.!?]\s+/);
  return sentences.slice(0, 2).join('. ') + '.';
}

/**
 * Componente SEO dinámico por artículo
 * - title único
 * - meta description desde primer párrafo
 * - canonical
 * - Open Graph
 * - Twitter Card
 * - Article + Breadcrumb JSON-LD
 */
export default function ArticleSEO({ article, url }: ArticleSEOProps) {
  const seo = useMemo(() => {
    const title = `${article.titulo} | Nicaragua Informate`;
    const firstP = extractFirstParagraph(article.resumen || article.contenido || '');
    const description = truncate(firstP, 160);
    const image = article.imagen || 'https://nicaraguainformate.com/logo.webp';
    const published = article.fecha?.toString ? new Date(article.fecha.toString()).toISOString() : new Date().toISOString();
    const modified = article.fechaActualizacion?.toString
      ? new Date(article.fechaActualizacion.toString()).toISOString()
      : published;
    const category = article.categoria || 'Noticias';

    // Article structured data
    const articleLd = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.titulo,
      description,
      image: [image],
      datePublished: published,
      dateModified: modified,
      author: {
        '@type': 'Organization',
        name: 'Nicaragua Informate',
        url: 'https://nicaraguainformate.com/nosotros',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Nicaragua Informate',
        logo: {
          '@type': 'ImageObject',
          url: 'https://nicaraguainformate.com/logo.webp',
          width: 1200,
          height: 630,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
      articleSection: category,
      inLanguage: 'es-NI',
    };

    // Breadcrumb structured data
    const breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: 'https://nicaraguainformate.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: category,
          item: `https://nicaraguainformate.com/categoria/${encodeURIComponent(category.toLowerCase())}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: article.titulo,
          item: url,
        },
      ],
    };

    return { title, description, image, articleLd, breadcrumbLd };
  }, [article, url]);

  return (
    <Head>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:locale" content="es_NI" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:site_name" content="Nicaragua Informate" />
      <meta property="article:published_time" content={seo.articleLd.datePublished} />
      <meta property="article:modified_time" content={seo.articleLd.dateModified} />
      <meta property="article:section" content={article.categoria || 'Noticias'} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@NicInformate" />
      <meta name="twitter:creator" content="@NicInformate" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.breadcrumbLd) }}
      />
    </Head>
  );
}
