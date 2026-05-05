'use client';
import { useState, useRef } from 'react';

const EMISORAS = [
  { name: 'Radio Futura',    url: 'https://radiofutura.stream.laut.fm/radiofutura' },
  { name: 'Radio Clásica',   url: 'https://cloudstream2030.conectarhosting.com/8038/stream' },
  { name: 'Radio Nicaragua',  url: 'https://stream.zeno.fm/radionicaragua' },
];

export default function RadioBar() {
  const [selected, setSelected] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function play(idx: number) {
    setSelected(idx);
    setOpen(false);
    if (audioRef.current) {
      audioRef.current.src = EMISORAS[idx].url;
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      if (selected === null) { setOpen(true); return; }
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  return (
    <div style={{ background: '#f8f4ef', borderBottom: '1px solid #e2d9d0', fontSize: 13 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '7px 24px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        {/* EN VIVO badge */}
        <span style={{ background: '#e53e3e', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1.2s infinite' }} />
          EN VIVO
        </span>

        {/* Play button */}
        <button onClick={toggle} aria-label={playing ? 'Pausar' : 'Reproducir'}
          style={{ width: 32, height: 32, borderRadius: '50%', background: '#8c1d18', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12 }}>
          <i className={`fas ${playing ? 'fa-pause' : 'fa-play'}`} style={{ marginLeft: playing ? 0 : 2 }} />
        </button>

        {/* Station selector */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setOpen(!open)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#4a3728', fontWeight: 500, fontSize: 13, padding: '4px 8px', borderRadius: 6 }}>
            {selected !== null ? EMISORAS[selected].name : 'Seleccionar emisora...'}
            <i className="fas fa-chevron-down" style={{ fontSize: 10, color: '#8c7b70' }} />
          </button>
          {open && (
            <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #e2d9d0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 200, overflow: 'hidden' }}>
              {EMISORAS.map((e, i) => (
                <button key={i} onClick={() => play(i)}
                  style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: selected === i ? '#fef2f2' : 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: selected === i ? '#e53e3e' : '#374151', fontWeight: selected === i ? 600 : 400 }}>
                  <i className="fas fa-radio" style={{ marginRight: 8, color: '#8c7b70' }} />{e.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <span style={{ color: '#9d8b7e', marginLeft: 8 }}>
          {selected !== null ? `Escuchando: ${EMISORAS[selected].name}` : 'Selecciona una emisora'}
        </span>

        <audio ref={audioRef} style={{ display: 'none' }} />
        <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }`}</style>
      </div>
    </div>
  );
}
