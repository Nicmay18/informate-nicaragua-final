'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, Loader2 } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  url: string;
  color: string;
  genre: string;
}

const STATIONS: Station[] = [
  { id: 'nicaragua1', name: 'Radio Nicaragua', url: 'https://stream.zeno.fm/0r0xaa9fsv8uv', color: '#dc2626', genre: 'Noticias' },
  { id: ' stereo', name: 'Estéreo', url: 'https://stream.zeno.fm/q1n2y3p4a5b6c', color: '#0ea5e9', genre: 'Música' },
  { id: 'juventud', name: 'Radio Juventud', url: 'https://stream.zeno.fm/r2s3t4u5v6w7x', color: '#16a34a', genre: 'Variada' },
  { id: 'carnaval', name: 'Carnaval FM', url: 'https://stream.zeno.fm/s3t4u5v6w7x8y', color: '#eab308', genre: 'Tropical' },
  { id: 'maranatha', name: 'Radio Maranatha', url: 'https://stream.zeno.fm/t4u5v6w7x8y9z', color: '#8b5cf6', genre: 'Cristiana' },
];

export default function RadioPlayer() {
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = useCallback((stationId: string) => {
    const station = STATIONS.find(s => s.id === stationId);
    if (!station) return;

    setError(null);

    // Same station toggle
    if (activeStation === stationId && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {
          setError('No se pudo reproducir');
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }
      return;
    }

    // New station
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    setIsLoading(true);
    setActiveStation(stationId);

    const audio = new Audio(station.url);
    audio.volume = isMuted ? 0 : volume;
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    audio.onplaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setError(null);
    };

    audio.onpause = () => {
      setIsPlaying(false);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      setIsLoading(false);
      setError('Señal no disponible');
    };

    audio.onstalled = () => {
      setIsLoading(true);
    };

    audio.play().catch(() => {
      setIsPlaying(false);
      setIsLoading(false);
      setError('Señal no disponible');
    });
  }, [activeStation, isPlaying, isMuted, volume]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.volume = next ? 0 : volume;
      }
      return next;
    });
  }, [volume]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setIsMuted(v === 0);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setActiveStation(null);
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
  }, []);

  const currentStation = STATIONS.find(s => s.id === activeStation);

  if (!mounted) {
    return (
      <div className="sidebar-widget" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: 16, padding: 24, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Radio size={18} color="#ef4444" />
          <span style={{ fontSize: 16, fontWeight: 700 }}>Radio en Vivo</span>
        </div>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className="sidebar-widget" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: 16, padding: 24, color: '#fff', position: 'relative', overflow: 'hidden' }}>
      {/* Glow effect */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 140, height: 140, background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Radio size={18} color="#ef4444" />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>Radio Nicaragua Informate</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#22c55e', background: 'rgba(34,197,94,0.15)', padding: '4px 10px', borderRadius: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s ease-in-out infinite' }} />
          EN VIVO
        </div>
      </div>

      {/* Now Playing */}
      {currentStation && (
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 16, position: 'relative', zIndex: 1, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: currentStation.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {isLoading ? (
                <Loader2 size={18} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Radio size={18} color="#fff" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentStation.name}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{currentStation.genre} · Nicaragua</div>
            </div>
          </div>

          {/* Visualizer bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 24, marginBottom: 12, justifyContent: 'center', opacity: isPlaying ? 1 : 0.3 }}>
            {[...Array(12)].map((_, i) => (
              <span
                key={i}
                style={{
                  width: 3,
                  height: isPlaying ? `${8 + Math.random() * 16}px` : '4px',
                  background: currentStation.color,
                  borderRadius: 2,
                  transition: 'height 0.3s ease',
                  animation: isPlaying ? `barbounce ${0.4 + (i % 4) * 0.1}s ease-in-out ${i * 0.05}s infinite alternate` : 'none',
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => togglePlay(currentStation.id)}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: currentStation.color, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
              aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
            </button>

            <button
              onClick={toggleMute}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.1)', color: '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{ flex: 1, accentColor: currentStation.color, cursor: 'pointer', height: 4 }}
              aria-label="Volumen"
            />

            <button
              onClick={stop}
              style={{
                fontSize: 11, fontWeight: 600, color: '#94a3b8',
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '4px 8px', borderRadius: 6,
              }}
            >
              Detener
            </button>
          </div>

          {error && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#fca5a5', textAlign: 'center' }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Station List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', zIndex: 1 }}>
        {STATIONS.map(station => {
          const isActive = activeStation === station.id;
          return (
            <button
              key={station.id}
              onClick={() => togglePlay(station.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid transparent',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                borderColor: isActive ? `${station.color}40` : 'transparent',
                color: '#fff',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isActive && isPlaying ? station.color : '#475569',
                flexShrink: 0,
                boxShadow: isActive && isPlaying ? `0 0 8px ${station.color}80` : 'none',
              }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{station.name}</span>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{station.genre}</span>
              <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isActive && isLoading ? (
                  <Loader2 size={14} color={station.color} style={{ animation: 'spin 1s linear infinite' }} />
                ) : isActive && isPlaying ? (
                  <Pause size={14} color={station.color} />
                ) : (
                  <Play size={14} color="#64748b" style={{ marginLeft: 2 }} />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

