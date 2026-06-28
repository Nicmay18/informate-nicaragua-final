import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/buscar',
          '/api/',
          '/admin/',
          '/_next/',
          '/js/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/buscar', '/api/', '/admin/'],
      },
      {
        userAgent: 'Googlebot-News',
        allow: '/',
        disallow: ['/buscar', '/api/', '/admin/'],
      },
      {
        userAgent: 'AdsBot-Google',
        allow: '/',
      },
    ],
    sitemap: [
      'https://nicaraguainformate.com/sitemap.xml',
      'https://nicaraguainformate.com/news-sitemap.xml',
    ],
    host: 'https://nicaraguainformate.com',
  };
}
