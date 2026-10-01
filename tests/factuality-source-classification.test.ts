/**
 * Regresión — clasificación de fuentes en la barrera factual.
 *
 * Auditoría: `[IMPORTANT][FACTUALIDAD] afirmaciones atribuidas solo a
 * fuentes vagas` disparaba sobre la nota real de Siuna por tres defectos:
 *  1. CONCRETE_INSTITUTION_RE / RE_FUENTE eran listas más pobres que
 *     FUENTES_OFICIALES del extractor → SINAPRED/MINED/Cruz Roja/Ejército
 *     se trataban como vagas.
 *  2. CONCRETE_NAMED_RE era case-sensitive en el marcador: "Según Juan
 *     Pérez" al inicio de oración no casaba → persona identificada = vaga.
 *  3. No existía la clase FIELD_REPORT: reporting de campo con ubicación
 *     concreta se colapsaba en VAGUE junto a "según medios locales".
 *
 * La barrera NO se relajó: FIELD_REPORT y VAGUE_ATTRIBUTION siguen siendo
 * IMPORTANT → Supervisor decide (INVESTIGAR_MAS). Lo que cambia es la
 * CLASIFICACIÓN, no el umbral.
 */
import { describe, it, expect } from 'vitest';
import { detectFactualitySignals } from '@/lib/editorial/factuality-signals';
import { analyzeTrust } from '@/lib/editorial/trust';

const FIGURAS = '4 personas murieron y 2 viviendas quedaron sepultadas.';
const LUGAR = 'en la comunidad El Inocente N.º 2, municipio de Siuna, Caribe Norte';

function evalua(frase: string, lugar = '') {
  // >300 chars para que NO_ATTRIBUTION pueda evaluarse (ese es su umbral).
  return detectFactualitySignals({
    titulo: 'Deslizamiento de tierra deja 4 muertos en Siuna',
    resumen: frase,
    contenido: `<p>${frase} ${FIGURAS} El hecho ocurrió ${lugar || 'durante la noche'}. Equipos de rescate trabajaron en la zona ${lugar}. Los trabajos de remoción de escombros continuaron durante gran parte de la jornada mientras las familias esperaban información oficial sobre las víctimas.</p>`,
    fuentesComplementarias: [],
  });
}

const codes = (s: ReturnType<typeof detectFactualitySignals>) => s.map(x => x.code);

// ═══════════════════════════════════════════════════════════════
// Instituciones — catálogo canónico compartido
// ═══════════════════════════════════════════════════════════════

describe('fuentes institucionales reconocidas (taxonomía unificada)', () => {
  it.each([
    'Según SINAPRED',
    'Según MINED',
    'Según Cruz Roja',
    'Según el Ejército de Nicaragua',
    'Según la Policía Nacional',
    'Según el MINSA',
    'Según el INSS',
    'Según INETER',
    'Según INTUR',
    'Según Medicina Legal',
    'Según MARENA',
    'Según ENACAL',
    'Según ENATREL',
    'Según la Presidencia',
    'Según la Asamblea Nacional',
    // Nombres legales completos — la nota real de Siuna citaba a INETER
    // por su nombre, no por la sigla, y se marcaba FIELD_REPORT.
    'Según el Instituto Nicaragüense de Estudios Territoriales',
    'Según el Instituto Nicaragüense de Seguridad Social',
    'Según el Sistema Nacional para la Prevención, Mitigación y Atención de Desastres',
    'Según la Empresa Nicaragüense de Acueductos y Alcantarillados',
    'Según la Organización Panamericana de la Salud',
  ])('%s → NO produce VAGUE_ATTRIBUTION ni FIELD_REPORT', (frase) => {
    const signals = evalua(frase);
    expect(codes(signals)).not.toContain('VAGUE_ATTRIBUTION');
    expect(codes(signals)).not.toContain('FIELD_REPORT');
  });
});

// ═══════════════════════════════════════════════════════════════
// Personas identificadas — fix case-sensitivity del marcador
// ═══════════════════════════════════════════════════════════════

describe('persona identificada por nombre', () => {
  it.each([
    'Según Juan Pérez, habitante de la comunidad',
    'según Juan Pérez, habitante de la comunidad',
    'SEGÚN Juan Pérez, habitante de la comunidad',
    'De acuerdo con Juan Pérez, habitante de la comunidad',
  ])('%s → fuente identificable (no VAGUE)', (frase) => {
    const signals = evalua(`${frase},`);
    expect(codes(signals)).not.toContain('VAGUE_ATTRIBUTION');
  });

  it('pero "según el viceministro" (sin nombre) sigue siendo vago', () => {
    const signals = evalua('Según el viceministro,');
    expect(codes(signals)).toContain('VAGUE_ATTRIBUTION');
  });
});

// ═══════════════════════════════════════════════════════════════
// Fuentes vagas — la barrera NO se relajó
// ═══════════════════════════════════════════════════════════════

describe('atribución vaga sigue detectándose', () => {
  it.each([
    'Según medios locales,',
    'Según versiones preliminares,',
    'De acuerdo con informaciones,',
  ])('%s → VAGUE_ATTRIBUTION', (frase) => {
    const signals = evalua(frase);
    expect(codes(signals)).toContain('VAGUE_ATTRIBUTION');
  });

  it('"según testigos" sin contexto territorial NO promociona a FIELD_REPORT', () => {
    // Nota: el cuerpo de evalua() incluye el lugar; el marcador de campo
    // exige el patrón "testigos de la comunidad/zona…", no el sustantivo solo.
    const signals = evalua('Según testigos,');
    expect(codes(signals)).not.toContain('FIELD_REPORT');
  });
});

