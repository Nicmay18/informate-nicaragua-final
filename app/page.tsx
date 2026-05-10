import Link from 'next/link';
import NewsGrid from '@/components/NewsGrid';
import BreakingTicker from '@/components/BreakingTicker';
import HeroCarousel from '@/components/HeroCarousel';
import NewsletterForm from '@/components/NewsletterForm';
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
    <div className="min-h-screen bg-white text-gray-900">
      {/* ===== TOP BAR ===== */}
      <div style={{ background: '#1a1a2e', color: '#fff', fontSize: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', opacity: 0.8 }}>
            <span>📍 Estelí, Nicaragua</span>
            <span>{today}</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/nosotros" style={{ color: '#fff', textDecoration: 'none', opacity: 0.8, transition: 'opacity 0.2s', fontWeight: 500 }}>Sobre Nosotros</Link>
            <Link href="/contacto" style={{ color: '#fff', textDecoration: 'none', opacity: 0.8, transition: 'opacity 0.2s', fontWeight: 500 }}>Contacto</Link>
            <Link href="/feed.xml" style={{ color: '#fff', textDecoration: 'none', opacity: 0.8, transition: 'opacity 0.2s', fontWeight: 500 }}>RSS</Link>
          </div>
        </div>
      </div>

      {/* ===== HEADER STICKY ===== */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e8e8ec', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)', backgroundColor: 'rgba(255,255,255,0.95)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 900, color: '#c41e3a', letterSpacing: '-0.5px', lineHeight: 1 }}>
              Nicaragua <span style={{ color: '#1a1a2e', fontWeight: 700 }}>Informate</span>
            </div>
            <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: '#8a8a9e', marginTop: 2, fontWeight: 600 }}>
              Noticias de Nicaragua en Tiempo Real
            </div>
          </Link>
          <nav>
            <ul style={{ display: 'flex', gap: 28, listStyle: 'none', margin: 0, padding: 0 }}>
              <li><Link href="/" style={{ textDecoration: 'none', color: '#1a1a2e', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 0', position: 'relative', transition: 'color 0.2s' }}>Inicio</Link></li>
              {CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.name}>
                  <Link href={`/noticias?cat=${encodeURIComponent(cat.name)}`}
                    style={{ textDecoration: 'none', color: '#1a1a2e', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 0', position: 'relative', transition: 'color 0.2s' }}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #e8e8ec', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} aria-label="Buscar">
              <i className="fas fa-search" style={{ fontSize: 14, color: '#5a5a6e' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Breaking Ticker */}
      {tickerNews.length > 0 && <BreakingTicker noticias={tickerNews} />}

      {/* ===== HERO SECTION ===== */}
      {destacadas.length > 0 && (
        <section style={{ maxWidth: 1280, margin: '32px auto', padding: '0 24px' }}>
          <HeroCarousel noticias={destacadas} />
        </section>
      )}

      {/* ===== MAIN CONTENT GRID ===== */}
      <main id="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 48px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40 }}>
        {/* Left Column - News */}
        <div>
          <NewsGrid noticias={recientes.length > 0 ? recientes : noticias} />
        </div>

        {/* Right Column - Sidebar */}
        <aside style={{ position: 'sticky', top: 100 }}>
          <TrendingList noticias={noticias.slice(0, 6)} />
          {masLeidas.length > 0 && <MasLeidas noticias={masLeidas} />}
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f4', marginBottom: 24 }}>
            <WeatherWidgetWrapper />
          </div>
          <NewsletterForm />
          <SocialGrid />
        </aside>
      </main>

      <SiteFooter />

      <style>{`
        .cat-link:hover { color: #111 !important; background: rgba(185,28,28,0.06); }
        @media (max-width: 1024px) {
          main { grid-template-columns: 1fr !important; }
          aside { display: none !important; }
        }
        @media (max-width: 768px) {
          header > div { padding: 12px 16px !important; }
          header nav ul { display: none !important; }
          .logo { font-size: 22px !important; }
        }
      `}</style>
    </div>
  );
}
