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

const PLACEHOLDERS: Record<string, string> = {
  Sucesos: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=1200&q=85',
  Nacionales: 'https://images.unsplash.com/photo-1526666923127-b2970f64b422?w=1200&q=85',
  Deportes: 'https://images.unsplash.com/photo-1461896836934-f66c71d1ef65?w=1200&q=85',
  Internacionales: 'https://images.unsplash.com/photo-1526304640152-d4619684e484?w=1200&q=85',
  Espectáculos: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=1200&q=85',
};

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
  const imgUrl = n.imagen || PLACEHOLDERS[n.categoria as string] || PLACEHOLDERS['Nacionales'];
  const related = await getRelated(n.categoria || 'General', slug);

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
    author: { '@type': 'Person', name: autor, url: 'https://nicaraguainformate.com' },
    publisher: {
      '@type': 'Organization',
      name: 'Nicaragua Informate',
      logo: { '@type': 'ImageObject', url: 'https://nicaraguainformate.com/logo.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    articleSection: n.categoria || 'General',
    wordCount,
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div id="readProgress" style={{ position: 'fixed', top: 0, left: 0, height: 3, background: '#8c1d18', zIndex: 1001, width: '0%', transition: 'width 0.1s linear' }} />

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,253,249,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #ddd6ce' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: '#18181b' }}>
            <img src="/logo.png" alt="Nicaragua Informate" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover' }} />
            <span style={{ fontFamily: "'Crimson Pro', 'Times New Roman', Georgia, serif", fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: '#8c1d18', lineHeight: 1.05 }}>
              Nicaragua <span style={{ color: '#18181b' }}>Informate</span>
            </span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 4, fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid #ddd6ce', color: '#5b5b5f' }}>
              ← Inicio
            </Link>
          </nav>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav style={{ maxWidth: 720, margin: '0 auto', padding: '16px 24px 0', fontSize: 12, color: '#9f968d', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }} aria-label="Breadcrumb">
        <Link href="/" style={{ color: '#756d66', textDecoration: 'none', fontWeight: 500 }}>Inicio</Link>
        <span style={{ color: '#c6beb5' }}>/</span>
        <span style={{ color: '#756d66', fontWeight: 500 }}>{n.categoria || 'General'}</span>
        <span style={{ color: '#c6beb5' }}>/</span>
        <span style={{ color: '#9f968d', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300, whiteSpace: 'nowrap' }}>{n.titulo}</span>
      </nav>

      <main style={{ maxWidth: 780, margin: '0 auto', padding: '28px 28px 88px' }}>
        <article>
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
        </article>
      </main>

      {/* Sticky share sidebar (desktop) */}
      <aside className="share-sticky-desktop" style={{ position: 'fixed', left: 'max(16px, calc((100vw - 920px) / 2 - 72px))', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 10, zIndex: 50 }}>
        <ShareSticky href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} icon="facebook-f" color="#1877f2" />
        <ShareSticky href={`https://wa.me/?text=${encodeURIComponent(n.titulo + ' — ' + url)}`} icon="whatsapp" color="#25d366" />
        <ShareSticky href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(n.titulo)}`} icon="x-twitter" color="#0f1419" />
        <CopyButton url={url} />
      </aside>

      {/* Related articles */}
      {related.length > 0 && (
        <section style={{ maxWidth: 780, margin: '0 auto', padding: '0 28px 60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <i className="fas fa-layer-group" style={{ color: '#8c1d18', fontSize: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#18181b', margin: 0 }}>Más noticias de {n.categoria || 'General'}</h2>
            <div style={{ flex: 1, height: 1, background: '#ddd6ce' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {related.map(r => (
              <Link key={r.id} href={`/noticias/${r.slug}`}
                style={{ textDecoration: 'none', borderRadius: 10, overflow: 'hidden', border: '1px solid #ddd6ce', display: 'flex', flexDirection: 'column' }}>
                <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                  <img src={r.imagen || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=70'}
                    alt={r.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#8c1d18', letterSpacing: '0.06em' }}>{r.categoria}</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#18181b', lineHeight: 1.4, margin: '6px 0 4px', letterSpacing: '-0.2px' }}>{r.titulo}</h3>
                  <span style={{ fontSize: 12, color: '#9f968d' }}>
                    {r.fecha ? new Date(r.fecha).toLocaleDateString('es-NI', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer style={{ background: '#18181b', color: '#9f968d', padding: '48px 24px 32px', marginTop: 80 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <img src="/logo.png" alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'contain', display: 'inline-block', marginBottom: 8 }} />
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, fontWeight: 700, color: '#fffdf9', marginBottom: 8 }}>Nicaragua Informate</div>
          <div style={{ fontSize: 13, color: '#756d66', marginBottom: 24 }}>Nicaragua Informate | Portal de noticias digital</div>
          <div style={{ width: 40, height: 1, background: '#5b5b5f', margin: '0 auto 24px' }} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
            <SocialFooter href="https://www.facebook.com/profile.php?id=61578261125687" icon="facebook-f" />
            <SocialFooter href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" icon="whatsapp" />
            <SocialFooter href="https://t.me/+fHHjncJqMQM3NjZh" icon="telegram-plane" />
          </div>
          <div style={{ fontSize: 12, color: '#5b5b5f', lineHeight: 1.8 }}>
            © 2025-2026 Nicaragua Informate. Todos los derechos reservados.<br />Managua, Nicaragua.
          </div>
        </div>
      </footer>

      <script dangerouslySetInnerHTML={{ __html: `(function(){var b=document.getElementById('readProgress');if(!b)return;window.addEventListener('scroll',function(){var d=document.documentElement;var h=d.scrollHeight-d.clientHeight;if(h>0)b.style.width=Math.round(((window.scrollY||d.scrollTop)/h)*100)+'%';},{passive:true});})();` }} />
    </>
  );
}
