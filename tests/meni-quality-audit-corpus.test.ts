// @vitest-environment node
/**
 * AUDITORÍA DE CALIDAD MENI — corpus real de producción.
 * =====================================================
 * Corre evaluate() sobre las 30 noticias reales del dataset canónico y
 * mide las métricas sistémicas que el periodista exige:
 *
 *   1. DUPLICATE_RECOMMENDATION_RATE  — recomendaciones repetidas por nota.
 *   2. ALREADY_SATISFIED_RATE         — recs que repiten título/cita vigente.
 *   3. PROFILE_INCOHERENCE_RATE       — recs nombrando un perfil distinto
 *      al realmente evaluado.
 *   4. MODULE_CONTRADICTION_RATE      — utility detectó evidencia que
 *      VALOR_EDITORIAL niega (mismo concepto, mismo texto).
 *   5. FN_CHECK                       — casos reales documentados
 *      (contexto regional Costa Rica, estado actual Olivas).
 *
 * FP/FN absolutos no son medibles sin ground-truth humano por nota — se
 * reporta lo que el sistema puede probar de forma determinista.
 */
import { describe, it, expect } from 'vitest';
import { evaluate } from '../lib/editorial/core/pipeline';
import { isAlreadySatisfied, normalizeForComparison, dedupeRecommendations } from '../lib/editorial/normalize';
import { evaluateRawTitle, makeEditorialDecision } from '../lib/supervisor/editorial-supervisor';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const corpus: any[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures/canonical-noticias.json'), 'utf8')
);

const SHARED_KEYS = ['estado actual', 'dónde', 'cuándo', 'impacto', 'seguimiento', 'cifras', 'qué cambia'];

describe('Corpus real — métricas sistémicas MENI', () => {
  const rows = corpus.map(c => {
    const r = evaluate(c.input);
    const recs = r.sugerencias;
    const norm = recs.map(normalizeForComparison);
    const dupCount = norm.length - new Set(norm.filter(Boolean)).size;
    const satisfied = recs.filter(s =>
      isAlreadySatisfied(s, { titulo: c.input.titulo || '', textoPlano: r.evidence.textoPlano })
    );
    const INTERNAL_INTEL: Record<string, string> = { salud: 'Salud', politica: 'Politica', economia: 'Economia' };
    const editorChose = !!(c.input.categoria && ['Sucesos','Nacionales','Internacionales','Tecnología','Deportes','Espectáculos'].includes(c.input.categoria));
    const evalName = editorChose ? r.evidence.category : (INTERNAL_INTEL[(r.evidence as any).perfil] || r.evidence.category);
    const incoherent = recs.filter(s => {
      const m = s.match(/perfil de (\S+)/i);
      return m && m[1] !== evalName;
    });
    const contradictions = SHARED_KEYS.filter(k =>
      r.evidence.utility.preguntasRespondidas.includes(k) &&
      r.valorEditorial.warnings.some(w => w.includes(`evidencia requerida: ${k}`))
    );
    return { slug: c.slug, categoria: r.evidence.category, recs: recs.length, dupCount, satisfied, incoherent, contradictions, warnings: r.valorEditorial.warnings.length };
  });

  it('reporte de métricas (informativo)', () => {
    const tot = rows.length;
    const conDupes = rows.filter(r => r.dupCount > 0).length;
    const conSatisfechas = rows.filter(r => r.satisfied.length > 0).length;
    const conIncoherencia = rows.filter(r => r.incoherent.length > 0).length;
    const conContradiccion = rows.filter(r => r.contradictions.length > 0).length;
    console.log(`\n╔══ MENI QUALITY AUDIT — corpus ${tot} noticias reales ══╗`);
    console.log(`║ DUPLICATE_REC:        ${conDupes}/${tot} notas`);
    console.log(`║ ALREADY_SATISFIED:    ${conSatisfechas}/${tot} notas`);
    console.log(`║ PROFILE_INCOHERENCE:  ${conIncoherencia}/${tot} notas`);
    console.log(`║ MODULE_CONTRADICTION: ${conContradiccion}/${tot} notas`);
    console.log(`╚══ Total recs: ${rows.reduce((a, r) => a + r.recs, 0)} | VE warnings: ${rows.reduce((a, r) => a + r.warnings, 0)} ══╝`);
    for (const r of rows.filter(r => r.dupCount || r.satisfied.length || r.incoherent.length || r.contradictions.length)) {
      console.log('  ⚠', r.slug, JSON.stringify({ dup: r.dupCount, satis: r.satisfied, incoh: r.incoherent, contrad: r.contradictions }));
    }
    expect(tot).toBeGreaterThanOrEqual(30);
  });

  it('0 recomendaciones duplicadas tras la capa de satisfacción', () => {
    expect(rows.filter(r => r.dupCount > 0)).toEqual([]);
  });

  it('0 recomendaciones ya satisfechas (título/cita vigente)', () => {
    expect(rows.filter(r => r.satisfied.length > 0)).toEqual([]);
  });

  it('0 recomendaciones con perfil incoherente', () => {
    expect(rows.filter(r => r.incoherent.length > 0)).toEqual([]);
  });

  it('0 contradicciones MENI↔extracción en conceptos compartidos', () => {
    expect(rows.filter(r => r.contradictions.length > 0)).toEqual([]);
  });
});

