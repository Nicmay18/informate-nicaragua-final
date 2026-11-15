import { test, expect, type Page } from '@playwright/test';

/**
 * Guardia AdSense en navegación SPA (cierre PR #39, punto 1 del reviewer).
 *
 * Cubre:
 * - Acceso directo a artículo sensible: meta adsense-block + sin unidades.
 * - SPA portada → artículo sensible: aunque adsbygoogle.js ya esté cargado,
 *   la guardia elimina/oculta cualquier formato automático insertado.
 * - SPA artículo normal → artículo sensible.
 * - Control: artículo normal sí conserva sus unidades manuales.
 *
 * Los slugs apuntan a artículos reales publicados (verificados en Firestore).
 */

const SENSITIVE_SLUG = 'lucho-diez-dias-por-su-vida-y-fallecio-tras-ataque-de-expareja';
const NORMAL_SLUG = 'mundial-2030-por-que-habra-partidos-en-sudamerica-y-europa';
const SENSITIVE_URL = `/noticias/${SENSITIVE_SLUG}`;
const NORMAL_URL = `/noticias/${NORMAL_SLUG}`;

const AD_SELECTORS = [
  'ins.adsbygoogle',
  'iframe[id^="aswift"]',
  'iframe[id^="google_ads"]',
  'div[id^="google_ads_iframe"]',
];

async function visibleAdCount(page: Page): Promise<number> {
  return page.evaluate((sels) => {
    let n = 0;
    for (const sel of sels) {
      document.querySelectorAll(sel).forEach((el) => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (r.width > 0 && r.height > 0 && style.display !== 'none' && style.visibility !== 'hidden') n++;
      });
    }
    return n;
  }, AD_SELECTORS);
}

/** Navegación SPA real: inserta un <a> same-origin y hace click — el router
 * de App Router lo intercepta igual que un next/link. */
async function spaNavigate(page: Page, href: string) {
  await page.evaluate((target) => {
    const a = document.createElement('a');
    a.href = target;
    a.textContent = 'spa-nav';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, href);
  await page.waitForURL(`**${href}**`, { timeout: 15000 });
}

test.describe('AdSense — seguridad en rutas y navegación SPA', () => {
  test('acceso directo a noticia sensible: meta block + cero unidades', async ({ page }) => {
    await page.goto(SENSITIVE_URL, { waitUntil: 'networkidle' });
    await expect(page.locator('meta[name="adsense-block"][content="true"]')).toHaveCount(1);
    await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
    // Esperar margen para que Auto ads (si el script cargó por otra razón)
    // tenga oportunidad de insertar; la guardia debe mantenerlo en cero.
    await page.waitForTimeout(2500);
    expect(await visibleAdCount(page)).toBe(0);
  });

  test('portada → noticia sensible por SPA: sin anuncios visibles', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Dar tiempo a que AdSenseGlobal cargue el script (load + idle).
    await page.waitForTimeout(3000);
    const scriptCount = await page.locator('script#ni-adsense-script').count();
    expect(scriptCount).toBeLessThanOrEqual(1); // como máximo una carga

    await spaNavigate(page, SENSITIVE_URL);
    await expect(page.locator('meta[name="adsense-block"][content="true"]')).toHaveCount(1);
    await page.waitForTimeout(2500);
    expect(await visibleAdCount(page)).toBe(0);
    await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
  });

  test('artículo normal → noticia sensible por SPA: sin anuncios visibles', async ({ page }) => {
    await page.goto(NORMAL_URL, { waitUntil: 'networkidle' });
    // Control: el artículo normal SÍ tiene unidades manuales.
    await expect(page.locator('ins.adsbygoogle').first()).toBeAttached();

    await spaNavigate(page, SENSITIVE_URL);
    await expect(page.locator('meta[name="adsense-block"][content="true"]')).toHaveCount(1);
    await page.waitForTimeout(2500);
    expect(await visibleAdCount(page)).toBe(0);
    await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
  });

  test('artículo normal conserva unidades y script único', async ({ page }) => {
    await page.goto(NORMAL_URL, { waitUntil: 'networkidle' });
    await expect(page.locator('meta[name="adsense-block"]')).toHaveCount(0);
    const units = await page.locator('ins.adsbygoogle').count();
    expect(units).toBeGreaterThanOrEqual(1);
    await page.waitForTimeout(3000);
    expect(await page.locator('script#ni-adsense-script').count()).toBe(1);
  });

  test('ruta privada no monetizable: sin script ni unidades', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    expect(await page.locator('script#ni-adsense-script').count()).toBe(0);
    expect(await visibleAdCount(page)).toBe(0);
  });
});
