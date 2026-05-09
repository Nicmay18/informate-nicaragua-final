import { getNewsBySlug } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AudioButton, ShareChip } from '@/components/ArticleClient';

// ESTO ELIMINA EL ERROR DE PRERENDER
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

const CAT_COLORS: Record<string, string> = { 
  Sucesos: '#dc2626', 
  Nacionales: '#1d4ed8', 
  Deportes: '#16a34a', 
  Internacionales: '#7c3aed', 
  Espectáculos: '#db2777' 
};

function fmtDate(ts: unknown): string {
  if (!ts) return 'Hace un momento';
  try {
    const d = (ts as { toDate?: () => Date }).toDate 
      ? (ts as { toDate: () => Date }).toDate() 
      : new Date(ts as string);
    return d.toLocaleDateString('es-NI', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { 
    return 'Hace un momento'; 
  }
}

function countWords(text: string): number { 
  return text.trim().split(/\s+/).filter(w => w.length > 0).length; 
}

function cleanNestedTags(html: string): string {
  if (!html) return '';
  let c = html.replace(/<p>\s*<p>/gi, '<p>').replace(/<\/p>\s*<\/p>/gi, '</p>');
  c = c.replace(/<b>\s*<b>/gi, '<b>').replace(/<\/b>\s*<\/b>/gi, '</b>');
  c = c.replace(/<strong>\s*<strong>/gi, '<strong>').replace(/<\/strong>\s*<\/strong>/gi, '</strong>');
  c = c.replace(/<i>\s*<i>/gi, '<i>').replace(/<\/i>\s*<\/i>/gi, '</i>');
  c = c.replace(/<em>\s*<em>/gi, '<em>').replace(/<\/em>\s*<\/em>/gi, '</em>');
  return c;
}

export default async function NewsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const n = await getNewsBySlug(slug);

  if (!n) {
    notFound();
  }

  const url = `https://nicaraguainformate.com/noticias/${slug}`;
  const wordCount = countWords(n.contenido || '');
  const readTime = Math.ceil(wordCount / 200);
  const fechaStr = fmtDate(n.fecha);
  const autor = n.autor || 'Keyling Rivera M.';
  const autorInitial = autor.charAt(0).toUpperCase();
  const imgUrl = n.imagen || '/logo.png';

  const jsonLd = {
    '@context': 'https://schema.org', 
    '@type': 'NewsArticle',
    headline: n.titulo, 
    description: n.resumen || n.titulo,
    image: n.imagen || 'https://nicaraguainformate.com/logo.png',
    datePublished: n.fecha?.toDate ? n.fecha.toDate().toISOString() : new Date().toISOString(),
    author: { '@type': 'Person', name: autor },
    publisher: { 
      '@type': 'Organization', 
      name: 'Nicaragua Informate', 
      logo: { '@type': 'ImageObject', url: 'https://nicaraguainformate.com/logo.png' } 
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <header style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#8c1d18', padding: '12px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Image src="/logo.png" alt="" width={34} height={34} style={{ borderRadius: 8 }} />
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>
              Nicaragua <span style={{ fontWeight: 400 }}>Informate</span>
            </span>
          </Link>
          <nav style={{ display: 'flex', gap: 10 }}>
            <Link href="/noticias" style={{ padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#fff', background: 'rgba(0,0,0,0.2)', textDecoration: 'none' }}>
              Noticias
            </Link>
            <Link href="/" style={{ padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
              Inicio
            </Link>
          </nav>
        </div>
      </header>

      <main className="w-full max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        <article style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ marginBottom: 20 }}>
            <span style={{ 
              fontSize: 11, 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em', 
              color: '#fff', 
              padding: '4px 10px', 
              background: CAT_COLORS[n.categoria] || '#8c1d18', 
              borderRadius: 3,
              display: 'inline-block',
              marginBottom: 12
            }}>
              {n.categoria || 'General'}
            </span>
            <span style={{ fontSize: 12, color: '#8c8c8c', display: 'block' }}>{fechaStr}</span>
          </div>

          <h1 style={{ 
            fontFamily: "Georgia, serif", 
            fontSize: 'clamp(24px, 5vw, 38px)', 
            fontWeight: 700, 
            color: '#121212', 
            lineHeight: 1.15, 
            marginBottom: 16 
          }}>
            {n.titulo}
          </h1>
          
          {n.resumen && (
            <p style={{ fontSize: 17, color: '#595959', lineHeight: 1.5, marginBottom: 20 }}>
              {n.resumen}
            </p>
          )}

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            marginBottom: 24, 
            padding: '12px 0', 
            borderTop: '1px solid #e2e2e2', 
            borderBottom: '1px solid #e2e2e2' 
          }}>
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '50%', 
              background: '#8c1d18', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#fff', 
              fontWeight: 700, 
              fontSize: 14 
            }}>
              {autorInitial}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#121212' }}>{autor}</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{readTime} min de lectura</div>
            </div>
          </div>

          {n.imagen && (
            <Image 
              src={imgUrl} 
              alt={n.titulo} 
              width={800} 
              height={450} 
              priority 
              quality={85} 
              style={{ width: '100%', borderRadius: 8, marginBottom: 24, display: 'block' }} 
            />
          )}

          <AudioButton titulo={n.titulo} resumen={n.resumen || ''} contenido={n.contenido || ''} />

          <div 
            className="article-body" 
            style={{ fontFamily: "Georgia, serif", fontSize: 17, lineHeight: 1.7, color: '#1a1a1a' }}
            dangerouslySetInnerHTML={{ __html: cleanNestedTags(n.contenido || '') }} 
          />

          <div style={{ 
            margin: '40px 0', 
            padding: '24px 0', 
            borderTop: '1px solid #e2e2e2', 
            borderBottom: '1px solid #e2e2e2' 
          }}>
            <div style={{ 
              fontSize: 11, 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              color: '#8c8c8c', 
              marginBottom: 12, 
              letterSpacing: '0.05em' 
            }}>
              Compartir
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <ShareChip href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} label="Facebook" bg="#1877f2" />
              <ShareChip href={`https://wa.me/?text=${encodeURIComponent(n.titulo + ' — ' + url)}`} label="WhatsApp" bg="#25d366" />
              <ShareChip href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(n.titulo)}`} label="Telegram" bg="#0088cc" />
            </div>
          </div>
        </article>
      </main>

      <footer style={{ background: '#121212', padding: '40px 24px', color: '#a0a0a0', fontSize: 13, textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          © {new Date().getFullYear()} Nicaragua Informate. Todos los derechos reservados.
        </div>
      </footer>
    </>
  );
}
