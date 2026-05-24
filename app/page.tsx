import HomePagePro from '@/components/HomePagePro';
import { getNews, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
  description:
    'Portal de noticias de Nicaragua con cobertura nacional e internacional. Periodismo verificado desde Managua sobre nacionales, sucesos, espectáculos, internacionales, tecnología y deportes.',
  openGraph: {
    type: 'website',
    locale: 'es_NI',
    url: 'https://nicaraguainformate.com',
    siteName: 'Nicaragua Informate',
    title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
    description: 'Portal de noticias líder de Nicaragua con cobertura verificada desde Managua y Estelí. Nacionales, sucesos, espectáculos, tecnología y deportes.',
    images: [
      {
        url: 'https://nicaraguainformate.com/logo.png',
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
    images: ['https://nicaraguainformate.com/logo.png'],
  },
  alternates: {
    canonical: 'https://nicaraguainformate.com',
    languages: {
      'es-NI': 'https://nicaraguainformate.com',
      'es-US': 'https://nicaraguainformate.com',
      'es-MX': 'https://nicaraguainformate.com',
      'es-ES': 'https://nicaraguainformate.com',
      'es': 'https://nicaraguainformate.com',
      'x-default': 'https://nicaraguainformate.com',
    },
  },
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];

  try {
    [noticias, masLeidas] = await Promise.all([getNews(50), getMasLeidas()]);
  } catch (error) {
    console.error('[HomePage] Error:', error);
  }

  return <HomePagePro noticias={noticias} masLeidas={masLeidas} />;
}
