import NewsGrid from '@/components/NewsGrid';
import BreakingTicker from '@/components/BreakingTicker';
import HeroCarousel from '@/components/HeroCarousel';
import NewsletterForm from '@/components/NewsletterForm';
import AdSlot from '@/components/AdSlot';
import TrendingList from '@/components/home/TrendingList';
import MasLeidas from '@/components/home/MasLeidas';
import SocialGrid from '@/components/home/SocialGrid';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WeatherWidgetWrapper from '@/components/home/WeatherWidgetWrapper';
import AutoRefresh from '@/components/AutoRefresh';
import DonationCard from '@/components/DonationCard';
import SocialJoinButtons from '@/components/SocialJoinButtons';
import { getNews, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';

export const revalidate = 1;

export default async function HomePage() {
  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];

  try {
    [noticias, masLeidas] = await Promise.all([getNews(30), getMasLeidas()]);
  } catch (error) {
    console.error('[HomePage] Error:', error);
  }

  const destacadas = noticias.slice(0, 5);
  const recientes = noticias;
  const tickerNews = noticias.slice(0, 8);

  return (
    <div className="min-h-screen">
      <AutoRefresh intervalSec={60} />
      <Header activeCategory="Todas" />

      {/* Breaking Ticker */}
      {tickerNews.length > 0 && <BreakingTicker noticias={tickerNews} />}

      {/* ===== HERO SECTION ===== */}
      {destacadas.length > 0 && (
        <section className="hero-section">
          <HeroCarousel noticias={destacadas} />
        </section>
      )}

      {/* ===== SOCIAL JOIN BUTTONS ===== */}
      <div className="container-pro" style={{ padding: '24px 0' }}>
        <SocialJoinButtons />
      </div>

      {/* ===== TOP BANNER AD — Desktop & Mobile ===== */}
      <div className="container-pro" style={{ padding: '24px 0 0' }}>
        <AdSlot slot="homepage-top" width={728} height={90} format="horizontal" style={{ minHeight: 90, margin: '0 auto', maxWidth: 728 }} />
      </div>

      {/* ===== MAIN CONTENT GRID ===== */}
      <main id="main-content" className="container-pro" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, paddingBottom: 48 }}>
        {/* Left Column - News */}
        <div>
          <NewsGrid noticias={recientes.length > 0 ? recientes : noticias} />

          {/* ===== IN-CONTENT AD ===== */}
          <div style={{ marginTop: 32 }}>
            <AdSlot slot="homepage-in-content" width={336} height={280} />
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <aside className="sidebar" style={{ position: 'sticky', top: 100 }}>
          <TrendingList noticias={noticias.slice(0, 6)} />
          {masLeidas.length > 0 && <MasLeidas noticias={masLeidas} />}
          <AdSlot slot="homepage-sidebar-1" width={300} height={250} />
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f4', marginBottom: 24 }}>
            <WeatherWidgetWrapper />
          </div>
          <NewsletterForm />
          <SocialGrid />
          <DonationCard />
        </aside>
      </main>

      {/* ===== STICKY BOTTOM AD — Mobile only ===== */}
      <div className="sticky-ad-mobile" style={{ position: 'fixed', bottom: 56, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', background: '#fff', borderTop: '1px solid #e8e8ec', padding: '8px 0' }}>
        <AdSlot slot="homepage-sticky-bottom" width={320} height={50} format="horizontal" style={{ minHeight: 50 }} />
      </div>

      <Footer />
    </div>
  );
}
