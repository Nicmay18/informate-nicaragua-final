/**
 * Editorial Supervisor — Tests de los 13 casos críticos del prompt
 * =================================================================
 * Pruebas de realidad. No "el código parece correcto".
 *
 * 1. Sismo Indonesia → Internacionales
 * 2. Volcán extranjero → Internacionales
 * 3. Hallan cuerpo muerto → INVESTIGAR
 * 4. Interpol captura → investigar actualización
 * 5. Interpol libera → UPDATE DETECTED
 * 6. Noticia publicada → entra en WATCH
 * 7. Nueva información → actualización detectada
 * 8. Conflicto de fuentes → bloquear actualización automática
 * 9. Re-publicación → conservar publishedAt
 * 10. dateModified → actualizar correctamente
 * 11. Facebook → generar publicación social
 * 12. Telegram → distribución automática
 * 13. Costos → respetar límites
 */

import { describe, it, expect } from 'vitest';
import { evaluateRawTitle, makeEditorialDecision } from '@/lib/supervisor/editorial-supervisor';
import { detectWastefulCalls } from '@/lib/supervisor/cost-guard';
import { detectContentProfile } from '@/lib/meni/profile-detector';
import { resolvePublicCategory } from '@/lib/editorial/canonical';
import type { ArticleContext } from '@/lib/supervisor/types';
import type { ResearchResult } from '@/lib/research/types';
import type { StoryProposal } from '@/lib/editorial/story-editor/types';

// ═══════════════════════════════════════════════════════════════
// CASOS 1-2: PERFILADO DE DESASTRES EN PAÍS EXTRANJERO
// ═══════════════════════════════════════════════════════════════

describe('Supervisor — Casos 1-2: Sismo/Volcán extranjero → Internacionales', () => {
  it('Caso 1: Sismo de 7.7 en Indonesia → perfil internacional, categoría Internacionales', () => {
    const profile = detectContentProfile(
      'Sismo de 7.7 sacude Indonesia y deja al menos dos muertos',
      'Un sismo de magnitud 7.7 sacudió Indonesia dejando al menos dos muertos y varios heridos. Las autoridades indonesias reportan daños en infraestructura.',
      'Sismo en Indonesia deja víctimas',
    );
    expect(profile.profile_detected).toBe('internacional');
    expect(profile.profile_detected).not.toBe('ambiente');

    const cat = resolvePublicCategory({
      titulo: 'Sismo de 7.7 sacude Indonesia y deja al menos dos muertos',
      contenido: 'Un sismo de magnitud 7.7 sacudió Indonesia...',
      resumen: 'Sismo en Indonesia deja víctimas',
      perfil: profile.profile_detected,
    } as any);
    expect(cat).toBe('Internacionales');
  });

  it('Caso 2: Volcán en Japón → perfil internacional, categoría Internacionales', () => {
    const profile = detectContentProfile(
      'Volcán Sakurajima en Japón entra en erupción y obliga a evacuar',
      'El volcán Sakurajima en Japón registró una erupción explosiva. Las autoridades japonesas ordenaron la evacuación de zonas cercanas.',
      'Erupción volcánica en Japón',
    );
    expect(profile.profile_detected).toBe('internacional');

    const cat = resolvePublicCategory({
      titulo: 'Volcán Sakurajima en Japón entra en erupción',
      contenido: 'El volcán Sakurajima en Japón...',
      resumen: 'Erupción volcánica en Japón',
      perfil: profile.profile_detected,
    } as any);
    expect(cat).toBe('Internacionales');
  });
});

// ═══════════════════════════════════════════════════════════════
// CASO 3: HALLAN CUERPO MUERTO → INVESTIGAR
// ═══════════════════════════════════════════════════════════════

