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
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #262626' }}>
        <div className="w-full max-w-[1440px] mx-auto p-6 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div style={{ width: 40, height: 40, background: '#dc2626', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 12 }}>NI</div>
            <div>
              <div style={{ color: '#dc2626', fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Nicaragua Informate</div>
              <div style={{ color: '#525252', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Noticias de Nicaragua</div>
            </div>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/noticias" style={{ color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Todas las noticias</Link>
            <Link href="/" style={{ color: '#a3a3a3', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Inicio</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[1440px] mx-auto p-6">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, color: '#f5f5f5', lineHeight: 1.1, marginBottom: 16 }}>Todas las Noticias</h1>
          <p style={{ fontSize: 18, color: '#a3a3a3', lineHeight: 1.6 }}>
            Mantente informado con las últimas noticias de Nicaragua y el mundo.
          </p>
        </div>

        {noticias.length > 0 ? (
          <NewsGrid noticias={noticias} />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#a3a3a3' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📰</div>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: '#f5f5f5' }}>No hay noticias disponibles</h2>
            <p>Estamos trabajando para traerte las últimas noticias. Por favor, intenta más tarde.</p>
          </div>
        )}
      </main>
    </div>
  );
}
