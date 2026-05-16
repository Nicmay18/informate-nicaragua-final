'use client';
// UTF-8 encoding fix
import { useState, useEffect, useRef, useCallback } from 'react';
import { Radio, Play, Pause, ChevronUp, Volume2, VolumeX, X, SkipForward } from 'lucide-react';

const EMISORAS = [
  { name: 'Radio Corporación',    url: 'https://sh2.radioonlinehd.com:8008/stream' },
  { name: 'Radio Maranatha',      url: 'https://stream2.305stream.com/proxy/client032?mp=/stream' },
  { name: 'Radio La Costeña',     url: 'https://stream.zeno.fm/3xk5v5t1bwv8uv' },
  { name: 'Radio Stereo Kiss',    url: 'https://stream.zeno.fm/0r0v8t1bwv8uv' },
  { name: 'Radio Camoapa',        url: 'https://centova.solucionstreaming.net/proxy/gcfminis/stream' },
  { name: 'Radio Ya Nicaragua',   url: 'https://stream.ecmdigital.net:8010/radioya' },
];

const BAR_H = [4, 8, 12, 9, 5, 11, 7, 14, 6, 10];

export default function StickyRadio() {
  const [selected,  setSelected]  = useState(0);
  const [playing,   setPlaying]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [volume,    setVolume]    = useState(0.8);
  const [muted,     setMuted]     = useState(false);
  const [open,      setOpen]      = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const errorCountRef = useRef(0);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const tryNextStation = useCallback((currentIdx: number) => {
    errorCountRef.current += 1;
    if (errorCountRef.current >= EMISORAS.length) {
      setError('Ninguna emisora disponible. Intenta más tarde.');
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

  function handleAudioError() {
    tryNextStation(selected);
  }

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

  function toggle() {
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

  function dismiss() {
    audioRef.current?.pause();
    setPlaying(false); setLoading(false); setDismissed(true);
    try { sessionStorage.setItem('radio-dismissed', '1'); } catch {}
  }

  if (dismissed) return <div style={{ height: 58, width: '100%' }} aria-hidden />;

  return (
    <>
      <style>{`
        .sticky-radio { display:flex; }
        .sradio-vol { display:flex; align-items:center; gap:8px; }
        @media(max-width:900px){ .sradio-vol { display:none !important; } }
        @keyframes wvbar { from{transform:scaleY(0.3)} to{transform:scaleY(1.6)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media(max-width:768px){
          .sticky-radio { bottom:56px !important; height:48px !important; }
          .sr-inner { height:48px !important; }
          .sr-label { display:none !important; }
          .sr-wave { display:none !important; }
        }
      `}</style>

      <div className="sticky-radio" style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:200,
        background:'linear-gradient(90deg,#0a0f1e,#0f172a)',
        borderTop:'2px solid rgba(140,29,24,0.5)',
        boxShadow:'0 -6px 32px rgba(0,0,0,0.5)',
        alignItems:'center',
      }}>
        <div className="sr-inner" style={{ maxWidth:1400, margin:'0 auto', padding:'0 20px', display:'flex', alignItems:'center', gap:14, width:'100%', height:58 }}>

          {/* Icon + label + waveform */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <Radio size={18} style={{ color: playing ? '#ef4444' : loading ? '#f59e0b' : '#475569', transition:'color 0.3s' }} />
            <span className="sr-label" style={{ fontSize:11, fontWeight:800, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em' }}>Radio en Vivo</span>
            {playing && (
              <div className="sr-wave" style={{ display:'flex', alignItems:'flex-end', gap:2, height:16 }}>
                {BAR_H.map((h, i) => (
                  <span key={i} style={{ display:'inline-block', width:3, height:h, background:'#ef4444', borderRadius:1.5, animation:`wvbar ${0.4+(i%3)*0.15}s ease-in-out ${i*0.04}s infinite alternate` }} />
                ))}
              </div>
            )}
          </div>

          {/* Play/Pause */}
          <button onClick={toggle} aria-label={playing ? 'Pausar radio' : 'Reproducir radio'} disabled={loading} style={{
            width:48, height:48, borderRadius:'50%', border:'none', cursor: loading ? 'wait' : 'pointer', flexShrink:0,
            background: playing ? '#ef4444' : loading ? '#92400e' : '#8c1d18', color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow: playing ? '0 0 0 4px rgba(239,68,68,0.2)' : 'none', transition:'all 0.2s',
          }}>
            {loading
              ? <span style={{ display:'inline-block', animation:'spin 0.8s linear infinite', fontSize:18 }}>⟳</span>
              : playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft:2 }} />}
          </button>

          {/* Skip button */}
          <button onClick={() => { errorCountRef.current = 0; startStation((selected+1) % EMISORAS.length); }}
            aria-label="Siguiente emisora" title="Siguiente emisora"
            style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', padding:'4px', flexShrink:0 }}>
            <SkipForward size={15} />
          </button>

          {/* Station picker */}
          <div style={{ position:'relative', flex:1, minWidth:0, maxWidth:260 }}>
            <button onClick={() => setOpen(!open)} aria-label="Seleccionar emisora" aria-expanded={open} style={{
              background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
              color:'#e2e8f0', borderRadius:8, padding:'7px 12px', cursor:'pointer',
              width:'100%', textAlign:'left', display:'flex', alignItems:'center',
              justifyContent:'space-between', gap:8, fontSize:13, fontWeight:500,
            }}>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {EMISORAS[selected].name}
              </span>
              <ChevronUp size={10} style={{ flexShrink:0, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition:'transform 0.2s' }} />
            </button>
            {open && (
              <div style={{
                position:'absolute', bottom:'calc(100% + 6px)', left:0, right:0,
                background:'#1e293b', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:10, overflow:'hidden', boxShadow:'0 -8px 32px rgba(0,0,0,0.5)', zIndex:201,
              }}>
                {EMISORAS.map((e, i) => (
                  <button key={i} onClick={() => startStation(i)} style={{
                    display:'flex', alignItems:'center', gap:10, width:'100%',
                    padding:'11px 14px', background: selected === i ? 'rgba(140,29,24,0.3)' : 'none',
                    border:'none', color: selected === i ? '#fca5a5' : '#94a3b8',
                    cursor:'pointer', fontSize:13, fontWeight: selected === i ? 700 : 400, textAlign:'left',
                    borderBottom: i < EMISORAS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <Radio size={12} /> {e.name}
                    {selected === i && playing && <Volume2 size={12} style={{ marginLeft:'auto', color:'#ef4444' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Now playing label */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {loading ? `Conectando: ${EMISORAS[selected].name}...` : playing ? `▶ Escuchando: ${EMISORAS[selected].name}` : error || 'Haz clic ▶ para escuchar en vivo'}
            </div>
          </div>

          {/* Volume control (desktop) */}
          <div className="sradio-vol">
            <button onClick={() => setMuted(m => !m)} aria-label={muted ? 'Activar sonido' : 'Silenciar'} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:15, padding:'4px' }}>
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input type="range" min="0" max="1" step="0.05"
              value={muted ? 0 : volume}
              onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
              aria-label="Volumen de la radio"
              style={{ width:80, accentColor:'#ef4444', cursor:'pointer' }}
            />
          </div>

          {/* Dismiss */}
          <button onClick={dismiss} aria-label="Cerrar radio" style={{ flexShrink:0, background:'none', border:'none', color:'#334155', cursor:'pointer', padding:'6px', borderRadius:6 }}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{
            position:'absolute', bottom:'calc(100% + 4px)', left:0, right:0,
            background:'#b91c1c', color:'#fff', padding:'8px 12px', fontSize:12,
            fontWeight:600, borderRadius:6, textAlign:'center', zIndex:202,
          }}>
            {error}
          </div>
        )}

        <audio ref={audioRef} preload="none" crossOrigin="anonymous" onError={handleAudioError} />
      </div>
    </>
  );
}
