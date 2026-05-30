'use client';

import Link from 'next/link';
import Image from 'next/image';
import { User, Calendar, Clock, ExternalLink } from 'lucide-react';
import { formatDateTime } from '@/lib/formateo';

interface AuthorCardProps {
  name?: string;
  photo?: string;
  bio?: string;
  role?: string;
  slug?: string;
  publishedDate?: string;
  updatedDate?: string;
  className?: string;
}

// Fallback para autores sin datos completos
const DEFAULT_AUTHOR = {
  name: 'Redacción Nicaragua Informate',
  role: 'Periodista',
  bio: 'Equipo editorial de Nicaragua Informate. Comprometido con el periodismo verificado y la información de calidad para nicaragüenses.',
  photo: null,
};

export default function AuthorCard({
  name,
  photo,
  bio,
  role,
  slug,
  publishedDate,
  updatedDate,
  className = '',
}: AuthorCardProps) {
  const displayName = name?.trim() || DEFAULT_AUTHOR.name;
  const displayRole = role?.trim() || DEFAULT_AUTHOR.role;
  const displayBio = bio?.trim() || DEFAULT_AUTHOR.bio;
  const hasPhoto = photo && photo.trim().length > 0;
  const hasSlug = slug && slug.trim().length > 0;
  const isUpdated = updatedDate && updatedDate !== publishedDate;

  return (
    <aside 
      className={`flex flex-wrap items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200 ${className}`}
      aria-label={`Información del autor: ${displayName}`}
    >
      {/* Avatar */}
      {hasPhoto ? (
        <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200">
          <Image
            src={photo}
            alt={displayName}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-red-800 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          <User size={28} strokeWidth={2} />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {hasSlug ? (
            <Link 
              href={`/autor/${slug}`} 
              className="text-base font-bold text-gray-900 hover:text-red-800 transition-colors"
              rel="author"
            >
              {displayName}
            </Link>
          ) : (
            <span className="text-base font-bold text-gray-900">
              {displayName}
            </span>
          )}
        </div>

        <p className="text-sm text-red-800 font-medium mt-0.5">
          {displayRole}
        </p>

        <p className="text-sm text-gray-600 leading-relaxed mt-2">
          {displayBio}
        </p>

        {/* Fechas */}
        {(publishedDate || updatedDate) && (
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
            {publishedDate && (
              <span className="flex items-center gap-1">
                <Calendar size={12} aria-hidden="true" />
                <time dateTime={publishedDate}>
                  Publicado: {formatDateTime(publishedDate)}
                </time>
              </span>
            )}
            {isUpdated && (
              <span className="flex items-center gap-1">
                <Clock size={12} aria-hidden="true" />
                <time dateTime={updatedDate}>
                  Actualizado: {formatDateTime(updatedDate)}
                </time>
              </span>
            )}
          </div>
        )}

        {/* Link a más artículos */}
        {hasSlug && (
          <Link
            href={`/autor/${slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-red-800 hover:text-red-900 mt-3 transition-colors"
          >
            Más artículos
            <ExternalLink size={14} aria-hidden="true" />
          </Link>
        )}
      </div>
    </aside>
  );
}
