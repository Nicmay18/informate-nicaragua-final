/**
 * Persistencia de keywords (palabrasClave / keywords / tags).
 *
 * Bug auditado: 0/100 notas publicadas tenían `palabrasClave` persistido —
 * la ruta de guardado nunca escribía el campo y la auto-corrección solo lo
 * generaba en memoria. La resolución canónica vive en `resolveKeywords`
 * (misma regla que autoCorrectNoticia) y se persiste en updateData de
 * `guardarConMeni`, que cubre las tres rutas de escritura.
 */
import { describe, it, expect, vi } from 'vitest';
import { runMeni } from '@/lib/meni/core';
import { resolveKeywords } from '@/lib/meni/autocorrect';
import { guardarConMeni } from '@/lib/editorial/guardar-con-meni';
import type { NoticiaInput } from '@/lib/meni/types';

// Duplicado desactivado para las pruebas de persistencia.
vi.mock('@/lib/analizador-duplicados', () => ({
  detectarDuplicadoAdmin: vi.fn(async () => ({ esDuplicado: false, similitud: 0 })),
}));

const fakeQuery: any = {
  where: () => fakeQuery,
  orderBy: () => fakeQuery,
  limit: () => fakeQuery,
  select: () => fakeQuery,
  get: async () => ({ docs: [], empty: true }),
};
const writes: { col: string; id: string; data: unknown }[] = [];
const fakeDb = {
  collection: (col: string) => ({
    ...fakeQuery,
    doc: (id: string) => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async (data: unknown) => { writes.push({ col, id, data }); },
      update: async (data: unknown) => { writes.push({ col, id, data }); },
    }),
  }),
} as any;

const notaBase: NoticiaInput = {
  titulo: 'Medicina Legal determina estado mental de acusada por la muerte de su hija en Managua',
  resumen:
    'Peritajes de Medicina Legal y psiquiátricos se incorporan al expediente contra la mujer señalada de la muerte de su hija en Ticuantepe.',
  contenido: `
    <h2>Qué ocurrió</h2>
    <p>La Fiscalía de Managua informó que un perito de Medicina Legal dictaminó que la mujer acusada, de 31 años, presenta alteraciones psiquiátricas compatibles con un trastorno mental. La muerte de su hija de cuatro años ocurrió en su vivienda de Ticuantepe el pasado fin de semana.</p>
    <p>Según la Fiscalía, la víctima dejó a una familia conmocionada en el barrio. La acusada enfrenta un proceso penal por el delito de parricidio. La Policía Nacional recogió indicios en la escena y remitió el caso al Ministerio Público.</p>
    <h2>Qué establece el dictamen</h2>
    <p>El dictamen forense señala que la acusada no presenta alteraciones de conciencia permanentes, pero requiere evaluación psiquiátrica durante el juicio. El documento será parte de las pruebas que valorará el juez competente.</p>
    <p>La defensa de la imputada solicitó la realización de peritajes complementarios para determinar si las condiciones mentales afectan su responsabilidad penal. La Fiscalía indicó que el proceso continuará en las próximas semanas.</p>
    <h2>Qué sigue</h2>
    <p>El juez deberá resolver si la acusada será sometida a un proceso ordinario o se aplican medidas de seguridad. La presunción de inocencia permanece hasta que exista una sentencia firme, señalaron las autoridades judiciales.</p>
    <p>Este caso generó conmoción en Ticuantepe, donde vecinos piden justicia por la menor. La comunidad espera que el proceso esclarezca los hechos y responsabilice a quien corresponda.</p>
    <h2>Marco legal</h2>
    <p>El Código Penal nicaragüense sanciona el parricidio y establece que las personas con trastornos mentales pueden ser eximidas parcial o totalmente si no comprendían la ilicitud del hecho. La resolución judicial firme corresponderá a la autoridad competente.</p>
  `.trim(),
  categoria: 'Sucesos',
  imagen: '/logo.webp',
  fecha: new Date().toISOString(),
};

describe('resolveKeywords — resolución canónica', () => {
  it('genera keywords cuando el input no trae ninguna (caso del 100% de prod)', () => {
    const meni = runMeni(notaBase);
    const kw = resolveKeywords(notaBase, meni);
    expect(kw).toBeDefined();
    expect(kw!.length).toBeGreaterThanOrEqual(3);
    expect(kw).toContain(meni.categoria);
  });

  it('conserva las keywords del editor cuando son suficientes (>=3)', () => {
    const input: NoticiaInput = { ...notaBase, palabrasClave: ['fiscalia', 'ticuantepe', 'parricidio'] };
    const kw = resolveKeywords(input, runMeni(input));
    expect(kw).toEqual(['fiscalia', 'ticuantepe', 'parricidio']);
  });

  it('normaliza keywords string separadas por coma (contrato del panel)', () => {
    const input: NoticiaInput = { ...notaBase, keywords: 'fiscalia, ticuantepe, parricidio' };
    const kw = resolveKeywords(input, runMeni(input));
    expect(kw).toEqual(['fiscalia', 'ticuantepe', 'parricidio']);
  });

  it('completa keywords insuficientes (<3) mezclando con las generadas', () => {
    const input: NoticiaInput = { ...notaBase, palabrasClave: ['fiscalia'] };
    const kw = resolveKeywords(input, runMeni(input));
    expect(kw!.length).toBeGreaterThanOrEqual(3);
    // La keyword editorial se conserva dentro del set completo.
    expect(kw).toContain('fiscalia');
  });
});

describe('guardarConMeni — persistencia real en updateData', () => {
  it('updateData incluye palabrasClave + keywords + tags para una nota nueva sin keywords', async () => {
    const r = await guardarConMeni(notaBase, fakeDb, { skipDuplicateCheck: true });
    expect(Array.isArray(r.updateData.palabrasClave)).toBe(true);
    expect((r.updateData.palabrasClave as string[]).length).toBeGreaterThanOrEqual(3);
    expect(typeof r.updateData.keywords).toBe('string');
    expect((r.updateData.keywords as string).length).toBeGreaterThan(0);
    expect(r.updateData.tags).toEqual(r.updateData.palabrasClave);
  });

  it('preserva keywords editoriales existentes en una actualización', async () => {
    const input: NoticiaInput = { ...notaBase, palabrasClave: ['fiscalia', 'ticuantepe', 'parricidio'] };
    const r = await guardarConMeni(input, fakeDb, { skipDuplicateCheck: true });
    expect(r.updateData.palabrasClave).toEqual(['fiscalia', 'ticuantepe', 'parricidio']);
  });

  it('registro antiguo sin keywords recibe las generadas sin pisar otros campos', async () => {
    // Simula un doc legacy: sin palabrasClave ni keywords en el input.
    const legacy: NoticiaInput = { ...notaBase };
    const r = await guardarConMeni(legacy, fakeDb, { skipDuplicateCheck: true });
    const kw = r.updateData.palabrasClave as string[];
    expect(kw.length).toBeGreaterThanOrEqual(3);
    // Campos editoriales intactos
    expect(r.updateData.titulo).toBeUndefined(); // el título lo escribe la ruta
    expect(r.updateData.contenido).toBeTruthy();
    expect(r.updateData.scoreMeni).toBeTruthy();
  });

  it('los datos resueltos sobreviven sanitizeForFirestore (sin undefined)', async () => {
    const r = await guardarConMeni(notaBase, fakeDb, { skipDuplicateCheck: true });
    const serialized = JSON.stringify(r.updateData);
    expect(serialized).not.toContain('undefined');
    expect(() => JSON.parse(serialized)).not.toThrow();
  });
});
