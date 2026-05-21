'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Radio } from 'lucide-react';

const STATIONS = [
  { id: 'viva', name: 'Viva FM', url: 'https://stream.viva.com.ni/live', color: '#ef4444' },
  { id: 'futura', name: 'Radio Futura', url: 'https://radiofuturanicaragua.com/stream', color: '#f97316' },
  { id: 'clasica', name: 'Clásica 101.9', url: 'https://clasica1019fm.com/stream', color: '#8b5cf6' },
  { id: 'tuani', name: 'La Tuani', url: 'https://stream.latuani.com/live', color: '#ec4899' },
  { id: 'stereo', name: 'Radio Stereo', url: 'https://stream.stereo.com.ni/live', color: '#06b6d4' },
  { id: 'yes', name: 'Yes Radio', url: 'https://stream.yesradio.com.ni/live', color: '#22c55e' },
  { id: 'fitnis', name: 'Radio Fitnis', url: 'https://stream.fitnis.com.ni/live', color: '#eab308' },
];

export default function RadioPlayer() {
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = (stationId: string) => {
    const station = STATIONS.find(s => s.id === stationId);
    if (!station) return;

    if (activeStation === stationId && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(station.url);
    audio.volume = volume;
    audioRef.current = audio;
    setActiveStation(stationId);

    audio.play().catch(() => {
      setIsPlaying(false);
    });

    audio.onplaying = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  const currentStation = STATIONS.find(s => s.id === activeStation);

  return (
    <div className="radio-widget">
      <h3 className="widget-title" style={{ color: '#fff', position: 'relative', zIndex: 1 }}>
        <Radio size={16} /> Radio en Vivo
      </h3>

      <div className="radio-live-badge">
        <span className="radio-live-dot"></span>
        En Vivo
      </div>

      {currentStation && (
        <div className="radio-now-playing" style={{ position: 'relative', zIndex: 1, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{currentStation.name}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Música y noticias 24/7</div>
        </div>
      )}

      <div className="radio-station-list">
        {STATIONS.map(station => {
          const isActive = activeStation === station.id;
          const showPause = isActive && isPlaying;
          return (
            <button
              key={station.id}
              className={`radio-station-btn ${isActive ? 'active' : ''}`}
              onClick={() => togglePlay(station.id)}
              style={{ '--station-color': station.color } as React.CSSProperties}
            >
              <span className="radio-station-indicator" style={{ background: station.color }}></span>
              <span className="radio-station-name">{station.name}</span>
              <span className="radio-station-play">
                {showPause ? <Pause size={14} /> : <Play size={14} />}
              </span>
            </button>
          );
        })}
      </div>

      {currentStation && (
        <div className="radio-volume-row" style={{ position: 'relative', zIndex: 1, marginTop: 14 }}>
          <Volume2 size={14} color="#94a3b8" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="radio-volume-slider"
          />
        </div>
      )}
    </div>
  );
}
