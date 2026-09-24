import { describe, it, expect } from 'vitest';
import { loadEntityPage } from '@/lib/meni/knowledge-base/entity-page';
import type { Firestore, DocumentSnapshot } from 'firebase-admin/firestore';

/** Mock mínimo de Firestore para loadEntityPage. */
function mockDb(opts: { entity?: unknown; relations?: unknown[]; timeline?: unknown[] }) {
  const coll = (name: string) => ({
    where: () => ({
      limit: () => ({
        get: async () => ({
          empty: !opts.entity,
          docs: opts.entity ? [{ data: () => opts.entity }] : [],
        }),
      }),
      get: async () => ({
        docs: (name === 'kb_relations' ? opts.relations : opts.timeline)?.map((d) => ({ data: () => d })) ?? [],
      }),
    }),
    orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }), offset: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }) }),
    doc: (id: string) => ({ id, path: `${name}/${id}` }),
    count: () => ({ get: async () => ({ data: () => ({ count: 0 }) }) }),
  });
  const db = {
    collection: coll,
    getAll: vi.fn(async (...refs: { path: string }[]) => refs.map(() => ({ exists: false }) as unknown as DocumentSnapshot)),
  } as unknown as Firestore;
  return db;
}

import { vi } from 'vitest';

const ENT = { id: 'e1', name: 'Daniel Ortega', slug: 'daniel-ortega', type: 'persona', articleCount: 5 };

describe('entity-page — getAll con 0 relacionados', () => {
  it('entidad sin relaciones → no llama getAll, devuelve []', async () => {
    const db = mockDb({ entity: ENT, relations: [], timeline: [] });
    const data = await loadEntityPage(db, 'daniel-ortega');
    expect(data).not.toBeNull();
    expect(data!.relatedEntities).toEqual([]);
    expect((db as { getAll: unknown }).getAll).not.toHaveBeenCalled();
  });

  it('entidad con 1 relación → llama getAll una vez', async () => {
    const db = mockDb({
      entity: ENT,
      relations: [{ sourceId: 'e1', targetId: 'e2', type: 'relacionado_con', strength: 0.8 }],
      timeline: [],
    });
    const data = await loadEntityPage(db, 'daniel-ortega');
    expect((db as { getAll: unknown }).getAll).toHaveBeenCalledTimes(1);
    expect(data!.relatedEntities).toEqual([]); // doc no existe en mock
  });

  it('entidad inexistente → null', async () => {
    const db = mockDb({ entity: undefined });
    const data = await loadEntityPage(db, 'no-existe');
    expect(data).toBeNull();
  });
});
