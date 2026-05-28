'use client';

import { useEffect } from 'react';

export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;
    // Contar vista solo una vez por carga de página
    fetch('/api/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).catch(() => {
      // Silenciar errores de red
    });
  }, [slug]);

  return null;
}
