/**
 * Logger controlado para producción.
 * En Vercel (NODE_ENV=production), solo logea errores críticos.
 * En desarrollo, logea todo.
 *
 * Uso: import { log } from '@/lib/logger';
 *        log.info('mensaje'); // silenciado en prod
 *        log.error('mensaje'); // siempre visible
 */

const isProd = process.env.NODE_ENV === 'production';
const isSilent = isProd || process.env.DISABLE_LOGS === '1';

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
    // Errores siempre se loguean, incluso en prod
    console.error(...args);
  },
};
