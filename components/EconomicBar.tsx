// File: components/EconomicBar.tsx
'use client';

import { useState, useEffect } from 'react';

interface EconomicData {
  label: string;
  value: string;
  change?: string;
  up?: boolean;
}

const nicaData: EconomicData[] = [
  { label: 'Dólar/NIO', value: 'C$ 36.62', change: '0.00%', up: true },
  { label: 'Euro/NIO', value: 'C$ 43.11', change: '1.25%', up: true },
  { label: 'Súper/Galón', value: 'C$ 49.00', change: '0.00%', up: true },
  { label: 'Regular/Galón', value: 'C$ 47.80', change: '0.00%', up: true },
  { label: 'Diésel/Galón', value: 'C$ 43.21', change: '0.44%', up: true },
];

export default function EconomicBar() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="econ-bar" role="region" aria-label="Indicadores económicos">
      <div className="econ-inner">
        <div className="econ-date">
          {new Date().toLocaleDateString('es-NI', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>

        {nicaData.map((item, idx) => (
          <div key={`${item.label}-${idx}`} className="econ-item">
            <span className="label" style={{ fontWeight: 700, color: 'var(--ni-gold)' }}>{item.label}</span>
            <span className="value" style={{ fontWeight: 600 }}>{item.value}</span>
            {item.change && (
              <>
                <span className="divider" style={{ margin: '0 4px', opacity: 0.5 }}>•</span>
                <span className={item.up ? 'up' : 'down'} style={{ color: item.up ? '#22c55e' : '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {item.up ? '▲' : '▼'} {item.change}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
