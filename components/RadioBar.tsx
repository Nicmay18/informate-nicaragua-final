'use client';
import { useState, useRef, useEffect } from 'react';

// Radios de Nicaragua - Streams verificados Mayo 2026
const EMISORAS = [
  { name: 'Radio Nicaragua',     url: 'https://stream.zeno.fm/yn65fsaurfhvv',         genre: 'Noticias / Oficial' },
  { name: 'La Nueva Radio Ya',   url: 'https://stream.zeno.fm/0r0xa792kwzuv',        genre: 'Noticias / Popular' },
  { name: 'Radio Corporación',   url: 'https://stream.zeno.fm/pns44q8hv08uv',        genre: 'Noticias / Opinión' },
  { name: 'La Cariñosa FM',      url: 'https://stream.zeno.fm/ephqa2snp1zuv',        genre: 'Romántica / Baladas' },
  { name: 'Radio Sandino',       url: 'https://stream.zeno.fm/dn4mqg0sv08uv',        genre: 'Variedad / Cultura' },
  { name: 'Stereo Romance',      url: 'https://stream.zeno.fm/nt3ngdhcry8uv',        genre: 'Romántica' },
];

export default function RadioBar() {
  const [selected, setSelected] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  function play(idx: number) {
    setLoading(true);
    setError(null);
    setSelected(idx);
    setOpen(false);
    if (audioRef.current) {
      audioRef.current.src = EMISORAS[idx].url;
      const timeout = setTimeout(() => {
        setLoading(false);
        setError(`${EMISORAS[idx].name} no responde. Probá otra emisora.`);
        setPlaying(false);
      }, 10000);
      audioRef.current.play()
        .then(() => {
          clearTimeout(timeout);
          setPlaying(true);
          setLoading(false);
        })
        .catch((e) => {
          clearTimeout(timeout);
          setPlaying(false);
          setLoading(false);
          setError(`No se pudo reproducir ${EMISORAS[idx].name}`);
          console.error('Radio play error:', e);
        });
    }
  }

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      if (selected === null) { setOpen(true); return; }
      setLoading(true);
      audioRef.current.play()
        .then(() => {
          setPlaying(true);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          setError('Error al reproducir');
        });
    }
  }

  return (
    <div style={{ background: '#f8f4ef', borderBottom: '1px solid #e2d9d0', fontSize: 13 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', flexWrap: 'wrap' }}>
        {/* EN VIVO badge */}
        <span style={{ background: playing ? '#22c55e' : '#e53e3e', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, transition: 'background 0.3s' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: playing ? 'pulse 1.2s infinite' : 'none' }} />
          {playing ? 'ON AIR' : 'EN VIVO'}
        </span>

        {/* Play button with loading state */}
        <button onClick={toggle} aria-label={playing ? 'Pausar' : 'Reproducir'}
          style={{ width: 34, height: 34, borderRadius: '50%', background: loading ? '#9ca3af' : '#8c1d18', border: 'none', color: '#fff', cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, transition: 'all 0.2s' }}
          disabled={loading}>
          {loading ? <i className="fas fa-spinner fa-spin" /> : <i className={`fas ${playing ? 'fa-pause' : 'fa-play'}`} style={{ marginLeft: playing ? 0 : 2 }} />}
        </button>

        {/* Station selector */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setOpen(!open)}
            style={{ background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#4a3728', fontWeight: 600, fontSize: 13, padding: '6px 10px', borderRadius: 6, border: '1px solid #e2d9d0' }}>
            <i className="fas fa-radio" style={{ color: '#8c1d18' }} />
            {selected !== null ? EMISORAS[selected].name : 'Seleccionar emisora...'}
            <i className="fas fa-chevron-down" style={{ fontSize: 10, color: '#8c7b70', marginLeft: 4 }} />
          </button>
          {open && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, background: '#fff', border: '1px solid #e2d9d0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, minWidth: 260, overflow: 'hidden' }}>
              {EMISORAS.map((e, i) => (
                <button key={i} onClick={() => play(i)}
                  style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '10px 14px', textAlign: 'left', background: selected === i ? '#fef2f2' : 'none', border: 'none', borderBottom: i < EMISORAS.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: selected === i ? '#e53e3e' : '#374151', fontWeight: selected === i ? 600 : 500 }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{e.genre}</div>
                  </div>
                  {selected === i && playing && <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 600 }}>▶ Reproduciendo</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Now playing info */}
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 4 }}>
          <span style={{ color: '#4a3728', fontSize: 13, fontWeight: 600 }}>
            {selected !== null ? EMISORAS[selected].name : 'Selecciona una emisora'}
          </span>
          {selected !== null && (
            <span style={{ color: '#9d8b7e', fontSize: 11 }}>{EMISORAS[selected].genre}</span>
          )}
        </div>

        {/* Volume control */}
        {selected !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <i className={volume === 0 ? 'fas fa-volume-mute' : volume < 0.5 ? 'fas fa-volume-down' : 'fas fa-volume-up'} style={{ color: '#8c7b70', fontSize: 12 }} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{ width: 80, height: 4, cursor: 'pointer' }}
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{ position: 'absolute', top: '100%', left: 24, right: 24, marginTop: 4, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '6px 12px', color: '#dc2626', fontSize: 12 }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: 6 }} />{error}
            <button onClick={() => setError(null)} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12 }}><i className="fas fa-times" /></button>
          </div>
        )}

        <audio ref={audioRef} style={{ display: 'none' }} />
        <style>{`
          @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
          input[type="range"] { -webkit-appearance: none; background: #e2d9d0; border-radius: 2px; }
          input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; background: #8c1d18; border-radius: 50%; cursor: pointer; }
        `}</style>
      </div>
    </div>
  );
}
