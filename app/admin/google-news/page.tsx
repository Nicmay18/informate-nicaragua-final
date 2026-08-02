import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Circle, Newspaper, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: 'Google News / Discover Checklist | Admin' },
};

const CHECKLIST = [
  { id: 'publisher-center', label: 'Cuenta en Google Publisher Center', done: false, href: 'https://publishercenter.google.com/' },
  { id: 'news-sitemap', label: 'News Sitemap activo (/news-sitemap.xml)', done: true, href: '/news-sitemap.xml' },
  { id: 'robots', label: 'robots.txt con sitemap y news-sitemap', done: true, href: '/robots.txt' },
  { id: 'transparency', label: 'Centro de confianza y páginas de transparencia', done: true, href: '/centro-confianza' },
  { id: 'authors', label: 'Autores identificados en cada noticia', done: true, href: '/autores' },
  { id: 'images-large', label: 'Imágenes principales >= 1200px', done: false, notes: 'Revisar metadatos OpenGraph' },
  { id: 'headlines', label: 'Titulares claros sin clickbait', done: true },
  { id: 'policies', label: 'Cumplimiento de políticas de Google News', done: false, href: 'https://support.google.com/news/publisher-center/answer/9606710' },
  { id: 'json-ld', label: 'Schema.org NewsArticle válido', done: true },
  { id: 'canonical', label: 'URLs canónicas limpias', done: true },
];

export default function GoogleNewsChecklistPage() {
  const total = CHECKLIST.length;
  const done = CHECKLIST.filter((c) => c.done).length;

  return (
    <main style={{ padding: '32px 20px', maxWidth: 980, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
        <Newspaper size={26} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 10 }} />
        Google News / Discover Checklist
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
        Estado de preparación para Google News, Discover y indexación. {done}/{total} completados.
      </p>

      <div style={{ marginBottom: 24 }}>
        <div style={{ background: 'var(--ni-bg)', borderRadius: 12, height: 12, overflow: 'hidden' }}>
          <div
            style={{
              width: `${(done / total) * 100}%`,
              background: 'var(--success)',
              height: '100%',
              transition: 'width 0.3s',
            }}
          />
        </div>
        <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 6 }}>
          {Math.round((done / total) * 100)}% completado
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {CHECKLIST.map((item) => (
          <div
            key={item.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              background: item.done ? 'rgba(22,163,74,0.04)' : 'var(--ni-bg)',
            }}
          >
            <div style={{ color: item.done ? 'var(--success)' : 'var(--text-light)', marginTop: 2 }}>
              {item.done ? <CheckCircle size={20} /> : <Circle size={20} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
              {item.notes && <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.notes}</div>}
              {item.href && (
                <Link
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6 }}
                >
                  {item.href.startsWith('http') ? 'Abrir' : 'Ver'} <ExternalLink size={12} />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
