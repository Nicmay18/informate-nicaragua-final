"use client";

import { useState, useRef } from 'react';
import { Play, Pause, Radio, Mic } from 'lucide-react';

const RADIO_URL = 'https://server1.hostin.cl:8128/stream';

const PODCASTS = [
  {
    id: 1,
    titulo: 'El Resumen Matutino',
    descripcion: 'Las 5 noticias que necesitás saber hoy',
    duracion: '8 min',
    imagen: '/logo.webp',
  },
  {
    id: 2,
    titulo: 'Análisis Semanal',
    descripcion: 'Contexto profundo de los eventos de la semana',
    duracion: '22 min',
    imagen: '/logo.webp',
  },
  {
    id: 3,
    titulo: 'Nicaragua Hoy',
    descripcion: 'La agenda del día con nuestros periodistas',
    duracion: '15 min',
    imagen: '/logo.webp',
  },
];

export default function ZonaMultimedia() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleRadio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.src = RADIO_URL;
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <section className="zona-multimedia" aria-label="Radio y podcast" data-reveal>
      <div className="section-container">
        <header className="section-header multimedia-header">
          <h2 className="section-title multimedia-title">
            <span className="multimedia-wave-icon">
              <Radio size={24} />
              <span className="wave-anim" />
            </span>
            EN VIVO Y PODCAST
          </h2>
        </header>

        <div className="multimedia-grid">
          {/* Reproductor principal */}
          <div className="radio-player">
            <div className="radio-player-info">
              <div className="radio-logo">
                <Radio size={40} />
              </div>
              <div className="radio-meta">
                <p className="radio-live-badge">
                  <span className="live-dot" />
                  EN VIVO
                </p>
                <h3 className="radio-title">Nicaragua Informate Radio</h3>
                <p className="radio-subtitle">Información al instante desde Managua</p>
              </div>
            </div>

            <div className="radio-controls">
              <button
                onClick={toggleRadio}
                className="radio-play-btn"
                aria-label={isPlaying ? 'Pausar radio' : 'Escuchar radio en vivo'}
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </button>
              <div className="radio-eq">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`eq-bar ${isPlaying ? 'eq-bar--active' : ''}`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>

            <audio ref={audioRef} preload="none" />
          </div>

          {/* Podcasts recientes */}
          <div className="podcasts-grid">
            {PODCASTS.map((p) => (
              <div key={p.id} className="podcast-card">
                <div className="podcast-icon">
                  <Mic size={24} />
                </div>
                <div className="podcast-info">
                  <h4 className="podcast-title">{p.titulo}</h4>
                  <p className="podcast-desc">{p.descripcion}</p>
                  <span className="podcast-duracion">{p.duracion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
