import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEvergreenBySlug, getAllEvergreen, evergreenSeoTitle } from '@/lib/evergreen';
import AuthorCard from '@/components/AuthorCard';
import AdsenseUnit from '@/components/AdsenseUnit';
import { getCspNonce } from '@/lib/nonce';
import { escapeJsonLd } from '@/lib/jsonld';
import { sanitizeArticleHtml } from '@/lib/sanitize';

const SITE_URL = 'https://nicaraguainformate.com';
const OG_IMAGE = `${SITE_URL}/logo.webp`;

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

  const canonical = `${SITE_URL}/guia/${slug}`;
  const seoTitle = evergreenSeoTitle(article);

  return {
    title: { absolute: seoTitle },
    description: article.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      url: canonical,
      siteName: 'Nicaragua Informate',
      locale: 'es_NI',
      type: 'article',
      publishedTime: article.publishedDate,
      modifiedTime: article.updatedDate,
      section: article.category,
      images: [{ url: OG_IMAGE, width: 512, height: 512, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: [OG_IMAGE],
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
        url: 'https://nicaraguainformate.com/logo.webp',
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

function buildBreadcrumbJsonLd(article: { title: string; slug: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Guías', item: `${SITE_URL}/guia` },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${SITE_URL}/guia/${article.slug}` },
    ],
  };
}

export default async function EvergreenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getEvergreenBySlug(slug);

  if (!article) {
    return notFound();
  }

  const nonce = await getCspNonce();

  // Guías relacionadas: misma categoría primero, luego el resto — enlazado
  // interno real donde el lector ya está en modo "trámite/utilidad".
  const related = getAllEvergreen()
    .filter((g) => g.slug !== article.slug)
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category))
    .slice(0, 4);

  return (
    <main className="article-page" style={{ paddingTop: 40 }}>
      {/* Schema.org Article */}
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: escapeJsonLd(buildArticleJsonLd(article) as Record<string, unknown>) }} />
      
      {/* Schema.org FAQPage */}
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: escapeJsonLd(buildFAQJsonLd(article.faqs) as Record<string, unknown>) }} />

      {/* Schema.org BreadcrumbList — refleja el breadcrumb visual */}
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: escapeJsonLd(buildBreadcrumbJsonLd(article)) }} />

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
        <div className="ni-article__body" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.content) }} />

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
          name={article.author}
          photo={article.authorSlug === 'keyling-rivera' ? '/keyling-rivera.jpg' : undefined}
          bio={article.authorSlug === 'keyling-rivera' ? 'Directora Editorial — Nicaragua Informate. Licenciada en Periodismo. Comprometida con la verdad y la verificación de la información.' : undefined}
          slug={article.authorSlug}
          publishedDate={article.publishedDate}
          updatedDate={article.updatedDate}
        />

        {/* Publicidad — una sola unidad discreta al final del contenido;
            las guías son la superficie de mayor tráfico orgánico del sitio */}
        <div style={{ marginTop: 40 }}>
          <AdsenseUnit
            slot="4492386174"
            format="auto"
            responsive={true}
            minHeight={100}
          />
        </div>
      </div>

      {/* Guías relacionadas — enlazado interno entre recursos de utilidad */}
      {related.length > 0 && (
        <section aria-label="Guías relacionadas" style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 48px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ni-navy, #0f172a)', marginBottom: 16 }}>
            Guías relacionadas
          </h2>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {related.map((g) => (
              <Link
                key={g.slug}
                href={`/guia/${g.slug}`}
                style={{
                  display: 'block',
                  padding: '16px 18px',
                  background: 'var(--card-bg, #fff)',
                  borderRadius: 10,
                  border: '1px solid var(--border, #e5e7eb)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {g.category}
                </span>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: '6px 0 0', lineHeight: 1.4, color: 'var(--text, #0f172a)' }}>
                  {g.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <Link href="/guia" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
          ← Ver todas las guías
        </Link>
      </div>
    </main>
  );
}
