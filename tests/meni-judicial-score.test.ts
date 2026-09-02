import { describe, it, expect } from 'vitest';
import { runMeni } from '@/lib/meni/core';
import { filterRecommendations } from '@/lib/meni/recommendation-filter';
import type { NoticiaInput, MeniRecomendacion } from '@/lib/meni/types';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Nota de Medicina Legal reconstruida a partir del caso judicial real
 * (Angélica María Mairena López). Contiene las señales clásicas de un
 * suceso judicial/local bien estructurado: instituciones, marco legal,
 * peritajes, contexto geográfico e impacto social.
 */
const notaMedicinaLegal: NoticiaInput = {
  titulo: 'Medicina Legal determina estado mental de acusada por la muerte de su hija en Managua',
  resumen:
    'Peritajes de Medicina Legal y psiquiátricos se incorporan al expediente contra la mujer señalada de la muerte de su hija en Ticuantepe.',
  contenido: `
    <h2>Qué ocurrió</h2>
    <p>La Fiscalía de Managua informó que un perito de Medicina Legal dictaminó que la mujer acusada, de 31 años, presenta alteraciones psiquiátricas compatibles con un trastorno mental. La muerte de su hija de cuatro años ocurrió en su vivienda de Ticuantepe el pasado fin de semana.</p>
    <p>Según la Fiscalía, la víctima dejó a una familia conmocionada en el barrio. La acusada enfrenta un proceso penal por el delito de parricidio. La Policía Nacional recogió indicios en la escena y remitió el caso al Ministerio Público.</p>
    <h2>Qué establece el dictamen</h2>
    <p>El dictamen forense señala que la acusada no presenta alteraciones de conciencia permanentes, pero requiere evaluación psiquiátrica durante el juicio. El documento será parte de las pruebas que valorará el juez competente.</p>
    <p>La defensa de la imputada solicitó la realización de peritajes complementarios para determinar si las condiciones mentales afectan su responsabilidad penal. La Fiscalía indicó que el proceso continuará en las próximas semanas.</p>
    <h2>Qué sigue</h2>
    <p>El juez deberá resolver si la acusada será sometida a un proceso ordinario o se aplican medidas de seguridad. La presunción de inocencia permanece hasta que exista una sentencia firme, señalaron las autoridades judiciales.</p>
    <p>Este caso generó conmoción en Ticuantepe, donde vecinos piden justicia por la menor. La comunidad espera que el proceso esclarezca los hechos y responsabilice a quien corresponda.</p>
    <h2>Marco legal</h2>
    <p>El Código Penal nicaragüense sanciona el parricidio y establece que las personas con trastornos mentales pueden ser eximidas parcial o totalmente si no comprendían la ilicitud del hecho. La resolución judicial firme corresponderá a la autoridad competente.</p>
  `.trim(),
  categoria: 'Sucesos',
  imagen: '/logo.webp',
  fecha: new Date().toISOString(),
};

const notaSalud: NoticiaInput = {
  titulo: 'MINSA reporta brote de dengue y explica cómo prevenir los síntomas',
  resumen:
    'El Ministerio de Salud de Nicaragua confirmó un aumento de casos de dengue y recomendó medidas de prevención a la población.',
  contenido: `
    <p>El Ministerio de Salud de Nicaragua (MINSA) confirmó un aumento de casos de dengue en la región del Pacífico durante las últimas dos semanas.</p>
    <p>Según datos preliminares, los síntomas más reportados son fiebre alta, dolor muscular y dolor de cabeza. Las autoridades indicaron que la mayoría de los pacientes se encuentran en condición estable.</p>
    <p>El MINSA explicó que el mosquito transmisor se reproduce en recipientes con agua estancada y pidió a las familias eliminar los criaderos en sus hogares.</p>
    <p>La prevención incluye usar repelente, mantener ventiladores en horas de mayor actividad del zancudo y cubrir tanques de agua con malla adecuada.</p>
    <p>Las autoridades de salud indicaron que no se reportan casos de dengue hemorrágico y que los centros de salud están preparados para atender la demanda.</p>
    <h2>Recomendaciones de prevención</h2>
    <p>Lavar recipientes con agua estancada, usar ropa de manga larga y consultar al médico ante síntomas de dengue.</p>
  `.trim(),
  categoria: 'Salud',
  imagen: '/logo.webp',
  fecha: '2026-09-02T00:00:00.000Z',
};

const notaInternacional: NoticiaInput = {
  titulo: 'Estados Unidos y Rusia acuerdan extender negociaciones sobre control de armas',
  resumen:
    'Las dos potencias acordaron continuar las conversaciones bilaterales para reducir arsenales estratégicos.',
  contenido: `
    <p>Estados Unidos y Rusia anunciaron la extensión de las negociaciones sobre control de armas nucleares. El acuerdo se alcanzó en una reunión en Viena.</p>
    <p>Según la ONU, el acuerdo reduce el riesgo de una nueva carrera armamentista. Organizaciones internacionales celebraron la decisión.</p>
    <p>La Unión Europea (UE) ofreció facilitar las negociaciones. Expertos del mundo señalan que el resultado afectará a países de América Latina.</p>
    <h2>Contexto internacional</h2>
    <p>El tratado anterior expiró en 2021 y no fue renovado. Un nuevo pacto sería el primer acuerdo nuclear entre potencias en más de una década.</p>
  `.trim(),
  categoria: 'Internacionales',
  imagen: '/logo.webp',
  fecha: '2026-09-02T00:00:00.000Z',
};

