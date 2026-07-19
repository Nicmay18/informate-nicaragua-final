/**
 * Verificaciones de seguridad para AdSense (rutas y patrocinio).
 * Lógica pura, sin re-procesamiento de artículos.
 */

const blockedPaths = ['/sucesos', '/cronica-roja', '/policiales', '/accidentes', '/crimen'];

export function isAdsenseSafePath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  return !blockedPaths.some((bp) => p.startsWith(bp));
}
