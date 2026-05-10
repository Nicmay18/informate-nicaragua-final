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
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
      {/* Top Bar - Estilo NYT */}
      <div style={{ background: '#f8f8f8', color: '#666', fontSize: 11, borderBottom: '1px solid #e0e0e0', padding: '8px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-map-marker-alt" style={{ color: '#b91c1c', fontSize: 10 }} />
            Estelí, Nicaragua
          </span>
          <span>{new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Header - Estilo periódico profesional */}
      <header style={{ borderBottom: '2px solid #b91c1c', padding: '16px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Image src="/logo.png" alt="Nicaragua Informate" width={40} height={40} style={{ borderRadius: 8 }} />
            <div>
              <div style={{ color: '#b91c1c', fontWeight: 700, fontSize: 28, letterSpacing: '-0.03em', fontFamily: 'Georgia, serif' }}>Nicaragua Informate</div>
              <div style={{ color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 2 }}>Noticias de Nicaragua</div>
            </div>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/noticias" style={{ color: '#374151', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}>Todas las noticias</Link>
            <Link href="/contacto" style={{ color: '#374151', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}>Contacto</Link>
          </div>
        </div>
      </header>

      {/* Category Ribbon */}
      <nav style={{ borderBottom: '1px solid #e5e5e5', padding: '12px 0' }}>
        <div style={{ width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => (
            <a key={cat.name} href={`/?cat=${encodeURIComponent(cat.name)}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#333', textDecoration: 'none', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', transition: 'color 0.2s' }}
              className="cat-link">
              <i className={`fas ${cat.icon}`} style={{ color: '#b91c1c', fontSize: 10 }} />
              {cat.name}
            </a>
          ))}
        </div>
      </nav>

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
          <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <WeatherWidgetWrapper />
          </div>
          <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
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
