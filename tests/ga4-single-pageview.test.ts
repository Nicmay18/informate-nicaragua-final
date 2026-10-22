/**
 * Regresión: doble page_view en navegación SPA.
 *
 * El stream GA4 tiene `pageChangesEnabled: true` (verificado vía Admin API,
 * auditoría P0.5) — la medición mejorada ya emite page_view por history change.
 * Montar `components/Analytics` además enviaba un segundo evento manual con el
 * mismo `dl` por cada navegación interna (verificado con captura de red en
 * producción). layout.tsx no debe montar ningún tracker SPA manual.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const layout = readFileSync(resolve(__dirname, '../app/layout.tsx'), 'utf8');

describe('GA4 — un solo page_view por navegación', () => {
  it('layout.tsx no monta un tracker SPA manual (<Analytics />)', () => {
    expect(layout).not.toContain('<Analytics');
    expect(layout).not.toMatch(/import\s+Analytics\s+from/);
  });

  it('layout.tsx inicializa gtag exactamente una vez', () => {
    expect(layout.match(/gtag\/js\?id=/g)).toHaveLength(1);
    expect(layout.match(/gtag\('config'/g)).toHaveLength(1);
  });

  it('components/DeferredAnalytics sigue sin montarse (segundo loader)', () => {
    expect(layout).not.toContain('DeferredAnalytics');
    expect(layout).not.toContain('ThirdPartyScripts');
  });
});
