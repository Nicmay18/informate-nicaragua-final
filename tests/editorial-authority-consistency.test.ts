/**
 * Integración editorial — autoridad única (MENI → Supervisor).
 *
 * Regresión de los casos exigidos para el cierre MENI 4.0:
 *  - CASO F: "MINED anuncia 318,818 promociones para el cierre de 2026"
 *    no debe fallar la heurística de título por no reconocer MINED ni el año.
 *  - CASO G: detectTier y TIER_THRESHOLDS deben ser coherentes
 *    (antes, 350-399 palabras se clasificaban REPORTAJE cuyo mínimo es 400 —
 *    la nota incumplía el mínimo de su propio tier).
 *  - Regresión: títulos genéricos de sucesos siguen requiriendo investigación.
 */
import { describe, it, expect } from 'vitest';
import { evaluateRawTitle, makeEditorialDecision } from '@/lib/supervisor/editorial-supervisor';
import { detectTier, TIER_THRESHOLDS } from '@/lib/meni/editorial-tiers';

const buildContent = (palabras: number) =>
  '<p>' + 'palabra '.repeat(palabras).trim() + '</p>';

// ═══════════════════════════════════════════════════════════════
// CASO F — Título institucional MINED con año calendario
// ═══════════════════════════════════════════════════════════════

describe('Supervisor — evaluateRawTitle: autoridad institucional y año (CASO F)', () => {
  const TITULO_MINED = 'MINED anuncia 318,818 promociones para el cierre de 2026';

  it('reconoce MINED como autoridad: no falta "autoridad que confirmó"', () => {
    const ev = evaluateRawTitle(TITULO_MINED);
    expect(ev.missingData.join(' ')).not.toContain('autoridad que confirmó el hecho');
  });

  it('reconoce el año 2026 como contexto temporal: no falta "cuándo ocurrió"', () => {
    const ev = evaluateRawTitle(TITULO_MINED);
    expect(ev.missingData.join(' ')).not.toContain('cuándo ocurrió');
  });

  it('anuncio institucional nacional: no exige "lugar donde ocurrió"', () => {
    const ev = evaluateRawTitle(TITULO_MINED);
    expect(ev.missingData.join(' ')).not.toContain('lugar donde ocurrió');
  });

  it('el título completo NO requiere investigación adicional', () => {
    const ev = evaluateRawTitle(TITULO_MINED);
    expect(ev.needsInvestigation).toBe(false);
    expect(ev.verdict).not.toBe('INVESTIGAR_MAS');
  });

  it('otras siglas institucionales nicaragüenses también cuentan como autoridad', () => {
    for (const sigla of ['MINSA', 'INSS', 'INETER', 'INTUR', 'CSE']) {
      const ev = evaluateRawTitle(`${sigla} informa medidas para el año 2026 en Nicaragua`);
      expect(ev.missingData.join(' ')).not.toContain('autoridad que confirmó el hecho');
    }
  });

  // Regresión: la heurística sigue detectando títulos débiles reales
  it('título sin autoridad ni tiempo sigue generando ambos faltantes', () => {
    const ev = evaluateRawTitle('Capturan a peligroso delincuente');
    expect(ev.missingData.join(' ')).toContain('autoridad que confirmó el hecho');
    expect(ev.missingData.join(' ')).toContain('cuándo ocurrió');
  });

  it('título genérico de suceso sigue requiriendo INVESTIGAR_MAS', () => {
    const ev = evaluateRawTitle('Hallan cuerpo muerto');
    expect(ev.isGeneric).toBe(true);
    expect(ev.needsInvestigation).toBe(true);
    expect(ev.verdict).toBe('INVESTIGAR_MAS');
  });
});

// ═══════════════════════════════════════════════════════════════
// CASO G — Coherencia de tiers: ningún tier incumple su propio mínimo
// ═══════════════════════════════════════════════════════════════

