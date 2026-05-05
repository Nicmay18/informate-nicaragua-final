import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Todas las Noticias | Nicaragua Informate',
  description: 'Explora todas las noticias de Nicaragua: sucesos, nacionales, deportes, internacionales, espectáculos y más.',
};

const CATS = ['Todas', 'Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Espectáculos'];

const CAT_COLOR: Record<string, string> = {
  Sucesos: '#dc2626', Nacionales: '#1d4ed8', Deportes: '#16a34a',
  Internacionales: '#7c3aed', 'Espectáculos': '#db2777', General: '#374151',
};

const CAT_ICON: Record<string, string> = {
  Sucesos: 'fa-triangle-exclamation', Nacionales: 'fa-building-columns',
  Deportes: 'fa-futbol', Internacionales: 'fa-globe', 'Espectáculos': 'fa-film',
};

const PLACEHOLDERS: Record<string, string> = {
  Sucesos: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=600&q=80',
  Nacionales: 'https://images.unsplash.com/photo-1526666923127-b2970f64b422?w=600&q=80',
  Deportes: 'https://images.unsplash.com/photo-1461896836934-f66c71d1ef65?w=600&q=80',
  Internacionales: 'https://images.unsplash.com/photo-1526304640152-d4619684e484?w=600&q=80',
  'Espectáculos': 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=600&q=80',
};

