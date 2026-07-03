import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Keyling Elieth Rivera Muñoz — Directora Editorial | Nicaragua Informate',
  description:
    'Directora Editorial de Nicaragua Informate. Licenciada en Periodismo, especializada en cobertura de sucesos, noticias nacionales, deportes e internacionales.',
  alternates: {
    canonical: 'https://nicaraguainformate.com/autor/keyling-eliet-rivera-munoz',
  },
};

const AUTHOR_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  mainEntity: {
    '@type': 'Person',
    name: 'Keyling Elieth Rivera Muñoz',
    url: 'https://nicaraguainformate.com/autor/keyling-eliet-rivera-munoz',
    image: 'https://nicaraguainformate.com/autores/keyling-rivera.jpg',
    jobTitle: 'Directora Editorial',
    worksFor: {
      '@type': 'Organization',
      name: 'Nicaragua Informate',
      url: 'https://nicaraguainformate.com',
    },
    sameAs: ['https://www.facebook.com/keyling.elieth.rivera.munoz'],
    description:
      'Directora Editorial de Nicaragua Informate. Licenciada en Periodismo, especializada en cobertura de sucesos, noticias nacionales, deportes e internacionales.',
  },
};

export default function AutorKeylingPage() {
  return (
    <main className="article-page" style={{ paddingTop: 40 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(AUTHOR_SCHEMA) }}
      />

      <section className="article-hero" style={{ height: 'auto', minHeight: 180 }}>
        <div style={{ background: 'var(--primary)', position: 'absolute', inset: 0 }} />
        <div className="article-hero-content" style={{ position: 'relative' }}>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, marginBottom: 8, color: 'white' }}>
            Keyling Elieth Rivera Muñoz
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, maxWidth: 640 }}>
            Directora Editorial de Nicaragua Informate
          </p>
        </div>
      </section>

      <div className="article-content-wrapper">
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/autores/keyling-rivera.jpg"
            alt="Keyling Elieth Rivera Muñoz, Directora Editorial de Nicaragua Informate"
            style={{ width: 160, height: 160, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '3px solid var(--accent)' }}
          />
          <div style={{ flex: 1, minWidth: 220 }}>
            <p className="article-body" style={{ marginBottom: 16 }}>
              <strong>Keyling Elieth Rivera Muñoz</strong> es Directora Editorial de Nicaragua Informate. Licenciada en Periodismo, especializada en cobertura de sucesos, noticias nacionales, deportes e internacionales.
            </p>
            <p className="article-body" style={{ marginBottom: 20 }}>
              Revisa y contrasta la información antes de publicarla para garantizar que sea precisa y confiable. Su trabajo se centra en mantener altos estándares de veracidad y ética periodística en cada artículo que sale al aire.
            </p>
            <a
              href="https://www.facebook.com/keyling.elieth.rivera.munoz"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#1877F2',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
            >
              Facebook
            </a>
          </div>
        </div>

        <h2 className="article-summary-title" style={{ marginBottom: 16 }}>Artículos recientes</h2>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', marginBottom: 32 }}>
          <li style={{ marginBottom: 12 }}>
            <Link
              href="/noticias/accidente-transito-carretera-norte-managua-heridos"
              style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
            >
              Accidente en carretera norte de Managua deja tres heridos
            </Link>
          </li>
        </ul>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Para contacto editorial: <a href="mailto:contacto@nicaraguainformate.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>contacto@nicaraguainformate.com</a>
          </p>
        </div>
      </div>
    </main>
  );
}
