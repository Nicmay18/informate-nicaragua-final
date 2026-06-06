import HomePagePro from '@/components/HomePagePro';
import { getNews, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';

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
        width: 1200,
        height: 630,
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

export const dynamic = 'force-static';
export const revalidate = 60;

export default async function HomePage() {
  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];

  try {
    [noticias, masLeidas] = await Promise.all([getNews(12), getMasLeidas()]);
  } catch (error) {
    console.error('[HomePage] Error:', error);
  }

  const heroImage = noticias[0]?.imagen || null;

  return (
    <>
      {heroImage && !heroImage.startsWith('/') && (
        <link
          rel="preload"
          as="image"
          href={`https://images.weserv.nl/?url=${encodeURIComponent(heroImage)}&output=webp&w=1200&q=75`}
          type="image/webp"
          fetchPriority="high"
          crossOrigin="anonymous"
        />
      )}
      <HomePagePro noticias={noticias} masLeidas={masLeidas} />
    </>
  );
}
