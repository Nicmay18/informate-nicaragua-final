'use client';

import { useEffect, useState, useRef } from 'react';

interface LazySectionProps {
  children: React.ReactNode;
  id?: string;
  rootMargin?: string;
  minHeight?: string;
}

export default function LazySection({
  children,
  id = 'lazy-section',
  rootMargin = '200px',
  minHeight = '800px',
}: LazySectionProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Si el elemento ya está en viewport al montar, mostrar inmediatamente
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 200) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} id={id} style={{ minHeight: visible ? undefined : minHeight }}>
      {visible ? children : <div aria-hidden="true" />}
    </div>
  );
}
