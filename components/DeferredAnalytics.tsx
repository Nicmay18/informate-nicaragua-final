'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const GA_ID = 'G-W1B5J61WEP';

function loadGAScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve(); return; }
    if ((window as any).gaLoaded) { resolve(); return; }

    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.async = true;
    script.onload = () => {
      (window as any).gaLoaded = true;
      resolve();
    };
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

function initGA() {
  const win = window as any;
  win.dataLayer = win.dataLayer || [];
  win.gtag = function gtag(...args: any[]) { win.dataLayer.push(args); };
  win.gtag('js', new Date());
  win.gtag('config', GA_ID, {
    page_title: document.title,
    page_location: window.location.href,
    send_page_view: true,
  });
}

export default function DeferredAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Cargar GA cuando el navegador esté idle (no bloquea LCP/FCP)
    const schedule = (typeof window !== 'undefined' && (window as any).requestIdleCallback)
      ? (window as any).requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 2000);

    const handle = schedule(async () => {
      await loadGAScript();
      initGA();
    });

    return () => {
      if (typeof window !== 'undefined' && (window as any).cancelIdleCallback) {
        (window as any).cancelIdleCallback(handle);
      } else {
        clearTimeout(handle);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as any;
    if (typeof win.gtag !== 'function') return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    win.gtag('event', 'page_view', {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
