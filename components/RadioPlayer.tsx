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
    <div style={{ width: '100%', backgroundColor: '#0f172a', borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', border: '1px solid #334155', fontFamily: 'system-ui, sans-serif', userSelect: 'none' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" playsInline style={{ display: 'none' }} />

      {/* ===== HEADER ===== */}
      <div style={{ backgroundColor: '#1e293b', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Radio size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '0.5px' }}>RADIO EN VIVO</span>
          {currentStation && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>
              <span style={{ width: 6, height: 6, backgroundColor: '#ef4444', borderRadius: '50%' }} />
              EN VIVO
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {isExpanded ? 'Ocultar' : 'Ver todo'}
        </button>
      </div>

      {/* ===== NOW PLAYING ===== */}
      {currentStation && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(30,41,59,0.5)', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleStop}
              style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, backgroundColor: currentStation.color, border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}
            >
              <Pause size={18} fill="currentColor" />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{currentStation.name}</p>
              <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>{currentStation.genre}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button onClick={toggleMute} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range" min="0" max="1" step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{ width: 64, height: 4, accentColor: '#fff' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===== ERROR ===== */}
      {error && (
        <div style={{ padding: '8px 16px', backgroundColor: 'rgba(127,29,29,0.3)', borderBottom: '1px solid #7f1d1d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f87171', fontSize: 12 }}>{error}</span>
            {currentStation && (
              <button onClick={() => window.open(currentStation.website, '_blank', 'noopener,noreferrer')} style={{ color: '#fca5a5', fontSize: 12, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                Web
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== LOADING ===== */}
      {loading && !playing && (
        <div style={{ padding: '8px 16px', backgroundColor: 'rgba(30,41,59,0.3)', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 12 }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Conectando con {STATIONS.find(s => s.id === loading)?.name}...
          </div>
        </div>
      )}

      {/* ===== STATION LIST ===== */}
      {isExpanded && (
        <div style={{ maxHeight: 256, overflowY: 'auto' }}>
          {STATIONS.map((station) => {
            const isPlaying = playing === station.id;
            const isLoading = loading === station.id;
            const hasStream = !!station.streamUrl;
            return (
              <button
                key={station.id}
                onClick={() => playStation(station)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', textAlign: 'left', backgroundColor: isPlaying ? '#334155' : 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
              >
                <div style={{ flexShrink: 0 }}>
                  {isLoading ? (
                    <Loader2 size={16} style={{ color: '#94a3b8', animation: 'spin 1s linear infinite' }} />
                  ) : isPlaying ? (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', backgroundColor: station.color }}>
                      <Pause size={12} fill="currentColor" />
                    </div>
                  ) : !hasStream ? (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <ExternalLink size={12} />
                    </div>
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <Play size={12} fill="currentColor" style={{ marginLeft: 2 }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#fff', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{station.name}</span>
                    {!hasStream && (
                      <span style={{ flexShrink: 0, padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, backgroundColor: '#334155', color: '#94a3b8' }}>WEB</span>
                    )}
                  </div>
                  <span style={{ color: '#64748b', fontSize: 12 }}>{station.genre}</span>
                </div>
                {isPlaying && (
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: station.color }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ===== COLLAPSED MINI VIEW ===== */}
      {!isExpanded && (
        <div style={{ padding: '8px 12px', display: 'flex', gap: 6, overflowX: 'auto' }}>
          {STATIONS.map((station) => {
            const isPlaying = playing === station.id;
            const shortName = station.name.replace('Radio ', 'R.').replace('La ', '').split(' ')[0];
            return (
              <button
                key={station.id}
                onClick={() => playStation(station)}
                title={station.name}
                style={{
                  flexShrink: 0,
                  padding: '4px 10px',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  maxWidth: 80,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  backgroundColor: isPlaying ? station.color : '#1e293b',
                  color: isPlaying ? '#fff' : '#94a3b8',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {shortName}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}