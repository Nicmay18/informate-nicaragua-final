'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Mail, Globe, Award, BookOpen, Newspaper,
  CalendarDays, ExternalLink, Rss, Share2,
} from 'lucide-react';
import { formatDateShortES } from '@/lib/formateo';

interface Articulo {
  id: string;
  slug: string;
  titulo: string;
  fecha: string;
  categoria: string;
  imagen: string;
}

interface SocialLink {
  name: string;
  href: string;
  icon: 'linkedin' | 'twitter' | 'rss' | 'web';
}

interface AuthorProfileProps {
  name: string;
  role: string;
  bio: string;
  extendedBio?: string;
  location: string;
  email: string;
  photo: string;
  initials: string;
  articles: Articulo[];
  socials?: SocialLink[];
  specialties?: string[];
  sinceYear?: string;
  education?: string;
  awards?: string[];
  schemaUrl: string;
}

const SOCIAL_ICONS = {
  linkedin: <Share2 size={16} />,
  twitter: <Rss size={16} />,
  rss: <Rss size={16} />,
  web: <Globe size={16} />,
};

export default function AuthorProfile({
  name,
  role,
  bio,
  extendedBio,
  location,
  email,
  photo,
  initials,
  articles,
  socials = [],
  specialties = [],
  sinceYear,
  education,
  awards = [],
  schemaUrl,
}: AuthorProfileProps) {
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: role,
    description: bio,
    url: schemaUrl,
    image: photo.startsWith('http') ? photo : `https://nicaraguainformate.com${photo}`,
    email: `mailto:${email}`,
    worksFor: {
      '@type': 'NewsMediaOrganization',
      name: 'Nicaragua Informate',
      url: 'https://nicaraguainformate.com',
    },
    alumniOf: education ? { '@type': 'EducationalOrganization', name: education } : undefined,
    award: awards.length > 0 ? awards : undefined,
    sameAs: socials.map((s) => s.href),
    knowsAbout: specialties,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      {/* Hero Card */}
      <div
        style={{
          display: 'flex',
          gap: 28,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          marginBottom: '2.5rem',
          padding: '2rem',
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: 24,
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            border: '3px solid var(--c-accent)',
            position: 'relative',
            background: 'linear-gradient(135deg,#16a34a,#22c55e)',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 52,
          }}
        >
          {photo ? (
            <Image
              src={photo}
              alt={name}
              fill
              style={{ objectFit: 'cover' }}
              sizes="140px"
              priority
            />
          ) : (
            initials
          )}
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h2
            style={{
              fontSize: '1.8rem',
              color: 'var(--c-text)',
              marginBottom: 8,
              fontWeight: 800,
            }}
          >
            {name}
          </h2>
          <div
            style={{
              color: 'var(--c-accent)',
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 16,
            }}
          >
            {role}
          </div>
          <p
            style={{
              color: 'var(--c-text-secondary)',
              fontSize: '1rem',
              lineHeight: 1.75,
              marginBottom: 20,
            }}
          >
            {bio}
          </p>

          {socials.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: '1px solid var(--c-border)',
                    color: 'var(--c-text-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {SOCIAL_ICONS[s.icon]}
                  {s.name}
                </a>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--c-text-muted)',
                fontSize: 13,
              }}
            >
              <MapPin size={14} /> {location}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--c-text-muted)',
                fontSize: 13,
              }}
            >
              <Mail size={14} /> {email}
            </div>
            {sinceYear && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--c-text-muted)',
                  fontSize: 13,
                }}
              >
                <Award size={14} /> En el medio desde {sinceYear}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extended Bio */}
      {extendedBio && (
        <>
          <h3
            style={{
              fontSize: '1.25rem',
              color: 'var(--c-text)',
              marginTop: '2rem',
              marginBottom: '0.75rem',
              fontWeight: 700,
            }}
          >
            Trayectoria profesional
          </h3>
          <p
            style={{
              color: 'var(--c-text-secondary)',
              marginBottom: '1.25rem',
              lineHeight: 1.75,
              fontSize: '1rem',
            }}
          >
            {extendedBio}
          </p>
        </>
      )}

      {/* Specialties Grid */}
      {specialties.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
            gap: '1.25rem',
            margin: '2.5rem 0',
          }}
        >
          {specialties.map((spec) => (
            <div
              key={spec}
              style={{
                background: 'var(--c-surface-elevated)',
                border: '1px solid var(--c-border)',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div style={{ marginBottom: '0.75rem' }}>
                <BookOpen size={24} color="var(--c-accent)" />
              </div>
              <h4 style={{ color: 'var(--c-text)', marginBottom: '0.4rem', fontSize: '1.05rem' }}>
                {spec}
              </h4>
            </div>
          ))}
        </div>
      )}

      {/* Awards */}
      {awards.length > 0 && (
        <>
          <h3
            style={{
              fontSize: '1.15rem',
              color: 'var(--c-text)',
              marginTop: '2rem',
              marginBottom: '0.75rem',
              fontWeight: 700,
            }}
          >
            Reconocimientos
          </h3>
          <ul
            style={{
              color: 'var(--c-text-secondary)',
              lineHeight: 1.8,
              paddingLeft: '1.5rem',
              listStyleType: 'disc',
              marginBottom: '2rem',
              fontSize: '0.95rem',
            }}
          >
            {awards.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </>
      )}

      {/* Articles */}
      {articles.length > 0 && (
        <>
          <h3
            style={{
              fontSize: '1.15rem',
              color: 'var(--c-text)',
              marginTop: '2.5rem',
              marginBottom: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Newspaper size={18} color="var(--c-accent)" />
            Artículos publicados ({articles.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/noticias/${a.slug}`}
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'var(--c-surface-elevated)',
                  border: '1px solid var(--c-border)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 56,
                    borderRadius: 8,
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0,
                    background: 'var(--c-border)',
                  }}
                >
                  {a.imagen ? (
                    <Image
                      src={a.imagen}
                      alt={a.titulo}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="80px"
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--c-text-muted)',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {a.categoria}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: 'var(--c-text)',
                      fontWeight: 600,
                      fontSize: 14,
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {a.titulo}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'var(--c-text-muted)',
                      fontSize: 12,
                    }}
                  >
                    <CalendarDays size={12} /> {formatDateShortES(a.fecha)}
                    <span
                      style={{
                        marginLeft: 8,
                        color: 'var(--c-accent)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: 10,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {a.categoria}
                    </span>
                  </div>
                </div>
                <ExternalLink
                  size={14}
                  color="var(--c-text-muted)"
                  style={{ flexShrink: 0 }}
                />
              </Link>
            ))}
          </div>
        </>
      )}

      <p
        style={{
          color: 'var(--c-text-muted)',
          fontSize: '0.9rem',
          marginTop: '2rem',
        }}
      >
        Consulta nuestra{' '}
        <Link
          href="/politica-editorial"
          style={{ color: 'var(--c-accent)', textDecoration: 'none' }}
        >
          Política Editorial
        </Link>{' '}
        completa para más detalles sobre nuestros estándares de publicación.
      </p>
    </>
  );
}