// ═══════════════════════════════════════════════════════════════
// FIELD_REPORT — reporting de campo con ubicación concreta
// ═══════════════════════════════════════════════════════════════

describe('FIELD_REPORT — clasificación explícita', () => {
  it('reportes desde la comunidad + lugar → FIELD_REPORT', () => {
    const signals = evalua('De acuerdo con reportes recibidos desde la comunidad,', `, ${LUGAR}`);
    expect(codes(signals)).toContain('FIELD_REPORT');
    expect(codes(signals)).not.toContain('VAGUE_ATTRIBUTION');
  });

  it('habitantes de la comunidad + lugar → FIELD_REPORT', () => {
    const signals = evalua('Según habitantes de la comunidad,', `, ${LUGAR}`);
    expect(codes(signals)).toContain('FIELD_REPORT');
  });

  it('información obtenida en el lugar + lugar concreto → FIELD_REPORT', () => {
    const signals = evalua('Según información obtenida en el lugar,', `, ${LUGAR}`);
    expect(codes(signals)).toContain('FIELD_REPORT');
  });

  it('FIELD_REPORT sigue siendo IMPORTANT (la barrera no se relaja)', () => {
    const signals = evalua('De acuerdo con reportes recibidos desde la comunidad,', `, ${LUGAR}`);
    const fr = signals.find(s => s.code === 'FIELD_REPORT');
    expect(fr?.severity).toBe('IMPORTANT');
  });
});

// ═══════════════════════════════════════════════════════════════
// Sin respaldo / cobertura propia no verificable
// ═══════════════════════════════════════════════════════════════

describe('afirmaciones sin respaldo siguen detectándose', () => {
  it('"la información disponible indica" → sigue requiriendo respaldo', () => {
    const signals = evalua('La información disponible indica que');
    expect(codes(signals)).toContain('NO_ATTRIBUTION');
  });

  it('"Nicaragua Informate conoció" sin evidencia verificable → NO_ATTRIBUTION', () => {
    // Comportamiento explícito y documentado: la cobertura propia no es
    // verificable estructuralmente por el detector → no inventa evidencia.
    const signals = evalua('Nicaragua Informate conoció que');
    expect(codes(signals)).toContain('NO_ATTRIBUTION');
  });
});

// ═══════════════════════════════════════════════════════════════
// Caso real Siuna — patrón completo de la noticia
// ═══════════════════════════════════════════════════════════════

describe('caso real: nota de deslizamiento en Siuna', () => {
  const contenido =
    '<p>Un deslizamiento de tierra ocurrido en la comunidad El Inocente N.º 2, ' +
    'municipio de Siuna, Caribe Norte, dejó 4 personas muertas durante la noche ' +
    'del martes. De acuerdo con los reportes recibidos desde la comunidad, el ' +
    'alud sepultó 2 viviendas mientras los residentes dormían. Según habitantes ' +
    'de la comunidad, equipos de rescate llegaron al lugar durante la madrugada. ' +
    'Los primeros reportes desde el lugar indican que la zona quedó incomunicada. ' +
    'Información recibida desde la comunidad señala que las labores continúan.</p>';

  it('se clasifica FIELD_REPORT, no VAGUE_ATTRIBUTION', () => {
    const signals = detectFactualitySignals({
      titulo: 'Deslizamiento deja 4 muertos en Siuna',
      resumen: '',
      contenido,
      fuentesComplementarias: [],
    });
    expect(codes(signals)).toContain('FIELD_REPORT');
    expect(codes(signals)).not.toContain('VAGUE_ATTRIBUTION');
  });

  it('el diagnóstico FIELD_REPORT nombra la modalidad real, no "fuentes vagas"', () => {
    const signals = detectFactualitySignals({ titulo: 'x', resumen: '', contenido });
    const fr = signals.find(s => s.code === 'FIELD_REPORT');
    expect(fr?.desc).toContain('reporting de campo');
    expect(fr?.desc).not.toContain('fuentes vagas');
  });
});

// ═══════════════════════════════════════════════════════════════
// Trust consume el mismo catálogo — SOURCE_MISSING coherente
// ═══════════════════════════════════════════════════════════════

describe('trust comparte la taxonomía', () => {
  it('"según SINAPRED" no produce SOURCE_MISSING', () => {
    const trust = analyzeTrust({
      titulo: 'Deslizamiento deja 4 muertos en Siuna',
      cuerpo: `<p>Según SINAPRED, ${FIGURAS} El hecho ocurrió ${LUGAR} durante la noche.</p>`,
      categoria: 'Sucesos',
    });
    expect(trust.factores).not.toContain('SOURCE_MISSING');
  });

  it('reportes de comunidad sin institución sí producen SOURCE_MISSING (semántica propia de trust)', () => {
    const trust = analyzeTrust({
      titulo: 'Deslizamiento deja 4 muertos en Siuna',
      cuerpo: `<p>De acuerdo con reportes recibidos desde la comunidad, ${FIGURAS} El hecho ocurrió ${LUGAR}.</p>`,
      categoria: 'Sucesos',
    });
    expect(trust.factores).toContain('SOURCE_MISSING');
    // La deduplicación del root cause ocurre en guardar-con-meni, no aquí.
  });
});
