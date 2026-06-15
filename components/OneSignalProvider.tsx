'use client';

import Script from 'next/script';
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
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal) {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        notifyButton: { enable: false },
        allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
      });
    });
  }, []);

  return (
    <Script
      id="onesignal-sdk"
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
    />
  );
}
