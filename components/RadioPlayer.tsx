'use client';

import { useState, useRef, useEffect } from 'react';
import { Radio, Play, Pause, ExternalLink } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  website: string;
  streamUrl: string;
  color: string;
  genre: string;
}

/*
  URLs de streaming verificadas o marcadas con TODO.
  Para verificar: F12 → Network → Media en sitio de la emisora.
*/
const STATIONS: Station[] = [
  { id: 'radioya', name: 'Radio Ya', website: 'https://www.radioya.com.ni/', streamUrl: 'https://streaming.radioya.com.ni:8000/live', color: '#dc2626', genre: 'Noticias' },
  { id: 'vivafm', name: 'Viva FM', website: 'https://www.vivafm.com.ni/', streamUrl: 'https://streaming.vivafm.com.ni:8000/live', color: '#0ea5e9', genre: 'Música' },
  { id: 'buenisima', name: 'La Buenísima', website: 'https://www.labuenisimanicaragua.com/', streamUrl: '', color: '#f97316', genre: 'Tropical' },
  { id: 'pachanguera', name: 'La Pachanguera', website: 'https://www.lapachanguera.com.ni/', streamUrl: '', color: '#ec4899', genre: 'Variedad' },
  { id: 'futura', name: 'Radio Futura', website: 'https://www.radiofutura.com.ni/', streamUrl: '', color: '#06b6d4', genre: 'Juvenil' },
  { id: 'clasica', name: 'Radio Clásica', website: 'https://www.radioclasica.com.ni/', streamUrl: '', color: '#8b5cf6', genre: 'Clásica' },
  { id: 'yes', name: 'Radio Yes', website: 'https://www.radioyes.com.ni/', streamUrl: '', color: '#ef4444', genre: 'Pop' },
  { id: 'fiestalatina', name: 'Fiesta Latina', website: 'https://fiestalatina.com.ni/', streamUrl: '', color: '#16a34a', genre: 'Tropical' },
];

export default function RadioPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  /* Inicializar MediaSession para controles en pantalla de bloqueo */
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current && !audioRef.current.paused) return;
        const station = STATIONS.find(s => s.id === playing);
        if (station) playStation(station);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
        setPlaying(null);
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        setPlaying(null);
        setLoading(null);
      });
    }
    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
      }
    };
  }, [playing]);

  /* Solicitar Wake Lock cuando se reproduce (mantiene procesador activo) */
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator && !wakeLockRef.current) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      } catch { /* wake lock puede fallar en algunos navegadores */ }
    }
  };

  const releaseWakeLock = () => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  };

  /* Cleanup al desmontar */
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      releaseWakeLock();
    };
  }, []);

  const setupMediaSession = (station: Station) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.name,
        artist: station.genre,
        album: 'Radio Nicaragua',
        artwork: [
          { src: '/logo-ni.png', sizes: '512x512', type: 'image/png' },
        ],
      });
      navigator.mediaSession.playbackState = 'playing';
    }
  };

  const clearMediaSession = () => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'paused';
    }
  };

  const playStation = async (station: Station) => {
    setError(null);

    if (playing === station.id) {
      audioRef.current?.pause();
      setPlaying(null);
      clearMediaSession();
      releaseWakeLock();
      return;
    }

    if (!station.streamUrl) {
      setError(`${station.name}: streaming no disponible. Abrí el sitio web.`);
      setPlaying(null);
      return;
    }

    setLoading(station.id);

    /* Crear o reutilizar elemento <audio> persistente (mejor que new Audio() para background) */
    let audio = audioRef.current;
    if (!audio) {
      audio = document.createElement('audio');
      audio.preload = 'none';
      audioRef.current = audio;
    }

    /* Limpiar handlers anteriores */
    audio.oncanplay = null;
    audio.onerror = null;
    audio.onplaying = null;
    audio.onended = null;

    audio.pause();
    audio.src = station.streamUrl;
    audio.volume = 0.8;

    /* Configurar handlers nuevos */
    audio.oncanplay = () => {
      audio?.play().then(() => {
        setPlaying(station.id);
        setLoading(null);
        setupMediaSession(station);
        requestWakeLock();
      }).catch(() => {
        setError(`No se pudo iniciar ${station.name}. Intentá de nuevo.`);
        setPlaying(null);
        setLoading(null);
      });
    };

    audio.onerror = () => {
      setError(`${station.name} no disponible. La emisora puede estar offline.`);
      setPlaying(null);
      setLoading(null);
      clearMediaSession();
      releaseWakeLock();
    };

    audio.onplaying = () => {
      setPlaying(station.id);
      setLoading(null);
    };

    /* Cargar stream */
    audio.load();
  };

  const handlePause = () => {
    audioRef.current?.pause();
    setPlaying(null);
    clearMediaSession();
    releaseWakeLock();
  };

  return (
    <div className="radio-player">
      {/* Elemento audio oculto — persistente para background playback */}
      <div style={{ position: 'absolute', left: -9999, width: 0, height: 0, overflow: 'hidden' }}>
        <audio ref={(el) => { if (el && !audioRef.current) audioRef.current = el; }} preload="none" />
      </div>

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

      {/* Now playing bar */}
      {playing && (
        <div className="radio-now-playing">
          <div className="radio-station-info">
            <span className="radio-playing-dot" style={{ backgroundColor: STATIONS.find(s => s.id === playing)?.color }} />
            <span className="radio-playing-name">{STATIONS.find(s => s.id === playing)?.name}</span>
          </div>
          <button onClick={handlePause} className="radio-control-btn" aria-label="Pausar">
            <Pause size={16} />
          </button>
        </div>
      )}

      {error && <div className="radio-error">{error}</div>}

      {expanded && (
        <div className="radio-stations-list">
          {STATIONS.map(station => {
            const isPlaying = playing === station.id;
            const isLoading = loading === station.id;
            return (
              <div key={station.id} className="radio-station-item">
                <button
                  onClick={() => playStation(station)}
                  className={`radio-play-btn${isLoading ? ' is-loading' : ''}`}
                  aria-label={isPlaying ? `Pausar ${station.name}` : `Reproducir ${station.name}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="radio-spinner" />
                  ) : isPlaying ? (
                    <Pause size={14} color="#fff" />
                  ) : (
                    <Play size={14} color="#fff" />
                  )}
                </button>
                <span className="radio-station-dot" style={{ backgroundColor: station.color }} />
                <span className="radio-station-name">{station.name}</span>
                <span className="radio-station-genre">{station.genre}</span>
                <a href={station.website} target="_blank" rel="noopener noreferrer" className="radio-website-link" aria-label={`Visitar sitio de ${station.name}`}>
                  <ExternalLink size={12} />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
