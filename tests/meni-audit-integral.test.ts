// @vitest-environment node
/**
 * AUDITORÍA INTEGRAL MENI 4.0 — regresiones del motor editorial.
 * ==============================================================
 * Cubre los defectos sistémicos reparados en la auditoría forense:
 *
 *   1. HTML→texto canónico (lib/utils/html-text.ts): entidades decodificadas,
 *      scripts/styles/comentarios excluidos, bloques preservados, detección
 *      H2/STRONG por tags pareados (no substring).
 *   2. Conteo canónico de palabras: detectTier, core y word-count comparten
 *      la misma fuente — antes <script> o "&nbsp;" inflaban el conteo.
 *   3. Proporcionalidad por tier: umbrales FLASH/NOTICIA/REPORTAJE/
 *      INVESTIGACION tienen precedencia sobre perfiles rígidos.
 *   4. DNA: precedencia tier > perfil en exclusividad/wow.
 *   5. Diagnóstico ≡ motor: expectedValue muestra el umbral real aplicado.
 *   6. Sensacionalismo: frases alarmistas bloquean; términos factuales
 *      ('masacre', 'devorado', 'desgarró') son observación, no veto.
 */
import { describe, it, expect } from 'vitest';
import {
  htmlToPlainText,
  htmlToVisibleText,
  countVisibleWords,
  countHeadings,
  countStrongEmphasis,
  countBlockquotes,
  countParagraphs,
  extractHeadings,
  decodeHtmlEntities,
} from '../lib/utils/html-text';
import { countWords } from '../lib/utils/word-count';
import { detectTier, TIER_THRESHOLDS } from '../lib/meni/editorial-tiers';
import { scoreToGrade } from '../lib/meni/scoring';
import { computeEditorialDNA } from '../lib/meni/editorial-dna/engine';
import { buildMeniDiagnostics } from '../lib/meni/diagnostics';
import { detectSensationalism, stripHtml } from '../lib/meni/quality-gate/validator';
import { runMeni } from '../lib/meni/core';
import type { NoticiaInput } from '../lib/editorial/core/types';

