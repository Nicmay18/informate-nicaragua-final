import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEvergreenBySlug, getAllEvergreen } from '@/lib/evergreen';
import AuthorCard from '@/components/AuthorCard';

export async function generateStaticParams() {
  const articles = getAllEvergreen();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getEvergreenBySlug(slug);

  if (!article) {
    return {
      title: 'Guía no encontrada',
    };
  }

  return {
    title: article.title,
    description: article.description,
    alternates: {
      canonical: `https://nicaraguainformate.com/guia/${slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `https://nicaraguainformate.com/guia/${slug}`,
      siteName: 'Nicaragua Informate',
      locale: 'es_NI',
      type: 'article',
      publishedTime: article.publishedDate,
      modifiedTime: article.updatedDate,
      section: article.category,
      images: [{ url: 'https://nicaraguainformate.com/logo.png', width: 1200, height: 630, alt: article.title }],
    },
  };
}

function buildArticleJsonLd(article: ReturnType<typeof getEvergreenBySlug>) {
  if (!article) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author,
      url: `https://nicaraguainformate.com/autor/${article.authorSlug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Nicaragua Informate',
      url: 'https://nicaraguainformate.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://nicaraguainformate.com/logo.png',
      },
    },
    datePublished: article.publishedDate,
    dateModified: article.updatedDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://nicaraguainformate.com/guia/${article.slug}`,
    },
  };
}

function buildFAQJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export default async function EvergreenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getEvergreenBySlug(slug);

  if (!article) {
    return notFound();
  }

  return (
    <main className="article-page" style={{ paddingTop: 40 }}>
      {/* Schema.org Article */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildArticleJsonLd(article)) }} />
      
      {/* Schema.org FAQPage */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFAQJsonLd(article.faqs)) }} />

      {/* Breadcrumbs */}
      <nav className="ni-breadcrumbs" aria-label="Miga de pan">
        <Link href="/">Inicio</Link>
        <span className="ni-breadcrumbs__sep">/</span>
        <Link href="/guia">Guías</Link>
        <span className="ni-breadcrumbs__sep">/</span>
        <span>{article.title}</span>
      </nav>

      <div className="ni-article">
        {/* Header */}
        <header className="ni-article__header">
          <span className="ni-article__badge ni-article__badge--nacionales">{article.category}</span>
          <h1 className="ni-article__title">{article.title}</h1>
          <div className="ni-article__meta">
            <time className="ni-article__time" dateTime={article.updatedDate}>
              Actualizado: {new Date(article.updatedDate).toLocaleDateString('es-NI', { day: 'numeric', month: 'long', year: 'numeric' })}
            </time>
          </div>
        </header>

        {/* Content */}
        <div className="ni-article__body" dangerouslySetInnerHTML={{ __html: article.content }} />

        {/* FAQ Section */}
        <section style={{ marginTop: 48, paddingTop: 32, borderTop: '2px solid var(--border)' }}>
          <h2 className="article-summary-title" style={{ marginBottom: 24 }}>Preguntas Frecuentes</h2>
          <div style={{ display: 'grid', gap: 20 }}>
            {article.faqs.map((faq, index) => (
              <div key={index} style={{ background: 'var(--ni-bg)', padding: 20, borderRadius: 12, border: '1px solid var(--ni-border)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ni-navy)', marginBottom: 8 }}>
                  {faq.question}
                </h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--ni-text)', lineHeight: 1.6, margin: 0 }}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Author Card */}
        <AuthorCard
          authorName={article.author}
          authorPhoto={article.authorSlug === 'keyling-rivera' ? '/keyling-rivera.jpg' : undefined}
          authorBio={article.authorSlug === 'keyling-rivera' ? 'Directora Editorial — Nicaragua Informate. Periodista profesional con más de 10 años de experiencia en periodismo verificado.' : undefined}
          authorSlug={article.authorSlug}
          publishedDate={article.publishedDate}
          updatedDate={article.updatedDate}
        />
      </div>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <Link href="/guia" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
          ← Ver todas las guías
        </Link>
      </div>
    </main>
  );
}
