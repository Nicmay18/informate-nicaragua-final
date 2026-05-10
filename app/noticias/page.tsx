import { Metadata } from 'next';
import Link from 'next/link';
import NewsGrid from '@/components/NewsGrid';
import { getNews } from '@/lib/data';
import { CATEGORIES } from '@/lib/types';
import type { Noticia } from '@/lib/types';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = 'https://nicaraguainformate.com';
  const url = `${baseUrl}/noticias`;

  return {
    title: 'Todas las Noticias | Nicaragua Informate',
    description: 'Portal de noticias de Nicaragua. Cobertura completa de sucesos, nacionales, deportes e internacionales.',
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'es_NI',
      url,
      siteName: 'Nicaragua Informate',
      title: 'Todas las Noticias | Nicaragua Informate',
      description: 'Portal de noticias de Nicaragua. Cobertura completa de sucesos, nacionales, deportes e internacionales.',
      images: [{ url: `${baseUrl}/logo.png`, width: 512, height: 512, alt: 'Nicaragua Informate' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Todas las Noticias | Nicaragua Informate',
      description: 'Portal de noticias de Nicaragua. Cobertura completa de sucesos, nacionales, deportes e internacionales.',
      images: [`${baseUrl}/logo.png`],
    },
  };
}

export default async function NoticiasPage() {
  let noticias: Noticia[] = [];

  try {
    noticias = await getNews(50);
  } catch (error) {
    console.error('[NoticiasPage] Error:', error);
  }

  const today = new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Fecha */}
      <div style={{ borderBottom: '1px solid #e5e5e5', padding: '10px 0', textAlign: 'center' }}>
        <span suppressHydrationWarning style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{today}</span>
      </div>

      {/* Header */}
      <header style={{ borderBottom: '3px solid #000', padding: '20px 0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: '#333' }}>Estelí, Nicaragua</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <Link href="/noticias" style={{ color: '#333', fontSize: 11, fontWeight: 600, textDecoration: 'none', textTransform: 'uppercase' }}>Noticias</Link>
              <Link href="/" style={{ color: '#333', fontSize: 11, fontWeight: 600, textDecoration: 'none', textTransform: 'uppercase' }}>Inicio</Link>
            </div>
          </nav>
          
          <div style={{ textAlign: 'center' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div style={{ color: '#b91c1c', fontWeight: 900, fontSize: 'clamp(32px, 6vw, 56px)', letterSpacing: '-0.02em', fontFamily: 'Georgia, Times New Roman, serif', lineHeight: 1 }}>
                Nicaragua Informate
              </div>
              <div style={{ color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 6, fontWeight: 500 }}>
                Noticias de Nicaragua en Tiempo Real
              </div>
            </Link>
          </div>

          <nav style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20, paddingTop: 16, borderTop: '1px solid #e5e5e5' }}>
            {CATEGORIES.slice(0, 5).map((cat) => (
              <Link key={cat.name} href={`/?cat=${encodeURIComponent(cat.name)}`}
                style={{ color: '#333', fontSize: 12, fontWeight: 600, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 40px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 'clamp(28px,4vw,46px)', fontWeight: 700, color: '#111', lineHeight: 1.08, marginBottom: 10, fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}>Todas las Noticias</h1>
          <p style={{ fontSize: 18, color: '#666', lineHeight: 1.6 }}>
            Mantente informado con las últimas noticias de Nicaragua y el mundo.
          </p>
        </div>

        {noticias.length > 0 ? (
          <NewsGrid noticias={noticias} />
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: '#666', border: '1px solid #e5e7eb', borderRadius: 12, background: '#fafafa' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>📰</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#111', fontFamily: 'Georgia, serif' }}>Sin publicaciones por el momento</h2>
            <p style={{ margin: 0, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
              Estamos actualizando esta sección. Vuelve en unos minutos para ver nuevas publicaciones.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
