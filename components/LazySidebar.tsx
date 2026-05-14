'use client';

import { useEffect, useState } from 'react';

interface LazySidebarProps {
  children: React.ReactNode;
}

export default function LazySidebar({ children }: LazySidebarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.requestIdleCallback
      ? window.requestIdleCallback(() => setMounted(true), { timeout: 1500 })
      : setTimeout(() => setMounted(true), 1500);

    return () => {
      if (typeof id === 'number') clearTimeout(id);
      else window.cancelIdleCallback(id);
    };
  }, []);

  // Placeholder que reserva el espacio visual para evitar CLS
  if (!mounted) {
    return (
      <aside
        aria-hidden="true"
        style={{
          minHeight: '800px',
          background: 'transparent',
        }}
      />
    );
  }

  return <aside>{children}</aside>;
}
