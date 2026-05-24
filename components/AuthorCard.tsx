'use client';

import Link from 'next/link';
import Image from 'next/image';
import { User, Calendar, Clock } from 'lucide-react';

interface AuthorCardProps {
  authorName?: string;
  authorPhoto?: string;
  authorBio?: string;
  authorSlug?: string;
  publishedDate: string;
  updatedDate?: string;
}

export default function AuthorCard({
  authorName = 'Redacción Nicaragua Informate',
  authorPhoto,
  authorBio,
  authorSlug,
  publishedDate,
  updatedDate,
}: AuthorCardProps) {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-NI', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="author-card">
      <div className="author-card__header">
        <h3 className="author-card__title">Autor</h3>
      </div>

      <div className="author-card__content">
        <div className="author-card__main">
          {authorPhoto ? (
            <Image
              src={authorPhoto}
              alt={authorName}
              width={64}
              height={64}
              className="author-card__photo"
            />
          ) : (
            <div className="author-card__avatar">
              <User size={28} />
            </div>
          )}

          <div className="author-card__info">
            {authorSlug ? (
              <Link href={`/autor/${authorSlug}`} className="author-card__name">
                {authorName}
              </Link>
            ) : (
              <span className="author-card__name">{authorName}</span>
            )}
            <span className="author-card__role">Periodista | Nicaragua Informate</span>
          </div>
        </div>

        {authorBio && <p className="author-card__bio">{authorBio}</p>}

        <div className="author-card__meta">
          <div className="author-card__meta-item">
            <Calendar size={14} />
            <span>Publicado: {formatDate(publishedDate)} {formatTime(publishedDate)}</span>
          </div>
          {updatedDate && updatedDate !== publishedDate && (
            <div className="author-card__meta-item">
              <Clock size={14} />
              <span>Actualizado: {formatDate(updatedDate)} {formatTime(updatedDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
