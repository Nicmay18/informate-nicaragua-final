import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Todas las Noticias',
  description: 'Explora todas las noticias de Nicaragua: sucesos, nacionales, deportes, internacionales, espectáculos y más.',
  alternates: { canonical: 'https://nicaraguainformate.com/noticias' },
};

const CATS = ['Todas', 'Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Espectáculos'];

const CAT_COLOR: Record<string, string> = {
  Sucesos: '#dc2626', Nacionales: '#1d4ed8', Deportes: '#16a34a',
  Internacionales: '#7c3aed', Espectáculos: '#db2777', General: '#64748b',
};

const CAT_ICON: Record<string, string> = {
  Sucesos: 'fa-triangle-exclamation', Nacionales: 'fa-flag',
  Deportes: 'fa-futbol', Internacionales: 'fa-globe', Espectáculos: 'fa-star',
};

const FALLBACK_IMAGE = '/logo.png';

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
  searchParams: Promise<{ cat?: string; page?: string }>;
}) {
  const { cat = 'Todas', page = '1' } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10));
  const itemsPerPage = 24;
  const offset = (currentPage - 1) * itemsPerPage;

  let snap;
  let totalCount = 0;

  try {
    if (cat !== 'Todas') {
      const countSnap = await adminDb.collection('noticias').where('categoria', '==', cat).count().get();
      totalCount = countSnap.data().count;
      snap = await adminDb.collection('noticias').where('categoria', '==', cat).orderBy('fecha', 'desc').offset(offset).limit(itemsPerPage).get();
    } else {
      const countSnap = await adminDb.collection('noticias').count().get();
      totalCount = countSnap.data().count;
      snap = await adminDb.collection('noticias').orderBy('fecha', 'desc').offset(offset).limit(itemsPerPage).get();
    }
  } catch (error) {
    console.error('[NoticiasIndex] Error:', error);
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: '#94a3b8' }}>
        <i className="fas fa-exclamation-circle" style={{ fontSize: 48, color: '#8c1d18' }} />
        <h2 style={{ color: '#fff' }}>Error al cargar noticias</h2>
        <Link href="/noticias" style={{ color: '#8c1d18', fontWeight: 600 }}>Recargar →</Link>
      </div>
    );
  }

  const noticias = snap.docs.map(d => {
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
  }).sort((a, b) => b.ts - a.ts);

  const featured = noticias[0];
  const rest = noticias.slice(1);
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5' }}>
      {/* Header interno */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', padding: '32px 24px 0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <Link href="/" style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <i className="fas fa-arrow-left" style={{ fontSize: 11 }} /> Inicio
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 28 }}>
            <div>
              <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.03em', color: '#fff' }}>
                {cat === 'Todas' ? 'Todas las Noticias' : cat}
              </h1>
              <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
                {totalCount} artículos publicados
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontSize: 12, fontWeight: 700 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Actualizado en tiempo real
            </div>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 16 }}>
            {CATS.map(c => {
              const isActive = c === cat;
              const color = c === 'Todas' ? '#8c1d18' : (CAT_COLOR[c] || '#64748b');
              return (
                <Link
                  key={c}
                  href={c === 'Todas' ? '/noticias' : `/noticias?cat=${encodeURIComponent(c)}`}
                  style={{
                    padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                    textDecoration: 'none', border: '1.5px solid', whiteSpace: 'nowrap',
                    background: isActive ? color : 'transparent',
                    color: isActive ? '#fff' : '#94a3b8',
                    borderColor: isActive ? color : 'rgba(255,255,255,0.1)',
                    transition: 'all 0.2s',
                  }}
                >
                  {c !== 'Todas' && <i className={`fas ${CAT_ICON[c]}`} style={{ fontSize: 10, marginRight: 6 }} />}
                  {c}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 80px' }}>
        {noticias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
            <i className="fas fa-newspaper" style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
            <p>No hay noticias en esta categoría.</p>
            <Link href="/noticias" style={{ color: '#8c1d18', fontWeight: 600 }}>Ver todas →</Link>
          </div>
        ) : (
          <>
            {/* Destacada */}
            {featured && (
              <Link href={`/noticias/${featured.slug}`} style={{ display: 'flex', flexDirection: 'row', background: '#171717', borderRadius: 16, overflow: 'hidden', border: '1px solid #262626', textDecoration: 'none', color: 'inherit', marginBottom: 32, transition: 'all 0.25s' }} className="featured-card">
                <div style={{ width: '45%', flexShrink: 0, minHeight: 280, position: 'relative' }}>
                  <Image src={featured.imagen || FALLBACK_IMAGE} alt={featured.titulo} fill style={{ objectFit: 'cover' }} priority quality={85} />
                </div>
                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ background: CAT_COLOR[featured.categoria] || '#64748b', color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 12px', borderRadius: 4 }}>
                      {featured.categoria}
                    </span>
                    <span style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 4 }}>
                      Destacado
                    </span>
                  </div>
                  <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: 0 }}>
                    {featured.titulo}
                  </h2>
                  {featured.resumen && <p style={{ color: '#a3a3a3', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{featured.resumen}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, fontSize: 13, color: '#737373' }}>
                    <span><i className="fas fa-clock" style={{ color: '#8c1d18', marginRight: 4 }} />{featured.fecha}</span>
                    <span style={{ color: '#8c1d18', fontWeight: 700 }}>Leer artículo →</span>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {rest.map(n => (
                <Link key={n.id} href={`/noticias/${n.slug}`} style={{ background: '#171717', borderRadius: 14, overflow: 'hidden', border: '1px solid #262626', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', transition: 'all 0.25s' }} className="news-card">
                  <div style={{ aspectRatio: '16/9', position: 'relative', overflow: 'hidden' }}>
                    <Image src={n.imagen || FALLBACK_IMAGE} alt={n.titulo} fill loading="lazy" quality={75} style={{ objectFit: 'cover', transition: 'transform 0.5s' }} />
                    <div style={{ position: 'absolute', top: 12, left: 12, background: CAT_COLOR[n.categoria] || '#64748b', color: '#fff', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '3px 10px', borderRadius: 4 }}>
                      {n.categoria}
                    </div>
                  </div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    <h3 style={{ color: '#f5f5f5', fontWeight: 700, fontSize: 15, lineHeight: 1.35, margin: 0 }}>{n.titulo}</h3>
                    {n.resumen && <p style={{ color: '#737373', fontSize: 13, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.resumen}</p>}
                    <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#525252' }}>
                      <span>{n.fecha}</span>
                      <span style={{ color: '#8c1d18', fontWeight: 700 }}>Leer →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48, paddingTop: 24, borderTop: '1px solid #262626' }}>
                {currentPage > 1 && (
                  <Link href={cat === 'Todas' ? `/noticias?page=${currentPage - 1}` : `/noticias?cat=${encodeURIComponent(cat)}&page=${currentPage - 1}`}
                    style={{ padding: '10px 16px', background: '#171717', border: '1px solid #333', borderRadius: 8, color: '#e5e5e5', textDecoration: 'none', fontWeight: 600 }}>
                    ← Anterior
                  </Link>
                )}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <Link key={pageNum} href={cat === 'Todas' ? `/noticias?page=${pageNum}` : `/noticias?cat=${encodeURIComponent(cat)}&page=${pageNum}`}
                      style={{
                        padding: '10px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: pageNum === currentPage ? 700 : 600,
                        background: pageNum === currentPage ? '#8c1d18' : '#171717', color: pageNum === currentPage ? '#fff' : '#e5e5e5',
                        border: '1px solid ' + (pageNum === currentPage ? '#8c1d18' : '#333'),
                      }}>
                      {pageNum}
                    </Link>
                  );
                })}
                {currentPage < totalPages && (
                  <Link href={cat === 'Todas' ? `/noticias?page=${currentPage + 1}` : `/noticias?cat=${encodeURIComponent(cat)}&page=${currentPage + 1}`}
                    style={{ padding: '10px 16px', background: '#171717', border: '1px solid #333', borderRadius: 8, color: '#e5e5e5', textDecoration: 'none', fontWeight: 600 }}>
                    Siguiente →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        .featured-card:hover { border-color: rgba(140,29,24,0.4) !important; transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .news-card:hover { border-color: rgba(140,29,24,0.3) !important; transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.3); }
        .news-card:hover img { transform: scale(1.08) !important; }
      `}</style>
    </div>
  );
}
