import { describe, it, expect } from 'vitest';
import { runMeni } from '@/lib/meni/core';
import { detectContentProfile } from '@/lib/meni/profile-detector';
import { filterRecommendations } from '@/lib/meni/recommendation-filter';
import { computeContextScore } from '@/lib/meni/contextualiza';
import { computeInputHash } from '@/lib/meni/hash';
import type { MeniRecomendacion } from '@/lib/meni/types';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const notaFemicidio = {
  titulo: 'Mujer fue asesinada presuntamente por su expareja en Managua',
  resumen: 'Una mujer de 28 años fue encontrada sin vida en su vivienda de Managua. La policía investiga el femicidio y busca a su expareja.',
  contenido: `
    <p>Una mujer de 28 años fue encontrada sin vida en su vivienda ubicada en el barrio Riguero de Managua en horas de la madrugada.</p>
    <p>Según versiones preliminares, la víctima mantenía una relación conflictiva con su expareja, quien habría ingresado a la vivienda horas antes del hecho.</p>
    <p>La Policía Nacional confirmó que investigan el caso como un femicidio y que ya iniciaron la búsqueda del principal sospechoso.</p>
    <p>Vecinos del sector indicaron que escucharon discusiones minutos antes de que se escucharan los hechos. La víctima deja dos menores de edad.</p>
    <p>La Fiscalía de Managua ordenó el levantamiento del cuerpo y la realización de la autopsia correspondiente. Hasta el momento no se ha confirmado la identidad del agresor.</p>
    <p>Este caso se suma a otros eventos de violencia contra mujer registrados en los últimos meses en la capital. Las autoridades no entregaron más detalles.</p>
    <h2>¿Qué se sabe hasta ahora?</h2>
    <p>El cuerpo fue hallado por familiares que acudieron a la vivienda después de intentar comunicarse sin éxito con la víctima.</p>
    <p>Las investigaciones continúan y la policía solicita a testigos que aporten información para ubicar al presunto responsable.</p>
  `.trim(),
  categoria: 'Sucesos',
  imagen: '/logo.webp',
  fecha: '2026-01-01T00:00:00.000Z',
};

const notaSalud = {
  titulo: 'MINSA reporta brote de dengue y explica cómo prevenir los síntomas',
  resumen: 'El Ministerio de Salud de Nicaragua confirmó un aumento de casos de dengue y recomendó medidas de prevención a la población.',
  contenido: `
    <p>El Ministerio de Salud de Nicaragua (MINSA) confirmó un aumento de casos de dengue en la región del Pacífico durante las últimas dos semanas.</p>
    <p>Según datos preliminares, los síntomas más reportados son fiebre alta, dolor muscular y dolor de cabeza. Las autoridades indicaron que la mayoría de los pacientes se encuentran en condición estable.</p>
    <p>El MINSA explicó que el mosquito transmisor se reproduce en recipientes con agua estancada y pidió a las familias eliminar los criaderos en sus hogares.</p>
    <p>La prevención incluye usar repelente, mantener ventiladores en horas de mayor actividad del zancudo y cubrir tanques de agua con malla adecuada.</p>
    <p>Las autoridades de salud indicaron que no se reportan casos de dengue hemorrágico y que los centros de salud están preparados para atender la demanda.</p>
    <p>La población puede acudir al centro de salud más cercano si presenta fiebre persistente o signos de alarma.</p>
    <h2>Recomendaciones de prevención</h2>
    <p>Lavar recipientes con agua estancada, usar ropa de manga larga y consultar al médico ante síntomas de dengue.</p>
    <p>El MINSA indicó que la situación está controlada y que continuará los esfuerzos de fumigación en zonas con mayor presencia del mosquito.</p>
  `.trim(),
  categoria: 'Salud',
  imagen: '/logo.webp',
  fecha: '2026-01-01T00:00:00.000Z',
};