describe('detectTier — coherencia entre clasificación y minPalabras (CASO G)', () => {
  it('una nota de menos de 120 palabras se clasifica FLASH', () => {
    expect(detectTier({ titulo: 'Flash de última hora', contenido: buildContent(90) })).toBe('FLASH');
  });

  it('una nota de 350-399 palabras se clasifica NOTICIA, no REPORTAJE', () => {
    // Regresión: antes caía en REPORTAJE (min 400) y se auto-incumplía.
    expect(detectTier({ titulo: 'Nota estándar', contenido: buildContent(370) })).toBe('NOTICIA');
  });

  it('una nota de 400+ palabras se clasifica REPORTAJE', () => {
    expect(detectTier({ titulo: 'Nota desarrollada', contenido: buildContent(450) })).toBe('REPORTAJE');
  });

  it('contenido extenso con marcadores de investigación se clasifica INVESTIGACION', () => {
    const contenido = buildContent(650) + ' investigación exclusiva con antecedentes';
    expect(detectTier({ titulo: 'Especial', contenido })).toBe('INVESTIGACION');
  });

  it('el tier detectado nunca exige más palabras de las que definen su rango', () => {
    // Invariante de coherencia: si detectTier asigna un tier, el mínimo del
    // tier no debe superar el tope superior de su rango de clasificación.
    const casos: Array<[number, string, number]> = [
      [90, 'FLASH', 120],       // FLASH: 0-119
      [200, 'NOTICIA', 399],    // NOTICIA: 120-399
      [370, 'NOTICIA', 399],
      [450, 'REPORTAJE', Infinity],
    ];
    for (const [palabras, tierEsperado, tope] of casos) {
      const tier = detectTier({ titulo: 'Nota', contenido: buildContent(palabras) });
      expect(tier).toBe(tierEsperado);
      expect(TIER_THRESHOLDS[tier].minPalabras).toBeLessThanOrEqual(tope === Infinity ? Number.MAX_SAFE_INTEGER : tope);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// CASOS A / C / D — Supervisor como decisión final
// ═══════════════════════════════════════════════════════════════

describe('Supervisor — decisión final única sobre el snapshot (CASOS A/C/D)', () => {
  it('CASO A: nota institucional completa no queda bloqueada por título', () => {
    const decision = makeEditorialDecision({
      titulo: 'MINED anuncia 318,818 promociones para el cierre de 2026',
      contenido: '<p>' + 'El Ministerio de Educación confirmó la cifra oficial para el cierre del año lectivo. '.repeat(20) + '</p>',
      resumen: 'El MINED informó las promociones del ciclo 2026.',
      categoria: 'Nacionales',
      aprobadoMeni: true,
      scoreMeni: 85,
    });
    // No puede haber bloqueo por título cuando el título tiene autoridad+tiempo
    const tituloIssues = decision.issues.filter(i => i.domain === 'TITULO' && i.severity === 'CRITICAL');
    expect(tituloIssues.length).toBe(0);
  });

  it('CASO D: nota sin aprobación MENI explícita nunca es PUBLICAR (fail-closed)', () => {
    const decision = makeEditorialDecision({
      titulo: 'Gobierno confirma nuevo plan de salud nacional para 2026',
      contenido: '<p>' + 'La Presidencia confirmó este martes el plan sanitario nacional. '.repeat(20) + '</p>',
      resumen: 'Plan de salud nacional.',
      categoria: 'Nacionales',
      // sin aprobadoMeni ni scoreMeni: principio fail-closed
    });
    expect(['PUBLICAR', 'PUBLICAR_CON_CAMBIOS']).not.toContain(decision.verdict);
  });

  it('CASO C: título genérico sin contenido genera issue IMPORTANT de TITULO', () => {
    const decision = makeEditorialDecision({
      titulo: 'Hallan cuerpo muerto',
      contenido: '',
      resumen: '',
    });
    expect(decision.verdict).not.toBe('PUBLICAR');
    expect(decision.issues.some(i => i.domain === 'TITULO')).toBe(true);
  });
});
