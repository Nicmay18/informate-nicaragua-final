import { describe, it, expect } from 'vitest';
import { detectInternalContradictions, extractEntities, stripHtml } from '@/lib/meni/quality-gate/validator';

/**
 * Test del bug fix: el detector de contradicciones no debe capturar
 * "Su madre" como nombre de persona cuando hay dos madres distintas
 * con edades distintas.
 *
 * Antes del fix: el regex usaba flag `gi` (case-insensitive), lo que hacía
 * que "Su madre" matcheara como nombre propio, causando un falso positivo
 * de contradicción BLOCKER.
 *
 * Después del fix: el regex es case-sensitive (`g` sin `i`), por lo que
 * solo captura nombres propios reales (con mayúscula).
 */
describe('Quality Gate — Bug fix: extraerEdadesPorPersona case-sensitive', () => {
  it('NO debe marcar contradicción cuando "Su madre" aparece con dos edades distintas (madres diferentes)', () => {
    const texto = `En el Hospital Bertha Calderón nació Axel Donier Páramo Cruz a las 12:15 de la madrugada.
Su madre, Cleidy Elizabeth Cruz Hernández, de 19 años, reside en el barrio Hialeah de Managua.
En el Hospital Alemán Nicaragüense nació Mateo Romero Reyes a las 1:30 de la madrugada.
Su madre, Deyling Mercedes Reyes Montes, de 25 años, originaria de San Francisco Libre, Managua.`;

    const entidades = extractEntities(texto);
    const issues = detectInternalContradictions(entidades, texto);

    const contradiccionesBloqueantes = issues.filter(
      (i) => i.categoria === 'contradiccion' && i.severidad === 'blocking'
    );

    // No debe haber contradicción bloqueante por "Su madre"
    const suMadreIssue = contradiccionesBloqueantes.find((i) =>
      i.mensaje.includes('Su madre')
    );
    expect(suMadreIssue).toBeUndefined();
  });

  it('SÍ debe detectar contradicción cuando la MISMA persona aparece con edades distintas', () => {
    const texto = `Cleidy Elizabeth Cruz Hernández, de 19 años, fue detenida hoy.
Cleidy Elizabeth Cruz Hernández, de 25 años, compareció ante el juez.`;

    const entidades = extractEntities(texto);
    const issues = detectInternalContradictions(entidades, texto);

    const contradicciones = issues.filter(
      (i) =>
        i.categoria === 'contradiccion' &&
        i.severidad === 'blocking' &&
        i.mensaje.includes('Cleidy')
    );

    expect(contradicciones.length).toBeGreaterThan(0);
  });

  it('NO debe capturar "El padre" como nombre de persona', () => {
    const texto = `El padre, Juan Pérez García, de 40 años, denunció el hecho.
El padre, Pedro Martínez López, de 50 años, confirmó la versión.`;

    const entidades = extractEntities(texto);
    const issues = detectInternalContradictions(entidades, texto);

    const elPadreIssue = issues.find(
      (i) =>
        i.categoria === 'contradiccion' &&
        i.severidad === 'blocking' &&
        i.mensaje.includes('El padre')
    );
    expect(elPadreIssue).toBeUndefined();
  });

  it('SÍ debe capturar nombres propios reales con edades', () => {
    const texto = `Juan Pérez García, de 40 años, denunció el hecho hoy en Managua.`;
    const entidades = extractEntities(texto);
    const issues = detectInternalContradictions(entidades, texto);

    // No hay contradicción (solo una edad para Juan), pero el nombre debe estar en entidades
    expect(entidades.nombres).toContain('Juan Pérez García');
    expect(entidades.edades).toContain('40');
  });
});
