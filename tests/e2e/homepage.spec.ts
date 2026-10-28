import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check for main heading
    await expect(page.locator('h1')).toBeVisible();

    // Page should have title
    await expect(page).toHaveTitle(/Nicaragua|Informate/i);
  });

  test('should display news articles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    const articles = page.locator('article');
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to article detail', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    const articleLink = page.locator('article a').first();
    const expectedPath = new URL(await articleLink.getAttribute('href') || '', page.url()).pathname;
    expect(expectedPath).not.toBe('/');
    await articleLink.click();

    // Check we're on article page
    await expect(page.locator('h1')).toBeVisible();

    // URL should have changed
    await expect(page).toHaveURL(new RegExp(`${expectedPath}$`));
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');

    // Check for skip link (accessibility) — el ancla real del sitio es #main-content
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toHaveAttribute('class', /skip/i);

    // Check nav has proper aria labels
    const nav = page.locator('header nav').first();
    await expect(nav).toHaveAttribute('aria-label', /navigation|main|Navegación/i);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // El nav principal se oculta en móvil; la navegación vive tras el botón hamburguesa
    const hamburger = page.locator('.ni-hamburger');
    await expect(hamburger).toBeVisible();
    await hamburger.click();
    await expect(page.locator('.ni-mobile-menu__nav')).toBeVisible();
  });
});
