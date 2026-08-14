import '@/app/home-redesign.css';
import HomePagePro from '@/components/HomePagePro';
import { getHomePageData } from '@/lib/db/homepage';
import { checkHomeDiversity } from '@/lib/home-balance';
import { checkBrandHealth } from '@/lib/brand-health';
import type { HomePageData } from '@/lib/db/homepage';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';
import { logger } from '@/lib/logger';
import { buildNewsArticleJsonLdEnhanced } from '@/lib/seo/schema';
import { escapeJsonLd } from '@/lib/jsonld';
import { getCspNonce } from '@/lib/nonce';

// ============================================================================
// ISR: Home regenerado cada 1 minuto para reflejar noticias nuevas de inmediato.
// ============================================================================
export const revalidate = 60;

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
  let data: HomePageData | null = null;

  try {
    data = await getHomePageData();

    const allVisible = [
      ...(data.hero ? [data.hero] : []),
      ...data.ultimas,
      ...data.enPortada,
      ...data.breaking,
      ...Object.values(data.porCategoria).flat(),
    ];

    const homeHealth = checkHomeDiversity(allVisible.slice(0, 30));
    if (!homeHealth.balanced) {
      logger.warn('[HomePage] Home Diversity Check:', homeHealth.alerts.join(' | '));
    }

    const brandHealth = checkBrandHealth(allVisible.slice(0, 10));
    const critical = brandHealth.filter((a) => a.level !== 'ok');
    if (critical.length > 0) {
      logger.warn('[HomePage] Brand Health:', critical.map((a) => a.message).join(' | '));
    }
  } catch (error) {
    logger.error('[HomePage] Error:', error);
  }

  // Top 6 noticias para structured data (Google puede mostrarlas en rich snippets / Top Stories)
  const topStories: Noticia[] = data ? [data.hero, ...data.ultimas].filter((n): n is Noticia => n !== null).slice(0, 6) : [];
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

  const nonce = await getCspNonce();

  return (
    <>
      {homeItemList && (
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: escapeJsonLd(homeItemList) }}
        />
      )}
      {data ? <HomePagePro data={data} /> : <HomePagePro data={{ hero: null, ultimas: [], enPortada: [], breaking: [], porCategoria: {}, masLeidas: [] }} />}
    </>
  );
}
