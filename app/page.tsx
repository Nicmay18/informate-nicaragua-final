import nextDynamic from 'next/dynamic';
import NewsGrid from '@/components/NewsGrid';
import BreakingTicker from '@/components/BreakingTicker';
import HeroCarousel from '@/components/HeroCarousel';
import AdSlot from '@/components/AdSlot';
import TrendingList from '@/components/home/TrendingList';
import MasLeidas from '@/components/home/MasLeidas';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DonationCard from '@/components/DonationCard';
import StickyAdMobile from '@/components/StickyAdMobile';

const NewsletterForm = nextDynamic(() => import('@/components/NewsletterForm'), {
  loading: () => <div style={{ height: 200 }} />
});

const SocialGrid = nextDynamic(() => import('@/components/home/SocialGrid'), {
  loading: () => <div style={{ height: 300 }} />
});

const IndicadoresWidget = nextDynamic(() => import('@/components/IndicadoresWidget'), {
  loading: () => <div className="mobile-widget-skeleton" style={{ height: 150 }} />
});

const WeatherWidgetWrapper = nextDynamic(() => import('@/components/home/WeatherWidgetWrapper'), {
  loading: () => <div className="mobile-widget-skeleton" style={{ height: 100 }} />
});

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

  const destacadas = noticias.slice(0, 5);
  const recientes = noticias;
  const tickerNews = noticias.slice(0, 8);

  return (
    <div className="min-h-screen">
      <AutoRefresh />
      <Header activeCategory="Todas" />

      {/* Breaking Ticker */}
      {tickerNews.length > 0 && <BreakingTicker noticias={tickerNews} />}

      {/* ===== HERO SECTION ===== */}
      {destacadas.length > 0 && (
        <section className="hero-section">
          <HeroCarousel noticias={destacadas} />
        </section>
      )}

      {/* ===== TOP BANNER AD — Desktop & Mobile ===== */}
      <div className="container-pro" style={{ padding: '24px 0 0' }}>
        <AdSlot slot="homepage-top" width={728} height={90} format="horizontal" style={{ minHeight: 90, margin: '0 auto', maxWidth: 728 }} />
      </div>

      {/* ===== MAIN CONTENT GRID ===== */}
      <main id="main-content" className="ni-main-layout">
        {/* Left Column - News */}
        <div>
          <NewsGrid noticias={recientes.length > 0 ? recientes : noticias} />

          {/* ===== IN-CONTENT AD ===== */}
          <div style={{ marginTop: 32 }}>
            <AdSlot slot="homepage-in-content" width={336} height={280} />
          </div>

          {/* ===== MOBILE WIDGETS: Indicadores + Clima ===== */}
          <div className="mobile-widgets">
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 16, marginTop: 24, minHeight: 120, background: 'var(--bg-warm)' }}>
              <IndicadoresWidget />
            </div>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 16, minHeight: 100, background: 'var(--bg-warm)' }}>
              <WeatherWidgetWrapper />
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <aside className="ni-sidebar">
          <div className="ni-sidebar-inner">
            <TrendingList noticias={noticias.slice(0, 6)} />
            {masLeidas.length > 0 && <MasLeidas noticias={masLeidas} />}
            <AdSlot slot="homepage-sidebar-1" width={300} height={250} />
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 24, background: 'var(--bg-warm)' }}>
              <IndicadoresWidget />
            </div>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 24, background: 'var(--bg-warm)' }}>
              <WeatherWidgetWrapper />
            </div>
            <NewsletterForm />
            <SocialGrid />
            <DonationCard />
          </div>
        </aside>
      </main>

      {/* ===== STICKY BOTTOM AD — Mobile only ===== */}
      <StickyAdMobile />

      <Footer />
    </div>
  );
}
