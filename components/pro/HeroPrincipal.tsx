"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, User, BookOpen, ArrowRight } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';
import { tiempoRelativo, tiempoLectura } from '@/lib/formateo';

interface HeroPrincipalProps {
  heroNoticias: Noticia[];
}

export default function HeroPrincipal({ heroNoticias }: HeroPrincipalProps) {
  const n = heroNoticias[0];
  const [imgSrc, setImgSrc] = useState(n?.imagen || '/logo.webp');

  if (!n) return null;

  return (
    <section className="hero-carousel" aria-label="Noticia principal" data-reveal>
      <div className="hero-slides">
        <div className="hero-slide active" aria-hidden="false">
          <div className="hero-card">
            <div
              className="hero-body"
              style={{
                borderRightColor: CATEGORY_COLORS[n.categoria] || '#B45309',
                borderTopColor: CATEGORY_COLORS[n.categoria] || '#B45309',
              }}
            >
              <span className="hero-eyebrow">Noticia principal</span>

              <span
                className="hero-tag"
                style={{ backgroundColor: CATEGORY_COLORS[n.categoria] || '#B45309' }}
              >
                {n.categoria?.toUpperCase()}
              </span>

              <h1 className="hero-title">
                <Link href={'/noticias/' + n.slug}>{n.titulo}</Link>
              </h1>

              {n.resumen && <p className="hero-excerpt">{n.resumen}</p>}

              <div className="hero-meta">
                {n.autor && (
                  <span className="hero-meta-item">
                    <User size={14} />
                    {n.autor.split(' ').slice(0, 2).join(' ')}
                  </span>
                )}
                <span className="hero-meta-item">
                  <Clock size={14} />
                  {tiempoRelativo(n.fecha)}
                </span>
                <span className="hero-meta-item">
                  <BookOpen size={14} />
                  {tiempoLectura(n.contenido || n.resumen || '')} min de lectura
                </span>
              </div>

              <Link href={'/noticias/' + n.slug} className="hero-btn">
                Leer completo
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="hero-media">
              <Image
                src={imgSrc}
                alt={n.titulo}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 55vw"
                className="hero-media-img"
                style={{ objectFit: 'cover' }}
                onError={() => setImgSrc('/logo.webp')}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
