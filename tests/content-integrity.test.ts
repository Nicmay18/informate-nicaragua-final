/**
 * Barrera de integridad de contenido (CONTENIDO_VACIO).
 *
 * Caso real: 2 notas llegaron a producción con `contenido` vacío ('' y
 * '   </p>') porque las rutas solo exigen un string truthy. La barrera en
 * guardarConMeni fuerza aprobado=false + blockingIssue para que NINGUNA
 * ruta de escritura pueda persistir una nota "publicable" sin cuerpo.
 */
import { describe, it, expect, vi } from 'vitest';
import { guardarConMeni } from '@/lib/editorial/guardar-con-meni';
import type { NoticiaInput } from '@/lib/meni/types';

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
const fakeDb = {
  collection: () => ({
    ...fakeQuery,
    doc: () => ({ get: async () => ({ exists: false, data: () => null }), set: async () => {}, update: async () => {} }),
  }),
} as any;

const notaBase: NoticiaInput = {
  titulo: 'Titular de prueba con longitud suficiente para evaluación',
  resumen: 'Resumen de prueba para la barrera de integridad de contenido.',
  contenido: '   </p>',
  categoria: 'Nacionales',
  fecha: new Date().toISOString(),
};

describe('guardarConMeni — barrera CONTENIDO_VACIO', () => {
  it('rechaza contenido que solo contiene markup vacío ("   </p>")', async () => {
    const r = await guardarConMeni({ ...notaBase }, fakeDb, { skipDuplicateCheck: true });
    expect(r.ok).toBe(false);
    expect(r.meni.aprobado).toBe(false);
    expect(r.meni.blockingIssues?.[0]?.code).toBe('CONTENIDO_VACIO');
  });

  it('rechaza contenido string vacío', async () => {
    const r = await guardarConMeni({ ...notaBase, contenido: '' }, fakeDb, { skipDuplicateCheck: true });
    expect(r.ok).toBe(false);
    expect(r.meni.blockingIssues?.some((i) => i.code === 'CONTENIDO_VACIO')).toBe(true);
  });

  it('acepta contenido con texto real aunque sea breve', async () => {
    const contenido =
      '<p>La Alcaldía de Managua informó que las obras de bacheo en la carretera sur avanzan según cronograma y beneficiarán a miles de conductores.</p>';
    const r = await guardarConMeni({ ...notaBase, contenido }, fakeDb, { skipDuplicateCheck: true });
    expect(r.meni.blockingIssues?.some((i) => i.code === 'CONTENIDO_VACIO')).toBe(false);
  });
});
