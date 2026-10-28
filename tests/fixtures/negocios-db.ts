/** Doble local de Firestore; no simula índices, reintentos ni contención real. */
type Doc = Record<string, unknown>;
type Filter = [string, string, unknown];
export function createFakeDb() {
  const store = new Map<string, Map<string, Doc>>();
  const col = (name: string) => {
    if (!store.has(name)) store.set(name, new Map());
    return store.get(name)!;
  };
  let autoId = 0;
  const mergeDeep = (base: Doc, patch: Doc): Doc => {
    const out = { ...base };
    for (const [k, v] of Object.entries(patch)) {
      out[k] = v && typeof v === 'object' && '__inc' in v
        ? Number(out[k] || 0) + Number(v.__inc)
        : v && typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v)
          ? mergeDeep((out[k] as Doc) ?? {}, v as Doc) : v;
    }
    return out;
  };
  const docRef = (name: string, id = `auto-${++autoId}`): any => ({
    id,
    get: async () => ({ id, ref: docRef(name, id), exists: col(name).has(id), data: () => col(name).get(id) }),
    set: async (data: Doc, opts?: { merge?: boolean }) => {
      col(name).set(id, mergeDeep(opts?.merge ? col(name).get(id) ?? {} : {}, data));
    },
  });
  const query = (name: string, filters: Filter[] = [], lim = 0, sel?: string[], order?: [string, string]): any => ({
    where: (f: string, op: string, v: unknown) => query(name, [...filters, [f, op, v]], lim, sel, order),
    limit: (n: number) => query(name, filters, n, sel, order),
    select: (...f: string[]) => query(name, filters, lim, f, order),
    orderBy: (f: string, direction = 'asc') => query(name, filters, lim, sel, [f, direction]),
    get: async () => {
      let entries = [...col(name)].filter(([, d]) => filters.every(([f, op, v]) => {
        const value = d[f] as any;
        if (op === 'in') return (v as unknown[]).includes(value);
        if (op === '==') return value === v;
        if (op === '>') return value > (v as any);
        if (op === '>=') return value >= (v as any);
        if (op === '<') return value < (v as any);
        if (op === '<=') return value <= (v as any);
        throw new Error(`Operador no implementado en fixture: ${op}`);
      }));
      if (order) {
        const [field, direction] = order;
        entries = entries.filter(([, d]) => d[field] !== undefined);
        entries.sort(([, a], [, b]) =>
          (a[field] === b[field] ? 0 : (a[field] as any) < (b[field] as any) ? -1 : 1) *
          (direction === 'desc' ? -1 : 1));
      }
      if (lim) entries = entries.slice(0, lim);
      return { empty: entries.length === 0, size: entries.length, docs: entries.map(([id, data]) => ({
        id, exists: true, ref: docRef(name, id),
        data: () => sel ? Object.fromEntries(sel.map(k => [k, data[k]])) : data,
      })) };
    },
  });
  // Serialización de transacciones locales; no sustituye una prueba con emulator.
  let queue = Promise.resolve();
  return {
    collection: (name: string): any => ({
      ...query(name), doc: (id?: string) => docRef(name, id),
      add: async (data: Doc) => { const ref = docRef(name); await ref.set(data); return ref; },
    }),
    runTransaction: async (fn: (tx: any) => Promise<unknown>) => {
      const run = queue.then(async () => {
        const writes: (() => Promise<void>)[] = [];
        const result = await fn({
          get: (ref: any) => {
            if (writes.length) throw new Error('Lectura después de escritura en transacción');
            return ref.get();
          },
          set: (ref: any, data: Doc, opts?: unknown) => { writes.push(() => ref.set(data, opts)); },
        });
        for (const write of writes) await write();
        return result;
      });
      queue = run.then(() => undefined, () => undefined);
      return run;
    },
    _store: store,
  };
}
