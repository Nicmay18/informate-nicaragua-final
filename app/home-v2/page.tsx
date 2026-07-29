import '@/app/home-v2/home-v2.css';
import HomePageV2 from '@/components/pro/HomePageV2';
import { getLatestNews, getTrendingNews, getPopularNews } from '@/lib/db/homepage';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';
import { logger } from '@/lib/logger';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
  description: 'Cobertura actualizada de Nicaragua: política, economía, sucesos, deportes, tecnología y más.',
};

export default async function HomeV2Page() {
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
    logger.error('[HomeV2] Error:', error);
  }

  return <HomePageV2 noticias={noticias} masLeidas={masLeidas} populares={populares} />;
}
