import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

export const runtime = 'edge';
export const maxDuration = 10;

const CITIES = [
  { name: 'Managua', region: 'Managua', lat: 12.1328, lon: -86.2504 },
  { name: 'León', region: 'León', lat: 12.4379, lon: -86.8780 },
  { name: 'Granada', region: 'Granada', lat: 11.9299, lon: -85.9560 },
  { name: 'Estelí', region: 'Estelí', lat: 13.0850, lon: -86.3630 },
  { name: 'Matagalpa', region: 'Matagalpa', lat: 12.9250, lon: -85.9170 },
  { name: 'Jinotega', region: 'Jinotega', lat: 13.0910, lon: -86.0010 },
  { name: 'Masaya', region: 'Masaya', lat: 11.9734, lon: -86.0730 },
  { name: 'Carazo', region: 'Carazo', lat: 11.8589, lon: -86.2394 },
  { name: 'Rivas', region: 'Rivas', lat: 11.4372, lon: -85.8263 },
  { name: 'Boaco', region: 'Boaco', lat: 12.4722, lon: -85.6596 },
  { name: 'Bluefields', region: 'RAAS', lat: 12.0067, lon: -83.7651 },
  { name: 'Siuna', region: 'RACCN', lat: 13.7333, lon: -84.7667 },
  { name: 'Río San Juan', region: 'Río San Juan', lat: 11.1233, lon: -84.7771 },
  { name: 'Chontales', region: 'Chontales', lat: 12.1063, lon: -85.3645 },
];

interface WeatherData {
  temp: number;
  humidity: number;
  wind: number;
  code: number;
}

async function fetchOne(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America%2FManagua`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    return { temp: 0, humidity: 0, wind: 0, code: -1 };
  }
  const data = await res.json();
  return {
    temp: Math.round(data.current.temperature_2m),
    humidity: data.current.relative_humidity_2m,
    wind: Math.round(data.current.wind_speed_10m),
    code: data.current.weather_code,
  };
}

const getAllWeather = unstable_cache(
  async () => {
    const results: Record<string, WeatherData> = {};
    const settled = await Promise.all(
      CITIES.map(async (city) => ({
        name: city.name,
        data: await fetchOne(city.lat, city.lon),
      }))
    );
    for (const { name, data } of settled) {
      results[name] = data;
    }
    return results;
  },
  ['weather-all-cities'],
  { revalidate: 1800 }
);

export async function GET() {
  try {
    const data = await getAllWeather();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('[api/weather/all] failed', error);
    return NextResponse.json(
      {},
      { status: 500 }
    );
  }
}
