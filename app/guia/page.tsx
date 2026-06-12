import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllEvergreen } from '@/lib/evergreen';

export const metadata: Metadata = {
  title: 'Guías y recursos útiles | Nicaragua Informate',
  description: 'Guías prácticas sobre trámites, turismo, deportes y más en Nicaragua. Información actualizada y verificada.',
  alternates: { canonical: 'https://nicaraguainformate.com/guia' },
  openGraph: {
    type: 'website',
    locale: 'es_NI',
    url: 'https://nicaraguainformate.com/guia',
    siteName: 'Nicaragua Informate',
    title: 'Guías y recursos útiles | Nicaragua Informate',
    description: 'Guías prácticas sobre trámites, turismo, deportes y más en Nicaragua.',
    images: [{ url: 'https://nicaraguainformate.com/logo.webp', width: 512, height: 512, alt: 'Nicaragua Informate' }],
  },
};

export const revalidate = 86400;

export default function GuiasPage() {
  const guias = getAllEvergreen();

  return (
    <main className="article-page" style={{ paddingTop: 40 }}>
      <nav className="ni-breadcrumbs" aria-label="Miga de pan" style={{ maxWidth: 900, margin: '0 auto', padding: '16px 20px 0' }}>
        <Link href="/">Inicio</Link>
        <span className="ni-breadcrumbs__sep">/</span>
        <span>Guías y recursos</span>
      </nav>

      <section className="article-hero" style={{ height: 'auto', minHeight: 220 }}>
        <div style={{ background: 'var(--primary)', position: 'absolute', inset: 0 }} />
        <div className="article-hero-content" style={{ position: 'relative' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: 12, color: 'white' }}>
            Guías y recursos útiles
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, maxWidth: 640 }}>
            Información práctica, paso a paso y verificada sobre trámites, turismo, deportes y más en Nicaragua.
          </p>
        </div>
      </section>

      <div className="article-content-wrapper" style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'grid', gap: 20 }}>
          {guias.map((guia) => (
            <Link
              key={guia.slug}
              href={`/guia/${guia.slug}`}
              style={{
                display: 'block',
                padding: '24px',
                background: 'var(--card-bg, #fff)',
                borderRadius: 12,
                border: '1px solid var(--border, #e5e7eb)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.2s',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#fff',
                  borderRadius: 999,
                  marginBottom: 8,
                  backgroundColor: '#1d4ed8',
                }}
              >
                {guia.category}
              </span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--text)' }}>
                {guia.title}
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {guia.description}
              </p>
              <time style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 12, display: 'block' }}>
                Actualizado: {new Date(guia.updatedDate).toLocaleDateString('es-NI', { day: 'numeric', month: 'long', year: 'numeric' })}
              </time>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
