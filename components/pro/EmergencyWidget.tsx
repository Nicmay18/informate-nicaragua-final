'use client';

import { Flame, Shield, HeartPulse } from 'lucide-react';

// Números oficiales de Nicaragua (verificados: Policía Nacional, Embajada de
// Francia en Nicaragua). Nicaragua NO usa el 911 como número general.
const EMERGENCIAS = [
  { numero: '118', label: 'Policía Nacional', icon: Shield, color: '#0F172A' },
  { numero: '115', label: 'Bomberos', icon: Flame, color: '#B45309' },
  { numero: '128', label: 'Cruz Blanca Nicaragüense', icon: HeartPulse, color: '#DC2626' },
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
