'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { isAdsenseSafePath } from '@/lib/adsense-guard';

export default function AdSenseLoader() {
  const pathname = usePathname();

  const safe = isAdsenseSafePath(pathname);

  if (!safe) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AdSense] 🚫 Bloqueado en: ${pathname}`);
    }
    return null;
  }

  return (
    <Script
      id="adsense-script"
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
    />
  );
}
