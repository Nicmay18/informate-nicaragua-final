'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import ProLayout from '@/components/ProLayout';
import { Play, Pause, Volume2, Radio } from 'lucide-react';

const STATIONS = [
  { id: 'buenisima', name: 'La Buenísima', slogan: '¡La que te gusta!', url: 'https://cast.tunzilla.com/http://alba-ni-nicaradios-labuenisima.stream.mediatiquestream.com/index.m3u8', genre: 'Ranchera / Grupera / Cumbia', color: '#ef4444', freq: '93.1 FM', city: 'Managua' },
  { id: 'pachanguera', name: 'La Pachanguera', slogan: '¡Pura pachanga!', url: 'https://radio.garden/api/ara/content/listen/la-pachanguera-95-1-fm-managua/channel.mp3', genre: 'Tropical / Salsa / Latin Hits', color: '#f59e0b', freq: '95.1 FM', city: 'Managua' },
  { id: 'vivafm', name: 'Viva FM', slogan: 'La música que llevas dentro', url: 'https://stream.zeno.fm/78a5h5mfgg8uv', genre: 'Pop / Hits / Latino', color: '#10b981', freq: '98.3 FM', city: 'Managua' },
  { id: 'futura', name: 'Radio Futura', slogan: 'La emisora líder de Nicaragua', url: 'https://radio.garden/api/ara/content/listen/SjhzgGc8/channel.mp3', genre: 'Urbano / Reggaetón / Electrónica', color: '#8b5cf6', freq: '91.3 FM', city: 'Managua' },
  { id: 'maranatha', name: 'Radio Maranatha', slogan: 'Música que edifica tu vida', url: 'https://radio.garden/api/ara/content/listen/f7txZiwG/channel.mp3', genre: 'Cristiana / Alabanza', color: '#3b82f6', freq: '103.5 FM', city: 'Managua' },
  { id: 'fiesta-latina', name: 'Fiesta Latina', slogan: '¡La fiesta no para!', url: 'https://radio.garden/api/ara/content/listen/VcCrAhT6/channel.mp3', genre: 'Salsa / Merengue / Bachata / Reggaetón', color: '#ec4899', freq: '89.1 FM', city: 'Managua' },
  { id: 'clasica', name: 'Clásica 101.9', slogan: 'Tu tiempo, tu música', url: 'https://radio.garden/api/ara/content/listen/clasica-1019-fm-managua/channel.mp3', genre: 'Oldies / Clásicos / Instrumental', color: '#06b6d4', freq: '101.9 FM', city: 'Managua' },
];

function AudioVisualizer({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="radio-visualizer">
      {[...Array(5)].map((_, i) => (
        <span key={i} className="radio-visualizer__bar" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

export default function RadioPage() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const handlePlay = (id: string) => {
    // Pausar cualquier otra emisora
    Object.entries(audioRefs.current).forEach(([sid, audio]) => {
      if (sid !== id && audio) {
        audio.pause();
      }
    });

    const audio = audioRefs.current[id];
    if (audio) {
      audio.volume = volume;
      audio.play().catch(() => {
        // Autoplay policy puede bloquear
        setPlayingId(null);
      });
    }
    setPlayingId(id);
  };

  const handlePause = (id: string) => {
    const audio = audioRefs.current[id];
    if (audio) {
      audio.pause();
    }
    setPlayingId(null);
  };

  const handleVolume = (id: string, val: number) => {
    setVolume(val);
    const audio = audioRefs.current[id];
    if (audio) {
      audio.volume = val;
    }
  };

  return (
    <ProLayout tickerText="Radio Nicaragua Informate — Escucha en vivo">
      <main className="radio-page-main" style={{ minHeight: '80vh', padding: '48px 16px', maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', marginBottom: 12 }}>
            <Radio size={32} style={{ verticalAlign: 'middle', marginRight: 12 }} />
            Radio Nicaragua Informate
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: 600, margin: '0 auto' }}>
            Escucha las mejores emisoras de Nicaragua en vivo. Música, noticias y programación local.
          </p>
        </header>

        <section className="radio-stations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {STATIONS.map((station) => {
            const isPlaying = playingId === station.id;
            return (
              <article
                key={station.id}
                className="radio-station-card"
                style={{
                  background: 'white',
                  borderRadius: 16,
                  border: `2px solid ${isPlaying ? station.color : '#e5e7eb'}`,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                  boxShadow: isPlaying ? `0 4px 20px ${station.color}33` : 'none',
                }}
              >
                {/* LIVE BADGE */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 12px',
                      background: station.color,
                      color: 'white',
                      borderRadius: 20,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    <span className="radio-live-dot" />
                    En vivo
                  </span>
                  <AudioVisualizer active={isPlaying} />
                </div>

                {/* STATION INFO */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: station.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 900,
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {station.freq.split(' ')[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', margin: '0 0 2px', lineHeight: 1.3 }}>
                      {station.name}
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, fontWeight: 500 }}>{station.slogan}</p>
                  </div>
                </div>

                {/* META */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ background: '#f3f4f6', padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                    {station.freq}
                  </span>
                  <span style={{ background: '#f3f4f6', padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                    {station.city}
                  </span>
                  <span style={{ background: '#f3f4f6', padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                    {station.genre}
                  </span>
                </div>

                {/* AUDIO ELEMENT (hidden) */}
                <audio
                  ref={(el) => { if (el) audioRefs.current[station.id] = el; }}
                  src={station.url}
                  onEnded={() => setPlayingId(null)}
                  onPause={() => setPlayingId((curr) => curr === station.id ? null : curr)}
                  preload="none"
                />

                {/* CONTROLS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
                  <button
                    onClick={() => isPlaying ? handlePause(station.id) : handlePlay(station.id)}
                    aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: station.color,
                      color: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {isPlaying ? <Pause size={22} /> : <Play size={22} />}
                  </button>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Volume2 size={16} color="#9ca3af" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isPlaying ? volume : 0.8}
                      onChange={(e) => handleVolume(station.id, parseFloat(e.target.value))}
                      style={{ flex: 1, accentColor: station.color }}
                      aria-label="Volumen"
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section style={{ marginTop: 64, textAlign: 'center', padding: '32px 24px', background: '#f3f4f6', borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#111827', marginBottom: 12 }}>
            ¿Tienes una emisora?
          </h2>
          <p style={{ color: '#6b7280', maxWidth: 500, margin: '0 auto 20px' }}>
            Si deseas que tu radio aparezca en esta lista, contáctanos y verificaremos tu señal de streaming.
          </p>
          <Link
            href="/contacto"
            style={{
              display: 'inline-block',
              padding: '12px 28px',
              background: '#dc2626',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            Contactar
          </Link>
        </section>
      </main>
    </ProLayout>
  );
}
