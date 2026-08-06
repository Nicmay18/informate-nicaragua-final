import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const isProd = process.env.NODE_ENV === 'production';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: isProd ? 'production' : 'development',
    tracesSampleRate: isProd ? 0.1 : 1.0,
    beforeSend(event) {
      if (!isProd) return null;
      return event;
    },
  });
}
