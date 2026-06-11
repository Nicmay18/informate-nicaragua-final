import HomePagePro from '@/components/HomePagePro';
import { getLatestNews, getTrendingNews } from '@/lib/db/homepage';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';
import { getResponsiveImageUrl } from '@/lib/image-utils';

// ============================================================================
// ISR: La home se regenera cada 60 segundos con datos frescos de Firestore.
// Esto reduce drásticamente lecturas en Firestore vs force-dynamic,
// manteniendo la home actualizada sin cachear indefinidamente.
// ============================================================================
export const revalidate = 60;
export const dynamicParams = true;

const SITE_URL = 'https://nicaraguainformate.com';
const OG_IMAGE = `${SITE_URL}/logo.webp`;

/** Trunca descripción respetando límites de palabras para SERPs (max ~160 chars) */
function smartTruncate(str: string, maxLen = 155): string {
  if (str.length <= maxLen) return str;
  const trimmed = str.slice(0, maxLen);
  const lastSpace = trimmed.lastIndexOf(' ');
  return lastSpace > 0 ? trimmed.slice(0, lastSpace) + '…' : trimmed + '…';
}

const META_DESC_BASE =
  'Noticias de Nicaragua en tiempo real. Cobertura de sucesos, nacionales, deportes, tecnología, espectáculos e internacionales desde Managua.';

const OG_DESC_BASE =
  'Portal de noticias líder de Nicaragua con cobertura verificada desde Managua y Estelí. Nacionales, sucesos, espectáculos, tecnología y deportes.';

export const metadata: Metadata = {
  title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
  description: smartTruncate(META_DESC_BASE),
  openGraph: {
    type: 'website',
    locale: 'es_NI',
    url: SITE_URL,
    siteName: 'Nicaragua Informate',
    title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
    description: smartTruncate(OG_DESC_BASE),
    images: [
      {
        url: OG_IMAGE,
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
    description: smartTruncate(OG_DESC_BASE),
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'x-default': SITE_URL,
    },
  },
};

export default async function HomePage() {
  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];

  try {
    [noticias, masLeidas] = await Promise.all([
      getLatestNews(30),   // Carrusel + listados
      getTrendingNews(5),  // Más leídas / Tendencias
    ]);
  } catch (error) {
    console.error('[HomePage] Error:', error);
  }

  const heroImage = noticias[0]?.imagen || null;
  const heroSrc = heroImage ? getResponsiveImageUrl(heroImage, 640) : null;

  return (
    <>
      {heroSrc && (
        <link
          rel="preload"
          as="image"
          href={heroSrc}
          type="image/webp"
          fetchPriority="high"
          crossOrigin="anonymous"
        />
      )}
      <HomePagePro noticias={noticias} masLeidas={masLeidas} />
    </>
  );
}
