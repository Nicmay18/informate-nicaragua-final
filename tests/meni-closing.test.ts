import { describe, it, expect } from 'vitest';
import { detectContentProfile } from '@/lib/meni/profile-detector';
import { filterRecommendations } from '@/lib/meni/recommendation-filter';
import { computeContextScore } from '@/lib/meni/contextualiza';

describe('MENI v2.1 — cierre de hallazgos', () => {
  it('HALLAZGO 1: nota educativa se clasifica como educacion', () => {
    const p = detectContentProfile(
      'Nueva reforma educativa regirá desde el ciclo 2025',
      'El Ministerio de Educación anunció una reforma del currículo escolar. Los docentes recibirán capacitación.',
      'El Minedu anuncia cambios en el currículo.',
    );
    expect(p.profile_detected).toBe('educacion');
  });

  it('HALLAZGO 1: nota ambiental se clasifica como ambiente', () => {
    const p = detectContentProfile(
      'Sequía afecta producción de granos básicos en el Pacífico',
      'Las comunidades del Pacífico reportan pérdidas en la producción de maíz. Los agricultores atribuyen el problema a la sequía prolongada.',
      'Agricultores reportan pérdidas por falta de lluvia.',
    );
    expect(p.profile_detected).toBe('ambiente');
  });

  it('HALLAZGO 2: no descarta una recomendación de sucesos por una sola palabra compartida', () => {
    const recs = [
      { area: 'editorial' as const, severidad: 'alta' as const, mensaje: 'Falta confirmar la versión oficial del accidente' },
    ];
    const filtradas = filterRecommendations(
      recs,
      'sucesos',
      'Accidente en carretera Norte deja tres heridos',
      'Tres personas resultaron heridas en un accidente de tránsito. La policía realiza la investigación.',
      'Un accidente de tránsito dejó tres personas lesionadas.',
    );
    expect(filtradas.length).toBeGreaterThan(0);
    const n = filtradas[0].mensaje.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    expect(n).toContain('version oficial');
  });

  it('HALLAZGO 3: perfil deporte no exige marco legal', () => {
    const c = computeContextScore(
      'Diriangén gana la final del fútbol nicaragüense',
      'Diriangén venció en la final del torneo tras penales. El próximo torneo comienza en agosto.',
      'El conjunto se coronó campeón.',
      'deportes',
    );
    expect(c.marco_legal.score).toBe(0);
    expect(c.instituciones.score).toBeLessThanOrEqual(5);
  });
});
