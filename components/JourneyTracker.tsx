'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const SESSION_STORAGE_KEY = 'ni_session_id';
const SESSION_TIMESTAMP_KEY = 'ni_session_ts';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min
const SCROLL_DEBOUNCE_MS = 1000;
const ENGAGEMENT_INTERVAL_MS = 1000;

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

function sendEvent(payload: Record<string, unknown>): void {
  try {
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/telemetry/journey', blob);
    } else if (typeof fetch !== 'undefined') {
      void fetch('/api/telemetry/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  } catch {
    // Telemetry nunca debe bloquear la experiencia del lector
  }
}

function getArticleSlug(pathname: string): string | undefined {
  if (!pathname.startsWith('/noticias/')) return undefined;
  return pathname.replace('/noticias/', '').replace(/\/$/, '');
}

function getCategory(pathname: string): string | undefined {
  if (!pathname.startsWith('/categoria/')) return undefined;
  return pathname.replace('/categoria/', '').split('/')[0] || undefined;
}

function classifyClickType(href: string, currentPathname: string): 'RELATED_CLICK' | 'INTERNAL_CLICK' | 'EXTERNAL_REFERRAL' | undefined {
  if (!href) return undefined;
  const host = typeof window !== 'undefined' ? window.location.host : '';
  if (href.startsWith('http') && !href.includes(host)) return 'EXTERNAL_REFERRAL';
  const currentArticle = getArticleSlug(currentPathname);
  const targetArticle = getArticleSlug(href);
  if (currentArticle && targetArticle && targetArticle !== currentArticle) return 'RELATED_CLICK';
  if (href.startsWith('/') || (href.startsWith('http') && href.includes(host))) return 'INTERNAL_CLICK';
  return undefined;
}

export default function JourneyTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);
  const engagedMs = useRef(0);
  const visibleSince = useRef<number | null>(null);
  const scrollFired = useRef<Record<number, boolean>>({});
  const sessionId = useRef<string>('');

  // Page view / article view / category view / search
  useEffect(() => {
    if (!pathname) return;
    const fullPath = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    if (lastTrackedPath.current === fullPath) return;
    lastTrackedPath.current = fullPath;

    sessionId.current = getOrCreateAnonymousSession();
    const isNewSession = !sessionStorage.getItem(SESSION_STORAGE_KEY + '_started');
    if (isNewSession) {
      sendEvent({
        sessionId: sessionId.current,
        type: 'SESSION_START',
        path: pathname,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        utmSource: searchParams?.get('utm_source') || undefined,
      });
      sessionStorage.setItem(SESSION_STORAGE_KEY + '_started', '1');
    }

    const articleSlug = getArticleSlug(pathname);
    const category = getCategory(pathname);
    const isSearch = pathname.startsWith('/buscar') || !!searchParams?.get('q');
    const query = searchParams?.get('q') || undefined;

    const type = articleSlug ? 'ARTICLE_VIEW' : category ? 'CATEGORY_VIEW' : isSearch ? 'SEARCH' : 'PAGE_VIEW';
    const metadata: Record<string, unknown> = {};
    if (query) metadata.query = query;
    if (category) metadata.clickTargetCategory = category;

    sendEvent({
      sessionId: sessionId.current,
      type,
      path: pathname,
      articleSlug,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      utmSource: searchParams?.get('utm_source') || undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });
  }, [pathname, searchParams]);

  // Click tracking
  useEffect(() => {
    if (typeof document === 'undefined') return;

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor || !anchor.href) return;

      const href = anchor.getAttribute('href') || '';
      const type = classifyClickType(href, pathname || '/');
      if (!type) return;

      const metadata: Record<string, unknown> = { clickTarget: href };
      if (type === 'RELATED_CLICK') {
        const slug = getArticleSlug(href);
        if (slug) metadata.clickTargetArticleSlug = slug;
      }
      if (type === 'INTERNAL_CLICK' && href.startsWith('/categoria/')) {
        const cat = getCategory(href);
        if (cat) metadata.clickTargetCategory = cat;
      }

      sendEvent({
        sessionId: sessionId.current,
        type,
        path: pathname || '/',
        articleSlug: getArticleSlug(pathname || ''),
        metadata,
      });
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  // Scroll depth
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let timeout: ReturnType<typeof setTimeout> | null = null;
    const thresholds = [25, 50, 75, 90, 100];

    function handleScroll() {
      if (timeout) return;
      timeout = setTimeout(() => {
        timeout = null;
        if (typeof document === 'undefined') return;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) return;
        const depth = Math.round((scrollTop / docHeight) * 100);

        thresholds.forEach(t => {
          if (depth >= t && !scrollFired.current[t]) {
            scrollFired.current[t] = true;
            sendEvent({
              sessionId: sessionId.current,
              type: 'SCROLL_DEPTH',
              path: pathname || '/',
              articleSlug: getArticleSlug(pathname || ''),
              metadata: { scrollDepth: depth, scrollThreshold: t },
            });
          }
        });
      }, SCROLL_DEBOUNCE_MS);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Engagement (visible time)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        engagedMs.current += ENGAGEMENT_INTERVAL_MS;
      }
    }, ENGAGEMENT_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        visibleSince.current = Date.now();
      } else if (visibleSince.current) {
        const visibleMs = Date.now() - visibleSince.current;
        visibleSince.current = null;
        sendEvent({
          sessionId: sessionId.current,
          type: 'ENGAGEMENT',
          path: pathname || '/',
          articleSlug: getArticleSlug(pathname || ''),
          metadata: { engagedMs: engagedMs.current, visibleMs },
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    visibleSince.current = Date.now();

    function handleBeforeUnload() {
      sendEvent({
        sessionId: sessionId.current,
        type: 'SESSION_END',
        path: pathname || '/',
        articleSlug: getArticleSlug(pathname || ''),
        metadata: { engagedMs: engagedMs.current },
      });
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname]);

  return null;
}
