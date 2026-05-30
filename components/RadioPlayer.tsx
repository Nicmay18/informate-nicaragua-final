'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Pause, Play, ExternalLink, WifiOff } from 'lucide-react';
import ClockFace from './ClockFace';

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

/* Ecualizador de barras animadas estilo BoomBox */
function Equalizer({ color, active }: { color: string; active: boolean }) {
  const bars = [0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.45, 0.75, 0.55, 0.85, 0.5, 0.7];
  return (
    <div className="flex items-end gap-[2px] h-8">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full"
          style={{
            backgroundColor: color,
            height: active ? `${h * 100}%` : '12%',
            opacity: active ? 0.9 : 0.25,
            transition: 'height 0.25s ease',
            animation: active ? `eq-bar 0.8s ease-in-out ${i * 0.06}s infinite alternate` : 'none',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes eq-bar {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

/* Logo circular con iniciales */
function StationLogo({ station, size = 80 }: { station: Station; size?: number }) {
  const initials = station.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-white shadow-lg"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${station.color}, ${station.color}88)`,
        fontSize: size * 0.35,
        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
      }}
    >
      {initials}
    </div>
  );
}

export default function RadioPlayer() {
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
    if (audio) { audio.pause(); audio.src = ''; audio.load(); }
    setPlaying(null); setLoading(null); setError(null);
    clearMediaSession(); releaseWakeLock();
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
    <div className="w-full rounded-2xl overflow-hidden shadow-xl font-sans" style={{ background: '#0f172a' }}>
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" playsInline style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />

      {/* === HEADER === */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockFace size={32} />
          <div>
            <h3 className="text-white font-bold text-xs tracking-wider">RADIO EN VIVO</h3>
            <p className="text-slate-400 text-[9px] uppercase tracking-widest font-medium">Nicaragua</p>
          </div>
        </div>
        {currentStation && (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            En vivo
          </span>
        )}
      </div>

      {/* === NOW PLAYING SCREEN === */}
      {currentStation ? (
        <div className="mx-3 mb-3 rounded-xl p-3 relative overflow-hidden" style={{ background: `linear-gradient(145deg, ${currentStation.color}22, ${currentStation.color}08)` }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 blur-2xl" style={{ background: currentStation.color }} />

          <div className="relative flex items-center gap-3">
            <StationLogo station={currentStation} size={48} />
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-black text-sm truncate">{currentStation.name}</h4>
              <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: currentStation.color, color: '#fff' }}>
                {currentStation.genre}
              </span>
              <div className="mt-1 scale-75 origin-left">
                <Equalizer color={currentStation.color} active={!loading} />
              </div>
            </div>
            <button
              onClick={handleStop}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-90 shrink-0"
              style={{ background: `linear-gradient(135deg, ${currentStation.color}, ${currentStation.color}dd)` }}
              aria-label="Pausar"
            >
              <Pause size={18} fill="currentColor" />
            </button>
          </div>

          {/* Volumen */}
          <div className="flex items-center gap-2 mt-2">
            <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors">
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range" min="0" max="1" step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, ${currentStation.color} 0%, ${currentStation.color} ${(isMuted ? 0 : volume) * 100}%, #334155 ${(isMuted ? 0 : volume) * 100}%, #334155 100%)` }}
              aria-label="Volumen"
            />
          </div>
        </div>
      ) : (
        /* === IDLE SCREEN === */
        <div className="mx-3 mb-3 rounded-xl p-4 text-center" style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)' }}>
          <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <Play size={20} className="text-white ml-0.5" />
          </div>
          <h4 className="text-white font-bold text-sm mb-0.5">Seleccioná una emisora</h4>
          <p className="text-slate-400 text-[10px]">Radio de Nicaragua</p>
        </div>
      )}

      {/* === LOADING === */}
      {loading && !playing && (
        <div className="mx-4 mb-4 rounded-xl p-3 flex items-center gap-3" style={{ background: '#1e293b' }}>
          <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm text-slate-300">Conectando con {STATIONS.find(s => s.id === loading)?.name}...</span>
        </div>
      )}

      {/* === ERROR === */}
      {error && (
        <div className="mx-4 mb-4 rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}>
          <WifiOff size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-300 font-medium">{error}</p>
            {(() => {
              const name = error.split(' no responde')[0] || error.split('No se pudo reproducir ')[1]?.split('.')[0];
              const st = name ? STATIONS.find(s => s.name === name) : null;
              return st ? (
                <button
                  onClick={() => window.open(st.website, '_blank', 'noopener,noreferrer')}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <ExternalLink size={12} /> Escuchar en web oficial
                </button>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* === STATION GRID === */}
      <div className="px-3 pb-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">Emisoras</p>
        <div className="grid grid-cols-4 gap-2">
          {STATIONS.map((station) => {
            const isActive = playing === station.id;
            const isLoading = loading === station.id;
            const hasStream = !!station.streamUrl;
            return (
              <button
                key={station.id}
                onClick={() => hasStream && playStation(station)}
                disabled={isLoading}
                className="flex flex-col items-center gap-1 group min-w-0"
                title={station.name}
              >
                <div
                  className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all shrink-0"
                  style={{
                    background: isActive ? station.color : 'linear-gradient(135deg, #1e293b, #0f172a)',
                    boxShadow: isActive ? `0 0 12px ${station.color}55` : '0 1px 4px rgba(0,0,0,0.3)',
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    border: isActive ? `2px solid ${station.color}` : '2px solid transparent',
                  }}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="font-black text-white text-xs" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                      {station.name.charAt(0)}
                    </span>
                  )}
                  {!hasStream && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-600 text-[6px] text-white font-bold flex items-center justify-center">W</span>
                  )}
                </div>
                <span className={`text-[8px] font-semibold text-center leading-tight truncate w-full ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {station.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
