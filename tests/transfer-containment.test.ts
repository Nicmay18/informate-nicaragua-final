import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guarda de deriva para la contención Fast Origin Transfer:
 * los feeds duplicados legacy deben redirigir a /feed.xml y el sitemap
 * debe ser ISR (no force-dynamic) para no renderizar ~188KB por request.
 */
const configSrc = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf-8');
const sitemapSrc = readFileSync(join(process.cwd(), 'app', 'sitemap.ts'), 'utf-8');

function hasRedirect(source: string, destination: string): boolean {
  // Matchea un bloque { source: 'X', destination: 'Y', permanent: true } en cualquier orden de líneas.
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `source:\\s*['"\`]${esc(source)}['"\`][\\s\\S]{0,200}?destination:\\s*['"\`]${esc(destination)}['"\`][\\s\\S]{0,200}?permanent:\\s*true`,
  );
  return re.test(configSrc);
}

describe('Contención Fast Origin Transfer — redirects de feeds duplicados', () => {
  it.each(['/api/rss', '/api/feed-xml', '/rss', '/feed'])(
    '%s redirige permanentemente a /feed.xml',
    (source) => {
      expect(hasRedirect(source, '/feed.xml')).toBe(true);
    },
  );

  it('/feed.xml NO está redirigido (sin ciclo)', () => {
    expect(hasRedirect('/feed.xml', '/feed.xml')).toBe(false);
    expect(hasRedirect('/feed.xml', '/rss')).toBe(false);
  });

  it('/feed.json (JSON Feed publicitado) no es redirigido', () => {
    expect(hasRedirect('/feed.json', '/feed.xml')).toBe(false);
  });
});

describe('Contención Fast Origin Transfer — sitemap ISR', () => {
  it('sitemap.ts usa revalidate, no force-dynamic', () => {
    expect(sitemapSrc).toContain('export const revalidate = 3600');
    expect(sitemapSrc).not.toContain("export const dynamic = 'force-dynamic'");
    expect(sitemapSrc).not.toContain('export const dynamic = "force-dynamic"');
  });
});
