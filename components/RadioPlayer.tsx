'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Radio, Play, Pause, Volume2, VolumeX, ExternalLink, Loader2 } from 'lucide-react';

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
  const [playing, setPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStation = STATIONS.find(s => s.id === playing);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
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
    releaseWakeLock();
  }, [releaseWakeLock]);

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

    const audio = audioRef.current;
    if (!audio) {
      setError('Error: reproductor no disponible');
      setLoading(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
    }
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

    setLoading(station.id);

    const onError = () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      setError(`${station.name} no responde`);
      setPlaying(null);
      setLoading(null);
      releaseWakeLock();
      cleanup();
    };

    const onCanPlay = () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      audio.play().then(() => {
        setPlaying(station.id);
        setLoading(null);
        if ('wakeLock' in navigator) {
          navigator.wakeLock.request('screen').then(w => { wakeLockRef.current = w; }).catch(() => {});
        }
      }).catch(() => {
        setError(`No se pudo iniciar ${station.name}`);
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
      setError(`${station.name} no responde`);
      setPlaying(null);
      setLoading(null);
      audio.pause();
      cleanup();
    }, 8000);

    audio.load();
  }, [playing, isMuted, volume, handleStop, releaseWakeLock]);

  useEffect(() => { return () => handleStop(); }, [handleStop]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) audioRef.current.muted = !isMuted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setIsMuted(v === 0);
    if (audioRef.current) {
      audioRef.current.volume = v;
      audioRef.current.muted = v === 0;
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 font-sans select-none">
      {/* Audio element */}
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" playsInline className="hidden" />

      {/* ===== HEADER ===== */}
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-red-500" />
          <span className="text-white font-bold text-sm tracking-wide">RADIO EN VIVO</span>
          {currentStation && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              EN VIVO
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-white text-xs font-medium transition-colors"
        >
          {isExpanded ? 'Ocultar' : 'Ver todo'}
        </button>
      </div>

      {/* ===== NOW PLAYING (siempre visible si hay emisora) ===== */}
      {currentStation && (
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700">
          <div className="flex items-center gap-3">
            {/* Botón Play/Pause grande */}
            <button
              onClick={handleStop}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg active:scale-95 transition-transform"
              style={{ backgroundColor: currentStation.color }}
            >
              <Pause size={18} fill="currentColor" />
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{currentStation.name}</p>
              <p className="text-slate-400 text-xs">{currentStation.genre}</p>
            </div>

            {/* Volumen */}
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors">
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ===== ERROR ===== */}
      {error && (
        <div className="px-4 py-2 bg-red-900/30 border-b border-red-800">
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-xs">{error}</span>
            {currentStation && (
              <button
                onClick={() => window.open(currentStation.website, '_blank', 'noopener,noreferrer')}
                className="text-red-300 text-xs underline hover:text-red-200"
              >
                Web
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== LOADING ===== */}
      {loading && !playing && (
        <div className="px-4 py-2 bg-slate-800/30 border-b border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Loader2 size={14} className="animate-spin" />
            Conectando con {STATIONS.find(s => s.id === loading)?.name}...
          </div>
        </div>
      )}

      {/* ===== STATION LIST ===== */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto">
          {STATIONS.map((station) => {
            const isPlaying = playing === station.id;
            const isLoading = loading === station.id;
            const hasStream = !!station.streamUrl;

            return (
              <button
                key={station.id}
                onClick={() => playStation(station)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                  ${isPlaying ? 'bg-slate-700' : 'hover:bg-slate-800'}
                `}
              >
                {/* Play/Pause/Link icon */}
                <div className="shrink-0">
                  {isLoading ? (
                    <Loader2 size={16} className="text-slate-400 animate-spin" />
                  ) : isPlaying ? (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: station.color }}>
                      <Pause size={12} fill="currentColor" />
                    </div>
                  ) : !hasStream ? (
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                      <ExternalLink size={12} />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-white">
                      <Play size={12} fill="currentColor" className="ml-0.5" />
                    </div>
                  )}
                </div>

                {/* Station info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium truncate">{station.name}</span>
                    {!hasStream && (
                      <span className="shrink-0 px-1 py-0.5 rounded text-[9px] font-bold bg-slate-700 text-slate-400">WEB</span>
                    )}
                  </div>
                  <span className="text-slate-500 text-xs">{station.genre}</span>
                </div>

                {/* Status dot */}
                {isPlaying && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: station.color }} />
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: station.color }} />
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ===== COLLAPSED MINI VIEW (solo muestra emisoras como chips) ===== */}
      {!isExpanded && (
        <div className="px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {STATIONS.map((station) => {
            const isPlaying = playing === station.id;
            return (
              <button
                key={station.id}
                onClick={() => playStation(station)}
                className={`
                  shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${isPlaying
                    ? 'text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }
                `}
                style={isPlaying ? { backgroundColor: station.color } : undefined}
              >
                {station.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}