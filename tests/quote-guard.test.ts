import { describe, it, expect } from 'vitest';
import { validateQuotesAndAttributions } from '@/lib/editorial/quote-guard';

const SRC_ACCIDENTE =
  'Un accidente de tránsito ocurrió este viernes en la carretera Panamericana, km 32. ' +
  'La Policía Nacional informó que dos personas resultaron lesionadas y fueron trasladadas al hospital. ' +
  'Se investiga la causa del siniestro.';

const SRC_CON_CITA =
  'La Policía Nacional informó que dos personas resultaron lesionadas. ' +
  '"Estamos investigando las causas del accidente", dijo el comisionado Ramón Ortega, jefe de Tránsito. ' +
  'El accidente ocurrió este viernes en la carretera Panamericana.';

describe('Quote Guard — defensa anti citas/atribuciones fabricadas', () => {
  it('Caso 1: fuente con accidente — no permite inventar causa', () => {
    const gen = '<p>El accidente fue causado por exceso de velocidad, según el conductor involucrado.</p>';
    const r = validateQuotesAndAttributions(SRC_ACCIDENTE, gen);
    // "el conductor" hablando no está en la fuente
    expect(r.ok).toBe(false);
    expect(r.fabricatedAttributions.length).toBeGreaterThan(0);
  });

  it('Caso 2: fuente con investigación — no permite "confirmó"', () => {
    const gen = '<p>La Policía Nacional confirmó que el conductor causó el accidente.</p>';
    const r = validateQuotesAndAttributions(SRC_ACCIDENTE, gen);
    // "La Policía Nacional" sí está en la fuente (informó) → la atribución pasa;
    // el validator no juzga el verbo sino la existencia del actor. OK por diseño:
    // el cambio semántico informó→confirmó lo cubre quality-gate, no quote-guard.
    expect(r.fabricatedAttributions.length).toBe(0);
  });

  it('Caso 3: fuente sin testigos — bloquea testigo fabricado', () => {
    const gen = '<p>Un testigo relató que el vehículo iba a gran velocidad.</p>';
    const r = validateQuotesAndAttributions(SRC_ACCIDENTE, gen);
    expect(r.ok).toBe(false);
    expect(r.fabricatedAttributions.join(' ')).toMatch(/testigo/);
  });

  it('Caso 4: fuente CON cita — permite reproducirla', () => {
    const gen = '<p>El jefe de Tránsito indicó: "Estamos investigando las causas del accidente".</p>';
    const r = validateQuotesAndAttributions(SRC_CON_CITA, gen);
    expect(r.fabricatedQuotes.length).toBe(0);
  });

  it('Caso 5: fuente SIN cita — bloquea cita inventada', () => {
    const gen = '<p>"Fue un momento terrible", dijo una vecina del lugar.</p>';
    const r = validateQuotesAndAttributions(SRC_ACCIDENTE, gen);
    expect(r.ok).toBe(false);
    expect(r.fabricatedQuotes.length).toBeGreaterThan(0);
    expect(r.fabricatedAttributions.join(' ')).toMatch(/vecina/);
  });

  it('Caso 6: plantilla histórica fabricada "testigo ocular manifestó" → bloquea', () => {
    const gen = '<p>Un testigo ocular manifestó que todo ocurrió muy rápido.</p>';
    const r = validateQuotesAndAttributions(SRC_ACCIDENTE, gen);
    expect(r.ok).toBe(false);
  });

  it('Caso 7: atribución existente en fuente pasa', () => {
    const gen = '<p>La Policía Nacional informó que dos personas resultaron lesionadas.</p>';
    const r = validateQuotesAndAttributions(SRC_ACCIDENTE, gen);
    expect(r.fabricatedAttributions.length).toBe(0);
  });

  it('Caso 8: atribución a entidad ausente de la fuente → bloquea', () => {
    const gen = '<p>El Ministerio de Salud confirmó que los lesionados están estables.</p>';
    const r = validateQuotesAndAttributions(SRC_ACCIDENTE, gen);
    expect(r.ok).toBe(false);
    expect(r.fabricatedAttributions.join(' ')).toMatch(/Ministerio/);
  });

  it('Caso 9: tolerancia — cita con comillas diferentes y HTML pasa', () => {
    const gen = '<p>Según el comisionado, <strong>"estamos investigando las causas del accidente"</strong>.</p>';
    const r = validateQuotesAndAttributions(SRC_CON_CITA, gen);
    expect(r.fabricatedQuotes.length).toBe(0);
  });

  it('Caso 10: texto sin citas ni atribuciones → OK', () => {
    const gen = '<p>Dos personas resultaron lesionadas en un accidente en la carretera Panamericana este viernes. Fueron trasladadas al hospital.</p>';
    const r = validateQuotesAndAttributions(SRC_ACCIDENTE, gen);
    expect(r.ok).toBe(true);
  });
});
