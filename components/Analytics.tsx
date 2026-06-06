'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const win = window as any;
    if (!pathname || typeof win.gtag !== 'function') {
      return;
    }

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    win.gtag('config', 'G-W1B5J61WEP', {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
      send_page_view: true,
    });
  }, [pathname, searchParams]);

  return null;
}
