import { NextResponse } from 'next/server';

// Tasa oficial BCN (córdoba/dólar — crawling peg, cambia ~5% al año)
// Actualizar manualmente cuando el BCN lo ajuste significativamente
const BCN_NIO_USD_BUY = 36.40;
const BCN_NIO_USD_SELL = 37.18;

// Spread bancario adicional para EUR (los bancos nicaragüenses aplican mayor margen en EUR)
const EUR_BANK_SPREAD = 0.08; // 8% spread para NIO/EUR

export const revalidate = 3600; // Revalidar cada hora en el servidor

export async function GET() {
  try {
    // Frankfurter.app = ECB rates, gratuito, sin API key
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR', {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error('Frankfurter API error');

    const data = await res.json();
    const usdToEur: number = data.rates?.EUR ?? 0.882;
    const eurToUsd = 1 / usdToEur; // ej: 1.1343

    // NIO/EUR = NIO/USD × EUR/USD (con spread bancario)
    const nioEurMid = BCN_NIO_USD_BUY * eurToUsd;
    const nioEurBuy = +(nioEurMid * (1 - EUR_BANK_SPREAD / 2)).toFixed(4);
    const nioEurSell = +(nioEurMid * (1 + EUR_BANK_SPREAD / 2)).toFixed(4);

    return NextResponse.json(
      {
        rates: {
          'NIO-USD': { buy: BCN_NIO_USD_BUY, sell: BCN_NIO_USD_SELL, label: 'Córdoba / Dólar' },
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
          'NIO-USD': { buy: 36.40, sell: 37.18, label: 'Córdoba / Dólar' },
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
