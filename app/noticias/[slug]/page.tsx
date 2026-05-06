import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';
import type { Metadata } from 'next';
import { AudioButton, CopyButton, ShareChip, ShareSticky, SocialFooter } from '@/components/ArticleClient';

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const snapshot = await adminDb.collection('noticias').select('slug').limit(500).get();
    return snapshot.docs.map((doc) => ({ slug: doc.data().slug as string }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const snap = await adminDb.collection('noticias').where('slug', '==', slug).limit(1).get();
  if (snap.empty) return { title: 'Noticia no encontrada' };
  const n = snap.docs[0].data();
  return {
    title: `${n.titulo} | Nicaragua Informate`,
    description: n.resumen || n.titulo,
    alternates: { canonical: `https://nicaraguainformate.com/noticias/${slug}` },
    openGraph: {
      type: 'article',
      title: n.titulo,
      description: n.resumen || n.titulo,
      images: [n.imagen || 'https://nicaraguainformate.com/logo.png'],
      publishedTime: n.fecha?.toDate ? n.fecha.toDate().toISOString() : n.fecha,
    },
  };
}

function fmtDate(ts: unknown): string {
  if (!ts) return 'Hace un momento';
  try {
    const d = (ts as { toDate?: () => Date }).toDate ? (ts as { toDate: () => Date }).toDate() : new Date(ts as string);
    return d.toLocaleDateString('es-NI', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return 'Hace un momento';
  }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

const FALLBACK_IMAGE = '/logo.png';

async function getRelated(categoria: string, currentSlug: string): Promise<Array<{ id: string; slug: string; titulo: string; imagen: string; categoria: string; fecha: string }>> {
  try {
    const snap = await adminDb.collection('noticias')
      .where('categoria', '==', categoria)
      .orderBy('fecha', 'desc')
      .limit(6)
      .get();
    return snap.docs
      .filter(d => d.data().slug !== currentSlug)
      .slice(0, 4)
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          slug: data.slug || d.id,
          titulo: data.titulo || '',
          imagen: data.imagen || '',
          categoria: data.categoria || 'General',
          fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || '',
        };
      });
  } catch { return []; }
}

async function getMostRead(currentSlug: string): Promise<Array<{ id: string; slug: string; titulo: string; categoria: string }>> {
  try {
    const snap = await adminDb.collection('noticias')
      .orderBy('fecha', 'desc')
      .limit(8)
      .get();
    return snap.docs
      .filter(d => d.data().slug !== currentSlug)
      .slice(0, 5)
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          slug: data.slug || d.id,
          titulo: data.titulo || '',
          categoria: data.categoria || 'General',
        };
      });
  } catch { return []; }
}

