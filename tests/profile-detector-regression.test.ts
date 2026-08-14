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

  // Conflictos obligatorios
  it('Conflicto 1: actor visita volcán → espectaculos (NOT ambiente)', () => {
    const result = detectContentProfile(
      'Actor de Hollywood visita el volcán Masaya durante gira promocional',
      'El actor conocido por su papel en una película de acción visitó Nicaragua para promocionar su nuevo estreno. Durante la gira de prensa recorrió el volcán Masaya. El estreno de la película se proyecta esta semana en cartelera.',
      'Actor de película visita Nicaragua y recorre el volcán Masaya',
    );
    expect(result.profile_detected).toBe('espectaculos');
  });

  it('Conflicto 2: exportación de café → economia (NOT ambiente)', () => {
    const result = detectContentProfile(
      'Exportación de café nicaragüense crece un 15% este año',
      'La economía nicaragüense se fortalece con la exportación de café. Los productores venden más sacos al mercado internacional. El precio del dólar y la inflación afectan las ganancias del comercio.',
      'Exportación de café impulsa economía nacional',
    );
    expect(result.profile_detected).toBe('economia');
  });

  it('Conflicto 3: Nicaragua inaugura hospital en Managua → nacionales (NOT turismo)', () => {
    const result = detectContentProfile(
      'Gobierno de Nicaragua inaugura nuevo hospital en Managua',
      'El gobierno de Nicaragua inauguró un nuevo centro de salud en la capital. El ministerio de salud explicó que el hospital atenderá a pacientes de Managua. La alcaldía coordinó la apertura del centro médico.',
      'Nuevo hospital de Managua abre sus puertas',
    );
    expect(result.profile_detected).toBe('nacionales');
  });

  it('Conflicto 4: boxeador protagoniza película → deportes (NOT espectaculos)', () => {
    const result = detectContentProfile(
      'Boxeador nicaragüense será protagonista de documental deportivo',
      'El atleta de boxeo nicaragüense competirá en un torneo internacional. La película documental sigue su entrenamiento y combates. El entrenador confirmó la preparación para el torneo.',
      'Boxeador compite en torneo internacional con documental',
    );
    expect(result.profile_detected).toBe('deportes');
  });

  it('Conflicto 5: accidente de tránsito en Managua → sucesos (NOT nacionales)', () => {
    const result = detectContentProfile(
      'Accidente de tránsito en Managua deja heridos',
      'Un accidente de tránsito ocurrió en Managua. Los bomberos acudieron al rescate. La policía investiga el accidente y los heridos fueron trasladados.',
      'Accidente vial en Managua deja varios heridos',
    );
    expect(result.profile_detected).toBe('sucesos');
  });

  it('Conflicto 6: Nicaragua y Honduras firman acuerdo → internacionales (NOT nacionales)', () => {
    const result = detectContentProfile(
      'Nicaragua y Honduras firman acuerdo comercial internacional',
      'El gobierno de Nicaragua y el gobierno de Honduras firmaron un acuerdo de comercio internacional. Los dos países acordaron reducir aranceles. El canciller de Honduras viajó a Managua para la firma.',
      'Acuerdo comercial entre Nicaragua y Honduras entra en vigor',
    );
    expect(result.profile_detected).toBe('internacional');
  });

  it('Conflicto 7: película sobre patrimonio nicaragüense → espectaculos (NOT cultura)', () => {
    const result = detectContentProfile(
      'Película nicaragüense sobre tradición y patrimonio se estrena en cines',
      'La película documental explora la cultura y el patrimonio de Nicaragua. El director presentó el filme en el festival de cine. El estreno nacional llega a las salas de cine esta semana.',
      'Película nicaragüense sobre patrimonio cultural se estrena',
    );
    expect(result.profile_detected).toBe('espectaculos');
  });

  it('Conflicto 8: app del gobierno de Nicaragua → tecnologia (NOT nacionales)', () => {
    const result = detectContentProfile(
      'Gobierno de Nicaragua lanza nueva app de tecnología para trámites',
      'El gobierno presentó una nueva aplicación móvil. La app utiliza tecnología de software para facilitar trámites desde el celular. La plataforma de internet permite consultas digitales.',
      'Nueva app del gobierno facilita trámites por internet',
    );
    expect(result.profile_detected).toBe('tecnologia');
  });

  it('Conflicto 9: prospecto de beisbol firma con equipo de MLB → deportes (NOT internacional)', () => {
    const result = detectContentProfile(
      'Josh Dixon habría acordado US$1.4 millones con los Mets',
      'El joven prospecto nicaragüense Josh Dixon, originario de Corn Island y de 15 años, habría alcanzado un acuerdo por un bono de US$1.4 millones con los Mets de Nueva York. El beisbolista firmó su contrato con el equipo de las Grandes Ligas.',
      'Prospecto nicaragüense firma bono con los Mets de Nueva York',
    );
    expect(result.profile_detected).toBe('deportes');
    expect(result.profile_detected).not.toBe('internacional');
  });
});
