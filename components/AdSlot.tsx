'use client';

import { useMemo } from 'react';

interface AdSlotProps {
  zoneId?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  label?: string;
}

export default function AdSlot({
  zoneId,
  width = 336,
  height = 280,
  className = '',
  style = {},
  format = 'auto',
  label = 'Publicidad',
}: AdSlotProps) {
  const minHeight = useMemo(() => (format === 'horizontal' ? 90 : height), [format, height]);

  return (
    <div
      className={`ad-slot ${className || ''}`}
      data-zone={zoneId}
      style={{
        position: 'relative',
        minHeight,
        minWidth: width,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        border: '1px dashed #e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
        ...style,
      }}
      aria-hidden="true"
    >
      <span className="ad-label">{label}</span>
      <div className="ad-slot__placeholder">
        <p>Espacio reservado para Monetag</p>
        <small>Zona {zoneId || 'predeterminada'} · {format}</small>
      </div>
    </div>
  );
}
