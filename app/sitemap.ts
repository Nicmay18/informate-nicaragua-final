import { MetadataRoute } from 'next';
import { getNews } from '@/lib/data';
import { isToxicSlug } from '@/lib/seo-toxic';

const baseUrl = 'https://nicaraguainformate.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // URLs estáticas del sitio
  const staticUrls: MetadataRoute.Sitemap = [
    // Homepage
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Listado general de noticias
    {
      url: `${baseUrl}/noticias`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // CATEGORÍAS (rutas limpias /categoria/[slug])
    {
      url: `${baseUrl}/categoria/sucesos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categoria/nacionales`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categoria/deportes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categoria/internacionales`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categoria/tecnologia`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categoria/espectaculos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // Listado de categorías
    {
      url: `${baseUrl}/categoria`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Páginas legales y de información
    {
      url: `${baseUrl}/nosotros`,
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/politica-editorial`,
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/correcciones`,
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/autor/keyling-rivera`,
      lastModified: new Date('2026-05-15'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // ARTÍCULOS DINÁMICOS desde Firebase
  try {
    const articles = await getNews(500); // Obtener hasta 500 artículos

    // Excluir artículos con slugs tóxicos del sitemap (AdSense remediation)
    const cleanArticles = articles.filter(article => !isToxicSlug(article.slug));

    const articleUrls: MetadataRoute.Sitemap = cleanArticles.map((article) => {
      const publishedAt = article.fecha ? new Date(article.fecha) : new Date();
      const now = new Date();
      const daysSincePublished = Math.floor(
        (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Priority basada en antigüedad REAL
      let priority = 0.5;
      if (daysSincePublished < 3) priority = 0.8;
      else if (daysSincePublished < 7) priority = 0.7;
      else if (daysSincePublished < 30) priority = 0.6;

      // changeFrequency basada en antigüedad
      const changeFrequency = daysSincePublished < 7 ? 'daily' : 'weekly';

      return {
        url: `${baseUrl}/noticias/${article.slug}`,
        lastModified: publishedAt,
        changeFrequency,
        priority,
      };
    });

    return [...staticUrls, ...articleUrls];
  } catch (error) {
    console.error('[Sitemap] Error fetching articles:', error);
    // Fallback: solo URLs estáticas si Firebase falla
    return staticUrls;
  }
}
