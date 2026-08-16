/**
 * Test Adversarial ANTES/DESPUÉS — Cirugía anti-bypass del Supervisor
 * ====================================================================
 * Verifica que el bypass arquitectónico detectado en la auditoría
 * forense está cerrado: verdict === 'PUBLICAR' requiere
 * aprobadoMeni === true && recomendacionMeni === 'publicar' && score >= 90.
 *
 * Casos adversariales del informe forense (message 68):
 *  - CASO6:  Noticia rutinaria con score alto (92) → no debe auto-PUBLICAR
 *  - CASO8:  Investigación de alto valor con score bajo (58) → REVISION_HUMANA
 *  - CASO10: Alto valor periodístico, MENI pide MEJORAR → no PUBLICAR directo
 *  - CASO11: Título genérico con score alto (90) → no PUBLICAR
 */

import { describe, it, expect } from 'vitest';
import { makeEditorialDecision } from '@/lib/supervisor/editorial-supervisor';
import type { ArticleContext } from '@/lib/supervisor/types';

// ── Helpers ────────────────────────────────────────────────────────

function ctx(partial: Partial<ArticleContext>): ArticleContext {
  return {
    titulo: 'Título por defecto con datos suficientes',
    contenido:
      'La Policía Nacional confirmó este 15 de mayo de 2025 en Managua que se recuperaron 120 armas decomisadas en operativo. Fuente: Policía Nacional.',
    resumen: 'Resumen con datos concretos',
    categoria: 'Nacionales',
    perfil: 'nacional',
    ...partial,
  };
}

// ── Invariante central: PUBLICAR requiere meniCleared ──────────────

describe('Cirugía anti-bypass — Invariante PUBLICAR', () => {
  it('verdict PUBLICAR requiere aprobadoMeni === true', () => {
    const decision = makeEditorialDecision(
      ctx({
        titulo: 'Policía Nacional decomisa 120 armas en operativo en Managua este 15 de mayo',
        scoreMeni: 95,
        aprobadoMeni: false, // MENI NO aprobó
        recomendacionMeni: 'publicar',
        adnNI: 90,
        exclusividad: 85,
        wow: 80,
        eeat: 95,
        aportePropio: true,
      }),
    );
    expect(decision.verdict).not.toBe('PUBLICAR');
    expect(decision.resultingState).not.toBe('READY');
  });

  it('verdict PUBLICAR requiere recomendacionMeni === publicar', () => {
    const decision = makeEditorialDecision(
      ctx({
        titulo: 'Policía Nacional decomisa 120 armas en operativo en Managua este 15 de mayo',
        scoreMeni: 92,
        aprobadoMeni: true,
        recomendacionMeni: 'mejorar', // MENI pide mejorar
        adnNI: 90,
        exclusividad: 85,
        wow: 80,
        eeat: 95,
        aportePropio: true,
      }),
    );
    expect(decision.verdict).not.toBe('PUBLICAR');
    expect(decision.resultingState).not.toBe('READY');
  });

  it('verdict PUBLICAR requiere scoreMeni >= 90', () => {
    const decision = makeEditorialDecision(
      ctx({
        titulo: 'Policía Nacional decomisa 120 armas en operativo en Managua este 15 de mayo',
        scoreMeni: 88, // score < 90
        aprobadoMeni: true,
        recomendacionMeni: 'publicar',
        adnNI: 90,
        exclusividad: 85,
        wow: 80,
        eeat: 95,
        aportePropio: true,
      }),
    );
    expect(decision.verdict).not.toBe('PUBLICAR');
    expect(decision.resultingState).not.toBe('READY');
  });

  it('fail-closed: sin aprobadoMeni ni scoreMeni, NO se asume aprobado', () => {
    const decision = makeEditorialDecision(
      ctx({
        titulo: 'Policía Nacional decomisa 120 armas en operativo en Managua este 15 de mayo',
        // aprobadoMeni y scoreMeni ausentes — antes defaulteaba a true
        adnNI: 90,
        exclusividad: 85,
        wow: 80,
        eeat: 95,
        aportePropio: true,
      }),
    );
    expect(decision.verdict).not.toBe('PUBLICAR');
    expect(decision.resultingState).not.toBe('READY');
  });
});

// ── Casos adversariales del informe forense ────────────────────────

