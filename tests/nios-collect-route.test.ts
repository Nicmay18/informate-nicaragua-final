import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const routeSrc = readFileSync(
  join(__dirname, '..', 'app', 'api', 'cron', 'nios-collect', 'route.ts'),
  'utf8',
);

describe('cron/nios-collect — ejecución honesta dentro del límite Vercel', () => {
  it('maxDuration=300 (máximo Hobby/Fluid compute), no 60', () => {
    expect(routeSrc).toMatch(/export const maxDuration = 300/);
    expect(routeSrc).not.toMatch(/export const maxDuration = 60/);
  });

  it('registra estado de run en nios_runs con lease anti-duplicados', () => {
    expect(routeSrc).toContain("'nios_runs'");
    expect(routeSrc).toContain('runTransaction');
    expect(routeSrc).toContain('lockedUntil');
    expect(routeSrc).toContain('already_running');
    expect(routeSrc).toContain('already_completed');
  });

  it('actualiza cada etapa (pipeline, ceo-loop, traffic-validation) con estado real', () => {
    for (const stage of ['pipeline', 'cache-invalidation', 'ceo-loop', 'traffic-validation']) {
      expect(routeSrc).toContain(`'${stage}'`);
    }
  });

  it('heartbeat healthy SOLO si todas las etapas esenciales completaron', () => {
    expect(routeSrc).toContain('essentialOk');
    expect(routeSrc).toContain("heartbeatStatus = essentialOk ? 'healthy' : 'degraded'");
    // CEO loop fallido o tráfico UNTRUSTED nunca pueden reportar healthy
    expect(routeSrc).toContain("ceoError === null");
    expect(routeSrc).toContain("!== 'UNTRUSTED'");
  });

  it('excepción total registra down + run failed, nunca healthy', () => {
    const catchBlock = routeSrc.slice(routeSrc.indexOf('} catch (error)'));
    expect(catchBlock).toContain("status: 'down'");
    expect(catchBlock).toContain("finishRun('failed'");
  });

  it('conserva autenticación cron/admin y respuesta skipped sin re-ejecutar', () => {
    expect(routeSrc).toContain('verifyAdminOrCronToken');
    expect(routeSrc).toContain('skipped: reason');
  });
});
