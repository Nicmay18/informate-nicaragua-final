import { NextResponse } from 'next/server';

// Tipo de cambio oficial publicado por el BCN.
// El BCN publica un único tipo de cambio oficial, no una compra/venta bancaria.
const BCN_NIO_USD_OFFICIAL = 36.6243;

// Spread bancario adicional para EUR (los bancos nicaragüenses aplican mayor margen en EUR)
const EUR_BANK_SPREAD = 0.08; // 8% spread para NIO/EUR

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

    // EUR/NIO = tipo oficial BCN × EUR/USD. Se presenta como referencia calculada,
    // no como cotización bancaria de compra/venta.
    const nioEurMid = BCN_NIO_USD_OFFICIAL * eurToUsd;
    const nioEurBuy = +(nioEurMid * (1 - EUR_BANK_SPREAD / 2)).toFixed(4);
    const nioEurSell = +(nioEurMid * (1 + EUR_BANK_SPREAD / 2)).toFixed(4);

    return NextResponse.json(
      {
        rates: {
          'NIO-USD': { mid: BCN_NIO_USD_OFFICIAL, label: 'Córdoba / Dólar (oficial BCN)' },
          'NIO-EUR': { buy: nioEurBuy, sell: nioEurSell, label: 'Córdoba / Euro' },
          'EUR-USD': { mid: +eurToUsd.toFixed(4), label: 'Euro / Dólar' },
        },
        updatedAt: new Date().toISOString(),
        source: 'BCN / ECB (Frankfurter)',
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
          'NIO-USD': { mid: BCN_NIO_USD_OFFICIAL, label: 'Córdoba / Dólar (oficial BCN)' },
          'NIO-EUR': { buy: 41.5429, sell: 45.5423, label: 'Córdoba / Euro' },
          'EUR-USD': { mid: 1.1343, label: 'Euro / Dólar' },
        },
        updatedAt: new Date().toISOString(),
        source: 'BCN (caché local)',
        cached: true,
      },
      { status: 200 }
    );
  }
}
