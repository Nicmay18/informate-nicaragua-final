import { NextResponse } from 'next/server';

// Valores de referencia mostrados en el widget de Nicaragua Informate.
const NIO_USD_SELL = 36.62;
const NIO_USD_BUY = 37.06;

export const revalidate = 86400; // Revalidar cada 24h en el servidor
export const maxDuration = 10;

export async function GET() {
  try {
    // Frankfurter.app = ECB rates, gratuito, sin API key
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR', {
      next: { revalidate: 86400 },
    });

    if (!res.ok) throw new Error('Frankfurter API error');

    const data = await res.json();
    const usdToEur: number = data.rates?.EUR ?? 0.882;
    const eurToUsd = 1 / usdToEur; // ej: 1.1343

    const nioEurBuy = NIO_USD_SELL * eurToUsd;
    const nioEurSell = NIO_USD_BUY * eurToUsd;

    return NextResponse.json(
      {
        rates: {
          'NIO-USD': { buy: NIO_USD_BUY, sell: NIO_USD_SELL, label: 'Córdoba / Dólar' },
          'NIO-EUR': { buy: +nioEurBuy.toFixed(4), sell: +nioEurSell.toFixed(4), label: 'Córdoba / Euro' },
          'EUR-USD': { mid: +eurToUsd.toFixed(4), label: 'Euro / Dólar' },
        },
        updatedAt: new Date().toISOString(),
        source: 'Referencia cambiaria / ECB (Frankfurter)',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch {
    // Fallback estático con los valores actuales
    return NextResponse.json(
      {
        rates: {
          'NIO-USD': { buy: NIO_USD_BUY, sell: NIO_USD_SELL, label: 'Córdoba / Dólar' },
          'NIO-EUR': { buy: 41.7627, sell: 42.2644, label: 'Córdoba / Euro' },
          'EUR-USD': { mid: 1.1343, label: 'Euro / Dólar' },
        },
        updatedAt: new Date().toISOString(),
        source: 'Referencia cambiaria (caché local)',
        cached: true,
      },
      { status: 200 }
    );
  }
}
