import { MetadataRoute } from 'next';
import { getNews } from '@/lib/data';

const BASE_URL = 'https://www.nicaraguainformate.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const noticias = await getNews(100);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/noticias`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/legal`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  const articlePages: MetadataRoute.Sitemap = noticias.map((n) => ({
    url: `${BASE_URL}/noticias/${n.slug}`,
    lastModified: n.fecha ? new Date(n.fecha) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...articlePages];
}
