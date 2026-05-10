'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, Flag, Trophy, Globe, Star, Newspaper, ArrowDown } from 'lucide-react';
import { FALLBACK_IMAGE, type Noticia } from '@/lib/types';
import { formatDateShortES } from '@/lib/formateo';

const CAT_COLORS: Record<string, string> = {
  Sucesos: '#dc2626', Nacionales: '#1d4ed8', Deportes: '#16a34a',
  Internacionales: '#7c3aed', 'Espectáculos': '#db2777', General: '#374151',
};

const CAT_ICONS: Record<string, React.ReactNode> = {
  Sucesos: <AlertTriangle size={10} />, Nacionales: <Flag size={10} />,
  Deportes: <Trophy size={10} />, Internacionales: <Globe size={10} />, 'Espectáculos': <Star size={10} />,
};

const CATS = ['Todas', 'Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Espectáculos'];
const PAGE_SIZE = 8;

function calcTimeAgo(iso: string): string {
  if (!iso) return '';
  try {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'Hace un momento';
    const m = Math.floor(s / 60); if (m < 60) return `Hace ${m} min`;
    const h = Math.floor(m / 60); if (h < 24) return `Hace ${h} h`;
    const d = Math.floor(h / 24); if (d < 7) return `Hace ${d} días`;
    return formatDateShortES(iso);
  } catch { return ''; }
}

function readTime(titulo: string, resumen: string): number {
  return Math.max(1, Math.ceil((titulo + ' ' + resumen).split(/\s+/).length / 180));
}

export default function NewsGrid({ noticias }: { noticias: Noticia[] }) {
  const [activeCat, setActiveCat] = useState('Todas');
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const filtered = activeCat === 'Todas' ? noticias : noticias.filter(n => n.categoria === activeCat);
  const shown = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = shown.length < filtered.length;

  function switchCat(c: string) { setActiveCat(c); setPage(1); }
  function timeAgo(iso: string): string {
    // SSR: mostrar fecha estática determinista
    if (!mounted) return iso ? formatDateShortES(iso) : '';
    // Cliente: calcular tiempo relativo
    return calcTimeAgo(iso);
  }

  return (
    <div>
      <style>{`
        .ng-card { display:grid; grid-template-columns:200px 1fr; gap:20px; padding:24px 0; border-bottom:1px solid #f0f0f4; text-decoration:none; transition:all 0.2s; color:inherit; }
        .ng-card:first-child { padding-top:0; }
        .ng-card:last-child { border-bottom:none; }
        .ng-card:hover { background:#faf9f7; margin:0 -16px; padding-left:16px; padding-right:16px; border-radius:8px; border-bottom-color:transparent; }
        .ng-card:hover + .ng-card { border-top:1px solid transparent; }
        .ng-thumb { position:relative; border-radius:8px; overflow:hidden; aspect-ratio:4/3; }
        .ng-thumb img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s ease; }
        .ng-card:hover .ng-thumb img { transform:scale(1.05); }
        .ng-thumb .category-badge { position:absolute; top:8px; left:8px; background:var(--accent); color:#fff; padding:3px 10px; border-radius:4px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
        .ng-content { display:flex; flex-direction:column; justify-content:center; }
        .ng-meta { display:flex; gap:12px; align-items:center; margin-bottom:8px; font-size:12px; color:#8a8a9e; font-weight:500; }
        .ng-meta .category { color:#c41e3a; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
        .ng-title { font-family:'Georgia',serif; font-size:18px; font-weight:700; line-height:1.35; color:#1a1a2e; margin-bottom:8px; transition:color 0.2s; }
        .ng-card:hover .ng-title { color:#c41e3a; }
        .ng-excerpt { font-size:14px; color:#5a5a6e; line-height:1.6; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .ng-cat-btn { padding:8px 18px; border-radius:100px; border:1px solid #e8e8ec; background:#fff; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; color:#5a5a6e; }
        .ng-cat-btn:hover { border-color:#c41e3a; color:#c41e3a; }
        .ng-cat-btn.active { background:#1a1a2e; color:#fff; border-color:#1a1a2e; }
        .ng-load-btn { padding:12px 28px; border-radius:4px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:inherit; border:1px solid #e8e8ec; background:#fff; color:#1a1a2e; }
        .ng-load-btn:hover { border-color:#1a1a2e; background:#1a1a2e; color:#fff; }
        @media(max-width:768px){
          .ng-card { grid-template-columns:120px 1fr; gap:14px; padding:16px 0; }
          .ng-card:hover { margin:0 -8px; padding-left:8px; padding-right:8px; }
          .ng-thumb { aspect-ratio:4/3; }
          .ng-title { font-size:15px; }
          .ng-excerpt { display:none; }
        }
        @media(max-width:480px){
          .ng-card { grid-template-columns:100px 1fr; }
        }
      `}</style>

      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #1a1a2e' }}>
        <h2 style={{ fontFamily: 'var(--font-merri)', fontSize: 20, fontWeight: 900, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
          <span style={{ width: 4, height: 24, background: '#c41e3a', borderRadius: 2, display: 'inline-block' }} />
          Últimas Noticias
        </h2>
        <span style={{ fontSize: 13, color: '#8a8a9e', fontWeight: 500 }}>{filtered.length} artículos</span>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {CATS.map(c => {
          const active = c === activeCat;
          return (
            <button key={c} onClick={() => switchCat(c)} className={`ng-cat-btn${active ? ' active' : ''}`}>
              {c !== 'Todas' && <span style={{ marginRight: 5 }}>{CAT_ICONS[c] || <Newspaper size={10} />}</span>}
              {c}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: '#8a8a9e' }}>
          <Newspaper size={34} style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>Sin publicaciones por el momento</div>
          <div style={{ fontSize: 14 }}>Actualizaremos esta sección en cuanto haya nueva información.</div>
        </div>
      ) : (
        <div className="news-list">
          {shown.map(n => (
            <Link key={n.id} href={`/noticias/${n.slug}`} className="ng-card">
              <div className="ng-thumb">
                <Image
                  src={n.imagen || FALLBACK_IMAGE}
                  alt={n.titulo}
                  width={200}
                  height={150}
                  loading="lazy"
                  quality={75}
                  className="object-cover"
                  sizes="(max-width: 768px) 120px, 200px"
                />
                <span className="category-badge" style={{ background: CAT_COLORS[n.categoria] || '#374151' }}>
                  {n.categoria}
                </span>
              </div>

              <div className="ng-content">
                <div className="ng-meta">
                  <span className="category">{n.categoria}</span>
                  <span>{timeAgo(n.fecha)}</span>
                  {readTime(n.titulo, n.resumen) > 2 && (
                    <span>{readTime(n.titulo, n.resumen)} min lectura</span>
                  )}
                </div>
                <h3 className="ng-title">{n.titulo}</h3>
                {n.resumen && (
                  <p className="ng-excerpt">{n.resumen}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Load More */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
        {hasMore && (
          <button onClick={() => setPage(p => p + 1)} className="ng-load-btn">
            <ArrowDown size={14} style={{ marginRight: 8 }} />
            Cargar más
          </button>
        )}
        <Link href={activeCat === 'Todas' ? '/noticias' : `/noticias?cat=${encodeURIComponent(activeCat)}`}
          style={{ padding: '12px 28px', color: '#fff', background: '#c41e3a', borderRadius: 4, fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#a01830'}
          onMouseLeave={e => e.currentTarget.style.background = '#c41e3a'}>
          <Newspaper size={14} />
          {activeCat === 'Todas' ? 'Ver todas' : `Ver: ${activeCat}`}
        </Link>
      </div>
    </div>
  );
}
