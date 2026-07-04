'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { stripHtml } from '@/lib/formateo';

interface AudioButtonProps {
  titulo: string;
  resumen: string;
  contenido: string;
  articleId: string;
}

/**
 * Botón de audio/TTS con fallback a Web Speech API nativa.
 * Se carga vía lazy/Suspense para no bloquear el render inicial.
 */
export default function AudioButton({ titulo, resumen, contenido, articleId }: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fullText = `${titulo}. ${resumen ? resumen + '. ' : ''}${stripHtml(contenido)}`.slice(0, 4500);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
      setIsLoading(false);
      setProgress(0);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [articleId]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current.src = '';
      }
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setProgress(0);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const playNativeTTS = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'es-NI';
    utterance.rate = 1;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;

    utterance.onstart = () => { setIsPlaying(true); setIsLoading(false); };
    utterance.onend = () => { setIsPlaying(false); setProgress(0); };
    utterance.onerror = () => { setIsPlaying(false); setIsLoading(false); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  };

  const play = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setErrorMsg('');
    // Solo TTS nativo del navegador — nunca llama al backend /api/audio
    // (el endpoint fue desactivado para ahorrar invocaciones de Vercel Functions)
    const ok = playNativeTTS();
    setIsLoading(false);
    if (!ok) {
      setErrorMsg('Tu navegador no soporta lectura de voz. Probá con Chrome, Safari o Edge.');
      setTimeout(() => setErrorMsg(''), 6000);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      play();
    }
  };

  const btnBase: React.CSSProperties = {
    width: 48, height: 48, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', cursor: 'pointer', flexShrink: 0,
  };

  return (
    <div style={{ margin: '24px 0', padding: 20, backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={togglePlay}
          disabled={isLoading}
          style={{ ...btnBase, backgroundColor: isLoading ? '#9ca3af' : '#991b1b', color: '#fff', cursor: isLoading ? 'wait' : 'pointer' }}
          aria-label={isPlaying ? 'Pausar' : isLoading ? 'Cargando' : 'Reproducir audio'}
        >
          {isLoading ? (
            <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
          )}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111827' }}>
            {isLoading ? 'Generando audio profesional...' : isPlaying ? 'Reproduciendo noticia' : 'Escuchar noticia en voz profesional'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
            {isLoading ? 'Esto puede tomar unos segundos' : 'Voz generada con inteligencia artificial'}
          </p>
        </div>
        {isPlaying && (
          <button onClick={stop} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#4b5563', backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, cursor: 'pointer' }} aria-label="Detener reproducción">
            Detener
          </button>
        )}
      </div>
      {isPlaying && (
        <div style={{ marginTop: 12, height: 4, backgroundColor: '#e5e5e5', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', backgroundColor: '#991b1b', borderRadius: 2, transition: 'width 0.3s ease', width: `${progress}%` }} />
        </div>
      )}
      {errorMsg && (
        <p style={{ margin: '12px 0 0', fontSize: 12, color: '#b91c1c', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
          {errorMsg}
        </p>
      )}
    </div>
  );
}
