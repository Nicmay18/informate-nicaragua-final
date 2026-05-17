'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Radio, Play, Pause, ChevronUp, Volume2, VolumeX, X, SkipForward, Heart, Signal, Music } from 'lucide-react';

const EMISORAS = [
  { id: 'buenisima', name: 'La Buenísima', slogan: '¡La que te gusta!', url: 'https://stream.zeno.fm/0r0v8t1bwv8uv', genre: 'Ranchera / Grupera / Cumbia', color: '#ef4444', freq: '93.1 FM', city: 'Managua' },
  { id: 'pachanguera', name: 'La Pachanguera', slogan: '¡Pura pachanga!', url: 'https://stream.zeno.fm/3xk5v5t1bwv8uv', genre: 'Tropical / Salsa / Latin Hits', color: '#f59e0b', freq: '95.1 FM', city: 'Managua' },
  { id: 'vivafm', name: 'Viva FM', slogan: 'La música que llevas dentro', url: 'https://stream.zeno.fm/78a5h5mfgg8uv', genre: 'Pop / Hits / Latino', color: '#10b981', freq: '98.3 FM', city: 'Managua' },
  { id: 'futura', name: 'Radio Futura', slogan: 'La emisora líder de Nicaragua', url: 'https://stream.zeno.fm/2r8w8t1bwv8uv', genre: 'Urbano / Reggaetón / Electrónica', color: '#8b5cf6', freq: '91.3 FM', city: 'Managua' },
  { id: 'maranatha', name: 'Radio Maranatha', slogan: 'Música que edifica tu vida', url: 'https://stream2.305stream.com/proxy/client032?mp=/stream', genre: 'Cristiana / Alabanza', color: '#3b82f6', freq: '103.5 FM', city: 'Managua' },
  { id: 'fiesta-latina', name: 'Fiesta Latina', slogan: '¡La fiesta no para!', url: 'https://stream.zeno.fm/5t0x8t1bwv8uv', genre: 'Salsa / Merengue / Bachata / Reggaetón', color: '#ec4899', freq: '89.1 FM', city: 'Managua' },
  { id: 'clasica', name: 'Clásica 101.9', slogan: 'Tu tiempo, tu música', url: 'https://stream.zeno.fm/6u1x8t1bwv8uv', genre: 'Oldies / Clásicos / Instrumental', color: '#06b6d4', freq: '101.9 FM', city: 'Managua' },
];

const BAR_H = [4, 8, 12, 9, 5, 11, 7, 14, 6, 10, 8, 5, 12, 7, 9];

