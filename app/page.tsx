import Link from 'next/link';
import Image from 'next/image';
import NewsGrid from '@/components/NewsGrid';
import IndicadoresWidget from '@/components/IndicadoresWidget';
import BreakingTicker from '@/components/BreakingTicker';
import HeroCarousel from '@/components/HeroCarousel';
import NewsletterForm from '@/components/NewsletterForm';
import TrendingList from '@/components/home/TrendingList';
import MasLeidas from '@/components/home/MasLeidas';
import SocialGrid from '@/components/home/SocialGrid';
import TagsCloud from '@/components/home/TagsCloud';
import SiteFooter from '@/components/home/SiteFooter';
import WeatherWidgetWrapper from '@/components/home/WeatherWidgetWrapper';
import { getNews, getMasLeidas } from '@/lib/data';
import { CATEGORIES } from '@/lib/types';

export const revalidate = 60;

export default async function HomePage() {
  let noticias = [];
  let masLeidas = [];

  try {
    [noticias, masLeidas] = await Promise.all([getNews(30), getMasLeidas()]);
  } catch (error) {
    console.error('[HomePage] Error:', error);
  }

  const destacadas = noticias.slice(0, 5);
  const recientes = noticias.slice(5);
  const tickerNews = noticias.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
      {/* Top Bar */}
      <div style={{ background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', color: '#94a3b8', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: '100%', margin: '0 auto', padding: '6px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="fas fa-calendar-alt" style={{ color: '#dc2626', fontSize: 11 }} />
            {new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            <span style={{ color: '#475569' }}>|</span>
            <i className="fas fa-map-marker-alt" style={{ color: '#dc2626', fontSize: 11 }} />
            Estelí, Nicaragua
          </span>
        </div>
      </div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #262626' }}>
        <div style={{ width: '100%', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Image src="/logo.png" alt="Nicaragua Informate" width={40} height={40} style={{ borderRadius: 8 }} />
            <div>
              <div style={{ color: '#dc2626', fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Nicaragua Informate</div>
              <div style={{ color: '#525252', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Noticias de Nicaragua</div>
            </div>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/noticias" style={{ color: '#a3a3a3', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}>Todas las noticias</Link>
            <Link href="/contacto" style={{ color: '#a3a3a3', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}>Contacto</Link>
          </div>
        </div>
      </header>

      {/* Category Ribbon */}
      <div style={{ background: '#141414', borderBottom: '1px solid #262626' }}>
        <div style={{ width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => (
            <a key={cat.name} href={`/?cat=${encodeURIComponent(cat.name)}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#a3a3a3', textDecoration: 'none', borderBottom: '2px solid transparent', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
              className="cat-link">
              <i className={`fas ${cat.icon}`} style={{ color: cat.color, fontSize: 11 }} />
              {cat.name}
            </a>
          ))}
        </div>
      </div>

      {/* Breaking Ticker */}
      {tickerNews.length > 0 && <BreakingTicker noticias={tickerNews} />}

      {/* Hero */}
      {destacadas.length > 0 && (
        <section style={{ width: '100%', margin: '0 auto', padding: '24px' }}>
          <HeroCarousel noticias={destacadas} />
        </section>
      )}

      {/* Main Content */}
      <main 
  id="main-content"
  className="w-full max-w-[1440px] mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8"
>
        <div>
          <NewsGrid noticias={recientes.length > 0 ? recientes : noticias} />
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <TrendingList noticias={noticias.slice(0, 6)} />
          <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #262626' }}>
            <WeatherWidgetWrapper />
          </div>
          <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #262626' }}>
            <IndicadoresWidget />
          </div>
          {masLeidas.length > 0 && <MasLeidas noticias={masLeidas} />}
          <NewsletterForm />
          <SocialGrid />
          <TagsCloud />
        </aside>
      </main>

      <SiteFooter />

      <style>{`
        .cat-link:hover { color: #f5f5f5 !important; border-bottom-color: #dc2626 !important; background: rgba(220,38,38,0.05); }
        @media (max-width: 1024px) {
          main { grid-template-columns: 1fr !important; }
          aside { display: none !important; }
        }
      `}</style>
    </div>
  );
}
