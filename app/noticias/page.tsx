import type { Metadata } from 'next';
import Link from 'next/link';
import HomePagePro from '@/components/HomePagePro';
import { getNews, getNewsByCategory, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';

// ISR: regenera cada 1h, permite generación bajo demanda de nuevos params
export const dynamic = 'force-static';
export const dynamicParams = true;
export const revalidate = 3600;

const SITE_URL = 'https://nicaraguainformate.com';

/** Trunca descripción respetando límites de palabras para SERPs */
function smartTruncate(str: string, maxLen = 155): string {
  if (str.length <= maxLen) return str;
  const trimmed = str.slice(0, maxLen);
  const lastSpace = trimmed.lastIndexOf(' ');
  return lastSpace > 0 ? trimmed.slice(0, lastSpace) + '…' : trimmed + '…';
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ cat?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const cat = params.cat || 'Todas';
  const canonical = cat !== 'Todas' ? `${SITE_URL}/noticias?cat=${encodeURIComponent(cat)}` : `${SITE_URL}/noticias`;

  const rawTitle = cat !== 'Todas' ? `${cat} - Noticias` : 'Todas las Noticias';
  const title = rawTitle.length > 60 ? rawTitle.slice(0, 57) + '…' : rawTitle;

  const rawDesc = cat !== 'Todas'
    ? `Últimas noticias de ${cat} en Nicaragua. Cobertura periodística verificada desde Managua.`
    : 'Últimas noticias de Nicaragua. Cobertura nacional e internacional verificada desde Managua.';
  const description = smartTruncate(rawDesc);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'es_NI',
      url: canonical,
      siteName: 'Nicaragua Informate',
      title,
      description,
      images: [{ url: `${SITE_URL}/logo.webp`, width: 512, height: 512, alt: 'Nicaragua Informate' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/logo.webp`],
    },
  };
}

export default async function NoticiasPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const params = await searchParams;
  const cat = params.cat || 'Todas';

  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];
  try {
    [noticias, masLeidas] = await Promise.all([
      cat !== 'Todas' ? getNewsByCategory(cat, 50) : getNews(50),
      getMasLeidas(),
    ]);
  } catch (error) {
    console.error('[NoticiasPage] Error:', error);
  }

  return (
    <>
      <nav className="ni-breadcrumbs" aria-label="Miga de pan" style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px 0' }}>
        <Link href="/">Inicio</Link>
        <span className="ni-breadcrumbs__sep">/</span>
        <span>Todas las noticias</span>
      </nav>
      <HomePagePro noticias={noticias} masLeidas={masLeidas} />
    </>
  );
}
