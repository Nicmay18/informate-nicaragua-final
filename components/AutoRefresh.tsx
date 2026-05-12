'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AutoRefreshProps {
  /** Intervalo en segundos. Default: 60 */
  intervalSec?: number;
}

/**
 * Refresca automáticamente la data del Server Component
 * cada X segundos llamando router.refresh().
 * También refresca al volver a enfocar la pestaña.
 */
export default function AutoRefresh({ intervalSec = 60 }: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const ms = Math.max(15, intervalSec) * 1000;

    const interval = setInterval(() => {
      // Solo refrescar si la pestaña está visible
      if (typeof document !== 'undefined' && !document.hidden) {
        router.refresh();
      }
    }, ms);

    const onFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        router.refresh();
      }
    };

    const onVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        router.refresh();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [router, intervalSec]);

  return null;
}