describe('Casos adversariales del informe forense', () => {
  it('CASO6: Noticia rutinaria con score alto NO auto-PUBLICAR sin meniCleared', () => {
    // Noticia rutinaria que antes lograba score 92 y PUBLICAR sin valor real
    const decision = makeEditorialDecision(
      ctx({
        titulo: 'Ministerio de Educación anuncia calendario escolar 2026',
        contenido:
          'El Ministerio de Educación anunció el calendario escolar 2026. Las clases inician en febrero. Fuente: Ministerio de Educación.',
        scoreMeni: 92,
        aprobadoMeni: true,
        recomendacionMeni: 'publicar',
        adnNI: 50, // valor periodístico bajo
        exclusividad: 40,
        wow: 30,
        eeat: 80,
        aportePropio: false,
      }),
    );
    // Con meniCleared=true pero valor periodístico bajo (hasHighValue=false),
    // cae a PUBLICAR_CON_CAMBIOS, no PUBLICAR directo.
    expect(decision.verdict).not.toBe('PUBLICAR');
  });

  it('CASO8: Investigación de alto valor con score bajo → REVISION_HUMANA', () => {
    // Investigación valiosa pero MENI le dio 58 por mismatch de categoría
    const decision = makeEditorialDecision(
      ctx({
        titulo: 'Investigación: Contratos millonarios sin licitar en MIFIC 2023-2025',
        contenido:
          'Esta investigación de Infórmate Nicaragua revela contratos por 12 millones de dólares sin licitación en el MIFIC entre 2023 y 2025. Documentos oficiales obtenidos vía acceso a la información muestran 8 adjudicaciones directas.',
        scoreMeni: 58,
        aprobadoMeni: false,
        recomendacionMeni: 'mejorar',
        adnNI: 95,
        exclusividad: 90,
        wow: 85,
        eeat: 90,
        aportePropio: true,
      }),
    );
    // No debe PUBLICAR directo (no meniCleared). Con valor excepcional puede
    // PUBLICAR_CON_CAMBIOS, pero nunca READY/PUBLICAR automático.
    expect(decision.verdict).not.toBe('PUBLICAR');
    expect(decision.resultingState).not.toBe('READY');
  });

  it('CASO10: Alto valor periodístico pero MENI pide MEJORAR → no PUBLICAR directo', () => {
    // Valor periodístico alto, score 88, MENI recomienda mejorar
    const decision = makeEditorialDecision(
      ctx({
        titulo: 'Corte de Cuentas detecta 340 millones no justificados en alcaldía de León',
        contenido:
          'La Corte de Cuentas de la República detectó 340 millones de córdobas no justificados en la alcaldía de León según auditoría especial 2024. El informe identifica 15 observaciones de alto impacto.',
        scoreMeni: 88,
        aprobadoMeni: true,
        recomendacionMeni: 'mejorar',
        adnNI: 92,
        exclusividad: 88,
        wow: 82,
        eeat: 90,
        aportePropio: true,
      }),
    );
    // El bypass anterior permitía PUBLICAR aquí. Ahora debe ser
    // PUBLICAR_CON_CAMBIOS (valor excepcional pero MENI no cleared).
    expect(decision.verdict).not.toBe('PUBLICAR');
    expect(decision.resultingState).not.toBe('READY');
  });

  it('CASO11: Título genérico con score alto → no PUBLICAR', () => {
    // Título genérico que antes recibía score 90
    const decision = makeEditorialDecision(
      ctx({
        titulo: 'Nicaragua toma importante decisión',
        contenido:
          'El gobierno de Nicaragua tomó una importante decisión hoy. Las autoridades anunciaron medidas que afectarán al país. Fuente: Presidencia.',
        scoreMeni: 90,
        aprobadoMeni: true,
        recomendacionMeni: 'publicar',
        adnNI: 30,
        exclusividad: 20,
        wow: 15,
        eeat: 70,
        aportePropio: false,
      }),
    );
    // Título genérico + valor periodístico bajo → no PUBLICAR
    expect(decision.verdict).not.toBe('PUBLICAR');
  });
});

// ── Caso positivo: todo correcto sí PUBLICAR ───────────────────────

describe('Caso positivo — PUBLICAR cuando todo está cleared', () => {
  it('meniCleared + hasHighValue → PUBLICAR / READY', () => {
    const decision = makeEditorialDecision(
      ctx({
        titulo: 'Policía Nacional decomisa 120 armas en operativo en Managua este 15 de mayo',
        contenido:
          'La Policía Nacional decomisó 120 armas de fuego en un operativo realizado este 15 de mayo de 2025 en el barrio Tipitapa, Managua. El comisionado Ramón Avellán confirmó 8 detenciones. Es el tercer operativo del mes.',
        scoreMeni: 95,
        aprobadoMeni: true,
        recomendacionMeni: 'publicar',
        adnNI: 88,
        exclusividad: 82,
        wow: 78,
        eeat: 92,
        aportePropio: true,
      }),
    );
    expect(decision.verdict).toBe('PUBLICAR');
    expect(decision.resultingState).toBe('READY');
  });
});

// ── Invariante de red de seguridad ─────────────────────────────────

describe('Red de seguridad — Invariante final', () => {
  it('si por refactor se llegara a PUBLICAR sin meniCleared, se reporta issue INVARIANTE', () => {
    // Simulamos el escenario: score alto pero aprobadoMeni false.
    // El guard final debe impedir PUBLICAR y emitir issue de dominio INVARIANTE
    // si alguna rama lo intentara. Verificamos que no se llega a PUBLICAR.
    const decision = makeEditorialDecision(
      ctx({
        titulo: 'Policía Nacional decomisa 120 armas en operativo en Managua este 15 de mayo',
        scoreMeni: 95,
        aprobadoMeni: false,
        recomendacionMeni: 'publicar',
        adnNI: 90,
        exclusividad: 85,
        wow: 80,
        eeat: 95,
        aportePropio: true,
      }),
    );
    // El verdict nunca puede ser PUBLICAR sin meniCleared
    expect(decision.verdict).not.toBe('PUBLICAR');
    // El issue de invariante solo aparece si se violó. Como las ramas ya
    // impiden llegar a PUBLICAR, el guard final no se activa. Pero si lo
    // hiciere, el dominio sería 'INVARIANTE'.
    const invarianteIssue = decision.issues.find(i => i.domain === 'INVARIANTE');
    // Si aparece, es evidencia auditable de que el guard actuó.
    if (invarianteIssue) {
      expect(invarianteIssue.severity).toBe('CRITICAL');
    }
  });
});
