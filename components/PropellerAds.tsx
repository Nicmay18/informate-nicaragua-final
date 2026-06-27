'use client';

import { useEffect } from 'react';

interface PropellerAdsProps {
  zoneId?: string;
}

/**
 * Componente de anuncios PropellerAds
 * Requiere: NEXT_PUBLIC_PROPELLER_ZONE_ID en variables de entorno
 *
 * Para activar:
 * 1. Registrate en https://propellerads.com
 * 2. Agregá tu sitio y obtené tu Zone ID
 * 3. Agregá NEXT_PUBLIC_PROPELLER_ZONE_ID=tu-zone-id a Vercel
 * 4. Redeploy
 */
export default function PropellerAds({ zoneId }: PropellerAdsProps) {
  const finalZoneId = zoneId || process.env.NEXT_PUBLIC_PROPELLER_ZONE_ID;

  useEffect(() => {
    if (!finalZoneId) return;

    // Cargar script de PropellerAds
    if (!document.getElementById('propeller-script')) {
      const script = document.createElement('script');
      script.id = 'propeller-script';
      script.async = true;
      script.src = `https://native.propellerads.com/1?z=${finalZoneId}&var=${finalZoneId}`;
      document.head.appendChild(script);
    }
  }, [finalZoneId]);

  if (!finalZoneId) {
    return (
      <div style={{ padding: 16, background: '#f1f5f9', borderRadius: 8, margin: '16px 0' }}>
        <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
          [Espacio publicitario — PropellerAds pendiente de configuración]
        </p>
      </div>
    );
  }

  return (
    <div 
      id={`propeller-${finalZoneId}`}
      style={{ margin: '24px 0', minHeight: 250, textAlign: 'center' }}
    />
  );
}
