declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: unknown[];
    adsbygoogle: unknown[];
  }
}

export {};
