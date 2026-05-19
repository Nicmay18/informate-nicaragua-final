'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, ChevronDown, ChevronUp } from 'lucide-react';

interface AudioPlayerProps {
  src?: string;
  title?: string;
  autoPlay?: boolean;
}

export default function AudioPlayer({ src, title = 'Audio', autoPlay = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const handleTimeUpdate = () => {
      const duration = audioEl.duration || 1;
      const currentTime = audioEl.currentTime;
      setProgress((currentTime / duration) * 100);
    };

    audioEl.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audioEl.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!src) return null;

  return (
    <>
      <audio ref={audioRef} src={src} autoPlay={autoPlay} />
      
      {/* Mini Player */}
      <div
        style={{
          position: 'fixed',
          bottom: isExpanded ? 'calc(60px + env(safe-area-inset-bottom))' : 'calc(60px + env(safe-area-inset-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: isExpanded ? '16px' : '999px',
          padding: isExpanded ? '16px' : '12px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9998,
          transition: 'all 0.3s ease',
          maxWidth: isExpanded ? '90%' : 'auto',
          width: isExpanded ? '100%' : 'auto',
        }}
      >
        <button
          onClick={togglePlay}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--brand)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        {isExpanded && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {title}
              </div>
              <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--brand)', width: `${progress}%`, transition: 'width 0.1s linear' }} />
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: '4px' }}
            >
              <ChevronDown size={16} />
            </button>
          </>
        )}

        {!isExpanded && (
          <>
            <span style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap' }}>{title}</span>
            <button
              onClick={() => setIsExpanded(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: '4px' }}
            >
              <ChevronUp size={16} />
            </button>
          </>
        )}
      </div>
    </>
  );
}
