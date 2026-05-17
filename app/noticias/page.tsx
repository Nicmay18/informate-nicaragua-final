import type { Metadata } from 'next';
import MobileHome from '@/components/MobileHome';
import { getNews, getNewsByCategory, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';

export const revalidate = 60;

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ cat?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const cat = params.cat || 'Todas';
  return {
    title: cat !== 'Todas' ? `${cat} - Noticias` : 'Todas las Noticias',
    description: `Noticias de ${cat} en Nicaragua.`,
  };
}

export default async function NoticiasPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const params = await searchParams;
  const cat = params.cat || 'Todas';

  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];
  try {
    [noticias, masLeidas] = await Promise.all([
      cat !== 'Todas' ? getNewsByCategory(cat, 100) : getNews(100),
      getMasLeidas(),
    ]);
  } catch (error) {
    console.error('[NoticiasPage] Error:', error);
  }

  return <MobileHome noticias={noticias} masLeidas={masLeidas} />;
}
