import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/types';

const SITE_URL = 'https://nicaraguainformate.com';

export const metadata: Metadata = {
  title: 'Categorías | Nicaragua Informate',
  description: 'Explora todas las secciones de Nicaragua Informate: Sucesos, Nacionales, Deportes, Internacionales, Tecnología y Espectáculos.',
  alternates: { canonical: `${SITE_URL}/categoria` },
  openGraph: {
    type: 'website',
    locale: 'es_NI',
    url: `${SITE_URL}/categoria`,
    siteName: 'Nicaragua Informate',
    title: 'Categorías | Nicaragua Informate',
    description: 'Explora todas las secciones de Nicaragua Informate.',
    images: [{ url: `${SITE_URL}/logo.svg`, width: 512, height: 512, alt: 'Nicaragua Informate' }],
  },
};

export const revalidate = 3600;

export default function CategoriasPage() {
  return (
    <main id="main-content" className="ni-body" style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginBottom: 12, fontFamily: 'var(--font-merri)', letterSpacing: '-0.02em' }}>
        Categorías
      </h1>
      <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 40 }}>
        Explora las noticias por tema. Selecciona una categoría para ver el contenido más reciente.
      </p>

      <div style={{ display: 'grid', gap: 16 }}>
        {CATEGORIES.map((cat) => {
          const slug = cat.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
          return (
            <Link
              key={cat.name}
              href={`/categoria/${slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '20px 24px',
                borderRadius: 12,
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: cat.color + '18',
                  color: cat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {cat.name.charAt(0)}
              </span>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{cat.name}</h2>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Ver noticias de {cat.name.toLowerCase()}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
