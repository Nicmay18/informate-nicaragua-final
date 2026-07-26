/**
 * Utilidad pura para escapar JSON-LD antes de inyectarlo como script ld+json.
 * Separada intencionalmente de lib/sanitize.ts para evitar cargar jsdom/DOMPurify
 * en los Server Components.
 */
export function escapeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
