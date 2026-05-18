'use client';

import { useEffect, useState } from 'react';

interface LazySidebarProps {
  children: React.ReactNode;
}

export default function LazySidebar({ children }: LazySidebarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (window.requestIdleCallback) {
      const id = window.requestIdleCallback(() => setMounted(true), { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(() => setMounted(true), 1500);
      return () => window.clearTimeout(id);
    }
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
