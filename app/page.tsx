import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import WeatherWidget from '@/components/WeatherWidget';
import IndicadoresWidget from '@/components/IndicadoresWidget';
import RadioBar from '@/components/RadioBar';
import BreakingTicker from '@/components/BreakingTicker';
import HeroCarousel from '@/components/HeroCarousel';
import NewsGrid from '@/components/NewsGrid';

export const dynamic = 'force-dynamic';

interface Noticia {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  categoria: string;
  imagen: string;
  fecha: string;
}

const CAT_COLORS: Record<string, string> = {
  Sucesos: '#dc2626',
  Nacionales: '#1d4ed8',
  Deportes: '#16a34a',
  Internacionales: '#7c3aed',
  'Espectáculos': '#db2777',
  General: '#64748b',
};

function catColor(cat: string) {
  return CAT_COLORS[cat] ?? '#64748b';
}

function formatDate(iso: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-NI', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

async function getMasLeidas(): Promise<Noticia[]> {
  try {
    const snap = await adminDb
      .collection('noticias')
      .orderBy('vistas', 'desc')
      .limit(5)
      .get();
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        slug: data.slug || d.id,
        titulo: data.titulo || '',
        resumen: data.resumen || '',
        categoria: data.categoria || 'General',
        imagen: data.imagen || '',
        fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || '',
      };
    });
  } catch {
    return [];
  }
}

