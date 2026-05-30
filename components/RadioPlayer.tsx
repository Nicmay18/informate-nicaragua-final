'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Radio, Volume2, VolumeX } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  streamUrl: string;
  website: string;
  color: string;
  genre: string;
}

const STATIONS: Station[] = [
  { id: 'fiestalatina', name: 'Fiesta Latina', streamUrl: 'https://radios.solumedia.com/6596/stream', website: 'https://fiestalatina.com.ni/', color: '#16a34a', genre: 'Tropical' },
  { id: 'radiotigre', name: 'Radio Tigre', streamUrl: 'https://stream-280.zeno.fm/muckqtmpfvatv', website: 'https://radiotigre.com.ni/', color: '#f59e0b', genre: 'Variedad' },
  { id: 'radioabc', name: 'Radio ABC', streamUrl: 'https://hoth.alonhosting.com:4205/stream', website: 'https://radioabc.com.ni/', color: '#8b5cf6', genre: 'Noticias' },
  { id: 'radiojinotega', name: 'Radio Jinotega', streamUrl: 'https://stream.pinedahost.com/radio/8060/radio', website: 'https://radiojinotega.com.ni/', color: '#ec4899', genre: 'Regional' },
  { id: 'vivafm', name: 'Viva FM', streamUrl: 'https://stream-284.zeno.fm/78a5h5mfgg8uv', website: 'https://www.vivafm.com.ni/', color: '#0ea5e9', genre: 'Música' },
  { id: 'radioya', name: 'Radio Ya', streamUrl: 'https://stream-281.zeno.fm/axr92qawesmtv', website: 'https://www.radioya.com.ni/', color: '#dc2626', genre: 'Noticias' },
  { id: 'radiofutura', name: 'Radio Futura', streamUrl: 'https://stream-291.zeno.fm/iwmolyow6tivv', website: 'https://www.radiofutura.com.ni/', color: '#06b6d4', genre: 'Juvenil' },
  { id: 'buenisima', name: 'La Buenísima', streamUrl: '', website: 'https://www.labuenisimanicaragua.com/', color: '#f97316', genre: 'Tropical' },
];

