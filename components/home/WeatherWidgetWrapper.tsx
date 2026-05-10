'use client';

import dynamic from 'next/dynamic';

const WeatherWidget = dynamic(() => import('@/components/WeatherWidget'), { ssr: false });

export default function WeatherWidgetWrapper() {
  return <WeatherWidget />;
}