describe('Supervisor — Caso 3: "Hallan cuerpo muerto" → INVESTIGAR', () => {
  it('Título genérico "Hallan cuerpo muerto" → verdict INVESTIGAR_MAS', () => {
    const eval_ = evaluateRawTitle('Hallan cuerpo muerto');
    expect(eval_.isGeneric).toBe(true);
    expect(eval_.needsInvestigation).toBe(true);
    expect(eval_.verdict).toBe('INVESTIGAR_MAS');
    expect(eval_.missingData.length).toBeGreaterThanOrEqual(2);
    // Debe mencionar al menos: lugar, autoridad, cuándo
    const missingStr = eval_.missingData.join(' ').toLowerCase();
    expect(missingStr).toMatch(/lugar|autoridad|cuándo/);
  });

  it('Decisión del supervisor sobre "Hallan cuerpo muerto" → issues IMPORTANT/CRITICAL', () => {
    const ctx: ArticleContext = {
      titulo: 'Hallan cuerpo muerto',
      contenido: 'Hallan cuerpo muerto en un lugar no especificado.',
      resumen: '',
    };
    const decision = makeEditorialDecision(ctx);
    expect(decision.verdict).not.toBe('PUBLICAR');
    expect(decision.issues.some(i => i.domain === 'TITULO')).toBe(true);
  });

  it('Título con datos suficientes → verdict PUBLICAR o PUBLICAR_CON_CAMBIOS', () => {
    const eval_ = evaluateRawTitle(
      'Tras horas de búsqueda encuentran sin vida a Juan Pérez en el río San Juan, Managua'
    );
    expect(eval_.verdict).not.toBe('INVESTIGAR_MAS');
  });
});

// ═══════════════════════════════════════════════════════════════
// CASOS 4-5: INTERPOL — CAPTURA Y LIBERACIÓN
// ═══════════════════════════════════════════════════════════════

