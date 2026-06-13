'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">¡Oops!</h1>
          <p className="text-xl text-gray-600">Algo salió mal</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 font-mono">
            {error.message || 'Error desconocido'}
          </p>
          {error.digest && (
            <p className="text-xs text-red-600 mt-2">Error ID: {error.digest}</p>
          )}
        </div>

        <div className="space-y-3 pt-4">
          <button
            onClick={() => reset()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Intentar de nuevo
          </button>

          <Link
            href="/"
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition"
          >
            Volver al inicio
          </Link>
        </div>

        <p className="text-xs text-gray-500 pt-4">
          Si el problema persiste, contacta a soporte
        </p>
      </div>
    </div>
  );
}
