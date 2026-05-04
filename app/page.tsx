import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import WeatherWidget from '@/components/WeatherWidget';
import IndicadoresWidget from '@/components/IndicadoresWidget';

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
      <div style={{ background: '#0a0e1a', color: '#94a3b8', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '6px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="fas fa-calendar-alt" style={{ color: '#e53e3e', fontSize: 11 }} />
            {new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            <span style={{ color: '#475569' }}>|</span>
            <i className="fas fa-map-marker-alt" style={{ color: '#e53e3e', fontSize: 11 }} /> Managua, Nicaragua
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener" style={{ color: '#94a3b8', textDecoration: 'none' }} aria-label="Facebook"><i className="fab fa-facebook-f" /></a>
            <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener" style={{ color: '#94a3b8', textDecoration: 'none' }} aria-label="WhatsApp"><i className="fab fa-whatsapp" /></a>
            <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener" style={{ color: '#94a3b8', textDecoration: 'none' }} aria-label="Telegram"><i className="fab fa-telegram-plane" /></a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(12px)', borderBottom: '2px solid #e53e3e' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <img src="/logo.png" alt="Nicaragua Informate" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover' }} />
            <div>
              <div style={{ color: '#e53e3e', fontWeight: 800, fontSize: 18, lineHeight: 1.2, letterSpacing: '-0.3px' }}>Nicaragua Informate</div>
              <div style={{ color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Noticias de Nicaragua</div>
            </div>
          </Link>
          <nav style={{ display: 'flex', gap: 2 }} className="hidden md:flex">
            {['Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Espectáculos'].map((cat) => (
              <a key={cat} href={`/?cat=${encodeURIComponent(cat)}`} className="nav-cat-link">
                {cat}
              </a>
            ))}
          </nav>
          <a href="/feed.xml" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f97316', fontSize: 12, fontWeight: 600, textDecoration: 'none' }} className="hidden md:flex">
            <i className="fas fa-rss" /> RSS
          </a>
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
              className={`cat-ribbon-link cat-ribbon-${cat.name.toLowerCase().replace(/[^a-z]/g,'')}`}>
              <i className={`fas ${cat.icon}`} style={{ color: cat.color, fontSize: 12 }} />
              {cat.name}
            </a>
          ))}
          <a href="/feed.xml" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#f97316', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            <i className="fas fa-rss" /> RSS
          </a>
        </div>
      </div>

      {/* Breaking News Ticker */}
      {tickerNews.length > 0 && (
        <div style={{ background: '#e53e3e', color: '#fff', fontSize: 13, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <div style={{ background: '#9b1c1c', padding: '8px 16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', flexShrink: 0, fontSize: 11 }}>
            <i className="fas fa-bolt" style={{ marginRight: 6 }} />Última Hora
          </div>
          <div style={{ overflow: 'hidden', flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(90deg, #9b1c1c, transparent)', zIndex: 1, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(270deg, #e53e3e, transparent)', zIndex: 1, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', animation: 'ticker 70s linear infinite', whiteSpace: 'nowrap', padding: '9px 0' }} className="ticker-scroll">
              {[...tickerNews, ...tickerNews].map((n, i) => (
                <Link key={`${n.id}-${i}`} href={`/noticias/${n.slug}`}
                  style={{ color: '#fff', textDecoration: 'none', marginRight: 56, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <i className="fas fa-circle" style={{ fontSize: 6, color: '#fca5a5' }} />{n.titulo}
                </Link>
              ))}
            </div>
          </div>
          <style>{`@keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } } .ticker-scroll:hover { animation-play-state: paused; }`}</style>
        </div>
      )}

      {/* Hero Section */}
      {destacadas.length > 0 && (
        <section style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px 8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="md:grid-cols-2 grid-cols-1">
            {/* Main featured */}
            {destacadas[0] && (
              <Link href={`/noticias/${destacadas[0].slug}`}
                style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, display: 'block', textDecoration: 'none', aspectRatio: '16/10', gridRow: '1 / 3' }}>
                <img src={destacadas[0].imagen || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80'}
                  alt={destacadas[0].titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                  className="group-img" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 }}>
                  <span style={{ background: catColor(destacadas[0].categoria), color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '3px 10px', borderRadius: 4 }}>
                    {destacadas[0].categoria}
                  </span>
                  <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginTop: 10, lineHeight: 1.3, letterSpacing: '-0.3px' }}>{destacadas[0].titulo}</h2>
                  {destacadas[0].resumen && (
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {destacadas[0].resumen}
                    </p>
                  )}
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 10 }}>
                    <i className="fas fa-clock" style={{ marginRight: 4 }} />{formatDate(destacadas[0].fecha)}
                  </div>
                </div>
              </Link>
            )}
            {/* Secondary featured */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {destacadas.slice(1, 5).map((n) => (
                <Link key={n.id} href={`/noticias/${n.slug}`}
                  style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, display: 'block', textDecoration: 'none', aspectRatio: '4/3' }}>
                  <img src={n.imagen || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80'}
                    alt={n.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px' }}>
                    <span style={{ background: catColor(n.categoria), color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 3 }}>
                      {n.categoria}
                    </span>
                    <h3 style={{ color: '#fff', fontSize: 12, fontWeight: 700, marginTop: 4, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {n.titulo}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section divider */}
      <div style={{ maxWidth: 1400, margin: '20px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 4, height: 24, background: '#e53e3e', borderRadius: 2 }} />
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-0.3px' }}>Últimas Noticias</h2>
          <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
        </div>
      </div>

      {/* Main Grid */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 48px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }} id="main-content" className="lg:grid-cols-[1fr_320px] grid-cols-1">
        <div>
          {recientes.length === 0 && noticias.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-faint)' }}>
              <i className="fas fa-newspaper" style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
              <p>No hay noticias disponibles en este momento.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }} className="md:grid-cols-2 grid-cols-1">
              {(recientes.length > 0 ? recientes : noticias).map((n) => (
                <article key={n.id} style={{ background: 'var(--paper-accent)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-light)', transition: 'all 0.25s', display: 'flex', flexDirection: 'column' }}
                  className="hover-card">
                  <Link href={`/noticias/${n.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
                      <img src={n.imagen || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80'}
                        alt={n.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} className="card-img" />
                    </div>
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ background: catColor(n.categoria), color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 4 }}>
                          {n.categoria}
                        </span>
                        {n.fecha && (
                          <span style={{ color: 'var(--ink-faint)', fontSize: 11 }}>
                            <i className="fas fa-clock" style={{ marginRight: 3, fontSize: 10 }} />{formatDate(n.fecha)}
                          </span>
                        )}
                      </div>
                      <h3 style={{ color: 'var(--ink)', fontWeight: 700, fontSize: 15, lineHeight: 1.4, margin: 0, letterSpacing: '-0.2px' }}>{n.titulo}</h3>
                      {n.resumen && (
                        <p style={{ color: 'var(--ink-muted)', fontSize: 13, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {n.resumen}
                        </p>
                      )}
                      <div style={{ marginTop: 'auto', paddingTop: 8, color: '#e53e3e', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Leer más <i className="fas fa-arrow-right" style={{ fontSize: 10 }} />
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Trending */}
          <div style={{ background: 'var(--paper-accent)', borderRadius: 14, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ background: '#e53e3e', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-fire" style={{ color: '#fff', fontSize: 14 }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tendencias</span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {noticias.slice(0, 6).map((n, i) => (
                <Link key={n.id} href={`/noticias/${n.slug}`} style={{ display: 'flex', gap: 12, padding: '10px 16px', textDecoration: 'none', borderBottom: i < 5 ? '1px solid var(--border-light)' : 'none', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: i === 0 ? '#e53e3e' : 'var(--border-medium)', minWidth: 28, lineHeight: 1 }}>{i + 1}</span>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: catColor(n.categoria), display: 'block', marginBottom: 3 }}>{n.categoria}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.titulo}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Clima */}
          <WeatherWidget />

          {/* Indicadores */}
          <IndicadoresWidget />

          {/* Más Leídas — numbered */}
          {masLeidas.length > 0 && (
            <div style={{ background: 'var(--paper-accent)', borderRadius: 14, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ background: '#8c1d18', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
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

          {/* Síguenos */}
          <div style={{ background: 'var(--paper-accent)', borderRadius: 14, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ background: '#0f172a', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-share-nodes" style={{ color: '#94a3b8', fontSize: 14 }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Síguenos</span>
            </div>
            <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { href: 'https://facebook.com/profile.php?id=61578261125687', icon: 'fa-facebook-f', label: 'Facebook', bg: '#1877f2', count: '' },
                { href: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17', icon: 'fa-whatsapp', label: 'WhatsApp', bg: '#25d366', count: 'Canal' },
                { href: 'https://t.me/+fHHjncJqMQM3NjZh', icon: 'fa-telegram-plane', label: 'Telegram', bg: '#0088cc', count: 'Canal' },
              ].map(s => (
                <a key={s.href} href={s.href} target="_blank" rel="noopener"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px', borderRadius: 10, background: s.bg + '15', border: `1px solid ${s.bg}30`, textDecoration: 'none', transition: 'all 0.2s' }}
                  className="social-follow-btn">
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`fab ${s.icon}`} style={{ color: '#fff', fontSize: 14 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{s.label}</div>
                    {s.count && <div style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{s.count}</div>}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Tags cloud */}
          <div style={{ background: 'var(--paper-accent)', borderRadius: 14, border: '1px solid var(--border-light)', padding: 16 }}>
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

      {/* Floating buttons */}
      <div style={{ position: 'fixed', bottom: 24, right: 22, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 40, alignItems: 'center' }}>
        <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener" aria-label="Canal WhatsApp"
          style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#25d366,#128c7e)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(37,211,102,0.45)', fontSize: 20, textDecoration: 'none', position: 'relative', transition: 'transform 0.2s' }}
          className="float-btn">
          <i className="fab fa-whatsapp" />
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(37,211,102,0.35)', animation: 'floatPulse 2s infinite' }} />
        </a>
        <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener" aria-label="Canal Telegram"
          style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#0088cc,#006699)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,136,204,0.4)', fontSize: 19, textDecoration: 'none', transition: 'transform 0.2s' }}
          className="float-btn">
          <i className="fab fa-telegram-plane" />
        </a>
        <style>{`@keyframes floatPulse { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(1.6);opacity:0} } .float-btn:hover { transform: scale(1.12) !important; }`}</style>
      </div>

      {/* Footer */}
      <footer style={{ background: '#0a0e1a', color: '#64748b', borderTop: '3px solid #e53e3e', marginTop: 0, paddingTop: 48, paddingBottom: 24, paddingLeft: 24, paddingRight: 24 }}>
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
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { href: 'https://facebook.com/profile.php?id=61578261125687', icon: 'fa-facebook-f', bg: '#1877f2' },
                  { href: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17', icon: 'fa-whatsapp', bg: '#25d366' },
                  { href: 'https://t.me/+fHHjncJqMQM3NjZh', icon: 'fa-telegram-plane', bg: '#0088cc' },
                ].map(({ href, icon, bg }) => (
                  <a key={icon} href={href} target="_blank" rel="noopener"
                    style={{ width: 34, height: 34, borderRadius: 8, background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, textDecoration: 'none' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#64748b' }}>
                  <i className="fas fa-map-marker-alt" style={{ color: '#e53e3e', marginTop: 2, flexShrink: 0 }} /> Managua, Nicaragua
                </div>
                <a href="mailto:kelingrivera20@gmail.com" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#64748b', textDecoration: 'none', wordBreak: 'break-all' }}>
                  <i className="fas fa-envelope" style={{ color: '#e53e3e', marginTop: 2, flexShrink: 0 }} /> kelingrivera20@gmail.com
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
                  <i className="fas fa-phone" style={{ color: '#e53e3e', flexShrink: 0 }} /> +505 8239-3844
                </div>
                <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#25d366', textDecoration: 'none', fontWeight: 600 }}>
                  <i className="fab fa-whatsapp" /> Canal WhatsApp
                </a>
                <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
                  <i className="fab fa-telegram-plane" /> Canal Telegram
                </a>
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
        .nav-cat-link { padding: 6px 12px; font-size: 13px; color: #cbd5e1; text-decoration: none; border-radius: 6px; font-weight: 500; transition: all 0.2s; }
        .nav-cat-link:hover { color: #fff; background: rgba(255,255,255,0.08); }
        .trend-item:hover span:last-child { color: var(--ink) !important; }
        .footer-link:hover { color: #f1f5f9 !important; }
        .social-icon-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .cat-ribbon-link:hover { color: var(--ink) !important; border-bottom-color: #e53e3e !important; background: rgba(229,62,62,0.05); }
        .mas-leidas-item:hover { background: var(--paper-accent); }
        .tag-chip:hover { background: #e53e3e !important; color: #fff !important; border-color: #e53e3e !important; }
        .social-follow-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .footer-link:hover { color: #e2e8f0 !important; }
        @media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr !important;} .footer-grid>div:first-child{grid-column:1/-1;}}
      `}</style>
    </div>
  );
}
