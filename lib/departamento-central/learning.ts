import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

const MEMORY_COLLECTION = 'nios_memory';

export async function recordLearning(input: {
  source: 'departamento-central';
  kind: 'learning' | 'opportunity' | 'correction';
  problem?: string;
  cause?: string;
  solution?: string;
  note: string;
  tags?: string[];
}): Promise<void> {
  const db = getAdminDb();
  const noteHash = await hashString(input.note);

  const existing = await db
    .collection(MEMORY_COLLECTION)
    .where('noteHash', '==', noteHash)
    .get();

  const alreadyExists = existing.docs.some((d) => (d.data() as { kind?: string }).kind === input.kind);
  if (alreadyExists) {
    logger.debug('[departamento-learning] Aprendizaje duplicado, no se guarda:', input.note.slice(0, 60));
    return;
  }

  await db.collection(MEMORY_COLLECTION).add({
    ...input,
    noteHash,
    timestamp: new Date().toISOString(),
    origin: 'departamento-central',
  });

  logger.info('[departamento-learning] Aprendizaje registrado', { kind: input.kind, note: input.note.slice(0, 80) });
}

async function hashString(str: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
}
