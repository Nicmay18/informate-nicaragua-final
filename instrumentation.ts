import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Sin este hook, Next.js 15 no reenvía los errores de request de
// React Server Components a Sentry (warning "Missing onRequestError"
// en el build). Exportarlo activa la captura.
export const onRequestError = Sentry.captureRequestError;
