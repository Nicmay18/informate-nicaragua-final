"use client";

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Noticia } from '@/lib/types';
import { tiempoRelativo } from '@/lib/formateo';

interface SeccionSucesosProps {
  noticias: Noticia[];
}

const URGENTE_KEYWORDS = ['última hora', 'breaking', 'urgente', 'alerta'];

export default function SeccionSucesos({ noticias }: SeccionSucesosProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);

  if (!noticias.length) return null;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setScrollStart(scrollRef.current?.scrollLeft || 0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    const delta = startX - e.clientX;
    scrollRef.current.scrollLeft = scrollStart + delta;
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const esUrgente = (titulo: string) =>
    URGENTE_KEYWORDS.some(k => titulo.toLowerCase().includes(k));

  return (
    <section className="seccion-sucesos section-alt" aria-label="Sucesos" data-reveal>
      <div className="section-container">
        <header className="section-header">
          <h2 className="section-title">
            <span>SUCESOS</span>
            <span className="section-title-line" style={{ backgroundColor: '#DC2626' }} />
          </h2>
          <div className="sucesos-nav">
            <button
              onClick={() => scroll('left')}
              className="sucesos-nav-btn"
              aria-label="Anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="sucesos-nav-btn"
              aria-label="Siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        <div
          className="sucesos-scroll"
          ref={scrollRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'pan-y' }}
        >
          {noticias.map((noticia) => {
            const urgente = esUrgente(noticia.titulo);
            return (
              <article key={noticia.id} className="suceso-card">
                <Link href={`/noticias/${noticia.slug}`} className="suceso-card-link">
                  <div className="suceso-card-img-wrap">
                    <Image
                      src={noticia.imagen || '/logo.webp'}
                      alt={noticia.titulo}
                      width={320}
                      height={240}
                      className="suceso-card-img"
                    />
                    {urgente && (
                      <span className="suceso-urgente-badge">ÚLTIMA HORA</span>
                    )}
                  </div>
                  <div className="suceso-card-body">
                    <h3
                      className="suceso-card-title"
                      style={{ color: urgente ? '#DC2626' : '#1E293B' }}
                    >
                      {noticia.titulo}
                    </h3>
                    {noticia.resumen && (
                      <p className="suceso-card-excerpt">{noticia.resumen}</p>
                    )}
                    <div className="suceso-card-meta">
                      <Clock size={13} />
                      <time>{tiempoRelativo(noticia.fecha)}</time>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        <div className="sucesos-footer">
          <Link href="/categoria/sucesos" className="ver-mas-link">
            Ver más sucesos
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
