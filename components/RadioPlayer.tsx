'use client';

import { useState, useRef, useEffect } from 'react';
import { Radio, Play, Pause, Volume2, VolumeX, ExternalLink } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  streamUrl: string;
  website: string;
  color: string;
  genre: string;
}

/* Streams confirmados + Zeno.fm + sin stream */
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

  const currentStation = STATIONS.find(s => s.id === playing);

  /* MediaSession — controles en pantalla de bloqueo */
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
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
    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('stop', null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStation]);

  /* Wake Lock — mantiene procesador activo con pantalla apagada */
  const requestWakeLock = async () => {
    if (!('wakeLock' in navigator) || wakeLockRef.current) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      wakeLockRef.current.addEventListener('release', () => { wakeLockRef.current = null; });
    } catch { /* noop */ }
  };

  const releaseWakeLock = () => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  };

  /* Cleanup */
  useEffect(() => {
    return () => { handleStop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupMediaSession = (station: Station) => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: station.name,
      artist: station.genre,
      album: 'Radio Nicaragua',
      artwork: [{ src: '/logo-ni.png', sizes: '512x512', type: 'image/png' }],
    });
    navigator.mediaSession.playbackState = 'playing';
  };

  const clearMediaSession = () => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'paused';
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setPlaying(null);
    setLoading(null);
    clearMediaSession();
    releaseWakeLock();
  };

  const playStation = (station: Station) => {
    setError(null);

    if (!station.streamUrl) {
      window.open(station.website, '_blank', 'noopener,noreferrer');
      return;
    }

    if (playing === station.id) {
      handleStop();
      return;
    }

    setLoading(station.id);

    let audio = audioRef.current;
    if (!audio) {
      audio = document.createElement('audio');
      audio.preload = 'none';
      audioRef.current = audio;
    }

    audio.oncanplay = null;
    audio.onerror = null;
    audio.onplaying = null;

    audio.pause();
    audio.src = station.streamUrl;
    audio.volume = isMuted ? 0 : volume;

    audio.oncanplay = () => {
      audio?.play().then(() => {
        setPlaying(station.id);
        setLoading(null);
        setupMediaSession(station);
        requestWakeLock();
      }).catch(() => {
        setError(`No se pudo iniciar ${station.name}.`);
        setPlaying(null);
        setLoading(null);
      });
    };

    audio.onerror = () => {
      setError(`${station.name} no disponible.`);
      setPlaying(null);
      setLoading(null);
      clearMediaSession();
      releaseWakeLock();
    };

    audio.onplaying = () => {
      setPlaying(station.id);
      setLoading(null);
    };

    audio.load();
  };

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

      {/* Now Playing con controles */}
      {currentStation && (
        <div className="radio-now-playing">
          <div className="radio-station-info">
            <span className="radio-playing-dot" style={{ backgroundColor: currentStation.color }} />
            <span className="radio-playing-name">{currentStation.name}</span>
            <span className="radio-playing-genre">{currentStation.genre}</span>
          </div>
          <div className="radio-controls">
            <button onClick={handleStop} className="radio-control-btn" aria-label="Pausar">
              <Pause size={16} />
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
      {error && <div className="radio-error">{error}</div>}

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
                    <ExternalLink size={14} color="#fff" />
                  ) : isPlaying ? (
                    <Pause size={14} color="#fff" />
                  ) : (
                    <Play size={14} color="#fff" />
                  )}
                </button>
                <span className="radio-station-dot" style={{ backgroundColor: station.color }} />
                <span className="radio-station-name">{station.name}</span>
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
