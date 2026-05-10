import { Metadata } from 'next';
import Link from 'next/link';
import NewsGrid from '@/components/NewsGrid';
import { getNews } from '@/lib/data';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Todas las Noticias | Nicaragua Informate',
    description: 'Portal de noticias de Nicaragua. Cobertura completa de sucesos, nacionales, deportes e internacionales.',
  };
}

export default async function NoticiasPage() {
  let noticias = [];

  try {
    noticias = await getNews(50);
  } catch (error) {
    console.error('[NoticiasPage] Error:', error);
  }

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
      {/* Top Bar */}
      <div style={{ background: '#f8f8f8', color: '#666', fontSize: 11, borderBottom: '1px solid #e0e0e0', padding: '8px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-map-marker-alt" style={{ color: '#b91c1c', fontSize: 10 }} />
            Estelí, Nicaragua
          </span>
        </div>
      </div>

      {/* Header */}
      <header style={{ borderBottom: '2px solid #b91c1c', padding: '16px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{ width: 40, height: 40, background: '#b91c1c', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>NI</div>
            <div>
              <div style={{ color: '#b91c1c', fontWeight: 700, fontSize: 28, letterSpacing: '-0.03em', fontFamily: 'Georgia, serif' }}>Nicaragua Informate</div>
              <div style={{ color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 2 }}>Noticias de Nicaragua</div>
            </div>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/noticias" style={{ color: '#333', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Todas las noticias</Link>
            <Link href="/" style={{ color: '#333', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Inicio</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[1440px] mx-auto p-6">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, color: '#111', lineHeight: 1.1, marginBottom: 16, fontFamily: 'Georgia, serif' }}>Todas las Noticias</h1>
          <p style={{ fontSize: 18, color: '#666', lineHeight: 1.6 }}>
            Mantente informado con las últimas noticias de Nicaragua y el mundo.
          </p>
        </div>

        {noticias.length > 0 ? (
          <NewsGrid noticias={noticias} />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📰</div>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: '#333' }}>No hay noticias disponibles</h2>
            <p>Estamos trabajando para traerte las últimas noticias. Por favor, intenta más tarde.</p>
          </div>
        )}
      </main>
    </div>
  );
}
