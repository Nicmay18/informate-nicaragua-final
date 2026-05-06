'use client';
import { useState, useRef, useEffect } from 'react';

const EMISORAS = [
  { name: 'Radio Nicaragua',     url: 'https://stream.zeno.fm/yn65fsaurfhvv' },
  { name: 'La Nueva Radio Ya',   url: 'https://stream.zeno.fm/0r0xa792kwzuv' },
  { name: 'Radio Corporación',   url: 'https://stream.zeno.fm/pns44q8hv08uv' },
  { name: 'La Cariñosa FM',      url: 'https://stream.zeno.fm/ephqa2snp1zuv' },
  { name: 'Radio Sandino',       url: 'https://stream.zeno.fm/dn4mqg0sv08uv' },
];

const BAR_H = [4, 8, 12, 9, 5, 11, 7, 14, 6, 10];

export default function StickyRadio() {
  const [selected,  setSelected]  = useState(0);
  const [playing,   setPlaying]   = useState(false);
  const [volume,    setVolume]    = useState(0.8);
  const [muted,     setMuted]     = useState(false);
  const [open,      setOpen]      = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem('radio-dismissed')) setDismissed(true);
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  function startStation(idx: number) {
    setSelected(idx); setOpen(false);
    if (!audioRef.current) return;
    audioRef.current.src = EMISORAS[idx].url;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  function toggle() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().then(() => setPlaying(true)).catch(() => {}); }
  }

  function dismiss() {
    audioRef.current?.pause(); setPlaying(false); setDismissed(true);
    sessionStorage.setItem('radio-dismissed', '1');
  }

  if (dismissed) return null;

  return (
    <>
      <style>{`
        .sticky-radio { display:flex; }
        @media(max-width:768px){ .sticky-radio { display:none !important; } }
        .sradio-vol { display:flex; align-items:center; gap:8px; }
        @media(max-width:900px){ .sradio-vol { display:none !important; } }
        @keyframes wvbar { from{transform:scaleY(0.3)} to{transform:scaleY(1.6)} }
      `}</style>

      <div className="sticky-radio" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: 'linear-gradient(90deg,#0a0f1e,#0f172a)',
        borderTop: '2px solid rgba(140,29,24,0.5)',
        boxShadow: '0 -6px 32px rgba(0,0,0,0.5)',
        alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 14, width: '100%', height: 58 }}>

          {/* Icon + label + waveform */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <i className="fas fa-radio" style={{ color: playing ? '#ef4444' : '#475569', fontSize: 18, transition: 'color 0.3s' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Radio en Vivo</span>
            {playing && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16 }}>
                {BAR_H.map((h, i) => (
                  <span key={i} style={{ display: 'inline-block', width: 3, height: h, background: '#ef4444', borderRadius: 1.5, animation: `wvbar ${0.4 + (i % 3) * 0.15}s ease-in-out ${i * 0.04}s infinite alternate` }} />
                ))}
              </div>
            )}
          </div>

          {/* Play/Pause */}
          <button onClick={toggle} style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
            background: playing ? '#ef4444' : '#8c1d18', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            boxShadow: playing ? '0 0 0 4px rgba(239,68,68,0.2)' : 'none', transition: 'all 0.2s',
          }}>
            <i className={`fas fa-${playing ? 'pause' : 'play'}`} style={{ marginLeft: playing ? 0 : 2 }} />
          </button>

          {/* Station picker */}
          <div style={{ position: 'relative', flex: 1, minWidth: 0, maxWidth: 260 }}>
            <button onClick={() => setOpen(!open)} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#e2e8f0', borderRadius: 8, padding: '7px 12px', cursor: 'pointer',
              width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 8, fontSize: 13, fontWeight: 500,
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {EMISORAS[selected].name}
              </span>
              <i className="fas fa-chevron-up" style={{ fontSize: 10, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </button>
            {open && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
                background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, overflow: 'hidden', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', zIndex: 201,
              }}>
                {EMISORAS.map((e, i) => (
                  <button key={i} onClick={() => startStation(i)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '11px 14px', background: selected === i ? 'rgba(140,29,24,0.3)' : 'none',
                    border: 'none', color: selected === i ? '#fca5a5' : '#94a3b8',
                    cursor: 'pointer', fontSize: 13, fontWeight: selected === i ? 700 : 400, textAlign: 'left',
                    borderBottom: i < EMISORAS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <i className="fas fa-radio" style={{ fontSize: 12 }} /> {e.name}
                    {selected === i && playing && <i className="fas fa-volume-high" style={{ marginLeft: 'auto', color: '#ef4444', fontSize: 12 }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Now playing label */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {playing ? `▶ Escuchando: ${EMISORAS[selected].name}` : 'Haz clic para escuchar en vivo'}
            </div>
          </div>

          {/* Volume control (desktop) */}
          <div className="sradio-vol">
            <button onClick={() => setMuted(m => !m)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 15, padding: '4px' }}>
              <i className={`fas fa-volume-${muted ? 'xmark' : 'high'}`} />
            </button>
            <input type="range" min="0" max="1" step="0.05"
              value={muted ? 0 : volume}
              onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
              style={{ width: 80, accentColor: '#ef4444', cursor: 'pointer' }}
            />
          </div>

          {/* Dismiss */}
          <button onClick={dismiss} title="Cerrar" style={{ flexShrink: 0, background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 16, padding: '6px', borderRadius: 6 }}>
            <i className="fas fa-xmark" />
          </button>
        </div>

        <audio ref={audioRef} src={EMISORAS[selected].url} preload="none" />
      </div>
    </>
  );
}
