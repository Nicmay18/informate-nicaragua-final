'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const SESSION_STORAGE_KEY = 'ni_session_id';
const SESSION_TIMESTAMP_KEY = 'ni_session_ts';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min

function getOrCreateAnonymousSession(): string {
  if (typeof window === 'undefined') return '';
  try {
    const now = Date.now();
    const storedId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const storedTs = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);

    if (storedId && storedTs && now - parseInt(storedTs, 10) < SESSION_TIMEOUT_MS) {
      sessionStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString());
      return storedId;
    }

    const newId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `s-${now}-${Math.random().toString(36).slice(2, 9)}`;

    sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
    sessionStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString());
    return newId;
  } catch {
    return `s-fallback-${Date.now()}`;
  }
}

export default function JourneyTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const fullPath = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    if (lastTrackedPath.current === fullPath) return;
    lastTrackedPath.current = fullPath;

    const sessionId = getOrCreateAnonymousSession();
    const isArticle = pathname.startsWith('/noticias/');
    const articleSlug = isArticle ? pathname.replace('/noticias/', '').replace(/\/$/, '') : undefined;
    const isSearch = pathname.startsWith('/buscar') || !!searchParams?.get('q');
    const query = searchParams?.get('q') || undefined;

    const payload = {
      sessionId,
      type: isArticle ? 'ARTICLE_VIEW' : isSearch ? 'SEARCH' : 'PAGE_VIEW',
      path: pathname,
      articleSlug,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      utmSource: searchParams?.get('utm_source') || undefined,
      metadata: query ? { query } : undefined,
    };

    try {
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/telemetry/journey', blob);
      } else {
        void fetch('/api/telemetry/journey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      }
    } catch {
      // Non-blocking
    }
  }, [pathname, searchParams]);

  return null;
}
