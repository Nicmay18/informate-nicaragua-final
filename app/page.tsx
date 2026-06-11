import HomePagePro from '@/components/HomePagePro';
import { getLatestNews, getTrendingNews } from '@/lib/db/homepage';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';
import { getResponsiveImageUrl } from '@/lib/image-utils';

export const metadata: Metadata = {
  title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
  description:
    'Noticias de Nicaragua en tiempo real. Cobertura de sucesos, nacionales, deportes, tecnología, espectáculos e internacionales desde Managua.',
  openGraph: {
    type: 'website',
    locale: 'es_NI',
    url: 'https://nicaraguainformate.com',
    siteName: 'Nicaragua Informate',
    title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
    description: 'Portal de noticias líder de Nicaragua con cobertura verificada desde Managua y Estelí. Nacionales, sucesos, espectáculos, tecnología y deportes.',
    images: [
      {
        url: 'https://nicaraguainformate.com/logo.webp',
        width: 512,
        height: 512,
        alt: 'Nicaragua Informate — Portal de noticias de Nicaragua',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@NicInformate',
    creator: '@NicInformate',
    title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
    description: 'Portal de noticias líder de Nicaragua con cobertura verificada desde Managua y Estelí. Nacionales, sucesos, espectáculos, tecnología y deportes.',
    images: ['https://nicaraguainformate.com/logo.webp'],
  },
  alternates: {
    canonical: 'https://nicaraguainformate.com',
    languages: {
      'x-default': 'https://nicaraguainformate.com',
    },
  },
};

// ============================================================================
// ROMPER CACHÉ ESTÁTICO: el carrusel y listados siempre traen datos frescos
// ============================================================================
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];

  try {
    [noticias, masLeidas] = await Promise.all([
      getLatestNews(30),   // ← Carrusel + listados: siempre frescas
      getTrendingNews(5),  // ← Más leídas / Tendencias
    ]);
  } catch (error) {
    console.error('[HomePage] Error:', error);
  }

  const heroImage = noticias[0]?.imagen || null;

  return (
    <>
      {heroImage && (
        <link
          rel="preload"
          as="image"
          href={getResponsiveImageUrl(heroImage, 640)}
          type="image/webp"
          fetchPriority="high"
          crossOrigin="anonymous"
        />
      )}
      <HomePagePro noticias={noticias} masLeidas={masLeidas} />
    </>
  );
}