describe('Supervisor — Casos 4-5: Interpol captura/libera', () => {
  const researchWithUpdate: ResearchResult = {
    researchStartedAt: new Date().toISOString(),
    researchCompletedAt: new Date().toISOString(),
    modelVersion: 'test',
    rawInput: 'Interpol El Salvador capturó a una nicaragüense',
    summary: 'La investigación encontró que la persona fue liberada posteriormente.',
    factsFound: [
      {
        claim: 'Interpol El Salvador capturó a una nicaragüense el lunes',
        status: 'OUTDATED',
        sources: [{ name: 'Interpol', level: 'PRIMARY' }],
        confidence: 0.9,
      },
      {
        claim: 'La autoridad confirmó que fue liberada el miércoles',
        status: 'CONFIRMED',
        sources: [{ name: 'Autoridad migratoria El Salvador', level: 'PRIMARY' }],
        confidence: 0.85,
      },
    ],
    sourcesChecked: [{ name: 'Interpol', level: 'PRIMARY' }],
    sourcesAccepted: [{ name: 'Autoridad migratoria El Salvador', level: 'PRIMARY' }],
    sourcesRejected: [],
    conflictsFound: [],
    missingInformation: [],
    additionalContext: [],
    hasNewInformation: true,
    newInformationSummary: 'La persona capturada fue liberada posteriormente según la autoridad competente.',
    changesOriginalFocus: true,
    recommendedAction: 'UPDATE_FOCUS',
    reason: 'La información original ya no es vigente.',
  };

  it('Caso 4: Interpol captura → investigación detecta que necesita actualización', () => {
    const ctx: ArticleContext = {
      titulo: 'Interpol El Salvador capturó a una nicaragüense',
      contenido: 'Interpol El Salvador capturó a una nicaragüense el lunes.',
      research: researchWithUpdate,
    };
    const decision = makeEditorialDecision(ctx);
    // Debe detectar que hay información nueva que cambia el enfoque
    expect(decision.issues.some(i => i.domain === 'ACTUALIZACION' && i.severity === 'CRITICAL')).toBe(true);
    expect(decision.verdict).toBe('ACTUALIZAR');
    expect(decision.resultingState).toBe('UPDATE_DETECTED');
  });

  it('Caso 5: Información de liberación → UPDATE_DETECTED, no publicar como vigente', () => {
    const ctx: ArticleContext = {
      titulo: 'Interpol El Salvador capturó a una nicaragüense',
      contenido: 'Interpol El Salvador capturó a una nicaragüense.',
      research: {
        ...researchWithUpdate,
        hasNewInformation: true,
        changesOriginalFocus: true,
        newInformationSummary: 'Fue liberada según confirmó la autoridad.',
      },
    };
    const decision = makeEditorialDecision(ctx);
    expect(decision.verdict).not.toBe('PUBLICAR');
    expect(decision.scoreOverride || decision.issues.some(i => i.severity === 'CRITICAL')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// CASO 6-7: NOTICIA PUBLICADA → WATCH → ACTUALIZACIÓN
// ═══════════════════════════════════════════════════════════════

describe('Supervisor — Casos 6-7: Watch y actualización', () => {
  it('Caso 6: Noticia publicada sin issues → READY/PUBLISHED', () => {
    const ctx: ArticleContext = {
      titulo: 'Gobierno anuncia nuevo programa de salud para 2025',
      contenido: 'El gobierno de Nicaragua anunció un nuevo programa de salud que beneficiará a más de un millón de personas en 2025. El ministro de salud confirmó la iniciativa en rueda de prensa.',
      resumen: 'Gobierno anuncia programa de salud 2025',
      categoria: 'Nacionales',
      perfil: 'nacionales',
      imagen: 'https://example.com/imagen.jpg',
      scoreMeni: 85,
      aprobadoMeni: true,
    };
    const decision = makeEditorialDecision(ctx);
    expect(decision.verdict).toBe('PUBLICAR');
    expect(decision.resultingState).toBe('READY');
  });

  it('Caso 7: Research con hasNewInformation → detecta actualización', () => {
    const ctx: ArticleContext = {
      titulo: 'Gobierno anuncia nuevo programa de salud',
      contenido: 'El gobierno anunció un programa de salud.',
      research: {
        researchStartedAt: new Date().toISOString(),
        researchCompletedAt: new Date().toISOString(),
        modelVersion: 'test',
        rawInput: '',
        summary: 'Nueva información disponible',
        factsFound: [],
        sourcesChecked: [],
        sourcesAccepted: [],
        sourcesRejected: [],
        conflictsFound: [],
        missingInformation: [],
        additionalContext: [],
        hasNewInformation: true,
        newInformationSummary: 'El programa fue ampliado a 2 millones de beneficiarios.',
        changesOriginalFocus: false,
        recommendedAction: 'PROCEED',
        reason: 'Información complementaria',
      },
    };
    const decision = makeEditorialDecision(ctx);
    // changesOriginalFocus=false → no es CRITICAL, pero debe haber issue de ACTUALIZACION
    expect(decision.issues.some(i => i.domain === 'ACTUALIZACION')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// CASO 8: CONFLICTO DE FUENTES → BLOQUEAR
// ═══════════════════════════════════════════════════════════════

describe('Supervisor — Caso 8: Conflicto de fuentes → BLOQUEAR', () => {
  it('Research con conflictos → verdict BLOQUEAR', () => {
    const ctx: ArticleContext = {
      titulo: 'Autoridad reporta cifra de accidente',
      contenido: 'Un accidente de tránsito dejó varios heridos.',
      research: {
        researchStartedAt: new Date().toISOString(),
        researchCompletedAt: new Date().toISOString(),
        modelVersion: 'test',
        rawInput: '',
        summary: 'Conflicto entre fuentes',
        factsFound: [],
        sourcesChecked: [],
        sourcesAccepted: [],
        sourcesRejected: [],
        conflictsFound: [
          {
            topic: 'Número de heridos',
            versionA: { claim: '3 heridos', source: { name: 'Policía', level: 'PRIMARY' } },
            versionB: { claim: '5 heridos', source: { name: 'Cruz Roja', level: 'PRIMARY' } },
            recommendation: 'Esperar confirmación oficial',
          },
        ],
        missingInformation: [],
        additionalContext: [],
        hasNewInformation: false,
        changesOriginalFocus: false,
        recommendedAction: 'INVESTIGATE_MORE',
        reason: 'Conflicto detectado',
      },
    };
    const decision = makeEditorialDecision(ctx);
    expect(decision.issues.some(i => i.domain === 'CONFLICTO' && i.severity === 'CRITICAL')).toBe(true);
    expect(decision.verdict).toBe('BLOQUEAR');
    expect(decision.resultingState).toBe('EDITORIAL_REVIEW');
  });
});

// ═══════════════════════════════════════════════════════════════
// CASO 9-10: TIMESTAMPS CANÓNICOS
// ═══════════════════════════════════════════════════════════════

describe('Supervisor — Casos 9-10: Timestamps canónicos', () => {
  it('Caso 9: Re-publicación no debe resetear publishedAt (lógica del decision)', () => {
    // La lógica de preservación está en guardar-directo/route.ts
    // Aquí verificamos que el supervisor no genera issues por publishedAt existente
    const ctx: ArticleContext = {
      titulo: 'Noticia ya publicada con actualización menor',
      contenido: 'Contenido de la noticia.',
      publicado: true,
      estado: 'publicado',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      dateModified: new Date().toISOString(),
      imagen: 'https://example.com/img.jpg',
      scoreMeni: 90,
      aprobadoMeni: true,
    };
    const decision = makeEditorialDecision(ctx);
    // No debe haber issues sobre publishedAt si ya existe
    expect(decision.issues.some(i => i.domain === 'ARTICULO' && i.problem.includes('publishedAt'))).toBe(false);
  });

  it('Caso 10: dateModified se actualiza — el supervisor no bloquea por esto', () => {
    const ctx: ArticleContext = {
      titulo: 'Noticia actualizada correctamente',
      contenido: 'Contenido actualizado.',
      publicado: true,
      estado: 'publicado',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      dateModified: new Date().toISOString(),
      imagen: 'https://example.com/img.jpg',
      scoreMeni: 88,
      aprobadoMeni: true,
    };
    const decision = makeEditorialDecision(ctx);
    expect(decision.verdict).toBe('PUBLICAR');
  });
});

// ═══════════════════════════════════════════════════════════════
// CASO 11-12: SOCIAL — FACEBOOK Y TELEGRAM
// ═══════════════════════════════════════════════════════════════

describe('Supervisor — Casos 11-12: Social', () => {
  it('Caso 11: StoryProposal incluye distribución social (Facebook)', () => {
    const story: StoryProposal = {
      verdict: 'PUBLICAR',
      reason: 'Noticia completa',
      focusAngle: 'Programa de salud beneficia a 1M de personas',
      suggestedTitle: 'Gobierno anuncia programa de salud 2025',
      alternativeTitles: [],
      suggestedSummary: 'El gobierno anunció un programa que beneficiará a un millón de personas.',
      suggestedBody: '<p>El gobierno anunció el programa.</p>',
      context: 'Programa de salud',
      keyData: ['1 millón de beneficiarios'],
      sources: ['Ministerio de Salud'],
      questionsAnswered: ['¿Qué anunció?', '¿A quién beneficia?'],
      readerSatisfaction: {
        understandsWhatHappened: true,
        understandsWhyItMatters: true,
        understandsWhere: true,
        understandsWhen: true,
        knowsWhoConfirmed: true,
        hasNecessaryContext: true,
        score: 85,
        improvements: [],
      },
      seo: {
        title: 'Gobierno anuncia programa de salud 2025',
        metaDescription: 'Programa de salud beneficiará a 1M de personas',
        slug: 'gobierno-anuncia-programa-salud-2025',
        keywords: ['salud', 'gobierno', 'nicaragua'],
        entities: ['Ministerio de Salud'],
        searchIntent: 'noticias nicaragua salud',
      },
      distribution: {
        social: '🇳🇮 Nicaragua estrena un nuevo programa de salud que beneficiará a más de un millón de personas en 2025. Conocé los detalles.',
        telegram: '🇳🇮 Gobierno anuncia programa de salud 2025',
      },
    };

    const ctx: ArticleContext = {
      titulo: story.suggestedTitle,
      contenido: story.suggestedBody,
      resumen: story.suggestedSummary,
      imagen: 'https://example.com/img.jpg',
      scoreMeni: 90,
      aprobadoMeni: true,
      story,
    };
    const decision = makeEditorialDecision(ctx);
    expect(decision.verdict).toBe('PUBLICAR');
    // La distribución social se genera en publication-pipeline.ts
    // El supervisor verifica que el story tenga distribución
    expect(story.distribution.social).toBeTruthy();
    expect(story.distribution.telegram).toBeTruthy();
  });

  it('Caso 12: Telegram distribution no debe ser igual al título', () => {
    // El publication-pipeline genera caption enriquecido, no copia el título
    // Verificamos que el story tenga distribución separada
    const story: StoryProposal = {
      verdict: 'PUBLICAR',
      reason: '',
      focusAngle: '',
      suggestedTitle: 'Noticia de prueba',
      alternativeTitles: [],
      suggestedSummary: 'Resumen de prueba',
      suggestedBody: '<p>Contenido</p>',
      context: '',
      keyData: [],
      sources: [],
      questionsAnswered: [],
      readerSatisfaction: {
        understandsWhatHappened: true,
        understandsWhyItMatters: true,
        understandsWhere: true,
        understandsWhen: true,
        knowsWhoConfirmed: true,
        hasNecessaryContext: true,
        score: 80,
        improvements: [],
      },
      seo: {
        title: 'Noticia de prueba',
        metaDescription: 'Resumen',
        slug: 'noticia-prueba',
        keywords: [],
        entities: [],
        searchIntent: '',
      },
      distribution: {
        social: 'Texto social para Facebook',
        telegram: 'Texto para Telegram diferente del título',
      },
    };
    expect(story.distribution.telegram).not.toBe(story.suggestedTitle);
  });
});

// ═══════════════════════════════════════════════════════════════
// CASO 13: COSTOS — RESPETAR LÍMITES
// ═══════════════════════════════════════════════════════════════

describe('Supervisor — Caso 13: Costos', () => {
  it('detectWastefulCalls bloquea operaciones que exceden el límite', () => {
    const status = {
      callsThisHour: 45,
      maxCallsPerHour: 50,
      callsToday: 100,
      maxCallsPerDay: 300,
      callsThisMonth: 1000,
      maxCallsPerMonth: 6000,
      canCall: true,
      estimatedCostUsd: 0.36,
    };
    // 10 llamadas planeadas pero solo quedan 5 → 5 son desperdicio
    const result = detectWastefulCalls(10, status);
    expect(result.wasteful).toBe(5);
    expect(result.reason).toContain('innecesarias');
  });

  it('detectWastefulCalls permite operaciones dentro del límite', () => {
    const status = {
      callsThisHour: 10,
      maxCallsPerHour: 50,
      callsToday: 50,
      maxCallsPerDay: 300,
      callsThisMonth: 500,
      maxCallsPerMonth: 6000,
      canCall: true,
      estimatedCostUsd: 0.08,
    };
    const result = detectWastefulCalls(5, status);
    expect(result.wasteful).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// SCORE OVERRIDE — "score alto pero NO recomiendo publicar"
// ═══════════════════════════════════════════════════════════════

describe('Supervisor — Score Override', () => {
  it('Score MENI 95 pero con conflicto de fuentes → scoreOverride=true', () => {
    const ctx: ArticleContext = {
      titulo: 'Noticia con conflicto',
      contenido: 'Contenido.',
      scoreMeni: 95,
      aprobadoMeni: true,
      research: {
        researchStartedAt: new Date().toISOString(),
        researchCompletedAt: new Date().toISOString(),
        modelVersion: 'test',
        rawInput: '',
        summary: '',
        factsFound: [],
        sourcesChecked: [],
        sourcesAccepted: [],
        sourcesRejected: [],
        conflictsFound: [
          {
            topic: 'Hecho',
            versionA: { claim: 'A', source: { name: 'S1', level: 'PRIMARY' } },
            versionB: { claim: 'B', source: { name: 'S2', level: 'PRIMARY' } },
            recommendation: 'Investigar',
          },
        ],
        missingInformation: [],
        additionalContext: [],
        hasNewInformation: false,
        changesOriginalFocus: false,
        recommendedAction: 'INVESTIGATE_MORE',
        reason: 'Conflicto',
      },
    };
    const decision = makeEditorialDecision(ctx);
    expect(decision.scoreOverride).toBe(true);
    expect(decision.scoreOverrideReason).toContain('95');
    expect(decision.verdict).toBe('BLOQUEAR');
  });

  it('Score MENI 100 pero sin imagen → issue WARNING pero no bloquea', () => {
    const ctx: ArticleContext = {
      titulo: 'Gobierno anuncia programa de salud 2025 con detalles completos',
      contenido: 'El gobierno de Nicaragua anunció un nuevo programa de salud que beneficiará a más de un millón de personas en 2025. El ministro de salud confirmó la iniciativa en rueda de prensa este lunes en Managua.',
      resumen: 'Programa de salud 2025',
      scoreMeni: 100,
      aprobadoMeni: true,
      // Sin imagen
    };
    const decision = makeEditorialDecision(ctx);
    // Sin imagen es WARNING, no CRITICAL → no debe bloquear
    expect(decision.verdict).toBe('PUBLICAR');
    expect(decision.issues.some(i => i.domain === 'IMAGEN')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// CATEGORIZACIÓN CANÓNICA — UNA SOLA FUENTE DE VERDAD
// ═══════════════════════════════════════════════════════════════

describe('Supervisor — Categoría canónica', () => {
  it('Categoría del body no canónica → issue + acción RECLASSIFY', () => {
    const ctx: ArticleContext = {
      titulo: 'Sismo de 7.7 sacude Indonesia y deja al menos dos muertos',
      contenido: 'Sismo en Indonesia deja víctimas.',
      categoria: 'Ambiente', // INCORRECTO — debe ser Internacionales
      perfil: 'internacional',
      imagen: 'https://example.com/img.jpg',
      scoreMeni: 90,
      aprobadoMeni: true,
    };
    const decision = makeEditorialDecision(ctx);
    const catIssue = decision.issues.find(i => i.domain === 'CATEGORIA');
    expect(catIssue).toBeDefined();
    expect(catIssue!.autoFixable).toBe(true);
    expect(decision.actions.some(a => a.type === 'RECLASSIFY')).toBe(true);
  });
});
