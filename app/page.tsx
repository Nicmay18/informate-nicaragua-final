import HomePageRedesign from '@/components/HomePageRedesign';
import { getLatestNews } from '@/lib/db/homepage';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';
import { logger } from '@/lib/logger';
import { buildNewsArticleJsonLdEnhanced } from '@/lib/seo/schema';
import { escapeJsonLd } from '@/lib/jsonld';

// ============================================================================
// ISR: Home regenerado cada 5 minutos para que noticias nuevas aparezcan rapido.
// Reduccion de consumo: ~99% menos lecturas vs force-dynamic.
// ============================================================================
export const revalidate = 300; // 5 minutos para que noticias nuevas aparezcan rápido

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

  try {
    noticias = await getLatestNews(30);
  } catch (error) {
    logger.error('[HomePage] Error:', error);
  }

  // Top 6 noticias para structured data (Google puede mostrarlas en rich snippets / Top Stories)
  const topStories = noticias.slice(0, 6);
  const homeItemList = topStories.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Noticias principales — Nicaragua Informate',
        itemListElement: topStories.map((n, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/noticias/${n.slug}`,
          item: buildNewsArticleJsonLdEnhanced(n, `${SITE_URL}/noticias/${n.slug}`),
        })),
      }
    : null;

  return (
    <>
      {homeItemList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJsonLd(homeItemList) }}
        />
      )}
      <style dangerouslySetInnerHTML={{ __html: '.site-shell { display: none !important; }' }} />
      <HomePageRedesign />
    </>
  );
}
