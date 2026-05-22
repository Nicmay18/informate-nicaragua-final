// File: components/EconomicBar.tsx
'use client';

import { useState, useEffect } from 'react';

interface EconomicData {
  label: string;
  value: string;
  change?: number;
}

const mockData: EconomicData[] = [
  { label: 'USD/NIO', value: '36.45', change: 0.12 },
  { label: 'EUR/NIO', value: '39.82', change: -0.05 },
  { label: 'GBP/NIO', value: '46.23', change: 0.18 },
  { label: 'BTC', value: '$42,350', change: 2.5 },
  { label: 'Oro (oz)', value: '$2,145', change: 1.2 },
];

export default function EconomicBar() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="econ-bar" role="region" aria-label="Economic indicators">
      <div className="econ-inner">
        <div className="econ-date">
          {new Date().toLocaleDateString('es-NI', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>

        {mockData.map((item, idx) => (
          <div key={`${item.label}-${idx}`} className="econ-item">
            <span className="label">{item.label}</span>
            <span className="value">{item.value}</span>
            {item.change !== undefined && (
              <>
                <span className="divider">•</span>
                <span className={item.change > 0 ? 'up' : 'down'}>
                  {item.change > 0 ? '▲' : '▼'} {Math.abs(item.change)}%
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
