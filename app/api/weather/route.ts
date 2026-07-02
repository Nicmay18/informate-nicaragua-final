import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat y lon requeridos' }, { status: 400 });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&timezone=America%2FManagua&wind_speed_unit=kmh`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      return NextResponse.json({ error: 'Open-Meteo error' }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/weather] fetch failed', error);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
