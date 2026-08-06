'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { logger } from '@/lib/logger';

const WEB_VITALS_METRICS = ['LCP', 'CLS', 'INP', 'FCP', 'TTFB'] as const;

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (!WEB_VITALS_METRICS.includes(metric.name as typeof WEB_VITALS_METRICS[number])) return;

    const value = metric.name === 'CLS' ? metric.value * 100 : metric.value;
    const rounded = Math.round(value);

    if (typeof window !== 'undefined') {
      const win = window as unknown as { gtag?: (...args: unknown[]) => void };
      if (typeof win.gtag === 'function') {
        win.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: rounded,
          non_interaction: true,
          metric_rating: metric.rating,
        });
      }
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[Web Vitals] ${metric.name}: ${rounded} (${metric.rating})`);
    }
  });

  return null;
}
