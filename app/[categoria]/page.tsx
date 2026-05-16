import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import NewsGrid from '@/components/NewsGrid';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AutoRefresh from '@/components/AutoRefresh';
import DonationCard from '@/components/DonationCard';
import SocialJoinButtons from '@/components/SocialJoinButtons';
import { getNewsByCategory } from '@/lib/data';
import { slugToCategory } from '@/lib/types';
import type { Noticia } from '@/lib/types';

/** Genera las 6 páginas de categoría en build time (ISR) */
export async function generateStaticParams() {
  return [
    { categoria: 'sucesos' },
    { categoria: 'nacionales' },
    { categoria: 'deportes' },
    { categoria: 'internacionales' },
    { categoria: 'tecnologia' },
    { categoria: 'espectaculos' },
  ];
}

/** Genera metadata dinámica por categoría */
export async function generateMetadata(
  { params }: { params: Promise<{ categoria: string }> }
): Promise<Metadata> {
  const { categoria } = await params;
  const catName = slugToCategory(categoria);
  if (!catName) return {};

  const baseUrl = 'https://www.nicaraguainformate.com';
  const title = `${catName} | Nicaragua Informate`;
  const description = `Últimas noticias de ${catName} en Nicaragua. Periodismo verificado desde Managua.`;

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/${categoria}` },
    openGraph: {
      type: 'website',
      locale: 'es_NI',
      url: `${baseUrl}/${categoria}`,
      siteName: 'Nicaragua Informate',
      title,
      description,
      images: [{ url: `${baseUrl}/logo.png`, width: 512, height: 512, alt: 'Nicaragua Informate' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/logo.png`],
    },
  };
}

export const revalidate = 300; // ISR: revalida cada 5 minutos

export default async function CategoriaPage(
  { params }: { params: Promise<{ categoria: string }> }
) {
  const { categoria } = await params;
  const catName = slugToCategory(categoria);

  // 404 si la categoría no existe
  if (!catName) {
    notFound();
  }

  let noticias: Noticia[] = [];

  try {
    noticias = await getNewsByCategory(catName, 100);
  } catch (error) {
    console.error(`[CategoriaPage] Error cargando ${catName}:`, error);
  }

  return (
    <div className="min-h-screen">
      <AutoRefresh intervalSec={60} />
      <Header activeCategory={catName} />

      <main id="main-content" className="container-pro" style={{ padding: '32px 24px 48px' }}>
        <div style={{ marginBottom: 28 }}>
          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>
            <a href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Inicio</a>
            <span style={{ margin: '0 6px', color: '#94a3b8' }}>&rsaquo;</span>
            <a href="/noticias" style={{ color: '#2563eb', textDecoration: 'none' }}>Noticias</a>
            <span style={{ margin: '0 6px', color: '#94a3b8' }}>&rsaquo;</span>
            <span style={{ color: '#334155', fontWeight: 500 }}>{catName}</span>
          </nav>

          <h1 className="article-title-pro" style={{ fontSize: 'clamp(28px,4vw,46px)', fontWeight: 700, lineHeight: 1.08, marginBottom: 10, fontFamily: 'var(--font-merri)', letterSpacing: '-0.01em' }}>
            {catName}
          </h1>
          <p className="article-lead-pro" style={{ fontSize: 18, lineHeight: 1.6 }}>
            Noticias de {catName} en Nicaragua y el mundo. Periodismo verificado desde Managua.
          </p>
        </div>

        {noticias.length > 0 ? (
          <>
            <SocialJoinButtons />
            <NewsGrid noticias={noticias} showAll={true} />

            <div style={{ marginTop: 40, maxWidth: 680, marginLeft: 'auto', marginRight: 'auto' }}>
              <DonationCard />
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: '#666', border: '1px solid #e5e7eb', borderRadius: 12, background: '#fafafa' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>📰</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#111', fontFamily: 'var(--font-merri)' }}>Sin publicaciones en {catName}</h2>
            <p style={{ margin: 0, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
              Estamos actualizando esta sección. Vuelve en unos minutos para ver nuevas publicaciones.
            </p>
            <a href="/noticias" style={{ display: 'inline-block', marginTop: 20, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Ver todas las noticias &rarr;</a>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
