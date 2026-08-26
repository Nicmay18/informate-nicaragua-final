// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { runMeni } from '@/lib/meni';
import { runEditorialDiagnosis, generateCEOResponse } from '@/lib/nios/editorial-diagnosis';
import type { NoticiaInput } from '@/lib/meni';

function noticia(overrides: Partial<NoticiaInput>): NoticiaInput {
  return {
    titulo: overrides.titulo || 'Noticia de prueba',
    contenido: overrides.contenido || 'Contenido de prueba.',
    resumen: overrides.resumen ?? '',
    categoria: overrides.categoria || 'General',
    autor: overrides.autor ?? 'Redacción',
    fecha: new Date().toISOString(),
    slug: 'prueba',
    ...overrides,
  } as NoticiaInput;
}

describe('Misión 13 — NIOS como Editor IA', () => {
  it('A. Centro de monitoreo en Nicaragua: sin conflicto grave', { timeout: 30000 }, () => {
    const input = noticia({
      titulo: 'Gobierno entrega títulos de propiedad a familias de Chinandega, Nicaragua',
      resumen: 'La entrega se realizó en el municipio de Chinandega.',
      contenido:
        'El Gobierno de Nicaragua entregó este martes títulos de propiedad a más de quinientas familias de la ciudad de Chinandega, Nicaragua. La actividad fue coordinada por las autoridades locales junto a representantes del Instituto de la Propiedad y representantes de las familias beneficiadas. Los documentos otorgan seguridad jurídica sobre los terrenos donde las familias han construido sus viviendas. Las autoridades destacaron que el programa busca garantizar el derecho a una vivienda digna y fortalecer la economía familiar en el departamento. Los asistentes firmaron las escrituras correspondientes y recibieron copias certificadas. El evento se realizó en las instalaciones de la alcaldía municipal, con la participación de dirigentes comunitarios. Familias de diferentes barrios recibieron asesoría legal para completar el trámite. Las autoridades anunciaron que continuarán con las entregas en otros municipios durante las próximas semanas.',
      categoria: 'Nacionales',
    });
    const result = runMeni(input);
    const diagnosis = runEditorialDiagnosis(input, result);

    expect(result.categoria).toBe('Nacionales');
    expect(result.classificationConflict).toBe(false);
    expect(diagnosis.problems.some((p) => p.id === 'category-conflict')).toBe(false);
    expect(diagnosis.problems.some((p) => p.id === 'location-category-conflict')).toBe(false);
    expect(diagnosis.eventCountry).toBe('Nicaragua');
    expect(diagnosis.editorialStatus).not.toBe('BLOCKED');
  });

  it('B. Nicaragüense fallece en Panamá con categoría Internacionales: consistente', { timeout: 30000 }, () => {
    const input = noticia({
      titulo: 'Nicaragüense fallece en un accidente de tránsito en Panamá',
      resumen: 'La víctima residía en Panamá desde hace cinco años.',
      contenido:
        'Un ciudadano nicaragüense identificado como Juan Pérez, de 42 años, falleció la madrugada de este miércoles en un accidente de tránsito ocurrido en la Ciudad de Panamá. Según informes preliminares de la Policía Nacional de Panamá, el conductor perdió el control de su vehículo en la Avenida Balboa y chocó contra un separador. Testigos indicaron que las condiciones climáticas eran adversas por lluvias. La embajada de Nicaragua en Panamá confirmó que está en contacto con la familia para coordinar la repatriación. El cuerpo será trasladado a Managua en los próximos días. Las autoridades panameñas realizan las investigaciones para determinar las causas exactas del siniestro. La familia pidió privacidad mientras se completan los trámites correspondientes.',
      categoria: 'Internacionales',
    });
    const result = runMeni(input);
    const diagnosis = runEditorialDiagnosis(input, result);

    expect(result.categoria).toBe('Internacionales');
    expect(result.classificationConflict).toBe(false);
    expect(diagnosis.personNationality).toBe('Nicaragua');
    expect(diagnosis.eventCountry).toBe('Panamá');
    expect(diagnosis.problems.some((p) => p.id === 'category-conflict')).toBe(false);
    expect(diagnosis.problems.some((p) => p.id === 'location-category-conflict')).toBe(false);
    expect(diagnosis.problems.some((p) => p.id === 'missing-health-source')).toBe(false);
  });

  it('C. Nicaragüense fallece en Panamá con categoría Nacionales: conflicto con recomendación de revisión', { timeout: 30000 }, () => {
    const input = noticia({
      titulo: 'Nicaragüense fallece en un accidente de tránsito en Panamá',
      resumen: 'La víctima residía en Panamá desde hace cinco años.',
      contenido:
        'Un ciudadano nicaragüense identificado como Juan Pérez, de 42 años, falleció la madrugada de este miércoles en un accidente de tránsito ocurrido en la Ciudad de Panamá. Según informes preliminares de la Policía Nacional de Panamá, el conductor perdió el control de su vehículo en la Avenida Balboa y chocó contra un separador. Testigos indicaron que las condiciones climáticas eran adversas por lluvias. La embajada de Nicaragua en Panamá confirmó que está en contacto con la familia para coordinar la repatriación. El cuerpo será trasladado a Managua en los próximos días. Las autoridades panameñas realizan las investigaciones para determinar las causas exactas del siniestro. La familia pidió privacidad mientras se completan los trámites correspondientes.',
      categoria: 'Nacionales',
    });
    const result = runMeni(input);
    const diagnosis = runEditorialDiagnosis(input, result);
    const ceo = generateCEOResponse(diagnosis);

    expect(result.categoria).toBe('Nacionales');
    expect(result.classificationConflict).toBe(true);
    expect(diagnosis.problems.some((p) => p.id === 'category-conflict')).toBe(true);
    expect(diagnosis.problems.some((p) => p.id === 'location-category-conflict')).toBe(true);
    expect(diagnosis.personNationality).toBe('Nicaragua');
    expect(diagnosis.eventCountry).toBe('Panamá');
    expect(ceo.diagnose.toLowerCase()).toContain('problemas');
    expect(ceo.firstFix.toLowerCase()).toContain('revisar');
    expect(ceo.isReady.toLowerCase()).toContain('no');
    expect(diagnosis.publicationReadiness).toBe('NEEDS_REVIEW');
  });

  it('D. Nota de accidente vial: detecta campos faltantes', { timeout: 30000 }, () => {
    const input = noticia({
      titulo: 'Accidente vial deja heridos cerca de Managua',
      resumen: 'El incidente ocurrió en horas de la mañana.',
      contenido:
        'Un accidente de tránsito se registró esta mañana en una carretera cercana a Managua. Según testigos, una persona perdió el control y terminó en una cuneta. Otras personas que transitaban por el lugar auxiliaron a los ocupantes. Hasta el momento no se ha confirmado el número de heridos. Los cuerpos de rescate llegaron al lugar para evaluar la situación y restablecer el tránsito. El congestionamiento se extendió por varios kilómetros mientras retiraban el automotor. Las autoridades pidieron precaución a los conductores.',
      categoria: 'Sucesos',
    });
    const result = runMeni(input);
    const diagnosis = runEditorialDiagnosis(input, result);

    expect(result.categoria).toBe('Sucesos');
    expect(diagnosis.problems.some((p) => p.id === 'missing-age')).toBe(true);
    expect(diagnosis.problems.some((p) => p.id === 'missing-vehicle')).toBe(true);
    expect(diagnosis.problems.some((p) => p.id === 'missing-institution')).toBe(true);
  });

  it('E. Nota de salud: detecta falta de fecha y cifras', { timeout: 30000 }, () => {
    const input = noticia({
      titulo: 'MINSA reitera importancia de la vacunación',
      resumen: 'La institución invita a la población a completar el esquema.',
      contenido:
        'El Ministerio de Salud de Nicaragua (MINSA) reiteró este miércoles la importancia de mantener al día el esquema de vacunación, especialmente en niños menores de cinco años. La institución indicó que la inmunización previene enfermedades prevenibles y reduce riesgos de brotes en comunidades. Las autoridades sanitarias destacaron que las unidades de salud están habilitadas para aplicar las dosis correspondientes sin costo para la población. El llamado se hace en el marco de las acciones de promoción de la salud pública impulsadas por el gobierno central.',
      categoria: 'Nacionales',
    });
    const result = runMeni(input);
    const diagnosis = runEditorialDiagnosis(input, result);

    expect(diagnosis.problems.some((p) => p.id === 'missing-health-source')).toBe(false);
    expect(diagnosis.problems.some((p) => p.id === 'missing-health-date')).toBe(true);
    expect(diagnosis.problems.some((p) => p.id === 'missing-health-figures')).toBe(true);
  });

  it('F. Nota deportiva: detecta equipos, resultado y torneo', { timeout: 30000 }, () => {
    const input = noticia({
      titulo: 'Aficionados siguen entrenamientos antes del próximo duelo',
      resumen: 'Los jugadores realizan ajustes en el estadio.',
      contenido:
        'Los seguidores del fútbol siguen con atención los entrenamientos de sus jugadores favoritos de cara al próximo duelo. El entrenador indicó que se realizan los últimos ajustes tácticos antes del partido. Las entradas ya están a la venta y se espera una buena asistencia en el estadio. La prensa deportiva destaca que ambos clubes llegan con plantillas completas. Se espera un encuentro atractivo para el público local.',
      categoria: 'Deportes',
    });
    const result = runMeni(input);
    const diagnosis = runEditorialDiagnosis(input, result);

    expect(result.categoria).toBe('Deportes');
    expect(diagnosis.problems.some((p) => p.id === 'missing-teams')).toBe(true);
    expect(diagnosis.problems.some((p) => p.id === 'missing-result')).toBe(true);
    expect(diagnosis.problems.some((p) => p.id === 'missing-tournament')).toBe(true);
  });

  it('CEO responde en lenguaje natural con explicación, prioridad y publicabilidad', { timeout: 30000 }, () => {
    const input = noticia({
      titulo: 'Nicaragüense fallece en un accidente de tránsito en Panamá',
      resumen: 'La víctima residía en Panamá desde hace cinco años.',
      contenido:
        'Un ciudadano nicaragüense identificado como Juan Pérez, de 42 años, falleció la madrugada de este miércoles en un accidente de tránsito ocurrido en la Ciudad de Panamá. Según informes preliminares de la Policía Nacional de Panamá, el conductor perdió el control de su vehículo en la Avenida Balboa y chocó contra un separador. Testigos indicaron que las condiciones climáticas eran adversas por lluvias. La embajada de Nicaragua en Panamá confirmó que está en contacto con la familia para coordinar la repatriación. El cuerpo será trasladado a Managua en los próximos días.',
      categoria: 'Nacionales',
    });
    const result = runMeni(input);
    const diagnosis = runEditorialDiagnosis(input, result);
    const ceo = generateCEOResponse(diagnosis);

    expect(ceo.diagnose).toBeTruthy();
    expect(ceo.firstFix).toBeTruthy();
    expect(ceo.canFix).toBeTruthy();
    expect(ceo.isReady).toBeTruthy();
    expect(ceo.diagnose).toMatch(/problemas/i);
  });
});
