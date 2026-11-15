'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { adsAllowed } from '@/lib/editorial/adsense-safety';
import { loadAdsenseScript } from '@/lib/adsense/loader';

/**
 * Carga global del script de AdSense en superficies públicas elegibles.
 *
 * - Auto ads (configurados en la consola de AdSense) solo pueden servir en
 *   páginas donde el script está presente; antes solo se cargaba cuando un
 *   <AdsenseUnit> manual entraba al viewport, así que portada, listados,
 *   categorías y /util nunca eran monetizables por Auto ads.
 * - La decisión respeta la allowlist de rutas (nunca admin/panel/login/api)
 *   y el meta `adsense-block` que emite generateMetadata en artículos
 *   sensibles (clasificación por contenido, no por categoría).
 * - La deduplicación real vive en lib/adsense/loader.ts: una sola descarga
 *   aunque coexistan este loader y unidades manuales.
 * - Consent mode (gtag) ya declara ad_storage denied por defecto; la
 *   personalización solo se activa si el usuario acepta en el banner.
 */
export default function AdSenseGlobal() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const articleSensitive =
      document.querySelector('meta[name="adsense-block"]')?.getAttribute('content') === 'true';
    if (!adsAllowed(pathname, articleSensitive)) return;

    // Diferir la descarga hasta después del evento `load` + idle: el script
    // de AdSense pesa ~300 kB y ejecuta lógica pesada; cargarlo en el
    // arranque degradaba LCP/TBT móvil de forma medible. Auto ads sigue
    // funcionando: Google solo exige que el script esté presente en la
    // página, no el momento exacto de su descarga.
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      const ric = (window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }).requestIdleCallback;
      if (ric) ric(() => void loadAdsenseScript(), { timeout: 4000 });
      else window.setTimeout(() => void loadAdsenseScript(), 2500);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener('load', start);
    };
  }, [pathname]);

  return null;
}
