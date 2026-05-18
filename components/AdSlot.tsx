'use client';

import { useEffect, useRef, useState } from 'react';

interface AdSlotProps {
  slot: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adsbygoogle: any[];
  }
}

export default function AdSlot({
  slot,
  width = 336,
  height = 280,
  className = '',
  style = {},
  format = 'auto',
}: AdSlotProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || pushed.current || !containerRef.current) return;
    
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({});
        pushed.current = true;
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
    
    const t = setTimeout(() => setLoaded(true), 3000);
    return () => clearTimeout(t);
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className={`ad-slot ${className || ''}`}
      style={{
        position: 'relative',
        minHeight: format === 'horizontal' ? 90 : height,
        minWidth: width,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: loaded ? 'transparent' : '#f9fafb',
        border: loaded ? 'none' : '1px solid #e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
        ...style,
      }}
    >
      <span className="ad-label">Publicidad</span>
      {isVisible && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight: format === 'horizontal' ? 90 : height }}
          data-ad-client="ca-pub-4115203339551838"
          data-ad-format={format}
          data-full-width-responsive="true"
          {...(/^\d+$/.test(slot) ? { 'data-ad-slot': slot } : {})}
        />
      )}
    </div>
  );
}
