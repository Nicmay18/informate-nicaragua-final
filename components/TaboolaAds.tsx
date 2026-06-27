'use client';

import { useEffect } from 'react';

interface TaboolaAdsProps {
  placement: 'below-article' | 'sidebar' | 'mid-article';
  containerId?: string;
}

/**
 * Componente de anuncios Taboola
 * Requiere: NEXT_PUBLIC_TABOOLA_PUBLISHER_ID en variables de entorno
 * 
 * Para activar:
 * 1. Registrate en https://www.taboola.com/publishers
 * 2. Obtené tu Publisher ID
 * 3. Agregá NEXT_PUBLIC_TABOOLA_PUBLISHER_ID=tu-id a Vercel
 * 4. Redeploy
 */
export default function TaboolaAds({ placement, containerId }: TaboolaAdsProps) {
  const publisherId = process.env.NEXT_PUBLIC_TABOOLA_PUBLISHER_ID;

  useEffect(() => {
    if (!publisherId) return;

    // Cargar script de Taboola solo una vez
    if (!document.getElementById('taboola-script')) {
      const script = document.createElement('script');
      script.id = 'taboola-script';
      script.async = true;
      script.src = `//cdn.taboola.com/libtrc/${publisherId}/loader.js`;
      document.head.appendChild(script);
    }

    // Push el placement específico
    const win = window as unknown as Record<string, unknown>;
    if (win._taboola) {
      (win._taboola as Array<Record<string, unknown>>).push({
        mode: 'thumbnails-a',
        container: containerId || `taboola-${placement}`,
        placement: `Nicaragua Informate ${placement}`,
        target_type: 'mix'
      });
    }
  }, [publisherId, placement, containerId]);

  if (!publisherId) {
    return (
      <div style={{ padding: 16, background: '#f1f5f9', borderRadius: 8, margin: '16px 0' }}>
        <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
          [Espacio publicitario — Taboola pendiente de configuración]
        </p>
      </div>
    );
  }

  return (
    <div 
      id={containerId || `taboola-${placement}`}
      style={{ margin: '24px 0', minHeight: 250 }}
    />
  );
}
