'use client';

import dynamic from 'next/dynamic';

const WeatherWidget = dynamic(() => import('@/components/WeatherWidget'), {
  ssr: false,
  loading: () => <div style={{ background: 'linear-gradient(160deg, #1e3a5f 0%, #0f172a 100%)', borderRadius: 14, padding: '20px', color: '#fff' }}>Cargando clima...</div>
});

export default function DynamicWeatherWidget() {
  return <WeatherWidget />;
}