const notaMala: NoticiaInput = {
  titulo: 'Ocurrió algo',
  resumen: 'Algo pasó.',
  contenido: `<p>Pasó algo. No se sabe más.</p>`,
  categoria: 'Sucesos',
  imagen: '/logo.webp',
  fecha: '2026-09-02T00:00:00.000Z',
};

function hasNoInternacional(recs: MeniRecomendacion[]): boolean {
  return recs.every((r) => {
    const m = normalize(r.mensaje);
    return !['exterior', 'internacional', 'mundo', 'paises', 'países', 'global'].some((w) => m.includes(w));
  });
}

describe('MENI Score Judicial — Regresión Medicina Legal', () => {
  it('perfil sucesos: la nota judicial se clasifica como sucesos', () => {
    const r = runMeni(notaMedicinaLegal);
    expect(r.profile_used).toBe('sucesos');
  });

  it('score final es el ADN NI y coincide con el Quality Gate', () => {
    const r = runMeni(notaMedicinaLegal);
    expect(r.finalEditorialScore).toBe(r.scoreFinal);
    expect(r.finalEditorialScore).toBeGreaterThanOrEqual(0);
    expect(r.finalEditorialScore).toBeLessThanOrEqual(100);
    expect(r.editorialDna).toBeDefined();
    expect(r.finalEditorialScore).toBe(r.editorialDna!.adnNI);
    expect(r.qualityGate?.editorScore).toBe(r.finalEditorialScore);
  });

  it('la nota de sucesos bien estructurada alcanza el umbral >= 90', () => {
    const r = runMeni(notaMedicinaLegal);
    expect(r.finalEditorialScore).toBeGreaterThanOrEqual(90);
    expect(r.estadoFinal).toBe('APROBADO');
    expect(r.aprobado).toBe(true);
  });

  it('no genera recomendaciones de contexto internacional para la nota de sucesos', () => {
    const r = runMeni(notaMedicinaLegal);
    expect(hasNoInternacional(r.recomendaciones)).toBe(true);
    if (r.recomendacionesContextuales) {
      expect(hasNoInternacional(r.recomendacionesContextuales)).toBe(true);
    }
  });

  it('detecta fuentes, impacto social y contexto geográfico en la nota judicial', () => {
    const r = runMeni(notaMedicinaLegal);
    expect(r.contextScore).toBeDefined();
    expect(r.contextScore!.fuentes.score).toBeGreaterThan(0);
    expect(r.contextScore!.impacto_social.score).toBeGreaterThan(0);
    expect(r.contextScore!.contexto_geografico.score).toBeGreaterThan(0);
  });

  it('Valor mejora por encima del 69 histórico en notas de muerte/delito', () => {
    const r = runMeni(notaMedicinaLegal);
    expect(r.editorialDna?.selloNI.valor).toBeGreaterThanOrEqual(70);
  });
});

describe('MENI Profile Rules — Regresión por perfil', () => {
  it('una nota de salud real recibe el perfil salud', () => {
    const r = runMeni(notaSalud);
    expect(r.profile_used).toBe('salud');
  });

  it('una nota de salud no recibe advertencias de tránsito o accidente', () => {
    const r = runMeni(notaSalud);
    const mensajes = r.recomendaciones.map((rec) => normalize(rec.mensaje));
    expect(mensajes.some((m) => m.includes('accidente'))).toBe(false);
    expect(mensajes.some((m) => m.includes('transito') || m.includes('tráfico'))).toBe(false);
  });

  it('una nota internacional se clasifica como internacional y permite contexto internacional', () => {
    const r = runMeni(notaInternacional);
    expect(r.profile_used).toBe('internacional');
    const recs = filterRecommendations(
      [{ area: 'editorial', severidad: 'media', mensaje: 'Responsable internacional en Ucrania' }],
      'internacional',
      notaInternacional.titulo,
      notaInternacional.contenido,
      notaInternacional.resumen,
    );
    expect(recs.some((rec) => rec.mensaje.includes('internacional'))).toBe(true);
  });

  it('el filtro de recomendaciones respeta el perfil sucesos', () => {
    const mock: MeniRecomendacion[] = [
      { area: 'editorial', severidad: 'alta', mensaje: 'Contexto internacional necesario' },
      { area: 'editorial', severidad: 'alta', mensaje: 'Falta explicar qué ocurrió en el exterior' },
      { area: 'editorial', severidad: 'media', mensaje: 'Confirme la edad y estado de la víctima' },
    ];
    const recs = filterRecommendations(
      mock,
      'sucesos',
      notaMedicinaLegal.titulo,
      notaMedicinaLegal.contenido,
      notaMedicinaLegal.resumen,
    );
    const mensajes = recs.map((r) => normalize(r.mensaje));
    expect(mensajes.some((m) => m.includes('internacional') || m.includes('exterior'))).toBe(false);
  });
});

describe('MENI Threshold >= 90 — fail-closed', () => {
  it('una nota de sucesos incompleta no alcanza 90', () => {
    const r = runMeni(notaMala);
    expect(r.finalEditorialScore).toBeLessThan(90);
    expect(r.estadoFinal).not.toBe('APROBADO');
  });
});
