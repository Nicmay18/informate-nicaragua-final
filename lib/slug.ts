/**
 * Genera un slug URL-friendly a partir de un título.
 * Reglas:
 * - Minúsculas
 * - Sin tildes (normalización NFD)
 * - Solo a-z, 0-9, guiones
 * - Espacios → guiones
 * - Máximo 100 caracteres
 * - Sin guiones al inicio/final
 * - Colapsa guiones múltiples
 */
export function generateSlug(titulo: string): string {
  if (!titulo || typeof titulo !== 'string') {
    return 'sin-titulo';
  }

  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')           // quitar tildes
    .replace(/[^a-z0-9\s-]/g, '')              // quitar caracteres especiales
    .replace(/\s+/g, '-')                       // espacios → guiones
    .replace(/-+/g, '-')                        // colapsar guiones múltiples
    .replace(/^-+|-+$/g, '')                    // quitar guiones al inicio/final
    .substring(0, 100);
}

/**
 * Genera un slug único asegurándose de que no exista ya en la base.
 * Si existe, agrega un contador al final.
 */
export async function ensureUniqueSlug(
  titulo: string,
  existsCheck: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = generateSlug(titulo);
  let slug = baseSlug;
  let counter = 1;

  while (await existsCheck(slug)) {
    const suffix = `-${counter}`;
    slug = baseSlug.substring(0, 100 - suffix.length) + suffix;
    counter++;
    if (counter > 999) {
      // fallback extremo: timestamp
      slug = `${baseSlug.substring(0, 85)}-${Date.now()}`;
      break;
    }
  }

  return slug;
}

/**
 * Claim atómico de slug.
 *
 * Las comprobaciones check-then-create (`where slug == X` fuera de
 * transacción) dejan una ventana en la que dos POSTs concurrentes con el
 * mismo título crean slugs duplicados. Las transacciones de Firestore solo
 * detectan conflicto sobre el MISMO documento, así que la primitiva correcta
 * es un doc-claim por slug: `tx.create()` falla si el doc ya existe y el
 * retry ve el claim tomado.
 *
 * La colección `slug_claims` actúa como registry durable. Un claim huérfano
 * (publicación que falla después del claim) solo reserva el slug — costo
 * aceptable vs duplicados.
 */
type TxDb = {
  collection: (name: string) => FirebaseFirestore.CollectionReference;
  runTransaction: <T>(fn: (tx: FirebaseFirestore.Transaction) => Promise<T>) => Promise<T>;
};

type TxLike = {
  get: FirebaseFirestore.Transaction['get'];
  create: FirebaseFirestore.Transaction['create'];
};

/**
 * Variante para usar DENTRO de la transacción que crea el artículo —
 * claim y create quedan en el mismo commit (sin ventana entre ambos).
 * true = claim ganado; false = slug ya tomado (por claim o por artículo real).
 */
export async function claimSlugInTx(tx: TxLike, db: Pick<TxDb, 'collection'>, slug: string): Promise<boolean> {
  const claimRef = db.collection('slug_claims').doc(slug);
  const [claimSnap, existing] = await Promise.all([
    tx.get(claimRef),
    tx.get(db.collection('noticias').where('slug', '==', slug).limit(1)),
  ]);
  if (claimSnap.exists || !existing.empty) return false;
  tx.create(claimRef, { slug, claimedAt: new Date().toISOString() });
  return true;
}

/** Igual que ensureUniqueSlug pero atómica, para usar dentro de una tx. */
export async function claimUniqueSlugInTx(
  tx: TxLike,
  db: Pick<TxDb, 'collection'>,
  titulo: string,
): Promise<string> {
  const baseSlug = generateSlug(titulo);
  for (let counter = 0; counter <= 999; counter++) {
    const suffix = counter === 0 ? '' : `-${counter}`;
    const slug = counter === 0 ? baseSlug : baseSlug.substring(0, 100 - suffix.length) + suffix;
    if (await claimSlugInTx(tx, db, slug)) return slug;
  }
  const fallback = `${baseSlug.substring(0, 85)}-${Date.now()}`;
  tx.create(db.collection('slug_claims').doc(fallback), { slug: fallback, claimedAt: new Date().toISOString() });
  return fallback;
}

/** true = claim ganado; false = slug ya tomado (por claim o por artículo real). */
export async function claimSlug(db: TxDb, slug: string): Promise<boolean> {
  return db.runTransaction((tx) => claimSlugInTx(tx, db, slug));
}

/**
 * Variante atómica de ensureUniqueSlug: reserva el primer candidato libre
 * dentro de la transacción (-1, -2…) con las mismas reglas de truncado.
 */
export async function claimUniqueSlug(db: TxDb, titulo: string): Promise<string> {
  return db.runTransaction((tx) => claimUniqueSlugInTx(tx, db, titulo));
}

/**
 * Compara un slug de params contra el slug generado desde el título.
 */
export function slugMatches(title: string, slugParam: string): boolean {
  return generateSlug(title) === slugParam;
}

/**
 * Valida si un slug tiene formato correcto.
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  return /^[a-z0-9-]+$/.test(slug) && slug.length <= 100 && slug.length > 0;
}
