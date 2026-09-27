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
    script.onerror = () => {
      (window as any).gaLoaded = false;
      resolve();
    };
    document.head.appendChild(script);
  });
}

function initGA() {
  const win = window as any;
  win.dataLayer = win.dataLayer || [];
  win.gtag = function gtag(...args: any[]) { win.dataLayer.push(args); };
  // Default denied hasta que el usuario decida; ConsentScript aplica su eleccion.
  win.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
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
    if (typeof window === 'undefined') return;
    initGA();
    loadGAScript();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as any;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    if (typeof win.gtag === 'function') {
      win.gtag('event', 'page_view', {
        page_path: url,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
