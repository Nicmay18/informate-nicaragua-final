'use client';
import { useState } from 'react';
import Link from 'next/link';

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
  Sucesos: '#dc2626', Nacionales: '#1d4ed8', Deportes: '#16a34a',
  Internacionales: '#7c3aed', 'Espectáculos': '#db2777', General: '#374151',
};

const CAT_ICONS: Record<string, string> = {
  Sucesos: 'fa-triangle-exclamation', Nacionales: 'fa-flag',
  Deportes: 'fa-futbol', Internacionales: 'fa-globe', 'Espectáculos': 'fa-star',
};

const FALLBACKS: Record<string, string> = {
  Sucesos: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&q=75',
  Nacionales: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&q=75',
  Deportes: 'https://images.unsplash.com/photo-1461896836934-f66c71d1ef65?w=400&q=75',
  Internacionales: 'https://images.unsplash.com/photo-1526304640152-d4619684e484?w=400&q=75',
  'Espectáculos': 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400&q=75',
};

const CATS = ['Todas', 'Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Espectáculos'];
const PAGE_SIZE = 8;

function timeAgo(iso: string): string {
  if (!iso) return '';
  try {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'Hace un momento';
    const m = Math.floor(s / 60); if (m < 60) return `Hace ${m} min`;
    const h = Math.floor(m / 60); if (h < 24) return `Hace ${h} h`;
    const d = Math.floor(h / 24); if (d < 7) return `Hace ${d} días`;
    return new Date(iso).toLocaleDateString('es-NI', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

function readTime(titulo: string, resumen: string): number {
  return Math.max(1, Math.ceil((titulo + ' ' + resumen).split(/\s+/).length / 180));
}

export default function NewsGrid({ noticias }: { noticias: Noticia[] }) {
  const [activeCat, setActiveCat] = useState('Todas');
  const [page, setPage]           = useState(1);

  const filtered = activeCat === 'Todas' ? noticias : noticias.filter(n => n.categoria === activeCat);
  const shown    = filtered.slice(0, page * PAGE_SIZE);
  const hasMore  = shown.length < filtered.length;

  function switchCat(c: string) { setActiveCat(c); setPage(1); }

  return (
    <div>
      <style>{`
        .ng-card { display:flex; gap:16px; padding:20px 0; border-bottom:1px solid var(--border-light); text-decoration:none; }
        .ng-card:last-child { border-bottom:none; }
        .ng-thumb { flex-shrink:0; width:168px; height:114px; border-radius:10px; overflow:hidden; background:#e5e7eb; }
        .ng-thumb img { width:100%; height:100%; object-fit:cover; transition:transform 0.5s ease; }
        .ng-card:hover .ng-thumb img { transform:scale(1.06); }
        .ng-title { color:var(--ink); font-weight:700; font-size:16px; line-height:1.35; margin:0; letter-spacing:-0.2px; transition:color 0.15s; }
        .ng-card:hover .ng-title { color:#8c1d18; }
        .ng-cat-btn { padding:7px 15px; border-radius:999px; font-size:12px; font-weight:700; border:1.5px solid; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; gap:5px; white-space:nowrap; }
        .ng-cat-btn:hover { transform:translateY(-1px); box-shadow:0 4px 10px rgba(0,0,0,0.1); }
        .ng-load-btn { padding:10px 26px; border:2px solid var(--ink); color:var(--ink); background:none; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; transition:all 0.2s; }
        .ng-load-btn:hover { background:var(--ink); color:var(--paper); }
        @media(max-width:580px){
          .ng-thumb { width:110px; height:80px; border-radius:8px; }
          .ng-title { font-size:14px; }
          .ng-cats-row { gap:6px; }
          .ng-cat-btn { padding:5px 11px; font-size:11px; }
        }
      `}</style>

      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 4, height: 24, background: '#e53e3e', borderRadius: 2, flexShrink: 0 }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-0.3px' }}>Últimas Noticias</h2>
        <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
        <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600, flexShrink: 0 }}>{filtered.length} artículos</span>
      </div>

      {/* ── Category filter pills ── */}
      <div className="ng-cats-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATS.map(c => {
          const active = c === activeCat;
          const color  = c === 'Todas' ? '#8c1d18' : (CAT_COLORS[c] || '#374151');
          return (
            <button key={c} onClick={() => switchCat(c)} className="ng-cat-btn"
              style={{ background: active ? color : 'transparent', color: active ? '#fff' : 'var(--ink-muted)', borderColor: active ? color : 'var(--border-light)' }}>
              {c !== 'Todas' && <i className={`fas ${CAT_ICONS[c] || 'fa-newspaper'}`} style={{ fontSize: 10 }} />}
              {c}
            </button>
          );
        })}
      </div>

      {/* ── Articles ── */}
      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-faint)' }}>
          <i className="fas fa-newspaper" style={{ fontSize: 36, marginBottom: 12, display: 'block' }} />
          No hay noticias en esta categoría.
        </div>
      ) : (
        <div>
          {shown.map(n => (
            <Link key={n.id} href={`/noticias/${n.slug}`} className="ng-card">
              {/* Thumbnail */}
              <div className="ng-thumb">
                <img src={n.imagen || FALLBACKS[n.categoria] || FALLBACKS['Nacionales']} alt={n.titulo} loading="lazy" />
              </div>

              {/* Text */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0, justifyContent: 'center' }}>
                <div>
                  <span style={{ background: CAT_COLORS[n.categoria] || '#374151', color: '#fff', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', padding: '2px 8px', borderRadius: 4 }}>
                    {n.categoria}
                  </span>
                </div>
                <h3 className="ng-title">{n.titulo}</h3>
                {n.resumen && (
                  <p style={{ color: 'var(--ink-muted)', fontSize: 13, lineHeight: 1.55, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {n.resumen}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: 'var(--ink-faint)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="fas fa-clock" style={{ color: '#8c1d18', fontSize: 10 }} />
                    {timeAgo(n.fecha)}
                  </span>
                  {readTime(n.titulo, n.resumen) > 2 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="fas fa-book-open" style={{ fontSize: 10 }} />
                      {readTime(n.titulo, n.resumen)} min de lectura
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ textAlign: 'center', paddingTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {hasMore && (
          <button onClick={() => setPage(p => p + 1)} className="ng-load-btn">
            <i className="fas fa-arrow-down" style={{ marginRight: 8 }} />
            Cargar más noticias
          </button>
        )}
        <Link href={activeCat === 'Todas' ? '/noticias' : `/noticias?cat=${encodeURIComponent(activeCat)}`}
          style={{ padding: '10px 26px', border: '2px solid #8c1d18', color: '#fff', background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <i className="fas fa-newspaper" />
          {activeCat === 'Todas' ? 'Ver todas las noticias' : `Ver todo: ${activeCat}`}
        </Link>
      </div>
    </div>
  );
}
