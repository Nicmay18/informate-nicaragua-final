import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/_next/', '/opengraph-image', '/js/'],
        disallow: ['/buscar', '/api/', '/admin/', '/cdn-cgi/'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/_next/', '/opengraph-image', '/js/'],
        disallow: ['/buscar', '/api/', '/admin/', '/cdn-cgi/'],
      },
      {
        userAgent: 'Googlebot-News',
        allow: ['/', '/_next/', '/opengraph-image', '/js/'],
        disallow: ['/buscar', '/api/', '/admin/', '/cdn-cgi/'],
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
