import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getAllAuthors } from '@/lib/authors';

export const metadata: Metadata = {
  title: { absolute: 'Equipo editorial | Nicaragua Informate' },
  description: 'Conoce a los periodistas, editores y colaboradores de Nicaragua Informate. Perfiles, especialidades y artículos publicados.',
  alternates: { canonical: 'https://nicaraguainformate.com/autores' },
};

export default async function AutoresPage() {
  const authors = getAllAuthors();

  return (
    <main className="article-page" style={{ paddingTop: 40 }}>
      <nav className="ni-breadcrumbs" aria-label="Miga de pan" style={{ maxWidth: 900, margin: '0 auto', padding: '16px 20px 0' }}>
        <Link href="/">Inicio</Link>
        <span className="ni-breadcrumbs__sep">/</span>
        <span>Equipo editorial</span>
      </nav>

      <section className="article-hero" style={{ height: 'auto', minHeight: 220 }}>
        <div style={{ background: 'var(--primary)', position: 'absolute', inset: 0 }} />
        <div className="article-hero-content" style={{ position: 'relative' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: 12, color: 'white' }}>
            Equipo editorial
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, maxWidth: 640 }}>
            Periodistas, técnicos y editores que hacen posible Nicaragua Informate.
          </p>
        </div>
      </section>

      <div className="article-content-wrapper">
        <p className="article-body" style={{ marginBottom: 32 }}>
          Cada noticia tiene un autor identificable. Estos son los perfiles del equipo, con biografía, especialidad y enlace a sus artículos publicados.
        </p>

        <div className="article-related-grid" style={{ marginBottom: 48 }}>
          {authors.map((author) => (
            <Link key={author.slug} href={`/autor/${author.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="sidebar-widget" style={{ display: 'flex', gap: 16, alignItems: 'center', height: '100%' }}>
                {author.photo ? (
                  <Image src={author.photo} alt={author.name} width={72} height={72} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
                    {author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                )}
                <div>
                  <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{author.name}</div>
                  <div style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{author.role}</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.55 }}>{author.bio.slice(0, 120)}…</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
