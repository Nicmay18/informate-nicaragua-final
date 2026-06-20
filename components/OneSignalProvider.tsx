'use client';

import { useEffect } from 'react';

const ONESIGNAL_APP_ID = '608354d3-fd2a-4c97-b055-5c14b57bbe9b';

declare global {
  interface Window {
    OneSignalDeferred: Array<(oneSignal: {
      init: (config: Record<string, unknown>) => Promise<void>;
    }) => void>;
  }
}

export default function OneSignalProvider() {
  useEffect(() => {
    const initOneSignal = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal) {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          notifyButton: { enable: false },
          allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
        });
      });
    };

    const loadScript = () => {
      if (document.getElementById('onesignal-sdk')) return;
      const script = document.createElement('script');
      script.id = 'onesignal-sdk';
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      script.onload = initOneSignal;
      document.body.appendChild(script);
    };

    // Retrasar 5s para no afectar TBT/Lighthouse
    const timer = setTimeout(loadScript, 5000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
