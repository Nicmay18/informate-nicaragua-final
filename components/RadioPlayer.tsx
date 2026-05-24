'use client';

import { useState } from 'react';
import { Radio, ExternalLink } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  url: string;
  color: string;
  genre: string;
}

const STATIONS: Station[] = [
  { id: 'radioya', name: 'Radio Ya', url: 'https://www.radioya.com.ni/', color: '#dc2626', genre: 'Noticias' },
  { id: 'vivafm', name: 'Viva FM', url: 'https://www.vivafm.com.ni/', color: '#0ea5e9', genre: 'Música' },
  { id: 'fiestalatina', name: 'Fiesta Latina', url: 'https://fiestalatina.com.ni/', color: '#16a34a', genre: 'Tropical' },
  { id: 'radiojuvenil', name: 'Radio Juvenil', url: 'https://radiojuvenil.com.ni/', color: '#eab308', genre: 'Variada' },
  { id: 'radionicaragua', name: 'Radio Nicaragua', url: 'https://www.radionicaragua.com/', color: '#8b5cf6', genre: 'Noticias' },
];

export default function RadioPlayer() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background: '#0f172a', borderRadius: 14, padding: '12px 16px', color: '#fff', position: 'relative' }}>
      {/* Header compacto */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Radio size={14} color="#ef4444" />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.2px' }}>Radio Nicaragua</span>
          <span className="radio-live-dot" />
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          {expanded ? 'Cerrar' : 'Ver emisoras'}
        </button>
      </div>

      {/* Lista de estaciones (colapsable) */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
          {STATIONS.map(station => (
            <a
              key={station.id}
              href={station.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                color: '#fff', textDecoration: 'none', width: '100%', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: station.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{station.name}</span>
              <span style={{ fontSize: 10, color: '#64748b' }}>{station.genre}</span>
              <ExternalLink size={12} color="#64748b" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

