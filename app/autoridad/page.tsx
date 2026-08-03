import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getAllAuthors } from '@/lib/authors';
import { getCspNonce } from '@/lib/nonce';
import { buildOrganizationJsonLdEnhanced, buildWebSiteJsonLdEnhanced } from '@/lib/seo/schema';
import { escapeJsonLd } from '@/lib/jsonld';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Centro de Autoridad Editorial | Nicaragua Informate',
  description:
    'Metodología, transparencia, autores verificados, política de correcciones y señales EEAT de Nicaragua Informate.',
  alternates: { canonical: 'https://nicaraguainformate.com/autoridad' },
};

const stepStyle: React.CSSProperties = {
  padding: 20,
  background: '#f8fafc',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 800,
  marginBottom: 16,
  color: '#0f172a',
};

function buildAuthorityJsonLd() {
  const authors = getAllAuthors().map((a) => ({
    '@type': 'Person',
    '@id': `https://nicaraguainformate.com/autor/${a.slug}`,
    name: a.name,
    jobTitle: a.role,
    url: `https://nicaraguainformate.com/autor/${a.slug}`,
    image: a.photo ? `https://nicaraguainformate.com${a.photo}` : undefined,
    description: a.bio,
    knowsAbout: a.coverageAreas,
    sameAs: a.social ? Object.values(a.social).filter(Boolean) : undefined,
    worksFor: { '@id': 'https://nicaraguainformate.com/#organization' },
  }));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationJsonLdEnhanced(),
      buildWebSiteJsonLdEnhanced(),
      {
        '@type': 'AboutPage',
        '@id': 'https://nicaraguainformate.com/autoridad',
        url: 'https://nicaraguainformate.com/autoridad',
        name: 'Centro de Autoridad Editorial | Nicaragua Informate',
        isPartOf: { '@id': 'https://nicaraguainformate.com/#website' },
        about: { '@id': 'https://nicaraguainformate.com/#organization' },
      },
      ...authors,
    ],
  };
}

