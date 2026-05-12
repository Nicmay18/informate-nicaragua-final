import { Metadata } from 'next';
import NewsGrid from '@/components/NewsGrid';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AutoRefresh from '@/components/AutoRefresh';
import { getNews } from '@/lib/data';
import type { Noticia } from '@/lib/types';

export const revalidate = 1;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = 'https://nicaraguainformate.com';
  const url = `${baseUrl}/noticias`;

  return {
    title: 'Todas las Noticias | Nicaragua Informate',
    description: 'Portal de noticias de Nicaragua. Cobertura completa de sucesos, nacionales, deportes e internacionales.',
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'es_NI',
      url,
      siteName: 'Nicaragua Informate',
      title: 'Todas las Noticias | Nicaragua Informate',
      description: 'Portal de noticias de Nicaragua. Cobertura completa de sucesos, nacionales, deportes e internacionales.',
      images: [{ url: `${baseUrl}/logo.png`, width: 512, height: 512, alt: 'Nicaragua Informate' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Todas las Noticias | Nicaragua Informate',
      description: 'Portal de noticias de Nicaragua. Cobertura completa de sucesos, nacionales, deportes e internacionales.',
      images: [`${baseUrl}/logo.png`],
    },
  };
}

export default async function NoticiasPage() {
  let noticias: Noticia[] = [];

  try {
    noticias = await getNews(50);
  } catch (error) {
    console.error('[NoticiasPage] Error:', error);
  }

  return (
    <div className="min-h-screen">
      <AutoRefresh intervalSec={60} />
      <Header activeCategory="Todas" />

      <main id="main-content" className="container-pro" style={{ padding: '32px 24px 48px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="article-title-pro" style={{ fontSize: 'clamp(28px,4vw,46px)', fontWeight: 700, lineHeight: 1.08, marginBottom: 10, fontFamily: 'var(--font-merri)', letterSpacing: '-0.01em' }}>
            Todas las Noticias
          </h1>
          <p className="article-lead-pro" style={{ fontSize: 18, lineHeight: 1.6 }}>
            Mantente informado con las últimas noticias de Nicaragua y el mundo.
          </p>
        </div>

        {noticias.length > 0 ? (
          <NewsGrid noticias={noticias} />
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: '#666', border: '1px solid #e5e7eb', borderRadius: 12, background: '#fafafa' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>📰</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#111', fontFamily: 'var(--font-merri)' }}>Sin publicaciones por el momento</h2>
            <p style={{ margin: 0, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
              Estamos actualizando esta sección. Vuelve en unos minutos para ver nuevas publicaciones.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
