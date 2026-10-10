'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Rastrea navegación SPA en Next.js.
 * El page_view inicial se envía por el script en <head> de layout.tsx.
 * Este componente solo envía eventos cuando el usuario navega
 * a otra página sin recarga completa.
 */
export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // El primer render NO emite page_view: la carga inicial ya la cubre
  // `gtag('config')` en <head>. Emitirla aquí duplicaría cada primera vista.
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window === 'undefined') return;

    const win = window as any;
    if (!pathname || typeof win.gtag !== 'function') return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    win.gtag('event', 'page_view', {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
