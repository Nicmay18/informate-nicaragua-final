'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDateTime } from '@/lib/formateo';

interface AuthorCardProps {
  name?: string;
  photo?: string;
  bio?: string;
  role?: string;
  slug?: string;
  publishedDate?: string;
  updatedDate?: string;
}

const DEFAULT_AUTHOR = {
  name: 'Redacción Nicaragua Informate',
  role: 'Periodista',
  bio: 'Equipo editorial de Nicaragua Informate. Comprometido con el periodismo verificado y la información de calidad para nicaragüenses.',
  photo: null,
};

// Bios profesionales de los 3 autores (E-E-A-T)
const AUTORES: Record<string, { role: string; bio: string; slug: string }> = {
  'Keyling Elieth Rivera Muñoz': {
    role: 'Directora Editorial',
    bio: 'Periodista nicaragüense con más de 8 años de experiencia. Especialista en sucesos, cobertura comunitaria y periodismo de investigación. Directora editorial y cofundadora de Nicaragua Informate desde 2024. Certificada en periodismo digital y narrativa multimedia.',
    slug: 'keyling-eliet-rivera-munoz',
  },
  'Maycol Josué Nicaragua Rivas': {
    role: 'Director Técnico y Analista',
    bio: 'Ingeniero en sistemas computacionales y analista de datos. Director técnico de Nicaragua Informate desde 2024. Encargado de verificación de fuentes digitales, seguridad informática y optimización de plataformas. Especialista en fact-checking y análisis de tendencias informativas.',
    slug: 'maycol-josue-nicaragua-rivas',
  },
  'José Luis López Ramírez': {
    role: 'Director de Operaciones',
    bio: 'Ingeniero en redes y especialista en ciberseguridad. Director de operaciones de Nicaragua Informate desde 2024. Gestión de infraestructura tecnológica, protección de datos y continuidad operativa. Experto en optimización de rendimiento web y SEO técnico.',
    slug: 'jose-luis-lopez-ramirez',
  },
};

export default function AuthorCard({
  name,
  photo,
  bio,
  role,
  slug,
  publishedDate,
  updatedDate,
}: AuthorCardProps) {
  const autorKey = name?.trim() || '';
  const autorData = AUTORES[autorKey];
  const isKeyling = autorKey === 'Keyling Elieth Rivera Muñoz';

  const displayName = autorKey || DEFAULT_AUTHOR.name;
  const displayRole = autorData?.role || role?.trim() || DEFAULT_AUTHOR.role;
  const displayBio = autorData?.bio || bio?.trim() || DEFAULT_AUTHOR.bio;
  
  const finalPhoto = isKeyling ? '/keyling-rivera.jpg' : photo;
  const finalSlug = autorData?.slug || slug;

  const hasPhoto = finalPhoto && finalPhoto.trim().length > 0;
  const hasSlug = finalSlug && finalSlug.trim().length > 0;
  const isUpdated = Boolean(updatedDate && updatedDate !== publishedDate);

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 16,
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    border: '1px solid #e5e5e5',
  };

  const avatarImgStyle: React.CSSProperties = {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    border: '2px solid #e5e5e5',
  };

  const avatarFallbackStyle: React.CSSProperties = {
    width: 64,
    height: 64,
    borderRadius: '50%',
    backgroundColor: '#991b1b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: 20,
    flexShrink: 0,
  };

  const infoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const nameStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: '#111827',
    textDecoration: 'none',
  };

  const roleStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#991b1b',
    fontWeight: 600,
    margin: '2px 0 0',
  };

  const bioStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 1.6,
    margin: '8px 0 0',
  };

  const dateStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    fontSize: 12,
    color: '#6b7280',
  };

  const linkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 14,
    fontWeight: 600,
    color: '#991b1b',
    textDecoration: 'none',
    marginTop: 12,
  };

  return (
    <aside style={wrapperStyle} aria-label={`Información del autor: ${displayName}`} itemScope itemType="https://schema.org/Person">
      {hasPhoto ? (
        <div style={avatarImgStyle} itemProp="image">
          <Image src={finalPhoto!} alt={displayName} fill style={{ objectFit: 'cover' }} sizes="64px" />
        </div>
      ) : (
        <div style={avatarFallbackStyle}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        </div>
      )}

      <div style={infoStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {hasSlug ? (
            <Link href={`/autor/${finalSlug}`} style={nameStyle} rel="author" itemProp="name url">
              {displayName}
            </Link>
          ) : (
            <span style={nameStyle} itemProp="name">{displayName}</span>
          )}
        </div>

        <p style={roleStyle} itemProp="jobTitle">{displayRole}</p>
        <p style={displayBio ? { ...bioStyle } : bioStyle} itemProp="description">{displayBio}</p>

        {(publishedDate || updatedDate) && (
          <div style={dateStyle}>
            {publishedDate && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <time dateTime={publishedDate} itemProp="datePublished" suppressHydrationWarning>Publicado: {formatDateTime(publishedDate)}</time>
              </span>
            )}
            {isUpdated && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
                <time dateTime={updatedDate} itemProp="dateModified" suppressHydrationWarning>Actualizado: {formatDateTime(updatedDate)}</time>
              </span>
            )}
          </div>
        )}

        {hasSlug && (
          <Link href={`/autor/${finalSlug}`} style={linkStyle}>
            Más artículos
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
          </Link>
        )}
      </div>
    </aside>
  );
}
