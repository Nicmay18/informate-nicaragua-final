import HomePagePro from '@/components/HomePagePro';
import { getLatestNews, getTrendingNews, getPopularNews } from '@/lib/db/homepage';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';
import { getHeroImageUrl } from '@/lib/image-utils';
import { logger } from '@/lib/logger';

// ============================================================================
// ISR: Home regenerada cada 1 hora. Reduce lecturas Firestore drásticamente.
// Las noticias se revalidan vía revalidateTag desde el panel/admin.
// ============================================================================
export const revalidate = 3600;
export const dynamicParams = true;

const SITE_URL = 'https://nicaraguainformate.com';
const OG_IMAGE = `${SITE_URL}/logo.webp`;

/** Trunca descripción respetando límites de palabras para SERPs */
function smartTruncate(str: string, maxLen = 155): string {
  if (str.length <= maxLen) return str;
  const trimmed = str.slice(0, maxLen);
  const lastSpace = trimmed.lastIndexOf(' ');
  return lastSpace > 0 ? trimmed.slice(0, lastSpace) + '…' : trimmed + '…';
}

const META_DESC =
  'Noticias de Nicaragua en tiempo real. Cobertura de sucesos, nacionales, deportes, tecnología, espectáculos e internacionales desde Managua.';

const OG_DESC =
  'Portal de noticias líder de Nicaragua con cobertura verificada desde Managua y Estelí. Nacionales, sucesos, espectáculos, tecnología y deportes.';

export const metadata: Metadata = {
  title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
  description: smartTruncate(META_DESC),
  openGraph: {
    type: 'website',
    locale: 'es_NI',
    url: SITE_URL,
    siteName: 'Nicaragua Informate',
    title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
    description: smartTruncate(OG_DESC),
    images: [{ url: OG_IMAGE, width: 512, height: 512, alt: 'Nicaragua Informate' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@NicInformate',
    creator: '@NicInformate',
    title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
    description: smartTruncate(OG_DESC),
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: SITE_URL,
    languages: { 'x-default': SITE_URL },
  },
};

export default async function HomePage() {
  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];
  let populares: Noticia[] = [];

  try {
    [noticias, masLeidas, populares] = await Promise.all([
      getLatestNews(30),
      getTrendingNews(5),
      getPopularNews(5),
    ]);
  } catch (error) {
    logger.error('[HomePage] Error:', error);
  }

  const heroSrc = noticias[0]?.imagen ? getHeroImageUrl(noticias[0].imagen) : null;

  return (
    <>
      {heroSrc && (
        <link
          rel="preload"
          as="image"
          href={heroSrc}
          type="image/webp"
          crossOrigin="anonymous"
        />
      )}
      <HomePagePro noticias={noticias} masLeidas={masLeidas} populares={populares} />
    </>
  );
}
