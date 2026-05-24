'use client';

import { useEffect, useState } from 'react';

type CookiePrefs = { analytics: boolean; ads: boolean };

export default function ConsentScript() {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ni_cookie_consent');
    setConsent(saved);

    const handler = () => {
      const updated = localStorage.getItem('ni_cookie_consent');
      setConsent(updated);
    };

    window.addEventListener('ni-consent-updated', handler);
    return () => window.removeEventListener('ni-consent-updated', handler);
  }, []);

  useEffect(() => {
    if (consent !== 'accepted') return;

    const prefsRaw = localStorage.getItem('ni_cookie_preferences');
    let shouldLoadAds = true;
    let shouldLoadAnalytics = true;
    if (prefsRaw) {
      try {
        const prefs = JSON.parse(prefsRaw) as CookiePrefs;
        shouldLoadAds = !!prefs.ads;
        shouldLoadAnalytics = !!prefs.analytics;
      } catch {
        shouldLoadAds = true;
        shouldLoadAnalytics = true;
      }
    }

    // Cargar AdSense si aceptó publicidad
    if (shouldLoadAds) {
      const adsId = 'adsbygoogle-script';
      if (!document.getElementById(adsId)) {
        const script = document.createElement('script');
        script.id = adsId;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4115203339551838';
        document.head.appendChild(script);
      }
    }

    // Cargar GA4 si aceptó analítica
    if (shouldLoadAnalytics) {
      const gtagId = 'gtag-script';
      if (!document.getElementById(gtagId)) {
        const script = document.createElement('script');
        script.id = gtagId;
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-W1B5J61WEP';
        document.head.appendChild(script);

        // Inicializar gtag
        const initScript = document.createElement('script');
        initScript.id = 'gtag-init';
        initScript.textContent = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-W1B5J61WEP', {
            send_page_view: true,
            page_path: window.location.pathname,
            cookie_flags: 'SameSite=None;Secure'
          });
        `;
        document.head.appendChild(initScript);
      }
    }
  }, [consent]);

  return null;
}