export default function RadioPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const IconPlay = () => <span style={{ fontSize: 12, lineHeight: 1 }}>&#9654;</span>;
  const IconPause = () => <span style={{ fontSize: 12, lineHeight: 1 }}>&#9208;</span>;
  const IconLink = () => <span style={{ fontSize: 12, lineHeight: 1 }}>&#8599;</span>;

  const currentStation = STATIONS.find(s => s.id === playing);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator) || wakeLockRef.current) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      wakeLockRef.current.addEventListener('release', () => { wakeLockRef.current = null; });
    } catch { /* noop */ }
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  const setupMediaSession = useCallback((station: Station) => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: station.name,
      artist: station.genre,
      album: 'Radio Nicaragua',
      artwork: [{ src: '/logo-ni.png', sizes: '512x512', type: 'image/png' }],
    });
    navigator.mediaSession.playbackState = 'playing';
    navigator.mediaSession.setActionHandler('play', () => {
      if (currentStation) playStation(currentStation);
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
      setPlaying(null);
    });
    navigator.mediaSession.setActionHandler('stop', () => {
      handleStop();
    });
  }, [currentStation]);

  const clearMediaSession = useCallback(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'paused';
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('stop', null);
  }, []);

  const handleStop = useCallback(() => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
      audio.load();
    }
    setPlaying(null);
    setLoading(null);
    setError(null);
    clearMediaSession();
    releaseWakeLock();
  }, [clearMediaSession, releaseWakeLock]);

  const playStation = useCallback((station: Station) => {
    setError(null);

    if (!station.streamUrl) {
      window.open(station.website, '_blank', 'noopener,noreferrer');
      return;
    }

    if (playing === station.id) {
      handleStop();
      return;
    }

    // Detener lo anterior completamente antes de cargar nuevo
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
    }
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

    setLoading(station.id);

    const audio = audioRef.current;
    if (!audio) {
      setError('Error interno: reproductor no disponible.');
      setLoading(null);
      return;
    }

    const onError = () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      console.error(`[Radio] Error ${audio.error?.code} en ${station.name}:`, audio.error);
      setError(`No se pudo reproducir ${station.name}. El stream no responde.`);
      setPlaying(null);
      setLoading(null);
      clearMediaSession();
      releaseWakeLock();
      cleanup();
    };

    const onCanPlay = () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      audio.play().then(() => {
        setPlaying(station.id);
        setLoading(null);
        setupMediaSession(station);
        requestWakeLock();
      }).catch(() => {
        setError(`No se pudo iniciar ${station.name}.`);
        setPlaying(null);
        setLoading(null);
      });
      cleanup();
    };

    const cleanup = () => {
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('canplaythrough', onCanPlay);
    };

    audio.addEventListener('error', onError);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('canplaythrough', onCanPlay);

    audio.src = station.streamUrl;
    audio.volume = isMuted ? 0 : volume;
    audio.muted = isMuted;

    loadTimeoutRef.current = setTimeout(() => {
      setError(`${station.name} no responde. Intentá por la web.`);
      setPlaying(null);
      setLoading(null);
      audio.pause();
      cleanup();
    }, 8000);

    audio.load();
  }, [playing, isMuted, volume, handleStop, setupMediaSession, requestWakeLock, clearMediaSession, releaseWakeLock]);

  useEffect(() => {
    return () => { handleStop(); };
  }, [handleStop]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      audioRef.current.muted = newVolume === 0;
    }
  };

  return (
    <div className="radio-player">
      {/* crossOrigin="anonymous" es CRÍTICO para streams de terceros */}
      <audio
        ref={audioRef}
        preload="none"
        crossOrigin="anonymous"
        playsInline
        style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
      />

      <div className="radio-header">
        <div className="radio-title-group">
          <Radio size={14} color="#ef4444" />
          <span className="radio-title">Radio Nicaragua</span>
          {playing && <span className="radio-live-dot" />}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="radio-toggle-btn"
          aria-label={expanded ? 'Cerrar emisoras' : 'Ver emisoras'}
        >
          {expanded ? 'Cerrar' : 'Ver emisoras'}
        </button>
      </div>

      {currentStation && (
        <div className="radio-now-playing">
          <div className="radio-station-info">
            <span className="radio-playing-dot" style={{ backgroundColor: currentStation.color }} />
            <span className="radio-playing-name">{currentStation.name}</span>
            <span className="radio-playing-genre">{currentStation.genre}</span>
          </div>
          <div className="radio-controls">
            <button onClick={handleStop} className="radio-control-btn" aria-label="Pausar">
              <IconPause />
            </button>
            <button onClick={toggleMute} className="radio-control-btn" aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}>
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="radio-volume"
              aria-label="Volumen"
            />
          </div>
        </div>
      )}

      {loading && !playing && <div className="radio-loading">Conectando...</div>}
      {error && (
        <div className="radio-error">
          {(() => {
            const stationId = error.includes(' no responde') ? error.split(' no responde')[0] : null;
            const st = stationId ? STATIONS.find(s => s.name === stationId) : null;
            if (st) {
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span>{st.name} no responde. Intentá por la web:</span>
                  <button
                    onClick={() => window.open(st.website, '_blank', 'noopener,noreferrer')}
                    className="radio-play-btn radio-play-btn--link"
                    style={{ fontSize: 11, padding: '4px 10px' }}
                  >
                    <IconLink /> Abrir
                  </button>
                </div>
              );
            }
            return <span>{error}</span>;
          })()}
        </div>
      )}

      {expanded && (
        <div className="radio-stations-list">
          {STATIONS.map(station => {
            const isPlaying = playing === station.id;
            const isLoading = loading === station.id;
            const hasStream = !!station.streamUrl;

            return (
              <div key={station.id} className="radio-station-item">
                <button
                  onClick={() => playStation(station)}
                  className={`radio-play-btn${isLoading ? ' is-loading' : ''} ${!hasStream ? ' radio-play-btn--link' : ''}`}
                  aria-label={!hasStream ? `Visitar ${station.name}` : isPlaying ? `Pausar ${station.name}` : `Reproducir ${station.name}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="radio-spinner" />
                  ) : !hasStream ? (
                    <IconLink />
                  ) : isPlaying ? (
                    <IconPause />
                  ) : (
                    <IconPlay />
                  )}
                </button>
                <span className="radio-station-dot" style={{ backgroundColor: station.color }} />
                <span className="radio-station-name">{station.name}</span>
                <span className="radio-station-sep">·</span>
                <span className="radio-station-genre">{station.genre}</span>
                {!hasStream && <span className="radio-station-badge">Web</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
