import { getAdminDb } from '@/lib/firebase-admin';
import { getNews, getNewsBySlug } from '@/lib/data';
import { analyzeForPublication } from './ceo-agent';

export interface CEOWorkflowResult {
  stored: boolean;
  action?: string;
  error?: string;
}

/**
 * Ejecuta el CEO Agent automáticamente cuando se crea o publica un artículo.
 * Almacena la decisión editorial en la colección `ceo_decisions` para auditoría.
 */
export async function runCEODecisionForArticle(slug: string): Promise<CEOWorkflowResult> {
  try {
    const [article, articlePool] = await Promise.all([
      getNewsBySlug(slug),
      getNews(50),
    ]);

    if (!article) {
      return { stored: false, error: 'Artículo no disponible para CEO (puede ser borrador)' };
    }

    const analysis = analyzeForPublication(article, { articlePool });

    const db = getAdminDb();
    await db.collection('ceo_decisions').doc(slug).set({
      ...analysis,
      slug,
      headline: article.titulo,
      createdAt: new Date().toISOString(),
      status: 'pending_review',
    });

    return { stored: true, action: analysis.action };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { stored: false, error: msg };
  }
}
