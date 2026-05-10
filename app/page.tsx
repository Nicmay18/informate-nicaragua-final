import Link from 'next/link';
import NewsGrid from '@/components/NewsGrid';
import BreakingTicker from '@/components/BreakingTicker';
import HeroCarousel from '@/components/HeroCarousel';
import NewsletterForm from '@/components/NewsletterForm';
import AdSlot from '@/components/AdSlot';
import TrendingList from '@/components/home/TrendingList';
import MasLeidas from '@/components/home/MasLeidas';
import SocialGrid from '@/components/home/SocialGrid';
import SiteFooter from '@/components/home/SiteFooter';
import WeatherWidgetWrapper from '@/components/home/WeatherWidgetWrapper';
import { getNews, getMasLeidas } from '@/lib/data';
import type { Noticia } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';

export const revalidate = 60;

export default async function HomePage() {
  let noticias: Noticia[] = [];
  let masLeidas: Noticia[] = [];

  try {
    [noticias, masLeidas] = await Promise.all([getNews(30), getMasLeidas()]);
  } catch (error) {
    console.error('[HomePage] Error:', error);
  }

  const destacadas = noticias.slice(0, 5);
  const recientes = noticias.slice(5);
  const tickerNews = noticias.slice(0, 8);

  const today = new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-white">
      {/* ===== TOP BAR ===== */}
      <div className="top-bar">
        <div className="top-bar-inner">
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', opacity: 0.8 }}>
            <span>📍 Estelí, Nicaragua</span>
            <span>{today}</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/nosotros">Sobre Nosotros</Link>
            <Link href="/contacto">Contacto</Link>
            <Link href="/feed.xml">RSS</Link>
          </div>
        </div>
      </div>

      {/* ===== HEADER STICKY ===== */}
      <header className="header-pro">
        <div className="header-pro-inner">
          <Link href="/" className="logo-pro">
            Nicaragua <span>Informate</span>
          </Link>
          <nav>
            <ul className="nav-pro">
              <li><Link href="/" className="active">Inicio</Link></li>
              {CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.name}>
                  <Link href={`/noticias?cat=${encodeURIComponent(cat.name)}`}>{cat.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {/* Breaking Ticker */}
      {tickerNews.length > 0 && <BreakingTicker noticias={tickerNews} />}

      {/* ===== HERO SECTION ===== */}
      {destacadas.length > 0 && (
        <section className="hero-section">
          <HeroCarousel noticias={destacadas} />
        </section>
      )}

      {/* ===== MAIN CONTENT GRID ===== */}
      <main id="main-content" className="container-pro" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, paddingBottom: 48 }}>
        {/* Left Column - News */}
        <div>
          <NewsGrid noticias={recientes.length > 0 ? recientes : noticias} />
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
        </aside>
      </main>

      <SiteFooter />
    </div>
  );
}
