import MobileHome from '@/components/MobileHome';
import { getNews, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
  description: 'Portal de noticias de Nicaragua. Periodismo verificado desde Managua.',
  alternates: { canonical: 'https://www.nicaraguainformate.com' },
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];

  try {
    [noticias, masLeidas] = await Promise.all([getNews(100), getMasLeidas()]);
  } catch (error) {
    console.error('[HomePage] Error:', error);
  }

  return <MobileHome noticias={noticias} masLeidas={masLeidas} />;
}
