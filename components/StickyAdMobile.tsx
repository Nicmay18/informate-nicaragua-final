'use client';

import { useState } from 'react';
import AdSlot from './AdSlot';
import { X } from 'lucide-react';

export default function StickyAdMobile() {
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  return (
    <div className="sticky-ad-mobile" style={{
      position: 'fixed',
      bottom: 56,
      left: 0,
      right: 0,
      zIndex: 50,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#fff',
      borderTop: '1px solid #e8e8ec',
      padding: '8px 40px 8px 8px',
      gap: 8,
    }}>
      <AdSlot slot="homepage-sticky-bottom" width={320} height={50} format="horizontal" style={{ minHeight: 50 }} />
      <button
        onClick={() => setClosed(true)}
        aria-label="Cerrar anuncio"
        style={{
          position: 'absolute',
          right: 4,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
