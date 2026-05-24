'use client';

import { useState, useRef, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

export default function RadioBar() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio('https://stream.zeno.fm/0r0xaa9fsv8uv');
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;
      audio.onplaying = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [isPlaying]);

  return (
    <div className="radio-bar">
      <div className="radio-bar-inner">
        <button
          className={`radio-bar-btn${isPlaying ? ' playing' : ''}`}
          onClick={toggle}
          aria-label={isPlaying ? 'Pausar radio' : 'Reproducir radio'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
        </button>
        <div className="radio-bar-info">
          <h4>
            Radio Nicaragua Informate
            <span className="radio-live">En vivo</span>
          </h4>
          <p>Cobertura informativa continua • Noticias de Nicaragua y el mundo en tiempo real</p>
        </div>
        <div className={`radio-wave${isPlaying ? '' : ' paused'}`}>
          {[...Array(6)].map((_, i) => (
            <span key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