describe('Casos reales documentados — falsos negativos resueltos', () => {
  it('contexto regional: "interés para Centroamérica, incluida Nicaragua… dinámicas regionales" => evidencia', () => {
    const base = 'Según datos oficiales del Ministerio de Seguridad Pública de Costa Rica, el país registra 623 homicidios en el año. La evolución de los homicidios en Costa Rica también constituye un dato de interés para Centroamérica, incluida Nicaragua, debido a la cercanía geográfica y a las dinámicas regionales relacionadas con seguridad y crimen organizado. No obstante, las cifras presentadas corresponden exclusivamente a Costa Rica y no permiten establecer por sí mismas un impacto directo sobre Nicaragua.';
    let extra = ''; const relleno = 'El informe detalla además la distribución de casos por provincia y las acciones de la policía judicial durante el periodo analizado.';
    while (extra.split(/\s+/).length < 650) extra += ' ' + relleno;
    const r = evaluate({
      titulo: 'Costa Rica registra 623 homicidios y 64,4 % son jóvenes',
      contenido: `<p>${base}${extra}</p>`,
      resumen: 'Costa Rica registra 623 homicidios este año.',
      categoria: 'Internacionales',
      autor: 'Editorial', fecha: '2026-10-02T10:00:00Z', slug: 'costa-rica-homicidios',
      palabrasClave: ['Costa Rica'], imagenDestacada: 'https://x.com/i.jpg',
    } as any);
    expect(r.valorEditorial.warnings.join(' ')).not.toContain('impacto regional o para Nicaragua');
  });

  it('título eco: propuesta idéntica al vigente no se emite (normalización)', () => {
    const t = 'Costa Rica registra 623 homicidios y 64,4 % son jóvenes';
    expect(isAlreadySatisfied(t, { titulo: t, textoPlano: 'x' })).toBe(true);
    // variantes triviales: puntuación, separador decimal, mayúsculas, orden de palabras
    expect(isAlreadySatisfied('Costa Rica registra 623 homicidios y 64.4% son jóvenes', { titulo: t, textoPlano: 'x' })).toBe(true);
    expect(isAlreadySatisfied('COSTA RICA REGISTRA 623 HOMICIDIOS Y SON 64,4% JÓVENES!', { titulo: t, textoPlano: 'x' })).toBe(true);
    // una parafrasis real NO es el mismo título (sería una propuesta distinta)
    expect(isAlreadySatisfied('Costa Rica: 623 homicidios, la mayoría jóvenes', { titulo: t, textoPlano: 'x' })).toBe(false);
    // Propuesta distinta NO se descarta
    expect(isAlreadySatisfied('Cambiar el título por "Ola criminal sacude Costa Rica en 2026"', { titulo: t, textoPlano: 'x' })).toBe(false);
  });

  it('supervisor: título específico internacional NO pide "más específico" (eco roto)', () => {
    // El caso real: lugar (Costa Rica) + sujeto/dato (623 homicidios, 64,4 %) ya
    // identifican los elementos periodísticos — el evaluador no debe marcar 3 faltantes.
    const ev = evaluateRawTitle('Costa Rica registra 623 homicidios y 64,4 % son jóvenes');
    expect(ev.needsInvestigation).toBe(false);
    expect(ev.missingData).not.toContain('lugar donde ocurrió');
    expect(ev.verdict).not.toBe('INVESTIGAR_MAS');
  });

  it('supervisor: makeEditorialDecision no emite el issue "más específico" para ese título', () => {
    const d = makeEditorialDecision({
      titulo: 'Costa Rica registra 623 homicidios y 64,4 % son jóvenes',
      contenido: '<p>' + 'Costa Rica registra 623 homicidios según el Ministerio de Seguridad Pública. '.repeat(30) + '</p>',
      categoria: 'Internacionales',
      aprobadoMeni: true,
      scoreMeni: 90,
    } as any);
    const issues = (d.issues || []).map((i: any) => i.problem).join(' ');
    expect(issues).not.toContain('más específico');
  });

  it('supervisor: el estándar sigue — título genérico real SÍ pide investigar', () => {
    const ev = evaluateRawTitle('Hallan cuerpo en zona rural');
    expect(ev.needsInvestigation).toBe(true);
    expect(ev.missingData.length).toBeGreaterThanOrEqual(3);
  });

  it('dedupe: recomendaciones equivalentes no se repiten', () => {
    const list = ['Incluir cifras según el perfil de Nacionales', 'Incluir cifras según el perfil de Nacionales', '  Incluir cifras según el perfil de Nacionales. '];
    expect(dedupeRecommendations(list)).toHaveLength(1);
  });
});