describe('MENI Calibration v2.1', () => {
  it('FASE 2: una nota de femicidio se clasifica como violencia de género, no salud', () => {
    const p = detectContentProfile(notaFemicidio.titulo, notaFemicidio.contenido, notaFemicidio.resumen);
    expect(p.profile_detected).toBe('violencia_genero');
    expect(p.matched_keywords.some((k) => normalize(k).includes('sintoma'))).toBe(false);
    expect(p.matched_entities.some((k) => normalize(k).includes('preven'))).toBe(false);
  });

  it('FASE 2: un brote epidemiológico no recibe recomendaciones de sucesos', () => {
    const p = detectContentProfile(notaSalud.titulo, notaSalud.contenido, notaSalud.resumen);
    expect(p.profile_detected).toBe('salud');
    const mock: MeniRecomendacion[] = [
      { area: 'editorial', severidad: 'alta', mensaje: 'Falta confirmar la versión oficial del accidente' },
      { area: 'editorial', severidad: 'alta', mensaje: 'Explicar cómo se transmite y cuáles son los síntomas del brote' },
    ];
    const recs = filterRecommendations(
      mock,
      p.profile_detected,
      notaSalud.titulo,
      notaSalud.contenido,
      notaSalud.resumen,
    );
    expect(recs.some((r) => normalize(r.mensaje).includes('accidente'))).toBe(false);
    // La recomendación de salud puede quedar si aplica y no está respondida
  });

  it('FASE 3: mismo input produce mismo score, veredicto y hash 5 veces consecutivas', () => {
    const r1 = runMeni(notaFemicidio);
    expect(r1).toHaveProperty('articleHash');
    expect(r1).toHaveProperty('evaluationTimestamp');
    expect(r1).toHaveProperty('profile_used');
    const results = Array.from({ length: 5 }, () => runMeni(notaFemicidio));
    for (const r of results) {
      expect(r.scoreFinal).toBe(r1.scoreFinal);
      expect(r.finalEditorialScore).toBe(r1.finalEditorialScore);
      expect(r.estadoFinal).toBe(r1.estadoFinal);
      expect(r.articleHash).toBe(r1.articleHash);
      expect(r.profile_used).toBe(r1.profile_used);
      expect(r.profile_confidence).toBe(r1.profile_confidence);
    }
  });

  it('FASE 4: contextualiza devuelve 8 submétricas con score, evidencia encontrada y faltante', () => {
    const c = computeContextScore(notaFemicidio.titulo, notaFemicidio.contenido, notaFemicidio.resumen);
    expect(c).toHaveProperty('antecedentes');
    expect(c).toHaveProperty('marco_legal');
    expect(c).toHaveProperty('datos_verificables');
    expect(c).toHaveProperty('contexto_temporal');
    expect(c).toHaveProperty('contexto_geografico');
    expect(c).toHaveProperty('instituciones');
    expect(c).toHaveProperty('impacto_social');
    expect(c).toHaveProperty('fuentes');
    expect(c.antecedentes.score).toBeGreaterThanOrEqual(0);
    expect(c.antecedentes.maximo).toBeGreaterThan(0);
    expect(typeof c.antecedentes.encontrado).toBe('object');
    expect(typeof c.antecedentes.faltante).toBe('object');
  });

  it('FASE 5: existe una única fuente de verdad (finalEditorialScore) y un solo veredicto final', () => {
    const r = runMeni(notaFemicidio);
    expect(typeof r.finalEditorialScore).toBe('number');
    expect(r.finalEditorialScore).toBe(r.scoreFinal);
    expect(['APROBADO', 'MEJORAR', 'NO_PUBLICAR']).toContain(r.estadoFinal);
    expect(r.calificacion).toBeTruthy();
    // Si Forense da score distinto, el veredicto final debe seguir siendo el editorial
    expect(r.forense.score).toBeGreaterThanOrEqual(0);
    expect(r.aprobado).toBe(r.estadoFinal === 'APROBADO');
  });

  it('FASE 6: las recomendaciones expuestas se filtran por perfil y ausencia real', () => {
    const r = runMeni(notaSalud);
    expect(r).toHaveProperty('recomendacionesContextuales');
    if (r.recomendacionesContextuales) {
      for (const rec of r.recomendacionesContextuales) {
        expect(normalize(rec.mensaje)).not.toContain('accidente');
      }
    }
  });

  it('FASE 3: article_hash es determinista para el mismo input', () => {
    const h1 = computeInputHash(notaFemicidio);
    const h2 = computeInputHash(notaFemicidio);
    expect(h1).toBe(h2);
    expect(h1.startsWith('meni-')).toBe(true);
  });
});
