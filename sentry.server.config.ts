import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const isProd = process.env.NODE_ENV === 'production';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: isProd ? 'production' : 'development',
    tracesSampleRate: isProd ? 0.1 : 1.0,
    profilesSampleRate: isProd ? 0.1 : 1.0,
    integrations: [
      Sentry.extraErrorDataIntegration(),
    ],
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ETIMEDOUT',
      'ECONNRESET',
    ],
    beforeSend(event) {
      if (!isProd) return null;
      if (event.request?.url) {
        event.tags = { ...event.tags, endpoint: event.request.url };
      }
      if (event.extra?.adminUid) {
        event.tags = { ...event.tags, adminUser: String(event.extra.adminUid) };
        delete event.extra.adminUid;
      }
      return event;
    },
  });
}
