import { defineConfig, devices } from '@playwright/test';

// npm run build && npx playwright test -c playwright.negocios.config.ts
// Base en memoria; nunca usar este harness para un despliegue.
process.env.NEGOCIOS_TEST_FIXTURE = '1';
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'negocios.spec.ts',
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/negocios', open: 'never' }]],
  use: { baseURL: 'http://localhost:3000', screenshot: 'only-on-failure', trace: 'retain-on-failure',
    userAgent: 'Mozilla/5.0 (Negocios local acceptance test)' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], userAgent: 'Mozilla/5.0 (Negocios local acceptance test)' } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'node --require ./tests/fixtures/negocios-server.cjs node_modules/next/dist/bin/next start -H localhost -p 3000',
    url: 'http://localhost:3000/negocios/alta',
    reuseExistingServer: false,
    env: { NEGOCIOS_TEST_FIXTURE: '1' },
    timeout: 120_000,
  },
});
