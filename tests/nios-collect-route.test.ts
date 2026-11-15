import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const routeSrc = readFileSync(
  join(__dirname, '..', 'app', 'api', 'cron', 'nios-collect', 'route.ts'),
  'utf8',
);
const orchSrc = readFileSync(
  join(__dirname, '..', 'lib', 'nios', 'intelligence', 'orchestrator.ts'),
  'utf8',
);
const vercelSrc = readFileSync(join(__dirname, '..', 'vercel.json'), 'utf8');

describe('cron/nios-collect — etapas reanudables dentro del límite Hobby 60s', () => {
  it('maxDuration=60 (límite real del plan Hobby de este proyecto)', () => {
    expect(routeSrc).toMatch(/export const maxDuration = 60/);
    expect(routeSrc).not.toMatch(/export const maxDuration = 300/);
  });

  it('divide el pipeline en 4 etapas: collect, analyze, ceo, finalize', () => {
    expect(routeSrc).toContain("'collect'");
    expect(routeSrc).toContain("'analyze'");
    expect(routeSrc).toContain("'ceo'");
    expect(routeSrc).toContain("'finalize'");
    expect(routeSrc).toContain('PREREQUISITES');
  });

  it('estado durable en nios_runs con idempotencia por etapa', () => {
    expect(routeSrc).toContain("'nios_runs'");
    expect(routeSrc).toContain('stage_completed');
    expect(routeSrc).toContain('stage_running');
    expect(routeSrc).toContain('lockedUntil');
    expect(routeSrc).toContain('stage_prerequisite_missing');
  });

  it('vercel.json programa las 4 etapas escalonadas', () => {
    for (const stage of ['collect', 'analyze', 'ceo', 'finalize']) {
      expect(vercelSrc).toContain(`stage=${stage}`);
    }
    expect(vercelSrc).toContain('30 8 * * *');
    expect(vercelSrc).toContain('30 9 * * *');
  });

  it('heartbeat healthy SOLO si las 4 etapas esenciales completaron limpias', () => {
    expect(routeSrc).toContain('essentialOk');
    expect(routeSrc).toContain("essentialOk ? 'healthy' : 'degraded'");
    expect(routeSrc).toContain("status: 'down'");
  });

  it('orquestador expone fases collect/analyze con estado serializable', () => {
    expect(orchSrc).toContain('runPipelineCollectPhase');
    expect(orchSrc).toContain('runPipelineAnalyzePhase');
    expect(orchSrc).toContain('persistCollectPhase');
    expect(orchSrc).toContain('restorePipelineContext');
    expect(orchSrc).toContain('cleanupPipelineState');
    // runNIOSPipeline monolítico se conserva para admin/tests
    expect(orchSrc).toContain('export async function runNIOSPipeline');
  });

  it('la lectura del snapshot previo es dirigida (no ensambla ~700 artículos)', () => {
    expect(orchSrc).toContain('getLatestTrafficPerformance');
    expect(orchSrc).toContain('getHistoricalSnapshots');
    // el orquestador ya no usa getLatestSnapshot (lectura completa costosa)
    expect(orchSrc).not.toContain('getLatestSnapshot(db)');
  });
});