const CAT_COLORS: Record<string, string> = {
  Sucesos: '#dc2626', Nacionales: '#1d4ed8', Deportes: '#16a34a',
  Internacionales: '#7c3aed', Espectáculos: '#db2777',
};

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const snap = await adminDb.collection('noticias').where('slug', '==', slug).limit(1).get();
  if (snap.empty) notFound();

  const n = snap.docs[0].data();
  const url = `https://nicaraguainformate.com/noticias/${slug}`;
  const isPremium = n.premium === true;
  const wordCount = countWords(n.contenido || '');
  const readTime = Math.ceil(wordCount / 200);
  const fechaStr = fmtDate(n.fecha);
  const autor = n.autor || 'Keyling Rivera M.';
  const autorInitial = autor.charAt(0).toUpperCase();
  const imgUrl = n.imagen || FALLBACK_IMAGE;
  const related = await getRelated(n.categoria || 'General', slug);
  const mostRead = await getMostRead(slug);

  const fechaISO = n.fecha?.toDate ? n.fecha.toDate().toISOString() : new Date(n.fecha).toISOString();
  const fechaMod = n.fechaActualizacion?.toDate
    ? n.fechaActualizacion.toDate().toISOString()
    : fechaISO;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: n.titulo,
    description: n.resumen || n.titulo,
    image: n.imagen || 'https://nicaraguainformate.com/logo.png',
    datePublished: fechaISO,
    dateModified: fechaMod,
    author: {
      '@type': 'Person',
      name: autor,
      url: 'https://nicaraguainformate.com/nosotros',
      jobTitle: n.autorRol || 'Periodista',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Nicaragua Informate',
      url: 'https://nicaraguainformate.com',
      logo: { '@type': 'ImageObject', url: 'https://nicaraguainformate.com/logo.png', width: 512, height: 512 },
      sameAs: [
        'https://facebook.com/profile.php?id=61578261125687',
        'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17',
        'https://t.me/+fHHjncJqMQM3NjZh',
      ],
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    articleSection: n.categoria || 'General',
    wordCount,
    isAccessibleForFree: !isPremium,
    inLanguage: 'es',
  };

  let contentIsHTML = false;
  function normalizeContent(text: string): string[] {
    if (!text) return [];
    if (/<p[>\s]/i.test(text)) {
      contentIsHTML = true;
      const matches = text.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
      return matches.map((m) => m.replace(/<\/?p[^>]*>/gi, '').trim()).filter((p) => p.length > 0);
    }
    return text
      .replace(/\n{3,}/g, '\n\n')
      .split('\n\n')
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter((p) => p.length > 0);
  }
  const allPars = normalizeContent(n.contenido || '');
  const previewPars = isPremium ? allPars.slice(0, 2) : allPars;
  const hiddenPars = isPremium ? allPars.slice(2) : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://nicaraguainformate.com' },
          { '@type': 'ListItem', position: 2, name: 'Noticias', item: 'https://nicaraguainformate.com/noticias' },
          { '@type': 'ListItem', position: 3, name: n.categoria || 'General', item: `https://nicaraguainformate.com/noticias?cat=${encodeURIComponent(n.categoria || 'General')}` },
          { '@type': 'ListItem', position: 4, name: n.titulo },
        ],
      }) }} />

      <div id="readProgress" className="read-progress" />

      {/* Header */}
      <header className="masthead" style={{ position: 'relative', zIndex: 50, background: 'rgba(255,253,249,0.97)', borderBottom: '2px solid #e5e0d8' }}>
        <div className="masthead-inner">
          <Link href="/" className="masthead-brand">
            <img src="/logo.png" alt="Nicaragua Informate" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} />
            <span className="masthead-brand-text">
              Nicaragua <span style={{ color: 'var(--ink)' }}>Informate</span>
            </span>
          </Link>
          <nav className="masthead-nav">
            <Link href="/noticias" className="nav-btn" style={{ background: 'rgba(140,29,24,0.06)', color: 'var(--brand)', borderColor: 'rgba(140,29,24,0.15)' }}>
              <i className="fas fa-newspaper" style={{ fontSize: 11 }} /> Noticias
            </Link>
            <Link href="/" className="nav-btn">
              <i className="fas fa-house" style={{ fontSize: 11 }} /> Inicio
            </Link>
          </nav>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 28px 0', fontSize: 12, color: '#9f968d', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }} aria-label="Breadcrumb">
        <Link href="/" style={{ color: '#756d66', textDecoration: 'none', fontWeight: 500 }}>Inicio</Link>
        <span style={{ color: '#c6beb5' }}>/</span>
        <span style={{ color: '#756d66', fontWeight: 500 }}>{n.categoria || 'General'}</span>
        <span style={{ color: '#c6beb5' }}>/</span>
        <span style={{ color: '#9f968d', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300, whiteSpace: 'nowrap' }}>{n.titulo}</span>
      </nav>

      <style>{`.article-grid{max-width:1200px;margin:0 auto;padding:28px 28px 88px;display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:48px;align-items:start}@media(max-width:1024px){.article-grid{grid-template-columns:1fr;gap:32px;padding:24px 20px 80px}.article-aside{position:static!important}}`}</style>
      <main className="article-grid">
        <article style={{ minWidth: 0 }}>
          <header style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8c1d18', padding: '6px 12px', background: 'rgba(140,29,24,0.07)', borderRadius: 3 }}>
                {isPremium ? '💎 Premium' : (n.categoria || 'General')}
              </span>
              <span style={{ flex: 1, height: 1, background: '#ddd6ce' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#9f968d', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{fechaStr}</span>
            </div>

            <h1 style={{ fontFamily: "'Crimson Pro', 'Times New Roman', Georgia, serif", fontSize: 'clamp(32px,4.5vw,52px)', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em', color: '#18181b', marginBottom: 16 }}>
              {n.titulo}
            </h1>

            {n.resumen && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(17px,1.9vw,20px)', fontWeight: 400, lineHeight: 1.6, color: '#27272a', marginBottom: 20 }}>
                {n.resumen}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 28, padding: '16px 0', borderTop: '1px solid #ddd6ce', borderBottom: '1px solid #ddd6ce' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#8c1d18 0%,#6f1713 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 600 }}>
                  {autorInitial}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#18181b' }}>{autor}</span>
                  <span style={{ fontSize: 12, color: '#9f968d', fontWeight: 500 }}>{n.autorRol || 'Nicaragua Informate'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#9f968d', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><i className="far fa-calendar" style={{ color: '#8c1d18' }} /> {fechaStr}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><i className="far fa-clock" style={{ color: '#8c1d18' }} /> {readTime} min de lectura</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><i className="fas fa-align-left" style={{ color: '#8c1d18' }} /> {wordCount} palabras</span>
              </div>
            </div>
          </header>

          <figure style={{ margin: '0 0 36px 0' }}>
            <img
              src={imgUrl}
              alt={n.titulo}
              style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', objectPosition: 'center 25%', borderRadius: 4, display: 'block', border: '1px solid #ddd6ce', userSelect: 'none' }}
            />
            <figcaption style={{ marginTop: 10, paddingTop: 10, borderTop: '2px solid #18181b', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 28, height: 2, background: '#8c1d18', marginTop: 9, flexShrink: 0 }} />
              <div>
                {n.resumen && (
                  <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 14, lineHeight: 1.6, color: '#3f3f46', fontStyle: 'italic', margin: '0 0 4px' }}>
                    {n.resumen.length > 140 ? n.resumen.slice(0, 140) + '...' : n.resumen} — <strong style={{ fontStyle: 'normal', color: '#8c1d18' }}>{n.categoria || 'General'}</strong>
                  </p>
                )}
                <span style={{ fontSize: 10, color: '#9f968d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nicaragua Informate / Archivo</span>
              </div>
            </figcaption>
          </figure>

          <AudioButton titulo={n.titulo} resumen={n.resumen || ''} contenido={n.contenido || ''} />

          {/* Article body */}
          <div style={{ fontFamily: "'Crimson Pro','Times New Roman',Georgia,serif", fontSize: 'clamp(17px,1.8vw,20px)', lineHeight: 1.75, color: '#27272a', userSelect: 'none' }}>
            {previewPars.map((p, i) => (
              <p key={i} className={i === 0 ? 'drop-cap' : ''}
                style={{ marginBottom: '1.6em', textAlign: 'justify', hyphens: 'auto' }}
                dangerouslySetInnerHTML={{ __html: contentIsHTML ? p : p }}
              />
            ))}
          </div>
          <style>{`.drop-cap::first-letter { float: left; font-size: 4.5em; line-height: 0.8; font-weight: 700; color: #8c1d18; font-family: 'Crimson Pro', Georgia, serif; margin: 4px 8px 0 0; padding: 0 4px; }`}</style>

          {/* Premium paywall */}
          {isPremium && hiddenPars.length > 0 && (
            <>
              <div style={{ margin: '48px 0', padding: '48px 40px', background: 'linear-gradient(180deg,#f6efe4 0%,#fff 100%)', border: '1px solid #d6b38a', borderRadius: 8, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#9a3412,#f59e0b,#9a3412)' }} />
                <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#fbbf24,#d97706)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28, color: 'white' }}>💎</div>
                <h3 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 26, fontWeight: 700, color: '#18181b', marginBottom: 10 }}>Contenido exclusivo para suscriptores</h3>
                <p style={{ fontSize: 15, color: '#5b5b5f', maxWidth: 420, margin: '0 auto 28px', lineHeight: 1.6 }}>Accede al análisis completo de esta noticia y a todo nuestro contenido premium sin límites.</p>
                <a href="https://paypal.me/NicaraguaInformate/5" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 32px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', borderRadius: 999, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                  👑 Suscribirme — $5/mes
                </a>
              </div>
              <div style={{ position: 'relative', maxHeight: 180, overflow: 'hidden', pointerEvents: 'none', userSelect: 'none' }}>
                <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 'clamp(17px,1.8vw,20px)', lineHeight: 1.75, color: '#27272a', filter: 'blur(6px)' }}>
                  {hiddenPars.map((p, i) => (
                    <p key={i} style={{ marginBottom: '1.6em', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: contentIsHTML ? p : p }} />
                  ))}
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 140, background: 'linear-gradient(to bottom,transparent,#fffdf9)' }} />
              </div>
            </>
          )}

          {/* Share panel */}
          {!isPremium && (
            <>
              <div style={{ margin: '56px 0 0', padding: '28px 0', borderTop: '1px solid #ddd6ce', borderBottom: '1px solid #ddd6ce' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9f968d', marginBottom: 16 }}>Compartir artículo</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <ShareChip href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} label="Facebook" bg="#1877f2" />
                  <ShareChip href={`https://wa.me/?text=${encodeURIComponent(n.titulo + ' — ' + url)}`} label="WhatsApp" bg="#25d366" />
                  <ShareChip href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(n.titulo)}`} label="Telegram" bg="#0088cc" />
                  <ShareChip href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(n.titulo)}`} label="X / Twitter" bg="#0f1419" />
                </div>
              </div>
              <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['#' + (n.categoria || 'General').replace(/\s/g, ''), '#Nicaragua', '#Noticias'].map((tag) => (
                  <span key={tag} style={{ padding: '6px 14px', background: '#f1ece4', border: '1px solid #ddd6ce', borderRadius: 999, fontSize: 12, fontWeight: 500, color: '#756d66' }}>{tag}</span>
                ))}
              </div>
            </>
          )}

          {/* Author Box - E-E-A-T */}
          <div className="author-box" style={{ marginTop: 48, padding: '24px 28px', background: '#f7f4ee', border: '1px solid #ddd6ce', borderRadius: 12, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#8c1d18 0%,#6f1713 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
              {autorInitial}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#18181b', marginBottom: 2 }}>{autor}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8c1d18', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{n.autorRol || 'Periodista'}</div>
              <p style={{ fontSize: 13, color: '#5b5b5f', lineHeight: 1.6, margin: 0 }}>
                Periodista de Nicaragua Informate. Comprometida con el rigor informativo, la verificación de fuentes y el periodismo ético al servicio de la ciudadanía.
              </p>
              <Link href="/nosotros" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 12, fontWeight: 600, color: '#8c1d18', textDecoration: 'none' }}>
                Ver equipo editorial <i className="fas fa-arrow-right" style={{ fontSize: 10 }} />
              </Link>
            </div>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="article-aside" style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Noticias relacionadas */}
          {related.length > 0 && (
            <div style={{ background: '#fffdf9', border: '1px solid #ddd6ce', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #ddd6ce', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(140,29,24,0.04)' }}>
                <i className="fas fa-layer-group" style={{ color: '#8c1d18', fontSize: 13 }} />
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#18181b' }}>Noticias relacionadas</span>
              </div>
              <div style={{ padding: '4px 0' }}>
                {related.map((r, i) => (
                  <Link key={r.id} href={`/noticias/${r.slug}`} style={{ display: 'flex', gap: 10, padding: '12px 16px', textDecoration: 'none', borderBottom: i < related.length - 1 ? '1px solid #f1ece4' : 'none' }}>
                    <div style={{ width: 84, height: 56, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#f1ece4' }}>
                      <img src={r.imagen || FALLBACK_IMAGE} alt={r.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: CAT_COLORS[r.categoria] || '#8c1d18', display: 'block', marginBottom: 3 }}>{r.categoria}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#18181b', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.titulo}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Más leídas */}
          {mostRead.length > 0 && (
            <div style={{ background: '#fffdf9', border: '1px solid #ddd6ce', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #ddd6ce', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(140,29,24,0.04)' }}>
                <i className="fas fa-fire" style={{ color: '#8c1d18', fontSize: 13 }} />
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#18181b' }}>Más leídas</span>
              </div>
              <div style={{ padding: '4px 0' }}>
                {mostRead.map((m, i) => (
                  <Link key={m.id} href={`/noticias/${m.slug}`} style={{ display: 'flex', gap: 12, padding: '12px 16px', textDecoration: 'none', borderBottom: i < mostRead.length - 1 ? '1px solid #f1ece4' : 'none', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: i === 0 ? '#8c1d18' : '#c6beb5', lineHeight: 1, minWidth: 26, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: CAT_COLORS[m.categoria] || '#8c1d18', display: 'block', marginBottom: 3 }}>{m.categoria}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#18181b', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.titulo}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Newsletter mini */}
          <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 12, padding: 18, color: '#fff' }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>¿Te gustó esta noticia?</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, lineHeight: 1.5 }}>Recibe lo más importante de Nicaragua en tu correo, sin spam.</div>
            <form action="/api/newsletter" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="email" name="email" required placeholder="tu@email.com"
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13 }} />
              <button type="submit" style={{ padding: '9px 12px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Suscribirme
              </button>
            </form>
          </div>

          {/* Seguir en redes */}
          <div style={{ background: '#fffdf9', border: '1px solid #ddd6ce', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#18181b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fas fa-share-nodes" style={{ color: '#8c1d18' }} /> Síguenos
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { href: 'https://facebook.com/profile.php?id=61578261125687', icon: 'fa-facebook-f', label: 'Facebook', bg: '#1877f2' },
                { href: 'https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17', icon: 'fa-whatsapp', label: 'WhatsApp', bg: '#25d366' },
                { href: 'https://t.me/+fHHjncJqMQM3NjZh', icon: 'fa-telegram-plane', label: 'Telegram', bg: '#0088cc' },
                { href: '/feed.xml', icon: 'fa-rss', label: 'RSS', bg: '#f97316' },
              ].map(s => (
                <a key={s.href} href={s.href} target={s.href.startsWith('http') ? '_blank' : undefined} rel={s.href.startsWith('http') ? 'noopener' : undefined}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 8px', borderRadius: 7, background: s.bg, color: '#fff', textDecoration: 'none', fontSize: 11.5, fontWeight: 700 }}>
                  <i className={`${s.icon === 'fa-rss' ? 'fas' : 'fab'} ${s.icon}`} style={{ fontSize: 12 }} />
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Sticky share sidebar (desktop only — hidden on narrow screens) */}
      <style>{`.share-sticky-desktop{display:none}@media(min-width:1440px){.share-sticky-desktop{display:flex!important}}`}</style>
      <aside className="share-sticky-desktop" style={{ position: 'fixed', left: 'calc((100vw - 1200px) / 2 - 64px)', top: '50%', transform: 'translateY(-50%)', flexDirection: 'column', gap: 10, zIndex: 50 }}>
        <ShareSticky href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} icon="facebook-f" color="#1877f2" />
        <ShareSticky href={`https://wa.me/?text=${encodeURIComponent(n.titulo + ' — ' + url)}`} icon="whatsapp" color="#25d366" />
        <ShareSticky href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(n.titulo)}`} icon="x-twitter" color="#0f1419" />
        <CopyButton url={url} />
      </aside>

      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '48px 24px 24px', marginTop: 60, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="art-footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32, marginBottom: 36 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <img src="/logo.png" alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover' }} />
                <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 16 }}>Nicaragua Informate</div>
              </div>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7, marginBottom: 14, maxWidth: 240 }}>
                Periodismo de precisión. Cubriendo Nicaragua al instante con rigor informativo.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <SocialFooter href="https://www.facebook.com/profile.php?id=61578261125687" icon="facebook-f" />
                <SocialFooter href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" icon="whatsapp" />
                <SocialFooter href="https://t.me/+fHHjncJqMQM3NjZh" icon="telegram-plane" />
              </div>
            </div>
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13, marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.07)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Secciones</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {['Sucesos','Nacionales','Deportes','Internacionales','Espectáculos'].map(c => (
                  <Link key={c} href={`/?cat=${encodeURIComponent(c)}`} style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>{c}</Link>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13, marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.07)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Legal</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <Link href="/nosotros" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>Sobre Nosotros</Link>
                <Link href="/privacidad" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>Privacidad</Link>
                <Link href="/cookies" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>Cookies</Link>
                <Link href="/terminos" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>Términos de Uso</Link>
                <Link href="/politica-editorial" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>Política Editorial</Link>
              </div>
            </div>
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13, marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.07)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contacto</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#64748b' }}>
                  <i className="fas fa-map-marker-alt" style={{ color: '#e53e3e', marginTop: 2 }} /> Managua, Nicaragua
                </span>
                <a href="mailto:redaccion@nicaraguainformate.com" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#64748b', textDecoration: 'none', wordBreak: 'break-all' }}>
                  <i className="fas fa-envelope" style={{ color: '#e53e3e', marginTop: 2 }} /> redaccion@nicaraguainformate.com
                </a>
                <Link href="/contacto" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', textDecoration: 'none' }}>
                  <i className="fas fa-paper-plane" style={{ color: '#e53e3e' }} /> Formulario de contacto
                </Link>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 12, color: '#475569' }}>
            <span>© {new Date().getFullYear()} Nicaragua Informate. Todos los derechos reservados.</span>
            <a href="/feed.xml" style={{ color: '#f97316', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="fas fa-rss" /> Feed RSS
            </a>
          </div>
        </div>
        <style>{`@media(max-width:768px){.art-footer-grid{grid-template-columns:1fr 1fr!important}.art-footer-grid>div:first-child{grid-column:1/-1}}@media(max-width:480px){.art-footer-grid{grid-template-columns:1fr!important}}`}</style>
      </footer>

      <script dangerouslySetInnerHTML={{ __html: `(function(){var b=document.getElementById('readProgress');if(!b)return;window.addEventListener('scroll',function(){var d=document.documentElement;var h=d.scrollHeight-d.clientHeight;if(h>0)b.style.width=Math.round(((window.scrollY||d.scrollTop)/h)*100)+'%';},{passive:true});})();` }} />
    </>
  );
}
