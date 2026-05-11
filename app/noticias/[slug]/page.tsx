import ArticleClient from '@/components/ArticleClient';
import TrendingList from '@/components/home/TrendingList';
import MasLeidas from '@/components/home/MasLeidas';
import SocialGrid from '@/components/home/SocialGrid';
import NewsletterForm from '@/components/NewsletterForm';
import AdSlot from '@/components/AdSlot';
import WeatherWidgetWrapper from '@/components/home/WeatherWidgetWrapper';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getNewsBySlug, getRelatedNews, getNews, getMasLeidas } from '@/lib/data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildNewsArticleJsonLd, buildBreadcrumbJsonLd } from '@/lib/schema';

export const dynamic = 'force-static';
export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = 'https://nicaraguainformate.com';
  const url = `${baseUrl}/noticias/${slug}`;

  try {
    const noticia = await getNewsBySlug(slug);
    if (!noticia) {
      return {
        title: 'Noticia no encontrada | Nicaragua Informate',
        robots: 'noindex, nofollow',
      };
    }

    const title = noticia.titulo || 'Noticia | Nicaragua Informate';
    const description = (noticia.resumen || '').slice(0, 155) || 'Noticias de Nicaragua en tiempo real.';
    const image = noticia.imagen || `${baseUrl}/logo.png`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'article',
        locale: 'es_NI',
        url,
        siteName: 'Nicaragua Informate',
        title,
        description,
        images: [{ url: image }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: 'Noticia | Nicaragua Informate',
      alternates: { canonical: url },
    };
  }
}

export default async function NewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const [noticia, noticiasTrending, masLeidas] = await Promise.all([
      getNewsBySlug(slug),
      getNews(8),
      getMasLeidas(),
    ]);

    if (!noticia) {
      return notFound();
    }

    const related = await getRelatedNews(noticia.categoria, noticia.slug, 3);
    const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;

    return (
      <div className="min-h-screen bg-white">
        <Header activeCategory={noticia.categoria} />

        {/* ===== TOP BANNER AD — Article ===== */}
        <div className="container-pro" style={{ padding: '16px 0 0' }}>
          <AdSlot slot="article-top" width={728} height={90} format="horizontal" style={{ minHeight: 90, margin: '0 auto', maxWidth: 728 }} />
        </div>

        {/* ===== MAIN CONTENT GRID ===== */}
        <main id="main-content" className="container-pro" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, padding: '32px 24px 48px' }}>
          {/* Left Column - Article */}
          <div>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildNewsArticleJsonLd(noticia, url)) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(noticia.categoria)) }} />
            <ArticleClient
              noticia={noticia}
              related={related}
              adSlot={<AdSlot slot="article-in-content" width={336} height={280} />}
            />
          </div>

          {/* Right Column - Sidebar */}
          <aside className="sidebar" style={{ position: 'sticky', top: 100, alignSelf: 'start' }}>
            <TrendingList noticias={noticiasTrending.slice(0, 6)} />
            {masLeidas.length > 0 && <MasLeidas noticias={masLeidas} />}
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f4', marginBottom: 24 }}>
              <WeatherWidgetWrapper />
            </div>
            <AdSlot slot="article-sidebar-1" width={300} height={250} />
            <NewsletterForm />
            <SocialGrid />
          </aside>
        </main>

        {/* ===== STICKY BOTTOM AD — Mobile only ===== */}
        <div className="sticky-ad-mobile" style={{ position: 'fixed', bottom: 56, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', background: '#fff', borderTop: '1px solid #e8e8ec', padding: '8px 0' }}>
          <AdSlot slot="article-sticky-bottom" width={320} height={50} format="horizontal" style={{ minHeight: 50 }} />
        </div>

        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Error cargando noticia:', error);
    return notFound();
  }
}
