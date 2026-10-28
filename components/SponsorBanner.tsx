'use client';

import { useEffect, useRef } from 'react';
import { getOrCreateAnonymousSession } from '@/lib/observability/session';
import type { AuspiciadorPublico } from '@/lib/ads/auspiciadores';

interface Props {
  sponsor: AuspiciadorPublico;
  slug?: string;
}

function track(sponsorId: string, tipo: 'impresion' | 'clic', slug?: string) {
  const payload = JSON.stringify({ sponsorId, tipo, slug, sessionId: getOrCreateAnonymousSession() });
  try {
    const blob = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon?.('/api/telemetry/ads', blob)) return;
    fetch('/api/telemetry/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

/**
 * Banner discreto de auspiciador para artículos.
 * Estilos inline (convención de ArticlePage), altura reservada (no CLS),
 * rel="sponsored" para integridad SEO. La impresión se cuenta una sola
 * vez cuando el banner entra al viewport ≥50%.
 */
export default function SponsorBanner({ sponsor, slug }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || sentRef.current) return;
    const fire = () => {
      if (sentRef.current) return;
      sentRef.current = true;
      track(sponsor.id, 'impresion', slug);
    };
    if (typeof IntersectionObserver !== 'function') {
      fire();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && fire(),
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [sponsor.id, slug]);

  return (
    <div
      ref={rootRef}
      data-sponsor={sponsor.id}
      style={{
        margin: '12px auto 4px',
        maxWidth: 560,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '4px 14px',
        background: 'var(--bg-secondary, #f9fafb)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 8,
        fontSize: 12,
        color: '#6b7280',
      }}
    >
      <span style={{ flexShrink: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
        Auspiciado por
      </span>
      <a
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => track(sponsor.id, 'clic', slug)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, color: '#1e293b', fontWeight: 600, textDecoration: 'none' }}
      >
        <img
          src={sponsor.logoUrl}
          alt={sponsor.nombre}
          width={110}
          height={34}
          loading="lazy"
          decoding="async"
          style={{ height: 34, width: 'auto', maxWidth: 110, objectFit: 'contain' }}
        />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{sponsor.nombre}</span>
      </a>
    </div>
  );
}
