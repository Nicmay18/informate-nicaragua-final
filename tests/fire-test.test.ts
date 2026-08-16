/**
 * Prueba de fuego — Noticia real atravesando el flujo editorial completo
 * =====================================================================
 * Simula el ciclo de vida de una noticia desde el título crudo hasta
 * la publicación, verificando que cada etapa del Supervisor funcione.
 *
 * Ejecutar: npx vitest run tests/fire-test.test.ts
 */

import { describe, it, expect } from 'vitest';
import { evaluateRawTitle, makeEditorialDecision } from '@/lib/supervisor/editorial-supervisor';
import { detectContentProfile } from '@/lib/meni/profile-detector';
import { resolvePublicCategory } from '@/lib/editorial/canonical';
import { assertSupervisorApprovesCreation } from '@/lib/editorial/supervisor-gate';
import type { ArticleContext } from '@/lib/supervisor/types';
import type { ResearchResult } from '@/lib/research/types';

// ═══════════════════════════════════════════════════════════════
// NOTICIA REAL DE PRUEBA
// ═══════════════════════════════════════════════════════════════

const NOTICIA_REAL = {
  titulo: 'Policía Nacional captura a líder de banda de narcotráfico en Managua tras operación de 6 meses',
  resumen: 'La Policía Nacional capturó este martes a Juan Carlos Pérez Mendoza, líder de una banda de narcotráfico que operaba en Managua, tras una operación de seis meses.',
  contenido: `<p>La Policía Nacional de Nicaragua capturó este martes a Juan Carlos Pérez Mendoza, de 42 años, líder de una banda de narcotráfico que operaba en los departamentos de Managua y Masaya, según confirmó el comisario Carlos Marenco en rueda de prensa.</p>
<p>La operación, denominada "Tormenta del Pacífico", se desarrolló durante seis meses y permitió el decomiso de 45 kilogramos de cocaína, tres vehículos y medio millón de córdobas en efectivo, informaron las autoridades.</p>
<p>"Este es un golpe significativo al crimen organizado en la región del Pacífico nicaragüense. Trabajaremos para desarticular completamente esta red", declaró el comisario Marenco, jefe de la Dirección de Auxilio Judicial.</p>
<p>La captura se produjo en un operativo realizado a las 5:00 de la madrugada en el barrio Luisa Mercado, distrito IV de Managua, donde Pérez Mendoza mantenía su centro de operaciones según las investigaciones.</p>
<p>El Ministerio Público anunció que solicitará prisión preventiva por delitos de narcotráfico y asociación ilícita, penas que en Nicaragua pueden llegar hasta 20 años de prisión.</p>`,
  categoria: 'Sucesos',
  imagen: 'https://nicaraguainformate.com/images/captura-narcotrafico-managua.webp',
  autor: 'Redacción Sucesos',
};

// ═══════════════════════════════════════════════════════════════
// FLUJO COMPLETO
// ═══════════════════════════════════════════════════════════════

