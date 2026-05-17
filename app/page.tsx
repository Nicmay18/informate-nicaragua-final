import MobileHome from '@/components/MobileHome';
import { getNews, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';
import AutoRefresh from '@/components/AutoRefresh';

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
  const params = await searchParams;
  const hasQueryParams = Object.keys(params).length > 0;

  return {
    title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
    description: 'Portal de noticias de Nicaragua. Periodismo verificado desde Managua. Sucesos, nacionales, deportes e internacionales.',
    robots: hasQueryParams ? 'noindex, nofollow' : 'index, follow',
    alternates: { canonical: 'https://www.nicaraguainformate.com' },
    openGraph: {
      title: 'Nicaragua Informate — Noticias de Nicaragua',
      description: 'Portal de noticias de Nicaragua. Periodismo verificado desde Managua.',
      url: 'https://www.nicaraguainformate.com',
      siteName: 'Nicaragua Informate',
      images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Nicaragua Informate' }],
      locale: 'es_NI',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Nicaragua Informate — Noticias de Nicaragua',
      description: 'Portal de noticias de Nicaragua. Periodismo verificado desde Managua.',
      images: ['/logo.png'],
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];

  try {
    [noticias, masLeidas] = await Promise.all([getNews(100), getMasLeidas()]);
  } catch (error) {
    console.error('[HomePage] Error:', error);
  }

  return (
    <>
      <AutoRefresh />
      <MobileHome noticias={noticias} masLeidas={masLeidas} />
    </>
  );
}
