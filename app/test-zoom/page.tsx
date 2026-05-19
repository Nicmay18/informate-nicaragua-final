import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function TestZoomPage() {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body>
        <h1>Hola</h1>
        <p>Esta es una página de prueba de aislamiento para diagnóstico de zoom.</p>
        <p>Font-size base: 16px</p>
      </body>
    </html>
  );
}