// ─────────────────────────────────────────────────────────────
// 1. UTILIDAD CANÓNICA HTML → TEXTO
// ─────────────────────────────────────────────────────────────
describe('A — html-text canónico', () => {
  it('decodifica entidades con nombre y numéricas', () => {
    expect(decodeHtmlEntities('a&ntilde;o')).toBe('año');
    expect(decodeHtmlEntities('camión &#243;')).toBe('camión ó');
    expect(decodeHtmlEntities('x&eacute;y')).toBe('xéy');
    expect(decodeHtmlEntities('a&nbsp;b')).toBe('a b');
    expect(decodeHtmlEntities('&#xF3;')).toBe('ó');
  });

  it('entidades desconocidas se conservan literales', () => {
    expect(decodeHtmlEntities('&entityinexistente;')).toBe('&entityinexistente;');
  });

  it('excluye scripts, styles, comentarios y noscript del texto visible', () => {
    const html = '<p>Visible</p><script>var x = "palabra_script";</script><style>.a{content:"estilo"}</style><!-- comentario oculto --><noscript>nojs</noscript>';
    const texto = htmlToPlainText(html);
    expect(texto).toBe('Visible');
    expect(texto).not.toContain('palabra_script');
    expect(texto).not.toContain('estilo');
    expect(texto).not.toContain('comentario');
    expect(texto).not.toContain('nojs');
  });

  it('preserva límites de bloque como líneas separadas', () => {
    const visible = htmlToVisibleText('<p>Primero</p><p>Segundo</p><h2>Subtítulo</h2><p>Tercero<br>cuarto</p>');
    expect(visible).toContain('Primero');
    expect(visible).toContain('Segundo');
    expect(visible).toContain('Subtítulo');
    // Cada bloque en su propia línea — los párrafos no se fusionan.
    const lineas = visible.split('\n').filter(Boolean);
    expect(lineas.length).toBeGreaterThanOrEqual(4);
  });

  it('una entidad dentro de una palabra NO la parte al contar', () => {
    // "desgarr&#243;" antes contaba como 1 palabra partida en dos tokens
    // visuales; ahora decodifica a "desgarró" = 1 palabra.
    expect(countVisibleWords('<p>El cuerpo qued&oacute; destrozado</p>')).toBe(4);
  });

  it('H2/STRONG/blockquote se detectan por tags pareados con contenido', () => {
    const html = '<p>Texto</p><h2>Contexto</h2><h2></h2><strong>12:30</strong><b>MP</b><blockquote><p>"Dijo el vocero"</p></blockquote>';
    expect(countHeadings(html, 2)).toBe(1); // el <h2></h2> vacío no cuenta
    expect(extractHeadings(html, 2)).toEqual(['Contexto']);
    expect(countStrongEmphasis(html)).toBe(2);
    expect(countBlockquotes(html)).toBe(1);
    expect(countParagraphs(html)).toBe(2);
  });

  it('no hay falsos positivos por subcadenas en scripts', () => {
    const html = '<script>var s = "<h2>fake</h2><strong>x</strong>";</script><p>Real</p>';
    expect(countHeadings(html, 2)).toBe(0);
    expect(countStrongEmphasis(html)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// 2. CONTEO CANÓNICO DE PALABRAS
// ─────────────────────────────────────────────────────────────
describe('B — conteo canónico', () => {
  it('countWords y countVisibleWords coinciden sobre HTML editorial', () => {
    const html = '<p>Uno dos tres</p><p>cuatro &amp; cinco</p><script>seis siete ocho</script>';
    const canon = countVisibleWords(html);
    expect(countWords(html)).toBe(canon);
    // 'seis siete ocho' del script NO cuenta.
    expect(canon).toBeLessThanOrEqual(6);
  });

  it('detectTier usa el conteo canónico: un script gigante no infla el tier', () => {
    const relleno = 'palabra '.repeat(700);
    const corto = `<p>${'noticia breve '.repeat(15)}</p><script>${relleno}</script>`;
    // 90 palabras visibles + 700 en script → debe ser FLASH, no REPORTAJE.
    expect(detectTier({ titulo: 'T', contenido: corto })).toBe('FLASH');
  });
});

// ─────────────────────────────────────────────────────────────
// 3. PROPORCIONALIDAD POR TIER
// ─────────────────────────────────────────────────────────────
describe('C — tiers proporcionales', () => {
  it('los umbrales crecen con el formato: FLASH < NOTICIA < REPORTAJE < INVESTIGACION', () => {
    expect(TIER_THRESHOLDS.FLASH.minAdnNI).toBeLessThan(TIER_THRESHOLDS.NOTICIA.minAdnNI);
    expect(TIER_THRESHOLDS.NOTICIA.minAdnNI).toBeLessThan(TIER_THRESHOLDS.REPORTAJE.minAdnNI);
    expect(TIER_THRESHOLDS.REPORTAJE.minAdnNI).toBeLessThan(TIER_THRESHOLDS.INVESTIGACION.minAdnNI);
    expect(TIER_THRESHOLDS.FLASH.exigeServiceValue).toBe(false);
    expect(TIER_THRESHOLDS.INVESTIGACION.exigeFuentes).toBe(true);
  });

  it('scoreToGrade: score bajo 80 pero sobre piso del tier → MEJORAR, no NO PUBLICAR', () => {
    expect(scoreToGrade(55, 'FLASH')).toBe('MEJORAR'); // piso FLASH = 50
    expect(scoreToGrade(55, 'INVESTIGACION')).toBe('NO PUBLICAR'); // piso = 80
    expect(scoreToGrade(85)).toBe('MEJORAR'); // sin tier: banda histórica 80-89
    expect(scoreToGrade(95, 'FLASH')).toBe('PUBLICABLE ORO');
  });
});

// ─────────────────────────────────────────────────────────────
// 4. DNA — PRECEDENCIA TIER > PERFIL
// ─────────────────────────────────────────────────────────────
const REPLICA_DECISION = (diff: number) => ({
  editorialDifference: { score: diff, reasons: [] },
  nicaraguaInformate: { score: 80, reasons: [] },
  publicValue: { score: 80, reasons: [] },
  explanation: { score: 80, reasons: [] },
  storyCompleteness: { score: 80, reasons: [] },
  readerQuestions: { score: 80, reasons: [] },
  competition: { score: 80, reasons: [] },
  newsValue: { score: 80, utilidad: 8, reasons: [] },
  bloquear: false,
  score: 80,
  publicar: true,
  editorialDna: { selloNI: { originalidad: diff, servicio: 80, explica: 80, contextualiza: 80 } },
} as any);

describe('D — DNA umbrales', () => {
  it('minExclusividad del tier gana sobre umbralesBloqueo del perfil', () => {
    // Perfil exige 70; tier FLASH exige 30. Exclusividad=45 → con tier no bloquea.
    const dnaTier = computeEditorialDNA({
      decision: REPLICA_DECISION(45) as any,
      minExclusividad: 30,
      minWow: 30,
      umbralesBloqueo: { exclusividad: 70, wow: 70, transcripcion: 70, memoria: 20 },
    });
    // Sin tier (solo perfil) el mismo score sí bloquea la dimensión.
    const dnaPerfil = computeEditorialDNA({
      decision: REPLICA_DECISION(45) as any,
      umbralesBloqueo: { exclusividad: 70, wow: 70, transcripcion: 70, memoria: 20 },
    });
    expect(dnaTier.exclusividad.bloquear).toBe(false);
    expect(dnaPerfil.exclusividad.bloquear).toBe(true);
    // La dimensión baja NO veta la publicación — va a recomendaciones.
    expect(dnaTier.bloquear).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// 5. DIAGNÓSTICO ≡ MOTOR
// ─────────────────────────────────────────────────────────────
describe('E — diagnóstico muestra el umbral real', () => {
  const dnaBajo = {
    exclusividad: { score: 40, bloquear: true, razon: 'Valor diferencial insuficiente.' },
    wow: { score: 45, bloquear: true, razon: 'WOW bajo.' },
    selloNI: { explica: 70, contextualiza: 70, servicio: 70, originalidad: 70, competencia: 70, utilidad: 70, valor: 70 },
    transcripcion: { score: 100, bloquear: false, razon: null },
    memoria: { score: 60, bloquear: false, razon: null, totalArticulosRelacionados: 0 },
    adnNI: 55,
    bloquear: false,
    motivoBloqueo: null,
    recomendacionesEditoriales: [],
  } as any;

  it('expectedValue usa el umbral del tier, no el global 90', () => {
    const { blockingIssues } = buildMeniDiagnostics({
      scoreFinal: 85,
      aprobado: false,
      editorialDna: dnaBajo,
      scoreFloor: 50,
      umbralesDna: { exclusividad: 30, wow: 30 },
    });
    const excl = blockingIssues.find((i) => i.code === 'EDITORIAL_DNA_EXCLUSIVIDAD');
    expect(excl?.expectedValue).toBe('≥ 30%');
    const wow = blockingIssues.find((i) => i.code === 'EDITORIAL_DNA_WOW');
    expect(wow?.expectedValue).toBe('≥ 30%');
  });

  it('score sobre el piso del tier no genera bloqueo por score', () => {
    const { blockingIssues, warnings } = buildMeniDiagnostics({
      scoreFinal: 55,
      aprobado: false,
      editorialDna: undefined,
      scoreFloor: 50,
    });
    expect(blockingIssues.find((i) => i.code === 'MENI_SCORE_FLOOR')).toBeUndefined();
    // Queda como INFO/métrica, no como decisión.
    const scoreIssue = warnings.find((i) => i.code === 'MENI_SCORE_THRESHOLD');
    expect(scoreIssue?.severity).not.toBe('BLOCKER');
  });

  it('score bajo el piso del tier sí genera WARNING de piso', () => {
    const { warnings } = buildMeniDiagnostics({
      scoreFinal: 45,
      aprobado: false,
      editorialDna: undefined,
      scoreFloor: 50,
    });
    expect(warnings.some((i) => i.code === 'MENI_SCORE_FLOOR')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. SENSACIONALISMO — bloquea lo alarmista, observa lo factual
// ─────────────────────────────────────────────────────────────
describe('F — sensacionalismo proporcional', () => {
  const base = 'La Policía Nacional confirmó este martes los detalles del operativo en la capital.';

  it('frases claramente alarmistas → blocking', () => {
    const issues = detectSensationalism(stripHtml(`${base} La escena quedó baño de sangre.`), 'Sucesos');
    const blocking = issues.filter((i) => i.severidad === 'blocking');
    expect(blocking.length).toBeGreaterThan(0);
    expect(blocking[0].mensaje).toContain('sensacionalista');
  });

  it('términos factuales ("masacre") → warning, nunca blocking', () => {
    const issues = detectSensationalism(`${base} Las autoridades investigan las causas de la masacre ocurrida en la comunidad.`, 'Sucesos');
    expect(issues.filter((i) => i.severidad === 'blocking')).toHaveLength(0);
    const warn = issues.find((i) => i.categoria === 'sensacionalismo' && i.severidad === 'warning');
    expect(warn?.evidencia).toContain('masacre');
  });

  it('"desgarró" con tilde se detecta vía texto decodificado', () => {
    // En el pipeline real stripHtml decodifica entidades ANTES del detector.
    const issues = detectSensationalism(stripHtml(`${base} El animal desgarr&oacute; a la v&iacute;ctima.`), 'Sucesos');
    const warn = issues.find((i) => i.categoria === 'sensacionalismo' && i.severidad === 'warning');
    expect(warn?.evidencia).toContain('desgarró');
    expect(issues.filter((i) => i.severidad === 'blocking')).toHaveLength(0);
  });

  it('stripHtml del validador usa la utilidad canónica', () => {
    expect(stripHtml('<p>Hola&nbsp;mundo</p>')).toBe('Hola mundo');
    expect(stripHtml('<script>x</script><p>Real</p>')).toBe('Real');
  });
});

// ─────────────────────────────────────────────────────────────
// 7. PIPELINE — FLASH no cae por pisos rígidos
// ─────────────────────────────────────────────────────────────
describe('G — runMeni proporcional al tier', () => {
  const make = (titulo: string, body: string, categoria = 'Sucesos'): NoticiaInput => ({
    titulo, contenido: body, resumen: 'Resumen de la nota.',
    categoria, autor: 'Editorial',
    fecha: '2026-11-17T10:00:00Z', slug: 'test-audit', palabrasClave: ['Nicaragua'],
    imagenDestacada: 'https://x.com/i.jpg',
  }) as NoticiaInput;

  it('un flash completo (~100 palabras) se clasifica FLASH y no exige piso de reportaje', () => {
    const flash = '<p>La Policía Nacional informó este martes que un operativo en el mercado Oriental dejó como resultado la detención de tres personas investigadas por hurto agravado. Según la institución, los detenidos serán presentados ante la autoridad competente en las próximas horas. Los agentes incautaron evidencia relacionada con los hechos durante el procedimiento.</p>';
    const r = runMeni(make('Operativo policial deja tres detenidos en Managua', flash));
    expect(r.editorialTier).toBe('FLASH');
    // El piso de revisión es el del tier (50), no un 75/80 rígido.
    const pisoEsperado = TIER_THRESHOLDS.FLASH.minAdnNI;
    // El diagnóstico no debe mostrar umbrales de investigación.
    const issues = r.blockingIssues ?? [];
    const dnaExcl = issues.find((i) => i.code === 'EDITORIAL_DNA_EXCLUSIVIDAD');
    if (dnaExcl) {
      expect(dnaExcl.expectedValue).toBe(`≥ ${TIER_THRESHOLDS.FLASH.minExclusividad}%`);
      expect(pisoEsperado).toBeLessThan(TIER_THRESHOLDS.INVESTIGACION.minAdnNI);
    }
  });

  it('contenido con <script> gigante sigue siendo FLASH (conteo canónico)', () => {
    const flash = `<p>La Policía informó la detención de dos personas en un operativo este martes en la capital.</p><script>${'var a=1;'.repeat(500)}</script>`;
    const r = runMeni(make('Detienen a dos personas en operativo', flash));
    expect(r.editorialTier).toBe('FLASH');
  });

  it('recomendaciones del veredicto nunca bloquean solas', () => {
    const flash = '<p>La Policía Nacional informó la detención de una persona investigada por hurto en un operativo realizado este martes en la capital nicaragüense.</p>';
    const r = runMeni(make('Detienen a sospechoso en capital', flash));
    // No debe existir bloqueante por carencias de formato (H2, precio, horario).
    const codigos = (r.blockingIssues ?? []).map((i) => i.code);
    expect(codigos).not.toContain('QUALITY_GATE_H2');
    expect(codigos).not.toContain('EDITORIAL_DNA_TRANSCRIPCION');
  });
});

// ─────────────────────────────────────────────────────────────
// 8. ENTIDADES — palabras con tilde no se cortan
// ─────────────────────────────────────────────────────────────
describe('H — entidades en texto editorial', () => {
  it('"est&aacute;" cuenta como una palabra, no dos', () => {
    expect(countVisibleWords('<p>El operativo est&aacute; en curso</p>')).toBe(5);
  });

  it('htmlToPlainText aplana bloques pero conserva el texto', () => {
    const plano = htmlToPlainText('<h2>T&iacute;tulo</h2><p>Primera l&iacute;nea</p>');
    expect(plano).toContain('Título');
    expect(plano).toContain('línea');
  });
});
