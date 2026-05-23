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
  { id: 'stereo', name: 'Estéreo', url: 'https://stream.zeno.fm/q1n2y3p4a5b6c', color: '#0ea5e9', genre: 'Música' },
  { id: 'juventud', name: 'Radio Juventud', url: 'https://stream.zeno.fm/r2s3t4u5v6w7x', color: '#16a34a', genre: 'Variada' },
  { id: 'carnaval', name: 'Carnaval FM', url: 'https://stream.zeno.fm/s3t4u5v6w7x8y', color: '#eab308', genre: 'Tropical' },
  { id: 'maranatha', name: 'Radio Maranatha', url: 'https://stream.zeno.fm/t4u5v6w7x8y9z', color: '#8b5cf6', genre: 'Cristiana' },
];

export default function RadioPlayer() {
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
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
    if (activeStation === stationId && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => { setError('No se pudo reproducir'); setIsPlaying(false); });
        setIsPlaying(true);
      }
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsLoading(true);
    setActiveStation(stationId);
    const audio = new Audio(station.url);
    audio.volume = isMuted ? 0 : 0.7;
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;
    audio.onplaying = () => { setIsPlaying(true); setIsLoading(false); setError(null); };
    audio.onpause = () => setIsPlaying(false);
    audio.onerror = () => { setIsPlaying(false); setIsLoading(false); setError('Señal no disponible'); };
    audio.onstalled = () => setIsLoading(true);
    audio.play().catch(() => { setIsPlaying(false); setIsLoading(false); setError('Señal no disponible'); });
  }, [activeStation, isPlaying, isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (audioRef.current) audioRef.current.volume = next ? 0 : 0.7;
      return next;
    });
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; audioRef.current = null; }
    setActiveStation(null);
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
  }, []);

  const currentStation = STATIONS.find(s => s.id === activeStation);

  if (!mounted) {
    return (
      <div style={{ background: '#0f172a', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Radio size={14} color="#ef4444" />
          <span style={{ fontWeight: 700 }}>Radio</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0f172a', borderRadius: 14, padding: '12px 16px', color: '#fff', position: 'relative' }}>
      {/* Header compacto */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Radio size={14} color="#ef4444" />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.2px' }}>Radio en Vivo</span>
          <span className="radio-live-dot" />
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          {expanded ? 'Cerrar' : 'Ver emisoras'}
        </button>
      </div>

      {/* Controls compacto (si hay estación activa) */}
      {currentStation && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: currentStation.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isLoading ? <Loader2 size={14} color="#fff" style={{ animation: 'spin 1s linear infinite' }} /> : <Radio size={14} color="#fff" />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentStation.name}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>{currentStation.genre}</div>
          </div>
          <button onClick={() => togglePlay(currentStation.id)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: currentStation.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }} aria-label={isPlaying ? 'Pausar' : 'Reproducir'}>
            {isPlaying ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: 1 }} />}
          </button>
          <button onClick={toggleMute} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }} aria-label={isMuted ? 'Activar' : 'Silenciar'}>
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
          <button onClick={stop} style={{ fontSize: 10, color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>Detener</button>
        </div>
      )}

      {error && <div style={{ fontSize: 11, color: '#fca5a5', textAlign: 'center', marginBottom: 6 }}>{error}</div>}

      {/* Lista de estaciones (colapsable) */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {STATIONS.map(station => {
            const isActive = activeStation === station.id;
            return (
              <button
                key={station.id}
                onClick={() => togglePlay(station.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 8, border: 'none',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: '#fff', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive && isPlaying ? station.color : '#475569', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{station.name}</span>
                <span style={{ fontSize: 10, color: '#64748b' }}>{station.genre}</span>
                {isActive && isLoading ? <Loader2 size={12} color={station.color} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={12} color={isActive ? station.color : '#475569'} style={{ marginLeft: 2 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

