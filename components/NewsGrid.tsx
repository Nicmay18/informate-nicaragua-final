'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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

const FALLBACK_IMAGE = '/logo.png';
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
  const [page, setPage] = useState(1);

  const filtered = activeCat === 'Todas' ? noticias : noticias.filter(n => n.categoria === activeCat);
  const shown = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = shown.length < filtered.length;

  function switchCat(c: string) { setActiveCat(c); setPage(1); }

  return (
    <div>
      <style>{`
        .ng-card { display:flex; gap:16px; padding:20px 0; border-bottom:1px solid var(--border-light); text-decoration:none; transition: all 0.2s ease; }
        .ng-card:hover { padding-left: 8px; }
        .ng-card:last-child { border-bottom:none; }
        .ng-thumb { flex-shrink:0; width:168px; height:114px; border-radius:12px; overflow:hidden; background:var(--gray-100); position:relative; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .ng-thumb img { width:100%; height:100%; object-fit:cover; transition:transform 0.5s cubic-bezier(0.4,0,0.2,1); }
        .ng-card:hover .ng-thumb img { transform:scale(1.06); }
        .ng-title { color:var(--ink); font-weight:700; font-size:16px; line-height:1.35; margin:0; letter-spacing:-0.2px; transition:color 0.15s; }
        .ng-card:hover .ng-title { color:#8c1d18; }
        .ng-cat-btn { padding:7px 15px; border-radius:999px; font-size:12px; font-weight:700; border:1.5px solid; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; gap:5px; white-space:nowrap; }
        .ng-cat-btn:hover { transform:translateY(-1px); box-shadow:0 4px 10px rgba(0,0,0,0.1); }
        .ng-load-btn { padding:10px 26px; border:2px solid var(--ink); color:var(--ink); background:none; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; transition:all 0.2s; }
        .ng-load-btn:hover { background:var(--ink); color:var(--paper); }
        @media(max-width:580px){
          .ng-thumb { width:110px; height:80px; border-radius:10px; }
          .ng-title { font-size:14px; }
          .ng-cats-row { gap:6px; }
          .ng-cat-btn { padding:5px 11px; font-size:11px; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 4, height: 24, background: '#e53e3e', borderRadius: 2, flexShrink: 0 }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-0.3px' }}>Últimas Noticias</h2>
        <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
        <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600, flexShrink: 0 }}>{filtered.length} artículos</span>
      </div>

      <div className="ng-cats-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATS.map(c => {
          const active = c === activeCat;
          const color = c === 'Todas' ? '#8c1d18' : (CAT_COLORS[c] || '#374151');
          return (
            <button key={c} onClick={() => switchCat(c)} className="ng-cat-btn"
              style={{ background: active ? color : 'transparent', color: active ? '#fff' : 'var(--ink-muted)', borderColor: active ? color : 'var(--border-light)' }}>
              {c !== 'Todas' && <i className={`fas ${CAT_ICONS[c] || 'fa-newspaper'}`} style={{ fontSize: 10 }} />}
              {c}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--ink-faint)' }}>
          <i className="fas fa-newspaper" style={{ fontSize: 34, marginBottom: 12, display: 'block' }} />
          <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Sin publicaciones por el momento</div>
          <div style={{ fontSize: 14 }}>Actualizaremos esta sección en cuanto haya nueva información.</div>
        </div>
      ) : (
        <div>
          {shown.map(n => (
            <Link key={n.id} href={`/noticias/${n.slug}`} className="ng-card">
              <div className="ng-thumb">
                <Image
                  src={n.imagen || FALLBACK_IMAGE}
                  alt={n.titulo}
                  width={140}
                  height={100}
                  loading="lazy"
                  quality={75}
                  className="w-full h-full object-cover rounded"
                />
                <div style={{
                  position: 'absolute', top: 8, left: 8,
                  background: CAT_COLORS[n.categoria] || '#374151',
                  color: '#fff', fontSize: 9, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.09em',
                  padding: '2px 8px', borderRadius: 4,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {n.categoria}
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0, justifyContent: 'center' }}>
                <h3 className="ng-title" style={{ fontSize: 16, lineHeight: 1.35, fontWeight: 700, marginBottom: 4 }}>{n.titulo}</h3>
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
                      {readTime(n.titulo, n.resumen)} min
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', paddingTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {hasMore && (
          <button onClick={() => setPage(p => p + 1)} className="ng-load-btn">
            <i className="fas fa-arrow-down" style={{ marginRight: 8 }} />
            Cargar más
          </button>
        )}
        <Link href={activeCat === 'Todas' ? '/noticias' : `/noticias?cat=${encodeURIComponent(activeCat)}`}
          style={{ padding: '10px 26px', color: '#fff', background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(140, 29, 24, 0.15)' }}>
          <i className="fas fa-newspaper" />
          {activeCat === 'Todas' ? 'Ver todas' : `Ver: ${activeCat}`}
        </Link>
      </div>
    </div>
  );
}
