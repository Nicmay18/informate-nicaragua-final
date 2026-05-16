import { MetadataRoute } from 'next';
import { getNews } from '@/lib/data';

const BASE_URL = 'https://www.nicaraguainformate.com';

/** Mapa de slug URL → nombre de categoría (con tilde) */
const CATEGORIA_MAP: Record<string, string> = {
  sucesos: 'Sucesos',
  nacionales: 'Nacionales',
  deportes: 'Deportes',
  internacionales: 'Internacionales',
  tecnologia: 'Tecnología',
  espectaculos: 'Espectáculos',
};

const CATEGORIA_SLUGS = Object.keys(CATEGORIA_MAP);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let noticias: any[] = [];

  try {
    noticias = await getNews(100);
  } catch {
    console.warn('[sitemap] No se pudieron obtener noticias, generando solo URLs estáticas');
  }

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/noticias`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...CATEGORIA_SLUGS.map((slug) => ({
      url: `${BASE_URL}/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    { url: `${BASE_URL}/nosotros`, lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contacto`, lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacidad`, lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/terminos`, lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/politica-editorial`, lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/cookies`, lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/autor/keyling-rivera`, lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.3 },
  ];

  if (noticias.length === 0) {
    return staticPages;
  }

  // Artículos: priority y changeFrequency según antigüedad real
  const now = new Date();
  const articlePages: MetadataRoute.Sitemap = noticias.map((n) => {
    const fecha = n.fecha ? new Date(n.fecha) : now;
    const dias = Math.floor((now.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));

    let priority = 0.5;
    if (dias < 3) priority = 0.8;
    else if (dias < 7) priority = 0.7;
    else if (dias < 30) priority = 0.6;

    let changeFrequency: 'daily' | 'weekly' | 'monthly' = 'monthly';
    if (dias < 7) changeFrequency = 'daily';
    else if (dias < 30) changeFrequency = 'weekly';

    return {
      url: `${BASE_URL}/noticias/${n.slug}`,
      lastModified: fecha,
      changeFrequency,
      priority,
    };
  });

  return [...staticPages, ...articlePages];
}
