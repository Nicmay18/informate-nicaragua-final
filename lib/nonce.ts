/**
 * CSP nonce — dormido por decisión de arquitectura (audit P1-06).
 *
 * ANTES: llamaba headers() para leer x-nonce del middleware. Eso convertía
 * TODAS las páginas en dynamic rendering (sin ISR, TTFB alto en cada request).
 *
 * REALIDAD VERIFICADA: el CSP en middleware.ts declara
 * `script-src 'self' 'unsafe-inline' ...` — sin ningún token `nonce-`.
 * Con unsafe-inline presente y sin nonce en la política, los scripts inline
 * se ejecutan igual y el atributo nonce="" no aporta protección adicional.
 *
 * DECISIÓN: getCspNonce() devuelve '' sin tocar headers() → las páginas
 * públicas vuelven a ser estáticas/ISR (revalidate 300/3600 intacto).
 * El middleware sigue generando x-nonce por si el CSP migra a política
 * basada en nonce — en ese caso hay que reactivar este read y aceptar
 * el rendering dinámico consecuente.
 */
export async function getCspNonce(): Promise<string> {
  return '';
}
