import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { AudioButton, CopyButton, ShareChip } from '@/components/ArticleClient';

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const snapshot = await adminDb.collection('noticias').select('slug').limit(500).get();
    return snapshot.docs.map((doc) => ({ slug: doc.data().slug as string }));
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const snap = await adminDb.collection('noticias').where('slug', '==', slug).limit(1).get();
  if (snap.empty) return { title: 'Noticia no encontrada' };
  const n = snap.docs[0].data();
  return {
    title: n.titulo,
    description: n.resumen || n.titulo,
    alternates: { canonical: `https://nicaraguainformate.com/noticias/${slug}` },
    openGraph: { type: 'article', title: n.titulo, description: n.resumen || n.titulo, images: [n.imagen || 'https://nicaraguainformate.com/logo.png'] },
  };
}

function fmtDate(ts: unknown): string {
  if (!ts) return 'Hace un momento';
  try {
    const d = (ts as { toDate?: () => Date }).toDate ? (ts as { toDate: () => Date }).toDate() : new Date(ts as string);
    return d.toLocaleDateString('es-NI', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return 'Hace un momento'; }
}

function countWords(text: string): number { return text.trim().split(/\s+/).filter(w => w.length > 0).length; }
const FALLBACK_IMAGE = '/logo.png';

async function getRelated(categoria: string, currentSlug: string) {
  try {
    const snap = await adminDb.collection('noticias').where('categoria', '==', categoria).orderBy('fecha', 'desc').limit(6).get();
    return snap.docs.filter(d => d.data().slug !== currentSlug).slice(0, 4).map(d => {
      const data = d.data();
      return { id: d.id, slug: data.slug || d.id, titulo: data.titulo || '', imagen: data.imagen || '', categoria: data.categoria || 'General', fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha || '' };
    });
  } catch { return []; }
}

async function getMostRead(currentSlug: string) {
  try {
    const snap = await adminDb.collection('noticias').orderBy('fecha', 'desc').limit(8).get();
    return snap.docs.filter(d => d.data().slug !== currentSlug).slice(0, 5).map(d => {
      const data = d.data();
      return { id: d.id, slug: data.slug || d.id, titulo: data.titulo || '', categoria: data.categoria || 'General' };
    });
  } catch { return []; }
}

const CAT_COLORS: Record<string, string> = { Sucesos: '#dc2626', Nacionales: '#1d4ed8', Deportes: '#16a34a', Internacionales: '#7c3aed', Espectáculos: '#db2777' };

function cleanNestedTags(html: string): string {
  if (!html) return '';
  let c = html.replace(/<p>\s*<p>/gi, '<p>').replace(/<\/p>\s*<\/p>/gi, '</p>');
  c = c.replace(/<b>\s*<b>/gi, '<b>').replace(/<\/b>\s*<\/b>/gi, '</b>');
  c = c.replace(/<strong>\s*<strong>/gi, '<strong>').replace(/<\/strong>\s*<\/strong>/gi, '</strong>');
  c = c.replace(/<i>\s*<i>/gi, '<i>').replace(/<\/i>\s*<\/i>/gi, '</i>');
  c = c.replace(/<em>\s*<em>/gi, '<em>').replace(/<\/em>\s*<\/em>/gi, '</em>');
  return c;
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const snap = await adminDb.collection('noticias').where('slug', '==', slug).limit(1).get();
  if (snap.empty) notFound();

  const n = snap.docs[0].data();
  const url = `https://nicaraguainformate.com/noticias/${slug}`;
  const wordCount = countWords(n.contenido || '');
  const readTime = Math.ceil(wordCount / 200);
  const fechaStr = fmtDate(n.fecha);
  const autor = n.autor || 'Keyling Rivera M.';
  const autorInitial = autor.charAt(0).toUpperCase();
  const imgUrl = n.imagen || FALLBACK_IMAGE;
  const related = await getRelated(n.categoria || 'General', slug);
  const mostRead = await getMostRead(slug);

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'NewsArticle',
    headline: n.titulo, description: n.resumen || n.titulo,
    image: n.imagen || 'https://nicaraguainformate.com/logo.png',
    datePublished: n.fecha?.toDate ? n.fecha.toDate().toISOString() : new Date(n.fecha).toISOString(),
    author: { '@type': 'Person', name: autor },
    publisher: { '@type': 'Organization', name: 'Nicaragua Informate', logo: { '@type': 'ImageObject', url: 'https://nicaraguainformate.com/logo.png' } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div id="readProgress" style={{ position: 'fixed', top: 0, left: 0, height: 3, background: '#8c1d18', zIndex: 1001, width: '0%', transition: 'width 0.1s linear' }} />

      <header style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#0a0a0a', borderBottom: '1px solid #262626', padding: '12px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Image src="/logo.png" alt="" width={34} height={34} style={{ borderRadius: 8 }} />
            <span style={{ color: '#dc2626', fontWeight: 900, fontSize: 18 }}>Nicaragua <span style={{ color: '#fff' }}>Informate</span></span>
          </Link>
          <nav style={{ display: 'flex', gap: 10 }}>
            <Link href="/noticias" style={{ padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#fff', background: '#1a1a1a', textDecoration: 'none' }}>Noticias</Link>
            <Link href="/" style={{ padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#a3a3a3', textDecoration: 'none' }}>Inicio</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48 }}>
        <article>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#dc2626', padding: '5px 12px', background: 'rgba(220,38,38,0.1)', borderRadius: 4 }}>{n.categoria || 'General'}</span>
            <span style={{ flex: 1, height: 1, background: '#262626' }} />
            <span style={{ fontSize: 12, color: '#737373' }}>{fechaStr}</span>
          </div>

          <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, color: '#f5f5f5', lineHeight: 1.1, marginBottom: 16 }}>{n.titulo}</h1>
          {n.resumen && <p style={{ fontSize: 18, color: '#a3a3a3', lineHeight: 1.6, marginBottom: 20 }}>{n.resumen}</p>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, padding: '14px 0', borderTop: '1px solid #262626', borderBottom: '1px solid #262626' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{autorInitial}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f5f5f5' }}>{autor}</div>
              <div style={{ fontSize: 12, color: '#737373' }}>{readTime} min de lectura</div>
            </div>
          </div>

          <Image src={imgUrl} alt={n.titulo} width={800} height={450} priority quality={85} style={{ width: '100%', borderRadius: 8, marginBottom: 24 }} />

          <AudioButton titulo={n.titulo} resumen={n.resumen || ''} contenido={n.contenido || ''} />

          <div style={{ fontSize: 17, lineHeight: 1.7, color: '#d4d4d4' }} dangerouslySetInnerHTML={{ __html: cleanNestedTags(n.contenido || '') }} />

          <div style={{ margin: '40px 0', padding: '24px 0', borderTop: '1px solid #262626', borderBottom: '1px solid #262626' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#737373', marginBottom: 14 }}>Compartir</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <ShareChip href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} label="Facebook" bg="#1877f2" />
              <ShareChip href={`https://wa.me/?text=${encodeURIComponent(n.titulo + ' — ' + url)}`} label="WhatsApp" bg="#25d366" />
              <ShareChip href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(n.titulo)}`} label="Telegram" bg="#0088cc" />
            </div>
          </div>
        </article>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {related.length > 0 && (
            <div style={{ background: '#141414', border: '1px solid #262626', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f5f5f5', marginBottom: 12, textTransform: 'uppercase' }}>Relacionadas</div>
              {related.map(r => (
                <Link key={r.id} href={`/noticias/${r.slug}`} style={{ display: 'flex', gap: 10, marginBottom: 10, textDecoration: 'none' }}>
                  <div style={{ width: 80, height: 54, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                    <Image src={r.imagen || FALLBACK_IMAGE} alt="" width={80} height={54} style={{ objectFit: 'cover' }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5', lineHeight: 1.35 }}>{r.titulo}</div>
                </Link>
              ))}
            </div>
          )}
          {mostRead.length > 0 && (
            <div style={{ background: '#141414', border: '1px solid #262626', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f5f5f5', marginBottom: 12, textTransform: 'uppercase' }}>Más leídas</div>
              {mostRead.map((m, i) => (
                <Link key={m.id} href={`/noticias/${m.slug}`} style={{ display: 'flex', gap: 10, marginBottom: 10, textDecoration: 'none', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#dc2626' }}>{i + 1}</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5', lineHeight: 1.35 }}>{m.titulo}</div>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </main>

      <footer style={{ background: '#0a0a0a', borderTop: '1px solid #262626', padding: '40px 24px', color: '#737373', fontSize: 13 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          © {new Date().getFullYear()} Nicaragua Informate. Todos los derechos reservados.
        </div>
      </footer>

      <script dangerouslySetInnerHTML={{ __html: `(function(){var b=document.getElementById('readProgress');if(!b)return;window.addEventListener('scroll',function(){var d=document.documentElement;var h=d.scrollHeight-d.clientHeight;if(h>0)b.style.width=Math.round(((window.scrollY||d.scrollTop)/h)*100)+'%';},{passive:true});})();` }} />
    </>
  );
}
