'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Radio, Volume2, VolumeX, Play, Pause, ExternalLink, Signal, WifiOff } from 'lucide-react';

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

/* Visualizador de ondas animado */
function AudioVisualizer({ color, isPlaying }: { color: string; isPlaying: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full transition-all duration-300"
          style={{
            backgroundColor: color,
            height: isPlaying ? '100%' : '20%',
            animation: isPlaying ? `eq-bounce 0.6s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
            opacity: isPlaying ? 1 : 0.3,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes eq-bounce {
          0% { height: 20%; }
          100% { height: 100%; }
        }
      `}</style>
    </div>
  );
}

export default function RadioPlayer() {
  const [expanded, setExpanded] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    navigator.mediaSession.setActionHandler('play', () => playStation(station));
    navigator.mediaSession.setActionHandler('pause', () => { audioRef.current?.pause(); setPlaying(null); });
    navigator.mediaSession.setActionHandler('stop', () => handleStop());
  }, []);

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
    if (!station.streamUrl) { window.open(station.website, '_blank', 'noopener,noreferrer'); return; }
    if (playing === station.id) { handleStop(); return; }

    const audio = audioRef.current;
    if (!audio) { setError('Error interno: reproductor no disponible.'); setLoading(null); return; }

    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; audioRef.current.load(); }
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

    setLoading(station.id);

    const onError = () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      setError(`No se pudo reproducir ${station.name}. El stream no responde.`);
      setPlaying(null); setLoading(null);
      clearMediaSession(); releaseWakeLock(); cleanup();
    };

    const onCanPlay = () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      audio.play().then(() => {
        setPlaying(station.id); setLoading(null);
        setupMediaSession(station); requestWakeLock();
      }).catch(() => { setError(`No se pudo iniciar ${station.name}.`); setPlaying(null); setLoading(null); });
      cleanup();
    };

    const cleanup = () => { audio.removeEventListener('error', onError); audio.removeEventListener('canplay', onCanPlay); audio.removeEventListener('canplaythrough', onCanPlay); };

    audio.addEventListener('error', onError);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('canplaythrough', onCanPlay);

    audio.src = station.streamUrl;
    audio.volume = isMuted ? 0 : volume;
    audio.muted = isMuted;

    loadTimeoutRef.current = setTimeout(() => {
      setError(`${station.name} no responde. Intentá por la web.`); setPlaying(null); setLoading(null); audio.pause(); cleanup();
    }, 8000);

    audio.load();
  }, [playing, isMuted, volume, handleStop, setupMediaSession, requestWakeLock, clearMediaSession, releaseWakeLock]);

  useEffect(() => { return () => handleStop(); }, [handleStop]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) { audioRef.current.muted = !isMuted; }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume); setIsMuted(newVolume === 0);
    if (audioRef.current) { audioRef.current.volume = newVolume; audioRef.current.muted = newVolume === 0; }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden font-sans">
      {/* Audio element */}
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" playsInline style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />

      {/* Header */}
      <div className="bg-slate-900 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Radio size={18} className="text-red-500" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wide">RADIO EN VIVO</h3>
            <p className="text-slate-400 text-[10px] uppercase tracking-wider">Nicaragua</p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-white transition-colors text-xs font-medium">
          {expanded ? 'Ocultar' : 'Ver emisoras'}
        </button>
      </div>

      {/* Now Playing Card */}
      {currentStation && (
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <button
              onClick={handleStop}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 shrink-0"
              style={{ backgroundColor: currentStation.color }}
              aria-label="Pausar"
            >
              <Pause size={20} fill="currentColor" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wide" style={{ backgroundColor: currentStation.color }}>
                  {currentStation.genre}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-red-500 font-semibold uppercase">
                  <Signal size={10} /> En vivo
                </span>
              </div>
              <h4 className="text-slate-900 font-bold text-base truncate">{currentStation.name}</h4>
              <div className="flex items-center justify-between mt-2">
                <AudioVisualizer color={currentStation.color} isPlaying={true} />
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="text-slate-500 hover:text-slate-800 transition-colors">
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                    aria-label="Volumen"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && !playing && (
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          <span className="text-sm text-slate-600">Conectando con {STATIONS.find(s => s.id === loading)?.name}...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-3">
          <WifiOff size={16} className="text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
            {(() => {
              const name = error.split(' no responde')[0] || error.split('No se pudo reproducir ')[1]?.split('.')[0];
              const st = name ? STATIONS.find(s => s.name === name) : null;
              return st ? (
                <button
                  onClick={() => window.open(st.website, '_blank', 'noopener,noreferrer')}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 underline underline-offset-2"
                >
                  <ExternalLink size={12} /> Escuchar en web oficial
                </button>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* Station List */}
      {expanded && (
        <div className="max-h-[320px] overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emisoras disponibles</div>
          {STATIONS.map((station) => {
            const isPlaying = playing === station.id;
            const isLoading = loading === station.id;
            const hasStream = !!station.streamUrl;

            return (
              <div
                key={station.id}
                onClick={() => hasStream && playStation(station)}
                className={`
                  group flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-l-[3px]
                  ${isPlaying ? 'bg-slate-50 border-l-current' : 'border-l-transparent hover:bg-slate-50'}
                `}
                style={isPlaying ? { borderLeftColor: station.color } : undefined}
              >
                {/* Play button / Status */}
                <div className="shrink-0">
                  {isLoading ? (
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                    </div>
                  ) : isPlaying ? (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: station.color }}>
                      <Pause size={16} fill="currentColor" />
                    </div>
                  ) : !hasStream ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); window.open(station.website, '_blank', 'noopener,noreferrer'); }}
                      className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                      title="Visitar web"
                    >
                      <ExternalLink size={14} />
                    </button>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-700 group-hover:bg-slate-200 transition-all">
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 truncate">{station.name}</span>
                    {!hasStream && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-600 uppercase">Web</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-500">{station.genre}</span>
                    {isPlaying && (
                      <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: station.color }}>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: station.color }} />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: station.color }} />
                        </span>
                        Reproduciendo
                      </span>
                    )}
                  </div>
                </div>

                {/* Color dot */}
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: station.color }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-center">
        <p className="text-[10px] text-slate-400">Seleccioná una emisora para comenzar</p>
      </div>
    </div>
  );
}
