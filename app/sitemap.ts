import type { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase-admin';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://nicaraguainformate.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/noticias`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/nosotros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contacto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/politica-editorial`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacidad`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terminos`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const snapshot = await adminDb
      .collection('noticias')
      .select('slug', 'fecha', 'fechaActualizacion')
      .limit(1000)
      .get();

    articleRoutes = snapshot.docs.map((doc) => {
      const d = doc.data();
      const date = d.fechaActualizacion?.toDate
        ? d.fechaActualizacion.toDate()
        : d.fecha?.toDate
          ? d.fecha.toDate()
          : new Date();

      return {
        url: `${baseUrl}/noticias/${d.slug}`,
        lastModified: date,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      };
    });
  } catch {
    /* Returns only static routes if Firebase is unavailable */
  }

  return [...staticRoutes, ...articleRoutes];
}
