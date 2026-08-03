import { logger } from './logger';

export interface CorreccionPublica {
  id: string;
  fecha: string;
  articulo: {
    id: string;
    titulo: string;
    slug: string;
  } | null;
  campo: string;
  cambio: string;
  motivo: string;
}

const REASONS: Record<string, string> = {
  acortar: 'Se redujo contenido redundante para mayor claridad.',
  ampliar: 'Se amplió la información para mejor contexto.',
  agregar_contexto: 'Se añadió contexto histórico o antecedentes.',
  eliminar_relleno: 'Se eliminaron frases de relleno o sensacionalistas.',
  agregar_servicio: 'Se añadió información de utilidad para el lector.',
  reordenar: 'Se reorganizó el contenido para mejor comprensión.',
  otro: 'Ajuste editorial menor por precisión o estilo.',
};

function formatCampo(campo: string): string {
  const map: Record<string, string> = {
    titulo: 'Título',
    entrada: 'Entrada',
    contexto: 'Contexto',
    servicio: 'Servicio al lector',
    orden: 'Orden del contenido',
    cuerpo: 'Cuerpo del artículo',
    frases: 'Frases y redacción',
  };
  return map[campo] || campo;
}

/**
 * Carga las correcciones editoriales públicas desde Firestore.
 * Une cada corrección con el título y slug de la noticia original.
 */
export async function getPublicCorrections(limit = 50): Promise<CorreccionPublica[]> {
  try {
    const { adminDb } = await import('./firebase-admin');
    const snap = await adminDb
      .collection('editor_corrections')
      .orderBy('fecha', 'desc')
      .limit(limit)
      .get();

    if (snap.empty) return [];

    const noticiaIds = new Set<string>();
    const records = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      noticiaIds.add(String(data.articleId));
      return { id: d.id, data };
    });

    // Cargar noticias relacionadas por ID
    const noticiasMap = new Map<string, { titulo: string; slug: string }>();
    if (noticiaIds.size > 0) {
      const noticiasSnap = await adminDb
        .collection('noticias')
        .where('__name__', 'in', Array.from(noticiaIds).slice(0, 10))
        .select('titulo', 'slug')
        .get();
      for (const doc of noticiasSnap.docs) {
        const n = doc.data() as { titulo?: string; slug?: string };
        noticiasMap.set(doc.id, {
          titulo: n.titulo || 'Artículo sin título',
          slug: n.slug || doc.id,
        });
      }
    }

    return records.map(({ id, data }) => {
      const articleId = String(data.articleId || '');
      const noticia = noticiasMap.get(articleId) || null;
      const tipo = String(data.diferenciaTipo || 'otro') as keyof typeof REASONS;
      return {
        id,
        fecha: String(data.fecha || new Date().toISOString()),
        articulo: noticia ? { id: articleId, titulo: noticia.titulo, slug: noticia.slug } : null,
        campo: formatCampo(String(data.campo || 'otro')),
        cambio: `Ajuste editorial en ${formatCampo(String(data.campo || 'otro'))}`,
        motivo: REASONS[tipo] || REASONS.otro,
      };
    });
  } catch (err) {
    logger.error('[correcciones] Error cargando correcciones:', err instanceof Error ? err.message : String(err));
    return [];
  }
}
