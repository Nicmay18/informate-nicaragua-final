import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check for main heading
    await expect(page.locator('h1')).toBeVisible();

    // Check for navigation
    await expect(page.locator('nav')).toBeVisible();

    // Page should have title
    await expect(page).toHaveTitle(/Nicaragua|Informate/i);
  });

  test('should display news articles', async ({ page }) => {
    await page.goto('/');

    // Wait for articles to load
    const articles = page.locator('article');
    await expect(articles.first()).toBeVisible({ timeout: 5000 });

    // Count articles
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to article detail', async ({ page }) => {
    await page.goto('/');

    // Click first article link
    const articleLink = page.locator('article a').first();
    await articleLink.click();

    // Check we're on article page
    await expect(page.locator('h1')).toBeVisible();
    
    // URL should have changed
    expect(page.url()).not.toContain('/');
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');

    // Check for skip link (accessibility)
    const skipLink = page.locator('a[href="#content"]');
    await expect(skipLink).toHaveAttribute('class', /skip/i);

    // Check nav has proper aria labels
    const nav = page.locator('nav');
    await expect(nav).toHaveAttribute('aria-label', /navigation|main/i);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Menu should be present and accessible
    const mobileMenu = page.locator('[aria-label*="menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('nav')).toBeVisible();
    }
  });
});
