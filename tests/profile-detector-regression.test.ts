import { describe, it, expect } from 'vitest';
import { detectContentProfile } from '@/lib/meni/profile-detector';

describe('MENI Profile Detector — Regression Tests', () => {
  it('Caso 1: Coyote vs. Acme → espectaculos (NOT ambiente)', () => {
    const result = detectContentProfile(
      'Coyote vs. Acme llega a Nicaragua: el Coyote va contra ACME',
      'La película Coyote vs. Acme llega a los cines de Nicaragua. El estreno de Warner Bros. trae al personaje clásico del coyote en una nueva película de comedia. Los personajes de la franquicia animada llegan a la cartelera nacional con funciones para toda la familia.',
      'Película de Warner Bros. llega a cines de Nicaragua',
    );
    expect(result.profile_detected).toBe('espectaculos');
    expect(result.profile_detected).not.toBe('ambiente');
  });

  it('Caso 2: Volcán Telica → ambiente', () => {
    const result = detectContentProfile(
      'Volcán Telica expulsa gases y ceniza en Nicaragua',
      'El volcán Telica registró actividad volcánica con emisión de gases y ceniza. El INETER monitorea la actividad eruptiva del cráter. La ceniza afecta a comunidades cercanas al volcán.',
      'Volcán nicaragüense presenta actividad eruptiva',
    );
    expect(result.profile_detected).toBe('ambiente');
  });

  it('Caso 3: Prichard Colón → deportes', () => {
    const result = detectContentProfile(
      'Prichard Colón, boxeador herido en combate',
      'El boxeador Prichard Colón sufrió heridos durante un combate de boxeo. El atleta fue trasladado tras el partido. La selección deportiva muestra preocupación por el torneo.',
      'Boxeador resulta herido durante combate',
    );
    expect(result.profile_detected).toBe('deportes');
  });

  it('Caso 4: Accidente en Wapi → sucesos', () => {
    const result = detectContentProfile(
      'Accidente en Wapi deja un fallecido y varios heridos',
      'Un accidente de tránsito en Wapi dejó un fallecido y varios heridos. Los bomberos acudieron al rescate. La policía investiga el accidente.',
      'Accidente vial deja víctimas en Wapi',
    );
    expect(result.profile_detected).toBe('sucesos');
  });

  it('Caso 5: Nicaragua produce aguacates → nacionales o economia (NOT ambiente)', () => {
    const result = detectContentProfile(
      'Nicaragua produce millones de aguacates para exportación',
      'Nicaragua produce millones de aguacates para exportación internacional. La economía del país se beneficia de la producción de aguacate. El mercado de exportación crece con el dólar.',
      'Producción de aguacate impulsa economía nicaragüense',
    );
    expect(result.profile_detected).not.toBe('ambiente');
  });

  it('Caso 6: Noticia internacional → internacional', () => {
    const result = detectContentProfile(
      'Estados Unidos impone nuevas sanciones a Rusia',
      'Estados Unidos anunció nuevas sanciones internacionales contra Rusia por el conflicto con Ucrania. La medida afecta el comercio mundial.',
      'EEUU impone sanciones a Rusia',
    );
    expect(result.profile_detected).toBe('internacional');
  });

  it('Caso 7: Noticia tecnológica → tecnologia', () => {
    const result = detectContentProfile(
      'Nueva app de inteligencia artificial revoluciona el software',
      'Una nueva app utiliza inteligencia artificial para mejorar el software. La tecnología de IA permite diagnósticos más rápidos desde el celular.',
      'App de IA transforma el mercado tecnológico',
    );
    expect(result.profile_detected).toBe('tecnologia');
  });

  it('Caso 8: Noticia cultural → cultura', () => {
    const result = detectContentProfile(
      'Festival de música y teatro celebra la cultura nicaragüense',
      'El festival de música y teatro celebra la cultura y el patrimonio de Nicaragua. La exposición de arte y la danza tradicional se presentan en el evento.',
      'Festival cultural celebra tradiciones de Nicaragua',
    );
    expect(result.profile_detected).toBe('cultura');
  });

  it('Caso 9: Noticia turística → turismo', () => {
    const result = detectContentProfile(
      'Nuevo mirador turístico en Catarina ofrece vista de la laguna',
      'Un nuevo mirador turístico en Catarina ofrece vista de la laguna. El destino turístico incluye sendero y guía turística. Cómo llegar al atractivo turístico.',
      'Mirador turístico en Catarina atrae visitantes',
    );
    expect(result.profile_detected).toBe('turismo');
  });

  it('Caso 10: Noticia de salud → salud', () => {
    const result = detectContentProfile(
      'MINSA reporta brote de dengue en Managua',
      'El MINSA reportó un brote de dengue en Managua. Los síntomas incluyen fiebre y dolor. La prevención y vacuna son clave contra la enfermedad.',
      'Brote de dengue activo en la capital',
    );
    expect(result.profile_detected).toBe('salud');
  });
});
