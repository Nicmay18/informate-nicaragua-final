"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { Noticia } from '@/lib/types';

interface HeroSectionProps {
  noticias: Noticia[];
}

export default function HeroSection({ noticias }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const heroNoticias = noticias.slice(0, 5);

  useEffect(() => {
    if (!isAutoPlaying || heroNoticias.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroNoticias.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, heroNoticias.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroNoticias.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroNoticias.length) % heroNoticias.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (heroNoticias.length === 0) {
    return (
      <section className="hero-section hero-loading">
        <div className="hero-loading-content">
          <div className="loading-spinner"></div>
          <p>Cargando noticias destacadas...</p>
        </div>
      </section>
    );
  }

  const currentNoticia = heroNoticias[currentSlide];

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-main">
          <div className="hero-image-container">
            <Image
              src={currentNoticia.imagen || '/logo.webp'}
              alt={currentNoticia.titulo}
              fill
              className="hero-image"
              sizes="(max-width: 768px) 100vw, 60vw"
              priority
            />
            <div className="hero-overlay"></div>
            
            {/* Navigation Arrows */}
            {heroNoticias.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="hero-nav-button hero-nav-prev"
                  aria-label="Noticia anterior"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextSlide}
                  className="hero-nav-button hero-nav-next"
                  aria-label="Siguiente noticia"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          <div className="hero-content">
            <div className="hero-category">
              <span className={`category-badge category-${currentNoticia.categoria?.toLowerCase()}`}>
                {currentNoticia.categoria}
              </span>
            </div>

            <h1 className="hero-title">
              <Link href={`/noticias/${currentNoticia.slug}`}>
                {currentNoticia.titulo}
              </Link>
            </h1>

            {currentNoticia.resumen && (
              <p className="hero-excerpt">
                {currentNoticia.resumen}
              </p>
            )}

            <div className="hero-meta">
              <div className="hero-meta-item">
                <Clock size={16} />
                <time dateTime={currentNoticia.fecha}>
                  {new Date(currentNoticia.fecha).toLocaleDateString('es-NI', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </time>
              </div>
              
              {currentNoticia.vistas && (
                <div className="hero-meta-item">
                  <Eye size={16} />
                  <span>{currentNoticia.vistas.toLocaleString()} vistas</span>
                </div>
              )}

              {currentNoticia.autor && (
                <div className="hero-meta-item">
                  <span>Por {currentNoticia.autor}</span>
                </div>
              )}
            </div>

            <Link
              href={`/noticias/${currentNoticia.slug}`}
              className="hero-cta-button"
            >
              <Play size={16} />
              <span>Leer noticia completa</span>
            </Link>
          </div>
        </div>

        {/* Slide Indicators */}
        {heroNoticias.length > 1 && (
          <div className="hero-indicators">
            {heroNoticias.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`hero-indicator ${index === currentSlide ? 'active' : ''}`}
                aria-label={`Ir a noticia ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Side Stories */}
        {heroNoticias.length > 1 && (
          <div className="hero-side-stories">
            <h3 className="side-stories-title">Otras noticias destacadas</h3>
            <div className="side-stories-list">
              {heroNoticias.slice(1, 4).map((noticia) => (
                <Link
                  key={noticia.id}
                  href={`/noticias/${noticia.slug}`}
                  className="side-story-card"
                >
                  <div className="side-story-image">
                    <Image
                      src={noticia.imagen || '/logo.webp'}
                      alt={noticia.titulo}
                      width={80}
                      height={60}
                      className="side-story-img"
                    />
                  </div>
                  <div className="side-story-content">
                    <span className={`side-story-category category-${noticia.categoria?.toLowerCase()}`}>
                      {noticia.categoria}
                    </span>
                    <h4 className="side-story-title">{noticia.titulo}</h4>
                    <time className="side-story-date">
                      {new Date(noticia.fecha).toLocaleDateString('es-NI', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </time>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}