'use client';

import { useState, useCallback, useEffect } from 'react';
import { stripHtml } from '@/lib/formateo';

interface AudioButtonProps {
  titulo: string;
  resumen: string;
  contenido: string;
  articleId: string;
}

/**
 * Botón de lectura de voz usando la Web Speech API nativa del navegador.
 * NO realiza llamadas al servidor — todo el procesamiento es local.
 * Se carga vía lazy/Suspense para no bloquear el render inicial.
 */
export default function AudioButton({ titulo, resumen, contenido, articleId }: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fullText = `${titulo}. ${resumen ? resumen + '. ' : ''}${stripHtml(contenido)}`.slice(0, 4500);

  // Cleanup al desmontar o cambiar artículo
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [articleId]);

  const playNativeTTS = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'es-NI';
    utterance.rate = 1;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      setErrorMsg('No se pudo reproducir el audio. Intentá con otro navegador.');
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  }, [fullText]);

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
      setErrorMsg('');
    } else {
      setErrorMsg('');
      const ok = playNativeTTS();
      if (!ok) {
        setErrorMsg('Tu navegador no soporta lectura de voz. Usá Chrome, Safari o Edge.');
      }
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
          style={{ ...btnBase, backgroundColor: '#991b1b', color: '#fff' }}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir audio'}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
          )}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111827' }}>
            {isPlaying ? 'Reproduciendo...' : 'Escuchar noticia en voz alta'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
            {isPlaying ? 'Usando síntesis de voz del navegador' : 'Voz generada localmente — sin costos de servidor'}
          </p>
        </div>
        {isPlaying && (
          <button
            onClick={() => { window.speechSynthesis?.cancel(); setIsPlaying(false); }}
            style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#4b5563', background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, cursor: 'pointer' }}
          >
            Detener
          </button>
        )}
      </div>
      {errorMsg && (
        <p style={{ margin: '12px 0 0', fontSize: 12, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
          {errorMsg}
        </p>
      )}
    </div>
  );
}
