import { NextResponse } from 'next/server';

// Tipo de cambio oficial del córdoba publicado por el Banco Central de
// Nicaragua (BCN): tabla de deslizamiento 2026, C$36.6243 por USD.
// Vigencia de esta fila de la tabla: año 2026. Si el año cambia sin nueva
// tabla publicada, el campo oficial pasa a null (nunca se inventa).
const BCN_USD_OFICIAL_2026 = 36.6243;

const BCN_SOURCE = 'Banco Central de Nicaragua (BCN)';
const ECB_SOURCE = 'Banco Central Europeo (ECB)';
const CALC_SOURCE = 'Referencia calculada (oficial BCN × EUR/USD ECB)';

export const revalidate = 3600;
export const maxDuration = 10;

type RateEntry = {
  official?: number | null;
  buy?: number | null;
  sell?: number | null;
  mid?: number | null;
  label: string;
  source: string;
};

function usdNioEntry(): RateEntry {
  const official =
    new Date().getUTCFullYear() === 2026 ? BCN_USD_OFICIAL_2026 : null;
  // Compra/venta: el BCN no expone un endpoint público estable para el
  // mercado cambiario; se muestran como no disponibles en lugar de
  // inventar valores.
  return { official, buy: null, sell: null, label: 'Dólar (USD)', source: BCN_SOURCE };
}

export async function GET() {
  const usd = usdNioEntry();
  let eurUsdMid: number | null = null;

  try {
    // Frankfurter.app = tasas de referencia del BCE, gratuito, sin API key.
    // Se usa SOLO para la referencia internacional EUR/USD, nunca para
    // la compra/venta del dólar en Nicaragua.
    const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD', {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.rates?.USD === 'number') eurUsdMid = data.rates.USD;
    }
  } catch {
    // sin referencia EUR/USD disponible
  }

  const nioEurMid =
    usd.official != null && eurUsdMid !== null
      ? +(usd.official * eurUsdMid).toFixed(4)
      : null;

  return NextResponse.json(
    {
      rates: {
        'NIO-USD': usd,
        'NIO-EUR': {
          mid: nioEurMid,
          label: 'Euro (EUR)',
          source: CALC_SOURCE,
        },
        'EUR-USD': {
          mid: eurUsdMid,
          label: 'EUR/USD',
          source: ECB_SOURCE,
        },
      },
      updatedAt: new Date().toISOString(),
      source: `${BCN_SOURCE} / ${ECB_SOURCE}`,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    }
  );
}
