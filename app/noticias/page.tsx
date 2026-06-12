import type { Metadata } from 'next';
import Link from 'next/link';
import HomePagePro from '@/components/HomePagePro';
import { getNews, getNewsByCategory, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';

export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ cat?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const cat = params.cat || 'Todas';
  const canonical = cat !== 'Todas' ? `https://nicaraguainformate.com/noticias?cat=${cat}` : 'https://nicaraguainformate.com/noticias';
  return {
    title: cat !== 'Todas' ? `${cat} - Noticias` : 'Todas las Noticias',
    description: cat !== 'Todas' ? `Últimas noticias de ${cat} en Nicaragua. Cobertura periodística verificada desde Managua.` : 'Últimas noticias de Nicaragua. Cobertura nacional e internacional verificada desde Managua.',
    alternates: { canonical },
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
