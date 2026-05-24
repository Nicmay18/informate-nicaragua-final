// File: components/EconomicBar.tsx
'use client';

import { useState, useEffect } from 'react';

export default function EconomicBar() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  if (!isClient) return null;

  return (
    <div className="econ-widget" role="region" aria-label="Indicadores económicos">
      <div className="econ-widget__section">
        <div className="econ-widget__subtitle">💵 Tipo de Cambio BCN</div>
        <div className="econ-widget__row">
          <span className="econ-widget__label">Dólar</span>
          <span className="econ-widget__value">C$ 36.62</span>
          <span className="econ-widget__change econ-widget__change--neutral">→ 0.00%</span>
        </div>
        <div className="econ-widget__row">
          <span className="econ-widget__label">Euro</span>
          <span className="econ-widget__value">C$ 43.11</span>
          <span className="econ-widget__change econ-widget__change--up">▲ 1.25%</span>
        </div>
      </div>

      <div className="econ-widget__divider" />

      <div className="econ-widget__section">
        <div className="econ-widget__subtitle">⛽ Combustibles (C$/galón)</div>
        <div className="econ-widget__row">
          <span className="econ-widget__label">Regular</span>
          <span className="econ-widget__value">C$ 47.80</span>
          <span className="econ-widget__change econ-widget__change--neutral">→ 0.00%</span>
        </div>
        <div className="econ-widget__row">
          <span className="econ-widget__label">Súper</span>
          <span className="econ-widget__value">C$ 49.00</span>
          <span className="econ-widget__change econ-widget__change--neutral">→ 0.00%</span>
        </div>
        <div className="econ-widget__row">
          <span className="econ-widget__label">Diésel</span>
          <span className="econ-widget__value">C$ 43.21</span>
          <span className="econ-widget__change econ-widget__change--up">▲ 0.44%</span>
        </div>
      </div>

      <div className="econ-widget__source">Fuente: BCN / INE Nicaragua</div>
    </div>
  );
}