function fmtDate(ts: unknown): string {
  if (!ts) return '';
  try {
    const d = (ts as { toDate?: () => Date }).toDate
      ? (ts as { toDate: () => Date }).toDate()
      : new Date(ts as string);
    return d.toLocaleDateString('es-NI', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

export default async function NoticiasIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat = 'Todas' } = await searchParams;

  let snap;
  if (cat !== 'Todas') {
    snap = await adminDb.collection('noticias').where('categoria', '==', cat).limit(60).get();
  } else {
    snap = await adminDb.collection('noticias').orderBy('fecha', 'desc').limit(60).get();
  }

  const noticias = snap.docs
    .map(d => {
      const data = d.data();
      return {
        id: d.id,
        slug: data.slug || d.id,
        titulo: data.titulo || '',
        resumen: data.resumen || '',
        categoria: data.categoria || 'General',
        imagen: data.imagen || '',
        fecha: fmtDate(data.fecha),
        ts: data.fecha?.toDate ? data.fecha.toDate().getTime() : 0,
      };
    })
    .sort((a, b) => b.ts - a.ts);

  const featured = noticias[0];
  const rest = noticias.slice(1);

  return (
    <>
      <style>{`
        .ni-cat-chip { padding:8px 18px; border-radius:999px; font-size:13px; font-weight:700; text-decoration:none; border:1.5px solid transparent; transition:all 0.2s; display:inline-flex; align-items:center; gap:6px; white-space:nowrap; }
        .ni-cat-chip:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.12); }
        .ni-news-card { background:#fff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb; transition:all 0.25s; display:flex; flex-direction:column; text-decoration:none; }
        .ni-news-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,0.1); border-color:rgba(140,29,24,0.2); }
        .ni-news-card .img-wrap { overflow:hidden; }
        .ni-news-card:hover .ni-card-img { transform:scale(1.05); }
        .ni-card-img { width:100%; height:100%; object-fit:cover; transition:transform 0.5s ease; }
        @media(max-width:768px){
          .ni-grid { grid-template-columns:1fr !important; }
          .ni-cats { padding:0 12px; }
          .ni-featured { flex-direction:column !important; }
          .ni-featured-img { height:220px !important; }
          .ni-page-header { padding:24px 16px 0 !important; }
          .ni-content { padding:0 12px 80px !important; }
        }
      `}</style>

      {/* Page header */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', color: '#fff', padding: '40px 24px 0' }} className="ni-page-header">
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <Link href="/" style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <i className="fas fa-arrow-left" style={{ fontSize: 11 }} /> Inicio
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 28 }}>
            <div>
              <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.03em' }}>
                {cat === 'Todas' ? 'Todas las Noticias' : cat}
              </h1>
              <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
                {noticias.length} artículos publicados
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontSize: 12, fontWeight: 700 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite', display: 'inline-block' }} />
              Actualizado en tiempo real
            </div>
          </div>

          {/* Category filter chips */}
          <div className="ni-cats" style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 0, marginBottom: -1 }}>
            {CATS.map(c => {
              const isActive = c === cat;
              const color = c === 'Todas' ? '#8c1d18' : (CAT_COLOR[c] || '#374151');
              return (
                <Link
                  key={c}
                  href={c === 'Todas' ? '/noticias' : `/noticias?cat=${encodeURIComponent(c)}`}
                  className="ni-cat-chip"
                  style={{
                    background: isActive ? color : 'rgba(255,255,255,0.06)',
                    color: isActive ? '#fff' : '#94a3b8',
                    borderColor: isActive ? color : 'rgba(255,255,255,0.1)',
                  }}
                >
                  {c !== 'Todas' && <i className={`fas ${CAT_ICON[c] || 'fa-newspaper'}`} style={{ fontSize: 11 }} />}
                  {c}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 80px' }} className="ni-content">

        {noticias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
            <i className="fas fa-newspaper" style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
            <p style={{ fontSize: 16 }}>No hay noticias en esta categoría aún.</p>
            <Link href="/noticias" style={{ color: '#8c1d18', fontWeight: 600, textDecoration: 'none' }}>Ver todas las noticias →</Link>
          </div>
        ) : (
          <>
            {/* Featured top article */}
            {featured && (
              <Link href={`/noticias/${featured.slug}`} className="ni-news-card" style={{ display: 'flex', flexDirection: 'row', marginBottom: 32, minHeight: 240 }} aria-label={featured.titulo}>
                <div className="img-wrap ni-featured-img" style={{ width: '45%', flexShrink: 0, height: 'auto', minHeight: 240 }}>
                  <img
                    src={featured.imagen || PLACEHOLDERS[featured.categoria] || PLACEHOLDERS['Nacionales']}
                    alt={featured.titulo}
                    className="ni-card-img"
                    style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: CAT_COLOR[featured.categoria] || '#374151', color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '3px 10px', borderRadius: 4 }}>
                      {featured.categoria}
                    </span>
                    <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Destacado
                    </span>
                  </div>
                  <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 700, color: '#18181b', lineHeight: 1.2, margin: 0, letterSpacing: '-0.02em' }}>
                    {featured.titulo}
                  </h2>
                  {featured.resumen && (
                    <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {featured.resumen}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
                    <span style={{ color: '#9ca3af', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="fas fa-clock" style={{ color: '#8c1d18', fontSize: 11 }} /> {featured.fecha}
                    </span>
                    <span style={{ color: '#8c1d18', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Leer artículo <i className="fas fa-arrow-right" style={{ fontSize: 11 }} />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 4, height: 22, background: '#8c1d18', borderRadius: 2 }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#18181b', margin: 0 }}>
                {cat === 'Todas' ? 'Últimas publicaciones' : `Más de ${cat}`}
              </h2>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{rest.length} artículos</span>
            </div>

            {/* Grid */}
            <div className="ni-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {rest.map(n => (
                <Link key={n.id} href={`/noticias/${n.slug}`} className="ni-news-card">
                  <div className="img-wrap" style={{ aspectRatio: '16/9' }}>
                    <img
                      src={n.imagen || PLACEHOLDERS[n.categoria] || PLACEHOLDERS['Nacionales']}
                      alt={n.titulo}
                      className="ni-card-img"
                    />
                  </div>
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ background: CAT_COLOR[n.categoria] || '#374151', color: '#fff', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 4 }}>
                        {n.categoria}
                      </span>
                      {n.fecha && (
                        <span style={{ color: '#9ca3af', fontSize: 11 }}>{n.fecha}</span>
                      )}
                    </div>
                    <h3 style={{ color: '#18181b', fontWeight: 700, fontSize: 15, lineHeight: 1.4, margin: 0 }}>
                      {n.titulo}
                    </h3>
                    {n.resumen && (
                      <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {n.resumen}
                      </p>
                    )}
                    <div style={{ marginTop: 'auto', paddingTop: 8, color: '#8c1d18', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Leer más <i className="fas fa-arrow-right" style={{ fontSize: 10 }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
