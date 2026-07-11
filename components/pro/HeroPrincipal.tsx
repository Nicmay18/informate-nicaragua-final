"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Clock, User, BookOpen, ArrowRight } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';
import { tiempoRelativo, tiempoLectura } from '@/lib/formateo';

interface HeroPrincipalProps {
  heroNoticia: Noticia | null;
  ultimaHora: Noticia[];
}

export default function HeroPrincipal({ heroNoticia, ultimaHora }: HeroPrincipalProps) {
  if (!heroNoticia) return null;

  const readTime = tiempoLectura(heroNoticia.contenido || heroNoticia.resumen || '');
  const relTime = tiempoRelativo(heroNoticia.fecha);
  const catColor = CATEGORY_COLORS[heroNoticia.categoria] || '#B45309';

  return (
    <section className="hero-principal" aria-label="Noticia principal" data-reveal>
      <div className="hero-inner">
        {/* Imagen de fondo */}
        <div className="hero-bg">
          <Image
            src={heroNoticia.imagen || '/logo.webp'}
            alt={heroNoticia.titulo}
            fill
            priority
            sizes="100vw"
            className="hero-bg-img"
          />
          <div className="hero-overlay" />
        </div>

        {/* Contenido principal */}
        <div className="hero-content-wrap">
          <div className="hero-content">
            {/* Tag categoría */}
            <span
              className="hero-category-tag"
              style={{ backgroundColor: catColor }}
            >
              {heroNoticia.categoria?.toUpperCase()}
            </span>

            {/* Título */}
            <h1 className="hero-title">
              <Link href={`/noticias/${heroNoticia.slug}`}>
                {heroNoticia.titulo}
              </Link>
            </h1>

            {/* Resumen */}
            {heroNoticia.resumen && (
              <p className="hero-lead">{heroNoticia.resumen}</p>
            )}

            {/* Meta */}
            <div className="hero-meta">
              {heroNoticia.autor && (
                <span className="hero-meta-item">
                  <User size={14} />
                  {heroNoticia.autor.split(' ').slice(0, 2).join(' ')}
                </span>
              )}
              <span className="hero-meta-item">
                <Clock size={14} />
                {relTime}
              </span>
              <span className="hero-meta-item">
                <BookOpen size={14} />
                {readTime} min de lectura
              </span>
            </div>

            {/* CTA */}
            <Link
              href={`/noticias/${heroNoticia.slug}`}
              className="hero-cta"
            >
              Leer completo
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Panel Última Hora (desktop) */}
          <aside className="hero-ultima-hora" aria-label="Última hora">
            <div className="ultima-hora-header">
              <span className="ultima-hora-label">ÚLTIMA HORA</span>
            </div>
            <ul className="ultima-hora-list">
              {ultimaHora.slice(0, 5).map((noticia) => (
                <li key={noticia.id} className="ultima-hora-item">
                  <Link href={`/noticias/${noticia.slug}`} className="ultima-hora-link">
                    <span
                      className="ultima-hora-dot"
                      style={{ backgroundColor: CATEGORY_COLORS[noticia.categoria] || '#DC2626' }}
                    />
                    <span className="ultima-hora-text">{noticia.titulo}</span>
                    <span className="ultima-hora-time">{tiempoRelativo(noticia.fecha)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
