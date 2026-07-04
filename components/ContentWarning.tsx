'use client';

import { useState } from 'react';

interface ContentWarningProps {
  category?: string;
}

const SENSITIVE_CATEGORIES = ['sucesos', 'crimen', 'accidentes', 'fallecimientos', 'violencia'];

export default function ContentWarning({ category }: ContentWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  const isSensitive = SENSITIVE_CATEGORIES.includes(category?.toLowerCase() || '');
  if (!isSensitive || dismissed) return null;

  return (
    <div
      style={{
        margin: '16px 0',
        padding: '14px 18px',
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>⚠️</span>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#92400e' }}>
          Contenido sensible
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#a16207', lineHeight: 1.4 }}>
          Esta noticia contiene información sobre hechos de violencia o tragedias.
          Se presenta con fines informativos.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          padding: '6px 14px',
          background: '#fff',
          border: '1px solid #f59e0b',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          color: '#92400e',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Entendido
      </button>
    </div>
  );
}
