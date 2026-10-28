import { test, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';

test('formulario público y acceso administrativo protegido', async ({ page, request }) => {
  await page.goto('/negocios/alta');
  await expect(page.getByRole('heading', { name: 'Registrá tu negocio' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar para revisión' })).toBeVisible();
  expect((await request.get('/api/admin/negocios')).status()).toBe(401);
  await page.goto('/admin/negocios');
  await expect(page).toHaveURL(/\/login/);
});

test('solicitud → moderación → pago → contacto → reporte (base local en memoria)', async ({ page, context, request }, testInfo) => {
  test.skip(process.env.NEGOCIOS_TEST_FIXTURE !== '1', 'Requiere el servidor aislado de fixtures; nunca escribir en un preview conectado a producción');
  test.setTimeout(120_000);
  const name = `Negocio de prueba ${testInfo.project.name} ${Date.now()}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const admin = { 'x-admin-token': 'negocios-local-fixture-only' };
  // Bloquea navegación externa: el clic en WhatsApp se prueba sin contactar.
  await context.route('**/*', route => {
    const host = new URL(route.request().url()).hostname;
    return ['localhost', '127.0.0.1'].includes(host) ? route.continue() : route.abort();
  });
  await page.goto('/negocios/alta');
  await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
  await page.getByLabel('Nombre del negocio').fill(name);
  await page.getByLabel('Descripción', { exact: false }).fill('Datos sintéticos exclusivos para verificar el flujo comercial local.');
  await page.getByLabel('Categoría', { exact: true }).selectOption('Comercio y tiendas');
  await page.getByLabel('Departamento', { exact: true }).selectOption('Managua');
  await page.getByLabel('WhatsApp (solo dígitos con código de país)').fill('50500000000');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Enviar para revisión' }).click();
  await expect(page.getByText('¡Gracias!')).toBeVisible();
  const requests = await (await request.get('/api/admin/negocios-solicitudes', { headers: admin })).json();
  const pending = requests.items.find((r: any) => r.datos.nombre === name);
  expect(pending.estado).toBe('pendiente');

  const payload = `${Date.now() + 60_000}.${Buffer.from('admin@example.test').toString('base64url')}`;
  const signedSession = `${payload}.${createHmac('sha256', 'negocios-local-signing-only').update(payload).digest('hex')}`;
  await context.addCookies([{ name: 'admin_session', value: signedSession, url: 'http://localhost:3000', httpOnly: true, sameSite: 'Strict' }]);
  await page.goto('/admin/negocios');
  await page.getByRole('button', { name: 'Solicitudes', exact: true }).click();
  const card = page.locator('.negocios-records article').filter({ hasText: name });
  await card.getByRole('button', { name: 'Preparar perfil para revisión' }).click();
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue(name);
  await page.getByLabel('Dirección del perfil (slug)').fill(slug);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  const profile = page.locator('.negocios-records article').filter({ hasText: name });
  await expect(profile).toContainText('pendiente');
  expect((await request.get(`/negocios/${slug}`)).status()).toBe(404);
  page.on('dialog', dialog => dialog.accept());
  await profile.getByRole('button', { name: 'Aprobar y publicar' }).click();
  await expect(profile).toContainText('aprobado');
  await page.screenshot({ path: testInfo.outputPath('panel-moderacion.png'), fullPage: true });

  const plan = await (await request.post('/api/admin/negocios-planes', { headers: admin,
    data: { nombre: 'Plan sintético', precioUsd: 10, activo: true } })).json();
  const day = new Date().toISOString().slice(0, 10);
  const campaign = { negocioId: slug, planId: plan.id, precioAcordadoUsd: 10, fechaInicio: day,
    fechaVencimiento: day, estadoPago: 'pagado', pagoConfirmado: true, referenciaPago: 'SIMULADO-NO-ES-UN-PAGO' };
  expect((await request.post('/api/admin/negocios-campanas', { headers: admin,
    data: { ...campaign, pagoConfirmado: false } })).status()).toBe(400);
  expect((await request.post('/api/admin/negocios-campanas', { headers: admin, data: campaign })).status()).toBe(201);
  await page.getByRole('button', { name: 'Campañas y pagos', exact: true }).click();
  await expect(page.locator('.negocios-records')).toContainText('SIMULADO-NO-ES-UN-PAGO');
  await page.screenshot({ path: testInfo.outputPath('panel-campanas.png'), fullPage: true });
  await context.clearCookies();

  await page.goto(`/negocios?q=${encodeURIComponent(name)}`);
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('directorio.png'), fullPage: true });
  await page.getByRole('heading', { name, exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  const wa = page.locator('article').getByRole('link', { name: 'WhatsApp', exact: true });
  await expect(wa).toHaveAttribute('href', /^https:\/\/wa\.me\/50500000000\?/);
  await expect(wa).toHaveAttribute('rel', /sponsored/);
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  if (testInfo.project.name === 'Mobile Chrome') {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath('perfil.png'), fullPage: true });
  // Bot detection blocks headless user agents; send a normal UA in fixture context.
  const tracked = page.waitForResponse(r => r.url().endsWith('/api/telemetry/negocios') && r.request().postDataJSON()?.tipo === 'whatsapp');
  await wa.click();
  expect((await tracked).status()).toBe(200);
  const report = await request.get(`/api/admin/negocios-reporte?negocioId=${slug}&dias=7`, { headers: admin });
  expect(report.status()).toBe(200);
  const csv = await report.text();
  expect(csv).toMatch(/TOTAL,\d+,1,0,0/);
  expect(csv).toContain('no equivalen a conversaciones');
  await testInfo.attach('reporte-sintetico.csv', { body: csv, contentType: 'text/csv' });
  expect(await (await request.get('/sitemap.xml')).text()).toContain(`/negocios/${slug}`);
});
