"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, User, Bookmark } from 'lucide-react';
import type { Noticia } from '@/lib/types';

interface NewsCardProps {
  noticia: Noticia;
  variant?: 'default' | 'featured' | 'compact' | 'horizontal';
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showViews?: boolean;
}

export default function NewsCard({ 
  noticia, 
  variant = 'default',
  showExcerpt = true,
  showAuthor = true,
  showViews = true
}: NewsCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    if (diffInHours < 48) return 'Hace 1 día';
    
    return date.toLocaleDateString('es-NI', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      'nacionales': 'bg-blue-600',
      'internacionales': 'bg-purple-600',
      'sucesos': 'bg-red-600',
      'espectaculos': 'bg-pink-600',
      'deportes': 'bg-green-600',
      'tecnología': 'bg-cyan-600',
    };
    return colors[categoria?.toLowerCase()] || 'bg-gray-600';
  };

  if (variant === 'horizontal') {
    return (
      <article className="news-card news-card-horizontal">
        <Link href={`/noticias/${noticia.slug}`} className="news-card-link">
          <div className="news-card-image-container horizontal-image">
            <Image
              src={noticia.imagen || '/logo.svg'}
              alt={noticia.titulo}
              width={120}
              height={80}
              className="news-card-image"
            />
            <span className={`news-card-category ${getCategoryColor(noticia.categoria || '')}`}>
              {noticia.categoria}
            </span>
          </div>
          
          <div className="news-card-content horizontal-content">
            <h3 className="news-card-title horizontal-title">
              {noticia.titulo}
            </h3>
            
            <div className="news-card-meta">
              <div className="meta-item">
                <Clock size={14} />
                <time dateTime={noticia.fecha}>
                  {formatDate(noticia.fecha)}
                </time>
              </div>
              
              {showViews && noticia.vistas && (
                <div className="meta-item">
                  <Eye size={14} />
                  <span>{noticia.vistas.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className="news-card news-card-compact">
        <Link href={`/noticias/${noticia.slug}`} className="news-card-link">
          <div className="news-card-image-container compact-image">
            <Image
              src={noticia.imagen || '/logo.svg'}
              alt={noticia.titulo}
              width={60}
              height={60}
              className="news-card-image"
            />
          </div>
          
          <div className="news-card-content compact-content">
            <span className={`news-card-category-small ${getCategoryColor(noticia.categoria || '')}`}>
              {noticia.categoria}
            </span>
            <h4 className="news-card-title compact-title">
              {noticia.titulo}
            </h4>
            <time className="news-card-date-small">
              {formatDate(noticia.fecha)}
            </time>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className={`news-card ${variant === 'featured' ? 'news-card-featured' : ''}`}>
      <Link href={`/noticias/${noticia.slug}`} className="news-card-link">
        <div className="news-card-image-container">
          <Image
            src={noticia.imagen || '/logo.svg'}
            alt={noticia.titulo}
            width={variant === 'featured' ? 600 : 400}
            height={variant === 'featured' ? 400 : 250}
            className="news-card-image"
            sizes={variant === 'featured' 
              ? "(max-width: 768px) 100vw, 50vw"
              : "(max-width: 768px) 100vw, 33vw"
            }
          />
          
          <div className="news-card-overlay">
            <button className="bookmark-button" aria-label="Guardar noticia">
              <Bookmark size={16} />
            </button>
          </div>
          
          <span className={`news-card-category ${getCategoryColor(noticia.categoria || '')}`}>
            {noticia.categoria}
          </span>
        </div>
        
        <div className="news-card-content">
          <h3 className={`news-card-title ${variant === 'featured' ? 'featured-title' : ''}`}>
            {noticia.titulo}
          </h3>
          
          {showExcerpt && noticia.resumen && (
            <p className="news-card-excerpt">
              {noticia.resumen}
            </p>
          )}
          
          <div className="news-card-meta">
            <div className="meta-primary">
              <div className="meta-item">
                <Clock size={14} />
                <time dateTime={noticia.fecha}>
                  {formatDate(noticia.fecha)}
                </time>
              </div>
              
              {showViews && noticia.vistas && (
                <div className="meta-item">
                  <Eye size={14} />
                  <span>{noticia.vistas.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            {showAuthor && noticia.autor && (
              <div className="meta-secondary">
                <div className="meta-item author">
                  <User size={14} />
                  <span>{noticia.autor}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}