'use client';

import { useEffect, useRef } from 'react';

interface ThirdPartyConfig {
  gtmId?: string;
  adsClient?: string;
  fundingChoices?: boolean;
}

/**
 * Cola de eventos dataLayer que se flush una vez cargue GTM
 */
const dataLayerQueue: Array<Record<string, unknown>> = [];

function pushToDataLayer(obj: Record<string, unknown>) {
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).dataLayer) {
    ((window as unknown as Record<string, unknown>).dataLayer as Array<Record<string, unknown>>).push(obj);
  } else {
    dataLayerQueue.push(obj);
  }
}

function flushQueue() {
  if (typeof window === 'undefined') return;
  const dl = ((window as unknown as Record<string, unknown>).dataLayer as Array<Record<string, unknown>>) || [];
  while (dataLayerQueue.length) {
    const item = dataLayerQueue.shift();
    if (item) dl.push(item);
  }
}

/**
 * Carga un script externo de forma controlada
 */
function loadScript(src: string, id: string, async = true, defer = false): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.async = async;
    script.defer = defer;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

/**
 * Hook para cargar scripts de terceros de forma diferida:
 * 1. GTM: después de LCP
 * 2. Google Ads: 2s después de load o al hacer scroll
 * 3. FundingChoices: solo EU/EEA o delay 3s
 */
export default function useThirdPartyScripts(config: ThirdPartyConfig) {
  const gtmLoaded = useRef(false);
  const adsLoaded = useRef(false);
  const fcLoaded = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { gtmId, adsClient, fundingChoices } = config;
    if (!gtmId && !adsClient && !fundingChoices) return;

    // Inicializar dataLayer y gtag INMEDIATAMENTE (antes de cargar script externo)
    (window as unknown as Record<string, unknown>).dataLayer =
      ((window as unknown as Record<string, unknown>).dataLayer as Array<Record<string, unknown>>) || [];
    const gtag = function(...args: unknown[]) {
      ((window as unknown as Record<string, unknown>).dataLayer as Array<unknown>).push(args);
    };
    (window as unknown as Record<string, unknown>).gtag = gtag;

    // ─── 1. GTM después de LCP ───
    const loadGTM = () => {
      if (!gtmId || gtmLoaded.current) return;
      gtmLoaded.current = true;
      loadScript(
        `https://www.googletagmanager.com/gtag/js?id=${gtmId}`,
        'gtm-script',
        true,
        true
      ).then(() => {
        gtag('js', new Date());
        gtag('config', gtmId);
        flushQueue();
      });
    };

    // Detectar LCP
    if ('PerformanceObserver' in window) {
      const obs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          loadGTM();
          obs.disconnect();
        }
      });
      try {
        obs.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch {
        // Fallback: si no soporta LCP, cargar a los 2s
        setTimeout(loadGTM, 2000);
      }
    } else {
      setTimeout(loadGTM, 2000);
    }

    // ─── 2. Google Ads: 2s después de load O scroll ───
    const loadAds = () => {
      if (!adsClient || adsLoaded.current) return;
      adsLoaded.current = true;
      loadScript(
        `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`,
        'adsense-script',
        true,
        false
      ).then(() => {
        // Inicializar adsbygoogle array vacio; los componentes AdSlot/AdUnit hacen push individual
        const win = window as unknown as Record<string, unknown>;
        win.adsbygoogle = (win.adsbygoogle as Array<Record<string, unknown>>) || [];
      });
    };

    let adsTimer: ReturnType<typeof setTimeout> | null = null;
    const onWindowLoad = () => {
      adsTimer = setTimeout(loadAds, 2000);
    };
    const onScroll = () => {
      if (adsTimer) clearTimeout(adsTimer);
      loadAds();
      window.removeEventListener('scroll', onScroll);
    };

    if (document.readyState === 'complete') {
      onWindowLoad();
    } else {
      window.addEventListener('load', onWindowLoad, { once: true });
    }
    window.addEventListener('scroll', onScroll, { once: true, passive: true });

    // ─── 3. FundingChoices: EU/EEA detection o delay 3s ───
    const loadFC = () => {
      if (fcLoaded.current) return;
      fcLoaded.current = true;
      // Google Funding Choices (Consent Management)
      loadScript(
        'https://fundingchoicesmessages.google.com/i/24988088146?ers=1',
        'funding-choices',
        true,
        false
      ).catch(() => {
        // Silenciar errores si no está disponible
      });
    };

    // Detección simple de EU/EEA por timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const euTimezones = [
      'Europe/', 'Atlantic/Azores', 'Atlantic/Madeira', 'Atlantic/Canary'
    ];
    const isEU = euTimezones.some(prefix => tz.startsWith(prefix));

    if (isEU && fundingChoices) {
      // En EU cargar rápido (consent requerido)
      setTimeout(loadFC, 1000);
    } else if (fundingChoices) {
      // Fuera de EU delay mayor
      setTimeout(loadFC, 3000);
    }

    return () => {
      if (adsTimer) clearTimeout(adsTimer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [config.gtmId, config.adsClient, config.fundingChoices]);
}

export { pushToDataLayer, dataLayerQueue };
