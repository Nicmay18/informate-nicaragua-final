'use client';

import { useEffect, useRef } from 'react';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
}

export default function AdUnit({ slot, format = 'auto', style = {} }: AdUnitProps) {
  const ref = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (!ref.current) return;
    if (typeof window === 'undefined') return;

    try {
      ref.current.innerHTML = '';

      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', 'ca-pub-4115203339551838');
      ins.setAttribute('data-ad-slot', slot);
      ins.setAttribute('data-ad-format', format);
      ins.setAttribute('data-full-width-responsive', 'true');

      ref.current.appendChild(ins);

      if ((window as any).adsbygoogle) {
        (window as any).adsbygoogle.push({});
      }

      initialized.current = true;
    } catch (e) {
      console.error('Ad error:', e);
    }
  }, [slot, format]);

  return (
    <div
      ref={ref}
      style={{ minHeight: '100px', ...style }}
      suppressHydrationWarning
    />
  );
}
