// File: components/EconomicBar.tsx
'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface RateEntry { buy?: number; sell?: number; mid?: number; label: string }
interface RatesData {
  rates: Record<string, RateEntry>;
  updatedAt: string;
  source: string;
  cached?: boolean;
}

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

function fmt(n?: number) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export default function EconomicBar() {
  const [data, setData] = useState<RatesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/exchange-rates');
        if (!res.ok) throw new Error('fetch failed');
        const json: RatesData = await res.json();
        if (!cancelled) { setData(json); setLoading(false); }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, REFRESH_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const r = data?.rates;

  const cards = [
    {
      label: 'USD → NIO',
      value: loading ? '—' : `C$ ${fmt(r?.['NIO-USD']?.buy)}`,
      sub: loading ? '—' : `venta ${fmt(r?.['NIO-USD']?.sell)}`,
      trend: 'neutral' as const,
    },
    {
      label: 'EUR → NIO',
      value: loading ? '—' : `C$ ${fmt(r?.['NIO-EUR']?.buy)}`,
      sub: loading ? '—' : `venta ${fmt(r?.['NIO-EUR']?.sell)}`,
      trend: 'neutral' as const,
    },
    {
      label: 'EUR / USD',
      value: loading ? '—' : fmt(r?.['EUR-USD']?.mid),
      sub: '',
      trend: 'neutral' as const,
    },
  ];

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'neutral' }) => {
    if (trend === 'up') return <ArrowUpRight size={14} />;
    if (trend === 'down') return <ArrowDownRight size={14} />;
    return <Minus size={14} />;
  };

  return (
    <div className="econ-cards" role="region" aria-label="Indicadores económicos">
      {cards.map((card) => (
        <div key={card.label} className="econ-card">
          <span className="econ-card__label">{card.label}</span>
          <div className="econ-card__row">
            <span className="econ-card__value">{card.value}</span>
            {card.sub && (
              <span className="econ-card__sub">
                <TrendIcon trend={card.trend} />
                {card.sub}
              </span>
            )}
          </div>
        </div>
      ))}
      <div className="econ-card__source">
        Fuente: {data?.source ?? 'BCN / ECB'}
      </div>
    </div>
  );
}
