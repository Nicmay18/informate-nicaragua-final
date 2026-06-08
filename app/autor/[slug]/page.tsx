import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getAuthorBySlug, getAllAuthors } from '@/lib/authors';
import { getNews } from '@/lib/data';
import type { Author } from '@/lib/authors';

export async function generateStaticParams() {
  const authors = getAllAuthors();
  return authors.map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);

  if (!author) {
    return {
      title: 'Autor no encontrado',
    };
  }

  return {
    title: `Artículos de ${author.name} | Nicaragua Informate`,
    description: author.bio,
    alternates: {
      canonical: `https://nicaraguainformate.com/autor/${slug}`,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${author.name} — Nicaragua Informate`,
      description: author.bio,
      url: `https://nicaraguainformate.com/autor/${slug}`,
      siteName: 'Nicaragua Informate',
      locale: 'es_NI',
      type: 'profile',
      images: author.photo
        ? [{ url: `https://nicaraguainformate.com${author.photo}`, width: 400, height: 400, alt: author.name }]
        : [{ url: 'https://nicaraguainformate.com/logo.webp', width: 512, height: 512, alt: 'Nicaragua Informate' }],
    },
  };
}

function buildPersonJsonLd(author: Author) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    jobTitle: author.role,
    worksFor: {
      '@type': 'Organization',
      name: 'Nicaragua Informate',
      url: 'https://nicaraguainformate.com',
    },
    url: `https://nicaraguainformate.com/autor/${author.slug}`,
    image: author.photo ? `https://nicaraguainformate.com${author.photo}` : undefined,
    description: author.bio,
    sameAs: author.social ? Object.values(author.social).filter(Boolean) : undefined,
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);

  if (!author) {
    return notFound();
  }

  // Obtener artículos de este autor
  const allNews = await getNews(100);
  const authorArticles = allNews.filter((n) => n.autor === author.name);

  return (
    <main className="article-page" style={{ paddingTop: 40 }}>
      {/* Schema.org Person */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildPersonJsonLd(author)) }} />

      {/* Header */}
      <section className="article-hero" style={{ height: 'auto', minHeight: 280 }}>
        <div style={{ background: 'var(--primary)', position: 'absolute', inset: 0 }} />
        <div className="article-hero-content" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 20px' }}>
          {author.photo ? (
            <Image
              src={author.photo}
              alt={author.name}
              width={120}
              height={120}
              style={{ borderRadius: '50%', border: '4px solid var(--accent)', marginBottom: 20 }}
            />
          ) : (
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 36, marginBottom: 20 }}>
              {author.name.split(' ').map(n => n[0]).join('')}
            </div>
          )}
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: 12, color: 'white' }}>
            {author.name}
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--accent)', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {author.role}
          </p>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, maxWidth: 700, marginBottom: 24 }}>
            {author.bio}
          </p>
          {author.social && (
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              {author.social.twitter && (
                <a href={author.social.twitter} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem' }}>Twitter</a>
              )}
              {author.social.facebook && (
                <a href={author.social.facebook} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem' }}>Facebook</a>
              )}
              {author.social.instagram && (
                <a href={author.social.instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem' }}>Instagram</a>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="article-content-wrapper" style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        <h2 className="article-summary-title" style={{ marginBottom: 20 }}>
          Artículos publicados ({authorArticles.length})
        </h2>

        {authorArticles.length > 0 ? (
          <div style={{ display: 'grid', gap: 20 }}>
            {authorArticles.map((article) => (
              <article key={article.id} style={{ padding: '20px 0', borderBottom: '1px solid var(--border)' }}>
                <Link href={`/noticias/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: 8, lineHeight: 1.3 }}>
                    {article.titulo}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
                    {article.resumen || article.titulo}
                  </p>
                  <time style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                    {new Date(article.fecha).toLocaleDateString('es-NI', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Este autor aún no tiene artículos publicados.
          </p>
        )}

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <Link href="/nosotros" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            ← Volver a Quiénes somos
          </Link>
        </div>
      </div>
    </main>
  );
}
