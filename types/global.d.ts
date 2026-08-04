declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: unknown[];
    adsbygoogle: unknown[];
  }
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

export {};
