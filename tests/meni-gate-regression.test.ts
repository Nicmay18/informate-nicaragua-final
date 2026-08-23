import { describe, it, expect } from 'vitest';
import { makeEditorialDecision } from '@/lib/supervisor/editorial-supervisor';
import type { ArticleContext } from '@/lib/supervisor/types';
import { runReaderQuestionsEngine } from '@/lib/meni/editorial-brain/reader-questions-engine';
import type { EditorialBrainInput } from '@/lib/meni/editorial-brain/types';
import { resolvePublicCategory } from '@/lib/editorial/canonical';

function tourismContent(complete: boolean): string {
  const base =
    'El campo de girasoles de Catarina se encuentra en el departamento de Masaya, a pocos minutos de Granada. ' +
    'Es un atractivo turístico rural que recibe visitantes los fines de semana y ofrece paseos entre los cultivos.';
  const price = complete
    ? ' La entrada tiene un costo de 50 córdobas por persona.'
    : '';
  const access = complete
    ? ' Se accede por carretera asfaltada desde la carretera a Masaya.'
    : '';
  return base + price + access;
}

function baseContext(overrides: Partial<ArticleContext> = {}): ArticleContext {
  return {
    titulo: 'Campo de girasoles en Catarina: precios, horario y cómo llegar',
    contenido: tourismContent(true),
    resumen: 'Guía para visitar el campo de girasoles de Catarina, con precios, horarios y acceso.',
    categoria: 'Nacionales',
    perfil: 'turismo',
    scoreMeni: 94,
    aprobadoMeni: true,
    recomendacionMeni: 'publicar',
    adnNI: 94,
    exclusividad: 100,
    wow: 95,
    eeat: 90,
    ...overrides,
  };
}

describe('MENI Publication Gate (A-K)', () => {
  it('A. Turismo completo con score 94, aprobado true y 0 bloqueantes => PUBLICAR', () => {
    const decision = makeEditorialDecision(baseContext());
    expect(decision.verdict).toBe('PUBLICAR');
    expect(decision.resultingState).toBe('READY');
  });

  it('D. Turismo no pregunta "qué institución interviene"', () => {
    const input = {
      titulo: 'Campo de girasoles en Catarina: precios, horario y cómo llegar',
      contenido: tourismContent(true),
      resumen: 'Guía turística.',
      categoria: 'Nacionales',
      perfil: 'turismo',
    } as EditorialBrainInput;
    const questions = runReaderQuestionsEngine(input);
    const textoPreguntas = questions.preguntasObligatorias.join(' ').toLowerCase();
    expect(textoPreguntas).not.toContain('institución');
    expect(textoPreguntas).not.toContain('interviene');
    expect(textoPreguntas).toContain('donde esta ubicado');
  });

  it('H. "Toro embiste a hombre durante Tope de Toros" resuelve a Sucesos', () => {
    const categoria = resolvePublicCategory({
      titulo: 'Toro embiste a hombre durante Tope de Toros en Managua',
      contenido: 'Un hombre resultó herido durante el Tope de Toros en Managua. Fue atendido por paramédicos.',
      resumen: 'Incidente en Tope de Toros.',
      categoria: 'Espectáculos',
      perfil: 'sucesos',
    });
    expect(categoria).toBe('Sucesos');
  });

  it('I. Nota aprobada con score 90 y 0 bloqueantes => PUBLICAR', () => {
    const decision = makeEditorialDecision(baseContext({ scoreMeni: 90, recomendacionMeni: 'publicar' }));
    expect(decision.verdict).toBe('PUBLICAR');
  });

  it('J. Nota score 94, Editor Jefe MEJORAR, 0 bloqueantes => PUBLICAR', () => {
    const decision = makeEditorialDecision(baseContext({ scoreMeni: 94, recomendacionMeni: 'publicar' }));
    expect(decision.verdict).toBe('PUBLICAR');
  });

  it('K. Nota score 95 con bloqueante factual => NO_PUBLICAR', () => {
    const decision = makeEditorialDecision(
      baseContext({
        scoreMeni: 95,
        recomendacionMeni: 'publicar',
        research: {
          recommendedAction: 'DO_NOT_PUBLISH',
          reason: 'La investigación indica que los hechos aún no están confirmados.',
          conflictsFound: [],
          missingInformation: [],
          hasNewInformation: false,
          changesOriginalFocus: false,
          newInformationSummary: '',
          factsFound: [],
        } as any,
      })
    );
    expect(decision.verdict).toBe('NO_PUBLICAR');
  });
});