async function getNews(): Promise<Noticia[]> {
  try {
    const snap = await adminDb
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(30)
      .get();

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        slug: data.slug || d.id,
        titulo: data.titulo || '',
        resumen: data.resumen || '',
        categoria: data.categoria || 'General',
        imagen: data.imagen || '',
        fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || '',
      };
    });
  } catch (err) {
    console.error('[getNews] Firebase error:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

export default async function HomePage() {
  const [noticias, masLeidas] = await Promise.all([getNews(), getMasLeidas()]);
  const destacadas = noticias.slice(0, 5);
  const recientes = noticias.slice(5);
  const tickerNews = noticias.slice(0, 8);

  return (
    <div style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* Top Bar */}
      <div style={{ background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', color: '#94a3b8', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '6px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="fas fa-calendar-alt" style={{ color: '#e53e3e', fontSize: 11 }} />
            {new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            <span style={{ color: '#475569' }}>|</span>
            <i className="fas fa-map-marker-alt" style={{ color: '#e53e3e', fontSize: 11 }} /> Managua, Nicaragua
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener" aria-label="Facebook"
              style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textDecoration: 'none', fontSize: 13, transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.06)' }}
              className="top-social-btn"><i className="fab fa-facebook-f" /></a>
            <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener" aria-label="WhatsApp"
              style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textDecoration: 'none', fontSize: 13, transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.06)' }}
              className="top-social-btn"><i className="fab fa-whatsapp" /></a>
            <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener" aria-label="Telegram"
              style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textDecoration: 'none', fontSize: 13, transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.06)' }}
              className="top-social-btn"><i className="fab fa-telegram-plane" /></a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(140,29,24,0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <img src="/logo.png" alt="Nicaragua Informate" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover' }} className="logo-hover" />
            <div>
              <div style={{ color: '#e53e3e', fontWeight: 800, fontSize: 18, lineHeight: 1.2, letterSpacing: '-0.3px' }}>Nicaragua Informate</div>
              <div style={{ color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Noticias de Nicaragua</div>
            </div>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href="/noticias" style={{ display: 'none', alignItems: 'center', gap: 6, color: 'var(--ink-muted)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }} className="md:flex">
              <i className="fas fa-newspaper" style={{ color: '#8c1d18' }} /> Todas las noticias
            </Link>
            <Link href="/contacto" style={{ display: 'none', alignItems: 'center', gap: 6, color: 'var(--ink-muted)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }} className="md:flex">
              <i className="fas fa-envelope" style={{ color: '#8c1d18' }} /> Contacto
            </Link>
          </div>
        </div>
      </header>

      {/* Category Ribbon */}
      <div style={{ background: 'var(--paper-accent)', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
          {[
            { name: 'Sucesos', color: '#dc2626', icon: 'fa-triangle-exclamation' },
            { name: 'Nacionales', color: '#1d4ed8', icon: 'fa-flag' },
            { name: 'Deportes', color: '#16a34a', icon: 'fa-futbol' },
            { name: 'Internacionales', color: '#7c3aed', icon: 'fa-globe' },
            { name: 'Espect\u00e1culos', color: '#db2777', icon: 'fa-star' },
          ].map((cat) => (
            <a key={cat.name} href={`/?cat=${encodeURIComponent(cat.name)}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--ink-muted)', textDecoration: 'none', borderBottom: '3px solid transparent', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
              className={`nav-red-hover cat-ribbon-link cat-ribbon-${cat.name.toLowerCase().replace(/[^a-z]/g,'')}`}>
              <i className={`fas ${cat.icon}`} style={{ color: cat.color, fontSize: 12 }} />
              {cat.name}
            </a>
          ))}
        </div>
      </div>

      {/* Breaking News Ticker */}
      <BreakingTicker noticias={tickerNews} />

      {/* Hero Carousel */}
      {destacadas.length > 0 && (
        <section style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 24px 8px' }}>
          <HeroCarousel noticias={destacadas} />
        </section>
      )}

      {/* Main Grid */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px 48px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }} id="main-content" className="lg:grid-cols-[1fr_320px] grid-cols-1">
        <div>
          <NewsGrid noticias={recientes.length > 0 ? recientes : noticias} />

          {/* Mobile-only sidebar sections */}
          <div className="mobile-sidebar-sections">

            {/* Mobile Radio */}
            <div id="radio-mobile" style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-radio" style={{ color: '#fca5a5', fontSize: 14 }} />
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Radio en Vivo</span>
              </div>
              <RadioBar />
            </div>

            {/* Mobile Clima */}
            <WeatherWidget />

            {/* Mobile Indicadores */}
            <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <IndicadoresWidget />
            </div>

            {/* Mobile Tendencias */}
            <div style={{ background: 'var(--paper-accent)', borderRadius: 14, border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} className="widget-lift">
              <div style={{ background: 'linear-gradient(135deg, #8c1d18, #c41e3a)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-fire" style={{ color: '#fff', fontSize: 14 }} />
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tendencias</span>
              </div>
              <div style={{ padding: '8px 0' }}>
                {noticias.slice(0, 5).map((n, i) => (
                  <Link key={n.id} href={`/noticias/${n.slug}`} style={{ display: 'flex', gap: 12, padding: '10px 16px', textDecoration: 'none', borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none', alignItems: 'flex-start' }} className="trend-item-hover">
                    <span className="trend-num">{i + 1}</span>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: catColor(n.categoria), display: 'block', marginBottom: 3 }}>{n.categoria}</span>
                      <span style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.titulo}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile Más Leídas */}
            {masLeidas.length > 0 && (
              <div id="mas-leidas" style={{ background: 'var(--paper-accent)', borderRadius: 14, border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} className="widget-lift">
                <div style={{ background: 'linear-gradient(135deg, #8c1d18, #c41e3a)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fas fa-fire" style={{ color: '#fca5a5', fontSize: 14 }} />
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Más Leídas</span>
                </div>
                <div style={{ padding: '8px 0' }}>
                  {masLeidas.slice(0, 5).map((n, i) => (
                    <Link key={n.id} href={`/noticias/${n.slug}`} className="mas-leidas-item"
                      style={{ display: 'flex', gap: 14, padding: '12px 16px', textDecoration: 'none', borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 28, fontWeight: 900, color: i === 0 ? '#8c1d18' : 'var(--border-medium)', lineHeight: 1, minWidth: 32, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 10, color: catColor(n.categoria), fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>{n.categoria}</span>
                        <span style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: 600 }}>{n.titulo}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Trending */}
          <div style={{ background: 'var(--paper-accent)', borderRadius: 14, border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} className="widget-lift">
            <div style={{ background: 'linear-gradient(135deg, #8c1d18, #c41e3a)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-fire" style={{ color: '#fff', fontSize: 14 }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tendencias</span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {noticias.slice(0, 6).map((n, i) => (
                <Link key={n.id} href={`/noticias/${n.slug}`} style={{ display: 'flex', gap: 12, padding: '10px 16px', textDecoration: 'none', borderBottom: i < 5 ? '1px solid var(--border-light)' : 'none', alignItems: 'flex-start' }} className="trend-item-hover">
                  <span className="trend-num">{i + 1}</span>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: catColor(n.categoria), display: 'block', marginBottom: 3 }}>{n.categoria}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.titulo}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Clima */}
          <div className="widget-lift" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <WeatherWidget />
          </div>

          {/* Indicadores */}
          <div className="widget-lift" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <IndicadoresWidget />
          </div>

          {/* Más Leídas — numbered */}
          {masLeidas.length > 0 && (
            <div style={{ background: 'var(--paper-accent)', borderRadius: 14, border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} className="widget-lift">
              <div style={{ background: 'linear-gradient(135deg, #8c1d18, #c41e3a)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-fire" style={{ color: '#fca5a5', fontSize: 14 }} />
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Más Leídas</span>
              </div>
              <div style={{ padding: '8px 0' }}>
                {masLeidas.map((n, i) => (
                  <Link key={n.id} href={`/noticias/${n.slug}`} className="mas-leidas-item"
                    style={{ display: 'flex', gap: 14, padding: '12px 16px', textDecoration: 'none', borderBottom: i < masLeidas.length - 1 ? '1px solid var(--border-light)' : 'none', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: i === 0 ? '#8c1d18' : 'var(--border-medium)', lineHeight: 1, minWidth: 32, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 10, color: catColor(n.categoria), fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>{n.categoria}</span>
                      <span style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: 600 }}>{n.titulo}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Newsletter */}
          <NewsletterForm />

          {/* Síguenos — widget con iconos sólidos y soporte día/noche */}
          <div style={{ background: 'var(--paper-accent)', borderRadius: 14, border: '1px solid var(--border-light)', padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} className="widget-lift">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink)' }}>
              <span style={{ display: 'block', width: 4, height: 20, background: 'linear-gradient(180deg,#ef4444 0%,#f97316 100%)', borderRadius: 2 }} />
              Síguenos
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { href: 'https://facebook.com/profile.php?id=61578261125687', icon: 'fab fa-facebook-f', label: 'Facebook', hint: 'Noticias diarias', bg: '#1877F2' },
                { href: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17', icon: 'fab fa-whatsapp', label: 'WhatsApp', hint: 'Únete al canal', bg: '#25D366' },
                { href: 'https://t.me/+fHHjncJqMQM3NjZh', icon: 'fab fa-telegram-plane', label: 'Telegram', hint: 'Alertas al instante', bg: '#0088cc' },
                { href: '/feed.xml', icon: 'fas fa-rss', label: 'RSS', hint: 'Feed de noticias', bg: '#f26522' },
              ].map(s => (
                <a key={s.label} href={s.href} target={s.href.startsWith('http') ? '_blank' : undefined} rel={s.href.startsWith('http') ? 'noopener' : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--paper)', border: '1px solid var(--border-light)', borderRadius: 12, textDecoration: 'none', color: 'var(--ink)', transition: 'all 0.2s' }}
                  className="social-item">
                  <span style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', flexShrink: 0, background: s.bg, color: '#fff', fontSize: 17 }}>
                    <i className={s.icon} />
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2, fontWeight: 500 }}>{s.hint}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Tags cloud */}
          <div style={{ background: 'var(--paper-accent)', borderRadius: 14, border: '1px solid var(--border-light)', padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} className="widget-lift">
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fas fa-hashtag" style={{ color: '#e53e3e' }} /> Etiquetas
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['#Nicaragua','#Managua','#Sucesos','#Deportes','#Política','#Economía','#Cultura','#Clima','#Espectáculos','#Centroamérica'].map(tag => (
                <span key={tag} style={{ padding: '5px 12px', background: 'var(--paper)', border: '1px solid var(--border-light)', borderRadius: 999, fontSize: 12, fontWeight: 500, color: 'var(--ink-muted)', cursor: 'pointer', transition: 'all 0.2s' }} className="tag-chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,253,249,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '2px solid var(--border-light)', boxShadow: '0 -4px 24px rgba(0,0,0,0.08)', paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', maxWidth: 480, margin: '0 auto', padding: '6px 0 8px' }}>
          <Link href="/" className="mob-nav-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: '#8c1d18', textDecoration: 'none', fontSize: 9, fontWeight: 700, padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <i className="fas fa-house" style={{ fontSize: 20 }} />
            Portada
          </Link>
          <a href="#radio-mobile" className="mob-nav-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: '#64748b', textDecoration: 'none', fontSize: 9, fontWeight: 700, padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <i className="fas fa-radio" style={{ fontSize: 20 }} />
            Radio
          </a>
          <a href="#mas-leidas" className="mob-nav-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: '#64748b', textDecoration: 'none', fontSize: 9, fontWeight: 700, padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <i className="fas fa-fire" style={{ fontSize: 20 }} />
            Top
          </a>
          <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener" className="mob-nav-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: '#64748b', textDecoration: 'none', fontSize: 9, fontWeight: 700, padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <i className="fab fa-whatsapp" style={{ fontSize: 20 }} />
            Seguir
          </a>
        </div>
      </nav>

      {/* Footer */}
      <footer className="footer-deep site-footer" style={{ color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 0, paddingTop: 48, paddingBottom: 24, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32, marginBottom: 40 }} className="footer-grid">
            {/* Brand */}
            <div style={{ gridColumn: '1 / 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <img src="/logo.png" alt="Logo" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover' }} />
                <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 16 }}>Nicaragua Informate</div>
              </div>
              <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.7, marginBottom: 16, maxWidth: 240 }}>
                Cubriendo las noticias más importantes de Nicaragua al instante, con compromiso y rigor informativo.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {[
                  { href: 'https://facebook.com/profile.php?id=61578261125687', icon: 'fa-facebook-f', color: '#1877F2' },
                  { href: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17', icon: 'fa-whatsapp', color: '#25D366' },
                  { href: 'https://t.me/+fHHjncJqMQM3NjZh', icon: 'fa-telegram-plane', color: '#0088cc' },
                ].map(({ href, icon, color }) => (
                  <a key={icon} href={href} target="_blank" rel="noopener" 
                    style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textDecoration: 'none', fontSize: 14, transition: 'all 0.2s' }}
                    className="footer-social-btn">
                    <i className={`fab ${icon}`} />
                  </a>
                ))}
              </div>
            </div>
            {/* Secciones */}
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13, marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.07)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Secciones</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {['Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Espectáculos'].map((cat) => (
                  <a key={cat} href={`/?cat=${encodeURIComponent(cat)}`}
                    style={{ color: '#64748b', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }} className="footer-link">
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: catColor(cat), display: 'inline-block', flexShrink: 0 }} />{cat}
                  </a>
                ))}
              </div>
            </div>
            {/* Legal */}
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13, marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.07)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Legal</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  { href: '/nosotros', label: 'Sobre Nosotros' },
                  { href: '/privacidad', label: 'Privacidad' },
                  { href: '/cookies', label: 'Cookies' },
                  { href: '/terminos', label: 'Términos de Uso' },
                  { href: '/politica-editorial', label: 'Política Editorial' },
                ].map(({ href, label }) => (
                  <a key={href} href={href} style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }} className="footer-link">{label}</a>
                ))}
              </div>
            </div>
            {/* Contacto */}
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13, marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.07)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contacto</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#64748b' }}>
                  <i className="fas fa-map-marker-alt" style={{ color: '#e53e3e', marginTop: 2, flexShrink: 0 }} /> Managua, Nicaragua
                </div>
                <a href="mailto:redaccion@nicaraguainformate.com" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#64748b', textDecoration: 'none', wordBreak: 'break-all' }} className="footer-link">
                  <i className="fas fa-envelope" style={{ color: '#e53e3e', marginTop: 2, flexShrink: 0 }} /> redaccion@nicaraguainformate.com
                </a>
                <Link href="/contacto" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', textDecoration: 'none' }} className="footer-link">
                  <i className="fas fa-paper-plane" style={{ color: '#e53e3e', flexShrink: 0 }} /> Formulario de contacto
                </Link>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '6px 0', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Síguenos</span>
                  <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', textDecoration: 'none' }} className="footer-link">
                    <span style={{ width: 20, height: 20, borderRadius: 4, background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11 }}><i className="fab fa-whatsapp" /></span> Canal WhatsApp
                  </a>
                  <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', textDecoration: 'none' }} className="footer-link">
                    <span style={{ width: 20, height: 20, borderRadius: 4, background: '#0088cc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11 }}><i className="fab fa-telegram-plane" /></span> Canal Telegram
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 12, color: '#334155' }}>
            <span>© {new Date().getFullYear()} Nicaragua Informate. Todos los derechos reservados. Managua, Nicaragua.</span>
            <a href="/feed.xml" style={{ color: '#f97316', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="fas fa-rss" /> Feed RSS
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        .hover-card:hover { border-color: rgba(229,62,62,0.4) !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .hover-card:hover .card-img { transform: scale(1.05); }
        .trend-item:hover span:last-child { color: var(--ink) !important; }
        .footer-link:hover { color: #f1f5f9 !important; }
        .social-icon-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .cat-ribbon-link:hover { color: var(--ink) !important; border-bottom-color: #e53e3e !important; background: rgba(229,62,62,0.05); }
        .mas-leidas-item:hover { background: var(--paper-accent); }
        .tag-chip:hover { background: #e53e3e !important; color: #fff !important; border-color: #e53e3e !important; }
        .social-follow-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .footer-link:hover { color: #e2e8f0 !important; }
        .social-grid-btn:hover { filter:brightness(1.1); transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,0.15); }
        .top-social-btn:hover { background: rgba(255,255,255,0.15) !important; color: #fff !important; border-color: rgba(255,255,255,0.2) !important; transform: translateY(-1px); }
        .footer-social-btn:hover { background: rgba(255,255,255,0.1) !important; color: #fff !important; border-color: rgba(255,255,255,0.15) !important; transform: translateY(-2px); }
        @media(max-width:980px){.footer-grid{grid-template-columns:1fr 1fr!important}.footer-brand{grid-column:1/-1}}
        @media(max-width:640px){.footer-grid{grid-template-columns:1fr!important}}
        /* Social widget hover effects */
        .social-item{transition:all .25s cubic-bezier(.4,0,.2,1)}
        .social-item:hover{transform:translateY(-2px);box-shadow:0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -4px rgba(0,0,0,0.1);border-color:transparent}
        .social-item:active{transform:translateY(0)}
        .social-item--fb:hover .social-item__icon{background:#1877F2!important;color:#fff!important}
        .social-item--wa:hover .social-item__icon{background:#25D366!important;color:#fff!important}
        .social-item--tg:hover .social-item__icon{background:#0088cc!important;color:#fff!important}
        .social-item--rss:hover .social-item__icon{background:#f26522!important;color:#fff!important}
        .social-item__icon{transition:all .25s cubic-bezier(.4,0,.2,1)}
      `}</style>
    </div>
  );
}
