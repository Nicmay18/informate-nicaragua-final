/**
 * MÓDULO 4: API Error Handler — Nicaragua Informate
 * Middleware/Wrapper para atrapar errores en Route Handlers antes de que
 * afecten la indexación de agregadores o causen 500 sin contexto.
 *
 * Uso:
 *   import { withErrorHandler } from '@/lib/api-error-handler';
 *
 *   export const GET = withErrorHandler(async (request) => {
 *     // tu lógica de route handler
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';

type RouteHandler = (request: NextRequest) => Promise<NextResponse>;

interface ErrorResponse {
  error: string;
  detail?: string;
  timestamp: string;
  path: string;
}

/**
 * Wrapper que captura cualquier excepción lanzada dentro del handler
 * y retorna una respuesta JSON estructurada sin exponer datos sensibles.
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      const isDev = process.env.NODE_ENV === 'development';
      const errMessage = error instanceof Error ? error.message : 'Error desconocido';

      // Log estructurado para Vercel Logs / Datadog / Splunk
      console.error('[api-error-handler]', {
        method: request.method,
        path: request.nextUrl.pathname,
        error: errMessage,
        stack: isDev && error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      const response: ErrorResponse = {
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString(),
        path: request.nextUrl.pathname,
      };

      // Solo en desarrollo exponemos el detalle real
      if (isDev) {
        response.detail = errMessage;
      }

      return NextResponse.json(response, { status: 500 });
    }
  };
}

/**
 * Wrapper para métodos que requieren autenticación por token secreto.
 * Valida el header 'x-cron-secret' contra CRON_SECRET_TOKEN.
 */
export function withCronSecret(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest): Promise<NextResponse> => {
    const secret = process.env.CRON_SECRET_TOKEN;
    const headerSecret = request.headers.get('x-cron-secret');

    if (!secret || headerSecret !== secret) {
      return NextResponse.json(
        { error: 'Unauthorized: token inválido o no configurado' },
        { status: 401 }
      );
    }

    return handler(request);
  };
}

/**
 * Wrapper combinado: autenticación + manejo de errores.
 * Ideal para cron jobs y endpoints administrativos.
 */
export function withProtectedHandler(handler: RouteHandler): RouteHandler {
  return withErrorHandler(withCronSecret(handler));
}
