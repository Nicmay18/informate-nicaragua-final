'use client';

import { Phone, Ambulance, Flame, Shield, HeartPulse } from 'lucide-react';

const EMERGENCIAS = [
  { numero: '911', label: 'Emergencias', icon: Phone, color: '#DC2626' },
  { numero: '118', label: 'Policía Nacional', icon: Shield, color: '#0F172A' },
  { numero: '115', label: 'Bomberos', icon: Flame, color: '#B45309' },
  { numero: '128', label: 'Cruz Roja', icon: HeartPulse, color: '#DC2626' },
  { numero: '505-8418-1000', label: 'Ambulancia MINSA', icon: Ambulance, color: '#059669' },
];

export default function EmergencyWidget() {
  return (
    <div className="emergency-widget" role="region" aria-label="Números de emergencia">
      <ul className="emergency-list">
        {EMERGENCIAS.map((item) => (
          <li key={item.numero} className="emergency-item">
            <a href={`tel:${item.numero.replace(/\s/g, '')}`} className="emergency-link">
              <span className="emergency-icon" style={{ backgroundColor: item.color }}>
                <item.icon size={16} />
              </span>
              <div className="emergency-info">
                <span className="emergency-num">{item.numero}</span>
                <span className="emergency-label">{item.label}</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