export default function StickyRadio() {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const errorCountRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('radio-favorites');
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      try { localStorage.setItem('radio-favorites', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tryNextStation = useCallback((currentIdx: number) => {
    errorCountRef.current += 1;
    if (errorCountRef.current >= EMISORAS.length) {
      setError('⚠️ Ninguna emisora disponible. Verifica tu conexión e intenta más tarde.');
      setLoading(false);
      setPlaying(false);
      return;
    }
    const next = (currentIdx + 1) % EMISORAS.length;
    setSelected(next);
    setError(null);
    if (!audioRef.current) return;
    audioRef.current.src = EMISORAS[next].url;
    audioRef.current.load();
    audioRef.current.play()
      .then(() => { setPlaying(true); setLoading(false); setError(null); })
      .catch(() => { tryNextStation(next); });
  }, []);

  function handleAudioError() { tryNextStation(selected); }

  function startStation(idx: number) {
    errorCountRef.current = 0;
    setSelected(idx); setOpen(false); setError(null); setLoading(true);
    if (!audioRef.current) return;
    audioRef.current.src = EMISORAS[idx].url;
    audioRef.current.load();
    audioRef.current.play()
      .then(() => { setPlaying(true); setLoading(false); })
      .catch(() => { tryNextStation(idx); });
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      errorCountRef.current = 0;
      setLoading(true);
      if (!audioRef.current.src) {
        audioRef.current.src = EMISORAS[selected].url;
        audioRef.current.load();
      }
      audioRef.current.play()
        .then(() => { setPlaying(true); setLoading(false); setError(null); })
        .catch(() => { tryNextStation(selected); });
    }
  }

  function skipNext() { errorCountRef.current = 0; startStation((selected + 1) % EMISORAS.length); }
  function skipPrev() { errorCountRef.current = 0; startStation((selected - 1 + EMISORAS.length) % EMISORAS.length); }

  function dismiss() {
    audioRef.current?.pause();
    setPlaying(false); setLoading(false); setDismissed(true);
    try { sessionStorage.setItem('radio-dismissed', '1'); } catch {}
  }

  useEffect(() => {
    try { if (sessionStorage.getItem('radio-dismissed') === '1') setDismissed(true); } catch {}
  }, []);

  if (dismissed) return <div style={{ height: 64, width: '100%' }} aria-hidden />;

  const current = EMISORAS[selected];
  const displayList = showFavOnly ? EMISORAS.filter(e => favorites.includes(e.id)) : EMISORAS;

  return (
    <>
      <div ref={containerRef} className="sticky-radio" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: 'linear-gradient(135deg, #0a0f1e 0%, #1a1f35 50%, #0f172a 100%)',
        borderTop: `2px solid ${current.color}40`,
        boxShadow: `0 -8px 40px ${current.color}30, 0 -2px 10px rgba(0,0,0,0.5)`,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <div className="sr-inner" style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, width: '100%', height: 64, position: 'relative' }}>

          {/* Logo + indicador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: playing ? `${current.color}20` : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${playing ? current.color : 'rgba(255,255,255,0.1)'}`, transition: 'all 0.3s ease' }}>
              <Radio size={18} style={{ color: playing ? current.color : '#64748b', transition: 'color 0.3s' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span className="sr-label" style={{ fontSize: 10, fontWeight: 700, color: playing ? current.color : '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', transition: 'color 0.3s' }}>
                {playing ? '● EN VIVO' : 'RADIO'}
              </span>
              {playing && (
                <div className="sr-wave" style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 12 }}>
                  {BAR_H.map((h, i) => (
                    <span key={i} style={{ display: 'inline-block', width: 2.5, height: h, background: current.color, borderRadius: 1, animation: `wvbar ${0.4 + (i % 4) * 0.12}s ease-in-out ${i * 0.03}s infinite alternate`, opacity: 0.8 }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Play/Pause */}
          <button onClick={togglePlay} aria-label={playing ? 'Pausar radio' : 'Reproducir radio'} disabled={loading} className={playing ? 'play-btn-pulse' : ''}
            style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: loading ? 'wait' : 'pointer', flexShrink: 0, background: playing ? `linear-gradient(135deg, ${current.color}, ${current.color}dd)` : loading ? '#92400e' : 'linear-gradient(135deg, #8c1d18, #a52a2a)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: playing ? `0 0 20px ${current.color}50, 0 0 0 4px ${current.color}20` : '0 4px 15px rgba(0,0,0,0.3)', transition: 'all 0.3s ease', position: 'relative' }}>
            {loading ? <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite', fontSize: 18 }}>⟳</span>
              : playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
          </button>

          {/* Navegación */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button onClick={skipPrev} aria-label="Emisora anterior" style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '6px', borderRadius: 6, transition: 'all 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')} onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
              <SkipForward size={14} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <button onClick={skipNext} aria-label="Siguiente emisora" style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '6px', borderRadius: 6, transition: 'all 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')} onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
              <SkipForward size={14} />
            </button>
          </div>

          {/* Selector */}
          <div style={{ position: 'relative', flex: 1, minWidth: 0, maxWidth: 320 }}>
            <button onClick={() => setOpen(!open)} aria-label="Seleccionar emisora" aria-expanded={open}
              style={{ background: open ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${open ? current.color + '60' : 'rgba(255,255,255,0.08)'}`, color: '#e2e8f0', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: current.color, flexShrink: 0, boxShadow: `0 0 8px ${current.color}60` }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.name}</span>
                <span style={{ fontSize: 10, color: '#64748b', fontWeight: 400, flexShrink: 0 }}>{current.freq}</span>
              </div>
              <ChevronUp size={14} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s ease', color: '#64748b' }} />
            </button>

            {open && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 10px)', left: 0, right: 0, background: 'linear-gradient(180deg, #1e293b, #0f172a)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden', boxShadow: `0 -12px 40px rgba(0,0,0,0.6), 0 0 0 1px ${current.color}20`, zIndex: 201, maxHeight: 420, overflowY: 'auto', animation: 'slideUp 0.25s ease-out' }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{displayList.length} Emisoras</span>
                  <button onClick={() => setShowFavOnly(!showFavOnly)} style={{ background: showFavOnly ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', border: 'none', color: showFavOnly ? '#fca5a5' : '#64748b', fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}>
                    <Heart size={12} fill={showFavOnly ? '#fca5a5' : 'none'} />Favoritas
                  </button>
                </div>
                {displayList.length === 0 && (
                  <div style={{ padding: 30, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    <Heart size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />No tienes emisoras favoritas
                  </div>
                )}
                {displayList.map((emisora, i) => {
                  const idx = EMISORAS.indexOf(emisora);
                  const isActive = selected === idx;
                  const isFav = favorites.includes(emisora.id);
                  return (
                    <button key={emisora.id} onClick={() => startStation(idx)} className={`station-card ${isActive ? 'active' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', background: isActive ? `${emisora.color}15` : 'none', border: 'none', color: isActive ? emisora.color : '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 700 : 400, textAlign: 'left', borderBottom: i < displayList.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', position: 'relative' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${emisora.color}20`, border: `2px solid ${isActive ? emisora.color : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                        <Music size={14} style={{ color: emisora.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: isActive ? 700 : 600, color: isActive ? '#f1f5f9' : '#e2e8f0', fontSize: 13 }}>{emisora.name}</span>
                          {isActive && playing && <Signal size={12} style={{ color: emisora.color, animation: 'pulse 1s infinite' }} />}
                        </div>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{emisora.slogan}</span>
                        <span style={{ fontSize: 10, color: '#475569' }}>{emisora.freq} • {emisora.genre}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(emisora.id); }} aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                        style={{ background: 'none', border: 'none', color: isFav ? '#ef4444' : '#475569', cursor: 'pointer', padding: '6px', borderRadius: 6, transition: 'all 0.2s', flexShrink: 0 }} onMouseEnter={e => { if (!isFav) e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={e => { if (!isFav) e.currentTarget.style.color = '#475569'; }}>
                        <Heart size={16} fill={isFav ? '#ef4444' : 'none'} />
                      </button>
                      {isActive && playing && (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16, flexShrink: 0 }}>
                          {[4, 8, 6, 10, 5].map((h, j) => (
                            <span key={j} style={{ display: 'inline-block', width: 2, height: h, background: emisora.color, borderRadius: 1, animation: `wvbar ${0.5 + j * 0.1}s ease-in-out infinite alternate` }} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 12, color: playing ? current.color : '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: playing ? 600 : 400, transition: 'all 0.3s' }}>
              {loading ? `⏳ Conectando ${current.name} ${current.freq}...` : playing ? `▶ ${current.name} — ${current.slogan}` : error ? `⚠️ ${error}` : 'Haz clic en ▶ para escuchar en vivo'}
            </div>
            {!isMobile && (
              <div style={{ fontSize: 10, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {current.genre} • {current.city} • Nicaragua Informate Radio
              </div>
            )}
          </div>

          {/* Volumen */}
          <div className="sradio-vol" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setMuted(m => !m)} aria-label={muted ? 'Activar sonido' : 'Silenciar'}
              style={{ background: 'none', border: 'none', color: muted ? '#ef4444' : '#64748b', cursor: 'pointer', fontSize: 15, padding: '6px', borderRadius: 6, transition: 'all 0.2s' }}>
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div style={{ width: 90, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, position: 'relative', cursor: 'pointer' }}>
              <div style={{ width: `${(muted ? 0 : volume) * 100}%`, height: '100%', background: muted ? '#ef4444' : current.color, borderRadius: 2, transition: 'width 0.1s' }} />
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                aria-label="Volumen de la radio" style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer' }} />
            </div>
            <span style={{ fontSize: 10, color: '#475569', minWidth: 28, textAlign: 'right' }}>{Math.round((muted ? 0 : volume) * 100)}%</span>
          </div>

          {/* Cerrar */}
          <button onClick={dismiss} aria-label="Cerrar radio"
            style={{ flexShrink: 0, background: 'none', border: 'none', color: '#334155', cursor: 'pointer', padding: '8px', borderRadius: 8, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.background = 'none'; }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="radio-error-toast">
            <span style={{ opacity: 0.9 }}>{error}</span>
            <button onClick={() => setError(null)} aria-label="Cerrar mensaje" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: 'auto', padding: 0, display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <audio ref={audioRef} preload="none" crossOrigin="anonymous" onError={handleAudioError} onEnded={() => { setPlaying(false); setError('La transmisión se interrumpió. Reintentando...'); setTimeout(() => tryNextStation(selected), 2000); }} />
      </div>
    </>
  );
}
