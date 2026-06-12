'use client';

import { useEffect, useRef } from 'react';
import { isAdsenseSafePath } from '@/lib/adsense-guard';

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

    // ─── 2. Google Ads: SOLO al scroll (nunca automático) ───
    const loadAds = () => {
      // Exclusión centralizada vía adsense-guard (import estático al tope del archivo)
      const path = window.location.pathname.toLowerCase();
      if (!isAdsenseSafePath(path)) {
        console.log('[AdSense] Bloqueado en:', path);
        return;
      }
      if (!adsClient || adsLoaded.current) return;
      adsLoaded.current = true;
      loadScript(
        `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`,
        'adsense-script',
        true,
        true  // defer=true para no bloquear parseo
      ).then(() => {
        // Inicializar adsbygoogle array vacio para futuros slots (post-aprobacion AdSense)
        const win = window as unknown as Record<string, unknown>;
        win.adsbygoogle = (win.adsbygoogle as Array<Record<string, unknown>>) || [];
      });
    };

    const onScroll = () => {
      loadAds();
      window.removeEventListener('scroll', onScroll);
    };

    window.addEventListener('scroll', onScroll, { once: true, passive: true });

    // ─── 3. FundingChoices: SOLO al scroll o click (nunca automático) ───
    const loadFC = () => {
      if (fcLoaded.current) return;
      fcLoaded.current = true;
      // Google Funding Choices (Consent Management)
      loadScript(
        'https://fundingchoicesmessages.google.com/i/24988088146?ers=1',
        'funding-choices',
        true,
        true  // defer=true
      ).catch(() => {
        // Silenciar errores si no está disponible
      });
    };

    const onUserInteraction = () => {
      if (fcLoaded.current) return;
      loadFC();
      window.removeEventListener('scroll', onUserInteraction);
      window.removeEventListener('click', onUserInteraction);
    };

    if (fundingChoices) {
      window.addEventListener('scroll', onUserInteraction, { once: true, passive: true });
      window.addEventListener('click', onUserInteraction, { once: true });
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onUserInteraction);
      window.removeEventListener('click', onUserInteraction);
    };
  }, [config.gtmId, config.adsClient, config.fundingChoices]);
}

export { pushToDataLayer, dataLayerQueue };
