import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProd = process.env.NODE_ENV === 'production';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: isProd ? 'production' : 'development',
    tracesSampleRate: isProd ? 0.1 : 1.0,
    profilesSampleRate: isProd ? 0.1 : 1.0,
    replaysSessionSampleRate: isProd ? 0.01 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'Non-Error promise rejection captured',
    ],
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /googletagmanager\.com/i,
      /google-analytics\.com/i,
      /pagead2\.googlesyndication\.com/i,
      /quge5\.com/i,
    ],
    beforeSend(event) {
      if (!isProd) return null;
      if (event.request?.url) {
        event.tags = { ...event.tags, route: event.request.url };
      }
      return event;
    },
  });
}
