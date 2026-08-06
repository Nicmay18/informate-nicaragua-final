/**
 * Logger controlado para producción con integración Sentry.
 * En Vercel (NODE_ENV=production), solo logea errores críticos.
 * En desarrollo, logea todo.
 *
 * Uso: import { logger } from '@/lib/logger';
 *        logger.info('mensaje'); // silenciado en prod
 *        logger.error('mensaje'); // siempre visible + Sentry
 */

const isProd = process.env.NODE_ENV === 'production';
const isSilent = isProd || process.env.DISABLE_LOGS === '1';

async function captureSentry(level: string, message: string, context?: Record<string, unknown>) {
  if (!isProd) return;
  try {
    const Sentry = await import('@sentry/nextjs');
    if (level === 'error') {
      Sentry.captureMessage(message, {
        level: 'error',
        tags: context?.tags as Record<string, string> | undefined,
        extra: context?.extra as Record<string, unknown> | undefined,
      });
    } else if (level === 'warn') {
      Sentry.captureMessage(message, {
        level: 'warning',
        tags: context?.tags as Record<string, string> | undefined,
      });
    }
  } catch {
    // Sentry not initialized — silent
  }
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (!isSilent) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (!isSilent) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (!isSilent) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
    const message = args.map(a => a instanceof Error ? a.message : String(a)).join(' ');
    void captureSentry('error', message);
  },
  errorWithContext: (message: string, context: { endpoint?: string; adminUid?: string; extra?: Record<string, unknown> }) => {
    console.error(`[${context.endpoint || 'unknown'}] ${message}`, context.extra || '');
    void captureSentry('error', message, {
      tags: { endpoint: context.endpoint || 'unknown' },
      extra: { adminUid: context.adminUid, ...context.extra },
    });
  },
};