export default async function AutoridadPage() {
  const authors = getAllAuthors();
  const nonce = await getCspNonce();

  return (
    <main className="article-page" style={{ paddingTop: 0 }}>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(buildAuthorityJsonLd()) }}
      />

      <section
        className="article-hero"
        style={{ height: 'auto', minHeight: 260, position: 'relative' }}
      >
        <div style={{ background: 'var(--primary)', position: 'absolute', inset: 0 }} />
        <div
          className="article-hero-content"
          style={{
            position: 'relative',
            textAlign: 'center',
            padding: '60px 20px',
            color: '#fff',
          }}
        >
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, marginBottom: 12 }}>
            Centro de Autoridad Editorial
          </h1>
          <p style={{ fontSize: '1.1rem', maxWidth: 720, margin: '0 auto', lineHeight: 1.6 }}>
            Cómo construimos confianza, verificamos cada noticia y mantenemos una línea editorial
            transparente.
          </p>
        </div>
      </section>

      <div className="article-content-wrapper" style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px' }}>
        {/* Metodología editorial */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={sectionTitle}>Metodología editorial</h2>
          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            }}
          >
            <div style={stepStyle}>
              <strong style={{ color: '#c41e3a' }}>1. Detección del tema</strong>
              <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.5 }}>
                Monitoreo de fuentes oficiales, redes sociales y medios regionales para identificar
                noticias de interés público.
              </p>
            </div>
            <div style={stepStyle}>
              <strong style={{ color: '#c41e3a' }}>2. Verificación</strong>
              <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.5 }}>
                Búsqueda de declaraciones oficiales, documentos y contexto. No publicamos afirmaciones
                sin atribución o fuente verificable.
              </p>
            </div>
            <div style={stepStyle}>
              <strong style={{ color: '#c41e3a' }}>3. Redacción</strong>
              <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.5 }}>
                El periodista estructura la información con lead claro, contexto local, datos concretos y
                fuentes atribuidas.
              </p>
            </div>
            <div style={stepStyle}>
              <strong style={{ color: '#c41e3a' }}>4. Revisión</strong>
              <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.5 }}>
                Revisión editorial por la Directora para verificar precisión, equilibrio y cumplimiento
                de la línea editorial.
              </p>
            </div>
            <div style={stepStyle}>
              <strong style={{ color: '#c41e3a' }}>5. Publicación</strong>
              <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.5 }}>
                Optimización SEO, datos estructurados y distribución en redes. Cada noticia se marca con
                fecha de publicación.
              </p>
            </div>
            <div style={stepStyle}>
              <strong style={{ color: '#c41e3a' }}>6. Actualización</strong>
              <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.5 }}>
                Si hay cambios relevantes, actualizamos el artículo, registramos la nueva fecha y, de ser
                necesario, publicamos una corrección.
              </p>
            </div>
          </div>
        </section>

        {/* Transparencia */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={sectionTitle}>Cómo trabajamos</h2>
          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            }}
          >
            <div style={stepStyle}>
              <strong style={{ color: '#0f172a' }}>Política de correcciones</strong>
              <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.5 }}>
                Errores reconocidos se corrigen de forma visible.{' '}
                <Link href="/correcciones" style={{ color: '#c41e3a', textDecoration: 'none' }}>
                  Ver registro de correcciones
                </Link>
                .
              </p>
            </div>
            <div style={stepStyle}>
              <strong style={{ color: '#0f172a' }}>Política de fuentes</strong>
              <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.5 }}>
                Cada noticia declara su fuente principal y, cuando aplica, fuentes complementarias. No
                atribuimos información sin origen verificable.
              </p>
            </div>
            <div style={stepStyle}>
              <strong style={{ color: '#0f172a' }}>Separación información/opinión</strong>
              <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.5 }}>
                La cobertura noticiosa se presenta con neutralidad. Contenido de opinión o análisis se
                identifica explícitamente.
              </p>
            </div>
            <div style={stepStyle}>
              <strong style={{ color: '#0f172a' }}>Uso responsable de IA</strong>
              <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.5 }}>
                Las herramientas de IA se usan para optimización editorial, nunca para inventar fuentes,
                citas o hechos. El control final es humano.
              </p>
            </div>
            <div style={stepStyle}>
              <strong style={{ color: '#0f172a' }}>Compromiso editorial</strong>
              <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.5 }}>
                Priorizamos el interés público, la verificación y la claridad.{' '}
                <Link href="/politica-editorial" style={{ color: '#c41e3a', textDecoration: 'none' }}>
                  Leer política editorial completa
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Autores */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={sectionTitle}>Autores verificados</h2>
          <div
            style={{
              display: 'grid',
              gap: 20,
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            }}
          >
            {authors.map((author) => (
              <article
                key={author.slug}
                style={{
                  padding: 24,
                  borderRadius: 16,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                }}
                itemScope
                itemType="https://schema.org/Person"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  {author.photo ? (
                    <Image
                      src={author.photo}
                      alt={author.name}
                      width={72}
                      height={72}
                      style={{ borderRadius: '50%', objectFit: 'cover' }}
                      itemProp="image"
                    />
                  ) : (
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background: '#c41e3a',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 24,
                      }}
                    >
                      {author.name[0]}
                    </div>
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }} itemProp="name">
                      <Link
                        href={`/autor/${author.slug}`}
                        style={{ textDecoration: 'none', color: '#0f172a' }}
                        itemProp="url"
                      >
                        {author.name}
                      </Link>
                    </h3>
                    <p style={{ margin: '4px 0 0', color: '#c41e3a', fontWeight: 600, fontSize: 14 }} itemProp="jobTitle">
                      {author.role}
                    </p>
                  </div>
                </div>
                <p style={{ margin: '0 0 12px', color: '#475569', lineHeight: 1.5, fontSize: 14 }} itemProp="description">
                  {author.bio}
                </p>
                {author.experience && (
                  <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 13 }}>
                    <strong>Experiencia:</strong>{' '}
                    <span itemProp="knowsAbout">{author.experience}</span>
                  </p>
                )}
                {author.coverageAreas && author.coverageAreas.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {author.coverageAreas.map((area) => (
                      <span
                        key={area}
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Correcciones y EEAT */}
        <section style={{ marginBottom: 40, padding: 28, borderRadius: 16, background: '#f8fafc' }}>
          <h2 style={sectionTitle}>Transparencia y señales de confianza</h2>
          <ul style={{ lineHeight: 1.7, color: '#475569', paddingLeft: 20 }}>
            <li>
              Cada artículo declara su{' '}
              <strong>autor</strong> y enlaza a su perfil con esquema{' '}
              <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>Person</code>.
            </li>
            <li>
              Los datos estructurados incluyen{' '}
              <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>NewsArticle</code>,{' '}
              <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>Organization</code>,{' '}
              <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>WebSite</code> y{' '}
              <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>BreadcrumbList</code>.
            </li>
            <li>
              <Link href="/correcciones" style={{ color: '#c41e3a', textDecoration: 'none' }}>
                Registro público de correcciones
              </Link>{' '}
              para rendir cuentas.
            </li>
            <li>
              <Link href="/contacto" style={{ color: '#c41e3a', textDecoration: 'none' }}>
                Contacto editorial
              </Link>{' '}
              abierto para reportar errores.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