describe('Prueba de fuego — Noticia real atravesando el flujo', () => {
  // ETAPA 1: evaluateRawTitle (antes de redactar)
  describe('Etapa 1: evaluateRawTitle — evaluación del título crudo', () => {
    it('El título real debe pasar el gate pre-redacción (no INVESTIGAR_MAS)', () => {
      const eval_ = evaluateRawTitle(NOTICIA_REAL.titulo);
      expect(eval_.verdict).not.toBe('INVESTIGAR_MAS');
      expect(eval_.isGeneric).toBe(false);
      console.log('[Etapa 1] evaluateRawTitle:', eval_.verdict, '-', eval_.reason);
    });

    it('Un título clickbait genérico debe ser bloqueado', () => {
      const eval_ = evaluateRawTitle('Capturan a peligroso delincuente');
      expect(eval_.verdict).toBe('INVESTIGAR_MAS');
      expect(eval_.needsInvestigation).toBe(true);
      console.log('[Etapa 1b] Clickbait bloqueado:', eval_.verdict, '-', eval_.reason);
    });
  });

  // ETAPA 2: Profile detection + categoría canónica
  describe('Etapa 2: Profile detection + categoría canónica', () => {
    it('Debe detectar perfil "sucesos" y categoría "Sucesos"', () => {
      const profile = detectContentProfile(
        NOTICIA_REAL.titulo,
        NOTICIA_REAL.contenido,
        NOTICIA_REAL.resumen,
      );
      console.log('[Etapa 2] Perfil detectado:', profile.profile_detected, 'confianza:', profile.profile_confidence);
      expect(profile.profile_detected).toBe('sucesos');

      const cat = resolvePublicCategory({
        titulo: NOTICIA_REAL.titulo,
        contenido: NOTICIA_REAL.contenido,
        resumen: NOTICIA_REAL.resumen,
        perfil: profile.profile_detected,
        categoria: NOTICIA_REAL.categoria,
      } as any);
      console.log('[Etapa 2] Categoría canónica:', cat);
      expect(cat).toBe('Sucesos');
    });
  });

  // ETAPA 3: makeEditorialDecision (decisión del Supervisor)
  describe('Etapa 3: makeEditorialDecision — decisión editorial del Supervisor', () => {
    it('La noticia completa debe ser aprobada para PUBLICAR', () => {
      const ctx: ArticleContext = {
        titulo: NOTICIA_REAL.titulo,
        contenido: NOTICIA_REAL.contenido,
        resumen: NOTICIA_REAL.resumen,
        categoria: NOTICIA_REAL.categoria,
        imagen: NOTICIA_REAL.imagen,
        scoreMeni: 92,
        aprobadoMeni: true,
      };
      const decision = makeEditorialDecision(ctx);
      console.log('[Etapa 3] Verdict:', decision.verdict);
      console.log('[Etapa 3] State:', decision.resultingState);
      console.log('[Etapa 3] Issues:', decision.issues.map(i => `${i.severity}:${i.domain} - ${i.problem}`).join('; '));
      console.log('[Etapa 3] Confidence:', decision.confidence);

      expect(decision.verdict).toBe('PUBLICAR');
      expect(decision.resultingState).toBe('READY');
      // No debe haber issues CRITICAL
      expect(decision.issues.some(i => i.severity === 'CRITICAL')).toBe(false);
    });
  });

  // ETAPA 4: supervisor-gate (gate de creación)
  describe('Etapa 4: supervisor-gate — gate de creación', () => {
    it('assertSupervisorApprovesCreation debe aprobar la noticia', () => {
      const gate = assertSupervisorApprovesCreation({
        titulo: NOTICIA_REAL.titulo,
        contenido: NOTICIA_REAL.contenido,
        resumen: NOTICIA_REAL.resumen,
        categoria: NOTICIA_REAL.categoria,
        imagen: NOTICIA_REAL.imagen,
        scoreMeni: 92,
        aprobadoMeni: true,
      });
      console.log('[Etapa 4] Gate approved:', gate.approved);
      console.log('[Etapa 4] Gate reason:', gate.reason);
      expect(gate.approved).toBe(true);
    });

    it('Una noticia con conflicto de fuentes debe ser bloqueada por el gate', () => {
      const researchWithConflict: ResearchResult = {
        researchStartedAt: new Date().toISOString(),
        researchCompletedAt: new Date().toISOString(),
        modelVersion: 'test',
        rawInput: NOTICIA_REAL.titulo,
        summary: 'Conflicto entre fuentes',
        factsFound: [],
        sourcesChecked: [],
        sourcesAccepted: [],
        sourcesRejected: [],
        conflictsFound: [
          {
            topic: 'Cantidad decomisada',
            versionA: { claim: '45 kg', source: { name: 'Policía', level: 'PRIMARY' } },
            versionB: { claim: '60 kg', source: { name: 'Fiscalía', level: 'PRIMARY' } },
            recommendation: 'Esperar confirmación oficial',
          },
        ],
        missingInformation: [],
        additionalContext: [],
        hasNewInformation: false,
        changesOriginalFocus: false,
        recommendedAction: 'INVESTIGATE_MORE',
        reason: 'Conflicto detectado',
      };

      const gate = assertSupervisorApprovesCreation({
        titulo: NOTICIA_REAL.titulo,
        contenido: NOTICIA_REAL.contenido,
        resumen: NOTICIA_REAL.resumen,
        categoria: NOTICIA_REAL.categoria,
        imagen: NOTICIA_REAL.imagen,
        scoreMeni: 95,
        aprobadoMeni: true,
        research: researchWithConflict,
      });
      console.log('[Etapa 4b] Gate approved (conflicto):', gate.approved);
      console.log('[Etapa 4b] Gate reason:', gate.reason);
      expect(gate.approved).toBe(false);
    });
  });

  // ETAPA 5: Noticia con información desactualizada (Interpol case)
  describe('Etapa 5: Información desactualizada → ACTUALIZAR', () => {
    it('Research con changesOriginalFocus debe producir verdict ACTUALIZAR', () => {
      const researchOutdated: ResearchResult = {
        researchStartedAt: new Date().toISOString(),
        researchCompletedAt: new Date().toISOString(),
        modelVersion: 'test',
        rawInput: NOTICIA_REAL.titulo,
        summary: 'La persona fue liberada posteriormente',
        factsFound: [
          {
            claim: 'Pérez Mendoza fue capturado el martes',
            status: 'OUTDATED',
            sources: [{ name: 'Policía', level: 'PRIMARY' }],
            confidence: 0.9,
          },
          {
            claim: 'Pérez Mendoza fue liberado el jueves por falta de pruebas',
            status: 'CONFIRMED',
            sources: [{ name: 'Fiscalía', level: 'PRIMARY' }],
            confidence: 0.85,
          },
        ],
        sourcesChecked: [{ name: 'Policía', level: 'PRIMARY' }],
        sourcesAccepted: [{ name: 'Fiscalía', level: 'PRIMARY' }],
        sourcesRejected: [],
        conflictsFound: [],
        missingInformation: [],
        additionalContext: [],
        hasNewInformation: true,
        newInformationSummary: 'Pérez Mendoza fue liberado el jueves por falta de pruebas',
        changesOriginalFocus: true,
        recommendedAction: 'UPDATE_FOCUS',
        reason: 'La información original ya no es vigente',
      };

      const ctx: ArticleContext = {
        titulo: NOTICIA_REAL.titulo,
        contenido: NOTICIA_REAL.contenido,
        resumen: NOTICIA_REAL.resumen,
        categoria: NOTICIA_REAL.categoria,
        imagen: NOTICIA_REAL.imagen,
        scoreMeni: 90,
        aprobadoMeni: true,
        research: researchOutdated,
      };
      const decision = makeEditorialDecision(ctx);
      console.log('[Etapa 5] Verdict:', decision.verdict);
      console.log('[Etapa 5] State:', decision.resultingState);
      expect(decision.verdict).toBe('ACTUALIZAR');
      expect(decision.resultingState).toBe('UPDATE_DETECTED');
    });
  });

  // ETAPA 6: Score override — MENI alto pero Supervisor bloquea
  describe('Etapa 6: Score override — MENI 95 pero conflicto → scoreOverride', () => {
    it('Score MENI 95 con conflicto debe activar scoreOverride', () => {
      const researchConflict: ResearchResult = {
        researchStartedAt: new Date().toISOString(),
        researchCompletedAt: new Date().toISOString(),
        modelVersion: 'test',
        rawInput: '',
        summary: 'Conflicto',
        factsFound: [],
        sourcesChecked: [],
        sourcesAccepted: [],
        sourcesRejected: [],
        conflictsFound: [
          {
            topic: 'Hecho',
            versionA: { claim: 'A', source: { name: 'X', level: 'PRIMARY' } },
            versionB: { claim: 'B', source: { name: 'Y', level: 'PRIMARY' } },
            recommendation: 'Esperar',
          },
        ],
        missingInformation: [],
        additionalContext: [],
        hasNewInformation: false,
        changesOriginalFocus: false,
        recommendedAction: 'INVESTIGATE_MORE',
        reason: 'Conflicto',
      };

      const ctx: ArticleContext = {
        titulo: NOTICIA_REAL.titulo,
        contenido: NOTICIA_REAL.contenido,
        resumen: NOTICIA_REAL.resumen,
        categoria: NOTICIA_REAL.categoria,
        imagen: NOTICIA_REAL.imagen,
        scoreMeni: 95,
        aprobadoMeni: true,
        research: researchConflict,
      };
      const decision = makeEditorialDecision(ctx);
      console.log('[Etapa 6] scoreOverride:', decision.scoreOverride);
      console.log('[Etapa 6] reason:', decision.scoreOverrideReason);
      expect(decision.scoreOverride).toBe(true);
      expect(decision.verdict).toBe('BLOQUEAR');
    });
  });

  // ETAPA 7: Noticia sin imagen → WARNING pero no bloquea
  describe('Etapa 7: Noticia sin imagen → WARNING no bloquea', () => {
    it('Noticia completa sin imagen debe ser PUBLICAR con WARNING', () => {
      const ctx: ArticleContext = {
        titulo: NOTICIA_REAL.titulo,
        contenido: NOTICIA_REAL.contenido,
        resumen: NOTICIA_REAL.resumen,
        categoria: NOTICIA_REAL.categoria,
        imagen: '',
        scoreMeni: 92,
        aprobadoMeni: true,
      };
      const decision = makeEditorialDecision(ctx);
      console.log('[Etapa 7] Verdict:', decision.verdict);
      console.log('[Etapa 7] Issues:', decision.issues.map(i => `${i.severity}:${i.domain}`).join('; '));
      expect(decision.verdict).toBe('PUBLICAR');
      expect(decision.issues.some(i => i.domain === 'IMAGEN')).toBe(true);
    });
  });

  // ETAPA 8: Resumen del flujo completo
  describe('Etapa 8: Resumen del flujo completo', () => {
    it('Debe imprimir el resumen del flujo completo', () => {
      const titleEval = evaluateRawTitle(NOTICIA_REAL.titulo);
      const profile = detectContentProfile(NOTICIA_REAL.titulo, NOTICIA_REAL.contenido, NOTICIA_REAL.resumen);
      const cat = resolvePublicCategory({
        titulo: NOTICIA_REAL.titulo,
        contenido: NOTICIA_REAL.contenido,
        resumen: NOTICIA_REAL.resumen,
        perfil: profile.profile_detected,
        categoria: NOTICIA_REAL.categoria,
      } as any);
      const decision = makeEditorialDecision({
        titulo: NOTICIA_REAL.titulo,
        contenido: NOTICIA_REAL.contenido,
        resumen: NOTICIA_REAL.resumen,
        categoria: cat,
        imagen: NOTICIA_REAL.imagen,
        scoreMeni: 92,
        aprobadoMeni: true,
      });
      const gate = assertSupervisorApprovesCreation({
        titulo: NOTICIA_REAL.titulo,
        contenido: NOTICIA_REAL.contenido,
        resumen: NOTICIA_REAL.resumen,
        categoria: cat,
        imagen: NOTICIA_REAL.imagen,
        scoreMeni: 92,
        aprobadoMeni: true,
      });

      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('PRUEBA DE FUEGO — RESUMEN DEL FLUJO COMPLETO');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('Título:', NOTICIA_REAL.titulo);
      console.log('Etapa 1 (evaluateRawTitle):', titleEval.verdict);
      console.log('Etapa 2 (profile):', profile.profile_detected, '| categoría:', cat);
      console.log('Etapa 3 (Supervisor):', decision.verdict, '| state:', decision.resultingState);
      console.log('Etapa 3 (confidence):', decision.confidence);
      console.log('Etapa 3 (issues):', decision.issues.length, 'issues');
      console.log('Etapa 4 (gate):', gate.approved ? 'APROBADO' : 'BLOQUEADO');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('RESULTADO: La noticia atravesó todo el flujo editorial correctamente.');
      console.log('═══════════════════════════════════════════════════════════════\n');

      expect(titleEval.verdict).not.toBe('INVESTIGAR_MAS');
      expect(profile.profile_detected).toBe('sucesos');
      expect(cat).toBe('Sucesos');
      expect(decision.verdict).toBe('PUBLICAR');
      expect(gate.approved).toBe(true);
    });
  });
});
