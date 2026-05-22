import HeroSection from '@/components/HeroSection';
import NewsGrid from '@/components/NewsGrid';
import Sidebar from '@/components/Sidebar';
import { getNews, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nicaragua Informate — Noticias de Nicaragua en tiempo real',
  description: 'Portal de noticias de Nicaragua. Periodismo verificado desde Managua.',
  alternates: { canonical: 'https://nicaraguainformate.com' },
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];

  try {
    [noticias, masLeidas] = await Promise.all([getNews(30), getMasLeidas()]);
  } catch (error) {
    console.error('[HomePage] Error:', error);
  }

  const noticiaDestacada = noticias[0];
  const noticiasPrincipales = noticias.slice(0, 12);
  const noticiasTrending = masLeidas.slice(0, 5);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      {noticiaDestacada && (
        <HeroSection noticia={noticiaDestacada} />
      )}

      {/* Main Grid con Sidebar */}
      <div className="main-grid container" style={{ marginBottom: 'var(--spacing-3xl)', flex: 1 }}>
        {/* Noticias Principales */}
        <div style={{ minWidth: 0 }}>
          <NewsGrid
            title="Últimas noticias"
            noticias={noticiasPrincipales}
            viewAllLink="/noticias"
          />
        </div>

        {/* Sidebar */}
        <Sidebar trendingNews={noticiasTrending} />
      </div>
    </div>
  );
}
