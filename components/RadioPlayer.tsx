'use client';

import { useState, useRef, useEffect } from 'react';
import { Radio, Play, Pause, ExternalLink } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  website: string;
  streamUrl: string;
  color: string;
  genre: string;
}

/*
  URLs de streaming marcadas con TODO — deben verificarse contra
  los sitios oficiales de cada emisora (F12 → Network → Media).
  Si fallan, el reproductor muestra error y link al sitio web.
*/
const STATIONS: Station[] = [
  { id: 'radioya', name: 'Radio Ya', website: 'https://www.radioya.com.ni/', streamUrl: 'https://streaming.radioya.com.ni:8000/live', color: '#dc2626', genre: 'Noticias' },
  { id: 'vivafm', name: 'Viva FM', website: 'https://www.vivafm.com.ni/', streamUrl: 'https://streaming.vivafm.com.ni:8000/live', color: '#0ea5e9', genre: 'Música' },
  { id: 'buenisima', name: 'La Buenísima', website: 'https://www.labuenisimanicaragua.com/', streamUrl: '', color: '#f97316', genre: 'Tropical' },
  { id: 'pachanguera', name: 'La Pachanguera', website: 'https://www.lapachanguera.com.ni/', streamUrl: '', color: '#ec4899', genre: 'Variedad' },
  { id: 'futura', name: 'Radio Futura', website: 'https://www.radiofutura.com.ni/', streamUrl: '', color: '#06b6d4', genre: 'Juvenil' },
  { id: 'clasica', name: 'Radio Clásica', website: 'https://www.radioclasica.com.ni/', streamUrl: '', color: '#8b5cf6', genre: 'Clásica' },
  { id: 'yes', name: 'Radio Yes', website: 'https://www.radioyes.com.ni/', streamUrl: '', color: '#ef4444', genre: 'Pop' },
  { id: 'fiestalatina', name: 'Fiesta Latina', website: 'https://fiestalatina.com.ni/', streamUrl: '', color: '#16a34a', genre: 'Tropical' },
];

export default function RadioPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const playStation = (station: Station) => {
    if (playing === station.id) {
      audioRef.current?.pause();
      setPlaying(null);
      setError(null);
      return;
    }

    if (!station.streamUrl) {
      setError(`${station.name}: URL de streaming pendiente. Abrí el sitio web.`);
      setPlaying(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    const audio = new Audio(station.streamUrl);
    audio.volume = 0.8;

    audio.oncanplay = () => {
      audio.play();
      setPlaying(station.id);
      setError(null);
    };

    audio.onerror = () => {
      setError(`No se pudo conectar con ${station.name}. La emisora puede estar offline.`);
      setPlaying(null);
    };

    audioRef.current = audio;
  };

  return (
    <div className="radio-player">
      <div className="radio-header">
        <div className="radio-title-group">
          <Radio size={14} color="#ef4444" />
          <span className="radio-title">Radio Nicaragua</span>
          {playing && <span className="radio-live-dot" />}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="radio-toggle-btn"
          aria-label={expanded ? 'Cerrar emisoras' : 'Ver emisoras'}
        >
          {expanded ? 'Cerrar' : 'Ver emisoras'}
        </button>
      </div>

      {playing && (
        <div className="radio-now-playing">
          <div className="radio-station-info">
            <span className="radio-playing-dot" style={{ backgroundColor: STATIONS.find(s => s.id === playing)?.color }} />
            <span className="radio-playing-name">{STATIONS.find(s => s.id === playing)?.name}</span>
          </div>
          <button onClick={() => { audioRef.current?.pause(); setPlaying(null); }} className="radio-control-btn" aria-label="Pausar">
            <Pause size={16} />
          </button>
        </div>
      )}

      {error && <div className="radio-error">{error}</div>}

      {expanded && (
        <div className="radio-stations-list">
          {STATIONS.map(station => (
            <div key={station.id} className="radio-station-item">
              <button onClick={() => playStation(station)} className="radio-play-btn" aria-label={playing === station.id ? `Pausar ${station.name}` : `Reproducir ${station.name}`}>
                {playing === station.id ? <Pause size={14} color="#fff" /> : <Play size={14} color="#fff" />}
              </button>
              <span className="radio-station-dot" style={{ backgroundColor: station.color }} />
              <span className="radio-station-name">{station.name}</span>
              <span className="radio-station-genre">{station.genre}</span>
              <a href={station.website} target="_blank" rel="noopener noreferrer" className="radio-website-link" aria-label={`Visitar sitio de ${station.name}`}>
                <ExternalLink size={12} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
